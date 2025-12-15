'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DollarSign,
    ShoppingCart,
    Store,
    Package,
    TrendingUp,
    RefreshCw,
    Clock,
    Bell,
    Calendar,
    BarChart3
} from 'lucide-react';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
    getAdminStats,
    getSalesChartData,
    getBranchPerformance,
    getGlobalTransactions,
    getMonthlySalesData,
    getLifetimeStats
} from './actions';

interface MonthlySales {
    month: string;
    month_label: string;
    total: number;
    trx_count: number;
}

interface LifetimeStats {
    lifetime_revenue: number;
    lifetime_transactions: number;
    avg_transaction: number;
    first_transaction: string | null;
    last_transaction: string | null;
}

export default function DashboardPage() {
    const [stats, setStats] = useState({ revenue: 0, transactions: 0, branches: 0, products: 0 });
    const [chartData, setChartData] = useState<any[]>([]);
    const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
    const [lifetimeStats, setLifetimeStats] = useState<LifetimeStats | null>(null);
    const [branchPerformance, setBranchPerformance] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [s, c, b, t, m, l] = await Promise.all([
                getAdminStats(),
                getSalesChartData(),
                getBranchPerformance(),
                getGlobalTransactions(10),
                getMonthlySalesData(),
                getLifetimeStats()
            ]);
            setStats(s);
            setChartData(c);
            setBranchPerformance(b);
            setTransactions(t);
            setMonthlySales(m);
            setLifetimeStats(l);
            setLastUpdated(new Date());
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
                    <p className="text-sm text-muted-foreground">Overview performa bisnis real-time</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString('id-ID')}` : 'Loading...'}
                    </div>
                    <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
                        <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Bell className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue (Lifetime)"
                    value={formatCurrency(lifetimeStats?.lifetime_revenue || stats.revenue)}
                    icon={DollarSign}
                    gradient="from-emerald-500 to-teal-600"
                    delay={0}
                />
                <StatCard
                    title="Total Transaksi"
                    value={formatNumber(lifetimeStats?.lifetime_transactions || stats.transactions)}
                    icon={ShoppingCart}
                    gradient="from-blue-500 to-indigo-600"
                    delay={0.1}
                />
                <StatCard
                    title="Rata-rata / Transaksi"
                    value={formatCurrency(lifetimeStats?.avg_transaction || 0)}
                    icon={BarChart3}
                    gradient="from-orange-500 to-amber-600"
                    delay={0.2}
                />
                <StatCard
                    title="Total Produk"
                    value={formatNumber(stats.products)}
                    icon={Package}
                    gradient="from-purple-500 to-pink-600"
                    delay={0.3}
                />
            </div>

            {/* Lifetime Sales Chart (12 Months) */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Lifetime Sales - 12 Bulan Terakhir
                    </CardTitle>
                    <CardDescription>Akumulasi penjualan per bulan dari semua cabang</CardDescription>
                </CardHeader>
                <CardContent>
                    {monthlySales.length > 0 ? (
                        <div className="h-72 flex items-end gap-2 pb-8 relative">
                            {monthlySales.map((item, idx) => {
                                const maxVal = Math.max(...monthlySales.map(d => d.total), 1);
                                const height = (item.total / maxVal) * 100;
                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                                        {/* Tooltip */}
                                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-card border shadow-lg rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                                            <p className="text-xs font-medium">{item.month_label}</p>
                                            <p className="text-sm font-bold text-primary">{formatCurrency(item.total)}</p>
                                            <p className="text-xs text-muted-foreground">{item.trx_count} transaksi</p>
                                        </div>
                                        <div
                                            className="w-full bg-gradient-to-t from-primary to-orange-400 rounded-t transition-all hover:from-primary/80 cursor-pointer"
                                            style={{ height: `${Math.max(height, 2)}%`, minHeight: '8px' }}
                                        />
                                        <span className="text-[10px] text-muted-foreground text-center leading-tight">
                                            {item.month_label.split(' ')[0]}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-72 flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-30" />
                                <p>Belum ada data transaksi</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Daily Sales Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-500" />
                            Penjualan 7 Hari Terakhir
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {chartData.length > 0 ? (
                            <div className="h-64 flex items-end gap-2">
                                {chartData.map((item, idx) => {
                                    const maxVal = Math.max(...chartData.map(d => d.total), 1);
                                    const height = (item.total / maxVal) * 100;
                                    return (
                                        <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                            <span className="text-xs text-muted-foreground">{formatCurrency(item.total)}</span>
                                            <div
                                                className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t transition-all"
                                                style={{ height: `${height}%`, minHeight: '4px' }}
                                            />
                                            <span className="text-xs text-muted-foreground">{item.name.split('-').slice(1).join('/')}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-muted-foreground">No data</div>
                        )}
                    </CardContent>
                </Card>

                {/* Branch Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Store className="h-5 w-5 text-primary" />
                            Performa Cabang
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {branchPerformance.length > 0 ? branchPerformance.map((branch, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                                            idx === 0 ? "bg-yellow-100 text-yellow-700" : "bg-muted text-muted-foreground"
                                        )}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{branch.branch_name}</p>
                                            <p className="text-xs text-muted-foreground">{branch.transaction_count} trx</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-sm text-emerald-600">{formatCurrency(branch.total_revenue)}</span>
                                </div>
                            )) : (
                                <div className="text-center text-muted-foreground py-8">No data</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
                <CardHeader>
                    <CardTitle>Transaksi Terbaru</CardTitle>
                    <CardDescription>10 transaksi terakhir dari semua cabang</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-3 font-medium text-muted-foreground">ID</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Cabang</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Total</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Metode</th>
                                    <th className="text-left p-3 font-medium text-muted-foreground">Waktu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((trx, i) => (
                                    <tr key={i} className="border-b hover:bg-muted/50">
                                        <td className="p-3 font-mono text-xs">{trx.transaction_uuid?.slice(0, 8)}...</td>
                                        <td className="p-3">{trx.branch_name || `Branch ${trx.branch_id}`}</td>
                                        <td className="p-3 font-semibold text-emerald-600">{formatCurrency(trx.grand_total || 0)}</td>
                                        <td className="p-3"><Badge variant="outline">{trx.payment_method}</Badge></td>
                                        <td className="p-3 text-muted-foreground">{new Date(trx.created_at || '').toLocaleString('id-ID')}</td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No transactions</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, gradient, delay }: any) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }}>
            <Card className="overflow-hidden border-0 shadow-lg">
                <div className={cn("p-6 text-white", `bg-gradient-to-br ${gradient}`)}>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium opacity-80">{title}</p>
                            <p className="text-3xl font-bold mt-2">{value}</p>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Icon className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
