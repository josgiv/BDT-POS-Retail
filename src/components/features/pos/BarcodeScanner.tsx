'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, ScanBarcode } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LocalDBService } from '@/services/database/local-db.service';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';

export function BarcodeScanner() {
    const [barcode, setBarcode] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const addToCart = useCartStore((state) => state.addToCart);

    // Auto-focus on mount and after action
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcode.trim()) return;

        try {
            const product = await LocalDBService.getProductByBarcode(barcode);
            if (product) {
                addToCart(product);
                toast.success(`Ditambahkan: ${product.name}`);
                setBarcode('');
            } else {
                toast.error('Produk tidak ditemukan!');
            }
        } catch (error) {
            toast.error('Error scanning product');
        }

        // Keep focus
        inputRef.current?.focus();
    };

    return (
        <form onSubmit={handleScan} className="flex gap-2 w-full">
            <div className="relative flex-1">
                <ScanBarcode className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                    ref={inputRef}
                    placeholder="Scan Barcode / Input Kode Barang..."
                    className="pl-10 h-12 text-lg"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                />
            </div>
            <Button type="submit" size="lg" className="h-12 px-8">
                <Search className="h-5 w-5 mr-2" /> Cari
            </Button>
        </form>
    );
}
