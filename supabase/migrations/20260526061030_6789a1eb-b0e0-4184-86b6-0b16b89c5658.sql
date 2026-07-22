CREATE TYPE public.requisition_type AS ENUM ('medicamentos','limpieza','mantenimiento','servicio_mantenimiento','pago_proveedor');
CREATE TYPE public.requisition_status AS ENUM ('pendiente','autorizada','rechazada','comprada','pagada','cancelada');
CREATE TYPE public.requisition_priority AS ENUM ('baja','media','alta','urgente');

CREATE TABLE public.requisitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_unit_id uuid NOT NULL REFERENCES public.health_units(id),
  req_type public.requisition_type NOT NULL,
  area public.work_area,
  title text NOT NULL,
  description text,
  vendor_name text,
  priority public.requisition_priority NOT NULL DEFAULT 'media',
  status public.requisition_status NOT NULL DEFAULT 'pendiente',
  total_amount numeric DEFAULT 0,
  payment_method text,
  payment_reference text,
  paid_at timestamptz,
  requested_by uuid NOT NULL,
  authorized_by uuid,
  authorized_at timestamptz,
  rejected_reason text,
  executed_by uuid,
  executed_at timestamptz,
  assigned_to uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_requisitions_unit_status ON public.requisitions(health_unit_id, status);
CREATE INDEX idx_requisitions_requested_by ON public.requisitions(requested_by);

ALTER TABLE public.requisitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage requisitions" ON public.requisitions FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin'));

CREATE POLICY "Operative view own unit requisitions" ON public.requisitions FOR SELECT TO authenticated
  USING ((has_role(auth.uid(),'enfermera') OR has_role(auth.uid(),'intendencia') OR has_role(auth.uid(),'mantenimiento'))
    AND user_in_unit(auth.uid(), health_unit_id));

CREATE POLICY "Operative create requisitions in unit" ON public.requisitions FOR INSERT TO authenticated
  WITH CHECK ((has_role(auth.uid(),'enfermera') OR has_role(auth.uid(),'intendencia') OR has_role(auth.uid(),'mantenimiento'))
    AND user_in_unit(auth.uid(), health_unit_id) AND requested_by = auth.uid() AND status = 'pendiente');

CREATE POLICY "Operative update own pending requisitions" ON public.requisitions FOR UPDATE TO authenticated
  USING ((has_role(auth.uid(),'enfermera') OR has_role(auth.uid(),'intendencia') OR has_role(auth.uid(),'mantenimiento'))
    AND requested_by = auth.uid() AND status = 'pendiente');

CREATE TRIGGER trg_requisitions_updated BEFORE UPDATE ON public.requisitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.requisition_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id uuid NOT NULL REFERENCES public.requisitions(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit text,
  unit_price numeric DEFAULT 0,
  image_path text,
  status public.requisition_status NOT NULL DEFAULT 'pendiente',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_requisition_items_req ON public.requisition_items(requisition_id);

ALTER TABLE public.requisition_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Items select via parent" ON public.requisition_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.requisitions r WHERE r.id = requisition_id));

CREATE POLICY "Items admin manage" ON public.requisition_items FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin'));

CREATE POLICY "Items operative manage own pending" ON public.requisition_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.requisitions r WHERE r.id = requisition_id AND r.requested_by = auth.uid() AND r.status = 'pendiente'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.requisitions r WHERE r.id = requisition_id AND r.requested_by = auth.uid() AND r.status = 'pendiente'));

CREATE TRIGGER trg_requisition_items_updated BEFORE UPDATE ON public.requisition_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public) VALUES ('requisitions','requisitions', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Req bucket read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'requisitions');
CREATE POLICY "Req bucket upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'requisitions');
CREATE POLICY "Req bucket update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'requisitions' AND owner = auth.uid());
CREATE POLICY "Req bucket delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'requisitions' AND (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin') OR owner = auth.uid()
  ));