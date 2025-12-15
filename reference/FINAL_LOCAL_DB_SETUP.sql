-- =========================================================
-- FINAL LOCAL DB SETUP SCRIPT - ALFAMART POS
-- =========================================================

-- 0. CLEANUP (DROP TABLES IF EXIST)
DROP TABLE IF EXISTS defective_log CASCADE;
DROP TABLE IF EXISTS upload_queue CASCADE;
DROP TABLE IF EXISTS transaction_items CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS cash_shifts CASCADE;
DROP TABLE IF EXISTS inventory_local CASCADE;
DROP TABLE IF EXISTS products_local CASCADE;
DROP TABLE IF EXISTS users_local CASCADE;
DROP TABLE IF EXISTS store_config CASCADE;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CREATE TABLES

-- Store Configuration
CREATE TABLE store_config (
    config_id       SERIAL PRIMARY KEY,
    branch_id       INT NOT NULL,
    branch_code     VARCHAR(20) NOT NULL,
    store_name      VARCHAR(100),
    store_address   TEXT,
    last_sync_ts    TIMESTAMPTZ,
    app_version     VARCHAR(20) DEFAULT '1.0.0'
);

-- Users (Local)
CREATE TABLE users_local (
    user_id         BIGINT PRIMARY KEY,
    username        VARCHAR(50) NOT NULL UNIQUE,
    email           VARCHAR(100), -- Added email column
    pin_hash        VARCHAR(255),
    role            VARCHAR(20),
    full_name       VARCHAR(100),
    branch_id       INT,
    is_active       BOOLEAN DEFAULT TRUE
);

