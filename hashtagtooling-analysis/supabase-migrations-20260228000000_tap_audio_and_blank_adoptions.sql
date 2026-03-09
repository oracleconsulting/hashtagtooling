-- PROMPT 11: Tap test audio for materials
ALTER TABLE materials ADD COLUMN IF NOT EXISTS tap_audio_url TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS tap_audio_description TEXT;

-- PROMPT 12: Adopt a Blank tracking tables
CREATE TABLE IF NOT EXISTS blank_adoptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  status TEXT DEFAULT 'adopted' CHECK (status IN ('adopted', 'in_progress', 'finishing', 'complete', 'shipped')),
  adopted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  stripe_payment_id TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS blank_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  adoption_id UUID REFERENCES blank_adoptions(id) ON DELETE CASCADE,
  update_text TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE blank_adoptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blank_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read adoptions" ON blank_adoptions;
CREATE POLICY "Public read adoptions" ON blank_adoptions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read updates" ON blank_updates;
CREATE POLICY "Public read updates" ON blank_updates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin all adoptions" ON blank_adoptions;
CREATE POLICY "Admin all adoptions" ON blank_adoptions FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin all updates" ON blank_updates;
CREATE POLICY "Admin all updates" ON blank_updates FOR ALL USING (true);

-- Storage buckets: create 'tap-audio' and 'blank-updates' (Public) in Supabase Dashboard
