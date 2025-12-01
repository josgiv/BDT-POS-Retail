import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isOfflineMode: boolean;
    login: (user: User) => void;
    logout: () => void;
    setOfflineMode: (isOffline: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isOfflineMode: false,
            login: (user) => set({ user, isAuthenticated: true }),
            logout: () => set({ user: null, isAuthenticated: false }),
            setOfflineMode: (isOffline) => set({ isOfflineMode: isOffline }),
        }),
        {
            name: 'auth-storage',
        }
    )
);
