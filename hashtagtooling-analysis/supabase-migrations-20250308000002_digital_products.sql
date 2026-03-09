-- Digital product fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_digital BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS digital_file_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS digital_file_name TEXT;
