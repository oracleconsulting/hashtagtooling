ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS parent_product_id UUID REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS dimensions TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS material_species TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS piece_notes TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku_label_printed BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_parent ON products(parent_product_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

CREATE TABLE IF NOT EXISTS sku_sequences (
  prefix TEXT PRIMARY KEY,
  next_number INTEGER NOT NULL DEFAULT 1
);

ALTER TABLE sku_sequences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sku_sequences_all" ON sku_sequences;
CREATE POLICY "sku_sequences_all" ON sku_sequences FOR ALL USING (true);

CREATE OR REPLACE FUNCTION generate_sku(prefix_code TEXT)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  new_sku TEXT;
BEGIN
  INSERT INTO sku_sequences (prefix, next_number)
  VALUES (prefix_code, 2)
  ON CONFLICT (prefix) DO UPDATE SET next_number = sku_sequences.next_number + 1
  RETURNING next_number - 1 INTO next_num;

  new_sku := prefix_code || '-' || LPAD(next_num::TEXT, 3, '0');

  RETURN new_sku;
END;
$$ LANGUAGE plpgsql;
