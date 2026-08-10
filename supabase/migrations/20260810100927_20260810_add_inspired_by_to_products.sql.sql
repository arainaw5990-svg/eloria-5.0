/*
# Add inspired_by column to products

## Summary
Adds an optional `inspired_by` text column to the products table so each perfume
can reference the fragrance it is inspired by (e.g. "Silver Mountain Water").

## Changes
- products table: new column `inspired_by` (text, nullable, default null).
  This is purely additive — no existing data is modified or deleted.

## Security
- No RLS policy changes. Existing product policies already cover the new column.

## Notes
- The column is nullable so products without an inspiration reference are unaffected.
- Idempotent: uses IF NOT EXISTS check.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='inspired_by') THEN
    ALTER TABLE products ADD COLUMN inspired_by text;
  END IF;
END $$;
