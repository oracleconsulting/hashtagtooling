-- Track interest signups from spec → basket → paid order.

ALTER TABLE interest_signups ADD COLUMN IF NOT EXISTS cart_at TIMESTAMPTZ;
ALTER TABLE interest_signups ADD COLUMN IF NOT EXISTS order_id UUID;
ALTER TABLE interest_signups ADD COLUMN IF NOT EXISTS order_placed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS interest_signups_order_id_idx
  ON interest_signups (order_id)
  WHERE order_id IS NOT NULL;
