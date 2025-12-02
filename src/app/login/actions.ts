'use server';

import { getUserByUsername } from '@/data/access';
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function loginAction(formData: FormData) {
    const username = formData.get("username") as string;
    const pin = formData.get("pin") as string;
    const loginType = formData.get("loginType") as string;

    console.log('[Login] Attempting login:', { username, loginType });

    if (!username || !pin) {
        return { error: "Username and PIN are required" };
    }

    // Find user in hardcoded data
    const user = getUserByUsername(username);

    if (!user) {
        console.log('[Login] User not found:', username);
        return { error: "Invalid username" };
    }

    console.log('[Login] User found:', user.username, 'Role:', user.role);

    // Verify PIN
    if (user.pin !== pin) {
        console.log('[Login] Invalid PIN');
        return { error: "Invalid PIN" };
    }

    // Check access permission
    if (loginType === 'admin' && !user.canAccessDashboard) {
        console.log('[Login] User cannot access dashboard');
        return { error: "You don't have admin access. Please use Cashier login." };
    }

    if (loginType === 'cashier' && !user.canAccessPOS) {
        console.log('[Login] User cannot access POS');
        return { error: "You don't have POS access." };
    }

    // Authenticate with Supabase
    try {
        const cookieStore = await cookies();
        const supabase = await createClient(cookieStore);

        console.log('[Login] Authenticating with Supabase:', user.email);

        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: pin,
        });

        if (authError) {
            console.error('[Login] Supabase auth error:', authError.message);
            return { error: `Authentication failed: ${authError.message}` };
        }

        if (!data.session) {
            console.error('[Login] No session created');
            return { error: "Failed to create session" };
        }

        console.log('[Login] Successfully authenticated, session created');

        return {
            success: true,
            user: {
                id: data.user.id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                branchId: user.branchId,
                canAccessPOS: user.canAccessPOS,
                canAccessDashboard: user.canAccessDashboard,
                canAccessAllRegions: user.canAccessAllRegions,
            }
        };
    } catch (error) {
        console.error('[Login] Error:', error);
        return { error: "Login failed. Please try again." };
    }
}
