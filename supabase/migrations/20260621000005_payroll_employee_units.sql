ALTER TYPE public.payroll_area ADD VALUE IF NOT EXISTS 'medicina';
ALTER TYPE public.payroll_area ADD VALUE IF NOT EXISTS 'administracion';
ALTER TYPE public.payroll_area ADD VALUE IF NOT EXISTS 'rrhh';
ALTER TYPE public.payroll_area ADD VALUE IF NOT EXISTS 'recepcion';

CREATE TABLE IF NOT EXISTS public.payroll_employee_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.payroll_employees(id) ON DELETE CASCADE,
  health_unit_id uuid NOT NULL REFERENCES public.health_units(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, health_unit_id)
);

CREATE INDEX IF NOT EXISTS idx_payroll_emp_units_employee ON public.payroll_employee_units(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_emp_units_unit ON public.payroll_employee_units(health_unit_id);

ALTER TABLE public.payroll_employee_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage employee_units" ON public.payroll_employee_units
FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin'))
WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin'));

CREATE POLICY "Contador view employee_units" ON public.payroll_employee_units
FOR SELECT TO authenticated
USING (has_role(auth.uid(),'contador'));
