-- Fix RLS policies for audit_logs table
-- Only super_admin can read all audit logs, but all authenticated users can insert
-- (needed for triggers and client-side logging)

-- Drop existing read policies
DROP POLICY IF EXISTS "Staff can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON audit_logs;

-- Create new policy: Only super_admin can read audit logs
CREATE POLICY "Super admin can read all audit logs" ON audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  )
);

-- Keep insert policy (all authenticated users can insert, needed for triggers)
DROP POLICY IF EXISTS "Authenticated users can create audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON audit_logs;

CREATE POLICY "Authenticated users can insert audit logs" ON audit_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

