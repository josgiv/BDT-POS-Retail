'use client';

import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus } from 'lucide-react';

export function CartList() {
    const { items, updateQty, removeFromCart } = useCartStore();

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground border-2 border-dashed rounded-lg">
                <p className="text-lg">Keranjang Kosong</p>
                <p className="text-sm">Scan barcode untuk mulai transaksi</p>
            </div>
        );
    }

    return (
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <table className="w-full text-sm text-left">
                <thead className="bg-neutral-100 text-neutral-600 uppercase text-xs">
                    <tr>
                        <th className="px-4 py-3">Produk</th>
                        <th className="px-4 py-3 text-center">Harga</th>
                        <th className="px-4 py-3 text-center">Qty</th>
                        <th className="px-4 py-3 text-right">Subtotal</th>
                        <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {items.map((item) => (
                        <tr key={item.product_id} className="hover:bg-neutral-50">
                            <td className="px-4 py-3 font-medium">
                                <div className="flex flex-col">
                                    <span className="text-base text-neutral-900">{item.name}</span>
                                    <span className="text-xs text-neutral-500">{item.barcode}</span>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                                Rp {item.price.toLocaleString('id-ID')}
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => updateQty(item.product_id, item.qty - 1)}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center font-bold">{item.qty}</span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => updateQty(item.product_id, item.qty + 1)}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-neutral-900">
                                Rp {item.subtotal.toLocaleString('id-ID')}
                            </td>
                            <td className="px-4 py-3 text-center">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => removeFromCart(item.product_id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
