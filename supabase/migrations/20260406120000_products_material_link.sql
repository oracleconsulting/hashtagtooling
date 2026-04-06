-- Inventory ↔ materials: single-species and multi-species parent listings
ALTER TABLE products ADD COLUMN IF NOT EXISTS material_id UUID REFERENCES materials(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_material ON products(material_id);

ALTER TABLE products ADD COLUMN IF NOT EXISTS material_ids UUID[] DEFAULT '{}';
