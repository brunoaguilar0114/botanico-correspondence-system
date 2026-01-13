-- Create audit_logs table for tracking all system events
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'NOTIFY', 'DELIVER', 'DIGITIZE', 'LOGIN'
  resource_type TEXT NOT NULL, -- 'CORRESPONDENCE', 'USER', 'AUTH'
  resource_id UUID,
  details TEXT,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  status TEXT DEFAULT 'Exitoso',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and staff can view all audit logs
CREATE POLICY "Staff can view all audit logs" ON audit_logs
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('super_admin', 'admin', 'recepcionista')
  );

-- Policy: System can insert audit logs (from authenticated users)
CREATE POLICY "Authenticated users can create audit logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create index for faster queries
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
