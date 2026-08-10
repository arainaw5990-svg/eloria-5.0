/*
# Reviews Enhancement + Custom Scent System + Tester Kit + Return Policy

## Summary
This migration enhances the existing reviews system to support admin-created reviews with
ordering and visibility, and adds the full "Create Your Own Scent" system (fragrances,
bottle sizes, oil concentrations), a tester kit system, and new homepage sections.

## 1. Modified Tables

- **reviews** — adds `sort_order` (integer, default 0) for admin-controlled ordering,
  `is_visible` (boolean, default true) for show/hide toggle, `review_date` (timestamptz,
  nullable) so admin can set a custom display date. The existing `product_id` column is
  made nullable so reviews can be standalone (not tied to a product) for the homepage
  reviews section. Existing rows are unaffected — all new columns have safe defaults.

## 2. New Tables

- **custom_scent_fragrances** — fragrances searchable in "Create Your Own Scent" (e.g.
  Creed Aventus, Dior Sauvage). Has name, is_enabled, sort_order.
- **bottle_sizes** — bottle size options (e.g. 10ml, 20ml, 30ml, 50ml, 100ml). Has
  label (display text), volume_ml (integer), sort_order.
- **concentrations** — oil concentration percentages (e.g. 15%, 20%, 25%...50%). Has
  percentage (integer), is_enabled, sort_order.
- **tester_fragrances** — fragrances selectable in "Create Your Own Tester Kit". Has
  name, is_enabled, sort_order. Separate from custom_scent_fragrances because the two
  lists are managed independently per the spec.

## 3. Homepage Sections

New section keys are seeded into homepage_sections: 'reviews', 'create_your_scent',
'tester_kit', 'return_policy'. They default to visible=false so the admin can enable
them from the Homepage Builder when ready.

## 4. Security

- RLS enabled on every new table with `TO anon, authenticated` and `USING (true)` /
  `WITH CHECK (true)` — this is a single-store app where all marketing content is
  intentionally public/shared. The anon-key storefront must read these tables, and
  the authenticated admin writes to them.
- Existing reviews RLS policies are NOT modified (only columns are added).

## 5. Notes

- The `reviews.product_id` column is altered to nullable — this does NOT lose data;
  existing rows keep their product_id values. New admin-created reviews can omit it.
- All new tables use IF NOT EXISTS for idempotency.
- Seed data is inserted with WHERE NOT EXISTS checks so re-runs are safe.
*/

-- ============================================================
-- 1. MODIFY REVIEWS TABLE — add ordering, visibility, date
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='sort_order') THEN
    ALTER TABLE reviews ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='is_visible') THEN
    ALTER TABLE reviews ADD COLUMN is_visible boolean NOT NULL DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='review_date') THEN
    ALTER TABLE reviews ADD COLUMN review_date timestamptz;
  END IF;
  -- Make product_id nullable so admin can create standalone homepage reviews
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='product_id' AND is_nullable='NO') THEN
    ALTER TABLE reviews ALTER COLUMN product_id DROP NOT NULL;
  END IF;
END $$;

-- Update existing reviews: make approved ones visible
UPDATE reviews SET is_visible = true, sort_order = 0 WHERE is_visible IS NULL;

