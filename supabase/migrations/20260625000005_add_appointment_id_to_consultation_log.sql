ALTER TABLE public.consultation_log
  ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_consultation_log_appointment_id ON public.consultation_log(appointment_id);
