'use server';

import { cloudDb } from '@/lib/db';

// ============ AUTO-CREATE CLOUD TABLES ============
async function ensureAdminCloudTables(): Promise<void> {
    try {
        const connection = await cloudDb.getConnection();
        try {
            const createTableQueries = [
                `CREATE TABLE IF NOT EXISTS branches (
                    branch_id INT PRIMARY KEY AUTO_INCREMENT,
                    branch_code VARCHAR(20) UNIQUE,
                    branch_name VARCHAR(100) NOT NULL,
                    region_name VARCHAR(100),
                    address TEXT,
                    is_active TINYINT DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS products_global (
                    product_id BIGINT PRIMARY KEY AUTO_INCREMENT,
                    barcode VARCHAR(50) UNIQUE,
                    name VARCHAR(200) NOT NULL,
                    category VARCHAR(50),
                    price DECIMAL(15,2),
                    tax_rate DECIMAL(5,2) DEFAULT 11.00,
                    is_active TINYINT DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS users_global (
                    user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
                    username VARCHAR(50) UNIQUE,
                    email VARCHAR(100),
                    full_name VARCHAR(100),
                    role VARCHAR(30),
                    branch_id INT,
                    is_active TINYINT DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS consolidated_transactions (
                    global_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    transaction_uuid VARCHAR(36) UNIQUE NOT NULL,
                    branch_id INT NOT NULL,
                    shift_id BIGINT,
                    total_amount DECIMAL(15,2),
                    payment_method VARCHAR(50),
                    trx_date_local DATETIME,
                    subtotal DECIMAL(15,2),
                    total_discount DECIMAL(15,2),
                    tax_amount DECIMAL(15,2),
                    cash_received DECIMAL(15,2),
                    change_returned DECIMAL(15,2),
                    user_id BIGINT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS consolidated_items (
                    item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    transaction_uuid VARCHAR(36),
                    product_id BIGINT,
                    qty INT,
                    final_price DECIMAL(15,2),
                    subtotal DECIMAL(15,2),
                    product_name VARCHAR(200),
                    category VARCHAR(50)
                )`
            ];
            for (const query of createTableQueries) {
                try {
                    await connection.execute(query);
                } catch (e: any) {
                    if (!e.message?.includes('already exists')) console.warn('Table:', e.message);
                }
            }
        } finally {
            connection.release();
        }
    } catch (e) {
        console.error('Cloud table creation error:', e);
    }
}

// ============ STATS ============
export async function getAdminStats() {
    try {
        await ensureAdminCloudTables();

        const [revenueRows]: any = await cloudDb.query(
            'SELECT COALESCE(SUM(total_amount), 0) as total FROM consolidated_transactions'
        );
        const revenue = parseFloat(revenueRows[0]?.total || 0);

        const [trxRows]: any = await cloudDb.query(
            'SELECT COUNT(*) as count FROM consolidated_transactions'
        );
        const transactions = parseInt(trxRows[0]?.count || 0);

        const [branchRows]: any = await cloudDb.query(
            'SELECT COUNT(*) as count FROM branches WHERE is_active = 1'
        );
        const branches = parseInt(branchRows[0]?.count || 0);

        const [prodRows]: any = await cloudDb.query(
            'SELECT COUNT(*) as count FROM products_global'
        );
        const products = parseInt(prodRows[0]?.count || 0);

        return { revenue, transactions, branches, products };
    } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        return { revenue: 0, transactions: 0, branches: 0, products: 0 };
    }
}

// ============ TRANSACTIONS ============
export async function getGlobalTransactions(limit: number = 100) {
    try {
        const [rows]: any = await cloudDb.query(`
            SELECT 
                t.transaction_uuid,
                t.trx_date_local as created_at,
                t.total_amount as grand_total,
                t.payment_method,
                t.branch_id,
                t.user_id,
                b.branch_name
            FROM consolidated_transactions t
            LEFT JOIN branches b ON t.branch_id = b.branch_id
            ORDER BY t.trx_date_local DESC
            LIMIT ?
        `, [limit]);

        return rows.map((r: any) => ({ ...r, synced: true }));
    } catch (error) {
        console.error('Failed to fetch transactions:', error);
        return [];
    }
}

