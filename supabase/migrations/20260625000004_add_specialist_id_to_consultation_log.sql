-- Add specialist_id FK to consultation_log
ALTER TABLE consultation_log ADD COLUMN specialist_id UUID REFERENCES specialists(id) ON DELETE SET NULL;
CREATE INDEX idx_consultation_log_specialist_id ON consultation_log(specialist_id);

-- Create missing specialists
INSERT INTO specialists (id, full_name, specialty, consultation_fee, is_partner, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000101', 'Dr. Octavio Márquez Mendoza', 'Psiquiatría', 0, false, true),
  ('00000000-0000-0000-0000-000000000102', 'Alejandra Tonanzin', 'Psicología', 0, false, true),
  ('00000000-0000-0000-0000-000000000103', 'Dra. Wendoline Flores', 'Pediatría', 0, false, true),
  ('00000000-0000-0000-0000-000000000104', 'Itzel', 'Psicología', 0, false, true),
  ('00000000-0000-0000-0000-000000000105', 'Karina', 'Tanatología', 0, false, true),
  ('00000000-0000-0000-0000-000000000106', 'Karla', 'Nutrición', 0, false, true)
ON CONFLICT (id) DO NOTHING;

-- Map existing records by specialist_name
UPDATE consultation_log SET specialist_id = '9360ddeb-af8c-4c67-a016-c7b063585337'
WHERE specialist_name = 'Selene Garcia';

UPDATE consultation_log SET specialist_id = 'f2141f97-462a-4700-8dc1-e18b5cfa5ecc'
WHERE specialist_name = 'Rodrigo Márquez';

UPDATE consultation_log SET specialist_id = 'b7d6ec20-2a8f-4635-9017-663f8d04bb1e'
WHERE specialist_name = 'Diana Gómez';

UPDATE consultation_log SET specialist_id = '66dbaaf2-3e1d-48b4-81f0-bc64f9162f0b'
WHERE specialist_name = 'David Medina';

UPDATE consultation_log SET specialist_id = 'e8ab23c8-4032-412b-b0ab-c07103339b6d'
WHERE specialist_name = 'Jessica Vazquez';

UPDATE consultation_log SET specialist_id = '00000000-0000-0000-0000-000000000101'
WHERE specialist_name = 'Octavio Márquez';

UPDATE consultation_log SET specialist_id = '00000000-0000-0000-0000-000000000102'
WHERE specialist_name = 'Alejandra Tonanzin';

UPDATE consultation_log SET specialist_id = '00000000-0000-0000-0000-000000000103'
WHERE specialist_name = 'Wendoline Flores';

UPDATE consultation_log SET specialist_id = '00000000-0000-0000-0000-000000000104'
WHERE specialist_name = 'Itzel';

UPDATE consultation_log SET specialist_id = '00000000-0000-0000-0000-000000000105'
WHERE specialist_name = 'Karina';

UPDATE consultation_log SET specialist_id = '00000000-0000-0000-0000-000000000106'
WHERE specialist_name = 'Karla';
