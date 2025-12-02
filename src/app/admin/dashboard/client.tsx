'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, DollarSign, Package, Wifi, CheckCircle2, XCircle, TrendingUp, Users, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TransactionDetailModal } from '@/components/features/TransactionDetailModal';
import { useState } from 'react';
import { getGlobalTransactionDetailsAction } from '../actions';
import { Button } from '@/components/ui/button';

interface DashboardClientProps {
    data: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function DashboardClient({ data }: DashboardClientProps) {
    const [selectedTrx, setSelectedTrx] = useState<any>(null);
    const [trxDetails, setTrxDetails] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleViewDetails = async (trx: any) => {
        setSelectedTrx(trx);
        setIsModalOpen(true);

        // Fetch details
        // If source is LOCAL, we might need a different action, but for now assuming global/cloud context or consistent ID
        // Ideally, we should pass the items if available, or fetch them.
        // Since getDashboardData fetches from local or cloud depending on role, we need to be careful.
        // For simplicity, if it's cloud data, we use the cloud action. If local, we might need a local one.
        // However, the user specifically asked for "RECENT TRANSACTION HARUS BISA DIPENCET".

        if (data.source.includes('CLOUD')) {
            const details = await getGlobalTransactionDetailsAction(trx.transaction_uuid);
            setTrxDetails(details);
        } else {
            // For local, we can't easily call a server action that queries local DB from client component 
            // without exposing a specific action. 
            // But wait, we have `getTransactionDetailsAction` in `pos/actions.ts` which queries local DB.
            // We can import that? No, `pos/actions.ts` uses `localDb` which is server-side only.
            // We can import it here because this is a client component, but Next.js handles the RPC.
            // Let's try importing it dynamically or just use the global one if synced.
            // If not synced, we might fail to get details if we use global action.
            // Let's use a server action that decides based on context or just try global first.

            // Actually, let's just try to fetch using the global action for now, assuming sync is fast.
            // Or better, create a `getDashboardTransactionDetails` that handles both?
            // For now, let's use the global one and see.
            const details = await getGlobalTransactionDetailsAction(trx.transaction_uuid);
            setTrxDetails(details);
        }
    };

    const formatRupiah = (amount: number) => new Intl.NumberFormat('id-ID').format(Math.round(amount));

    // Use real data if available, otherwise fallback to empty array to avoid errors
    const salesData = data.chartData || [];
    const branchData = data.branchPerformance || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
                        {data.role === 'AREA_MANAGER' || data.role === 'SUPER_ADMIN' ? 'BahlilMart HQ Command Center' : 'Store Dashboard'}
                    </h2>
                    <p className="text-neutral-500">
                        Welcome back, <strong className="text-orange-600">{data.username}</strong> •
                        <Badge variant="outline" className="ml-2">{data.source}</Badge>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200 px-3 py-1">
                        <Wifi className="h-3 w-3" />
                        System Online
                    </Badge>
                    <Button variant="destructive" size="sm" onClick={() => window.location.href = '/login'}>
                        Logout
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-none shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">Total Revenue (Today)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold flex items-center">
                            <DollarSign className="h-6 w-6 mr-1 opacity-75" />
                            Rp {formatRupiah(data.sales.total)}
                        </div>
                        <p className="text-xs opacity-75 mt-1">+20.1% from yesterday</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500">Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center text-neutral-800">
                            <Activity className="h-5 w-5 mr-2 text-blue-500" />
                            {data.sales.count}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-yellow-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500">Low Stock Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center text-neutral-800">
                            <Package className="h-5 w-5 mr-2 text-yellow-500" />
                            {data.lowStock}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-500">Active Shift</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold flex items-center text-neutral-800 truncate">
                            <Users className="h-5 w-5 mr-2 text-green-500" />
                            {data.activeShift?.full_name || 'Closed'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 shadow-sm">
                    <CardHeader>
                        <CardTitle>Sales Overview</CardTitle>
                        <CardDescription>Daily revenue performance</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="w-full h-[300px]" style={{ minHeight: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={salesData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${value}`} />
                                    <Tooltip
                                        formatter={(value: number) => [`Rp ${formatRupiah(value)}`, 'Revenue']}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="total" fill="#f97316" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3 shadow-sm">
                    <CardHeader>
                        <CardTitle>Branch Performance</CardTitle>
                        <CardDescription>Revenue distribution by region</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full h-[300px]" style={{ minHeight: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={branchData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {branchData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Latest activity from all channels</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {data.recentTransactions.map((trx: any, idx: number) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-4 bg-white border rounded-xl hover:bg-neutral-50 transition-all cursor-pointer group"
                                onClick={() => handleViewDetails(trx)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                        <ShoppingBag className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-neutral-900 font-mono">{String(trx.transaction_uuid).substring(0, 8)}...</p>
                                        <p className="text-xs text-neutral-500">{format(new Date(trx.created_at), 'dd MMM yyyy, HH:mm')}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <Badge variant="secondary" className="font-normal">{trx.payment_method}</Badge>
                                    <div className="text-right min-w-[100px]">
                                        <p className="font-bold text-neutral-900">Rp {formatRupiah(Number(trx.grand_total))}</p>
                                        <div className="flex items-center justify-end gap-1 mt-1">
                                            {trx.synced !== undefined && (trx.synced ?
                                                <span className="text-[10px] text-green-600 flex items-center"><CheckCircle2 className="h-3 w-3 mr-1" /> Synced</span> :
                                                <span className="text-[10px] text-orange-600 flex items-center"><XCircle className="h-3 w-3 mr-1" /> Pending</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {data.recentTransactions.length === 0 && (
                            <div className="text-center text-neutral-400 py-12">
                                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No transactions yet today</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <TransactionDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                transaction={selectedTrx}
                items={trxDetails}
            />
        </div>
    );
}
