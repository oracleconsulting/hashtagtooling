-- Complete materials and pricing from actual price lists
-- Run this in Supabase SQL Editor after running supabase-schema.sql

-- ============================================
-- BASE PRICES
-- ============================================

-- Mallets
INSERT INTO base_prices (product_type, style_name, base_price, description) VALUES
  ('mallet', 'Turned Carving Mallet', 190.00, 'Small turned head for detailed carving'),
  ('mallet', 'Turned Detailing Mallet', 210.00, 'Medium turned head for general carving'),
  ('mallet', 'Turned Joiners Mallet', 230.00, 'Large turned head for joinery work'),
  ('mallet', 'Square Carving Mallet', 250.00, 'Small square head for carving'),
  ('mallet', 'Square Detailing Mallet', 275.00, 'Medium square head for general work'),
  ('mallet', 'Square Joiners Mallet', 300.00, 'Large square head for heavy joinery')
ON CONFLICT (product_type, style_name) DO UPDATE SET
  base_price = EXCLUDED.base_price,
  description = EXCLUDED.description;

-- Awls
INSERT INTO base_prices (product_type, style_name, base_price, description) VALUES
  ('awl', 'Small Scratch Awl', 80.00, 'Compact scratch awl for fine marking'),
  ('awl', 'Large Scratch Awl', 90.00, 'Large scratch awl for general marking'),
  ('awl', 'Small Birdcage Awl', 85.00, 'Small birdcage awl for delicate work'),
  ('awl', 'Large Birdcage Awl', 95.00, 'Large birdcage awl for heavier work'),
  ('awl', '75mm Burnisher', 100.00, 'Professional burnisher tool')
ON CONFLICT (product_type, style_name) DO UPDATE SET
  base_price = EXCLUDED.base_price,
  description = EXCLUDED.description;

-- ============================================
-- TRANSITION MATERIALS (for Mallets)
-- ============================================

INSERT INTO materials (name, category, color_hex, mallet_head_premium, mallet_handle_premium, awl_handle_premium) VALUES
  ('Aluminium', 'transition', '#C0C0C0', 0, 0, 0),
  ('Brass', 'transition', '#B5A642', 0, 0, 0),
  ('Bronze', 'transition', '#CD7F32', 5, 5, 10),
  ('Copper', 'transition', '#B87333', 10, 10, 20),
  ('Steel', 'transition', '#A8A8A8', 0, 0, 5),
  ('Mokume Gane', 'transition', '#8B7355', 80, 80, 75)
ON CONFLICT (name, category) DO UPDATE SET
  mallet_head_premium = EXCLUDED.mallet_head_premium,
  mallet_handle_premium = EXCLUDED.mallet_handle_premium,
  awl_handle_premium = EXCLUDED.awl_handle_premium;

-- ============================================
-- BASE PRICE WOODS (£0 Premium)
-- ============================================

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
ON CONFLICT (name, category) DO UPDATE SET
  mallet_head_premium = EXCLUDED.mallet_head_premium,
  mallet_handle_premium = EXCLUDED.mallet_handle_premium,
  awl_handle_premium = EXCLUDED.awl_handle_premium;

-- ============================================
-- PREMIUM WOODS - MALLET MATERIALS
-- ============================================

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
ON CONFLICT (name, category) DO UPDATE SET
  mallet_head_premium = EXCLUDED.mallet_head_premium,
  mallet_handle_premium = EXCLUDED.mallet_handle_premium,
  awl_handle_premium = EXCLUDED.awl_handle_premium;

