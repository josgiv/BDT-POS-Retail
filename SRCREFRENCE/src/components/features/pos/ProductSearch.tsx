'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Product } from '@/types';
import { LocalDBService } from '@/services/database/local-db.service';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';

export function ProductSearch() {
    const [open, setOpen] = React.useState(false);
    const [products, setProducts] = React.useState<Product[]>([]);
    const addToCart = useCartStore((state) => state.addToCart);

    React.useEffect(() => {
        const loadProducts = async () => {
            const data = await LocalDBService.getProducts();
            setProducts(data);
        };
        loadProducts();
    }, [open]); // Reload when opened to get latest stock

    const handleSelect = (product: Product) => {
        addToCart(product);
        toast.success(`Ditambahkan: ${product.name}`);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-12 text-lg"
                >
                    <span className="flex items-center gap-2 text-muted-foreground">
                        <Search className="h-4 w-4" />
                        Cari Produk (Nama / Kategori)...
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Ketik nama barang..." />
                    <CommandList>
                        <CommandEmpty>Produk tidak ditemukan.</CommandEmpty>
                        <CommandGroup heading="Daftar Produk">
                            {products.map((product) => (
                                <CommandItem
                                    key={product.product_id}
                                    value={`${product.name} ${product.category}`} // Allow search by category too
                                    onSelect={() => handleSelect(product)}
                                >
                                    <div className="flex flex-col w-full">
                                        <div className="flex justify-between">
                                            <span className="font-medium">{product.name}</span>
                                            <span className="font-bold">Rp {product.price.toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>{product.category}</span>
                                            <span>Stok: {product.stock}</span>
                                        </div>
                                    </div>
                                    <Check
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            "opacity-0" // Always hidden, just for structure if needed later
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
