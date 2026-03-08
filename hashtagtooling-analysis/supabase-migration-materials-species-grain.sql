-- ============================================
-- MATERIALS: Grain image + species data columns
-- Run in Supabase SQL Editor. Then create Storage bucket "wood-grains" (Public).
-- ============================================

ALTER TABLE materials ADD COLUMN IF NOT EXISTS grain_image_url TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS janka_hardness INTEGER;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS specific_gravity NUMERIC(4,2);
ALTER TABLE materials ADD COLUMN IF NOT EXISTS origin TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS grain_description TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS grain_type TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS texture TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS durability TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS color_description TEXT;

-- Optional: add CHECK constraints only if you want to enforce enum values.
-- (Omitting CHECK here so existing/legacy data is not rejected.)
-- grain_type: straight, interlocked, wavy, irregular, spiral, roey
-- texture: fine, medium, coarse
-- durability: very_high, high, moderate, low
