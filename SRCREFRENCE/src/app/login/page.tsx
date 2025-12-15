'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, User, ShieldCheck, ShoppingCart } from "lucide-react";
import { loginAction } from "./actions";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [loginType, setLoginType] = useState<'admin' | 'cashier' | null>(null);
    const router = useRouter();

    const handleSubmit = async (formData: FormData) => {
        if (!loginType) {
            toast.error("Please select login type");
            return;
        }

        setLoading(true);
        formData.append('loginType', loginType);
        const result = await loginAction(formData);
        setLoading(false);

        if (result?.error) {
            toast.error(result.error);
        } else if (result?.success) {
            toast.success(`Welcome back, ${result.user.fullName}!`);

            // Store user data in sessionStorage
            sessionStorage.setItem('user', JSON.stringify(result.user));

            // Redirect based on login type
            if (loginType === 'admin') {
                router.push("/admin/dashboard");
            } else {
                router.push("/pos");
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 p-4 relative">
            {/* Back Button */}
            <Button
                variant="ghost"
                className="absolute top-8 left-8 text-neutral-600 hover:text-neutral-900"
                onClick={() => router.push('/')}
            >
                ← Back to Home
            </Button>

            <Card className="w-full max-w-md shadow-2xl border-none bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 via-red-500 to-orange-600" />
                <CardHeader className="text-center pt-12 pb-6">
                    <div className="mx-auto bg-gradient-to-br from-orange-500 to-red-600 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg transform transition-transform hover:scale-105">
                        <span className="font-extrabold text-3xl text-white">B</span>
                    </div>
                    <CardTitle className="text-3xl font-bold text-neutral-900 tracking-tight">BahlilMart</CardTitle>
                    <CardDescription className="text-neutral-500 text-lg mt-2">
                        Enterprise Retail System
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-12">
                    {!loginType ? (
                        <div className="space-y-4">
                            <p className="text-center text-sm text-neutral-600 mb-6">Select your login type</p>
                            <Button
                                onClick={() => setLoginType('admin')}
                                className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-neutral-800 to-neutral-900 hover:from-black hover:to-black text-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <ShieldCheck className="h-6 w-6 mr-3" />
                                Login as Admin
                            </Button>
                            <Button
                                onClick={() => setLoginType('cashier')}
                                className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <ShoppingCart className="h-6 w-6 mr-3" />
                                Login as Cashier
                            </Button>

                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-neutral-200"></span></div>
                                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-neutral-500">Or continue with</span></div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Button variant="outline" className="h-12 rounded-xl border-neutral-200 hover:bg-neutral-50">
                                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                    Google
                                </Button>
                                <Button variant="outline" className="h-12 rounded-xl border-neutral-200 hover:bg-neutral-50">
                                    <svg className="h-5 w-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                    Facebook
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <form action={handleSubmit} className="space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    {loginType === 'admin' ? (
                                        <>
                                            <ShieldCheck className="h-5 w-5 text-neutral-900" />
                                            <span className="font-semibold text-neutral-900">Admin Login</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCart className="h-5 w-5 text-orange-600" />
                                            <span className="font-semibold text-neutral-900">Cashier Login</span>
                                        </>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setLoginType(null)}
                                    className="text-xs text-neutral-500 hover:text-neutral-900"
                                >
                                    Change
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-neutral-600 uppercase tracking-wider">Select Branch</Label>
                                <Select name="branch" required>
                                    <SelectTrigger className="w-full h-14 text-lg bg-neutral-50 border-neutral-200 focus:ring-orange-400/20 rounded-xl">
                                        <SelectValue placeholder="Choose Location..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="101">Jakarta Timur (JKT-001)</SelectItem>
                                        <SelectItem value="102">Bandung Kota (BDG-001)</SelectItem>
                                        <SelectItem value="103">Surabaya Pusat (SBY-001)</SelectItem>
                                        <SelectItem value="HQ">Global HQ (Cloud)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-sm font-medium text-neutral-600 uppercase tracking-wider">Username</Label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 group-focus-within:text-orange-500 transition-colors" />
                                    <Input
                                        id="username"
                                        name="username"
                                        type="text"
                                        placeholder={loginType === 'admin' ? "e.g. spv.jkt, am.jkt, ceo" : "e.g. kasir1.jkt"}
                                        className="pl-12 h-14 text-lg bg-neutral-50 border-neutral-200 focus:border-orange-400 focus:ring-orange-400/20 rounded-xl transition-all"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pin" className="text-sm font-medium text-neutral-600 uppercase tracking-wider">Security PIN</Label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 group-focus-within:text-orange-500 transition-colors" />
                                    <Input
                                        id="pin"
                                        name="pin"
                                        type="password"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        placeholder="••••"
                                        className="pl-12 h-14 text-lg bg-neutral-50 border-neutral-200 focus:border-orange-400 focus:ring-orange-400/20 rounded-xl transition-all tracking-widest"
                                        required
                                        maxLength={6}
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                                disabled={loading}
                            >
                                {loading ? "Verifying..." : "Sign In"}
                            </Button>

                            <div className="mt-4 p-4 bg-neutral-50 border border-neutral-100 rounded-lg">
                                <p className="text-xs text-neutral-500 font-medium text-center">Default PIN: <code className="bg-white px-2 py-1 rounded border">1234</code></p>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
