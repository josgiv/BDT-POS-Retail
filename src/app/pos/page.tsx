import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import PosClient from './client';

export default async function PosPage() {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.log('[POS] No user session, redirecting to login');
        redirect('/login');
    }

    console.log('[POS] User authenticated:', user.email);

    // Get user data from hardcoded access control
    const { getUserByEmail } = await import('@/data/access');
    const userData = getUserByEmail(user.email || '');

    if (!userData) {
        console.log('[POS] User data not found');
        redirect('/login');
    }

    if (!userData.canAccessPOS) {
        console.log('[POS] User cannot access POS');
        redirect('/admin/dashboard');
    }

    console.log('[POS] Access granted for:', userData.username);

    return <PosClient user={userData} />;
}
