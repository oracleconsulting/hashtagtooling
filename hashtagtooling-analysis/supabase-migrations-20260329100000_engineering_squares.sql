-- ============================================
-- ENGINEERING SQUARES — Schema additions
-- ============================================

-- Add engineering square base prices
INSERT INTO base_prices (product_type, style_name, base_price, description, available) VALUES
  ('square', 'chode_tool_steel', 80.00, 'Chode (67.5mm) — Tool Steel body', true),
  ('square', 'chode_titanium', 95.00, 'Chode (67.5mm) — Titanium Grade 2 body', true),
  ('square', '95mm_tool_steel', 85.00, '95mm — Tool Steel body', true),
  ('square', '95mm_titanium', 115.00, '95mm — Titanium Grade 2 body', true),
  ('square', '125mm_tool_steel', 90.00, '125mm — Tool Steel body', true),
  ('square', '125mm_titanium', 135.00, '125mm — Titanium Grade 2 body', true),
  ('square', '175mm_tool_steel', 100.00, '175mm — Tool Steel body', true),
  ('square', '175mm_titanium', 180.00, '175mm — Titanium Grade 2 body (estimated)', true),
  ('square', '250mm_tool_steel', 120.00, '250mm — Tool Steel body', true),
  ('square', '250mm_titanium', 285.00, '250mm — Titanium Grade 2 body (estimated)', true)
ON CONFLICT (product_type, style_name) DO UPDATE SET
  base_price = EXCLUDED.base_price,
  description = EXCLUDED.description;

-- Add liner material premiums to materials table
INSERT INTO materials (name, category, color_hex, description, available, sort_order) VALUES
  ('Brass Liner (1mm)', 'liner', '#C8963E', 'Solid brass liner, 1mm thickness', true, 1),
  ('Bronze Liner (1mm)', 'liner', '#A0764A', 'Solid bronze liner, 1mm thickness', true, 2),
  ('Copper Liner (1mm)', 'liner', '#D4764E', 'Solid copper liner, 1mm thickness', true, 3),
  ('Brass Liner (2.5mm)', 'liner', '#C8963E', 'Solid brass liner, 2.5mm thickness — for carbon fibre scales', true, 4),
  ('Bronze Liner (2.5mm)', 'liner', '#A0764A', 'Solid bronze liner, 2.5mm thickness — for carbon fibre scales', true, 5),
  ('Copper Liner (2.5mm)', 'liner', '#D4764E', 'Solid copper liner, 2.5mm thickness — for carbon fibre scales', true, 6)
ON CONFLICT (name, category) DO NOTHING;

-- Add square-specific premium columns to materials table
ALTER TABLE materials ADD COLUMN IF NOT EXISTS square_scale_premium DECIMAL(10,2) DEFAULT 0;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS square_liner_premium DECIMAL(10,2) DEFAULT 0;

-- Set liner premiums
UPDATE materials SET square_liner_premium = 8.00 WHERE name LIKE 'Brass Liner%' AND category = 'liner';
UPDATE materials SET square_liner_premium = 10.00 WHERE name LIKE 'Bronze Liner%' AND category = 'liner';
UPDATE materials SET square_liner_premium = 12.00 WHERE name LIKE 'Copper Liner%' AND category = 'liner';

-- Add carbon fibre scale materials (two thicknesses)
INSERT INTO materials (name, category, color_hex, description, available, sort_order, square_scale_premium) VALUES
  ('Carbon Fibre (1mm)', 'square_scale', '#2A2A2A', 'Woven carbon fibre scale, 1mm thickness', true, 0, 15.00),
  ('Carbon Fibre (2.5mm)', 'square_scale', '#2A2A2A', 'Woven carbon fibre scale, 2.5mm thickness — standard with 1mm liner', true, 1, 20.00)
ON CONFLICT (name, category) DO NOTHING;
