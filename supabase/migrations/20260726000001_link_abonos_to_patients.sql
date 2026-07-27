-- Link existing income entries (abonos) to their patients by matching patient_name
-- This migration links expense_entries that have a patient_name but no patient_id

UPDATE public.expense_entries ee
SET patient_id = p.id,
    patient_name = p.full_name
FROM public.patients p
WHERE ee.entry_type = 'ingreso'
  AND ee.patient_id IS NULL
  AND ee.patient_name IS NOT NULL
  AND ee.patient_name != ''
  AND (
    -- Exact match
    LOWER(TRIM(ee.patient_name)) = LOWER(TRIM(p.full_name))
    OR
    -- Patient name contains the full name (for partial matches)
    LOWER(TRIM(p.full_name)) LIKE '%' || LOWER(TRIM(ee.patient_name)) || '%'
    OR
    -- Full name contains the patient name (reverse partial match)
    LOWER(TRIM(ee.patient_name)) LIKE '%' || LOWER(TRIM(p.full_name)) || '%'
  );

-- Also try to match from description field when patient_name is not set
UPDATE public.expense_entries ee
SET patient_id = p.id,
    patient_name = p.full_name
FROM public.patients p
WHERE ee.entry_type = 'ingreso'
  AND ee.patient_id IS NULL
  AND (ee.patient_name IS NULL OR ee.patient_name = '')
  AND ee.description IS NOT NULL
  AND ee.description != ''
  AND (
    -- Description contains the patient full name
    LOWER(ee.description) LIKE '%' || LOWER(TRIM(p.full_name)) || '%'
  );

-- Log results
DO $$
DECLARE
  v_linked INTEGER;
  v_total INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_linked
  FROM public.expense_entries
  WHERE entry_type = 'ingreso' AND patient_id IS NOT NULL;

  SELECT COUNT(*) INTO v_total
  FROM public.expense_entries
  WHERE entry_type = 'ingreso';

  RAISE NOTICE 'Abonos vinculados: % de % ingresos totales', v_linked, v_total;
END $$;
