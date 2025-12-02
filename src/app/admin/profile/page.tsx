'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/utils/supabase/client';
import { User, Mail, MapPin, Shield, Key, LogOut, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function loadUser() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
            }
            setLoading(false);
        }
        loadUser();
    }, []);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (loading) {
        return <div className="p-8 text-center text-neutral-500">Loading profile...</div>;
    }

    if (!user) {
        return <div className="p-8 text-center text-red-500">User not found. Please login.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900">My Profile</h2>
                <p className="text-neutral-500">Manage your account settings and preferences.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                {/* Profile Card */}
                <Card className="md:col-span-1 shadow-sm border-neutral-200">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 relative">
                            <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                                <AvatarImage src={user.user_metadata?.avatar_url} />
                                <AvatarFallback className="bg-orange-100 text-orange-600 text-2xl font-bold">
                                    {user.email?.[0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <Badge className="absolute bottom-0 right-0 bg-green-500 border-2 border-white">Online</Badge>
                        </div>
                        <CardTitle>{user.user_metadata?.full_name || 'Admin User'}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                            <Shield className="h-4 w-4 text-blue-500" />
                            <span>Role: <span className="font-semibold text-neutral-900">Super Admin</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                            <MapPin className="h-4 w-4 text-red-500" />
                            <span>Region: <span className="font-semibold text-neutral-900">National (HQ)</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                            <Key className="h-4 w-4 text-yellow-500" />
                            <span>ID: <span className="font-mono text-xs">{user.id.substring(0, 8)}...</span></span>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="destructive" className="w-full" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" /> Sign Out
                        </Button>
                    </CardFooter>
                </Card>

                {/* Settings Form */}
                <Card className="md:col-span-2 shadow-sm border-neutral-200">
                    <CardHeader>
                        <CardTitle>Account Details</CardTitle>
                        <CardDescription>Update your personal information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                    <Input id="fullName" defaultValue={user.user_metadata?.full_name} className="pl-10" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                    <Input id="email" defaultValue={user.email} disabled className="pl-10 bg-neutral-50" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Tell us about yourself..."
                            />
                        </div>

                        <div className="pt-4 border-t">
                            <h3 className="text-sm font-medium mb-4">Security</h3>
                            <Button variant="outline" className="w-full justify-start">
                                <Key className="mr-2 h-4 w-4" /> Change Password
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 bg-neutral-50/50 p-4 border-t">
                        <Button variant="ghost">Cancel</Button>
                        <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                            <Save className="mr-2 h-4 w-4" /> Save Changes
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
