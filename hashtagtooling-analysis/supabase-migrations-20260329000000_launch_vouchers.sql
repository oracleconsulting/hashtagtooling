-- Launch vouchers table
CREATE TABLE IF NOT EXISTS launch_vouchers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  discount_percent INTEGER NOT NULL DEFAULT 10,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  used_on_order_id UUID,
  discount_amount_applied NUMERIC(10,2),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE launch_vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "launch_vouchers_public_read"
  ON launch_vouchers FOR SELECT
  USING (true);

CREATE POLICY "launch_vouchers_service_insert"
  ON launch_vouchers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "launch_vouchers_service_update"
  ON launch_vouchers FOR UPDATE
  USING (true);

-- Add launch_voucher_code column to newsletter_subscribers
ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS launch_voucher_code TEXT;
