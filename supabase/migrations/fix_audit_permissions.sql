-- 1. Ensure the authenticated role has permissions
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";

-- 2. Ensure sequence usage is granted (if id is auto-incrementing)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "public" TO "authenticated";
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "public" TO "service_role";

-- 3. Make user_id nullable to prevent constraints from blocking logs
ALTER TABLE "public"."audit_logs" ALTER COLUMN "user_id" DROP NOT NULL;

-- 4. Re-apply simpler policies just in case
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON "public"."audit_logs";
CREATE POLICY "Enable insert access for authenticated users" ON "public"."audit_logs"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."audit_logs";
CREATE POLICY "Enable read access for authenticated users" ON "public"."audit_logs"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);