-- ============================================================
-- 2. CUSTOM SCENT FRAGRANCES
-- ============================================================
CREATE TABLE IF NOT EXISTS custom_scent_fragrances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE custom_scent_fragrances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_custom_scent_fragrances" ON custom_scent_fragrances;
CREATE POLICY "anon_select_custom_scent_fragrances" ON custom_scent_fragrances FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_custom_scent_fragrances" ON custom_scent_fragrances;
CREATE POLICY "anon_insert_custom_scent_fragrances" ON custom_scent_fragrances FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_custom_scent_fragrances" ON custom_scent_fragrances;
CREATE POLICY "anon_update_custom_scent_fragrances" ON custom_scent_fragrances FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_custom_scent_fragrances" ON custom_scent_fragrances;
CREATE POLICY "anon_delete_custom_scent_fragrances" ON custom_scent_fragrances FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 3. BOTTLE SIZES
-- ============================================================
CREATE TABLE IF NOT EXISTS bottle_sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  volume_ml integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE bottle_sizes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_bottle_sizes" ON bottle_sizes;
CREATE POLICY "anon_select_bottle_sizes" ON bottle_sizes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_bottle_sizes" ON bottle_sizes;
CREATE POLICY "anon_insert_bottle_sizes" ON bottle_sizes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_bottle_sizes" ON bottle_sizes;
CREATE POLICY "anon_update_bottle_sizes" ON bottle_sizes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_bottle_sizes" ON bottle_sizes;
CREATE POLICY "anon_delete_bottle_sizes" ON bottle_sizes FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 4. CONCENTRATIONS (oil %)
-- ============================================================
CREATE TABLE IF NOT EXISTS concentrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  percentage integer NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE concentrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_concentrations" ON concentrations;
CREATE POLICY "anon_select_concentrations" ON concentrations FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_concentrations" ON concentrations;
CREATE POLICY "anon_insert_concentrations" ON concentrations FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_concentrations" ON concentrations;
CREATE POLICY "anon_update_concentrations" ON concentrations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_concentrations" ON concentrations;
CREATE POLICY "anon_delete_concentrations" ON concentrations FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 5. TESTER FRAGRANCES
-- ============================================================
CREATE TABLE IF NOT EXISTS tester_fragrances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE tester_fragrances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_tester_fragrances" ON tester_fragrances;
CREATE POLICY "anon_select_tester_fragrances" ON tester_fragrances FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_tester_fragrances" ON tester_fragrances;
CREATE POLICY "anon_insert_tester_fragrances" ON tester_fragrances FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_tester_fragrances" ON tester_fragrances;
CREATE POLICY "anon_update_tester_fragrances" ON tester_fragrances FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_tester_fragrances" ON tester_fragrances;
CREATE POLICY "anon_delete_tester_fragrances" ON tester_fragrances FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 6. SEED HOMEPAGE SECTIONS (new keys only, if not already present)
-- ============================================================
INSERT INTO homepage_sections (section_key, title, is_visible, order_index, config)
SELECT * FROM (VALUES
  ('reviews', 'Customer Reviews', false, 8, '{}'::jsonb),
  ('return_policy', 'Return Policy', false, 9, '{}'::jsonb),
  ('create_your_scent', 'Create Your Own Scent', false, 10, '{}'::jsonb),
  ('tester_kit', 'Create Your Own Tester Kit', false, 11, '{}'::jsonb)
) AS t(section_key, title, is_visible, order_index, config)
WHERE NOT EXISTS (SELECT 1 FROM homepage_sections WHERE section_key = t.section_key);

-- ============================================================
-- 7. SEED SAMPLE DATA (only if tables are empty)
-- ============================================================
INSERT INTO custom_scent_fragrances (name, is_enabled, sort_order)
SELECT * FROM (VALUES
  ('Creed Aventus', true, 0),
  ('Dior Sauvage', true, 1),
  ('Bleu de Chanel', true, 2),
  ('Ombre Nomade', true, 3),
  ('YSL Y', true, 4)
) AS t(name, is_enabled, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM custom_scent_fragrances LIMIT 1);

INSERT INTO bottle_sizes (label, volume_ml, sort_order)
SELECT * FROM (VALUES
  ('10 ml', 10, 0),
  ('20 ml', 20, 1),
  ('30 ml', 30, 2),
  ('50 ml', 50, 3),
  ('100 ml', 100, 4)
) AS t(label, volume_ml, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM bottle_sizes LIMIT 1);

INSERT INTO concentrations (percentage, is_enabled, sort_order)
SELECT * FROM (VALUES
  (15, true, 0),
  (20, true, 1),
  (25, true, 2),
  (30, true, 3),
  (35, true, 4),
  (40, true, 5),
  (45, true, 6),
  (50, true, 7)
) AS t(percentage, is_enabled, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM concentrations LIMIT 1);

INSERT INTO tester_fragrances (name, is_enabled, sort_order)
SELECT * FROM (VALUES
  ('Creed Aventus', true, 0),
  ('Dior Sauvage', true, 1),
  ('Bleu de Chanel', true, 2),
  ('Ombre Nomade', true, 3),
  ('YSL Y', true, 4)
) AS t(name, is_enabled, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM tester_fragrances LIMIT 1);
