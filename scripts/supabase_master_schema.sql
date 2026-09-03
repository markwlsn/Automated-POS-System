-- ====================================================================
-- Automated Meat Shop POS System: Master PostgreSQL / Supabase Schema
-- ====================================================================
-- Run this script in your Supabase Project -> SQL Editor to initialize
-- all tables, relationships, indexes, RLS policies, and seed data.
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Shops Table (Multi-tenant foundation)
CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Branches Table
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. User Profiles Table (Linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('owner', 'staff', 'customer')),
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Product Categories Table
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_per_kg NUMERIC(10, 2) NOT NULL CHECK (price_per_kg >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Inventory Table (Per branch stock tracking)
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  stock_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (stock_kg >= 0),
  low_stock_threshold_kg NUMERIC(10, 2) NOT NULL DEFAULT 5.00 CHECK (low_stock_threshold_kg >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(branch_id, product_id)
);

-- 8. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL UNIQUE,
  order_type TEXT NOT NULL DEFAULT 'walk_in' CHECK (order_type IN ('walk_in', 'online', 'kiosk')),
  fulfillment_type TEXT NOT NULL DEFAULT 'pickup' CHECK (fulfillment_type IN ('pickup', 'dine_in', 'delivery')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'preparing', 'completed', 'cancelled')),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'gcash', 'maya', 'bank_transfer')),
  payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  weight_kg NUMERIC(10, 2) NOT NULL CHECK (weight_kg > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0)
);

-- 10. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  cash_received NUMERIC(10, 2),
  change NUMERIC(10, 2),
  reference_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Receipts Table
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Customer Queue Tickets Table
CREATE TABLE IF NOT EXISTS public.queue_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  ticket_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'calling', 'serving', 'completed', 'cancelled')),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Activity Audit Log Table
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_branch ON public.inventory(branch_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_branch_date ON public.orders(branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_queue_branch_status ON public.queue_tickets(branch_id, status);

-- 15. Enable Row Level Security (RLS)
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- 16. Default RLS Policies (Allow Read for Active Catalog)
CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view product categories" ON public.product_categories
  FOR SELECT USING (true);

CREATE POLICY "Public can view shops and branches" ON public.shops
  FOR SELECT USING (true);

CREATE POLICY "Public can view branches" ON public.branches
  FOR SELECT USING (true);

-- ====================================================================
-- Seed Initial Demo Data
-- ====================================================================

-- Demo Shop: Dela Cruz Meat Shop
INSERT INTO public.shops (id, name, code)
VALUES ('11111111-1111-1111-1111-111111111111', 'Dela Cruz Meat Shop', 'DCMS')
ON CONFLICT (id) DO NOTHING;

-- Demo Branch: Poblacion Main Branch
INSERT INTO public.branches (id, shop_id, name, code, address)
VALUES ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Main Branch - Poblacion', 'BRANCH', '123 Rizal St, Poblacion')
ON CONFLICT (id) DO NOTHING;

-- Demo Categories
INSERT INTO public.product_categories (id, shop_id, name, sort_order)
VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Pork', 1),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Beef', 2),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Chicken', 3)
ON CONFLICT (id) DO NOTHING;

-- Demo Products
INSERT INTO public.products (id, shop_id, category_id, name, price_per_kg, is_active)
VALUES
('10000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Pork Liempo', 380.00, true),
('10000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Pork Kasim', 340.00, true),
('10000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Pork Chop', 350.00, true),
('10000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Pork Ribs', 360.00, true),
('10000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Beef Brisket', 460.00, true),
('10000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Beef Shank (Bulalo)', 420.00, true),
('10000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Beef Ribeye', 680.00, true),
('10000000-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Whole Chicken', 220.00, true),
('10000000-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Chicken Breast (Boneless)', 250.00, true),
('10000000-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Chicken Wings', 240.00, true)
ON CONFLICT (id) DO NOTHING;

-- Demo Inventory
INSERT INTO public.inventory (branch_id, product_id, stock_kg, low_stock_threshold_kg)
VALUES
('22222222-2222-2222-2222-222222222222', '10000000-0000-0000-0000-000000000001', 45.00, 10.00),
('22222222-2222-2222-2222-222222222222', '10000000-0000-0000-0000-000000000002', 35.00, 10.00),
('22222222-2222-2222-2222-222222222222', '10000000-0000-0000-0000-000000000003', 25.00, 5.00),
('22222222-2222-2222-2222-222222222222', '10000000-0000-0000-0000-000000000004', 20.00, 5.00),
('22222222-2222-2222-2222-222222222222', '10000000-0000-0000-0000-000000000005', 30.00, 8.00),
('22222222-2222-2222-2222-222222222222', '10000000-0000-0000-0000-000000000006', 25.00, 8.00),
('22222222-2222-2222-2222-222222222222', '10000000-0000-0000-0000-000000000007', 15.00, 5.00),
('22222222-2222-2222-2222-222222222222', '10000000-0000-0000-0000-000000000008', 50.00, 15.00),
('22222222-2222-2222-2222-222222222222', '10000000-0000-0000-0000-000000000009', 30.00, 10.00),
('22222222-2222-2222-2222-222222222222', '10000000-0000-0000-0000-000000000010', 25.00, 10.00)
ON CONFLICT (branch_id, product_id) DO NOTHING;
