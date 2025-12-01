'use client';

import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator'; // Need to create this or use div
import { CreditCard, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { LocalDBService } from '@/services/database/local-db.service';
import { useAuthStore } from '@/store/authStore';
import { v4 as uuidv4 } from 'uuid';

export function CheckoutPanel() {
    const { items, getTotal, clearCart } = useCartStore();
    const { user } = useAuthStore();
    const total = getTotal();
    const tax = total * 0.11;
    const grandTotal = total + tax;

    const handlePayment = async (method: 'CASH' | 'QRIS') => {
        if (items.length === 0) return;

        const transaction = {
            transaction_uuid: uuidv4(),
            branch_id: user?.branch_id || 101,
            shift_id: 1, // Mock shift ID
            user_id: user?.id || 'guest',
            subtotal: total,
            total_discount: 0,
            tax_amount: tax,
            grand_total: grandTotal,
            payment_method: method,
            items: items,
            created_at: new Date().toISOString(),
            synced: false
        };

        try {
            await LocalDBService.saveTransaction(transaction);
            toast.success('Transaksi Berhasil!');
            clearCart();
        } catch (error) {
            toast.error('Gagal menyimpan transaksi');
        }
    };

    return (
        <Card className="h-full flex flex-col shadow-md border-l-4 border-l-primary">
            <CardHeader className="bg-neutral-50 pb-4">
                <CardTitle>Ringkasan Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 pt-6">
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>Rp {total.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">PPN (11%)</span>
                        <span>Rp {tax.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-green-600 font-medium">
                        <span>Diskon</span>
                        <span>- Rp 0</span>
                    </div>
                </div>

                <div className="my-2 border-t border-dashed" />

                <div className="flex justify-between items-end">
                    <span className="text-lg font-bold">Total Tagihan</span>
                    <span className="text-3xl font-extrabold text-primary-foreground bg-primary px-2 py-1 rounded">
                        Rp {grandTotal.toLocaleString('id-ID')}
                    </span>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
                    <Button
                        variant="outline"
                        className="h-16 flex flex-col gap-1 border-2 hover:border-primary hover:bg-primary/5"
                        onClick={() => handlePayment('QRIS')}
                        disabled={items.length === 0}
                    >
                        <CreditCard className="h-5 w-5" />
                        <span>QRIS / Debit</span>
                    </Button>
                    <Button
                        className="h-16 flex flex-col gap-1 bg-green-600 hover:bg-green-700 text-white font-bold text-lg"
                        onClick={() => handlePayment('CASH')}
                        disabled={items.length === 0}
                    >
                        <Banknote className="h-6 w-6" />
                        <span>TUNAI</span>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
