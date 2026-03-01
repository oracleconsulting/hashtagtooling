# Supabase SQL — copy & paste (run in order)

Open **Supabase Dashboard → SQL Editor**. Run each block in a **New query**, then **Run**.

---

## 1. Base schema (run first)

```sql
-- ============================================
-- COMPLETE DATABASE SETUP FOR #TOOLING
-- Run this FIRST in Supabase SQL Editor
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CORE TABLES
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('mallet', 'awl', 'coin', 'square')),
  image_url TEXT,
  stock_status TEXT DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'made_to_order', 'out_of_stock')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  project_description TEXT NOT NULL,
  budget TEXT,
  timeline TEXT,
  preferred_custom_build TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  paypal_order_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'completed')),
  order_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('wood', 'transition', 'face')),
  color_hex TEXT,
  description TEXT,
  mallet_head_premium DECIMAL(10,2) DEFAULT 0,
  mallet_handle_premium DECIMAL(10,2) DEFAULT 0,
  awl_handle_premium DECIMAL(10,2) DEFAULT 0,
  available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, category)
);

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

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products(stock_status);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_available ON materials(available);
CREATE INDEX IF NOT EXISTS idx_base_prices_type ON base_prices(product_type);

-- TRIGGERS (drop first so script is re-runnable)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_materials_updated_at ON materials;
CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_base_prices_updated_at ON base_prices;
CREATE TRIGGER update_base_prices_updated_at
  BEFORE UPDATE ON base_prices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 2. Awl ferrule column (Custom Awl builder)

```sql
ALTER TABLE materials ADD COLUMN IF NOT EXISTS awl_ferrule_premium DECIMAL(10,2) DEFAULT 0;
```

---

## 3. Seed data — base prices & materials (optional)

```sql
-- BASE PRICES
INSERT INTO base_prices (product_type, style_name, base_price, description) VALUES
  ('mallet', 'Turned Carving Mallet', 190.00, 'Small turned head for detailed carving'),
  ('mallet', 'Turned Detailing Mallet', 210.00, 'Medium turned head for general carving'),
  ('mallet', 'Turned Joiners Mallet', 230.00, 'Large turned head for joinery work'),
  ('mallet', 'Square Carving Mallet', 250.00, 'Small square head for carving'),
  ('mallet', 'Square Detailing Mallet', 275.00, 'Medium square head for general work'),
  ('mallet', 'Square Joiners Mallet', 300.00, 'Large square head for heavy joinery'),
  ('awl', 'Small Scratch Awl', 80.00, 'Compact scratch awl for fine marking'),
  ('awl', 'Large Scratch Awl', 90.00, 'Large scratch awl for general marking'),
  ('awl', 'Small Birdcage Awl', 85.00, 'Small birdcage awl for delicate work'),
  ('awl', 'Large Birdcage Awl', 95.00, 'Large birdcage awl for heavier work'),
  ('awl', '75mm Burnisher', 100.00, 'Professional burnisher tool')
ON CONFLICT (product_type, style_name) DO UPDATE SET base_price = EXCLUDED.base_price, description = EXCLUDED.description;

-- TRANSITION MATERIALS
INSERT INTO materials (name, category, color_hex, mallet_head_premium, mallet_handle_premium, awl_handle_premium, awl_ferrule_premium) VALUES
  ('Aluminium', 'transition', '#C0C0C0', 0, 0, 0, 0),
  ('Brass', 'transition', '#B5A642', 0, 0, 0, 0),
  ('Bronze', 'transition', '#CD7F32', 5, 5, 10, 10),
  ('Copper', 'transition', '#B87333', 10, 10, 20, 20),
  ('Steel', 'transition', '#A8A8A8', 0, 0, 5, 5),
  ('Mokume Gane', 'transition', '#8B7355', 80, 80, 75, 75)
ON CONFLICT (name, category) DO UPDATE SET
  mallet_head_premium = EXCLUDED.mallet_head_premium,
  mallet_handle_premium = EXCLUDED.mallet_handle_premium,
  awl_handle_premium = EXCLUDED.awl_handle_premium,
  awl_ferrule_premium = EXCLUDED.awl_ferrule_premium;

-- BASE PRICE WOODS (£0)
INSERT INTO materials (name, category, color_hex, mallet_head_premium, mallet_handle_premium, awl_handle_premium) VALUES
  ('Aforomosia', 'wood', '#B8956A', 0, 0, 0),
  ('Azobe', 'wood', '#6B4423', 0, 0, 0),
  ('Bubinga', 'wood', '#8B4049', 0, 0, 0),
  ('Chakte Kok', 'wood', '#8B2500', 0, 0, 0),
  ('Goncalo Alves', 'wood', '#8B5A2B', 0, 0, 0),
  ('Knobthorn', 'wood', '#D2B48C', 0, 0, 0),
  ('Olivewood', 'wood', '#B8956A', 0, 0, 0),
  ('Padauk', 'wood', '#E45E32', 0, 0, 0),
  ('Ropalo Lacewood', 'wood', '#C4A582', 0, 0, 0),
  ('Spalted Beech', 'wood', '#D4C5A9', 0, 0, 0),
  ('Spalted Birch', 'wood', '#E8DCC0', 0, 0, 0),
  ('Spalted Pippy Oak', 'wood', '#C9B27C', 0, 0, 0),
  ('Wenge', 'wood', '#2E1A14', 0, 0, 0)
