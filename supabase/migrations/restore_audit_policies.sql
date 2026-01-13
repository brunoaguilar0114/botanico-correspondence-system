ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy for reading logs (needed for History page)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."audit_logs";
CREATE POLICY "Enable read access for authenticated users" ON "public"."audit_logs"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

-- Policy for creating logs (needed for auditService)
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON "public"."audit_logs";
CREATE POLICY "Enable insert access for authenticated users" ON "public"."audit_logs"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);
