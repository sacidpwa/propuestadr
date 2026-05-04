-- Rotation for zones
ALTER TABLE public.floor_zones
  ADD COLUMN IF NOT EXISTS rotation numeric NOT NULL DEFAULT 0;

-- Furniture table
CREATE TABLE IF NOT EXISTS public.floor_furniture (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid REFERENCES public.floor_zones(id) ON DELETE SET NULL,
  furniture_type text NOT NULL DEFAULT 'silla',
  label text,
  x numeric NOT NULL DEFAULT 60,
  y numeric NOT NULL DEFAULT 60,
  width numeric NOT NULL DEFAULT 40,
  height numeric NOT NULL DEFAULT 40,
  rotation numeric NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#475569',
  patient_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.floor_furniture ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner/admin/recepcion manage furniture"
ON public.floor_furniture
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'dueno') OR public.has_role(auth.uid(),'recepcion'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'dueno') OR public.has_role(auth.uid(),'recepcion'));

CREATE POLICY "Staff view furniture"
ON public.floor_furniture
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'dueno') OR public.has_role(auth.uid(),'recepcion') OR public.has_role(auth.uid(),'especialista'));

CREATE TRIGGER trg_floor_furniture_updated
BEFORE UPDATE ON public.floor_furniture
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.floor_furniture;
ALTER TABLE public.floor_furniture REPLICA IDENTITY FULL;