export async function getTransactionDetails(transactionUuid: string) {
    try {
        const [rows]: any = await cloudDb.query(`
            SELECT 
                ti.product_id,
                ti.qty,
                ti.final_price as price_at_sale,
                ti.subtotal,
                COALESCE(ti.product_name, p.name) as product_name,
                ti.category
            FROM consolidated_items ti
            LEFT JOIN products_global p ON ti.product_id = p.product_id
            WHERE ti.transaction_uuid = ?
        `, [transactionUuid]);
        return rows;
    } catch (error: any) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return [];
        }
        console.error('Failed to fetch transaction details:', error);
        return [];
    }
}

// ============ BRANCHES ============
export async function getAllBranches() {
    try {
        const [rows]: any = await cloudDb.query(`
            SELECT * FROM branches ORDER BY branch_id ASC
        `);
        return rows;
    } catch (error) {
        console.error('Failed to fetch branches:', error);
        return [];
    }
}

// ============ PRODUCTS ============
export async function getGlobalProducts() {
    try {
        // Use SELECT * to handle any table schema
        const [rows]: any = await cloudDb.query(`
            SELECT * FROM products_global ORDER BY name ASC
        `);
        // Safely provide defaults for any missing columns
        return rows.map((r: any) => ({
            product_id: r.product_id,
            barcode: r.barcode || '',
            name: r.name || 'Unknown',
            category: r.category || 'UNCATEGORIZED',
            price: parseFloat(r.price || r.base_price || r.selling_price || 0),
            tax_rate: parseFloat(r.tax_rate || 11),
            is_active: r.is_active === 1 || r.is_active === true || r.is_active === undefined
        }));
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return [];
    }
}

// ============ EMPLOYEES ============
export async function getAllEmployees() {
    try {
        const [rows]: any = await cloudDb.query(`
            SELECT 
                e.user_id,
                e.branch_id,
                e.username,
                e.role,
                e.created_at,
                b.branch_name,
                b.branch_code,
                b.region_name
            FROM employees e
            LEFT JOIN branches b ON e.branch_id = b.branch_id
            ORDER BY 
                CASE e.role 
                    WHEN 'CEO' THEN 1
                    WHEN 'DIRECTOR' THEN 2
                    WHEN 'AREA_MANAGER' THEN 3
                    WHEN 'STORE_SUPERVISOR' THEN 4
                    WHEN 'CASHIER' THEN 5
                    ELSE 6
                END,
                e.user_id ASC
        `);
        return rows.map((r: any) => ({
            ...r,
            full_name: formatEmployeeName(r.username),
            is_active: true,
            email: `${r.username}@alfamart.co.id`
        }));
    } catch (error) {
        console.error('Failed to fetch employees:', error);
        return [];
    }
}

function formatEmployeeName(username: string): string {
    if (!username) return 'Unknown';
    // Transform 'ceo_budi' -> 'Budi (CEO)'
    const parts = username.split('_');
    if (parts.length >= 2) {
        const role = parts[0].toUpperCase();
        const name = parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        return name;
    }
    return username.charAt(0).toUpperCase() + username.slice(1);
}

// ============ CHART DATA (7 Days) ============
export async function getSalesChartData() {
    try {
        const [rows]: any = await cloudDb.query(`
            SELECT 
                DATE_FORMAT(trx_date_local, '%Y-%m-%d') as name,
                COALESCE(SUM(total_amount), 0) as total
            FROM consolidated_transactions
            WHERE trx_date_local >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE_FORMAT(trx_date_local, '%Y-%m-%d')
            ORDER BY name ASC
        `);
        return rows.map((r: any) => ({ name: r.name, total: parseFloat(r.total) }));
    } catch (error) {
        console.error('Failed to fetch chart data:', error);
        return [];
    }
}

