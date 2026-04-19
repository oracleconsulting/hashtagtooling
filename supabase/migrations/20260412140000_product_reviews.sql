-- Product reviews system
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  order_id UUID REFERENCES orders(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 0 AND rating <= 5),
  title TEXT,
  body TEXT,
  verified_purchase BOOLEAN DEFAULT true,
  published BOOLEAN DEFAULT false,
  review_token TEXT UNIQUE NOT NULL,
  token_used BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'website' CHECK (source IN ('website', 'historical', 'instagram')),
  product_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_reviews_token ON product_reviews(review_token);
CREATE INDEX IF NOT EXISTS idx_reviews_published ON product_reviews(published);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published reviews" ON product_reviews;
CREATE POLICY "Public read published reviews" ON product_reviews
  FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "Submit review via token" ON product_reviews;
CREATE POLICY "Submit review via token" ON product_reviews
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admin full access reviews" ON product_reviews;
CREATE POLICY "Admin full access reviews" ON product_reviews
  FOR ALL USING (true);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS review_token TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS review_requested_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS review_completed_at TIMESTAMP WITH TIME ZONE;
