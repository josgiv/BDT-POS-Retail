'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarcodeScanner } from '@/components/features/pos/BarcodeScanner';
import { CartList } from '@/components/features/pos/CartList';
import { CheckoutPanel } from '@/components/features/pos/CheckoutPanel';
import { ProductSearch } from '@/components/features/pos/ProductSearch';
import { InventoryManager } from '@/components/features/pos/InventoryManager';
import { Button } from '@/components/ui/button';
import { LogOut, Receipt, Package, Menu, UserCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { User } from '@/data/access';
import { createClient } from '@/utils/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface PosClientProps {
    user: User;
}

export default function PosClient({ user }: PosClientProps) {
    const router = useRouter();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);

    useState(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    });

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <div className="h-screen flex flex-col bg-neutral-100 overflow-hidden font-sans">
            {/* Header */}
            <header className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-sm z-30">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="text-neutral-500">
                        <Menu className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-bold text-blue-600 tracking-tight">BahliMart POS</h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* Inventory Button in Navbar */}
                    <Dialog open={isInventoryOpen} onOpenChange={setIsInventoryOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100">
                                <Package className="h-4 w-4" />
                                Stok Barang
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Manajemen Stok (Inventory)</DialogTitle>
                            </DialogHeader>
                            <InventoryManager />
                        </DialogContent>
                    </Dialog>

                    <div className="text-right hidden md:block border-l pl-4 ml-2">
                        <div className="font-semibold text-sm">{user.fullName}</div>
                        <div className="text-xs text-neutral-400">
                            {user.branchId ? `Store #${user.branchId}` : 'HQ Mode'}
                        </div>
                    </div>
                    <UserCircle className="h-8 w-8 text-neutral-400" />

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="text-red-500 hover:bg-red-50"
                    >
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">

                {/* LEFT COLUMN: Main Workspace (Scanner, Search, Cart List) */}
                <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden bg-neutral-50">

                    {/* Top Row: Scanner & Search */}
                    <div className="grid grid-cols-12 gap-6 h-[300px]">
                        {/* Scanner Section */}
                        <div className="col-span-4 bg-white p-4 rounded-xl shadow-sm border flex flex-col">
                            <h3 className="font-semibold mb-2 text-neutral-700 text-sm">Scan Barcode</h3>
                            <div className="flex-1 bg-neutral-100 rounded-lg overflow-hidden relative flex items-center justify-center">
                                <BarcodeScanner />
                            </div>
                        </div>

                        {/* Search Section */}
                        <div className="col-span-8 bg-white p-4 rounded-xl shadow-sm border flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-neutral-700 text-sm">Cari Produk Manual</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-neutral-500"
                                    onClick={() => router.push('/pos/transactions')}
                                >
                                    <Receipt className="mr-1 h-3 w-3" />
                                    Riwayat Transaksi
                                </Button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <ProductSearch />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Cart List (Moved here as requested) */}
                    <div className="flex-1 bg-white rounded-xl shadow-sm border flex flex-col overflow-hidden">
                        <div className="p-3 border-b bg-neutral-50 flex justify-between items-center">
                            <h3 className="font-bold text-neutral-700">Daftar Belanjaan (Current Order)</h3>
                            <span className="text-xs text-neutral-500">{format(currentTime, 'dd MMMM yyyy, HH:mm', { locale: id })}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-0">
                            {/* We need to ensure CartList looks good in wide mode */}
                            <CartList />
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Checkout Panel Only (Fixed Width) */}
                <div className="w-[380px] bg-white border-l shadow-xl flex flex-col z-20">
                    <CheckoutPanel user={user} />
                </div>

            </div>
        </div>
    );
}
