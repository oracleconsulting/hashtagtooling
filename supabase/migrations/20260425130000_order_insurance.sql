-- Track shipping and insurance separately on orders for accounting
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_amount DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS insurance_amount DECIMAL(10,2);