ON CONFLICT (name, category) DO UPDATE SET mallet_head_premium = EXCLUDED.mallet_head_premium, mallet_handle_premium = EXCLUDED.mallet_handle_premium, awl_handle_premium = EXCLUDED.awl_handle_premium;

-- PREMIUM WOODS
INSERT INTO materials (name, category, color_hex, mallet_head_premium, mallet_handle_premium, awl_handle_premium) VALUES
  ('African Blackwood', 'wood', '#2C1810', 50, 25, 10),
  ('Ancient Redgum (7000 years old)', 'wood', '#8B4513', 250, 125, 0),
  ('African Blackwood (Birdseye)', 'wood', '#2C1810', 0, 110, 0),
  ('Argentinian Lignum Vitae', 'wood', '#4A5D23', 40, 25, 10),
  ('Arizona Desert Ironwood', 'wood', '#5C4033', 75, 50, 25),
  ('Australian Blackwood', 'wood', '#5C3317', 60, 40, 15),
  ('Beefwood', 'wood', '#8B4513', 50, 0, 0),
  ('Black Limba', 'wood', '#4A3728', 0, 20, 10),
  ('Bloodwood', 'wood', '#8B0000', 50, 30, 15),
  ('Bocote', 'wood', '#8B7355', 40, 25, 10),
  ('Bog Oak', 'wood', '#1C1C1C', 60, 35, 15),
  ('Box Elder Burl', 'wood', '#D4A574', 75, 0, 25),
  ('Brown Oak', 'wood', '#6B4423', 0, 15, 10),
  ('Buckeye Burl', 'wood', '#D4A574', 0, 0, 50),
  ('Camelthorn', 'wood', '#8B6914', 0, 50, 15),
  ('Chakte Viga', 'wood', '#CD853F', 15, 0, 5),
  ('Cherry Burl', 'wood', '#9C4722', 30, 0, 10),
  ('Claro Walnut', 'wood', '#5C4033', 0, 0, 30),
  ('Cuban Mahogany', 'wood', '#C04000', 0, 30, 15),
  ('Curly Ash', 'wood', '#E5D1B7', 0, 20, 15),
  ('Curly Koa', 'wood', '#8B6914', 0, 60, 0),
  ('Curly Spalted Maple', 'wood', '#E8DCC0', 50, 35, 10),
  ('Curly Redwood', 'wood', '#8B3A3A', 0, 0, 15),
  ('Curly Redwood Burl', 'wood', '#8B3A3A', 0, 0, 40),
  ('English Boxwood', 'wood', '#F5E6C4', 50, 25, 15),
  ('English Layer Cake Walnut', 'wood', '#5C4033', 0, 0, 25),
  ('Stabilised English Boxwood', 'wood', '#F5E6C4', 75, 50, 25),
  ('Colour Stabilised English Boxwood', 'wood', '#F5E6C4', 0, 0, 25),
  ('Elm Burl (1200 Year Old)', 'wood', '#8B6914', 100, 50, 0),
  ('Figured English Walnut', 'wood', '#5C4033', 0, 30, 0),
  ('Figured Pommele Sapele', 'wood', '#8B4513', 40, 0, 0),
  ('Flame Box Elder', 'wood', '#D4A574', 0, 0, 15),
  ('Fossilised Mahogany', 'wood', '#C04000', 0, 75, 0),
  ('Gempol Burl', 'wood', '#8B6914', 40, 0, 20),
  ('Gidgee', 'wood', '#8B6914', 60, 50, 15),
  ('Grenadillo', 'wood', '#2C1810', 30, 20, 10),
  ('Honduran Mahogany', 'wood', '#C04000', 0, 0, 15),
  ('Indian Rosewood', 'wood', '#65000B', 0, 0, 20),
  ('Ironbark', 'wood', '#8B4513', 50, 0, 0),
  ('Jarrah', 'wood', '#8B2500', 50, 0, 0),
  ('Japanese Cherry', 'wood', '#9C4722', 0, 0, 15),
  ('Katalox', 'wood', '#2C1810', 40, 25, 0),
  ('Kingwood', 'wood', '#4A148C', 50, 40, 15),
  ('Leadwood', 'wood', '#4A3728', 30, 20, 10),
  ('Leopardwood', 'wood', '#8B6914', 0, 20, 10),
  ('Lignum Vitae (Genuine)', 'wood', '#4A5D23', 0, 75, 20),
  ('Lignum Vitae (Genuine) LB', 'wood', '#4A5D23', 75, 0, 0),
  ('Linn Burl', 'wood', '#D4A574', 65, 0, 0),
  ('Maple Burl', 'wood', '#E8D5B7', 65, 0, 25),
  ('Marblewood', 'wood', '#2C1810', 30, 25, 5),
  ('Massur Birch B', 'wood', '#E8DCC0', 65, 50, 15),
  ('Massur Birch A', 'wood', '#E8DCC0', 0, 60, 20),
  ('Massur Birch P', 'wood', '#E8DCC0', 0, 75, 25),
  ('Massur Birch S', 'wood', '#E8DCC0', 0, 0, 30),
  ('Massur Birch U', 'wood', '#E8DCC0', 0, 100, 0),
  ('Mopane', 'wood', '#8B4513', 30, 20, 5),
  ('Nicaraguan Cocobolo', 'wood', '#8B2500', 60, 30, 15),
  ('Old Growth Curly Redwood', 'wood', '#8B3A3A', 75, 0, 0),
  ('Ovangkol', 'wood', '#8B6914', 0, 20, 5),
  ('Palm', 'wood', '#8B6914', 40, 0, 0),
  ('Pau Rosa', 'wood', '#8B2500', 35, 20, 5),
  ('Pheasant Wood', 'wood', '#8B4513', 40, 0, 0),
  ('Pink Ivory', 'wood', '#D4A574', 40, 25, 10),
  ('Redgum', 'wood', '#8B4513', 50, 0, 0),
  ('Redgum (sinker/bog)', 'wood', '#8B4513', 40, 0, 0),
  ('Red Iron Bark', 'wood', '#8B2500', 50, 0, 0),
  ('Royal White Ebony', 'wood', '#F5F5DC', 65, 0, 0),
  ('Sapele (figured)', 'wood', '#8B4513', 0, 25, 5),
  ('Sheoak', 'wood', '#8B4513', 0, 25, 10),
  ('Snakewood', 'wood', '#8B2500', 150, 100, 50),
  ('Spalted Ash', 'wood', '#E5D1B7', 30, 30, 5),
  ('Spalted Beech (Coloured)', 'wood', '#D4C5A9', 25, 20, 10),
  ('Spalted Figured Mango', 'wood', '#D4A574', 30, 0, 5),
  ('Spalted London Plane', 'wood', '#D4A574', 0, 35, 10),
  ('Spalted London Plane Burl', 'wood', '#D4A574', 50, 0, 0),
  ('Spalted Maple Burl', 'wood', '#E8DCC0', 0, 0, 30),
  ('Stabilised Zebrano', 'wood', '#D4A574', 0, 20, 10),
  ('Suriname Ironwood', 'wood', '#5C4033', 60, 25, 15),
  ('Tamarind', 'wood', '#8B6914', 0, 40, 0),
  ('Teak Burl', 'wood', '#8B6914', 75, 0, 0),
  ('Walnut Burl', 'wood', '#5C4033', 50, 0, 0),
  ('Yew', 'wood', '#8B6914', 40, 0, 5),
  ('Ziricote', 'wood', '#2C1810', 40, 0, 10)
