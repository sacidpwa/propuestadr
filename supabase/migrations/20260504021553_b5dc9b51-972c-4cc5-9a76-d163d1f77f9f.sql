-- Floor plan zones (editable canvas boxes)
CREATE TABLE public.floor_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  zone_type TEXT NOT NULL DEFAULT 'consultorio', -- consultorio | recepcion | espera | laboratorio | otro
  color TEXT NOT NULL DEFAULT '#1e3a8a',
  x NUMERIC NOT NULL DEFAULT 40,
  y NUMERIC NOT NULL DEFAULT 40,
  width NUMERIC NOT NULL DEFAULT 180,
  height NUMERIC NOT NULL DEFAULT 120,
  specialist_id UUID REFERENCES public.specialists(id) ON DELETE SET NULL,
  capacity INT NOT NULL DEFAULT 1,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.floor_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view zones" ON public.floor_zones FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'dueno')
  OR public.has_role(auth.uid(),'recepcion') OR public.has_role(auth.uid(),'especialista')
);

CREATE POLICY "Owner/admin/recepcion manage zones" ON public.floor_zones FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'dueno') OR public.has_role(auth.uid(),'recepcion'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'dueno') OR public.has_role(auth.uid(),'recepcion'));

CREATE TRIGGER trg_floor_zones_updated BEFORE UPDATE ON public.floor_zones
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Patient flow tracking
CREATE TABLE public.patient_flow (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES public.floor_zones(id) ON DELETE SET NULL,
  specialist_id UUID REFERENCES public.specialists(id) ON DELETE SET NULL,
  stage TEXT NOT NULL DEFAULT 'espera', -- espera | consulta | pago | salida
  arrived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  in_consult_at TIMESTAMPTZ,
  to_payment_at TIMESTAMPTZ,
  exited_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_patient_flow_active ON public.patient_flow(zone_id) WHERE exited_at IS NULL;
CREATE INDEX idx_patient_flow_today ON public.patient_flow(arrived_at);

ALTER TABLE public.patient_flow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view flow" ON public.patient_flow FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'dueno')
  OR public.has_role(auth.uid(),'recepcion') OR public.has_role(auth.uid(),'especialista')
);

CREATE POLICY "Recepcion/admin/owner manage flow" ON public.patient_flow FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'dueno') OR public.has_role(auth.uid(),'recepcion'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'dueno') OR public.has_role(auth.uid(),'recepcion'));

CREATE TRIGGER trg_patient_flow_updated BEFORE UPDATE ON public.patient_flow
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER TABLE public.floor_zones REPLICA IDENTITY FULL;
ALTER TABLE public.patient_flow REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.floor_zones;
ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_flow;