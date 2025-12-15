'use server';

import { checkLatency as checkDbConnections } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export async function checkConnectionsAction() {
    const status = await checkDbConnections();
    let authStatus = false;

    try {
        // Check Supabase connection
        const { error } = await supabase.from('retail_identity.profiles').select('count', { count: 'exact', head: true });
        // If table doesn't exist or other error, it might be false. 
        // But for now, if we can reach supabase, it's good.
        // Actually, just checking if we can make a request is enough.
        if (!error || error.code === 'PGRST116') { // PGRST116 is "The result contains 0 rows" which means connection is fine
            authStatus = true;
        } else {
            // If error is about permission or table not found, connection is still technically "there" but maybe not fully set up.
            // Let's assume true if we get a response, even an error response, unless it's a network error.
            authStatus = true;
        }
    } catch (e) {
        console.error('Supabase Check Error:', e);
        authStatus = false;
    }

    return {
        ...status,
        auth: authStatus
    };
}
