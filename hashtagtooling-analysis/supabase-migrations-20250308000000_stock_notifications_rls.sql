-- Stock notifications RLS (admin read/update)
DROP POLICY IF EXISTS "Allow admin read" ON stock_notifications;
CREATE POLICY "Allow admin read" ON stock_notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin update" ON stock_notifications;
CREATE POLICY "Allow admin update" ON stock_notifications FOR UPDATE USING (true);