// ============ LIFETIME MONTHLY SALES (12 Months) ============
export async function getMonthlySalesData() {
    try {
        const [rows]: any = await cloudDb.query(`
            SELECT 
                DATE_FORMAT(trx_date_local, '%Y-%m') as month,
                DATE_FORMAT(trx_date_local, '%b') as month_label,
                YEAR(trx_date_local) as year,
                COALESCE(SUM(total_amount), 0) as total,
                COUNT(*) as trx_count
            FROM consolidated_transactions
            WHERE trx_date_local >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(trx_date_local, '%Y-%m'), DATE_FORMAT(trx_date_local, '%b'), YEAR(trx_date_local)
            ORDER BY month ASC
        `);
        return rows.map((r: any) => ({
            month: r.month,
            month_label: `${r.month_label} ${r.year}`,
            total: parseFloat(r.total || 0),
            trx_count: parseInt(r.trx_count || 0)
        }));
    } catch (error) {
        console.error('Failed to fetch monthly sales data:', error);
        return [];
    }
}

// ============ BRANCH PERFORMANCE ============
export async function getBranchPerformance() {
    try {
        const [rows]: any = await cloudDb.query(`
            SELECT 
                b.branch_name,
                COUNT(t.global_id) as transaction_count,
                COALESCE(SUM(t.total_amount), 0) as total_revenue
            FROM branches b
            LEFT JOIN consolidated_transactions t ON b.branch_id = t.branch_id
            GROUP BY b.branch_id, b.branch_name
            ORDER BY total_revenue DESC
            LIMIT 5
        `);
        return rows.map((r: any) => ({
            branch_name: r.branch_name || 'Unknown',
            transaction_count: parseInt(r.transaction_count || 0),
            total_revenue: parseFloat(r.total_revenue || 0)
        }));
    } catch (error) {
        console.error('Failed to fetch branch performance:', error);
        return [];
    }
}

// ============ LIFETIME STATS SUMMARY ============
export async function getLifetimeStats() {
    try {
        const [rows]: any = await cloudDb.query(`
            SELECT 
                COALESCE(SUM(total_amount), 0) as lifetime_revenue,
                COUNT(*) as lifetime_transactions,
                COALESCE(AVG(total_amount), 0) as avg_transaction,
                MIN(trx_date_local) as first_transaction,
                MAX(trx_date_local) as last_transaction
            FROM consolidated_transactions
        `);
        const stats = rows[0] || {};
        return {
            lifetime_revenue: parseFloat(stats.lifetime_revenue || 0),
            lifetime_transactions: parseInt(stats.lifetime_transactions || 0),
            avg_transaction: parseFloat(stats.avg_transaction || 0),
            first_transaction: stats.first_transaction,
            last_transaction: stats.last_transaction
        };
    } catch (error) {
        console.error('Failed to fetch lifetime stats:', error);
        return {
            lifetime_revenue: 0,
            lifetime_transactions: 0,
            avg_transaction: 0,
            first_transaction: null,
            last_transaction: null
        };
    }
}

// ============ PRODUCT CRUD OPERATIONS ============

export interface ProductData {
    barcode: string;
    name: string;
    category: string;
    price: number;
    tax_rate?: number;
    is_active?: boolean;
}

