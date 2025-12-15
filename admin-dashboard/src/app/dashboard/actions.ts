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
        const [rows]: any = await cloudDb.query(`
            SELECT * FROM products_global ORDER BY name ASC
        `);
        return rows;
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return [];
    }
}

// ============ EMPLOYEES ============
export async function getAllEmployees() {
    try {
        const [rows]: any = await cloudDb.query(`
            SELECT * FROM users_global ORDER BY full_name ASC
        `);
        return rows;
    } catch (error) {
        console.error('Failed to fetch employees:', error);
        return [];
    }
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
