-- Link adeudo_payments to petty_cash entries to prevent re-use
ALTER TABLE public.adeudo_payments
  ADD COLUMN IF NOT EXISTS petty_cash_entry_id UUID REFERENCES public.petty_cash(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_adeudo_payments_petty_cash ON public.adeudo_payments(petty_cash_entry_id);
