-- Prevent duplicate adeudo_payments for the same debt from the same petty_cash entry
CREATE UNIQUE INDEX IF NOT EXISTS idx_adeudo_payments_no_duplicate_petty
  ON adeudo_payments (debt_id, petty_cash_entry_id)
  WHERE petty_cash_entry_id IS NOT NULL;

-- Prevent duplicate petty_cash entries within 5 minutes (same description, amount, date, unit, type)
CREATE OR REPLACE FUNCTION prevent_duplicate_petty_cash()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM petty_cash
    WHERE description = NEW.description
    AND amount = NEW.amount
    AND reference_date = NEW.reference_date
    AND health_unit_id = NEW.health_unit_id
    AND type = NEW.type
    AND created_at > now() - INTERVAL '5 minutes'
  ) THEN
    RAISE EXCEPTION 'Duplicate petty cash entry prevented';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_duplicate_petty_cash ON petty_cash;
CREATE TRIGGER check_duplicate_petty_cash
  BEFORE INSERT ON petty_cash
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_petty_cash();
