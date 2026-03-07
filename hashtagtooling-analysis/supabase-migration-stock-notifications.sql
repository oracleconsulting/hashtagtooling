-- ============================================
-- STOCK NOTIFICATIONS TABLE
-- Run this in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS stock_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  email TEXT NOT NULL,
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE stock_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert" ON stock_notifications;
CREATE POLICY "Allow public insert" ON stock_notifications FOR INSERT WITH CHECK (true);
