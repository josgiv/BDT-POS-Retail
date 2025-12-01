-- ===========================================================
-- SEED DATA: RETAIL IDENTITY (SUPABASE)
-- ===========================================================

-- 1. Insert Cabang (Branches)
INSERT INTO retail_identity.branches (id, branch_code, branch_name, address, server_ip)
VALUES
    (101, 'JKT-001', 'Alfamart Cilandak KKO', 'Jl. Cilandak KKO No. 5, Jakarta Selatan', '192.168.1.100'),
    (102, 'BDG-001', 'Alfamart Dago Atas', 'Jl. Ir. H. Juanda No. 88, Bandung', '192.168.2.100');

-- 2. Insert Users (Auth Base) & Profiles (Role Management)
-- Kita menggunakan CTE (Common Table Expression) agar insert ke users & profiles atomic dan terhubung otomatis.

WITH new_users AS (
INSERT INTO retail_identity.users (email, full_name, metadata)
VALUES
    -- C-LEVEL (Pusat)
    ('ceo@retail.id', 'Budi Santoso', '{"job_title": "CEO"}'),
    ('director@retail.id', 'Siti Aminah', '{"job_title": "Director"}'),

    -- MANAGEMENT (Area)
    ('am.jkt@retail.id', 'Joko Anwar', '{"area": "JABODETABEK"}'),
    ('am.bdg@retail.id', 'Ridwan Kamil KW', '{"area": "JAWA BARAT"}'),

    -- STORE JKT (Supervisior & Kasir)
    ('spv.jkt@retail.id', 'Rina Nose', '{"store": "JKT-001"}'),
    ('kasir1.jkt@retail.id', 'Agus Kotak', '{"store": "JKT-001"}'),
    ('kasir2.jkt@retail.id', 'Dewi Persik', '{"store": "JKT-001"}'),

    -- STORE BDG (Supervisior & Kasir)
    ('spv.bdg@retail.id', 'Sule Prikitiw', '{"store": "BDG-001"}'),
    ('kasir1.bdg@retail.id', 'Andre Taulany', '{"store": "BDG-001"}'),
    ('kasir2.bdg@retail.id', 'Nunung', '{"store": "BDG-001"}')
    RETURNING id, email, full_name
    )
INSERT INTO retail_identity.profiles (id, username, role, branch_id, status, offline_pin_hash)
SELECT
    id,
    SPLIT_PART(email, '@', 1) as username, -- Username ambil dari depan email
    CASE
        WHEN email LIKE 'ceo%' THEN 'SUPER_ADMIN'::retail_identity.user_role_enum
        WHEN email LIKE 'director%' THEN 'SUPER_ADMIN'::retail_identity.user_role_enum
        WHEN email LIKE 'am.%' THEN 'AREA_MANAGER'::retail_identity.user_role_enum
        WHEN email LIKE 'spv.%' THEN 'STORE_LEADER'::retail_identity.user_role_enum
        ELSE 'CASHIER'::retail_identity.user_role_enum
        END as role,
    CASE
        WHEN email LIKE '%jkt%' THEN 101
        WHEN email LIKE '%bdg%' THEN 102
        ELSE NULL -- Orang pusat tidak terikat toko fisik spesifik
        END as branch_id,
    'ACTIVE'::retail_identity.account_status_enum,
    '1234' -- Dummy Bcrypt Hash untuk PIN '1234'
FROM new_users;

-- 3. Audit Log (Contoh Data Awal)
INSERT INTO retail_identity.audit_logs (user_id, action, details, ip_address)
SELECT id, 'LOGIN_CLOUD', '{"method": "web_dashboard"}'::jsonb, '10.0.0.1'
FROM retail_identity.profiles WHERE role = 'SUPER_ADMIN';