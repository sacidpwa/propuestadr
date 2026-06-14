-- Medication inventory
CREATE TABLE public.medication_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  health_unit_id UUID NOT NULL REFERENCES public.health_units(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  presentation TEXT,
  current_stock NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'pza',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(health_unit_id, medication_name)
);

CREATE INDEX idx_inventory_unit ON public.medication_inventory(health_unit_id, medication_name);

ALTER TABLE public.medication_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/dueno/administrativo manage inventory"
  ON public.medication_inventory FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin'));

CREATE POLICY "Enfermera view inventory"
  ON public.medication_inventory FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'enfermera'));

-- Inventory movements (trace every entry/exit/adjustment)
CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES public.medication_inventory(id) ON DELETE CASCADE,
  health_unit_id UUID NOT NULL REFERENCES public.health_units(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entry','exit','adjustment')),
  quantity NUMERIC NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inv_movements_inventory ON public.inventory_movements(inventory_id, created_at DESC);
CREATE INDEX idx_inv_movements_unit ON public.inventory_movements(health_unit_id, created_at DESC);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/dueno/administrativo manage movements"
  ON public.inventory_movements FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin'));

CREATE POLICY "Enfermera view movements"
  ON public.inventory_movements FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'enfermera'));

-- Purchase orders (generated from requisitions)
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id UUID REFERENCES public.requisitions(id) ON DELETE SET NULL,
  health_unit_id UUID NOT NULL REFERENCES public.health_units(id) ON DELETE CASCADE,
  po_number TEXT UNIQUE,
  vendor_name TEXT,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','autorizada','rechazada','comprada','abastecida','cancelada')),
  authorized_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  authorized_at TIMESTAMPTZ,
  procured_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  procured_at TIMESTAMPTZ,
  stocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stocked_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_po_unit ON public.purchase_orders(health_unit_id, status);
CREATE INDEX idx_po_requisition ON public.purchase_orders(requisition_id);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/dueno/administrativo manage PO"
  ON public.purchase_orders FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin'));

-- Purchase order items
CREATE TABLE public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pza',
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
  notes TEXT
);

CREATE INDEX idx_poi_order ON public.purchase_order_items(purchase_order_id);

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PO items same as PO"
  ON public.purchase_order_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_id));

-- Inventory confirmations (nurse checks stock every 3 days)
CREATE TABLE public.inventory_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  health_unit_id UUID NOT NULL REFERENCES public.health_units(id) ON DELETE CASCADE,
  confirmed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

CREATE INDEX idx_inv_conf_unit ON public.inventory_confirmations(health_unit_id, confirmed_at DESC);

ALTER TABLE public.inventory_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enfermera insert own confirmations"
  ON public.inventory_confirmations FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'enfermera') AND confirmed_by = auth.uid());

CREATE POLICY "Enfermera view own unit confirmations"
  ON public.inventory_confirmations FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'enfermera') AND health_unit_id IN (SELECT health_unit_id FROM public.employee_assignments WHERE user_id = auth.uid()));

CREATE POLICY "Admin view all confirmations"
  ON public.inventory_confirmations FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'dueno') OR has_role(auth.uid(),'administrativo') OR has_role(auth.uid(),'asistente_admin'));

-- Inventory confirmation items (snapshot of each medication stock at confirmation time)
CREATE TABLE public.inventory_confirmation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  confirmation_id UUID NOT NULL REFERENCES public.inventory_confirmations(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES public.medication_inventory(id) ON DELETE CASCADE,
  reported_stock NUMERIC NOT NULL,
  notes TEXT
);

ALTER TABLE public.inventory_confirmation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Confirmation items same as confirmation"
  ON public.inventory_confirmation_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.inventory_confirmations c WHERE c.id = confirmation_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.inventory_confirmations c WHERE c.id = confirmation_id));

-- Auto-generate PO number
CREATE SEQUENCE IF NOT EXISTS public.po_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT 'PO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('public.po_number_seq')::TEXT, 4, '0');
$$;

-- Triggers
CREATE TRIGGER trg_inventory_updated
  BEFORE UPDATE ON public.medication_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_purchase_orders_updated
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.medication_inventory TO authenticated;
GRANT ALL ON public.inventory_movements TO authenticated;
GRANT ALL ON public.purchase_orders TO authenticated;
GRANT ALL ON public.purchase_order_items TO authenticated;
GRANT ALL ON public.inventory_confirmations TO authenticated;
GRANT ALL ON public.inventory_confirmation_items TO authenticated;
GRANT ALL ON SEQUENCE public.po_number_seq TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_po_number TO authenticated;
