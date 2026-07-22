
-- Add 'especialista' role if not present (already in enum per types)
-- Add is_partner to specialists
ALTER TABLE public.specialists ADD COLUMN IF NOT EXISTS is_partner BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.specialists ADD COLUMN IF NOT EXISTS user_id UUID;

CREATE INDEX IF NOT EXISTS idx_specialists_user_id ON public.specialists(user_id);

-- =========================
-- APPOINTMENTS
-- =========================
CREATE TYPE public.appointment_status AS ENUM ('programada', 'confirmada', 'cancelada', 'completada', 'no_asistio');

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES public.specialists(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status public.appointment_status NOT NULL DEFAULT 'programada',
  reason TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_specialist_date ON public.appointments(specialist_id, scheduled_at);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Helper: get specialist row id from auth user
CREATE OR REPLACE FUNCTION public.current_specialist_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.specialists WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE POLICY "Admin/recepcion can view all appointments"
  ON public.appointments FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'recepcion'::app_role)
    OR specialist_id = public.current_specialist_id()
  );

CREATE POLICY "Admin/recepcion can insert appointments"
  ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'recepcion'::app_role)
    OR (has_role(auth.uid(), 'especialista'::app_role) AND specialist_id = public.current_specialist_id())
  );

CREATE POLICY "Admin/recepcion/owner can update appointments"
  ON public.appointments FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'recepcion'::app_role)
    OR specialist_id = public.current_specialist_id()
  );

CREATE POLICY "Admin can delete appointments"
  ON public.appointments FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recepcion'::app_role));

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- MEDICAL RECORDS (one per patient)
-- =========================
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL UNIQUE REFERENCES public.patients(id) ON DELETE CASCADE,
  -- Identificación
  gender TEXT,
  marital_status TEXT,
  occupation TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  -- Antecedentes
  heredofamiliares TEXT,
  personales_no_patologicos TEXT,
  personales_patologicos TEXT,
  alergias TEXT,
  medicamentos_actuales TEXT,
  -- Resumen clínico
  diagnostico_cie10 TEXT,
  diagnostico_descripcion TEXT,
  plan_terapeutico TEXT,
  observaciones TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinical staff can view records"
  ON public.medical_records FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'especialista'::app_role)
  );

CREATE POLICY "Clinical staff can insert records"
  ON public.medical_records FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'especialista'::app_role)
  );

CREATE POLICY "Clinical staff can update records"
  ON public.medical_records FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'especialista'::app_role)
  );

CREATE TRIGGER update_medical_records_updated_at
  BEFORE UPDATE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- MEDICAL NOTES (per session)
-- =========================
CREATE TABLE public.medical_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES public.specialists(id),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  session_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  motivo_consulta TEXT,
  padecimiento_actual TEXT,
  -- Examen mental (psiquiatría)
  apariencia TEXT,
  conciencia TEXT,
  orientacion TEXT,
  afecto TEXT,
  pensamiento TEXT,
  juicio TEXT,
  -- Resultado
  diagnostico_sesion TEXT,
  plan_sesion TEXT,
  medicamentos TEXT,
  proxima_cita DATE,
  notas_libres TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_medical_notes_patient ON public.medical_notes(patient_id, session_date DESC);

ALTER TABLE public.medical_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinical staff can view notes"
  ON public.medical_notes FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'especialista'::app_role)
  );

CREATE POLICY "Specialist can insert own notes"
  ON public.medical_notes FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR (has_role(auth.uid(), 'especialista'::app_role) AND specialist_id = public.current_specialist_id())
  );

CREATE POLICY "Specialist can update own notes"
  ON public.medical_notes FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (has_role(auth.uid(), 'especialista'::app_role) AND specialist_id = public.current_specialist_id())
  );

CREATE TRIGGER update_medical_notes_updated_at
  BEFORE UPDATE ON public.medical_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- FIXED EXPENSES (catalog) + ENTRIES (monthly)
-- =========================
CREATE TABLE public.fixed_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  default_amount NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/administrativo manage fixed_expenses"
  ON public.fixed_expenses FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'administrativo'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'administrativo'::app_role));

CREATE TRIGGER update_fixed_expenses_updated_at
  BEFORE UPDATE ON public.fixed_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.expense_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixed_expense_id UUID REFERENCES public.fixed_expenses(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  category TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expense_entries_period ON public.expense_entries(period_year, period_month);

ALTER TABLE public.expense_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/administrativo manage expense_entries"
  ON public.expense_entries FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'administrativo'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'administrativo'::app_role));

CREATE TRIGGER update_expense_entries_updated_at
  BEFORE UPDATE ON public.expense_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
