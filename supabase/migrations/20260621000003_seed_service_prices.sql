DO $$
DECLARE
  v_alcatraces uuid; v_senior uuid; v_benesse uuid;
BEGIN
  SELECT id INTO v_alcatraces FROM public.health_units WHERE name LIKE '%Alcatraces%';
  SELECT id INTO v_senior FROM public.health_units WHERE name LIKE '%Senior%';
  SELECT id INTO v_benesse FROM public.health_units WHERE name LIKE '%Benesse%';

  -- CT Los Alcatraces
  INSERT INTO public.service_prices (health_unit_id, concept, price, category) VALUES
    (v_alcatraces, 'Inscripción', 20000, 'inscripcion'),
    (v_alcatraces, 'Estancia permanente habitación compartida', 35000, 'estancia'),
    (v_alcatraces, 'Estancia permanente habitación individual', 65000, 'estancia'),
    (v_alcatraces, 'Estancia por día', 1624, 'estancia'),
    (v_alcatraces, 'Estancia de día (8 horas / 3 alimentos)', 700, 'estancia'),
    (v_alcatraces, 'Kit de ingreso', 2100, 'inscripcion'),
    (v_alcatraces, 'Cuidador particular (dentro de la institución)', 120, 'servicios'),
    (v_alcatraces, 'Enfermera particular (dentro de la institución)', 130, 'servicios'),
    (v_alcatraces, 'Acompañante terapéutico (dentro de la institución)', 150, 'servicios'),
    (v_alcatraces, 'Cuidador particular (fuera de la institución)', 130, 'servicios'),
    (v_alcatraces, 'Enfermera particular (fuera de la institución)', 150, 'servicios'),
    (v_alcatraces, 'Acompañante terapéutico (fuera de la institución)', 170, 'servicios'),
    (v_alcatraces, 'Terapia ocupacional (cuota semestral)', 700, 'terapias'),
    (v_alcatraces, 'Consulta de emergencia', 2500, 'consultas'),
    (v_alcatraces, 'Consulta psicológica grupal (por persona)', 530, 'consultas'),
    (v_alcatraces, 'Consulta psiquiátrica', 1250, 'consultas'),
    (v_alcatraces, 'Consulta Dr. Rodrigo Márquez de la Serna', 1500, 'consultas');

  -- Senior Living
  INSERT INTO public.service_prices (health_unit_id, concept, price, category) VALUES
    (v_senior, 'Inscripción', 40000, 'inscripcion'),
    (v_senior, 'Estancia permanente habitación compartida', 50000, 'estancia'),
    (v_senior, 'Estancia permanente habitación individual', 65000, 'estancia'),
    (v_senior, 'Cuidador particular (dentro de la institución)', 120, 'servicios'),
    (v_senior, 'Enfermera particular (dentro de la institución)', 130, 'servicios'),
    (v_senior, 'Acompañante terapéutico (dentro de la institución)', 150, 'servicios'),
    (v_senior, 'Cuidador particular (fuera de la institución)', 130, 'servicios'),
    (v_senior, 'Enfermera particular (fuera de la institución)', 150, 'servicios'),
    (v_senior, 'Acompañante terapéutico (fuera de la institución)', 170, 'servicios'),
    (v_senior, 'Consulta de emergencia', 2500, 'consultas'),
    (v_senior, 'Consulta psiquiátrica', 2000, 'consultas'),
    (v_senior, 'Consulta Dr. Rodrigo Márquez de la Serna', 1500, 'consultas');

  -- Benesse
  INSERT INTO public.service_prices (health_unit_id, concept, price, category) VALUES
    (v_benesse, 'Estancia permanente habitación compartida', 60000, 'estancia'),
    (v_benesse, 'Cuidador particular (dentro de la institución)', 120, 'servicios'),
    (v_benesse, 'Enfermera particular (dentro de la institución)', 130, 'servicios'),
    (v_benesse, 'Acompañante terapéutico (dentro de la institución)', 150, 'servicios'),
    (v_benesse, 'Cuidador particular (fuera de la institución)', 130, 'servicios'),
    (v_benesse, 'Enfermera particular (fuera de la institución)', 150, 'servicios'),
    (v_benesse, 'Acompañante terapéutico (fuera de la institución)', 170, 'servicios'),
    (v_benesse, 'Consulta de emergencia', 2500, 'consultas'),
    (v_benesse, 'Consulta psiquiátrica', 2000, 'consultas'),
    (v_benesse, 'Consulta Dr. Rodrigo Márquez de la Serna', 1500, 'consultas');

  RAISE NOTICE 'Precios insertados correctamente';
END $$;
