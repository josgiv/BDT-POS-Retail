import { checkLatency, localDb } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, ArrowUpRight, CreditCard, DollarSign, Package, Server, Users, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

async function getDashboardData() {
    const latency = await checkLatency();

    // Fetch real data from Local DB
    const client = await localDb.connect();
    try {
        // Today's Sales
        const salesRes = await client.query(`
      SELECT COALESCE(SUM(grand_total), 0) as total, COUNT(*) as count 
      FROM transactions 
      WHERE created_at >= CURRENT_DATE
    `);

        // Inventory Status
        const stockRes = await client.query(`
      SELECT COUNT(*) as low_stock 
      FROM inventory_local 
      WHERE qty_on_hand < 10
    `);

        // Active Shift
        const shiftRes = await client.query(`
      SELECT u.full_name, s.start_time 
      FROM cash_shifts s
      JOIN users_local u ON s.user_id = u.user_id
      WHERE s.status = 'OPEN'
      LIMIT 1
    `);

        return {
            latency,
            sales: salesRes.rows[0],
            lowStock: stockRes.rows[0].low_stock,
            activeShift: shiftRes.rows[0] || null
        };
    } finally {
        client.release();
    }
}

export default async function DashboardPage() {
    const data = await getDashboardData();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-transparent">Executive Summary</h2>
                    <p className="text-neutral-500">Real-time overview of store performance and system health.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
                        <Wifi className="h-3 w-3" />
                        Online
                    </Badge>
                    <span className="text-sm text-neutral-500">Last updated: {new Date().toLocaleTimeString()}</span>
                </div>
            </div>

            {/* System Health / Latency */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-white/50 backdrop-blur-sm border-neutral-200 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Local Database (POS)</CardTitle>
                        <Server className={`h-4 w-4 ${data.latency.local.status === 'online' ? 'text-green-500' : 'text-red-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.latency.local.latency}ms</div>
                        <p className="text-xs text-neutral-500">PostgreSQL @ localhost</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/50 backdrop-blur-sm border-neutral-200 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cloud HQ (TiDB)</CardTitle>
                        <Activity className={`h-4 w-4 ${data.latency.cloud.status === 'online' ? 'text-blue-500' : 'text-red-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.latency.cloud.latency}ms</div>
                        <p className="text-xs text-neutral-500">Global Inventory Sync</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/50 backdrop-blur-sm border-neutral-200 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Identity Service</CardTitle>
                        <Users className={`h-4 w-4 ${data.latency.identity.status === 'online' ? 'text-purple-500' : 'text-red-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.latency.identity.latency}ms</div>
                        <p className="text-xs text-neutral-500">Supabase Auth</p>
                    </CardContent>
                </Card>
            </div>

            {/* Business Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white border-none shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-yellow-100">Total Revenue (Today)</CardTitle>
                        <DollarSign className="h-4 w-4 text-yellow-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rp {parseInt(data.sales.total).toLocaleString('id-ID')}</div>
                        <p className="text-xs text-yellow-100/80 flex items-center mt-1">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            +20.1% from yesterday
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                        <CreditCard className="h-4 w-4 text-neutral-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.sales.count}</div>
                        <p className="text-xs text-neutral-500 mt-1">Processed today</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                        <Package className="h-4 w-4 text-neutral-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.lowStock}</div>
                        <p className="text-xs text-neutral-500 mt-1">Requires restock</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Shift</CardTitle>
                        <Users className="h-4 w-4 text-neutral-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.activeShift ? data.activeShift.full_name : 'Closed'}</div>
                        <p className="text-xs text-neutral-500 mt-1">
                            {data.activeShift ? `Started at ${new Date(data.activeShift.start_time).toLocaleTimeString()}` : 'No active cashier'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity Section (Placeholder for now, can be expanded) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[200px] flex items-center justify-center text-neutral-400">
                            Chart Component Coming Soon
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Sales</CardTitle>
                        <CardDescription>
                            You made {data.sales.count} sales today.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {/* We could fetch recent transactions here */}
                            <div className="flex items-center">
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">Olivia Martin</p>
                                    <p className="text-sm text-muted-foreground">
                                        olivia.martin@email.com
                                    </p>
                                </div>
                                <div className="ml-auto font-medium">+$1,999.00</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
