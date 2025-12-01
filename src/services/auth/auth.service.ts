import { supabase } from '@/lib/supabase';
import { checkConnectionsAction } from '@/app/actions';
import { loginOfflineAction } from '@/app/login/actions';
import { User, Role } from '@/types';

// Mock user for fallback if DBs are empty/not set up yet (Safety net for the user)
const MOCK_USERS = [
    {
        user_id: 1,
        username: 'kasir1',
        pin_hash: '1234', // Plaintext PIN as requested
        role: 'CASHIER' as Role,
        full_name: 'Kasir Jakarta 1',
        branch_id: 101
    },
    {
        user_id: 99,
        username: 'admin1',
        pin_hash: '1234', // Plaintext PIN as requested
        role: 'SUPER_ADMIN' as Role,
        full_name: 'Admin Pusat',
        branch_id: 0
    }
];

export const AuthService = {
    login: async (username: string, pin: string): Promise<User> => {
        // 1. Check connectivity
        const status = await checkConnectionsAction();
        const isOnline = status.auth; // Use Supabase for online auth

        try {
            if (isOnline) {
                return await AuthService.loginOnline(username, pin);
            } else {
                return await AuthService.loginOffline(username, pin);
            }
        } catch (error) {
            console.warn('Auth Error, falling back to mock for demo purposes if real DB fails:', error);

            // FALLBACK FOR DEMO (Remove in production)
            const mockUser = MOCK_USERS.find(u => u.username === username);
            if (mockUser && pin === mockUser.pin_hash) {
                return {
                    id: mockUser.user_id.toString(),
                    username: mockUser.username,
                    full_name: mockUser.full_name,
                    role: mockUser.role,
                    branch_id: mockUser.branch_id,
                    isAuthenticated: true
                };
            }
            throw error;
        }
    },

    loginOnline: async (username: string, pin: string): Promise<User> => {
        const { data, error } = await supabase
            .from('retail_identity.profiles')
            .select(`
                id,
                username,
                role,
                branch_id,
                offline_pin_hash,
                users ( full_name )
            `)
            .eq('username', username)
            .single();

        if (error || !data) {
            throw new Error('User not found in Cloud Identity');
        }

        // DIRECT PIN COMPARISON (PLAINTEXT)
        const isValid = data.offline_pin_hash === pin;

        if (!isValid) {
            throw new Error('Invalid Credentials');
        }

        // Handle potential array or object for joined relation
        const fullName = Array.isArray(data.users)
            ? data.users[0]?.full_name
            : (data.users as any)?.full_name || data.username;

        return {
            id: data.id,
            username: data.username,
            full_name: fullName,
            role: data.role as Role,
            branch_id: data.branch_id,
            isAuthenticated: true
        };
    },

    loginOffline: async (username: string, pin: string): Promise<User> => {
        return await loginOfflineAction(username, pin);
    }
};
