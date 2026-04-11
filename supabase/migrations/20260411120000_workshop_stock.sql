-- ============================================
-- WORKSHOP STOCK MANAGEMENT
-- Individual physical pieces of raw material
-- ============================================

CREATE TABLE IF NOT EXISTS workshop_stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  dimensions TEXT,
  weight_grams INTEGER,
  cost_price DECIMAL(10,2),
  supplier TEXT,
  purchase_date DATE,
  drawer_number TEXT,
  location_notes TEXT,
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN (
      'available', 'reserved', 'in_progress', 'used',
      'allocated_sale', 'defective', 'gifted'
    )),
  suitable_for TEXT[] DEFAULT '{"head","handle","awl_handle","square_scale"}',
  allocated_to_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  allocated_to_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  allocated_notes TEXT,
  images TEXT[] DEFAULT '{}',
  grade TEXT CHECK (grade IN ('A', 'B', 'C', 'S')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ws_material ON workshop_stock(material_id);
CREATE INDEX IF NOT EXISTS idx_ws_status ON workshop_stock(status);
CREATE INDEX IF NOT EXISTS idx_ws_sku ON workshop_stock(sku);
CREATE INDEX IF NOT EXISTS idx_ws_drawer ON workshop_stock(drawer_number);
CREATE INDEX IF NOT EXISTS idx_ws_suitable ON workshop_stock USING GIN(suitable_for);

ALTER TABLE workshop_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workshop_stock_select" ON workshop_stock FOR SELECT USING (true);
CREATE POLICY "workshop_stock_all" ON workshop_stock FOR ALL USING (true);

CREATE TRIGGER update_workshop_stock_updated_at
  BEFORE UPDATE ON workshop_stock
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for workshop stock images
INSERT INTO storage.buckets (id, name, public)
VALUES ('workshop-stock', 'workshop-stock', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Allow public read workshop-stock" ON storage.objects
  FOR SELECT USING (bucket_id = 'workshop-stock');
CREATE POLICY "Allow public upload workshop-stock" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'workshop-stock');
CREATE POLICY "Allow public update workshop-stock" ON storage.objects
  FOR UPDATE USING (bucket_id = 'workshop-stock');
CREATE POLICY "Allow public delete workshop-stock" ON storage.objects
  FOR DELETE USING (bucket_id = 'workshop-stock');
