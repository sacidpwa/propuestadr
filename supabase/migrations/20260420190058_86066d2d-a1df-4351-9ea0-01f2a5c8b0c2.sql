-- Tabla de cotizaciones para Senior Living y Centro Benesse
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number TEXT NOT NULL UNIQUE,
  service_type TEXT NOT NULL CHECK (service_type IN ('senior_living', 'centro_benesse')),
  base_monthly_price NUMERIC NOT NULL,
  
  -- Datos del cliente / prospecto
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  resident_name TEXT,
  resident_age INTEGER,
  estimated_admission_date DATE,
  notes TEXT,
  
  -- Costos adicionales y otros (estructurados como JSON editable)
  additional_costs JSONB NOT NULL DEFAULT '[]'::jsonb,
  other_to_quote JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Secuencia para folio legible
CREATE SEQUENCE public.quotes_folio_seq START 1000;

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Solo admin puede gestionar cotizaciones
CREATE POLICY "Admin can view quotes"
ON public.quotes FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can insert quotes"
ON public.quotes FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can update quotes"
ON public.quotes FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete quotes"
ON public.quotes FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_quotes_updated_at
BEFORE UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX idx_quotes_created_at ON public.quotes(created_at DESC);
CREATE INDEX idx_quotes_service_type ON public.quotes(service_type);