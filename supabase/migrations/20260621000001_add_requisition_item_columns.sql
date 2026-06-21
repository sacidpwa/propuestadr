ALTER TABLE requisition_items
  ADD COLUMN IF NOT EXISTS requires_prescription boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS suggested_pharmacy text,
  ADD COLUMN IF NOT EXISTS suggested_pharmacy_price numeric(12,2);

-- RLS: allow enfermera and managers to update these new columns
CREATE POLICY requisition_items_new_cols ON requisition_items
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dueno') OR
    has_role(auth.uid(), 'administrativo') OR has_role(auth.uid(), 'asistente_admin') OR
    has_role(auth.uid(), 'enfermera')
  );
