-- 001_seed_data.sql
-- Seed data for Dela Cruz Meat Shop

INSERT OR IGNORE INTO shops (id, name, code)
VALUES ('11111111-1111-1111-1111-111111111111', 'Dela Cruz Meat Shop', 'DCMS');

INSERT OR IGNORE INTO branches (id, shop_id, name, code, address)
VALUES ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Main Branch - Poblacion', 'BRANCH', '123 Rizal St, Poblacion');

-- Seed Users: owner@test.com, staff@test.com, customer@test.com (Password: Password123!)
INSERT OR IGNORE INTO profiles (id, email, password_hash, role, branch_id, full_name, phone_number)
VALUES
('u-owner-001', 'owner@test.com', '$2a$10$WiJWwsVQmwlf9JVj58KFk.0Q/RQrQAS5t4tbkLCRg6iXTCmlrcrcO', 'owner', '22222222-2222-2222-2222-222222222222', 'Eduardo Dela Cruz', '09170000001'),
('u-staff-001', 'staff@test.com', '$2a$10$WiJWwsVQmwlf9JVj58KFk.0Q/RQrQAS5t4tbkLCRg6iXTCmlrcrcO', 'staff', '22222222-2222-2222-2222-222222222222', 'Maria Santos', '09170000002'),
('u-customer-001', 'customer@test.com', '$2a$10$WiJWwsVQmwlf9JVj58KFk.0Q/RQrQAS5t4tbkLCRg6iXTCmlrcrcO', 'customer', NULL, 'Juan Dela Cruz', '09170000003');

-- Seed Categories
INSERT OR IGNORE INTO product_categories (id, shop_id, name, sort_order)
VALUES
('cat-pork', '11111111-1111-1111-1111-111111111111', 'Pork', 1),
('cat-beef', '11111111-1111-1111-1111-111111111111', 'Beef', 2),
('cat-chicken', '11111111-1111-1111-1111-111111111111', 'Chicken', 3);

-- Seed Products
INSERT OR IGNORE INTO products (id, shop_id, category_id, name, price_per_kg, is_active)
VALUES
('prod-pork-liempo', '11111111-1111-1111-1111-111111111111', 'cat-pork', 'Pork Liempo', 380.00, 1),
('prod-pork-kasim', '11111111-1111-1111-1111-111111111111', 'cat-pork', 'Pork Kasim', 340.00, 1),
('prod-pork-chop', '11111111-1111-1111-1111-111111111111', 'cat-pork', 'Pork Chop', 350.00, 1),
('prod-pork-ribs', '11111111-1111-1111-1111-111111111111', 'cat-pork', 'Pork Ribs', 360.00, 1),
('prod-beef-brisket', '11111111-1111-1111-1111-111111111111', 'cat-beef', 'Beef Brisket', 460.00, 1),
('prod-beef-shank', '11111111-1111-1111-1111-111111111111', 'cat-beef', 'Beef Shank (Bulalo)', 420.00, 1),
('prod-beef-ribeye', '11111111-1111-1111-1111-111111111111', 'cat-beef', 'Beef Ribeye', 680.00, 1),
('prod-chicken-whole', '11111111-1111-1111-1111-111111111111', 'cat-chicken', 'Whole Chicken', 220.00, 1),
('prod-chicken-breast', '11111111-1111-1111-1111-111111111111', 'cat-chicken', 'Chicken Breast (Boneless)', 250.00, 1),
('prod-chicken-wings', '11111111-1111-1111-1111-111111111111', 'cat-chicken', 'Chicken Wings', 240.00, 1);

-- Seed Inventory for Main Branch
INSERT OR IGNORE INTO inventory (id, branch_id, product_id, stock_kg, low_stock_threshold_kg)
VALUES
('inv-01', '22222222-2222-2222-2222-222222222222', 'prod-pork-liempo', 45.0, 10.0),
('inv-02', '22222222-2222-2222-2222-222222222222', 'prod-pork-kasim', 35.0, 10.0),
('inv-03', '22222222-2222-2222-2222-222222222222', 'prod-pork-chop', 25.0, 5.0),
('inv-04', '22222222-2222-2222-2222-222222222222', 'prod-pork-ribs', 20.0, 5.0),
('inv-05', '22222222-2222-2222-2222-222222222222', 'prod-beef-brisket', 30.0, 8.0),
('inv-06', '22222222-2222-2222-2222-222222222222', 'prod-beef-shank', 25.0, 8.0),
('inv-07', '22222222-2222-2222-2222-222222222222', 'prod-beef-ribeye', 15.0, 5.0),
('inv-08', '22222222-2222-2222-2222-222222222222', 'prod-chicken-whole', 50.0, 15.0),
('inv-09', '22222222-2222-2222-2222-222222222222', 'prod-chicken-breast', 30.0, 10.0),
('inv-10', '22222222-2222-2222-2222-222222222222', 'prod-chicken-wings', 25.0, 10.0);
