'use client';

import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Banknote, Smartphone, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { LocalDBService } from '@/services/database/local-db.service';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@/data/access';

interface CheckoutPanelProps {
    user: User;
}

export function CheckoutPanel({ user }: CheckoutPanelProps) {
    const { items, getTotal, clearCart } = useCartStore();
    const total = getTotal();
    const tax = total * 0.11;
    const grandTotal = total + tax;

    console.log('[CheckoutPanel] Items:', items);
    console.log('[CheckoutPanel] Total:', total, 'Tax:', tax, 'Grand Total:', grandTotal);

    const handlePayment = async (method: 'CASH' | 'DEBIT' | 'QRIS' | 'CREDIT') => {
        if (items.length === 0) {
            toast.error('Keranjang masih kosong!');
            return;
        }

        const transaction = {
            transaction_uuid: uuidv4(),
            branch_id: user.branchId ? parseInt(user.branchId) : 101,
            shift_id: 1,
            user_id: null,
            subtotal: total,
            total_discount: 0,
            tax_amount: tax,
            grand_total: grandTotal,
            payment_method: method,
            items: items,
            created_at: new Date().toISOString(),
            synced: false,
            user_email: user.email // Pass email for server-side lookup
        };

        try {
            await LocalDBService.saveTransaction(transaction);
            toast.success(`✅ Transaksi berhasil! (${method})`);
            clearCart();
        } catch (error) {
            console.error('Transaction error:', error);
            toast.error('❌ Gagal menyimpan transaksi');
        }
    };

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Math.round(amount));
    };

    return (
        <Card className="h-full flex flex-col shadow-lg border-t-4 border-t-yellow-500">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 pb-4">
                <CardTitle className="text-lg">Ringkasan Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 pt-6">
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-neutral-600">Subtotal</span>
                        <span className="font-semibold">Rp {formatRupiah(total)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-neutral-600">PPN (11%)</span>
                        <span className="font-semibold text-orange-600">Rp {formatRupiah(tax)}</span>
                    </div>
                    <div className="flex justify-between items-center text-green-600">
                        <span>Diskon</span>
                        <span className="font-semibold">- Rp 0</span>
                    </div>
                </div>

                <div className="my-3 border-t-2 border-dashed border-neutral-300" />

                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl p-4 shadow-lg">
                    <div className="text-sm opacity-90 mb-1">Total Tagihan</div>
                    <div className="text-3xl font-extrabold tracking-tight">
                        Rp {formatRupiah(grandTotal)}
                    </div>
                </div>

                <div className="mt-auto space-y-2 pt-4">
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            className="h-14 flex flex-col gap-1 border-2 hover:border-blue-500 hover:bg-blue-50 transition-all"
                            onClick={() => handlePayment('DEBIT')}
                            disabled={items.length === 0}
                        >
                            <CreditCard className="h-5 w-5 text-blue-600" />
                            <span className="text-xs font-semibold">Debit</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-14 flex flex-col gap-1 border-2 hover:border-purple-500 hover:bg-purple-50 transition-all"
                            onClick={() => handlePayment('QRIS')}
                            disabled={items.length === 0}
                        >
                            <Smartphone className="h-5 w-5 text-purple-600" />
                            <span className="text-xs font-semibold">QRIS</span>
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            className="h-14 flex flex-col gap-1 border-2 hover:border-amber-500 hover:bg-amber-50 transition-all"
                            onClick={() => handlePayment('CREDIT')}
                            disabled={items.length === 0}
                        >
                            <Building2 className="h-5 w-5 text-amber-600" />
                            <span className="text-xs font-semibold">Credit</span>
                        </Button>
                        <Button
                            className="h-14 flex flex-col gap-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg transition-all transform hover:scale-105"
                            onClick={() => handlePayment('CASH')}
                            disabled={items.length === 0}
                        >
                            <Banknote className="h-6 w-6" />
                            <span className="text-sm">TUNAI</span>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
