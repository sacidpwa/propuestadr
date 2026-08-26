-- Drop unique constraint on adeudo_payments(debt_id) if it exists
-- Multiple payments per debt should be allowed
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.adeudo_payments'::regclass
      AND contype = 'u'
  LOOP
    EXECUTE format('ALTER TABLE public.adeudo_payments DROP CONSTRAINT %I', r.conname);
    RAISE NOTICE 'Dropped constraint: %', r.conname;
  END LOOP;
END $$;

-- Also drop any unique indexes on adeudo_payments that reference only debt_id
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT indexrelid::regclass::text as indexname
    FROM pg_index i
    JOIN pg_class c ON i.indrelid = c.oid
    WHERE c.relname = 'adeudo_payments'
      AND i.indisunique = true
      AND array_length(i.indkey::smallint[], 1) = 1
      AND EXISTS (
        SELECT 1 FROM pg_attribute a
        WHERE a.attrelid = c.oid AND a.attnum = i.indkey[1] + 1 AND a.attname = 'debt_id'
      )
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS %I', r.indexname);
    RAISE NOTICE 'Dropped index: %', r.indexname;
  END LOOP;
END $$;
