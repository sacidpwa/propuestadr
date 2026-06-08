CREATE TABLE public.staff_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interview_date DATE NOT NULL DEFAULT CURRENT_DATE,
  full_name TEXT NOT NULL,
  position TEXT NOT NULL,
  health_unit_id UUID REFERENCES public.health_units(id) ON DELETE SET NULL,
  reports_to TEXT,
  team_in_charge TEXT,
  info_received TEXT,
  info_processing TEXT,
  info_generated TEXT,
  tools_used TEXT,
  frequency TEXT,
  pain_points TEXT,
  observations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_evaluations TO authenticated;
GRANT ALL ON public.staff_evaluations TO service_role;

ALTER TABLE public.staff_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and admins can view evaluations"
ON public.staff_evaluations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dueno'));

CREATE POLICY "Owners and admins can insert evaluations"
ON public.staff_evaluations FOR INSERT TO authenticated
WITH CHECK ((public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dueno')) AND interviewer_id = auth.uid());

CREATE POLICY "Owners and admins can update evaluations"
ON public.staff_evaluations FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dueno'));

CREATE POLICY "Owners and admins can delete evaluations"
ON public.staff_evaluations FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dueno'));

CREATE TRIGGER update_staff_evaluations_updated_at
BEFORE UPDATE ON public.staff_evaluations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();