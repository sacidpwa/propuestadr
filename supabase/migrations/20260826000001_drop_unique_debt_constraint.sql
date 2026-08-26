-- Link adeudo_payments to petty_cash entries to prevent re-use
-- and link adeudo_payments to expense_entries (already exists for GastosUnidad)
ALTER TABLE public.adeudo_payments
  ADD COLUMN IF NOT EXISTS petty_cash_entry_id UUID REFERENCES public.petty_cash(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_adeudo_payments_petty_cash ON public.adeudo_payments(petty_cash_entry_id);

-- Backfill: link existing caja chica payments to their petty_cash entries
-- Match by notes pattern and date
UPDATE public.adeudo_payments ap
SET petty_cash_entry_id = pc.id
FROM public.petty_cash pc
WHERE ap.expense_entry_id IS NULL
  AND ap.petty_cash_entry_id IS NULL
  AND ap.notes LIKE 'Caja chica:%'
  AND ap.paid_at = pc.reference_date
  AND ap.recorded_by = pc.created_by
  AND pc.description IS NOT NULL
  AND ap.notes = 'Caja chica: ' || pc.description
  AND pc.id NOT IN (SELECT petty_cash_entry_id FROM public.adeudo_payments WHERE petty_cash_entry_id IS NOT NULL);
