-- Referral codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  owner_email TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 10.00,
  reward_amount DECIMAL(10,2) DEFAULT 10.00,
  times_used INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT 50,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track each referral use
CREATE TABLE IF NOT EXISTS referral_uses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_code_id UUID REFERENCES referral_codes(id),
  used_by_email TEXT NOT NULL,
  order_id UUID REFERENCES orders(id),
  discount_applied DECIMAL(10,2),
  reward_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_uses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active codes" ON referral_codes;
CREATE POLICY "Public read active codes" ON referral_codes FOR SELECT USING (active = true);
DROP POLICY IF EXISTS "Public insert uses" ON referral_uses;
CREATE POLICY "Public insert uses" ON referral_uses FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin full access codes" ON referral_codes;
CREATE POLICY "Admin full access codes" ON referral_codes FOR ALL USING (true);
DROP POLICY IF EXISTS "Admin full access uses" ON referral_uses;
CREATE POLICY "Admin full access uses" ON referral_uses FOR ALL USING (true);
