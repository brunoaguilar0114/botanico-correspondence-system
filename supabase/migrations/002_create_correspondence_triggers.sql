-- Create triggers for correspondence table to automatically log audit events
-- These triggers ensure server-side enforcement of audit logging

-- Trigger function for INSERT
CREATE OR REPLACE FUNCTION audit_correspondence_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM log_audit_event(
    'CREATE',
    'CORRESPONDENCE',
    NEW.id,
    'Correspondencia creada para ' || NEW.recipient
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER correspondence_audit_insert
AFTER INSERT ON correspondence
FOR EACH ROW
EXECUTE FUNCTION audit_correspondence_insert();

-- Trigger function for UPDATE (only logs important changes)
CREATE OR REPLACE FUNCTION audit_correspondence_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM log_audit_event(
      'STATUS_CHANGE',
      'CORRESPONDENCE',
      NEW.id,
      'Estado cambiado de ' || COALESCE(OLD.status, 'N/A') || ' a ' || NEW.status || ' para ' || NEW.recipient
    );
  END IF;
  
  -- Log other important field changes
  IF (OLD.recipient, OLD.recipient_email, OLD.sender) IS DISTINCT FROM 
     (NEW.recipient, NEW.recipient_email, NEW.sender) THEN
    PERFORM log_audit_event(
      'UPDATE',
      'CORRESPONDENCE',
      NEW.id,
      'Correspondencia actualizada para ' || NEW.recipient
    );
  END IF;
  
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
AS $$
BEGIN
  PERFORM log_audit_event(
    'DELETE',
    'CORRESPONDENCE',
    OLD.id,
    'Correspondencia eliminada (Destinatario: ' || COALESCE(OLD.recipient, 'Desconocido') || ')'
  );
  RETURN OLD;
END;
$$;

CREATE TRIGGER correspondence_audit_delete
AFTER DELETE ON correspondence
FOR EACH ROW
EXECUTE FUNCTION audit_correspondence_delete();

