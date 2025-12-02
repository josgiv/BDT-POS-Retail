import { create } from 'zustand';
import { CartItem, Product } from '@/types';

interface CartState {
    items: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (productId: number) => void;
    updateQty: (productId: number, qty: number) => void;
    clearCart: () => void;
    getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    addToCart: (product) => {
        console.log('[CartStore] Adding to cart:', product);
        const { items } = get();
        const existing = items.find((i) => i.product_id === product.product_id);
        if (existing) {
            const newQty = existing.qty + 1;
            const newSubtotal = newQty * existing.price;
            console.log('[CartStore] Updating existing - Qty:', newQty, 'Subtotal:', newSubtotal);
            set({
                items: items.map((i) =>
                    i.product_id === product.product_id
                        ? { ...i, qty: newQty, subtotal: newSubtotal }
                        : i
                ),
            });
        } else {
            const newItem = { ...product, qty: 1, subtotal: product.price };
            console.log('[CartStore] Adding new item:', newItem);
            set({
                items: [...items, newItem],
            });
        }
        console.log('[CartStore] Current items:', get().items);
        console.log('[CartStore] Current total:', get().getTotal());
    },
    removeFromCart: (productId) =>
        set({ items: get().items.filter((i) => i.product_id !== productId) }),
    updateQty: (productId, qty) => {
        if (qty <= 0) {
            get().removeFromCart(productId);
            return;
        }
        set({
            items: get().items.map((i) =>
                i.product_id === productId
                    ? { ...i, qty, subtotal: qty * i.price }
                    : i
            ),
        });
        console.log('[CartStore] After update qty, total:', get().getTotal());
    },
    clearCart: () => set({ items: [] }),
    getTotal: () => {
        const total = get().items.reduce((acc, item) => {
            const itemSubtotal = Number(item.subtotal) || 0;
            return acc + itemSubtotal;
        }, 0);
        return isNaN(total) ? 0 : total;
    },
}));
