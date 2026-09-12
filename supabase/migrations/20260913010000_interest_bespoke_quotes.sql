-- Bespoke requests on a private build invite: request → quote → accept/refuse.

ALTER TABLE interest_signups ADD COLUMN IF NOT EXISTS bespoke_quote jsonb;
