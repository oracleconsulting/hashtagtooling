ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_contact_messages_unread ON contact_messages(created_at DESC) WHERE read = false;
