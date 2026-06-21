DO $$
DECLARE
  v_unit_id uuid;
BEGIN
  SELECT id INTO v_unit_id FROM public.health_units WHERE name = 'CT Alcatraces';
  IF v_unit_id IS NULL THEN
    RAISE EXCEPTION 'Health unit CT Alcatraces not found';
  END IF;

  INSERT INTO public.patients (full_name, health_unit_id, notes) VALUES ('ALAN DE JESUS ROMO GARCIA', v_unit_id, '{"_tipo_estancia":"ESTANCIA DE DIA","_tipo_pago":"QUINCENAL","_paga":"ASISTENCIA MES EN CURSO","_payment_date":"—","_main":"SEMANAL: ACOMPAÑAMIENTO ENFERMERIA"}');
  INSERT INTO public.patients (full_name, health_unit_id, notes) VALUES ('ALMA GISELA MURAY FIGUEROA', v_unit_id, '{"_tipo_estancia":"PERMANENTE","_tipo_pago":"SEMANAL / MENSUAL","_paga":"MEDICAMENTOS DEL MES Y ESTANCIA ANTICIPADA","_payment_date":"VIERNES DE CADA SEMANA","_main":"MENSUAL: ESTANCIA Y MEDICAMENTOS"}');
  INSERT INTO public.patients (full_name, health_unit_id, notes) VALUES ('EDUARDO OCAMPO GIOVANNINI', v_unit_id, '{"_tipo_estancia":"PERMANENTE","_tipo_pago":"QUINCENAL","_paga":"GASTOS DEL MES Y ESTANCIA VENCIDA","_payment_date":"INICIO Y MITAD DE MES","_main":"1A. QUINCENA: PAGO ALTO / 2A. QUINCENA: RESTO DE LA CUENTA"}');
  INSERT INTO public.patients (full_name, health_unit_id, notes) VALUES ('JAIME CHAPA SILVA', v_unit_id, '{"_tipo_estancia":"PERMANENTE","_tipo_pago":"MENSUAL","_paga":"MEDICAMENTOS DEL MES Y ESTANCIA ANTICIPADA","_payment_date":"10","_main":""}');
  INSERT INTO public.patients (full_name, health_unit_id, notes) VALUES ('JESUS GONZALEZ MERCADO', v_unit_id, '{"_tipo_estancia":"PERMANENTE","_tipo_pago":"MENSUAL","_paga":"MEDICAMENTOS DEL MES Y ESTANCIA ANTICIPADA","_payment_date":"—","_main":"EL SOBRINO DE JESUS ES EL ABOGADO DE RODRIGO"}');
  INSERT INTO public.patients (full_name, health_unit_id, notes) VALUES ('JOSE LUIS LLACA MENDOZA', v_unit_id, '{"_tipo_estancia":"PERMANENTE","_tipo_pago":"MENSUAL","_paga":"ESTANCIA ANTICIPADA","_payment_date":"—","_main":"JOSE LUIS ES PRIMO DE RODRIGO"}');
  INSERT INTO public.patients (full_name, health_unit_id, notes) VALUES ('JULIO FOURNIER ESPINOZA', v_unit_id, '{"_tipo_estancia":"PERMANENTE","_tipo_pago":"MENSUAL","_paga":"GASTOS DEL MES Y ESTANCIA ANTICIPADA","_payment_date":"30 A 2","_main":""}');
  INSERT INTO public.patients (full_name, health_unit_id, notes) VALUES ('LUIS KARIM FUENTES ARGÜILEZ', v_unit_id, '{"_tipo_estancia":"PERMANENTE","_tipo_pago":"TRIMESTRAL / ANUAL","_paga":"TRIMESTRAL: MEDICAMENTOS / ANUAL: ESTANCIA","_payment_date":"INICIO DE SIGUIENTE TRIMESTRE / MARZO","_main":"TRIMESTRAL: MEDICAMENTOS DE 3 MESES / ANUAL: ESTANCIA"}');
  INSERT INTO public.patients (full_name, health_unit_id, notes) VALUES ('LUIS PLAZAS VELAZQUEZ', v_unit_id, '{"_tipo_estancia":"PERMANENTE","_tipo_pago":"MENSUAL","_paga":"GASTOS DEL MES Y ESTANCIA ANTICIPADA","_payment_date":"26","_main":""}');
  INSERT INTO public.patients (full_name, health_unit_id, notes) VALUES ('MARIO GERMAN SANTIAGO', v_unit_id, '{"_tipo_estancia":"PERMANENTE","_tipo_pago":"MENSUAL","_paga":"GASTOS DEL MES Y ESTANCIA ANTICIPADA","_payment_date":"26","_main":"ESTANCIA LA PAGA EN TIEMPO / LOS GASTOS NO PAGA EN TIEMPO"}');
  INSERT INTO public.patients (full_name, health_unit_id, notes) VALUES ('MIGUEL ANGEL CERECERO', v_unit_id, '{"_tipo_estancia":"PERMANENTE","_tipo_pago":"MENSUAL","_paga":"GASTOS DEL MES Y ESTANCIA ANTICIPADA","_payment_date":"1 A 5","_main":""}');
  INSERT INTO public.patients (full_name, health_unit_id, notes) VALUES ('PABLO SUAREZ CORZO', v_unit_id, '{"_tipo_estancia":"PERMANENTE","_tipo_pago":"MENSUAL","_paga":"GASTOS DEL MES Y ESTANCIA ANTICIPADA","_payment_date":"1 A 5","_main":"50% PRIMERA QUINCENA Y 50% SEGUNDA QUINCENA"}');
  INSERT INTO public.patients (full_name, health_unit_id, notes) VALUES ('ROSA REYNA VARGAS DE LA PORTILLA', v_unit_id, '{"_tipo_estancia":"PERMANENTE","_tipo_pago":"MENSUAL","_paga":"GASTOS DEL MES Y ESTANCIA ANTICIPADA","_payment_date":"15 / 30","_main":""}');
  INSERT INTO public.patients (full_name, health_unit_id, notes) VALUES ('SERGIO CHAO VALLE', v_unit_id, '{"_tipo_estancia":"PERMANENTE","_tipo_pago":"MENSUAL","_paga":"GASTOS DEL MES Y ESTANCIA ANTICIPADA","_payment_date":"8","_main":""}');
  INSERT INTO public.patients (full_name, health_unit_id, notes) VALUES ('JOSE FRANCISCO LOPEZ VENDRELL', v_unit_id, '{"_tipo_estancia":"PERMANENTE","_tipo_pago":"MENSUAL / SEMANAL","_paga":"GASTOS DEL MES Y ESTANCIA VENCIDA","_payment_date":"19","_main":"MENSUAL: UN PAGO FUERTE DE ESTANCIA / SEMANAL: PAGOS PARA COMPLETAR"}');

  RAISE NOTICE 'Pacientes registrados correctamente';
END $$;
