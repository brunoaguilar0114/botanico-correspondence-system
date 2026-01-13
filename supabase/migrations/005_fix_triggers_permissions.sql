-- Fix triggers and RPC function permissions to ensure audit logging works
-- This migration ensures that triggers can execute the RPC function correctly

-- First, ensure the RPC function has proper permissions and can be called by triggers
-- The function needs to be SECURITY DEFINER to access auth.uid() and profiles table
CREATE OR REPLACE FUNCTION log_audit_event(
  p_event_type TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_details TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'Exitoso'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_log_id UUID;
BEGIN
  -- Get current user from JWT
  v_user_id := auth.uid();
  
  -- Get user_name from profiles if user exists
  IF v_user_id IS NOT NULL THEN
    SELECT full_name INTO v_user_name
    FROM profiles
    WHERE id = v_user_id;
  END IF;
  
  -- Insert audit log (bypass RLS since we're SECURITY DEFINER)
  INSERT INTO audit_logs (
    event_type,
    resource_type,
    resource_id,
    details,
    user_id,
    user_name,
    status,
    is_legacy
  ) VALUES (
    p_event_type,
    p_resource_type,
    p_resource_id,
    p_details,
    v_user_id,
    COALESCE(v_user_name, 'Sistema'),
    p_status,
    FALSE
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the trigger
    RAISE WARNING 'Error in log_audit_event: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- Grant execute permission to authenticated users and triggers
GRANT EXECUTE ON FUNCTION log_audit_event TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit_event TO service_role;
GRANT EXECUTE ON FUNCTION log_audit_event TO anon; -- Needed for triggers

-- Recreate triggers to ensure they work correctly
DROP TRIGGER IF EXISTS correspondence_audit_insert ON correspondence;
DROP TRIGGER IF EXISTS correspondence_audit_update ON correspondence;
DROP TRIGGER IF EXISTS correspondence_audit_delete ON correspondence;

-- Trigger function for INSERT
CREATE OR REPLACE FUNCTION audit_correspondence_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM log_audit_event(
    'CREATE',
    'CORRESPONDENCE',
    NEW.id,
    'Correspondencia creada para ' || COALESCE(NEW.recipient, 'Desconocido')
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in audit_correspondence_insert: %', SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER correspondence_audit_insert
AFTER INSERT ON correspondence
FOR EACH ROW
EXECUTE FUNCTION audit_correspondence_insert();

-- Trigger function for UPDATE
CREATE OR REPLACE FUNCTION audit_correspondence_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM log_audit_event(
      'STATUS_CHANGE',
      'CORRESPONDENCE',
      NEW.id,
      'Estado cambiado de ' || COALESCE(OLD.status, 'N/A') || ' a ' || NEW.status || ' para ' || COALESCE(NEW.recipient, 'Desconocido')
    );
  END IF;
  
  -- Log other important field changes
  IF (OLD.recipient, OLD.recipient_email, OLD.sender) IS DISTINCT FROM 
     (NEW.recipient, NEW.recipient_email, NEW.sender) THEN
    PERFORM log_audit_event(
      'UPDATE',
      'CORRESPONDENCE',
      NEW.id,
      'Correspondencia actualizada para ' || COALESCE(NEW.recipient, 'Desconocido')
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in audit_correspondence_update: %', SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER correspondence_audit_update
AFTER UPDATE ON correspondence
FOR EACH ROW
EXECUTE FUNCTION audit_correspondence_update();

-- Trigger function for DELETE
CREATE OR REPLACE FUNCTION audit_correspondence_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM log_audit_event(
    'DELETE',
    'CORRESPONDENCE',
    OLD.id,
    'Correspondencia eliminada (Destinatario: ' || COALESCE(OLD.recipient, 'Desconocido') || ')'
  );
  RETURN OLD;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in audit_correspondence_delete: %', SQLERRM;
    RETURN OLD;
END;
$$;

CREATE TRIGGER correspondence_audit_delete
AFTER DELETE ON correspondence
FOR EACH ROW
EXECUTE FUNCTION audit_correspondence_delete();

-- Recreate profile trigger
DROP TRIGGER IF EXISTS profile_audit_update ON profiles;

CREATE OR REPLACE FUNCTION audit_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_changes TEXT[];
BEGIN
  -- Detect important changes
  IF OLD.full_name IS DISTINCT FROM NEW.full_name THEN
    v_changes := array_append(v_changes, 'nombre: ' || COALESCE(OLD.full_name, 'N/A') || ' → ' || COALESCE(NEW.full_name, 'N/A'));
  END IF;
  
  IF OLD.phone_number IS DISTINCT FROM NEW.phone_number THEN
    v_changes := array_append(v_changes, 'teléfono');
  END IF;
  
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    v_changes := array_append(v_changes, 'rol: ' || COALESCE(OLD.role, 'N/A') || ' → ' || NEW.role);
  END IF;
  
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_changes := array_append(v_changes, 'estado: ' || COALESCE(OLD.status::TEXT, 'N/A') || ' → ' || COALESCE(NEW.status::TEXT, 'N/A'));
  END IF;
  
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    v_changes := array_append(v_changes, 'email: ' || COALESCE(OLD.email, 'N/A') || ' → ' || COALESCE(NEW.email, 'N/A'));
  END IF;
  
  IF OLD.notification_email IS DISTINCT FROM NEW.notification_email THEN
    v_changes := array_append(v_changes, 'email de notificaciones');
  END IF;
  
  IF OLD.email_notifications IS DISTINCT FROM NEW.email_notifications THEN
    v_changes := array_append(v_changes, 'preferencias de notificaciones');
  END IF;
  
  IF OLD.avatar_url IS DISTINCT FROM NEW.avatar_url THEN
    v_changes := array_append(v_changes, 'avatar');
  END IF;
  
  -- Only log if there are actual changes
  IF array_length(v_changes, 1) > 0 THEN
    PERFORM log_audit_event(
      'UPDATE',
      'USER',
      NEW.id,
      'Perfil actualizado: ' || array_to_string(v_changes, ', ') || ' para ' || COALESCE(NEW.full_name, NEW.email)
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in audit_profile_update: %', SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER profile_audit_update
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION audit_profile_update();

