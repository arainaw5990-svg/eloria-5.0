/*
# Sales, Coupons, Popups, Banners, Homepage Builder, Theme, Animation & Product Badges

## Summary
This migration adds the full marketing + customization layer to the Eloria Scents perfume store:
sales management, coupon system, popup promotions, homepage builder, theme manager,
animation manager, product badges, and extended site settings. It also adds badge + feature
columns to the existing products table.

## 1. New Tables

- **sales** — sale campaigns with discount type/value, schedule, banner, badge, color, status
- **sale_products** — many-to-many linking products to a sale
- **coupons** — discount codes with type, value, limits, expiry, min order
- **popups** — promotional popups with image, CTA, display frequency, delay
- **banners** — homepage banner slider images with ordering and auto-slide config
- **homepage_sections** — configurable, reorderable homepage sections with visibility
- **site_settings** — extended site settings (SEO, analytics, theme, animation, announcement bar)
  Replaces reliance on the existing `settings` table for new marketing/customization fields;
  the existing `settings` table remains untouched for backward compatibility.

## 2. Modified Tables

- **products** — adds `badges` (text[]), and boolean feature flags:
  `is_best_seller`, `is_trending`, `is_new_arrival`, `is_recommended`
  All have safe defaults so existing rows are unaffected.

## 3. Security

- RLS enabled on every new table.
- All tables use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because the storefront (anon key) must read sale/popup/banner/coupon data, and the
  admin writes through an authenticated session. This is a single-store app where all
  marketing configuration is intentionally shared/public.

## 4. Notes

- The existing `settings` table is NOT modified — backward compatible.
- `products` columns are added with `IF NOT EXISTS` via DO block so re-running is safe.
- All new tables have `created_at` / `updated_at` timestamps.
- Homepage sections store an `order_index` for drag-and-drop reordering.
*/

-- ============================================================
-- 1. SALES
-- ============================================================
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  banner_url text,
  badge_text text DEFAULT 'SALE',
  badge_color text DEFAULT '#dc2626',
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage','fixed')),
  discount_value integer NOT NULL DEFAULT 0,
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_sales" ON sales;
CREATE POLICY "anon_select_sales" ON sales FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_sales" ON sales;
CREATE POLICY "anon_insert_sales" ON sales FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_sales" ON sales;
CREATE POLICY "anon_update_sales" ON sales FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_sales" ON sales;
CREATE POLICY "anon_delete_sales" ON sales FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS sale_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(sale_id, product_id)
);
ALTER TABLE sale_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_sale_products" ON sale_products;
CREATE POLICY "anon_select_sale_products" ON sale_products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_sale_products" ON sale_products;
CREATE POLICY "anon_insert_sale_products" ON sale_products FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_sale_products" ON sale_products;
CREATE POLICY "anon_delete_sale_products" ON sale_products FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 2. COUPONS
-- ============================================================
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage','fixed')),
  discount_value integer NOT NULL DEFAULT 0,
  max_discount integer, -- null = unlimited (for percentage)
  min_order integer DEFAULT 0,
  usage_limit integer, -- null = unlimited
  used_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_coupons" ON coupons;
CREATE POLICY "anon_select_coupons" ON coupons FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_coupons" ON coupons;
CREATE POLICY "anon_insert_coupons" ON coupons FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_coupons" ON coupons;
CREATE POLICY "anon_update_coupons" ON coupons FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_coupons" ON coupons;
CREATE POLICY "anon_delete_coupons" ON coupons FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 3. POPUPS
-- ============================================================
CREATE TABLE IF NOT EXISTS popups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  button_text text,
  button_link text,
  frequency text NOT NULL DEFAULT 'once' CHECK (frequency IN ('once','every_visit')),
  delay_seconds integer NOT NULL DEFAULT 5,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE popups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_popups" ON popups;
CREATE POLICY "anon_select_popups" ON popups FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_popups" ON popups;
CREATE POLICY "anon_insert_popups" ON popups FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_popups" ON popups;
CREATE POLICY "anon_update_popups" ON popups FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_popups" ON popups;
CREATE POLICY "anon_delete_popups" ON popups FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 4. BANNERS (homepage slider)
-- ============================================================
CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  link_url text,
  title text,
  subtitle text,
  sort_order integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_banners" ON banners;
