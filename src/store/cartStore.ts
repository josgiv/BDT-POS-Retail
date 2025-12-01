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
        const { items } = get();
        const existing = items.find((i) => i.product_id === product.product_id);
        if (existing) {
            set({
                items: items.map((i) =>
                    i.product_id === product.product_id
                        ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.price }
                        : i
                ),
            });
        } else {
            set({
                items: [...items, { ...product, qty: 1, subtotal: product.price }],
            });
        }
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
    },
    clearCart: () => set({ items: [] }),
    getTotal: () => get().items.reduce((acc, item) => acc + item.subtotal, 0),
}));
