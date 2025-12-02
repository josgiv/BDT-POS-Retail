'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    Settings,
    LogOut,
    Search,
    Bell,
    Menu,
    Store,
    Truck,
    Activity,
    Map
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [userEmail, setUserEmail] = React.useState('');
    const [userRegion, setUserRegion] = React.useState('National');

    React.useEffect(() => {
        async function loadUser() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                setUserEmail(user.email);
                // Determine region from email
                if (user.email.includes('jkt')) setUserRegion('JABODETABEK');
                else if (user.email.includes('bdg')) setUserRegion('JAWA BARAT');
                else setUserRegion('National');
            }
        }
        loadUser();
    }, []);

    const menuItems = [
        { title: 'Executive Summary', icon: LayoutDashboard, href: '/admin/dashboard' },
        { title: 'Transactions', icon: ShoppingCart, href: '/admin/transactions' },
        { title: 'Inventory & Supply', icon: Truck, href: '/admin/inventory' },
        { title: 'Product Master', icon: Package, href: '/admin/products' },
        { title: 'Branch Management', icon: Store, href: '/admin/branches' },
        { title: 'Employees', icon: Users, href: '/admin/employees' },
        { title: 'System Health', icon: Activity, href: '/admin/system-health' },
    ];

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-neutral-900 text-white">
            <div className="h-16 flex items-center justify-center border-b border-neutral-800">
                <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                    <span className="text-yellow-400">BAHLIL</span>MART
                </div>
            </div>

            <nav className="flex-1 py-6 px-3 space-y-1">
                {menuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
                            pathname === item.href
                                ? "bg-yellow-500 text-neutral-900"
                                : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                        )}
                    >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span>{item.title}</span>
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-neutral-800">
                <Button
                    variant="ghost"
                    onClick={async () => {
                        const supabase = createClient();
                        await supabase.auth.signOut();
                        window.location.href = '/login'; // Hard reload
                    }}
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="ml-3">Logout</span>
                </Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-neutral-100 flex">
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "bg-neutral-900 text-white transition-all duration-300 hidden md:flex flex-col fixed h-full z-20",
                    isSidebarOpen ? "w-64" : "w-20"
                )}
            >
                <div className="h-16 flex items-center justify-center border-b border-neutral-800">
                    {isSidebarOpen ? (
                        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                            <span className="text-yellow-400">BAHLIL</span>MART
                        </div>
                    ) : (
                        <span className="text-yellow-400 font-bold">BM</span>
                    )}
                </div>

                <nav className="flex-1 py-6 px-3 space-y-1">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
                                pathname === item.href
                                    ? "bg-yellow-500 text-neutral-900"
                                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                            )}
                        >
                            <item.icon className="h-5 w-5 shrink-0" />
                            {isSidebarOpen && <span>{item.title}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-neutral-800">
                    <Button
                        variant="ghost"
                        onClick={async () => {
                            const supabase = createClient();
                            await supabase.auth.signOut();
                            window.location.href = '/login'; // Hard reload to clear state
                        }}
                        className={cn(
                            "w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20",
                            !isSidebarOpen && "justify-center px-0"
                        )}
                    >
                        <LogOut className="h-5 w-5" />
                        {isSidebarOpen && <span className="ml-3">Logout</span>}
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className={cn("flex-1 flex flex-col transition-all duration-300", isSidebarOpen ? "md:ml-64" : "md:ml-20")}>
                {/* Top Navbar */}
                <header className="h-16 bg-white border-b px-4 md:px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Trigger */}
                        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-64 bg-neutral-900 border-r-neutral-800">
                                <SidebarContent />
                            </SheetContent>
                        </Sheet>

                        {/* Desktop Sidebar Toggle */}
                        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hidden md:flex">
                            <Menu className="h-5 w-5" />
                        </Button>

                        {/* Global Search */}
                        <div className="relative hidden md:block w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                            <Input
                                placeholder="Global Search (Ctrl+K)..."
                                className="pl-10 bg-neutral-50 border-neutral-200 focus:bg-white transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        {/* Global Context Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="hidden md:flex gap-2">
                                    <Map className="h-4 w-4 text-blue-600" />
                                    <span>Region: {userRegion}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Select Region</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Nasional (All)</DropdownMenuItem>
                                <DropdownMenuItem>JABODETABEK</DropdownMenuItem>
                                <DropdownMenuItem>Jawa Barat</DropdownMenuItem>
                                <DropdownMenuItem>Jawa Tengah</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Notifications */}
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5 text-neutral-600" />
                            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                        </Button>

                        {/* User Profile */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="pl-2 pr-4 gap-3 rounded-full hover:bg-neutral-100">
                                    <Avatar className="h-8 w-8 border bg-orange-100 text-orange-700">
                                        <AvatarFallback><Users className="h-4 w-4" /></AvatarFallback>
                                    </Avatar>
                                    <div className="text-left hidden md:block">
                                        <div className="text-sm font-semibold">Admin Pusat</div>
                                        <div className="text-xs text-neutral-500">Super Admin</div>
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/admin/profile" className="w-full cursor-pointer">Profile</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>Settings</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">Logout</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
