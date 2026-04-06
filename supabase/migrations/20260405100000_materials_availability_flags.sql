ALTER TABLE materials ADD COLUMN IF NOT EXISTS available_mallet_head BOOLEAN DEFAULT true;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS available_mallet_handle BOOLEAN DEFAULT true;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS available_awl_handle BOOLEAN DEFAULT true;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS available_square_scale BOOLEAN DEFAULT true;

-- Widen position check on material_style_pricing (inline CHECK from initial migration)
ALTER TABLE material_style_pricing DROP CONSTRAINT IF EXISTS material_style_pricing_position_check;
ALTER TABLE material_style_pricing ADD CONSTRAINT material_style_pricing_position_check
  CHECK (position IN ('head', 'handle', 'awl_handle', 'square_scale'));
