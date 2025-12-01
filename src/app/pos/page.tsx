'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { BarcodeScanner } from '@/components/features/pos/BarcodeScanner';
import { CartList } from '@/components/features/pos/CartList';
import { CheckoutPanel } from '@/components/features/pos/CheckoutPanel';
import { ProductSearch } from '@/components/features/pos/ProductSearch';
import { InventoryManager } from '@/components/features/pos/InventoryManager';
import { Button } from '@/components/ui/button';
import { LogOut, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function PosPage() {
    const router = useRouter();
    const { user, logout, isOfflineMode } = useAuthStore();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        if (!user) {
            router.push('/login');
        }

        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [user, router]);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    if (!user) return null;

    return (
        <div className="h-screen flex flex-col bg-neutral-100 overflow-hidden">
            {/* Header */}
            <header className="bg-primary text-primary-foreground px-6 py-3 flex justify-between items-center shadow-md z-10">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold tracking-tight">Alfamart POS</h1>
                    <div className="bg-white/20 px-3 py-1 rounded text-sm font-medium">
                        {user?.branch_id ? `Toko #${user.branch_id}` : 'Offline Mode'}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <div className="font-semibold">{user?.full_name || 'Kasir'}</div>
                        <div className="text-xs opacity-90">
                            {format(currentTime, 'EEEE, d MMMM yyyy HH:mm', { locale: id })}
                        </div>
                    </div>
                    <InventoryManager />
                    <Button variant="secondary" size="icon" title="Sync Status">
                        <RefreshCw className={`h-5 w-5 ${isOfflineMode ? 'text-red-500' : 'text-green-600'}`} />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={handleLogout}>
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left Panel: Scanner & Cart */}
                <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
                    {/* Input Section */}
                    <div className="bg-white p-4 rounded-lg shadow-sm flex gap-4 items-center">
                        <div className="w-1/3">
                            <BarcodeScanner />
                        </div>
                        <div className="flex-1">
                            <ProductSearch />
                        </div>
                    </div>

                    {/* Cart Section */}
                    <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
                        <CartList />
                    </div>
                </div>

                {/* Right Panel: Checkout */}
                <div className="w-[400px] bg-white border-l shadow-xl z-10">
                    <CheckoutPanel />
                </div>
            </main>
        </div>
    );
}
