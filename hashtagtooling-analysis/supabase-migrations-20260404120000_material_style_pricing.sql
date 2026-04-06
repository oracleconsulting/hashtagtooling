-- Per-style material pricing (material × mallet style × head/handle)
-- Run after uuid-ossp if needed: CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS material_style_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  base_price_id UUID NOT NULL REFERENCES base_prices(id) ON DELETE CASCADE,
  position TEXT NOT NULL CHECK (position IN ('head', 'handle')),
  premium DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(material_id, base_price_id, position)
);

CREATE INDEX IF NOT EXISTS idx_msp_material ON material_style_pricing(material_id);
CREATE INDEX IF NOT EXISTS idx_msp_base_price ON material_style_pricing(base_price_id);
CREATE INDEX IF NOT EXISTS idx_msp_position ON material_style_pricing(position);

ALTER TABLE material_style_pricing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "material_style_pricing_select" ON material_style_pricing;
CREATE POLICY "material_style_pricing_select" ON material_style_pricing FOR SELECT USING (true);
DROP POLICY IF EXISTS "material_style_pricing_all" ON material_style_pricing;
CREATE POLICY "material_style_pricing_all" ON material_style_pricing FOR ALL USING (true);

DROP TRIGGER IF EXISTS update_material_style_pricing_updated_at ON material_style_pricing;
CREATE TRIGGER update_material_style_pricing_updated_at
  BEFORE UPDATE ON material_style_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed from legacy flat premiums (non-zero only first pass), then zeros for remaining combos
INSERT INTO material_style_pricing (material_id, base_price_id, position, premium)
SELECT
  m.id AS material_id,
  bp.id AS base_price_id,
  'head' AS position,
  m.mallet_head_premium AS premium
FROM materials m
CROSS JOIN base_prices bp
WHERE m.category = 'wood'
  AND bp.product_type = 'mallet'
  AND m.mallet_head_premium > 0
ON CONFLICT (material_id, base_price_id, position) DO NOTHING;

INSERT INTO material_style_pricing (material_id, base_price_id, position, premium)
SELECT
  m.id AS material_id,
  bp.id AS base_price_id,
  'handle' AS position,
  m.mallet_handle_premium AS premium
FROM materials m
CROSS JOIN base_prices bp
WHERE m.category = 'wood'
  AND bp.product_type = 'mallet'
  AND m.mallet_handle_premium > 0
ON CONFLICT (material_id, base_price_id, position) DO NOTHING;

INSERT INTO material_style_pricing (material_id, base_price_id, position, premium)
SELECT
  m.id AS material_id,
  bp.id AS base_price_id,
  pos.position,
  0 AS premium
FROM materials m
CROSS JOIN base_prices bp
CROSS JOIN (VALUES ('head'), ('handle')) AS pos(position)
WHERE m.category = 'wood'
  AND bp.product_type = 'mallet'
ON CONFLICT (material_id, base_price_id, position) DO NOTHING;
