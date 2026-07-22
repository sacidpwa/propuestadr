-- Daily consultation log for receptionists (Evelyn)
CREATE TABLE public.consultation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_unit_id uuid NOT NULL REFERENCES public.health_units(id),
  record_date date NOT NULL,
  specialist_name text NOT NULL,
  patient_name text NOT NULL,
  service_type text NOT NULL,
  cost numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text,
  amount_collected numeric(10,2),
  payment_date date,
  transfer_to text,
  has_invoice boolean NOT NULL DEFAULT false,
  invoice_date date,
  invoice_folio text,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_consultation_log_date ON public.consultation_log(health_unit_id, record_date DESC);
CREATE INDEX idx_consultation_log_specialist ON public.consultation_log(specialist_name);

ALTER TABLE public.consultation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/dueno/administrativo manage consultation_log"
  ON public.consultation_log FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin'));

CREATE POLICY "Recepcion manage own consultation_log"
  ON public.consultation_log FOR ALL TO authenticated
  USING (has_role(auth.uid(),'recepcion') AND created_by = auth.uid())
  WITH CHECK (has_role(auth.uid(),'recepcion') AND created_by = auth.uid());

CREATE POLICY "Recepcion view all consultation_log"
  ON public.consultation_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'recepcion'));

CREATE TRIGGER trg_consultation_log_updated
  BEFORE UPDATE ON public.consultation_log
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
