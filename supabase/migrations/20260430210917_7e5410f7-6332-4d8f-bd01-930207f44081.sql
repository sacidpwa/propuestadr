
-- Lock flag for notes
ALTER TABLE public.medical_notes ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false;

-- Replace update policy to respect lock
DROP POLICY IF EXISTS "Specialist can update own notes" ON public.medical_notes;
CREATE POLICY "Specialist can update own unlocked notes"
ON public.medical_notes FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'especialista'::app_role)
    AND specialist_id = current_specialist_id()
    AND is_locked = false
  )
);

-- Informed consents
CREATE TABLE IF NOT EXISTS public.informed_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  consent_type text NOT NULL,
  content text NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now(),
  signed_by_name text,
  witness_name text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.informed_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical staff view consents" ON public.informed_consents FOR SELECT TO authenticated
USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'especialista'::app_role));
CREATE POLICY "Clinical staff insert consents" ON public.informed_consents FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'especialista'::app_role));

-- Vital signs
CREATE TABLE IF NOT EXISTS public.vital_signs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  note_id uuid,
  measured_at timestamptz NOT NULL DEFAULT now(),
  systolic_bp integer,
  diastolic_bp integer,
  heart_rate integer,
  resp_rate integer,
  temperature numeric(4,1),
  weight_kg numeric(5,2),
  height_cm numeric(5,2),
  bmi numeric(5,2),
  oxygen_saturation integer,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vital_signs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical staff view vitals" ON public.vital_signs FOR SELECT TO authenticated
USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'especialista'::app_role) OR has_role(auth.uid(),'recepcion'::app_role));
CREATE POLICY "Clinical staff insert vitals" ON public.vital_signs FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'especialista'::app_role) OR has_role(auth.uid(),'recepcion'::app_role));

-- Prescriptions
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  specialist_id uuid NOT NULL,
  note_id uuid,
  issued_at timestamptz NOT NULL DEFAULT now(),
  diagnostico text,
  indicaciones text,
  is_locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical view prescriptions" ON public.prescriptions FOR SELECT TO authenticated
USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'especialista'::app_role));
CREATE POLICY "Specialist insert prescriptions" ON public.prescriptions FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR (has_role(auth.uid(),'especialista'::app_role) AND specialist_id = current_specialist_id()));
CREATE POLICY "Specialist update own unlocked prescriptions" ON public.prescriptions FOR UPDATE TO authenticated
USING (has_role(auth.uid(),'admin'::app_role) OR (has_role(auth.uid(),'especialista'::app_role) AND specialist_id = current_specialist_id() AND is_locked = false));

CREATE TABLE IF NOT EXISTS public.prescription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medicamento text NOT NULL,
  presentacion text,
  dosis text,
  via text,
  frecuencia text,
  duracion text,
  indicaciones text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinical view prescription_items" ON public.prescription_items FOR SELECT TO authenticated
USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'especialista'::app_role));
CREATE POLICY "Clinical manage prescription_items" ON public.prescription_items FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'especialista'::app_role))
WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'especialista'::app_role));

-- Audit log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin view audit" ON public.audit_log FOR SELECT TO authenticated
USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Authenticated insert own audit" ON public.audit_log FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
