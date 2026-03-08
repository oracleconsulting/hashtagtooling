-- ============================================
-- Wood for Sale category + subcategory
-- Run in Supabase SQL Editor first.
-- ============================================

-- Update category CHECK constraint to include 'wood'
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE products ADD CONSTRAINT products_category_check
  CHECK (category IN ('mallet', 'awl', 'coin', 'square', 'wood'));

-- Add subcategory column for wood products (offcuts, blanks, sample_packs, slabs, pen_blank)
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory TEXT;