export async function createProduct(data: ProductData): Promise<{ success: boolean; error?: string; productId?: number }> {
    try {
        const [result]: any = await cloudDb.query(
            `INSERT INTO products_global (barcode, name, category, price, tax_rate, is_active) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [data.barcode, data.name, data.category, data.price, data.tax_rate || 11, data.is_active !== false ? 1 : 0]
        );
        return { success: true, productId: result.insertId };
    } catch (error: any) {
        console.error('Failed to create product:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return { success: false, error: 'Barcode sudah terdaftar' };
        }
        return { success: false, error: error.message || 'Gagal membuat produk' };
    }
}

export async function updateProduct(
    productId: number,
    data: Partial<ProductData>
): Promise<{ success: boolean; error?: string }> {
    try {
        const fields: string[] = [];
        const values: any[] = [];

        if (data.barcode !== undefined) { fields.push('barcode = ?'); values.push(data.barcode); }
        if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
        if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
        if (data.price !== undefined) { fields.push('price = ?'); values.push(data.price); }
        if (data.tax_rate !== undefined) { fields.push('tax_rate = ?'); values.push(data.tax_rate); }
        if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }

        if (fields.length === 0) {
            return { success: false, error: 'Tidak ada data untuk diupdate' };
        }

        values.push(productId);

        await cloudDb.query(
            `UPDATE products_global SET ${fields.join(', ')} WHERE product_id = ?`,
            values
        );

        return { success: true };
    } catch (error: any) {
        console.error('Failed to update product:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return { success: false, error: 'Barcode sudah digunakan produk lain' };
        }
        return { success: false, error: error.message || 'Gagal mengupdate produk' };
    }
}

export async function deleteProduct(productId: number): Promise<{ success: boolean; error?: string }> {
    try {
        // Soft delete - set is_active = 0
        await cloudDb.query(
            `UPDATE products_global SET is_active = 0 WHERE product_id = ?`,
            [productId]
        );
        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete product:', error);
        return { success: false, error: error.message || 'Gagal menghapus produk' };
    }
}

export async function getProductById(productId: number) {
    try {
        const [rows]: any = await cloudDb.query(
            `SELECT * FROM products_global WHERE product_id = ?`,
            [productId]
        );
        return rows[0] || null;
    } catch (error) {
        console.error('Failed to fetch product:', error);
        return null;
    }
}

// ============ BRANCH-FILTERED ANALYTICS ============

export async function getStatsFiltered(branchId?: number) {
    try {
        const branchFilter = branchId ? `WHERE t.branch_id = ${branchId}` : '';
        const branchFilterItems = branchId ? `WHERE ci.transaction_uuid IN (SELECT transaction_uuid FROM consolidated_transactions WHERE branch_id = ${branchId})` : '';

        const [revenueRows]: any = await cloudDb.query(`
            SELECT COALESCE(SUM(total_amount), 0) as total 
            FROM consolidated_transactions t ${branchFilter}
        `);

        const [trxRows]: any = await cloudDb.query(`
            SELECT COUNT(*) as count 
            FROM consolidated_transactions t ${branchFilter}
        `);

        const [avgRows]: any = await cloudDb.query(`
            SELECT COALESCE(AVG(total_amount), 0) as avg_total 
            FROM consolidated_transactions t ${branchFilter}
        `);

        const [prodRows]: any = await cloudDb.query(
            'SELECT COUNT(*) as count FROM products_global'
        );

        return {
            revenue: parseFloat(revenueRows[0]?.total || 0),
            transactions: parseInt(trxRows[0]?.count || 0),
            avg_transaction: parseFloat(avgRows[0]?.avg_total || 0),
            products: parseInt(prodRows[0]?.count || 0)
        };
    } catch (error) {
        console.error('Failed to fetch filtered stats:', error);
        return { revenue: 0, transactions: 0, avg_transaction: 0, products: 0 };
    }
}

export async function getTopProducts(branchId?: number, limit: number = 10) {
    try {
        const branchFilter = branchId ? `AND t.branch_id = ${branchId}` : '';
        const [rows]: any = await cloudDb.query(`
            SELECT 
                ci.product_id,
                COALESCE(p.name, ci.product_name, 'Unknown Product') as product_name,
                p.category,
                SUM(ci.qty) as total_qty,
                SUM(ci.subtotal) as total_revenue,
                COUNT(DISTINCT ci.transaction_uuid) as trx_count
            FROM consolidated_items ci
            LEFT JOIN products_global p ON ci.product_id = p.product_id
            LEFT JOIN consolidated_transactions t ON ci.transaction_uuid = t.transaction_uuid
            WHERE 1=1 ${branchFilter}
            GROUP BY ci.product_id, p.name, ci.product_name, p.category
            ORDER BY total_qty DESC
            LIMIT ?
        `, [limit]);
        return rows;
    } catch (error) {
        console.error('Failed to fetch top products:', error);
        return [];
    }
}

export async function getCategorySales(branchId?: number) {
    try {
        const branchFilter = branchId ? `AND t.branch_id = ${branchId}` : '';
        const [rows]: any = await cloudDb.query(`
            SELECT 
                COALESCE(p.category, ci.category, 'UNCATEGORIZED') as category,
                SUM(ci.qty) as total_qty,
                SUM(ci.subtotal) as total_revenue,
                COUNT(DISTINCT ci.transaction_uuid) as trx_count
            FROM consolidated_items ci
            LEFT JOIN products_global p ON ci.product_id = p.product_id
            LEFT JOIN consolidated_transactions t ON ci.transaction_uuid = t.transaction_uuid
            WHERE 1=1 ${branchFilter}
            GROUP BY COALESCE(p.category, ci.category, 'UNCATEGORIZED')
            ORDER BY total_revenue DESC
        `);
        return rows;
    } catch (error) {
        console.error('Failed to fetch category sales:', error);
        return [];
    }
}

export async function getPaymentMethodStats(branchId?: number) {
    try {
        const branchFilter = branchId ? `WHERE branch_id = ${branchId}` : '';
        const [rows]: any = await cloudDb.query(`
            SELECT 
                payment_method,
                COUNT(*) as trx_count,
                SUM(total_amount) as total_revenue
            FROM consolidated_transactions
            ${branchFilter}
            GROUP BY payment_method
            ORDER BY total_revenue DESC
        `);
        return rows;
    } catch (error) {
        console.error('Failed to fetch payment method stats:', error);
        return [];
    }
}

export async function getHourlySalesPattern(branchId?: number) {
    try {
        const branchFilter = branchId ? `WHERE branch_id = ${branchId}` : '';
        const [rows]: any = await cloudDb.query(`
            SELECT 
                HOUR(trx_date_local) as hour,
                COUNT(*) as trx_count,
                SUM(total_amount) as total_revenue
            FROM consolidated_transactions
            ${branchFilter}
            GROUP BY HOUR(trx_date_local)
            ORDER BY hour ASC
        `);
        return rows;
    } catch (error) {
        console.error('Failed to fetch hourly sales pattern:', error);
        return [];
    }
}

export async function getSalesChartFiltered(branchId?: number) {
    try {
        const branchFilter = branchId ? `AND branch_id = ${branchId}` : '';
        const [rows]: any = await cloudDb.query(`
            SELECT 
                DATE_FORMAT(trx_date_local, '%Y-%m-%d') as name,
                COALESCE(SUM(total_amount), 0) as total,
                COUNT(*) as trx_count
            FROM consolidated_transactions
            WHERE trx_date_local >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            ${branchFilter}
            GROUP BY DATE_FORMAT(trx_date_local, '%Y-%m-%d')
            ORDER BY name ASC
        `);
        return rows.map((r: any) => ({ name: r.name, total: parseFloat(r.total), trx_count: parseInt(r.trx_count) }));
    } catch (error) {
        console.error('Failed to fetch filtered chart data:', error);
        return [];
    }
}

export async function getInventorySummary(branchId?: number) {
    try {
        const [rows]: any = await cloudDb.query(`
            SELECT 
                COALESCE(category, 'UNCATEGORIZED') as category,
                COUNT(*) as product_count
            FROM products_global
            GROUP BY category
            ORDER BY product_count DESC
        `);
        return rows.map((r: any) => ({ ...r, active_count: r.product_count }));
    } catch (error) {
        console.error('Failed to fetch inventory summary:', error);
        return [];
    }
}

// ============ SYSTEM RESOURCES ============

export async function getSystemResources() {
    try {
        // Get server metrics using Node.js os module
        const os = await import('os');

        const cpus = os.cpus();
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const uptime = os.uptime();

        // Calculate CPU usage
        let totalIdle = 0;
        let totalTick = 0;
        cpus.forEach(cpu => {
            for (const type in cpu.times) {
                totalTick += (cpu.times as any)[type];
            }
            totalIdle += cpu.times.idle;
        });
        const cpuUsage = Math.round((1 - totalIdle / totalTick) * 100);

        return {
            cpu: {
                usage: cpuUsage,
                cores: cpus.length,
                model: cpus[0]?.model || 'Unknown'
            },
            memory: {
                total: totalMemory,
                used: usedMemory,
                free: freeMemory,
                usagePercent: Math.round((usedMemory / totalMemory) * 100)
            },
            uptime: formatServerUptime(uptime),
            platform: os.platform(),
            hostname: os.hostname(),
            loadAvg: os.loadavg()
        };
    } catch (error) {
        console.error('Failed to fetch system resources:', error);
        return null;
    }
}

function formatServerUptime(seconds: number): string {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
}

// ============ EXPORT DATA ============

export async function exportDailySalesReport(date?: string) {
    try {
        const targetDate = date || new Date().toISOString().split('T')[0];
        const [rows]: any = await cloudDb.query(`
            SELECT 
                t.transaction_uuid,
                t.branch_id,
                b.branch_name,
                b.branch_code,
                t.total_amount,
                t.payment_method,
                t.trx_date_local,
                t.subtotal,
                t.tax_amount
            FROM consolidated_transactions t
            LEFT JOIN branches b ON t.branch_id = b.branch_id
            WHERE DATE(t.trx_date_local) = ?
            ORDER BY t.trx_date_local DESC
        `, [targetDate]);
        return rows;
    } catch (error) {
        console.error('Failed to export daily sales:', error);
        return [];
    }
}

export async function exportTransactionReport(startDate: string, endDate: string, branchId?: number) {
    try {
        const branchFilter = branchId ? `AND t.branch_id = ${branchId}` : '';
        const [rows]: any = await cloudDb.query(`
            SELECT 
                t.transaction_uuid,
                t.branch_id,
                b.branch_name,
                t.total_amount,
                t.payment_method,
                t.trx_date_local
            FROM consolidated_transactions t
            LEFT JOIN branches b ON t.branch_id = b.branch_id
            WHERE DATE(t.trx_date_local) BETWEEN ? AND ?
            ${branchFilter}
            ORDER BY t.trx_date_local DESC
        `, [startDate, endDate]);
        return rows;
    } catch (error) {
        console.error('Failed to export transactions:', error);
        return [];
    }
}

export async function exportInventoryReport() {
    try {
        const [rows]: any = await cloudDb.query(`
            SELECT 
                product_id,
                barcode,
                name,
                category,
                price,
                tax_rate,
                CASE WHEN is_active = 1 THEN 'Active' ELSE 'Inactive' END as status,
                created_at
            FROM products_global
            ORDER BY category, name
        `);
        return rows;
    } catch (error) {
        console.error('Failed to export inventory:', error);
        return [];
    }
}

export async function exportMonthlyReport(year: number, month: number, branchId?: number) {
    try {
        const branchFilter = branchId ? `AND branch_id = ${branchId}` : '';
        const [rows]: any = await cloudDb.query(`
            SELECT 
                DATE(trx_date_local) as date,
                COUNT(*) as transaction_count,
                SUM(total_amount) as total_revenue,
                AVG(total_amount) as avg_transaction,
                SUM(CASE WHEN payment_method = 'CASH' THEN total_amount ELSE 0 END) as cash_revenue,
                SUM(CASE WHEN payment_method = 'QRIS' THEN total_amount ELSE 0 END) as qris_revenue,
                SUM(CASE WHEN payment_method = 'DEBIT' THEN total_amount ELSE 0 END) as debit_revenue
            FROM consolidated_transactions
            WHERE YEAR(trx_date_local) = ? AND MONTH(trx_date_local) = ?
            ${branchFilter}
            GROUP BY DATE(trx_date_local)
            ORDER BY date ASC
        `, [year, month]);
        return rows;
    } catch (error) {
        console.error('Failed to export monthly report:', error);
        return [];
    }
}


