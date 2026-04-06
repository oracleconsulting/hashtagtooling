-- Add rich content fields for individual wood species pages
ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS uses_description text,
  ADD COLUMN IF NOT EXISTS gallery_images jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS videos jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN materials.description IS 'Long-form history / story of the wood species';
COMMENT ON COLUMN materials.uses_description IS 'Common uses and applications';
COMMENT ON COLUMN materials.gallery_images IS 'Array of image URLs for the species gallery';
COMMENT ON COLUMN materials.videos IS 'Array of {url, title} objects for embedded videos';
