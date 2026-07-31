ALTER TABLE patient_invoices ADD COLUMN IF NOT EXISTS unit_price DECIMAL(12,2);
UPDATE patient_invoices SET unit_price = NULL WHERE unit_price IS NULL;
