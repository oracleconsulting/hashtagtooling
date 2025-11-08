-- Add materials table for dynamic pricing
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('wood', 'transition', 'face')),
  color_hex TEXT,
  description TEXT,
  
  -- Pricing for mallets
  mallet_head_premium DECIMAL(10,2) DEFAULT 0,
  mallet_handle_premium DECIMAL(10,2) DEFAULT 0,
  
  -- Pricing for awls
  awl_handle_premium DECIMAL(10,2) DEFAULT 0,
  
  -- Availability
  available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add base prices table for different product styles
CREATE TABLE IF NOT EXISTS base_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_type TEXT NOT NULL,
  style_name TEXT NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  description TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_type, style_name)
);

-- Indexes
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_materials_available ON materials(available);
CREATE INDEX idx_base_prices_type ON base_prices(product_type);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW
  EXECUTE FUNCTION update_materials_updated_at();

CREATE TRIGGER update_base_prices_updated_at
  BEFORE UPDATE ON base_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert base prices for mallets (CORRECT PRICES FROM PDF)
INSERT INTO base_prices (product_type, style_name, base_price, description) VALUES
  ('mallet', 'Turned Carving Mallet', 190.00, 'Small turned head for detailed carving'),
  ('mallet', 'Turned Detailing Mallet', 210.00, 'Medium turned head for general carving'),
  ('mallet', 'Turned Joiners Mallet', 230.00, 'Large turned head for heavy work'),
  ('mallet', 'Square Carving Mallet', 250.00, 'Small square head for carving'),
  ('mallet', 'Square Detailing Mallet', 275.00, 'Medium square head for general work'),
  ('mallet', 'Square Joiners Mallet', 300.00, 'Large square head for framing')
ON CONFLICT (product_type, style_name) DO NOTHING;

-- Insert base prices for awls
INSERT INTO base_prices (product_type, style_name, base_price, description) VALUES
  ('awl', 'Marking Awl', 35.00, 'Standard marking awl'),
  ('awl', 'Scratch Awl', 38.00, 'Heavy duty scratch awl'),
  ('awl', 'Brad Awl', 40.00, 'Brad point awl for pilot holes')
ON CONFLICT (product_type, style_name) DO NOTHING;

-- Insert sample materials (base price materials - no premium)
-- NOTE: User will provide ~100 wood types with their specific premiums
INSERT INTO materials (name, category, color_hex, mallet_head_premium, mallet_handle_premium, awl_handle_premium) VALUES
  ('Ash', 'wood', '#E5D1B7', 0, 0, 0),
  ('Beech', 'wood', '#D9BE9C', 0, 0, 0),
  ('Oak', 'wood', '#C9B27C', 0, 0, 0),
  ('Maple', 'wood', '#E8D5B7', 0, 0, 0)
ON CONFLICT DO NOTHING;

-- Insert premium materials
-- NOTE: These are examples - user has PDF with ~100 specific woods and premiums
INSERT INTO materials (name, category, color_hex, mallet_head_premium, mallet_handle_premium, awl_handle_premium) VALUES
  ('Walnut', 'wood', '#3D2817', 15, 10, 8),
  ('Cherry', 'wood', '#9C4722', 12, 8, 6),
  ('Mahogany', 'wood', '#C04000', 18, 12, 10),
  ('Ebony', 'wood', '#282828', 35, 25, 20),
  ('Rosewood', 'wood', '#65000B', 30, 20, 15),
  ('Padauk', 'wood', '#E45E32', 20, 15, 12),
  ('Purple Heart', 'wood', '#5C2E5C', 25, 18, 14),
  ('Wenge', 'wood', '#2E1A14', 28, 20, 16)
ON CONFLICT DO NOTHING;

-- Insert transition materials (CORRECT PRICES FROM PDF)
INSERT INTO materials (name, category, color_hex, mallet_head_premium, mallet_handle_premium, awl_handle_premium) VALUES
  ('Aluminium', 'transition', '#C0C0C0', 0, 0, 0),
  ('Brass', 'transition', '#B5A642', 0, 0, 0),
  ('Bronze', 'transition', '#CD7F32', 5, 5, 5),
  ('Copper', 'transition', '#B87333', 10, 10, 10),
  ('Mokume Gane', 'transition', '#8B7355', 80, 80, 80)
ON CONFLICT DO NOTHING;

