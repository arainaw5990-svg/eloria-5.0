/*
# Security Hardening — Fix function search paths, RLS policies, and storage listing

## 1. Function Search Path Mutable (8 functions)
All functions recreated with `SET search_path = public, pg_temp` to prevent
search_path hijacking attacks where a malicious temp schema could shadow objects.

## 2. RLS Policy Always True (admin INSERT/UPDATE/DELETE)
All admin write policies previously used `USING (true)` / `WITH CHECK (true)`,
meaning ANY authenticated user had full access. Now they require `is_admin()`
which checks `auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'`.

The admin-setup edge function sets `app_metadata: { role: 'admin' }` on the
admin account, so only the designated admin can write to these tables.

Affected tables: categories, products, reviews, orders, order_status_history,
customers, settings.

## 3. Anon INSERT Validation (orders, reviews)
- `anon_insert_orders`: WITH CHECK now requires status='pending', total>=0,
  subtotal>=0, delivery_fee>=0. Prevents customers from creating orders with
  arbitrary statuses or negative amounts via direct API calls.
- `anon_insert_reviews`: WITH CHECK now requires rating between 1-5,
  product_id NOT NULL, customer_name NOT NULL. Ensures only valid reviews.

## 4. SECURITY DEFINER on trigger functions
`orders_insert_fn` and `orders_status_fn` now run as SECURITY DEFINER so they
can insert into `customers` and `order_status_history` tables (which are
admin-only) when an anon customer places an order. Without this, the trigger
would fail because the anon user has no INSERT policy on those tables.

## 5. Public Bucket Listing (storage)
Dropped broad SELECT policies on `storage.objects` for `products` and `brand`
buckets. Public buckets serve files via public URLs without any SELECT policy.
The SELECT policy only enabled API-level bucket listing, which exposed the
full file inventory. Removing it does NOT break public URL access.

## 6. New helper function
`is_admin()` — SECURITY INVOKER, reads JWT app_metadata. Used by all admin
write policies.
*/

-- ============ HELPER: is_admin() ============
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  )
$$;

-- ============ FIX FUNCTION SEARCH PATHS ============

CREATE OR REPLACE FUNCTION slugify(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT lower(regexp_replace(regexp_replace(coalesce(input, ''), '[^a-zA-Z0-9]+', ' ', 'g'), '\s+', '-', 'g'))
$$;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public, pg_temp
AS $$
  SELECT 'ES-' || to_char(now(), 'YYYYMMDD') || '-' || lpad((nextval('order_number_seq') % 10000)::text, 4, '0')
$$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION products_slug_fn()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := slugify(NEW.name);
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION categories_slug_fn()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := slugify(NEW.name);
  END IF;
  RETURN NEW;
END $$;

-- SECURITY DEFINER: needs to insert into customers + order_status_history
-- which are admin-only tables. The anon customer placing an order has no
-- INSERT policy on those tables, so the trigger must run as the owner.
CREATE OR REPLACE FUNCTION orders_insert_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO customers (name, phone, city, last_order_at)
  VALUES (NEW.customer_name, NEW.phone, NEW.city, now())
  ON CONFLICT (phone) DO UPDATE
    SET name = EXCLUDED.name, city = EXCLUDED.city, last_order_at = now();

  INSERT INTO order_status_history (order_id, status, note)
  VALUES (NEW.id, NEW.status, 'Order placed');

  RETURN NEW;
END $$;

-- SECURITY DEFINER: same reason — inserts into order_status_history
CREATE OR REPLACE FUNCTION orders_status_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO order_status_history (order_id, status)
    VALUES (NEW.id, NEW.status);
  END IF;
  RETURN NEW;
END $$;

-- ============ RLS POLICY FIXES: ADMIN WRITE POLICIES ============

-- CATEGORIES
DROP POLICY IF EXISTS "auth_insert_categories" ON categories;
CREATE POLICY "auth_insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_update_categories" ON categories;
CREATE POLICY "auth_update_categories" ON categories FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_delete_categories" ON categories;
CREATE POLICY "auth_delete_categories" ON categories FOR DELETE
  TO authenticated USING (is_admin());

-- PRODUCTS
DROP POLICY IF EXISTS "auth_insert_products" ON products;
CREATE POLICY "auth_insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_update_products" ON products;
CREATE POLICY "auth_update_products" ON products FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_delete_products" ON products;
CREATE POLICY "auth_delete_products" ON products FOR DELETE
  TO authenticated USING (is_admin());

-- REVIEWS
DROP POLICY IF EXISTS "auth_update_reviews" ON reviews;
CREATE POLICY "auth_update_reviews" ON reviews FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_delete_reviews" ON reviews;
CREATE POLICY "auth_delete_reviews" ON reviews FOR DELETE
  TO authenticated USING (is_admin());

-- ORDERS
DROP POLICY IF EXISTS "auth_update_orders" ON orders;
CREATE POLICY "auth_update_orders" ON orders FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_delete_orders" ON orders;
CREATE POLICY "auth_delete_orders" ON orders FOR DELETE
  TO authenticated USING (is_admin());

-- ORDER STATUS HISTORY
DROP POLICY IF EXISTS "auth_insert_order_history" ON order_status_history;
CREATE POLICY "auth_insert_order_history" ON order_status_history FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_delete_order_history" ON order_status_history;
CREATE POLICY "auth_delete_order_history" ON order_status_history FOR DELETE
  TO authenticated USING (is_admin());

-- CUSTOMERS
DROP POLICY IF EXISTS "auth_insert_customers" ON customers;
CREATE POLICY "auth_insert_customers" ON customers FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_update_customers" ON customers;
CREATE POLICY "auth_update_customers" ON customers FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "auth_delete_customers" ON customers;
CREATE POLICY "auth_delete_customers" ON customers FOR DELETE
  TO authenticated USING (is_admin());

-- SETTINGS
DROP POLICY IF EXISTS "auth_update_settings" ON settings;
CREATE POLICY "auth_update_settings" ON settings FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ============ RLS POLICY FIXES: ANON INSERT VALIDATION ============

-- ORDERS: validate status is pending and amounts are non-negative
DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND total >= 0
    AND subtotal >= 0
    AND delivery_fee >= 0
    AND customer_name IS NOT NULL
    AND phone IS NOT NULL
    AND city IS NOT NULL
    AND address IS NOT NULL
  );

-- REVIEWS: validate rating range and required fields
DROP POLICY IF EXISTS "anon_insert_reviews" ON reviews;
CREATE POLICY "anon_insert_reviews" ON reviews FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    rating >= 1 AND rating <= 5
    AND customer_name IS NOT NULL
    AND product_id IS NOT NULL
  );

-- ============ STORAGE: REMOVE BROAD SELECT POLICIES ============
-- Public buckets serve files via public URLs without SELECT policies.
-- These policies only enabled API-level listing, exposing file inventories.

DROP POLICY IF EXISTS "anon_read_products_bucket" ON storage.objects;
DROP POLICY IF EXISTS "anon_read_brand_bucket" ON storage.objects;
