/**
 * HARDCODED ACCESS CONTROL
 * Centralized user roles and permissions
 */

export type UserRole =
    | 'CASHIER'
    | 'STORE_SUPERVISOR'
    | 'STORE_LEADER'
    | 'AREA_MANAGER'
    | 'DIRECTOR'
    | 'CEO'
    | 'SUPER_ADMIN';

export interface User {
    username: string;
    email: string;
    pin: string;
    role: UserRole;
    branchId: string | null;
    fullName: string;
    canAccessPOS: boolean;
    canAccessDashboard: boolean;
    canAccessAllRegions: boolean;
}

export const USERS: Record<string, User> = {
    // CASHIERS - Jakarta
    'kasir1.jkt': {
        username: 'kasir1.jkt',
        email: 'kasir1.jkt@retail.id',
        pin: '1234',
        role: 'CASHIER',
        branchId: '101',
        fullName: 'Agus Kotak',
        canAccessPOS: true,
        canAccessDashboard: false,
        canAccessAllRegions: false,
    },
    'kasir2.jkt': {
        username: 'kasir2.jkt',
        email: 'kasir2.jkt@retail.id',
        pin: '1234',
        role: 'CASHIER',
        branchId: '101',
        fullName: 'Dewi Persik',
        canAccessPOS: true,
        canAccessDashboard: false,
        canAccessAllRegions: false,
    },

    // CASHIERS - Bandung
    'kasir1.bdg': {
        username: 'kasir1.bdg',
        email: 'kasir1.bdg@retail.id',
        pin: '1234',
        role: 'CASHIER',
        branchId: '102',
        fullName: 'Andre Taulany',
        canAccessPOS: true,
        canAccessDashboard: false,
        canAccessAllRegions: false,
    },
    'kasir2.bdg': {
        username: 'kasir2.bdg',
        email: 'kasir2.bdg@retail.id',
        pin: '1234',
        role: 'CASHIER',
        branchId: '102',
        fullName: 'Nunung',
        canAccessPOS: true,
        canAccessDashboard: false,
        canAccessAllRegions: false,
    },

    // SUPERVISORS
    'spv.jkt': {
        username: 'spv.jkt',
        email: 'spv.jkt@retail.id',
        pin: '1234',
        role: 'STORE_LEADER',
        branchId: '101',
        fullName: 'Rina Nose',
        canAccessPOS: true,
        canAccessDashboard: true,
        canAccessAllRegions: false, // Only their branch
    },
    'spv.bdg': {
        username: 'spv.bdg',
        email: 'spv.bdg@retail.id',
        pin: '1234',
        role: 'STORE_LEADER',
        branchId: '102',
        fullName: 'Sule Prikitiw',
        canAccessPOS: true,
        canAccessDashboard: true,
        canAccessAllRegions: false, // Only their branch
    },

    // AREA MANAGERS
    'am.jkt': {
        username: 'am.jkt',
        email: 'am.jkt@retail.id',
        pin: '1234',
        role: 'AREA_MANAGER',
        branchId: null,
        fullName: 'Joko Anwar',
        canAccessPOS: true,
        canAccessDashboard: true,
        canAccessAllRegions: true, // All regions
    },
    'am.bdg': {
        username: 'am.bdg',
        email: 'am.bdg@retail.id',
        pin: '1234',
        role: 'AREA_MANAGER',
        branchId: null,
        fullName: 'Ridwan Kamil KW',
        canAccessPOS: true,
        canAccessDashboard: true,
        canAccessAllRegions: true, // All regions
    },

    // C-LEVEL
    'ceo': {
        username: 'ceo',
        email: 'ceo@retail.id',
        pin: '1234',
        role: 'SUPER_ADMIN',
        branchId: null,
        fullName: 'Budi Santoso',
        canAccessPOS: true,
        canAccessDashboard: true,
        canAccessAllRegions: true,
    },
    'director': {
        username: 'director',
        email: 'director@retail.id',
        pin: '1234',
        role: 'SUPER_ADMIN',
        branchId: null,
        fullName: 'Siti Aminah',
        canAccessPOS: true,
        canAccessDashboard: true,
        canAccessAllRegions: true,
    },
};

// Helper to find user by username
export function getUserByUsername(username: string): User | null {
    return USERS[username.toLowerCase()] || null;
}

// Helper to find user by email
export function getUserByEmail(email: string): User | null {
    return Object.values(USERS).find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

// Check if user can access a specific route
export function canAccessRoute(user: User, route: string): boolean {
    if (route.startsWith('/pos')) {
        return user.canAccessPOS;
    }
    if (route.startsWith('/admin')) {
        return user.canAccessDashboard;
    }
    return true; // Public routes
}

// Check if role is admin-level
export function isAdmin(role: UserRole): boolean {
    return ['STORE_LEADER', 'STORE_SUPERVISOR', 'AREA_MANAGER', 'DIRECTOR', 'CEO', 'SUPER_ADMIN'].includes(role);
}
