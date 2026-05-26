-- Extend expense_entries
ALTER TABLE public.expense_entries
  ADD COLUMN IF NOT EXISTS health_unit_id uuid REFERENCES public.health_units(id),
  ADD COLUMN IF NOT EXISTS receipt_url text,
  ADD COLUMN IF NOT EXISTS operation_date date,
  ADD COLUMN IF NOT EXISTS entry_type text NOT NULL DEFAULT 'gasto';
CREATE INDEX IF NOT EXISTS idx_expense_unit ON public.expense_entries(health_unit_id, expense_date DESC);

-- Patient invoices (subidas por Iván)
CREATE TYPE public.invoice_status AS ENUM ('pendiente','verificada','erronea','cancelada');

CREATE TABLE public.patient_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  patient_name text NOT NULL,
  health_unit_id uuid REFERENCES public.health_units(id),
  invoice_number text,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric NOT NULL DEFAULT 0,
  concept text,
  file_url text,
  status public.invoice_status NOT NULL DEFAULT 'pendiente',
  error_reason text,
  uploaded_by uuid NOT NULL,
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_invoices_status ON public.patient_invoices(status, invoice_date DESC);

ALTER TABLE public.patient_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finanzas view invoices" ON public.patient_invoices FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'contador'));

CREATE POLICY "Contador/admin insert invoices" ON public.patient_invoices FOR INSERT TO authenticated
  WITH CHECK ((has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'contador')) AND uploaded_by = auth.uid());

CREATE POLICY "Admin/administrativo verify invoices" ON public.patient_invoices FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'contador'));

CREATE TRIGGER trg_patient_invoices_updated BEFORE UPDATE ON public.patient_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Client fees / cuotas
CREATE TYPE public.fee_recurrence AS ENUM ('unica','semanal','quincenal','mensual');

CREATE TABLE public.client_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  patient_name text NOT NULL,
  health_unit_id uuid REFERENCES public.health_units(id),
  amount numeric NOT NULL,
  recurrence public.fee_recurrence NOT NULL DEFAULT 'mensual',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  next_due_date date NOT NULL,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_client_fees_due ON public.client_fees(next_due_date, is_active);

ALTER TABLE public.client_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finanzas view fees" ON public.client_fees FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'contador'));

CREATE POLICY "Contador/admin manage fees" ON public.client_fees FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'contador'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'contador'));

CREATE TRIGGER trg_client_fees_updated BEFORE UPDATE ON public.client_fees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Payments applied to fees
CREATE TABLE public.client_fee_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_id uuid NOT NULL REFERENCES public.client_fees(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  paid_at date NOT NULL DEFAULT CURRENT_DATE,
  method text,
  reference text,
  notes text,
  recorded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_fee_payments_fee ON public.client_fee_payments(fee_id, paid_at DESC);

ALTER TABLE public.client_fee_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finanzas view fee payments" ON public.client_fee_payments FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'contador'));

CREATE POLICY "Finanzas insert fee payments" ON public.client_fee_payments FOR INSERT TO authenticated
  WITH CHECK ((has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'contador')) AND recorded_by = auth.uid());

-- Helper to roll fee due date after payment
CREATE OR REPLACE FUNCTION public.advance_fee_due_date()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE rec public.fee_recurrence;
BEGIN
  SELECT recurrence INTO rec FROM public.client_fees WHERE id = NEW.fee_id;
  IF rec = 'semanal' THEN
    UPDATE public.client_fees SET next_due_date = next_due_date + INTERVAL '7 days' WHERE id = NEW.fee_id;
  ELSIF rec = 'quincenal' THEN
    UPDATE public.client_fees SET next_due_date = next_due_date + INTERVAL '15 days' WHERE id = NEW.fee_id;
  ELSIF rec = 'mensual' THEN
    UPDATE public.client_fees SET next_due_date = next_due_date + INTERVAL '1 month' WHERE id = NEW.fee_id;
  ELSIF rec = 'unica' THEN
    UPDATE public.client_fees SET is_active = false WHERE id = NEW.fee_id;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_advance_fee AFTER INSERT ON public.client_fee_payments
  FOR EACH ROW EXECUTE FUNCTION public.advance_fee_due_date();

-- Storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts','receipts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Receipts bucket read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'receipts' AND (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin') OR has_role(auth.uid(),'contador')
  ));
CREATE POLICY "Receipts bucket upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin') OR has_role(auth.uid(),'contador')
  ));
CREATE POLICY "Receipts bucket delete owner/admin" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'receipts' AND (owner = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo')));