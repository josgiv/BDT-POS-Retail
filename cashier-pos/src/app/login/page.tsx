'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, User, ShoppingCart, Store, ArrowLeft } from "lucide-react";
import { loginAction } from "./actions";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function CashierLoginPage() {
    const [loading, setLoading] = useState(false);
    const [pin, setPin] = useState('');
    const router = useRouter();

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        formData.append('pin', pin);
        const result = await loginAction(formData);
        setLoading(false);

        if (result?.error) {
            toast.error(result.error);
        } else if (result?.success && result.user) {
            toast.success(`Selamat datang, ${result.user.fullName}!`);
            sessionStorage.setItem('user', JSON.stringify(result.user));
            router.push("/pos");
        }
    };

    const handleNumpadClick = (num: string) => {
        if (num === 'clear') {
            setPin('');
        } else if (num === 'back') {
            setPin(prev => prev.slice(0, -1));
        } else if (pin.length < 6) {
            setPin(prev => prev + num);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 p-4 relative">
            {/* Back Button */}
            <Button
                variant="ghost"
                className="absolute top-6 left-6 gap-2 text-neutral-600 hover:text-neutral-900"
                onClick={() => router.push('/')}
            >
                <ArrowLeft className="h-4 w-4" />
                Kembali
            </Button>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="w-full max-w-md shadow-2xl border-none bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden">
                    {/* Header Gradient */}
                    <div className="h-2 bg-gradient-to-r from-orange-500 via-red-500 to-orange-600" />

                    <CardHeader className="text-center pt-10 pb-6">
                        <div className="mx-auto bg-gradient-to-br from-orange-500 to-red-600 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-orange-500/30">
                            <ShoppingCart className="h-10 w-10 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-neutral-900">
                            Login Kasir
                        </CardTitle>
                        <CardDescription className="text-neutral-500">
                            Masuk ke terminal Point of Sale
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="px-8 pb-10">
                        <form action={handleSubmit} className="space-y-6">
                            {/* Branch Select */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                    Pilih Cabang
                                </Label>
                                <Select name="branch" required>
                                    <SelectTrigger className="h-14 text-lg bg-neutral-50 border-neutral-200 rounded-xl">
                                        <SelectValue placeholder="Pilih Lokasi Toko..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="101">
                                            <div className="flex items-center gap-2">
                                                <Store className="h-4 w-4" />
                                                Jakarta Timur (JKT-001)
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="102">
                                            <div className="flex items-center gap-2">
                                                <Store className="h-4 w-4" />
                                                Bandung Kota (BDG-001)
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="103">
                                            <div className="flex items-center gap-2">
                                                <Store className="h-4 w-4" />
                                                Surabaya Pusat (SBY-001)
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Username */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                    Username Kasir
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                                    <Input
                                        name="username"
                                        placeholder="Contoh: agus_kasir"
                                        className="pl-12 h-14 text-lg bg-neutral-50 border-neutral-200 rounded-xl"
                                        required
                                    />
                                </div>
                            </div>

                            {/* PIN Display */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                    PIN Keamanan
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                                    <div className="pl-12 h-14 text-2xl bg-neutral-50 border border-neutral-200 rounded-xl flex items-center tracking-[0.5em] font-bold text-neutral-700">
                                        {pin ? '•'.repeat(pin.length) : <span className="text-neutral-400 text-lg tracking-normal font-normal">Masukkan PIN</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Numpad */}
                            <div className="grid grid-cols-3 gap-3">
                                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'].map((num) => (
                                    <Button
                                        key={num}
                                        type="button"
                                        variant={num === 'clear' ? 'destructive' : num === 'back' ? 'secondary' : 'outline'}
                                        className="h-14 text-xl font-bold rounded-xl"
                                        onClick={() => handleNumpadClick(num)}
                                    >
                                        {num === 'clear' ? 'C' : num === 'back' ? '←' : num}
                                    </Button>
                                ))}
                            </div>

                            {/* Submit */}
                            <Button
                                type="submit"
                                disabled={loading || pin.length < 4}
                                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl shadow-lg shadow-orange-500/30 disabled:opacity-50"
                            >
                                {loading ? "Memverifikasi..." : "Masuk ke POS"}
                            </Button>

                            {/* Help Text */}
                            <div className="text-center p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                                <p className="text-xs text-neutral-500">
                                    PIN Default: <code className="bg-white px-2 py-1 rounded border font-bold">1234</code>
                                </p>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
