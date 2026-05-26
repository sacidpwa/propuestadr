
-- New roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'enfermera';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'intendencia';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'mantenimiento';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'asistente_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'contador';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'rrhh';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'empleado';
