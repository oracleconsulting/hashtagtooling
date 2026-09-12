-- Private per-signup build invites for bottle opener / muddler.

ALTER TABLE interest_signups ADD COLUMN IF NOT EXISTS invite_token TEXT UNIQUE;
ALTER TABLE interest_signups ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMPTZ;
ALTER TABLE interest_signups ADD COLUMN IF NOT EXISTS invite_viewed_at TIMESTAMPTZ;
ALTER TABLE interest_signups ADD COLUMN IF NOT EXISTS build_intent JSONB;
ALTER TABLE interest_signups ADD COLUMN IF NOT EXISTS build_intent_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS interest_signups_invite_token_key
  ON interest_signups (invite_token)
  WHERE invite_token IS NOT NULL;
