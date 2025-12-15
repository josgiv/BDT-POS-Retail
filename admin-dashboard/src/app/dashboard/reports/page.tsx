import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, TrendingUp, ShoppingCart, Package } from 'lucide-react';

export default function ReportsPage() {
    const reports = [
        {
            title: 'Laporan Penjualan Harian',
            desc: 'Ringkasan penjualan per hari dari semua cabang',
            icon: TrendingUp,
            color: 'text-emerald-500'
        },
        {
            title: 'Laporan Transaksi',
            desc: 'Detail semua transaksi dengan filter tanggal',
            icon: ShoppingCart,
            color: 'text-blue-500'
        },
        {
            title: 'Laporan Inventaris',
            desc: 'Status stok produk per cabang',
            icon: Package,
            color: 'text-orange-500'
        },
        {
            title: 'Laporan Bulanan',
            desc: 'Ringkasan performa bisnis bulanan',
            icon: Calendar,
            color: 'text-purple-500'
        },
    ];

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Laporan</h2>
                    <p className="text-slate-500">Generate dan download laporan bisnis</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reports.map((report, idx) => (
                    <Card key={idx} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center ${report.color}`}>
                                    <report.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">{report.title}</CardTitle>
                                    <CardDescription>{report.desc}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Preview
                                </Button>
                                <Button className="flex-1">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Custom Report</CardTitle>
                    <CardDescription>Buat laporan kustom dengan filter khusus</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-slate-400">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Fitur custom report akan segera tersedia</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
