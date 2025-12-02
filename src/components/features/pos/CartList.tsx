'use client';

import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';

export function CartList() {
    const { items, updateQty, removeFromCart } = useCartStore();

    if (items.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-neutral-50 text-center">
                <div className="bg-neutral-100 p-6 rounded-full mb-4">
                    <ShoppingCart className="h-12 w-12 text-neutral-300" />
                </div>
                <p className="text-lg font-semibold text-neutral-600">Keranjang Kosong</p>
                <p className="text-sm text-neutral-400 mt-1 max-w-xs">
                    Scan barcode atau cari produk di panel atas untuk mulai transaksi.
                </p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-3 bg-neutral-100 text-xs font-semibold text-neutral-500 border-b">
                <div className="col-span-5">PRODUK</div>
                <div className="col-span-3 text-center">QUANTITY</div>
                <div className="col-span-3 text-right">SUBTOTAL</div>
                <div className="col-span-1 text-center">AKSI</div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto">
                {items.map((item) => (
                    <div key={item.product_id} className="grid grid-cols-12 gap-4 p-3 border-b hover:bg-neutral-50 items-center transition-colors">

                        {/* Product Info */}
                        <div className="col-span-5">
                            <p className="font-semibold text-neutral-900 text-sm truncate" title={item.name}>{item.name}</p>
                            <p className="text-xs text-neutral-500 font-mono">{item.barcode}</p>
                            <p className="text-xs text-neutral-400 mt-0.5">@ Rp {item.price.toLocaleString('id-ID')}</p>
                        </div>

                        {/* Qty Control */}
                        <div className="col-span-3 flex items-center justify-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQty(item.product_id, item.qty - 1)}
                            >
                                <Minus className="h-3 w-3" />
                            </Button>
                            <input
                                type="number"
                                className="w-12 text-center font-bold text-sm border rounded py-1 mx-1"
                                value={item.qty}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val) && val > 0) {
                                        updateQty(item.product_id, val);
                                    }
                                }}
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQty(item.product_id, item.qty + 1)}
                            >
                                <Plus className="h-3 w-3" />
                            </Button>
                        </div>

                        {/* Subtotal */}
                        <div className="col-span-3 text-right">
                            <p className="font-bold text-neutral-900 text-sm">
                                Rp {item.subtotal.toLocaleString('id-ID')}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="col-span-1 text-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => removeFromCart(item.product_id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
