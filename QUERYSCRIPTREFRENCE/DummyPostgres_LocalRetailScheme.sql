-- =========================================================
-- 0. RESET / BERSIHKAN DATA LAMA (AGAR TIDAK DUPLICATE ERROR)
-- =========================================================

-- Perintah ini menghapus isi data tapi MEMPERTAHANKAN struktur tabel
-- RESTART IDENTITY: Mereset urutan ID (Serial) kembali ke 1
-- CASCADE: Menghapus data di tabel lain yang berhubungan (Foreign Key)

TRUNCATE TABLE
    upload_queue,
    transaction_items,
    transactions,
    cash_shifts,
    inventory_local,
    products_local,
    users_local,
    store_config
    RESTART IDENTITY CASCADE;


-- =========================================================
-- 1. INSERT CONFIG TOKO & USER
-- =========================================================

INSERT INTO store_config (branch_id, branch_code, store_name, store_address, last_sync_ts)
VALUES (101, 'JKT-001', 'Alfamart Cilandak KKO', 'Jl. Cilandak KKO No. 5', NOW());

INSERT INTO users_local (user_id, username, pin_hash, role, full_name) VALUES
                                                                           (7001, 'spv_rina', '1234', 'STORE_MANAGER', 'Rina Nose'),
                                                                           (1001, 'agus_kasir', '1234', 'CASHIER', 'Agus Kotak'),
                                                                           (1002, 'dewi_kasir', '1234', 'CASHIER', 'Dewi Persik');


-- =========================================================
-- 2. INSERT MASTER PRODUK (SYNC DARI PUSAT)
-- =========================================================

INSERT INTO products_local (product_id, barcode, name, price, category) VALUES
                                                                            (1, '89999090901', 'Aqua Botol 600ml', 3500.00, 'BEVERAGE'),
                                                                            (2, '89999090902', 'Indomie Goreng Original', 3100.00, 'FOOD'),
                                                                            (3, '89999090903', 'Sari Roti Tawar Kupas', 15500.00, 'BAKERY'),
                                                                            (4, '89999090904', 'Teh Pucuk Harum 350ml', 4000.00, 'BEVERAGE'),
                                                                            (5, '89999090905', 'Minyak Goreng Bimoli 2L', 42000.00, 'STAPLE'),
                                                                            (6, '89999090906', 'Gula Pasir Gulaku 1kg', 15000.00, 'STAPLE'),
                                                                            (7, '89999090907', 'Sampoerna Mild 16', 34000.00, 'CIGARETTE'),
                                                                            (8, '89999090908', 'Marlboro Red 20', 45000.00, 'CIGARETTE'),
                                                                            (9, '89999090909', 'Chitato Sapi Panggang', 12500.00, 'SNACK'),
                                                                            (10, '89999090910', 'Oreo Vanilla 137g', 9500.00, 'SNACK'),
                                                                            (11, '89999090911', 'Ultra Milk Coklat 250ml', 7500.00, 'DAIRY'),
                                                                            (12, '89999090912', 'Telur Ayam Negeri (Pack 10)', 26000.00, 'FRESH'),
                                                                            (13, '89999090913', 'Pepsodent White 190g', 13500.00, 'PERSONAL_CARE'),
                                                                            (14, '89999090914', 'Lifebuoy Body Wash 450ml', 24000.00, 'PERSONAL_CARE'),
                                                                            (15, '89999090915', 'Kopi Kapal Api Special 165g', 14500.00, 'BEVERAGE');


-- =========================================================
-- 3. INSERT SHIFT KASIR
-- =========================================================

INSERT INTO cash_shifts (branch_id, user_id, start_time, end_time, start_cash, end_cash_actual, status)
VALUES
    (101, 1001, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '8 hours', 200000, 1500000, 'CLOSED'),
    (101, 1002, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '8 hours', 200000, 1800000, 'CLOSED'),
    (101, 1001, NOW(), NULL, 200000, 0, 'OPEN');


-- =========================================================
-- 4. GENERATE 200 TRANSAKSI (COMPLEX LOGIC)
-- =========================================================

DO $$
    DECLARE
        i INT;
        v_trx_uuid UUID;
        v_user_id BIGINT;
        v_total NUMERIC;
        v_payment TEXT;
        v_prod_id BIGINT;
        v_qty INT;
        v_price NUMERIC;
        v_subtotal NUMERIC;
    BEGIN
        -- Loop 200 kali
        FOR i IN 1..200 LOOP

                -- A. Random User & Payment
                v_user_id := CASE WHEN (random() > 0.5) THEN 1001 ELSE 1002 END;
                v_payment := (ARRAY['CASH', 'QRIS_BCA', 'DEBIT_MANDIRI', 'SHOPEEPAY'])[floor(random() * 4 + 1)];

                -- B. Insert Header Awal
                INSERT INTO transactions (
                    branch_id, shift_id, user_id,
                    subtotal, grand_total,
                    payment_method, cash_received, created_at, synced
                ) VALUES (
                             101,
                             (SELECT shift_id FROM cash_shifts ORDER BY shift_id DESC LIMIT 1),
                             v_user_id,
                             0, 0,
                             v_payment,
                             0,
                             NOW() - (floor(random() * 48) || ' hours')::INTERVAL,
                             (random() > 0.2)
                         ) RETURNING transaction_uuid INTO v_trx_uuid;

                -- C. Insert Detail Barang (1-5 item per struk)
                v_total := 0;

                FOR j IN 1..(floor(random() * 5 + 1)::INT) LOOP
                        SELECT product_id, price INTO v_prod_id, v_price
                        FROM products_local ORDER BY random() LIMIT 1;

                        v_qty := floor(random() * 3 + 1)::INT;
                        v_subtotal := v_qty * v_price;
                        v_total := v_total + v_subtotal;

                        INSERT INTO transaction_items (
                            transaction_uuid, product_id, qty, price_at_sale, subtotal
                        ) VALUES (
                                     v_trx_uuid, v_prod_id, v_qty, v_price, v_subtotal
                                 );
                    END LOOP;

                -- D. Update Total Belanja di Header
                UPDATE transactions
                SET subtotal = v_total,
                    grand_total = v_total,
                    cash_received = CASE WHEN v_payment = 'CASH' THEN (ceil(v_total / 5000.0) * 5000) ELSE v_total END,
                    change_returned = CASE WHEN v_payment = 'CASH' THEN ((ceil(v_total / 5000.0) * 5000) - v_total) ELSE 0 END
                WHERE transaction_uuid = v_trx_uuid;

                -- E. Masuk Queue Upload
                INSERT INTO upload_queue (table_name, record_uuid, operation, payload, status)
                VALUES ('transactions', v_trx_uuid, 'INSERT', '{"notes": "auto-gen"}'::jsonb, 'PENDING');

            END LOOP;
    END $$;