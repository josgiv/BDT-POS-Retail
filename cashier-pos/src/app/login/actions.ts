'use server';

import { localDb, getSchemaForBranch } from '@/lib/db';
import { createClient } from '@/utils/supabase/server';

interface LoginResult {
    success?: boolean;
    error?: string;
    user?: {
        id: string;
        username: string;
        fullName: string;
        role: string;
        branchId: number;
        email?: string;
    };
}

export async function loginAction(formData: FormData): Promise<LoginResult> {
    const username = formData.get('username') as string;
    const pin = formData.get('pin') as string;
    const branch = formData.get('branch') as string;

    if (!username || !pin || !branch) {
        return { error: 'Username, PIN, dan Cabang harus diisi' };
    }

    try {
        const schema = getSchemaForBranch(branch);
        const client = await localDb.connect();

        try {
            // Query local database for user (minimal columns that always exist)
            const result = await client.query(
                `SELECT user_id, username, full_name, role, pin_hash 
                 FROM ${schema}.users_local 
                 WHERE username = $1`,
                [username]
            );

            if (result.rows.length === 0) {
                return { error: 'User tidak ditemukan' };
            }

            const user = result.rows[0];

            // Verify PIN (simple comparison for now, should use bcrypt in production)
            if (user.pin_hash !== pin) {
                return { error: 'PIN salah' };
            }

            // Check if user is a cashier (only cashiers can login to POS)
            const allowedRoles = ['CASHIER', 'STORE_LEADER', 'STORE_MANAGER'];
            if (!allowedRoles.includes(user.role)) {
                return { error: 'Hanya Kasir, Store Leader, atau Store Manager yang dapat mengakses POS' };
            }

            return {
                success: true,
                user: {
                    id: String(user.user_id),
                    username: user.username,
                    fullName: user.full_name,
                    role: user.role,
                    branchId: parseInt(branch)
                }
            };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Login error:', error);
        return { error: 'Gagal login. Periksa koneksi database lokal.' };
    }
}

export async function logoutAction(): Promise<{ success: boolean }> {
    try {
        const supabase = await createClient();
        await supabase.auth.signOut();
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return { success: true }; // Return success anyway for POS
    }
}
