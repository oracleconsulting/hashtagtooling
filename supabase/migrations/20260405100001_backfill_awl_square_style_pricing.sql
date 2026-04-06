-- Backfill junction rows for existing wood materials (new woods are seeded from the admin app)
INSERT INTO material_style_pricing (material_id, base_price_id, position, premium)
SELECT m.id, bp.id, 'awl_handle', 0
FROM materials m
CROSS JOIN base_prices bp
WHERE m.category = 'wood'
  AND bp.product_type = 'awl'
ON CONFLICT (material_id, base_price_id, position) DO NOTHING;

INSERT INTO material_style_pricing (material_id, base_price_id, position, premium)
SELECT m.id, bp.id, 'square_scale', 0
FROM materials m
CROSS JOIN base_prices bp
WHERE m.category = 'wood'
  AND bp.product_type = 'square'
ON CONFLICT (material_id, base_price_id, position) DO NOTHING;
