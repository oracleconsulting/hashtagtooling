-- Ensure products storage bucket exists and is publicly readable (shop + admin thumbnails)
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow public read products" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload products" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update products" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete products" ON storage.objects;

CREATE POLICY "Allow public read products" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "Allow public upload products" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'products');

CREATE POLICY "Allow public update products" ON storage.objects
  FOR UPDATE USING (bucket_id = 'products');

CREATE POLICY "Allow public delete products" ON storage.objects
  FOR DELETE USING (bucket_id = 'products');
