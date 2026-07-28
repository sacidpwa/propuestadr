-- Add consecutive_number column to expense_entries for quick capture tool
ALTER TABLE expense_entries ADD COLUMN IF NOT EXISTS consecutive_number TEXT;

-- Create a sequence per health unit for consecutive numbering
-- Format: A1, A2, A3... per health unit
CREATE OR REPLACE FUNCTION generate_consecutive_number(p_health_unit_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  prefix TEXT := 'A';
BEGIN
  -- Get the max consecutive number for this health unit
  SELECT COALESCE(
    MAX(NULLIF(regexp_replace(consecutive_number, '[^0-9]', '', 'g'), '')::INTEGER),
    0
  ) + 1
  INTO next_num
  FROM expense_entries
  WHERE health_unit_id = p_health_unit_id
    AND consecutive_number IS NOT NULL
    AND consecutive_number LIKE prefix || '%';

  RETURN prefix || next_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index for faster consecutive number queries
CREATE INDEX IF NOT EXISTS idx_expense_entries_consecutive_number
  ON expense_entries(health_unit_id, consecutive_number)
  WHERE consecutive_number IS NOT NULL;

-- Add index for health_unit_id on expense_entries if not exists
CREATE INDEX IF NOT EXISTS idx_expense_entries_health_unit
  ON expense_entries(health_unit_id);
