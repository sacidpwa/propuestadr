-- Add quantity and unit columns to patient_invoices
ALTER TABLE patient_invoices ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE patient_invoices ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'pieza';

-- Update existing records to have default values
UPDATE patient_invoices SET quantity = 1 WHERE quantity IS NULL;
UPDATE patient_invoices SET unit = 'pieza' WHERE unit IS NULL;
