
-- Health units
CREATE TABLE public.health_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.health_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active units" ON public.health_units
  FOR SELECT TO authenticated USING (is_active = true OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dueno'));

CREATE POLICY "Admin/dueno manage units" ON public.health_units
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dueno'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dueno'));

CREATE TRIGGER trg_health_units_updated BEFORE UPDATE ON public.health_units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Areas enum
CREATE TYPE public.work_area AS ENUM ('enfermeria','intendencia','administracion','abastecimiento','mantenimiento','contabilidad','rrhh','direccion');

-- Employee assignments
CREATE TABLE public.employee_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  health_unit_id uuid NOT NULL REFERENCES public.health_units(id) ON DELETE CASCADE,
  area public.work_area NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, health_unit_id, area)
);

CREATE INDEX idx_emp_assign_user ON public.employee_assignments(user_id);
CREATE INDEX idx_emp_assign_unit ON public.employee_assignments(health_unit_id);

ALTER TABLE public.employee_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User view own assignments" ON public.employee_assignments
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dueno') OR public.has_role(auth.uid(), 'administrativo'));

CREATE POLICY "Admin/dueno manage assignments" ON public.employee_assignments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dueno'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dueno'));

CREATE TRIGGER trg_emp_assign_updated BEFORE UPDATE ON public.employee_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: user belongs to unit
CREATE OR REPLACE FUNCTION public.user_in_unit(_user_id uuid, _unit_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employee_assignments
    WHERE user_id = _user_id AND health_unit_id = _unit_id AND is_active = true
  );
$$;

-- Seed units
INSERT INTO public.health_units (name, description) VALUES
  ('Centro Benesse','Centro especializado en control de adicciones'),
  ('Senior Living','Residencia y cuidado de adultos mayores'),
  ('CT Alcatraces','Centro terapéutico Alcatraces')
ON CONFLICT (name) DO NOTHING;