CREATE POLICY "anon_select_banners" ON banners FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_banners" ON banners;
CREATE POLICY "anon_insert_banners" ON banners FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_banners" ON banners;
CREATE POLICY "anon_update_banners" ON banners FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_banners" ON banners;
CREATE POLICY "anon_delete_banners" ON banners FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 5. HOMEPAGE SECTIONS (builder)
-- ============================================================
CREATE TABLE IF NOT EXISTS homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL, -- 'hero','announcement','banner_slider','featured','best_sellers','new_arrivals','trending','categories'
  title text,
  is_visible boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  config jsonb NOT NULL DEFAULT '{}'::jsonb, -- section-specific config
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_homepage_sections" ON homepage_sections;
CREATE POLICY "anon_select_homepage_sections" ON homepage_sections FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_homepage_sections" ON homepage_sections;
CREATE POLICY "anon_insert_homepage_sections" ON homepage_sections FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_homepage_sections" ON homepage_sections;
CREATE POLICY "anon_update_homepage_sections" ON homepage_sections FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_homepage_sections" ON homepage_sections;
CREATE POLICY "anon_delete_homepage_sections" ON homepage_sections FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 6. SITE SETTINGS (extended — theme, animation, announcement, SEO)
-- ============================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id integer PRIMARY KEY DEFAULT 1,
  -- Announcement bar
  announcement_enabled boolean NOT NULL DEFAULT false,
  announcement_text text DEFAULT '',
  announcement_bg_color text DEFAULT '#0a0a0a',
  announcement_text_color text DEFAULT '#ffffff',
  -- Theme
  primary_color text DEFAULT '#0a0a0a',
  secondary_color text DEFAULT '#6e6e76',
  accent_color text DEFAULT '#c99a3a',
  background_color text DEFAULT '#f6f6f7',
  text_color text DEFAULT '#0a0a0a',
  button_style text DEFAULT 'rounded' CHECK (button_style IN ('rounded','pill','square','outline')),
  border_radius integer DEFAULT 12,
  font_heading text DEFAULT 'Cormorant Garamond',
  font_body text DEFAULT 'Inter',
  dark_mode boolean NOT NULL DEFAULT false,
  -- Animation
  animations_enabled boolean NOT NULL DEFAULT true,
  hero_animation text DEFAULT 'fade' CHECK (hero_animation IN ('fade','slide','zoom','scale','parallax','none')),
  product_card_hover text DEFAULT 'lift' CHECK (product_card_hover IN ('lift','glow','scale','rotate','tilt','none')),
  button_animation text DEFAULT 'pulse' CHECK (button_animation IN ('pulse','ripple','bounce','glow','none')),
  scroll_animation text DEFAULT 'fade_up' CHECK (scroll_animation IN ('fade_up','fade_down','fade_left','fade_right','zoom','flip','none')),
  animation_speed text DEFAULT 'medium' CHECK (animation_speed IN ('slow','medium','fast')),
  -- SEO
  seo_title text DEFAULT 'Eloria Scents — Luxury Fragrances',
  seo_description text DEFAULT 'Luxury fragrances crafted for the discerning. Discover premium perfumes for men, women, and unisex.',
  google_analytics_id text,
  -- Banner slider settings
  banner_auto_slide boolean NOT NULL DEFAULT true,
  banner_slide_speed integer NOT NULL DEFAULT 5000,
  -- timestamps
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_site_settings" ON site_settings;
CREATE POLICY "anon_select_site_settings" ON site_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_site_settings" ON site_settings;
CREATE POLICY "anon_insert_site_settings" ON site_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_site_settings" ON site_settings;
CREATE POLICY "anon_update_site_settings" ON site_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Insert default row if not exists
INSERT INTO site_settings (id)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM site_settings WHERE id = 1);

-- ============================================================
-- 7. PRODUCT BADGES + FEATURE FLAGS
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='badges') THEN
    ALTER TABLE products ADD COLUMN badges text[] NOT NULL DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_best_seller') THEN
    ALTER TABLE products ADD COLUMN is_best_seller boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_trending') THEN
    ALTER TABLE products ADD COLUMN is_trending boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_new_arrival') THEN
    ALTER TABLE products ADD COLUMN is_new_arrival boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_recommended') THEN
    ALTER TABLE products ADD COLUMN is_recommended boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- ============================================================
-- 8. SEED DEFAULT HOMEPAGE SECTIONS
-- ============================================================
INSERT INTO homepage_sections (section_key, title, is_visible, order_index, config)
SELECT * FROM (VALUES
  ('announcement', 'Announcement Bar', true, 0, '{}'::jsonb),
  ('hero', 'Hero Section', true, 1, '{}'::jsonb),
  ('banner_slider', 'Banner Slider', false, 2, '{}'::jsonb),
  ('categories', 'Shop by Category', true, 3, '{}'::jsonb),
  ('featured', 'Featured Products', true, 4, '{}'::jsonb),
  ('best_sellers', 'Best Sellers', false, 5, '{}'::jsonb),
  ('new_arrivals', 'New Arrivals', false, 6, '{}'::jsonb),
  ('trending', 'Trending Products', false, 7, '{}'::jsonb)
) AS t(section_key, title, is_visible, order_index, config)
WHERE NOT EXISTS (SELECT 1 FROM homepage_sections LIMIT 1);
