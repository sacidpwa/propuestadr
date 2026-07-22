
-- Payroll system
CREATE TYPE public.payroll_area AS ENUM ('enfermeria','intendencia','mantenimiento','administrativo','otro');
CREATE TYPE public.payroll_status AS ENUM ('borrador','autorizada','pagada','cancelada');
CREATE TYPE public.payroll_frequency AS ENUM ('semanal','quincenal','mensual');

-- Employees registry (separate from auth users; payroll people may not have login)
CREATE TABLE public.payroll_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  rfc text,
  position text,
  area public.payroll_area NOT NULL,
  health_unit_id uuid,
  base_salary numeric NOT NULL DEFAULT 0,
  frequency public.payroll_frequency NOT NULL DEFAULT 'quincenal',
  bank text,
  bank_account text,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payroll_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage payroll_employees" ON public.payroll_employees
FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin'))
WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin'));

CREATE POLICY "Contador view payroll_employees" ON public.payroll_employees
FOR SELECT TO authenticated
USING (has_role(auth.uid(),'contador'));

-- Payroll runs
CREATE TABLE public.payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_unit_id uuid,
  area public.payroll_area NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  frequency public.payroll_frequency NOT NULL DEFAULT 'quincenal',
  total_amount numeric NOT NULL DEFAULT 0,
  status public.payroll_status NOT NULL DEFAULT 'borrador',
  notes text,
  created_by uuid NOT NULL,
  authorized_by uuid,
  authorized_at timestamptz,
  paid_by uuid,
  paid_at timestamptz,
  payment_method text,
  payment_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage payroll_runs" ON public.payroll_runs
FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin'))
WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin'));

CREATE POLICY "Contador view payroll_runs" ON public.payroll_runs
FOR SELECT TO authenticated
USING (has_role(auth.uid(),'contador'));

-- Payroll items (per employee in a run)
CREATE TABLE public.payroll_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  employee_name text NOT NULL,
  base_amount numeric NOT NULL DEFAULT 0,
  bonuses numeric NOT NULL DEFAULT 0,
  deductions numeric NOT NULL DEFAULT 0,
  absences numeric NOT NULL DEFAULT 0,
  overtime numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL DEFAULT 0,
  receipt_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payroll_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage payroll_items" ON public.payroll_items
FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin'))
WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin'));

CREATE POLICY "Contador view payroll_items" ON public.payroll_items
FOR SELECT TO authenticated
USING (has_role(auth.uid(),'contador'));

CREATE TRIGGER payroll_employees_updated BEFORE UPDATE ON public.payroll_employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER payroll_runs_updated BEFORE UPDATE ON public.payroll_runs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER payroll_items_updated BEFORE UPDATE ON public.payroll_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
