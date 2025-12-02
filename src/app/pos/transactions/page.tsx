'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Calendar } from 'lucide-react';
import { getTransactionsAction, getTransactionDetailsAction } from '../actions';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

export default function TransactionsPage() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
    const [details, setDetails] = useState<any[]>([]);
    const [detailsLoading, setDetailsLoading] = useState(false);

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        try {
            const data = await getTransactionsAction();
            setTransactions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleTransactionClick = async (trx: any) => {
        setSelectedTransaction(trx);
        setDetailsLoading(true);
        try {
            const items = await getTransactionDetailsAction(trx.transaction_uuid);
            setDetails(items);
        } catch (error) {
            console.error(error);
        } finally {
            setDetailsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-100 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Daftar Transaksi</h1>
                        <p className="text-neutral-500">Branch 101</p>
                    </div>
                    <Button variant="outline" onClick={() => router.push('/pos')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali ke POS
                    </Button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold">Recent Transactions</h2>
                        <p className="text-sm text-neutral-500">
                            Total: {transactions.length} transaksi ditemukan
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {transactions.map((trx) => (
                                <div
                                    key={trx.transaction_uuid}
                                    onClick={() => handleTransactionClick(trx)}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
                                >
                                    <div className="space-y-1">
                                        <div className="font-mono text-sm font-medium">
                                            {trx.transaction_uuid.substring(0, 18)}...
                                        </div>
                                        <div className="text-xs text-neutral-500 flex items-center gap-2">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(trx.created_at), 'EEEE, dd MMMM yyyy - HH:mm:ss', { locale: id })}
                                        </div>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-xs border px-2 py-0.5 rounded bg-white font-medium uppercase">
                                                {trx.payment_method}
                                            </span>
                                        </div>
                                        <div className="font-bold text-lg">
                                            Rp {Number(trx.grand_total).toLocaleString('id-ID')}
                                        </div>
                                        <div className={`text-[10px] flex items-center justify-end gap-1 ${trx.synced ? 'text-green-600' : 'text-orange-600'}`}>
                                            {trx.synced ? (
                                                <>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                                                    Synced to Cloud
                                                </>
                                            ) : (
                                                <>
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    Pending Sync
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Detail Transaksi</DialogTitle>
                        <DialogDescription>
                            ID: {selectedTransaction?.transaction_uuid}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTransaction && (
                        <div className="space-y-6">
                            {/* Header Info */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-neutral-500 block text-xs">Waktu</span>
                                    <span className="font-medium">
                                        {format(new Date(selectedTransaction.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-neutral-500 block text-xs">Metode Pembayaran</span>
                                    <span className="font-medium">{selectedTransaction.payment_method}</span>
                                </div>
                                <div>
                                    <span className="text-neutral-500 block text-xs">Kasir</span>
                                    <span className="font-medium">{selectedTransaction.user_id || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-neutral-500 block text-xs">Status Sync</span>
                                    <span className={`font-medium ${selectedTransaction.synced ? 'text-green-600' : 'text-orange-600'}`}>
                                        {selectedTransaction.synced ? 'Synced' : 'Pending'}
                                    </span>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-neutral-50 px-4 py-2 text-xs font-medium text-neutral-500 flex justify-between">
                                    <span>ITEM</span>
                                    <span>TOTAL</span>
                                </div>
                                <div className="max-h-[200px] overflow-y-auto">
                                    {detailsLoading ? (
                                        <div className="p-8 flex justify-center">
                                            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                                        </div>
                                    ) : (
                                        <div className="divide-y">
                                            {details.map((item, idx) => (
                                                <div key={idx} className="p-3 flex justify-between items-start text-sm">
                                                    <div>
                                                        <div className="font-medium">{item.product_name || 'Unknown Product'}</div>
                                                        <div className="text-xs text-neutral-500">
                                                            {item.qty} x Rp {Number(item.price_at_sale).toLocaleString('id-ID')}
                                                        </div>
                                                    </div>
                                                    <div className="font-medium">
                                                        Rp {Number(item.subtotal).toLocaleString('id-ID')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="space-y-2 pt-2 border-t">
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Subtotal</span>
                                    <span>Rp {Number(selectedTransaction.subtotal).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Tax (PPN)</span>
                                    <span>Rp {Number(selectedTransaction.tax_amount).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                    <span>Total</span>
                                    <span>Rp {Number(selectedTransaction.grand_total).toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