-- Products (Local Master)
CREATE TABLE products_local (
    product_id      BIGINT PRIMARY KEY,
    barcode         VARCHAR(50) UNIQUE NOT NULL,
    name            VARCHAR(200) NOT NULL,
    price           NUMERIC(15, 2) NOT NULL,
    tax_rate        NUMERIC(5, 2) DEFAULT 0,
    category        VARCHAR(50),
    stock           INT DEFAULT 0, -- Basic stock column
    is_active       BOOLEAN DEFAULT TRUE,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory (Local Tracking)
CREATE TABLE inventory_local (
    inventory_id    SERIAL PRIMARY KEY,
    branch_id       INT NOT NULL,
    product_id      BIGINT NOT NULL,
    qty_on_hand     INT NOT NULL DEFAULT 0,
    last_updated    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products_local(product_id)
);

-- Cashier Shifts
CREATE TABLE cash_shifts (
    shift_id        BIGSERIAL PRIMARY KEY,
    branch_id       INT NOT NULL,
    user_id         BIGINT REFERENCES users_local(user_id),
    start_time      TIMESTAMPTZ DEFAULT NOW(),
    end_time        TIMESTAMPTZ,
    start_cash      NUMERIC(15, 2) DEFAULT 0,
    end_cash_actual NUMERIC(15, 2) DEFAULT 0,
    end_cash_system NUMERIC(15, 2) DEFAULT 0,
    variance        NUMERIC(15, 2) DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'OPEN',
    synced          BOOLEAN DEFAULT FALSE
);

-- Transactions (Header)
CREATE TABLE transactions (
    transaction_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id        INT NOT NULL,
    shift_id         BIGINT REFERENCES cash_shifts(shift_id),
    user_id          BIGINT REFERENCES users_local(user_id),
    subtotal         NUMERIC(15, 2) NOT NULL,
    total_discount   NUMERIC(15, 2) DEFAULT 0,
    tax_amount       NUMERIC(15, 2) DEFAULT 0,
    grand_total      NUMERIC(15, 2) NOT NULL,
    payment_method   VARCHAR(50),
    payment_ref      VARCHAR(100),
    cash_received    NUMERIC(15, 2) DEFAULT 0,
    change_returned  NUMERIC(15, 2) DEFAULT 0,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    synced           BOOLEAN DEFAULT FALSE
);

-- Transaction Items (Detail)
CREATE TABLE transaction_items (
    item_id          BIGSERIAL PRIMARY KEY,
    transaction_uuid UUID REFERENCES transactions(transaction_uuid),
    product_id       BIGINT REFERENCES products_local(product_id),
    qty              INT NOT NULL,
    price_at_sale    NUMERIC(15, 2) NOT NULL,
    discount_amount  NUMERIC(15, 2) DEFAULT 0,
    subtotal         NUMERIC(15, 2) NOT NULL,
    notes            VARCHAR(100)
);

-- Upload Queue (Sync)
CREATE TABLE upload_queue (
    queue_id        BIGSERIAL PRIMARY KEY,
    table_name      VARCHAR(50) NOT NULL,
    record_uuid     UUID,
    record_id       BIGINT,
    operation       VARCHAR(10) NOT NULL,
    payload         JSONB NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    retry_count     INT DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'PENDING',
    error_message   TEXT
);

-- Defective Log
CREATE TABLE defective_log (
    id SERIAL PRIMARY KEY,
    product_id INT,
    name VARCHAR(255),
    qty INT,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. SEED DATA

-- Store Config
INSERT INTO store_config (branch_id, branch_code, store_name, store_address, last_sync_ts)
VALUES (101, 'JKT-001', 'Alfamart Jakarta Timur', 'Jl. Pemuda No. 1, Rawamangun', NOW());

-- Users
INSERT INTO users_local (user_id, username, email, pin_hash, role, full_name, branch_id)
VALUES 
(9001, 'ceo_budi', 'ceo@retail.id', '1234', 'SUPER_ADMIN', 'Budi Santoso', 0),
(9002, 'dir_siti', 'director@retail.id', '1234', 'SUPER_ADMIN', 'Siti Aminah', 0),
(8001, 'am_joko', 'am.jkt@retail.id', '1234', 'AREA_MANAGER', 'Joko Anwar', 0),
(8002, 'am_ridwan', 'am.bdg@retail.id', '1234', 'AREA_MANAGER', 'Ridwan Kamil KW', 0),
(7001, 'spv_rina', 'spv.jkt@retail.id', '1234', 'STORE_LEADER', 'Rina Nose', 101),
(7002, 'spv_sule', 'spv.bdg@retail.id', '1234', 'STORE_LEADER', 'Sule Prikitiw', 102),
(1001, 'agus_kasir', 'kasir1.jkt@retail.id', '1234', 'CASHIER', 'Agus Kotak', 101),
(1002, 'dewi_kasir', 'kasir2.jkt@retail.id', '1234', 'CASHIER', 'Dewi Persik', 101),
(2001, 'andre_kasir', 'kasir1.bdg@retail.id', '1234', 'CASHIER', 'Andre Taulany', 102),
(2002, 'nunung_kasir', 'kasir2.bdg@retail.id', '1234', 'CASHIER', 'Nunung', 102);

-- Products
INSERT INTO products_local (product_id, barcode, name, price, category, stock)
VALUES 
(1001, '8998866200578', 'Indomie Goreng Original', 3500, 'Food', 100),
(1002, '8999999195483', 'Aqua Botol 600ml', 4000, 'Beverage', 50),
(1003, '8991002101115', 'Rokok Sampoerna Mild 16', 32000, 'Cigarette', 200),
(1004, '8992775201004', 'Minyak Goreng Bimoli 2L', 45000, 'Household', 30),
(1005, '8993053121034', 'Kopi Kenangan Mantan', 9500, 'Beverage', 40),
(1006, '89999090903', 'Sari Roti Tawar Kupas', 15500.00, 'Bakery', 20),
(1007, '89999090906', 'Gula Pasir Gulaku 1kg', 15000.00, 'Staple', 60),
(1008, '89999090909', 'Chitato Sapi Panggang', 12500.00, 'Snack', 45),
(1009, '89999090910', 'Oreo Vanilla 137g', 9500.00, 'Snack', 55),
(1010, '89999090911', 'Ultra Milk Coklat 250ml', 7500.00, 'Dairy', 35);

-- Inventory (Seed from Products)
INSERT INTO inventory_local (branch_id, product_id, qty_on_hand)
SELECT 
    101, 
    product_id, 
    floor(random() * 45 + 5)::int 
FROM products_local;

-- Completed
