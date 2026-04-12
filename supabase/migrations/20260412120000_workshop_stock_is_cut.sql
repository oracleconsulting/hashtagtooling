ALTER TABLE workshop_stock
  ADD COLUMN IF NOT EXISTS is_cut BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN workshop_stock.is_cut IS 'Whether the blank has been cut to size and is ready to use';

CREATE INDEX idx_ws_is_cut ON workshop_stock(is_cut);
