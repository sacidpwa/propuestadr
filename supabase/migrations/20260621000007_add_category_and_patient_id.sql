ALTER TABLE public.patient_invoices
  ADD COLUMN IF NOT EXISTS category text;

ALTER TABLE public.expense_entries
  ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS patient_name text;

CREATE INDEX IF NOT EXISTS idx_expense_entries_patient ON public.expense_entries(patient_id);
