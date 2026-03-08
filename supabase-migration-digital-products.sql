-- Add digital product flag and file path to products
-- Run in Supabase SQL Editor. Create bucket 'digital-downloads' (private) in Storage first.

ALTER TABLE products ADD COLUMN IF NOT EXISTS is_digital BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS digital_file_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS digital_file_name TEXT;
