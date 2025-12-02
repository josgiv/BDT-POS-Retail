'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface TransactionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: any;
    items: any[];
}

export function TransactionDetailModal({ isOpen, onClose, transaction, items }: TransactionDetailModalProps) {
    if (!transaction) return null;

    const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID').format(val);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Detail Transaksi</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="bg-neutral-50 p-3 rounded-lg border">
                        <p className="text-xs text-neutral-500 font-mono">ID: {transaction.transaction_uuid}</p>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                            <div>
                                <p className="text-neutral-500 text-xs">Waktu</p>
                                <p className="font-medium">{format(new Date(transaction.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}</p>
                            </div>
                            <div>
                                <p className="text-neutral-500 text-xs">Metode Pembayaran</p>
                                <Badge variant="outline">{transaction.payment_method}</Badge>
                            </div>
                            <div>
                                <p className="text-neutral-500 text-xs">Kasir</p>
                                <p className="font-medium">{transaction.cashier_name || '-'}</p>
                            </div>
                            <div>
                                <p className="text-neutral-500 text-xs">Status Sync</p>
                                {transaction.synced ? (
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Synced</Badge>
                                ) : (
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">Pending</Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        <div className="bg-neutral-100 p-2 text-xs font-semibold flex justify-between">
                            <span>ITEM</span>
                            <span>TOTAL</span>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                            {items.map((item: any, idx: number) => (
                                <div key={idx} className="p-2 border-b last:border-0 flex justify-between items-center text-sm">
                                    <div>
                                        <p className="font-medium">{item.product_name || 'Unknown Product'}</p>
                                        <p className="text-xs text-neutral-500">{item.qty} x Rp {formatRupiah(item.price_at_sale)}</p>
                                    </div>
                                    <p className="font-medium">Rp {formatRupiah(item.subtotal)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t">
                        <div className="flex justify-between text-sm">
                            <span className="text-neutral-500">Subtotal</span>
                            <span>Rp {formatRupiah(parseInt(transaction.grand_total) / 1.11)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-neutral-500">Tax (PPN)</span>
                            <span>Rp {formatRupiah(parseInt(transaction.grand_total) - (parseInt(transaction.grand_total) / 1.11))}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t">
                            <span>Total</span>
                            <span>Rp {formatRupiah(parseInt(transaction.grand_total))}</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
