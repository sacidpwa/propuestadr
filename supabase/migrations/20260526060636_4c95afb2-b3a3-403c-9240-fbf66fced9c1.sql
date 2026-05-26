-- Add unit reference to patients (nullable, opcional asignación a unidad)
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS health_unit_id uuid REFERENCES public.health_units(id);
CREATE INDEX IF NOT EXISTS idx_patients_health_unit ON public.patients(health_unit_id);

-- Medication / event log
CREATE TYPE public.medication_log_type AS ENUM ('medicamento','estudio','consulta','salida','otro');

CREATE TABLE public.medication_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  health_unit_id uuid NOT NULL REFERENCES public.health_units(id),
  log_type public.medication_log_type NOT NULL DEFAULT 'medicamento',
  medication text,
  dose text,
  route text,
  description text,
  event_at timestamptz NOT NULL DEFAULT now(),
  recorded_by uuid NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_medication_log_patient ON public.medication_log(patient_id, event_at DESC);
CREATE INDEX idx_medication_log_unit ON public.medication_log(health_unit_id, event_at DESC);

ALTER TABLE public.medication_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/dueno/administrativo manage med log"
  ON public.medication_log FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo'));

CREATE POLICY "Enfermera view med log in unit"
  ON public.medication_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'enfermera') AND user_in_unit(auth.uid(), health_unit_id));

CREATE POLICY "Enfermera insert med log in unit"
  ON public.medication_log FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'enfermera') AND user_in_unit(auth.uid(), health_unit_id) AND recorded_by = auth.uid());

CREATE POLICY "Enfermera update own med log in unit"
  ON public.medication_log FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'enfermera') AND user_in_unit(auth.uid(), health_unit_id) AND recorded_by = auth.uid());

CREATE POLICY "Especialista view med log"
  ON public.medication_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'especialista'));

CREATE TRIGGER trg_medication_log_updated
  BEFORE UPDATE ON public.medication_log
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Meal plans (weekly menu)
CREATE TABLE public.meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_unit_id uuid NOT NULL REFERENCES public.health_units(id),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  desayuno text,
  colacion_am text,
  comida text,
  colacion_pm text,
  cena text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_meal_plans_unit_week ON public.meal_plans(health_unit_id, week_start);
CREATE INDEX idx_meal_plans_patient ON public.meal_plans(patient_id, week_start);

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/dueno/administrativo manage meal plans"
  ON public.meal_plans FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo'));

CREATE POLICY "Enfermera manage meal plans in unit"
  ON public.meal_plans FOR ALL TO authenticated
  USING (has_role(auth.uid(),'enfermera') AND user_in_unit(auth.uid(), health_unit_id))
  WITH CHECK (has_role(auth.uid(),'enfermera') AND user_in_unit(auth.uid(), health_unit_id));

CREATE TRIGGER trg_meal_plans_updated
  BEFORE UPDATE ON public.meal_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Meal intake (did patient eat?)
CREATE TABLE public.meal_intake (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  health_unit_id uuid NOT NULL REFERENCES public.health_units(id),
  intake_date date NOT NULL DEFAULT CURRENT_DATE,
  meal text NOT NULL CHECK (meal IN ('desayuno','colacion_am','comida','colacion_pm','cena')),
  consumed boolean NOT NULL DEFAULT true,
  amount text,
  notes text,
  recorded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_meal_intake_patient ON public.meal_intake(patient_id, intake_date DESC);

ALTER TABLE public.meal_intake ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/dueno/administrativo manage intake"
  ON public.meal_intake FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo'));

CREATE POLICY "Enfermera view intake in unit"
  ON public.meal_intake FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'enfermera') AND user_in_unit(auth.uid(), health_unit_id));

CREATE POLICY "Enfermera insert intake in unit"
  ON public.meal_intake FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'enfermera') AND user_in_unit(auth.uid(), health_unit_id) AND recorded_by = auth.uid());