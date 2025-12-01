'use client';

import * as React from 'react';
import { Plus, AlertTriangle, List, Package } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { LocalDBService } from '@/services/database/local-db.service';
import { Product } from '@/types';

export function InventoryManager() {
    const [open, setOpen] = React.useState(false);
    const [view, setView] = React.useState<'ADD' | 'DEFECTIVE' | 'LIST'>('LIST');
    const [products, setProducts] = React.useState<Product[]>([]);
    const [loading, setLoading] = React.useState(false);

    // Form States
    const [newItem, setNewItem] = React.useState({
        barcode: '',
        name: '',
        category: '',
        price: '',
        stock: ''
    });
    const [defectiveItem, setDefectiveItem] = React.useState({
        barcode: '',
        qty: '',
        reason: ''
    });

    const loadProducts = async () => {
        setLoading(true);
        const data = await LocalDBService.getProducts();
        setProducts(data);
        setLoading(false);
    };

    React.useEffect(() => {
        if (open && view === 'LIST') {
            loadProducts();
        }
    }, [open, view]);

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.barcode || !newItem.name || !newItem.price) {
            toast.error('Mohon lengkapi data barang');
            return;
        }

        try {
            const success = await LocalDBService.addProduct({
                product_id: 0, // Auto-generated
                barcode: newItem.barcode,
                name: newItem.name,
                category: newItem.category || 'General',
                price: parseFloat(newItem.price),
                stock: parseInt(newItem.stock) || 0
            });

            if (success) {
                toast.success('Barang berhasil ditambahkan!');
                setNewItem({ barcode: '', name: '', category: '', price: '', stock: '' });
                setView('LIST');
            } else {
                toast.error('Gagal menambahkan barang');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        }
    };

    const handleDefective = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!defectiveItem.barcode || !defectiveItem.qty) {
            toast.error('Mohon lengkapi data');
            return;
        }

        try {
            const success = await LocalDBService.logDefective(
                defectiveItem.barcode,
                parseInt(defectiveItem.qty),
                defectiveItem.reason || 'Rusak/Hilang'
            );

            if (success) {
                toast.success('Laporan barang rusak berhasil disimpan');
                setDefectiveItem({ barcode: '', qty: '', reason: '' });
                setView('LIST');
            } else {
                toast.error('Gagal menyimpan laporan (Cek barcode)');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" className="gap-2">
                    <Package className="h-4 w-4" />
                    Manajemen Stok
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Manajemen Inventaris & Stok</DialogTitle>
                    <DialogDescription>
                        Kelola barang masuk, cek stok, dan lapor barang rusak.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-2 my-4">
                    <Button
                        variant={view === 'LIST' ? 'default' : 'outline'}
                        onClick={() => setView('LIST')}
                        size="sm"
                    >
                        <List className="h-4 w-4 mr-2" /> Daftar Stok
                    </Button>
                    <Button
                        variant={view === 'ADD' ? 'default' : 'outline'}
                        onClick={() => setView('ADD')}
                        size="sm"
                    >
                        <Plus className="h-4 w-4 mr-2" /> Input Barang Baru
                    </Button>
                    <Button
                        variant={view === 'DEFECTIVE' ? 'destructive' : 'outline'}
                        onClick={() => setView('DEFECTIVE')}
                        size="sm"
                    >
                        <AlertTriangle className="h-4 w-4 mr-2" /> Input Defektif
                    </Button>
                </div>

                {view === 'LIST' && (
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Barcode</TableHead>
                                    <TableHead>Nama Barang</TableHead>
                                    <TableHead>Kategori</TableHead>
                                    <TableHead className="text-right">Harga</TableHead>
                                    <TableHead className="text-right">Stok</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-4">Memuat data...</TableCell>
                                    </TableRow>
                                ) : products.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-4">Belum ada data barang.</TableCell>
                                    </TableRow>
                                ) : (
                                    products.map((product) => (
                                        <TableRow key={product.product_id}>
                                            <TableCell className="font-mono text-xs">{product.barcode}</TableCell>
                                            <TableCell>{product.name}</TableCell>
                                            <TableCell>{product.category}</TableCell>
                                            <TableCell className="text-right">Rp {product.price.toLocaleString('id-ID')}</TableCell>
                                            <TableCell className="text-right font-bold">{product.stock}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {view === 'ADD' && (
                    <form onSubmit={handleAddItem} className="space-y-4 border p-4 rounded-md bg-neutral-50">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Barcode / Kode Barang</Label>
                                <Input
                                    placeholder="Scan atau ketik..."
                                    value={newItem.barcode}
                                    onChange={e => setNewItem({ ...newItem, barcode: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Kategori</Label>
                                <Select
                                    value={newItem.category}
                                    onValueChange={v => setNewItem({ ...newItem, category: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Food">Food</SelectItem>
                                        <SelectItem value="Beverage">Beverage</SelectItem>
                                        <SelectItem value="Snack">Snack</SelectItem>
                                        <SelectItem value="Bakery">Bakery</SelectItem>
                                        <SelectItem value="Household">Household</SelectItem>
                                        <SelectItem value="Personal Care">Personal Care</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Nama Barang</Label>
                                <Input
                                    placeholder="Contoh: Indomie Goreng"
                                    value={newItem.name}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Harga Jual (Rp)</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={newItem.price}
                                    onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Stok Awal</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={newItem.stock}
                                    onChange={e => setNewItem({ ...newItem, stock: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button type="submit">Simpan Barang</Button>
                        </div>
                    </form>
                )}

                {view === 'DEFECTIVE' && (
                    <form onSubmit={handleDefective} className="space-y-4 border p-4 rounded-md bg-red-50 border-red-100">
                        <div className="space-y-2">
                            <Label>Barcode Barang Rusak</Label>
                            <Input
                                placeholder="Scan barcode barang..."
                                value={defectiveItem.barcode}
                                onChange={e => setDefectiveItem({ ...defectiveItem, barcode: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Jumlah Rusak</Label>
                            <Input
                                type="number"
                                placeholder="1"
                                value={defectiveItem.qty}
                                onChange={e => setDefectiveItem({ ...defectiveItem, qty: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Alasan / Keterangan</Label>
                            <Input
                                placeholder="Contoh: Kadaluarsa, Kemasan Rusak..."
                                value={defectiveItem.reason}
                                onChange={e => setDefectiveItem({ ...defectiveItem, reason: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button variant="destructive" type="submit">Lapor Barang Rusak</Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
