'use server';

import { cloudDb } from '@/lib/db';

export async function getAdminStats() {
    try {
        // 1. Total Revenue (Sum of consolidated transactions)
        const [revenueRows]: any = await cloudDb.query(
            'SELECT SUM(total_amount) as total FROM consolidated_transactions'
        );
        const totalRevenue = parseFloat(revenueRows[0]?.total || 0);

        // 2. Total Transactions
        const [trxRows]: any = await cloudDb.query(
            'SELECT COUNT(*) as count FROM consolidated_transactions'
        );
        const totalTransactions = trxRows[0]?.count || 0;

        // 3. Active Branches
        const [branchRows]: any = await cloudDb.query(
            'SELECT COUNT(*) as count FROM branches WHERE is_active = 1'
        );
        const activeBranches = branchRows[0]?.count || 0;

        // 4. Total Products
        const [prodRows]: any = await cloudDb.query(
            'SELECT COUNT(*) as count FROM products_global'
        );
        const totalProducts = prodRows[0]?.count || 0;

        return {
            revenue: totalRevenue,
            transactions: totalTransactions,
            branches: activeBranches,
            products: totalProducts
        };
    } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        return {
            revenue: 0,
            transactions: 0,
            branches: 0,
            products: 0
        };
    }
}

export async function getSalesChartData() {
    try {
        // Get last 7 days sales
        const [rows]: any = await cloudDb.query(`
            SELECT 
                DATE_FORMAT(trx_date_local, '%Y-%m-%d') as date,
                SUM(total_amount) as total
            FROM consolidated_transactions
            WHERE trx_date_local >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE_FORMAT(trx_date_local, '%Y-%m-%d')
            ORDER BY date ASC
        `);

        return rows.map((r: any) => ({
            name: r.date,
            total: parseFloat(r.total)
        }));
    } catch (error) {
        console.error('Failed to fetch chart data:', error);
        return [];
    }
}

export async function getBranchPerformance() {
    try {
        const [rows]: any = await cloudDb.query(`
            SELECT 
                b.branch_name,
                COUNT(t.global_id) as transaction_count,
                SUM(t.total_amount) as total_revenue
            FROM branches b
            LEFT JOIN consolidated_transactions t ON b.branch_id = t.branch_id
            GROUP BY b.branch_id, b.branch_name
            ORDER BY total_revenue DESC
            LIMIT 5
        `);

        return rows.map((r: any) => ({
            branch_name: r.branch_name,
            transaction_count: r.transaction_count,
            total_revenue: parseFloat(r.total_revenue || 0)
        }));
    } catch (error) {
        console.error('Failed to fetch branch performance:', error);
        return [];
    }
}

export async function getGlobalTransactionsAction() {
    try {
        const [rows]: any = await cloudDb.query(`
            SELECT 
                t.transaction_uuid,
                t.trx_date_local as created_at,
                t.total_amount as grand_total,
                t.payment_method,
                t.branch_id,
                b.branch_name,
                t.user_id as cashier_name
            FROM consolidated_transactions t
            LEFT JOIN branches b ON t.branch_id = b.branch_id
            ORDER BY t.trx_date_local DESC
            LIMIT 50
        `);

        return rows.map((r: any) => ({
            ...r,
            synced: true // Data from cloud is always synced
        }));
    } catch (error) {
        console.error('Failed to fetch global transactions:', error);
        return [];
    }
}

export async function getGlobalTransactionDetailsAction(transactionUuid: string) {
    try {
        const [rows]: any = await cloudDb.query(`
            SELECT 
                ti.product_id,
                ti.qty,
                ti.price_at_sale,
                ti.subtotal,
                p.name as product_name
            FROM consolidated_transaction_items ti
            LEFT JOIN products_global p ON ti.product_id = p.product_id
            WHERE ti.transaction_uuid = ?
        `, [transactionUuid]);

        return rows;
    } catch (error: any) {
        // Handle missing table error gracefully as requested
        if (error.code === 'ER_NO_SUCH_TABLE') {
            console.warn('Table consolidated_transaction_items missing, returning empty details.');
            return [];
        }
        console.error('Failed to fetch global transaction details:', error);
        return [];
    }
}
