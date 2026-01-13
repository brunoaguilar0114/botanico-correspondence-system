-- Create trigger for profiles table to automatically log important profile updates
-- This ensures server-side enforcement of audit logging for user profile changes

CREATE OR REPLACE FUNCTION audit_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
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
END;
$$;

CREATE TRIGGER profile_audit_update
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION audit_profile_update();

