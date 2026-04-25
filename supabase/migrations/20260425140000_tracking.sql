-- Anonymous session-based tracking. No PII at this stage.

CREATE TABLE IF NOT EXISTS tracking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  email TEXT,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  referrer TEXT
);

CREATE INDEX IF NOT EXISTS idx_tracking_sessions_session ON tracking_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_email ON tracking_sessions(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_last_seen ON tracking_sessions(last_seen_at DESC);

CREATE TABLE IF NOT EXISTS tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'view_item',
    'add_to_cart',
    'remove_from_cart',
    'add_to_wishlist',
    'remove_from_wishlist',
    'begin_checkout',
    'purchase'
  )),
  product_id TEXT,
  product_name TEXT,
  product_category TEXT,
  price DECIMAL(10,2),
  quantity INTEGER DEFAULT 1,
  metadata JSONB,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracking_events_session ON tracking_events(session_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_type ON tracking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_tracking_events_product ON tracking_events(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tracking_events_occurred ON tracking_events(occurred_at DESC);

CREATE TABLE IF NOT EXISTS cart_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  items JSONB NOT NULL,
  total_value DECIMAL(10,2),
  item_count INTEGER,
  last_updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cart_snapshots_session ON cart_snapshots(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_snapshots_updated ON cart_snapshots(last_updated_at DESC);

CREATE TABLE IF NOT EXISTS wishlist_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  items JSONB NOT NULL,
  item_count INTEGER,
  last_updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wishlist_snapshots_session ON wishlist_snapshots(session_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_snapshots_updated ON wishlist_snapshots(last_updated_at DESC);

ALTER TABLE tracking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_snapshots    ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_tracking_sessions" ON tracking_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_select_tracking_events"   ON tracking_events   FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_select_cart_snapshots"    ON cart_snapshots    FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_select_wishlist_snapshots" ON wishlist_snapshots FOR SELECT TO authenticated USING (true);
