'use server';

import { getUserByUsername } from '@/data/access';
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { localDb } from '@/lib/db';
import { User, Role } from '@/types';

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

    // Verify Branch
    const selectedBranch = formData.get("branch") as string;
    if (!selectedBranch) {
        return { error: "Please select a branch" };
    }

    // Special case for HQ/Admin
    if (user.role === 'SUPER_ADMIN' || user.role === 'AREA_MANAGER') {
        // Admins can access any branch or HQ
    } else {
        // Cashiers/Store Leaders must match their assigned branch
        if (user.branchId && user.branchId.toString() !== selectedBranch) {
            console.log(`[Login] Branch mismatch. User: ${user.branchId}, Selected: ${selectedBranch}`);
            return { error: `Access Denied: You are not assigned to Branch ${selectedBranch}` };
        }
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

export async function loginOfflineAction(username: string, pin: string): Promise<User> {
    const client = await localDb.connect();
    try {
        // Assuming default schema or we need to check all? 
        // For login, we might not know the branch yet, but usually the local DB has only one branch's data or we check a specific schema.
        // Let's assume 'retail_jakarta' for now or try to find a way to know.
        // Actually, the local DB should have users_local in the branch schema.
        // Let's try to query from the default schema or a known one.
        // Since we don't have branch info yet, we might need to try multiple or assume one.
        // Better: The local DB is specific to the branch (e.g. Jakarta branch has retail_jakarta DB/Schema).
        // But here we are connecting to `localDb` which has a configured database.

        // Let's assume the schema is 'retail_jakarta' as per previous files, 
        // OR we can query `public.users_local` if it exists there.
        // Let's try 'retail_jakarta' as a fallback or make it dynamic if possible.
        const schema = 'retail_jakarta'; // Default for now

        const res = await client.query(`
            SELECT * FROM ${schema}.users_local 
            WHERE username = $1 AND pin_hash = $2
        `, [username, pin]);

        if (res.rows.length === 0) {
            throw new Error('Invalid credentials (Offline)');
        }

        const user = res.rows[0];
        return {
            id: user.user_id.toString(),
            username: user.username,
            full_name: user.full_name,
            role: user.role as Role,
            branch_id: 101, // Default or fetch from DB if available
            isAuthenticated: true
        };
    } catch (error) {
        console.error('Offline Login Error:', error);
        throw error;
    } finally {
        client.release();
    }
}
