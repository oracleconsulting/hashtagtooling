-- ============================================
-- SCHEMA MIGRATION V2 — New categories & fields
-- Run this in Supabase SQL Editor
-- ============================================

-- Update products category constraint to include 'wood'
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE products ADD CONSTRAINT products_category_check
  CHECK (category IN ('mallet', 'awl', 'coin', 'square', 'wood'));

-- Update stock_status constraint to include 'sold'
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_stock_status_check;
ALTER TABLE products ADD CONSTRAINT products_stock_status_check
  CHECK (stock_status IN ('in_stock', 'made_to_order', 'out_of_stock', 'sold'));

-- Add new optional columns to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- metadata JSONB stores: images array, video URL, weight_kg, dimensions, wood_types, shipping costs

-- Create index on featured for homepage queries
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Products can be inserted by anyone" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Products can be updated by anyone" ON products FOR UPDATE USING (true);
CREATE POLICY "Products can be deleted by anyone" ON products FOR DELETE USING (true);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orders are viewable by everyone" ON orders FOR SELECT USING (true);
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Orders can be updated by anyone" ON orders FOR UPDATE USING (true);

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Commissions are viewable by everyone" ON commissions FOR SELECT USING (true);
CREATE POLICY "Anyone can submit commissions" ON commissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Commissions can be updated" ON commissions FOR UPDATE USING (true);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Materials are viewable by everyone" ON materials FOR SELECT USING (true);
CREATE POLICY "Materials can be managed" ON materials FOR ALL USING (true);

ALTER TABLE base_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Base prices are viewable by everyone" ON base_prices FOR SELECT USING (true);
CREATE POLICY "Base prices can be managed" ON base_prices FOR ALL USING (true);
