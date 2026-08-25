-- Fix: Insert missing $150 Caja Chica payment for RPBI
-- Run this via Supabase SQL Editor if the payment wasn't recorded

-- 1. Find the RPBI debt for CT Alcatraces
-- SELECT id, name, original_amount, paid_amount, status FROM debts WHERE name = 'RPBI';

-- 2. Insert the adeudo_payment (replace DEBT_ID with actual RPBI debt id from step 1)
-- INSERT INTO adeudo_payments (debt_id, amount, expense_entry_id, notes, paid_at, recorded_by)
-- VALUES ('DEBT_ID', 150.00, NULL, 'Caja chica: Pago RPBI', CURRENT_DATE, auth.uid());

-- 3. Update the debt's paid_amount
-- UPDATE debts SET paid_amount = paid_amount + 150.00, updated_at = now()
-- WHERE name = 'RPBI' AND health_unit_id = (SELECT id FROM health_units WHERE name = 'CT Alcatraces');

-- Uncomment and run step by step in Supabase SQL Editor:
-- Step 1: Get the debt ID
SELECT id, name, original_amount, paid_amount, status
FROM debts
WHERE name = 'RPBI'
  AND health_unit_id = (SELECT id FROM health_units WHERE name = 'CT Alcatraces');

-- Step 2: Insert the payment (replace '<RPBI_DEBT_ID>' with the ID from step 1)
-- INSERT INTO adeudo_payments (debt_id, amount, expense_entry_id, notes, paid_at, recorded_by)
-- VALUES ('<RPBI_DEBT_ID>', 150.00, NULL, 'Caja chica: Pago RPBI', CURRENT_DATE, auth.uid());

-- Step 3: Update paid_amount
-- UPDATE debts
-- SET paid_amount = paid_amount + 150.00,
--     status = CASE WHEN paid_amount + 150.00 >= original_amount THEN 'pagado' ELSE 'pendiente' END,
--     updated_at = now()
-- WHERE name = 'RPBI'
--   AND health_unit_id = (SELECT id FROM health_units WHERE name = 'CT Alcatraces');
