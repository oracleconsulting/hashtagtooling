-- ============================================
-- SITE IMAGES TABLE
-- Stores images for homepage sections and other site-wide images
-- Run this in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS site_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_key TEXT NOT NULL UNIQUE,
  image_url TEXT NOT NULL DEFAULT '',
  alt_text TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_site_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS site_images_updated_at ON site_images;
CREATE TRIGGER site_images_updated_at
  BEFORE UPDATE ON site_images
  FOR EACH ROW
  EXECUTE FUNCTION update_site_images_updated_at();

-- Enable RLS
ALTER TABLE site_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Site images are viewable by everyone" ON site_images FOR SELECT USING (true);
CREATE POLICY "Site images can be managed by anyone" ON site_images FOR ALL USING (true);

-- Pre-populate with the 4 homepage section keys
-- These rows will exist with empty image_url until images are uploaded via admin
INSERT INTO site_images (section_key, alt_text) VALUES
  ('hero_background', 'Hero background image'),
  ('wood_collection', 'Collection of exotic wood species'),
  ('brass_transitions', 'Brass and copper transition materials'),
  ('mallet_lineup', 'Row of different handcrafted mallets')
ON CONFLICT (section_key) DO NOTHING;

-- Create Supabase Storage bucket for site images (run this separately if needed)
-- In Supabase Dashboard: Storage → New Bucket → Name: "site-images" → Public: ON
