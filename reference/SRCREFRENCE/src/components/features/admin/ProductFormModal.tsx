'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addProductAction } from '@/app/pos/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ProductFormModal({ isOpen, onClose }: ProductFormModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        barcode: '',
        name: '',
        price: '',
        category: 'General',
        stock: '100'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const product = {
                product_id: Math.floor(Math.random() * 100000), // Temporary ID generation
                barcode: formData.barcode,
                name: formData.name,
                price: parseInt(formData.price),
                category: formData.category,
                stock: parseInt(formData.stock)
            };

            const success = await addProductAction(product);

            if (success) {
                toast.success('Product added successfully');
                router.refresh();
                onClose();
                setFormData({ barcode: '', name: '', price: '', category: 'General', stock: '100' });
            } else {
                toast.error('Failed to add product');
            }
        } catch (error) {
            console.error(error);
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="barcode">Barcode</Label>
                        <Input id="barcode" name="barcode" value={formData.barcode} onChange={handleChange} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="name">Product Name</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="price">Price (Rp)</Label>
                            <Input id="price" name="price" type="number" value={formData.price} onChange={handleChange} required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="stock">Initial Stock</Label>
                            <Input id="stock" name="stock" type="number" value={formData.stock} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Input id="category" name="category" value={formData.category} onChange={handleChange} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Product'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
