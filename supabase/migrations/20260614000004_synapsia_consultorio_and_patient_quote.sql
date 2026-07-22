-- Add Synapsia Consultorio as a health unit
INSERT INTO public.health_units (name, description)
VALUES ('Synapsia Consultorio', 'Consultorios médicos para atención de especialistas')
ON CONFLICT (name) DO NOTHING;

-- Add quote_id to patients (nullable FK to quotes)
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL;

-- Update existing patients: assign them to Synapsia Consultorio
-- (current patients are external consultations from Synapsia)
DO $$
DECLARE
  synapsia_id uuid;
BEGIN
  SELECT id INTO synapsia_id FROM public.health_units WHERE name = 'Synapsia Consultorio';
  IF synapsia_id IS NOT NULL THEN
    UPDATE public.patients SET health_unit_id = synapsia_id WHERE health_unit_id IS NULL;
  END IF;
END $$;
