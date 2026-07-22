-- Link purchase_orders to expense_entries for financial dashboard drill-down

-- 1. Add "pagada" to PO status check
ALTER TABLE public.purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_status_check;
ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_status_check
  CHECK (status IN ('pendiente','autorizada','rechazada','comprada','abastecida','cancelada','pagada'));

-- 2. Add payment tracking columns to purchase_orders
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- 3. Add purchase_order_id to expense_entries for drill-down linking
ALTER TABLE public.expense_entries
  ADD COLUMN IF NOT EXISTS purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expense_po ON public.expense_entries(purchase_order_id);
