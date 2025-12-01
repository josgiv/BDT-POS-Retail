'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, User } from "lucide-react";
import { loginAction } from "./actions";
import { toast } from "sonner";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        const result = await loginAction(formData);
        setLoading(false);

        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success("Login successful");
            router.push("/admin/dashboard");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
            <Card className="w-full max-w-md shadow-2xl border-none bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 to-orange-500" />
                <CardHeader className="text-center pt-12 pb-6">
                    <div className="mx-auto bg-yellow-400 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg transform transition-transform hover:scale-105">
                        <span className="font-extrabold text-2xl text-neutral-900">AHQ</span>
                    </div>
                    <CardTitle className="text-3xl font-bold text-neutral-900 tracking-tight">Welcome Back</CardTitle>
                    <CardDescription className="text-neutral-500 text-lg mt-2">
                        Enter your credentials to access the system
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-12">
                    <form action={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-sm font-medium text-neutral-600 uppercase tracking-wider">Username</Label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 group-focus-within:text-yellow-500 transition-colors" />
                                <Input
                                    id="username"
                                    name="username"
                                    type="text"
                                    placeholder="e.g. spv.jkt"
                                    className="pl-12 h-14 text-lg bg-neutral-50 border-neutral-200 focus:border-yellow-400 focus:ring-yellow-400/20 rounded-xl transition-all"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pin" className="text-sm font-medium text-neutral-600 uppercase tracking-wider">Security PIN</Label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 group-focus-within:text-yellow-500 transition-colors" />
                                <Input
                                    id="pin"
                                    name="pin"
                                    type="password"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    placeholder="••••"
                                    className="pl-12 h-14 text-lg bg-neutral-50 border-neutral-200 focus:border-yellow-400 focus:ring-yellow-400/20 rounded-xl transition-all tracking-widest"
                                    required
                                    maxLength={6}
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-14 text-lg font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                            disabled={loading}
                        >
                            {loading ? "Verifying..." : "Sign In"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