ON CONFLICT (name, category) DO UPDATE SET mallet_head_premium = EXCLUDED.mallet_head_premium, mallet_handle_premium = EXCLUDED.mallet_handle_premium, awl_handle_premium = EXCLUDED.awl_handle_premium;
```

---

## 4. Products V2 + RLS (run last)

```sql
-- Update products: wood category, sold status, new columns
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE products ADD CONSTRAINT products_category_check
  CHECK (category IN ('mallet', 'awl', 'coin', 'square', 'wood'));

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_stock_status_check;
ALTER TABLE products ADD CONSTRAINT products_stock_status_check
  CHECK (stock_status IN ('in_stock', 'made_to_order', 'out_of_stock', 'sold'));

ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;

-- ROW LEVEL SECURITY
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Products can be inserted by anyone" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Products can be updated by anyone" ON products FOR UPDATE USING (true);
CREATE POLICY "Products can be deleted by anyone" ON products FOR DELETE USING (true);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Orders are viewable by everyone" ON orders;
CREATE POLICY "Orders are viewable by everyone" ON orders FOR SELECT USING (true);
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Orders can be updated by anyone" ON orders FOR UPDATE USING (true);

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Commissions are viewable by everyone" ON commissions;
CREATE POLICY "Commissions are viewable by everyone" ON commissions FOR SELECT USING (true);
CREATE POLICY "Anyone can submit commissions" ON commissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Commissions can be updated" ON commissions FOR UPDATE USING (true);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Materials are viewable by everyone" ON materials;
CREATE POLICY "Materials are viewable by everyone" ON materials FOR SELECT USING (true);
CREATE POLICY "Materials can be managed" ON materials FOR ALL USING (true);

ALTER TABLE base_prices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Base prices are viewable by everyone" ON base_prices;
CREATE POLICY "Base prices are viewable by everyone" ON base_prices FOR SELECT USING (true);
CREATE POLICY "Base prices can be managed" ON base_prices FOR ALL USING (true);
```

---

**Order:** 1 → 2 → 3 (optional) → 4.

After running these, create a **Storage** bucket named `products` (public if you want product images to load).
