-- =========================================================
-- SEED DATA: TIDB CLOUD (GLOBAL HQ)
-- =========================================================
USE retail_cloud_hq;

-- 1. Master Cabang
INSERT INTO branches (branch_id, branch_code, branch_name, region_name, address) VALUES
                                                                                     (101, 'JKT-001', 'Alfamart Cilandak KKO', 'JABODETABEK', 'Jakarta Selatan'),
                                                                                     (102, 'BDG-001', 'Alfamart Dago Atas', 'JAWA BARAT', 'Bandung Kota');

-- 2. Master Karyawan (ID 4 Digit sesuai request)
-- 9xxx: Eksekutif, 8xxx: Manager, 7xxx: SPV, 1xxx: Kasir
INSERT INTO employees (user_id, branch_id, username, password_hash, role) VALUES
                                                                              (9001, NULL, 'ceo_budi', '1234', 'CEO'),
                                                                              (9002, NULL, 'dir_siti', '1234', 'DIRECTOR'),
                                                                              (8001, NULL, 'am_joko', '1234', 'AREA_MANAGER'),
                                                                              (8002, NULL, 'am_ridwan', '1234', 'AREA_MANAGER'),
                                                                              (7001, 101,  'spv_rina', '1234', 'STORE_SUPERVISOR'),
                                                                              (7002, 102,  'spv_sule', '1234', 'STORE_SUPERVISOR'),
                                                                              (1001, 101,  'agus_kasir', '1234', 'CASHIER'),
                                                                              (1002, 101,  'dewi_kasir', '1234', 'CASHIER'),
                                                                              (2001, 102,  'andre_kasir', '1234', 'CASHIER'),
                                                                              (2002, 102,  'nunung_kasir', '1234', 'CASHIER');

-- 3. Master Produk Global (Alfamart Style)
INSERT INTO products_global (product_id, barcode, name, base_price, category) VALUES
                                                                                  (1, '89999090901', 'Aqua Botol 600ml', 3000, 'BEVERAGE'),
                                                                                  (2, '89999090902', 'Indomie Goreng Original', 2800, 'FOOD'),
                                                                                  (3, '89999090903', 'Sari Roti Tawar Kupas', 14000, 'BAKERY'),
                                                                                  (4, '89999090904', 'Teh Pucuk Harum 350ml', 3500, 'BEVERAGE'),
                                                                                  (5, '89999090905', 'Minyak Goreng Bimoli 2L', 38000, 'STAPLE'),
                                                                                  (6, '89999090906', 'Gula Pasir Gulaku 1kg', 13500, 'STAPLE'),
                                                                                  (7, '89999090907', 'Sampoerna Mild 16', 31000, 'CIGARETTE'),
                                                                                  (8, '89999090908', 'Marlboro Red 20', 42000, 'CIGARETTE'),
                                                                                  (9, '89999090909', 'Chitato Sapi Panggang', 11000, 'SNACK'),
                                                                                  (10, '89999090910', 'Oreo Vanilla 137g', 8500, 'SNACK'),
                                                                                  (11, '89999090911', 'Ultra Milk Coklat 250ml', 6500, 'DAIRY'),
                                                                                  (12, '89999090912', 'Telur Ayam Negeri (Pack 10)', 24000, 'FRESH'),
                                                                                  (13, '89999090913', 'Pepsodent White 190g', 12000, 'PERSONAL_CARE'),
                                                                                  (14, '89999090914', 'Lifebuoy Body Wash 450ml', 22000, 'PERSONAL_CARE'),
                                                                                  (15, '89999090915', 'Kopi Kapal Api Special 165g', 13000, 'BEVERAGE');

-- 4. Harga Per Zona (Jakarta lebih mahal dikit dari Bandung untuk Sewa tempat :D)
INSERT INTO product_prices_zone (product_id, region_name, sell_price)
SELECT product_id, 'JABODETABEK', base_price * 1.15 FROM products_global; -- Margin 15%

INSERT INTO product_prices_zone (product_id, region_name, sell_price)
SELECT product_id, 'JAWA BARAT', base_price * 1.12 FROM products_global; -- Margin 12%

-- 5. GENERATE 200 DATA TRANSAKSI CONSOLIDATED (Teknik MySQL CTE Generator)
-- Ini mensimulasikan data yang sudah naik dari toko lokal ke Cloud
INSERT INTO consolidated_transactions (transaction_uuid, branch_id, shift_id, total_amount, payment_method, trx_date_local)
WITH RECURSIVE seq AS (
    SELECT 1 AS n
    UNION ALL
    SELECT n + 1 FROM seq WHERE n < 200
)
SELECT
    UUID(), -- Generate random UUID
    IF(n % 2 = 0, 101, 102), -- Ganti-ganti cabang ID 101 dan 102
    1000 + n, -- Dummy Shift ID
    FLOOR(10000 + (RAND() * 100000)), -- Random Total Belanja 10rb - 100rb
    ELT(1 + FLOOR(RAND() * 3), 'CASH', 'QRIS', 'DEBIT'), -- Random Payment
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY) -- Tanggal acak 30 hari terakhir
FROM seq;

-- 6. Generate Detail Items untuk Transaksi tadi
INSERT INTO consolidated_items (transaction_uuid, product_id, qty, final_price, subtotal)
SELECT
    t.transaction_uuid,
    (FLOOR(1 + RAND() * 15)), -- Random Product ID 1-15
    (FLOOR(1 + RAND() * 3)), -- Qty 1-3
    5000, -- Dummy Price for bulk insert simplification
    (5000 * (FLOOR(1 + RAND() * 3)))
FROM consolidated_transactions t;