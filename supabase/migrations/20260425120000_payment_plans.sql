-- Payment plan + balance tracking on orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_plan TEXT
  DEFAULT 'full' CHECK (payment_plan IN ('full', 'deposit'));

ALTER TABLE orders ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS balance_amount DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS upfront_amount DECIMAL(10,2);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS balance_status TEXT
  DEFAULT 'not_applicable'
  CHECK (balance_status IN (
    'not_applicable',
    'awaiting_build',
    'awaiting_payment',
    'paid',
    'cancelled'
  ));

ALTER TABLE orders ADD COLUMN IF NOT EXISTS build_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS balance_due_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS balance_paid_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS balance_stripe_payment_intent_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS balance_paypal_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS balance_payment_token TEXT;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'paid',
    'awaiting_balance',
    'shipped',
    'completed',
    'refunded',
    'cancelled'
  ));

CREATE INDEX IF NOT EXISTS idx_orders_balance_status ON orders(balance_status)
  WHERE balance_status IN ('awaiting_build', 'awaiting_payment');
CREATE INDEX IF NOT EXISTS idx_orders_balance_due_date ON orders(balance_due_date)
  WHERE balance_status = 'awaiting_payment';
