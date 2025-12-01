export type Role = 'SUPER_ADMIN' | 'AREA_MANAGER' | 'STORE_LEADER' | 'CASHIER';

export interface User {
    id: string;
    username: string;
    full_name: string;
    role: Role;
    branch_id: number;
    email?: string;
    isAuthenticated?: boolean;
}

export interface Branch {
    id: number;
    branch_code: string;
    branch_name: string;
    address: string;
    server_ip?: string;
    is_active: boolean;
}

export interface Product {
    product_id: number;
    barcode: string;
    name: string;
    price: number;
    category?: string;
    stock: number;
}

export interface CartItem extends Product {
    qty: number;
    subtotal: number;
    discount?: number;
}

export interface Transaction {
    transaction_uuid: string;
    branch_id: number;
    shift_id: number;
    user_id: string;
    subtotal: number;
    total_discount: number;
    tax_amount: number;
    grand_total: number;
    payment_method: 'CASH' | 'QRIS' | 'DEBIT' | 'CREDIT';
    cash_received?: number;
    change_returned?: number;
    items: CartItem[];
    created_at: string;
    synced: boolean;
}

export interface Shift {
    shift_id: number;
    user_id: string;
    start_time: string;
    end_time?: string;
    start_cash: number;
    end_cash_actual?: number;
    end_cash_system?: number;
    variance?: number;
    status: 'OPEN' | 'CLOSED';
}
