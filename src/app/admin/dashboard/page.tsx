import { localDb, cloudDb } from '@/lib/db';
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from 'next/navigation';
import DashboardClient from './client';

interface DashboardData {
    role: string;
    source: string;
    sales: { total: number; count: number };
    lowStock: number;
    activeShift: { full_name: string; start_time: string } | null;
    username: string;
    recentTransactions: any[];
}

type DashboardResult = DashboardData | { redirect: string };

async function getDashboardData(): Promise<DashboardResult | null> {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { getUserByEmail } = await import('@/data/access');
    const userData = getUserByEmail(user.email || '');
    if (!userData) return null;

    if (userData.role === 'CASHIER') {
        return { redirect: '/pos' };
    }

    let dashboardData: DashboardData = {
        role: userData.role,
        source: 'LOCAL',
        sales: { total: 0, count: 0 },
        lowStock: 0,
        activeShift: null,
        username: userData.username,
        recentTransactions: []
    };

    if (userData.role === 'STORE_LEADER' || userData.role === 'STORE_SUPERVISOR') {
        const client = await localDb.connect();
        try {
            const salesRes = await client.query(`SELECT COALESCE(SUM(grand_total), 0)::INTEGER as total, COUNT(*)::INTEGER as count FROM transactions WHERE created_at >= CURRENT_DATE`);
            const stockRes = await client.query(`SELECT COUNT(*)::INTEGER as low_stock FROM inventory_local WHERE qty_on_hand < 10`);
            const shiftRes = await client.query(`SELECT u.full_name, s.start_time FROM cash_shifts s JOIN users_local u ON s.user_id = u.user_id WHERE s.status = 'OPEN' LIMIT 1`);
            const transactionsRes = await client.query(`SELECT transaction_uuid, grand_total, payment_method, created_at, synced FROM transactions ORDER BY created_at DESC LIMIT 10`);

            dashboardData.sales = salesRes.rows[0] || { total: 0, count: 0 };
            dashboardData.lowStock = stockRes.rows[0]?.low_stock || 0;
            dashboardData.activeShift = shiftRes.rows[0] || null;
            dashboardData.recentTransactions = transactionsRes.rows || [];
            dashboardData.source = 'LOCAL (Branch)';
        } catch (error) {
            console.error("Local DB Error:", error);
        } finally {
            client.release();
        }
    } else {
        try {
            // FIXED: Use correct TiDB column names
            const [salesRows]: any = await cloudDb.query(`SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count FROM consolidated_transactions WHERE trx_date_local >= CURDATE()`);
            const [transactionsRows]: any = await cloudDb.query(`SELECT transaction_uuid, total_amount as grand_total, payment_method, trx_date_local as created_at, branch_id FROM consolidated_transactions ORDER BY trx_date_local DESC LIMIT 10`);

            dashboardData.sales = salesRows?.[0] || { total: 0, count: 0 };
            dashboardData.recentTransactions = transactionsRows || [];
            dashboardData.source = 'CLOUD (Global HQ)';
        } catch (err) {
            console.error("Cloud DB Error:", err);
            // Fallback to offline state
            dashboardData.source = 'CLOUD (Offline)';
            dashboardData.sales = { total: 0, count: 0 };
            dashboardData.recentTransactions = [];
        }
    }

    return dashboardData;
}

export default async function DashboardPage() {
    const data = await getDashboardData();
    if (!data) redirect('/login');
    if ('redirect' in data) redirect(data.redirect);

    return <DashboardClient data={data} />;
}
