-- Interest cost lives on the interest list until you promote it to a real product.
-- Do not add bottle opener / muddler into base_prices or material_style_pricing.

ALTER TABLE interest_lists ADD COLUMN IF NOT EXISTS pricing jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Undo the previous "put it in Materials" approach if that SQL was already run.
DELETE FROM material_style_pricing
WHERE position IN ('bottle_opener_handle', 'muddler_handle');

DELETE FROM base_prices
WHERE product_type IN ('bottle_opener', 'muddler');
