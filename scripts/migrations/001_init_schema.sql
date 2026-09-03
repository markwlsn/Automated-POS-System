-- 001_init_schema.sql
-- Automated Meat Shop POS System Database Schema

CREATE TABLE IF NOT EXISTS shops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'staff', 'customer')),
  branch_id TEXT REFERENCES branches(id),
  full_name TEXT NOT NULL,
  phone_number TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS product_categories (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id),
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id),
  category_id TEXT NOT NULL REFERENCES product_categories(id),
  name TEXT NOT NULL,
  price_per_kg REAL NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  stock_kg REAL NOT NULL DEFAULT 0.0,
  low_stock_threshold_kg REAL NOT NULL DEFAULT 5.0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(branch_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id),
  branch_id TEXT NOT NULL REFERENCES branches(id),
  customer_id TEXT REFERENCES profiles(id),
  created_by TEXT REFERENCES profiles(id),
  order_number TEXT NOT NULL UNIQUE,
  order_type TEXT NOT NULL DEFAULT 'walk_in',
  fulfillment_type TEXT NOT NULL DEFAULT 'pickup',
  status TEXT NOT NULL DEFAULT 'completed',
  total_amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'paid',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  weight_kg REAL NOT NULL,
  unit_price REAL NOT NULL,
  subtotal REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  amount REAL NOT NULL,
  cash_received REAL,
  change REAL,
  reference_number TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL UNIQUE,
  issued_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS queue_tickets (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES branches(id),
  customer_name TEXT NOT NULL,
  ticket_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'calling', 'serving', 'completed', 'cancelled')),
  order_id TEXT REFERENCES orders(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id),
  actor_id TEXT REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_inventory_branch ON inventory(branch_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_branch_date ON orders(branch_id, created_at);
CREATE INDEX IF NOT EXISTS idx_queue_branch_status ON queue_tickets(branch_id, status);
