CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE IF NOT EXISTS cron_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO cron_config (key, value) VALUES
  ('balance_cron_secret', 'CHANGE_ME_TO_A_LONG_RANDOM_STRING'),
  ('site_url', 'https://hashtag.guru')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION build_balance_cron_url(action TEXT, order_id UUID)
RETURNS TEXT AS $$
  SELECT (SELECT value FROM cron_config WHERE key = 'site_url')
    || '/api/balance-cron-tick?action=' || action
    || '&order=' || order_id::text;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION balance_cron_auth_header()
RETURNS jsonb AS $$
  SELECT jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || (SELECT value FROM cron_config WHERE key = 'balance_cron_secret')
  );
$$ LANGUAGE SQL STABLE;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS reminder_7d_sent_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reminder_2d_sent_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS auto_cancelled_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION send_balance_reminders()
RETURNS void AS $$
DECLARE
  o RECORD;
BEGIN
  FOR o IN
    SELECT id FROM orders
    WHERE balance_status = 'awaiting_payment'
      AND reminder_7d_sent_at IS NULL
      AND balance_due_date::date = (NOW() + INTERVAL '7 days')::date
  LOOP
    PERFORM net.http_post(
      url := build_balance_cron_url('remind_7d', o.id),
      headers := balance_cron_auth_header(),
      body := '{}'::jsonb
    );
  END LOOP;

  FOR o IN
    SELECT id FROM orders
    WHERE balance_status = 'awaiting_payment'
      AND reminder_2d_sent_at IS NULL
      AND balance_due_date::date = (NOW() + INTERVAL '2 days')::date
  LOOP
    PERFORM net.http_post(
      url := build_balance_cron_url('remind_2d', o.id),
      headers := balance_cron_auth_header(),
      body := '{}'::jsonb
    );
  END LOOP;

  FOR o IN
    SELECT id FROM orders
    WHERE balance_status = 'awaiting_payment'
      AND auto_cancelled_at IS NULL
      AND balance_due_date < NOW()
  LOOP
    PERFORM net.http_post(
      url := build_balance_cron_url('auto_cancel', o.id),
      headers := balance_cron_auth_header(),
      body := '{}'::jsonb
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT cron.schedule(
  'balance-reminders-and-cancellations',
  '0 10 * * *',
  $$ SELECT send_balance_reminders(); $$
);
