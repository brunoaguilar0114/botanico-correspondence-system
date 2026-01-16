-- Migration: 007_create_storage_config.sql
-- Descripción: Crear tabla de configuración de almacenamiento para paquetes y cartas

-- 1. Crear tabla storage_config (patrón singleton)
CREATE TABLE IF NOT EXISTS storage_config (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,

  -- Capacidades máximas
  max_packages INTEGER NOT NULL DEFAULT 50,
  max_letters INTEGER NOT NULL DEFAULT 200,

  -- Umbrales de alerta para paquetes (porcentaje)
  packages_warning_threshold INTEGER NOT NULL DEFAULT 70,
  packages_critical_threshold INTEGER NOT NULL DEFAULT 90,

  -- Umbrales de alerta para cartas (porcentaje)
  letters_warning_threshold INTEGER NOT NULL DEFAULT 70,
  letters_critical_threshold INTEGER NOT NULL DEFAULT 90,

  -- Metadata
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by UUID REFERENCES auth.users(id),

  -- Constraint: solo puede existir un registro (singleton)
  CONSTRAINT single_config CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid),

  -- Constraints de validación
  CONSTRAINT valid_packages_thresholds CHECK (
    packages_warning_threshold > 0 AND
    packages_warning_threshold <= 100 AND
    packages_critical_threshold > 0 AND
    packages_critical_threshold <= 100 AND
    packages_warning_threshold <= packages_critical_threshold
  ),
  CONSTRAINT valid_letters_thresholds CHECK (
    letters_warning_threshold > 0 AND
    letters_warning_threshold <= 100 AND
    letters_critical_threshold > 0 AND
    letters_critical_threshold <= 100 AND
    letters_warning_threshold <= letters_critical_threshold
  ),
  CONSTRAINT valid_max_values CHECK (
    max_packages > 0 AND max_letters > 0
  )
);

-- 2. Crear índice para updated_at
CREATE INDEX IF NOT EXISTS idx_storage_config_updated_at ON storage_config(updated_at DESC);

-- 3. Insertar configuración por defecto
INSERT INTO storage_config (
  id,
  max_packages,
  max_letters,
  packages_warning_threshold,
  packages_critical_threshold,
  letters_warning_threshold,
  letters_critical_threshold
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  50,
  200,
  70,
  90,
  70,
  90
)
ON CONFLICT (id) DO NOTHING;

-- 4. Habilitar RLS
ALTER TABLE storage_config ENABLE ROW LEVEL SECURITY;

-- 5. Policy: super_admin y admin pueden leer Y actualizar
CREATE POLICY "Admins can manage storage config" ON storage_config
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

-- 6. Policy: recepcionista puede SOLO leer
CREATE POLICY "Receptionists can view storage config" ON storage_config
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'recepcionista'
  )
);

-- 7. Trigger para actualizar updated_at y updated_by automáticamente
CREATE OR REPLACE FUNCTION update_storage_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS storage_config_updated_at ON storage_config;
CREATE TRIGGER storage_config_updated_at
  BEFORE UPDATE ON storage_config
  FOR EACH ROW
  EXECUTE FUNCTION update_storage_config_timestamp();

-- 8. Trigger para auditoría de cambios
CREATE OR REPLACE FUNCTION audit_storage_config_update()
RETURNS TRIGGER AS $$
DECLARE
  v_changes TEXT := '';
BEGIN
  -- Detectar cambios específicos
  IF OLD.max_packages IS DISTINCT FROM NEW.max_packages THEN
    v_changes := v_changes || 'max_packages: ' || OLD.max_packages || ' → ' || NEW.max_packages || '; ';
  END IF;
  IF OLD.max_letters IS DISTINCT FROM NEW.max_letters THEN
    v_changes := v_changes || 'max_letters: ' || OLD.max_letters || ' → ' || NEW.max_letters || '; ';
  END IF;
  IF OLD.packages_warning_threshold IS DISTINCT FROM NEW.packages_warning_threshold THEN
    v_changes := v_changes || 'packages_warning: ' || OLD.packages_warning_threshold || '% → ' || NEW.packages_warning_threshold || '%; ';
  END IF;
  IF OLD.packages_critical_threshold IS DISTINCT FROM NEW.packages_critical_threshold THEN
    v_changes := v_changes || 'packages_critical: ' || OLD.packages_critical_threshold || '% → ' || NEW.packages_critical_threshold || '%; ';
  END IF;
  IF OLD.letters_warning_threshold IS DISTINCT FROM NEW.letters_warning_threshold THEN
    v_changes := v_changes || 'letters_warning: ' || OLD.letters_warning_threshold || '% → ' || NEW.letters_warning_threshold || '%; ';
  END IF;
  IF OLD.letters_critical_threshold IS DISTINCT FROM NEW.letters_critical_threshold THEN
    v_changes := v_changes || 'letters_critical: ' || OLD.letters_critical_threshold || '% → ' || NEW.letters_critical_threshold || '%; ';
  END IF;

  -- Solo registrar si hubo cambios
  IF v_changes <> '' THEN
    PERFORM log_audit_event(
      'UPDATE',
      'STORAGE_CONFIG',
      NEW.id,
      'Configuración de almacenamiento actualizada: ' || v_changes,
      'Exitoso'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS storage_config_audit_update ON storage_config;
CREATE TRIGGER storage_config_audit_update
  AFTER UPDATE ON storage_config
  FOR EACH ROW
  EXECUTE FUNCTION audit_storage_config_update();
