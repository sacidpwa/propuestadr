const Contratos = () => {
  const fechaActual = "4 de marzo de 2026";

  return (
    <div className="bg-background min-h-screen py-12 px-6 md:px-20 print:px-12 print:py-6">
      <div className="max-w-4xl mx-auto space-y-16 font-sans text-foreground text-sm leading-relaxed text-justify">

        {/* ========== CONTRATO 1: PRESTACIÓN DE SERVICIOS ========== */}
        <article className="space-y-6">
          <h1 className="text-2xl font-serif font-bold text-center uppercase tracking-wide">
            Contrato de Prestación de Servicios Profesionales de Consultoría
          </h1>

          <p>
            Contrato de prestación de servicios profesionales que celebran, por una parte, el{" "}
            <strong>C. Rafael Runard Rueda de León Contreras</strong>, en su carácter de prestador de servicios, a quien en lo sucesivo se le denominará <strong>"EL CONSULTOR"</strong>; por otra parte, el{" "}
            <strong>C. Rodrigo Márquez de la Serna</strong>, en su carácter de contratante, a quien en lo sucesivo se le denominará <strong>"EL CLIENTE"</strong>; y por otra parte, el{" "}
            <strong>C. Octavio Márquez Mendoza</strong>, en su carácter de propietario del consultorio <strong>Synapsia</strong>, a quien en lo sucesivo se le denominará <strong>"EL PROPIETARIO DE SYNAPSIA"</strong>; al tenor de las siguientes declaraciones y cláusulas:
          </p>

          <p className="text-xs italic text-muted-foreground">
            El presente contrato se celebra de conformidad con los artículos 7.825 al 7.835 del Código Civil del Estado de México (CCEM), que regulan la prestación de servicios profesionales en el fuero común.
          </p>

          <h2 className="text-lg font-serif font-bold mt-8">DECLARACIONES</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold">I. Declara EL CONSULTOR:</h3>
              <ol className="list-[lower-alpha] pl-6 space-y-1">
                <li>Llamarse <strong>Rafael Runard Rueda de León Contreras</strong>, de nacionalidad mexicana, mayor de edad, con domicilio en Calle Hacienda Santa Rosa 62, Fraccionamiento Santa Elena, C.P. 52105, San Mateo Atenco, Estado de México.</li>
                <li>CURP: <strong>RUCR840927HDFDNF02</strong>.</li>
                <li>Clave de Elector: <strong>RDCNRF84092709H200</strong>.</li>
                <li>Que cuenta con los conocimientos, experiencia y capacidad profesional necesarios para prestar los servicios de consultoría de negocios, reingeniería de procesos y digitalización objeto del presente contrato.</li>
                <li>Que es su voluntad celebrar el presente contrato en los términos y condiciones que se establecen.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold">II. Declara EL CLIENTE:</h3>
              <ol className="list-[lower-alpha] pl-6 space-y-1">
                <li>Llamarse <strong>Rodrigo Márquez de la Serna</strong>, de nacionalidad mexicana, mayor de edad, con domicilio en Calle Parque Los Laureles 3800, 402, MZ14 LT11, Residencial Foresta Crystal Lagoons, C.P. 52144, Metepec, Estado de México.</li>
                <li>CURP: <strong>MASR761003HDFRRD07</strong>.</li>
                <li>Clave de Elector: <strong>MRSRRD76100309H000</strong>.</li>
                <li>Que es titular y/o socio mayoritario de las unidades de negocio denominadas <strong>Clínica Alcatraces</strong>, <strong>Benesse</strong> y <strong>Alcatraces Senior Living</strong>.</li>
                <li>Que requiere los servicios profesionales de consultoría para la reingeniería, digitalización y reestructuración de las unidades de negocio antes mencionadas, así como de <strong>Synapsia</strong>, propiedad de EL PROPIETARIO DE SYNAPSIA.</li>
                <li>Que es su voluntad celebrar el presente contrato.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold">III. Declara EL PROPIETARIO DE SYNAPSIA:</h3>
              <ol className="list-[lower-alpha] pl-6 space-y-1">
                <li>Llamarse <strong>Octavio Márquez Mendoza</strong>, de nacionalidad mexicana, mayor de edad, con domicilio en C. Paseo Santa Teresa 108, Fraccionamiento San Carlos, C.P. 52159, Metepec, Estado de México.</li>
                <li>CURP: <strong>MXMO390902HDFRNC08</strong>.</li>
                <li>Clave de Elector: <strong>MXMOC39090209H000</strong>.</li>
                <li>Que es propietario y titular del consultorio denominado <strong>Synapsia</strong>.</li>
                <li>Que tiene plena capacidad jurídica y facultades suficientes para obligarse en los términos del presente contrato, particularmente en lo que respecta a la participación accionaria del 5% de Synapsia que otorgará a EL CONSULTOR.</li>
                <li>Que es su voluntad celebrar el presente contrato.</li>
              </ol>
            </div>
          </div>

          <h2 className="text-lg font-serif font-bold mt-8">CLÁUSULAS</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold">PRIMERA. — Objeto del contrato.</h3>
              <p>EL CONSULTOR se obliga a prestar a EL CLIENTE y EL PROPIETARIO DE SYNAPSIA los siguientes servicios profesionales de consultoría:</p>
              <ol className="list-decimal pl-6 space-y-1 mt-2">
                <li>Diagnóstico integral de las cuatro unidades de negocio (Synapsia, Clínica Alcatraces, Benesse y Alcatraces Senior Living).</li>
                <li>Diseño de gobierno corporativo y organigrama funcional.</li>
                <li>Estrategia de retiro de socios para Benesse.</li>
                <li>Plan de sucesión del C. Márquez.</li>
                <li>Desarrollo e implementación de sistemas de recepción y expediente digital, plataforma de cobro y facturación, y dashboard de KPIs centralizado.</li>
                <li>Integración operativa entre unidades de negocio.</li>
                <li>Diseño de marca Benesse (logo, luminoso, identidad visual).</li>
                <li>Estrategia de redes sociales para las cuatro unidades.</li>
                <li>Plan de incorporación del área de desórdenes alimenticios.</li>
                <li>Elaboración de manuales de operación por unidad.</li>
                <li>Desarrollo de redes de colaboración con consultorios médicos.</li>
                <li>Producción de videopodcast y cápsulas informativas de salud mental.</li>
                <li>Relaciones comerciales con institutos de prevención.</li>
              </ol>
              <p className="mt-2">
                Se entenderá por <strong>conclusión satisfactoria</strong> de los trabajos la entrega de cada uno de los entregables enumerados anteriormente, los cuales serán evaluados conforme a criterios objetivos y medibles, tales como: la presentación de documentos finales, la implementación funcional de sistemas digitales, la entrega de manuales y materiales, y la verificación de su operatividad. EL CLIENTE dispondrá de un plazo de <strong>10 (diez) días hábiles</strong> a partir de la entrega de cada entregable para formular observaciones por escrito; transcurrido dicho plazo sin observaciones, el entregable se considerará aceptado.
              </p>
            </div>

            <div>
              <h3 className="font-bold">SEGUNDA. — Contraprestación.</h3>
              <p>
                Las partes acuerdan que la inversión total por los servicios descritos en la cláusula primera asciende a la cantidad de <strong>$540,000.00 (quinientos cuarenta mil pesos 00/100 M.N.) más IVA</strong>.
              </p>
              <p className="mt-2">
                No obstante, las partes han convenido de mutuo acuerdo aplicar un <strong>descuento de $120,000.00 (ciento veinte mil pesos 00/100 M.N.)</strong>, resultando un monto total a pagar en efectivo de <strong>$420,000.00 (cuatrocientos veinte mil pesos 00/100 M.N.) más IVA</strong>.
              </p>
            </div>

            <div>
              <h3 className="font-bold">TERCERA. — Contraprestación complementaria (participación accionaria).</h3>
              <p>
                Como contraprestación por el descuento otorgado conforme a la cláusula segunda, las partes se obligan a otorgar a EL CONSULTOR participación accionaria en las unidades de negocio conforme a lo siguiente:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong>5% (cinco por ciento)</strong> de participación accionaria en <strong>Synapsia</strong>, otorgado por <strong>EL PROPIETARIO DE SYNAPSIA (C. Octavio Márquez Mendoza)</strong>.</li>
                <li><strong>10% (diez por ciento)</strong> de participación accionaria en <strong>Clínica Alcatraces</strong>, otorgado por <strong>EL CLIENTE (C. Rodrigo Márquez de la Serna)</strong>.</li>
                <li><strong>10% (diez por ciento)</strong> de participación accionaria en <strong>Benesse</strong>, otorgado por <strong>EL CLIENTE (C. Rodrigo Márquez de la Serna)</strong>.</li>
                <li><strong>5% (cinco por ciento)</strong> de participación accionaria en <strong>Alcatraces Senior Living</strong>, otorgado por <strong>EL CLIENTE (C. Rodrigo Márquez de la Serna)</strong>.</li>
              </ul>
              <p className="mt-2">
                Dicha participación se formalizará mediante el Contrato de Asociación en Participación y Promesa de Contrato para la Constitución de Sociedades Mercantiles que las partes suscriben de manera simultánea al presente instrumento.
              </p>
            </div>

            <div>
              <h3 className="font-bold">CUARTA. — Forma y calendario de pago.</h3>
              <p>
                El monto de <strong>$420,000.00 (cuatrocientos veinte mil pesos 00/100 M.N.) más IVA</strong> se pagará en <strong>8 (ocho) mensualidades fijas</strong> de <strong>$52,500.00 (cincuenta y dos mil quinientos pesos 00/100 M.N.) más IVA</strong> cada una, conforme al siguiente calendario:
              </p>
              <div className="mt-3 border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left px-4 py-2 font-bold">Parcialidad</th>
                      <th className="text-left px-4 py-2 font-bold">Fecha límite de pago</th>
                      <th className="text-right px-4 py-2 font-bold">Monto (+ IVA)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["1ª", "9 de marzo de 2026"],
                      ["2ª", "9 de abril de 2026"],
                      ["3ª", "9 de mayo de 2026"],
                      ["4ª", "9 de junio de 2026"],
                      ["5ª", "9 de julio de 2026"],
                      ["6ª", "9 de agosto de 2026"],
                      ["7ª", "9 de septiembre de 2026"],
                      ["8ª", "9 de octubre de 2026"],
                    ].map(([num, fecha]) => (
                      <tr key={num} className="border-t border-border">
                        <td className="px-4 py-2">{num}</td>
                        <td className="px-4 py-2">{fecha}</td>
                        <td className="text-right px-4 py-2">$52,500.00</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2">
                Cada pago deberá realizarse a más tardar en la fecha señalada, previa presentación de factura fiscal (CFDI) por parte de EL CONSULTOR.
              </p>
            </div>

            <div>
              <h3 className="font-bold">QUINTA. — Intereses moratorios.</h3>
              <p>
                En caso de que EL CLIENTE no realice alguno de los pagos establecidos en la cláusula cuarta en la fecha pactada, se generarán <strong>intereses moratorios convencionales</strong> a razón del <strong>5% (cinco por ciento) mensual</strong> sobre el monto de la parcialidad vencida y no pagada, los cuales comenzarán a devengarse a partir del día siguiente a la fecha límite de pago y hasta la liquidación total del adeudo.
              </p>
            </div>

            <div>
              <h3 className="font-bold">SEXTA. — Suspensión de servicios por falta de pago.</h3>
              <p>
                En caso de que EL CLIENTE incurra en un retraso en el pago de cualquiera de las parcialidades superior a <strong>5 (cinco) días naturales</strong> contados a partir de la fecha límite señalada en la cláusula cuarta, EL CONSULTOR tendrá derecho a <strong>suspender la ejecución de sus actividades</strong> sin responsabilidad alguna, hasta en tanto se regularice el pago correspondiente, incluyendo los intereses moratorios generados conforme a la cláusula quinta. La suspensión no liberará a EL CLIENTE de su obligación de pago ni extenderá automáticamente los plazos de ejecución.
              </p>
            </div>

            <div>
              <h3 className="font-bold">SÉPTIMA. — Plazo.</h3>
              <p>
                El plazo para la ejecución de los servicios es de <strong>8 (ocho) meses</strong> contados a partir de la firma del presente contrato, pudiendo ser ampliado de común acuerdo entre las partes mediante addendum por escrito. En caso de suspensión por falta de pago conforme a la cláusula sexta, el plazo se prorrogará automáticamente por el tiempo que dure la suspensión.
              </p>
            </div>

            <div>
              <h3 className="font-bold">OCTAVA. — Obligaciones de EL CONSULTOR.</h3>
              <ol className="list-[lower-alpha] pl-6 space-y-1">
                <li>Ejecutar los servicios con diligencia, profesionalismo y en los plazos acordados.</li>
                <li>Presentar informes periódicos de avance.</li>
                <li>Guardar estricta confidencialidad sobre toda la información a la que tenga acceso.</li>
                <li>Entregar todos los entregables descritos en la cláusula primera.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold">NOVENA. — Obligaciones de EL CLIENTE y EL PROPIETARIO DE SYNAPSIA.</h3>
              <ol className="list-[lower-alpha] pl-6 space-y-1">
                <li>Proporcionar a EL CONSULTOR la información y acceso necesarios para la ejecución de los servicios.</li>
                <li>Realizar los pagos en los términos y fechas pactados en la cláusula cuarta.</li>
                <li>Formalizar la participación accionaria conforme a la cláusula tercera, cada uno respecto de las unidades de negocio de su propiedad.</li>
                <li>Designar un punto de contacto para la coordinación de los trabajos.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold">DÉCIMA. — Confidencialidad.</h3>
              <p>
                Todas las partes se obligan a mantener en estricta confidencialidad toda la información intercambiada con motivo del presente contrato, incluyendo pero no limitándose a información financiera, operativa, estratégica y de pacientes. Esta obligación subsistirá por un periodo de 5 (cinco) años posteriores a la terminación del contrato.
              </p>
            </div>

            <div>
              <h3 className="font-bold">DÉCIMA PRIMERA. — Propiedad intelectual.</h3>
              <p>
                Los entregables desarrollados por EL CONSULTOR en ejecución del presente contrato serán propiedad de EL CLIENTE una vez liquidado el pago total de los servicios. EL CONSULTOR conservará el derecho de utilizar las metodologías y conocimientos generales empleados.
              </p>
            </div>

            <div>
              <h3 className="font-bold">DÉCIMA SEGUNDA. — Terminación anticipada y pena convencional.</h3>
              <p>
                Cualquiera de las partes podrá dar por terminado el presente contrato mediante aviso por escrito con al menos 30 (treinta) días naturales de anticipación. En caso de terminación anticipada, EL CLIENTE deberá pagar los servicios efectivamente prestados hasta la fecha de terminación.
              </p>
              <p className="mt-2">
                <strong>Pena convencional por terminación injustificada:</strong> De conformidad con el artículo 7.81 del Código Civil del Estado de México, si EL CLIENTE da por terminado el presente contrato antes de cumplirse el plazo de 8 (ocho) meses señalado en la cláusula séptima, sin causa imputable a EL CONSULTOR, deberá pagar, además de los servicios efectivamente prestados, una <strong>pena convencional equivalente a 2 (dos) parcialidades</strong> de los honorarios pactados, es decir, la cantidad de <strong>$105,000.00 (ciento cinco mil pesos 00/100 M.N.) más IVA</strong>, como indemnización por daños y perjuicios.
              </p>
              <p className="mt-2">
                La participación accionaria se ajustará proporcionalmente al porcentaje de avance de los trabajos al momento de la terminación.
              </p>
            </div>

            <div>
              <h3 className="font-bold">DÉCIMA TERCERA. — Resolución de controversias.</h3>
              <p>
                Para la interpretación y cumplimiento del presente contrato, las partes se someten a la jurisdicción de los tribunales competentes de la ciudad de Toluca, Estado de México, renunciando a cualquier otro fuero que pudiera corresponderles por razón de su domicilio presente o futuro.
              </p>
            </div>

            <div>
              <h3 className="font-bold">DÉCIMA CUARTA. — Legislación aplicable.</h3>
              <p>
                El presente contrato se rige por las disposiciones de los artículos 7.825 al 7.835 del <strong>Código Civil del Estado de México</strong> y demás legislación local aplicable en materia de prestación de servicios profesionales, por tratarse de un acuerdo del fuero común.
              </p>
            </div>
          </div>

          <p className="mt-8">
            Leído que fue el presente contrato y enteradas las partes de su contenido y alcance legal, lo firman por triplicado en la ciudad de Metepec, Estado de México, a {fechaActual}.
          </p>

          <div className="grid grid-cols-3 gap-8 mt-16 pt-8">
            <div className="text-center">
              <div className="border-t border-foreground/30 pt-4 mx-4">
                <p className="font-bold">EL CONSULTOR</p>
                <p>C. Rafael Runard Rueda de León Contreras</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-foreground/30 pt-4 mx-4">
                <p className="font-bold">EL CLIENTE</p>
                <p>C. Rodrigo Márquez de la Serna</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-foreground/30 pt-4 mx-4">
                <p className="font-bold">EL PROPIETARIO DE SYNAPSIA</p>
                <p>C. Octavio Márquez Mendoza</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 mt-12">
            <div className="text-center">
              <div className="border-t border-foreground/30 pt-4 mx-8">
                <p className="font-bold">TESTIGO</p>
                <p>Nombre: ____________________________</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-foreground/30 pt-4 mx-8">
                <p className="font-bold">TESTIGO</p>
                <p>Nombre: ____________________________</p>
              </div>
            </div>
          </div>
        </article>

        {/* Separador para impresión */}
        <div className="border-t-4 border-accent print:break-before-page" />

        {/* ========== CONTRATO 2: ASOCIACIÓN EN PARTICIPACIÓN Y PROMESA ========== */}
        <article className="space-y-6">
          <h1 className="text-2xl font-serif font-bold text-center uppercase tracking-wide leading-tight">
            Contrato de Asociación en Participación y Promesa de Contrato para la Constitución de Sociedades Mercantiles
          </h1>

          <p>
            Contrato de asociación en participación y promesa de contrato para la constitución de sociedades mercantiles que celebran, por una parte, el{" "}
            <strong>C. Rodrigo Márquez de la Serna</strong>, a quien en lo sucesivo se le denominará <strong>"EL ASOCIANTE"</strong> (y para efectos de la promesa de contrato, <strong>"EL PROMITENTE SOCIO ASOCIANTE"</strong>), respecto de las unidades de negocio <strong>Clínica Alcatraces</strong>, <strong>Benesse</strong> y <strong>Alcatraces Senior Living</strong>; por otra parte, el{" "}
            <strong>C. Octavio Márquez Mendoza</strong>, en su carácter de propietario de <strong>Synapsia</strong>, a quien en lo sucesivo se le denominará <strong>"EL ASOCIANTE DE SYNAPSIA"</strong> (y para efectos de la promesa de contrato, <strong>"EL PROMITENTE SOCIO ASOCIANTE DE SYNAPSIA"</strong>); y por otra parte, el{" "}
            <strong>C. Rafael Runard Rueda de León Contreras</strong>, a quien en lo sucesivo se le denominará <strong>"EL ASOCIADO"</strong> (y para efectos de la promesa de contrato, <strong>"EL PROMITENTE SOCIO ASOCIADO"</strong>); al tenor de las siguientes declaraciones y cláusulas:
          </p>

          <p className="text-xs italic text-muted-foreground">
            El presente instrumento se celebra de conformidad con los artículos 252 al 259 de la Ley General de Sociedades Mercantiles (LGSM) en lo relativo a la asociación en participación, y con los artículos 7.524, 7.525, 7.527 y 7.530 del Código Civil del Estado de México (CCEM) en lo relativo a la promesa de contrato.
          </p>

          <h2 className="text-lg font-serif font-bold mt-8">DECLARACIONES</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold">I. Declara EL ASOCIANTE:</h3>
              <ol className="list-[lower-alpha] pl-6 space-y-1">
                <li>Llamarse <strong>Rodrigo Márquez de la Serna</strong>, de nacionalidad mexicana, mayor de edad, con CURP: <strong>MASR761003HDFRRD07</strong>, con domicilio en Calle Parque Los Laureles 3800, 402, MZ14 LT11, Residencial Foresta Crystal Lagoons, C.P. 52144, Metepec, Estado de México.</li>
                <li>Que es titular y/o socio mayoritario de las unidades de negocio: <strong>Clínica Alcatraces</strong>, <strong>Benesse</strong> y <strong>Alcatraces Senior Living</strong>.</li>
                <li>Que tiene plena capacidad jurídica y facultades suficientes para obligarse en los términos del presente contrato y otorgar la participación aquí pactada respecto de las unidades de negocio de su propiedad.</li>
                <li>Que es su libre voluntad celebrar el presente contrato.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold">II. Declara EL ASOCIANTE DE SYNAPSIA:</h3>
              <ol className="list-[lower-alpha] pl-6 space-y-1">
                <li>Llamarse <strong>Octavio Márquez Mendoza</strong>, de nacionalidad mexicana, mayor de edad, con CURP: <strong>MXMO390902HDFRNC08</strong>, con domicilio en C. Paseo Santa Teresa 108, Fraccionamiento San Carlos, C.P. 52159, Metepec, Estado de México.</li>
                <li>Que es propietario y titular del consultorio denominado <strong>Synapsia</strong>.</li>
                <li>Que tiene plena capacidad jurídica y facultades suficientes para obligarse en los términos del presente contrato y otorgar la participación del 5% de Synapsia aquí pactada.</li>
                <li>Que es su libre voluntad celebrar el presente contrato.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold">III. Declara EL ASOCIADO:</h3>
              <ol className="list-[lower-alpha] pl-6 space-y-1">
                <li>Llamarse <strong>C. Rafael Runard Rueda de León Contreras</strong>, de nacionalidad mexicana, mayor de edad, con CURP: <strong>RUCR840927HDFDNF02</strong>, con domicilio en Calle Hacienda Santa Rosa 62, Fraccionamiento Santa Elena, C.P. 52105, San Mateo Atenco, Estado de México.</li>
                <li>Que aporta como contribución a la asociación en participación un descuento de $120,000.00 M.N. sobre sus honorarios de consultoría, así como sus conocimientos y experiencia profesional.</li>
                <li>Que es su libre voluntad celebrar el presente contrato.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold">IV. Declaran todas las partes:</h3>
              <ol className="list-[lower-alpha] pl-6 space-y-1">
                <li>Que de manera simultánea al presente instrumento han suscrito un Contrato de Prestación de Servicios Profesionales de Consultoría.</li>
                <li>Que como parte de la negociación de dicho contrato, acordaron que EL ASOCIADO otorgaría un descuento de $120,000.00 M.N. a cambio de participación en las utilidades de las negociaciones de EL ASOCIANTE y EL ASOCIANTE DE SYNAPSIA, y la posterior formalización como socio.</li>
                <li>Que reconocen la validez y obligatoriedad del presente contrato conforme a los artículos 252 a 259 de la LGSM y los artículos 7.524 y siguientes del CCEM.</li>
                <li>Que el presente instrumento contiene dos figuras jurídicas complementarias: (i) un contrato de asociación en participación, y (ii) una promesa de contrato para la constitución de sociedades mercantiles, conforme al artículo 7.524 del CCEM.</li>
              </ol>
            </div>
          </div>

          <h2 className="text-lg font-serif font-bold mt-8">TÍTULO PRIMERO — DE LA ASOCIACIÓN EN PARTICIPACIÓN</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold">PRIMERA. — Objeto de la asociación en participación.</h3>
              <p>
                El presente contrato tiene por objeto establecer los términos y condiciones de la asociación en participación mediante la cual EL ASOCIANTE y EL ASOCIANTE DE SYNAPSIA otorgan a EL ASOCIADO una participación en las utilidades de sus respectivas unidades de negocio, a cambio de la aportación descrita en la cláusula tercera. EL ASOCIANTE y EL ASOCIANTE DE SYNAPSIA actuarán en nombre propio conforme al artículo 253 de la LGSM, careciendo la asociación en participación de personalidad jurídica propia.
              </p>
            </div>

            <div>
              <h3 className="font-bold">SEGUNDA. — Participación en utilidades.</h3>
              <p>EL ASOCIADO tendrá derecho a participar en las utilidades de las negociaciones conforme a los siguientes porcentajes:</p>
              <div className="mt-3 border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left px-4 py-3 font-bold">Unidad de Negocio</th>
                      <th className="text-center px-4 py-3 font-bold">% de Participación</th>
                      <th className="text-left px-4 py-3 font-bold">Otorgado por</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3">Synapsia</td>
                      <td className="text-center px-4 py-3 font-bold">5%</td>
                      <td className="px-4 py-3">C. Octavio Márquez Mendoza</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3">Clínica Alcatraces</td>
                      <td className="text-center px-4 py-3 font-bold">10%</td>
                      <td className="px-4 py-3">C. Rodrigo Márquez de la Serna</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3">Benesse</td>
                      <td className="text-center px-4 py-3 font-bold">10%</td>
                      <td className="px-4 py-3">C. Rodrigo Márquez de la Serna</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3">Alcatraces Senior Living</td>
                      <td className="text-center px-4 py-3 font-bold">5%</td>
                      <td className="px-4 py-3">C. Rodrigo Márquez de la Serna</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-2">
                EL ASOCIADO comenzará a gozar de la participación en las utilidades de las negociaciones <strong>a partir de la fecha de entrada en vigor del presente contrato</strong>, es decir, desde su firma.
              </p>
            </div>

            <div>
              <h3 className="font-bold">TERCERA. — Aportación de EL ASOCIADO.</h3>
              <p>La aportación de EL ASOCIADO consiste en:</p>
              <ol className="list-[lower-alpha] pl-6 space-y-1 mt-2">
                <li>Un descuento de <strong>$120,000.00 (ciento veinte mil pesos 00/100 M.N.)</strong> sobre el monto total de los servicios de consultoría pactados en el Contrato de Prestación de Servicios, el cual constituye su aportación económica a la asociación en participación.</li>
                <li>Sus conocimientos, experiencia y trabajo profesional en la ejecución de los servicios de consultoría.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold">CUARTA. — Límite de pérdidas del ASOCIADO.</h3>
              <p>
                De conformidad con el artículo 258 de la Ley General de Sociedades Mercantiles, las pérdidas de EL ASOCIADO en ningún caso podrán ser superiores al valor de su aportación, la cual asciende a <strong>$120,000.00 (ciento veinte mil pesos 00/100 M.N.)</strong>. En consecuencia, en caso de pérdidas en las negociaciones de EL ASOCIANTE o EL ASOCIANTE DE SYNAPSIA, EL ASOCIADO <strong>solamente responderá hasta el monto de su aportación</strong>, sin que se pueda afectar su patrimonio personal por cantidades superiores a dicho monto.
              </p>
            </div>

            <div>
              <h3 className="font-bold">QUINTA. — Derecho de auditoría.</h3>
              <p>
                De conformidad con el artículo 255 de la LGSM, EL ASOCIADO tendrá la facultad contractual de <strong>revisar los estados financieros de cada una de las unidades de negocio de manera mensual</strong>, con el propósito de asegurar que el reparto de utilidades sea veraz y oportuno. EL ASOCIANTE y EL ASOCIANTE DE SYNAPSIA se obligan a proporcionar dicha información dentro de los primeros 10 (diez) días hábiles del mes siguiente al que corresponda el periodo reportado.
              </p>
            </div>

            <div>
              <h3 className="font-bold">SEXTA. — Duración de la asociación en participación.</h3>
              <p>
                La asociación en participación tendrá vigencia desde la fecha de firma del presente contrato y subsistirá hasta que se materialice la promesa de contrato contenida en el Título Segundo del presente instrumento, momento en el cual EL ASOCIADO dejará de ser asociado para convertirse en socio de las sociedades mercantiles que se constituyan.
              </p>
            </div>
          </div>

          <h2 className="text-lg font-serif font-bold mt-8">TÍTULO SEGUNDO — DE LA PROMESA DE CONTRATO PARA LA CONSTITUCIÓN DE SOCIEDADES MERCANTILES</h2>

          <p className="text-xs italic text-muted-foreground">
            Las siguientes cláusulas constituyen una promesa de contrato en términos del artículo 7.524 del CCEM. La promesa genera una obligación de hacer consistente en celebrar los contratos definitivos de constitución de sociedades mercantiles, conforme al artículo 7.525 del CCEM. Las partes se identifican en este título como PROMITENTES.
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold">SÉPTIMA. — Promesa de contrato definitivo y formalización notarial.</h3>
              <p>
                De conformidad con los artículos 7.524, 7.525 y 7.527 del Código Civil del Estado de México, las partes celebran en este acto una promesa de contrato mediante la cual se obligan recíprocamente a formalizar la participación accionaria definitiva de EL ASOCIADO, quien dejará de serlo para convertirse en socio de EL PROMITENTE SOCIO ASOCIANTE y de EL PROMITENTE SOCIO ASOCIANTE DE SYNAPSIA, según corresponda.
              </p>
              <p className="mt-2">Para tal efecto, las partes se obligan a acudir ante Notario Público del Estado de México, dentro del plazo señalado en la cláusula octava, para realizar los siguientes actos de ejecución de la promesa:</p>
              <ol className="list-[lower-alpha] pl-6 space-y-1 mt-2">
                <li>Protocolizar la constitución formal de las sociedades mercantiles (S.A. o S. de R.L.) correspondientes a cada unidad de negocio, observando los requisitos de los artículos 6 y 91 de la Ley General de Sociedades Mercantiles.</li>
                <li>Formalizar e inscribir la titularidad de las acciones o partes sociales a favor de EL ASOCIADO en los libros de registro de socios, conforme a los artículos 73 y 128 de la LGSM, a saber: 5% en Synapsia (otorgado por EL PROMITENTE SOCIO ASOCIANTE DE SYNAPSIA), 10% en Clínica Alcatraces, 10% en Benesse y 5% en Alcatraces Senior Living (otorgados por EL PROMITENTE SOCIO ASOCIANTE).</li>
                <li>Inscribir dichos actos ante el Registro Público de Comercio.</li>
              </ol>
              <p className="mt-2">
                Los gastos notariales y de registro serán cubiertos en partes iguales entre las tres partes, salvo pacto en contrario.
              </p>
              <p className="mt-2">
                En términos del artículo 7.530 del CCEM, en caso de que EL PROMITENTE SOCIO ASOCIANTE o EL PROMITENTE SOCIO ASOCIANTE DE SYNAPSIA se rehúse a firmar los documentos necesarios para cumplir esta promesa, EL PROMITENTE SOCIO ASOCIADO podrá optar entre:
              </p>
              <ol className="list-[lower-roman] pl-6 space-y-1 mt-2">
                <li><strong>Demandar el cumplimiento forzoso</strong> del contrato de promesa de constitución de las sociedades mercantiles; o</li>
                <li><strong>Cobrar los $120,000.00 (ciento veinte mil pesos 00/100 M.N.)</strong> aportados como descuento, los cuales se convertirán en una <strong>deuda líquida y exigible de manera inmediata</strong>, con intereses del <strong>10% (diez por ciento) mensual</strong> a cargo del promitente incumplidor, hasta su total liquidación.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold">OCTAVA. — Plazo de la promesa.</h3>
              <p>
                En cumplimiento del artículo 7.527 del CCEM, el plazo para el otorgamiento de los contratos definitivos y su protocolización será de <strong>60 (sesenta) días naturales</strong> contados a partir de la conclusión satisfactoria de los trabajos de consultoría pactados en el Contrato de Prestación de Servicios Profesionales, entendida conforme a los criterios objetivos establecidos en la cláusula primera de dicho instrumento.
              </p>
            </div>

            <div>
              <h3 className="font-bold">NOVENA. — Derechos del PROMITENTE SOCIO ASOCIADO una vez materializada la promesa.</h3>
              <p>Una vez formalizada la constitución de las sociedades mercantiles y su inscripción como socio, EL PROMITENTE SOCIO ASOCIADO tendrá derecho a:</p>
              <ol className="list-[lower-alpha] pl-6 space-y-1 mt-2">
                <li>Participar en las utilidades de cada unidad de negocio en proporción a su porcentaje accionario.</li>
                <li>Participar con voz y voto en las asambleas de socios o accionistas.</li>
                <li>Tener acceso a la información financiera y operativa de las unidades de negocio.</li>
                <li>Los demás derechos que la ley otorga a los socios o accionistas.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold">DÉCIMA. — Obligaciones del PROMITENTE SOCIO ASOCIADO una vez materializada la promesa.</h3>
              <ol className="list-[lower-alpha] pl-6 space-y-1">
                <li>No competir directa ni indirectamente con las unidades de negocio de EL PROMITENTE SOCIO ASOCIANTE y EL PROMITENTE SOCIO ASOCIANTE DE SYNAPSIA durante la vigencia de su participación accionaria.</li>
                <li>Guardar confidencialidad respecto de toda información privilegiada a la que tenga acceso.</li>
                <li>Contribuir con su experiencia profesional al desarrollo y crecimiento de las unidades de negocio.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold">DÉCIMA PRIMERA. — Restricciones a la transmisión de acciones o partes sociales.</h3>
              <p>
                Una vez materializada la promesa, EL PROMITENTE SOCIO ASOCIADO no podrá ceder, transmitir, gravar o enajenar su participación accionaria sin el consentimiento previo y por escrito de EL PROMITENTE SOCIO ASOCIANTE y, en el caso de Synapsia, de EL PROMITENTE SOCIO ASOCIANTE DE SYNAPSIA. En caso de que desee vender su participación, el propietario correspondiente de cada unidad de negocio tendrá derecho de preferencia para adquirirla en las mismas condiciones ofrecidas por terceros.
              </p>
            </div>
          </div>

          <h2 className="text-lg font-serif font-bold mt-8">TÍTULO TERCERO — DISPOSICIONES GENERALES</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold">DÉCIMA SEGUNDA. — Causas de terminación.</h3>
              <p>El presente contrato terminará por:</p>
              <ol className="list-[lower-alpha] pl-6 space-y-1 mt-2">
                <li>Mutuo acuerdo de las partes.</li>
                <li>Incumplimiento grave de cualquiera de las partes a sus obligaciones.</li>
                <li>Disolución y liquidación de las unidades de negocio.</li>
                <li>Materialización total de la promesa de contrato, en cuyo caso la relación se regirá por los estatutos de las sociedades mercantiles constituidas.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold">DÉCIMA TERCERA. — Resolución de controversias.</h3>
              <p>
                Para la interpretación y cumplimiento del presente contrato, las partes se someten a la jurisdicción de los tribunales competentes de la ciudad de Toluca, Estado de México, renunciando a cualquier otro fuero que pudiera corresponderles.
              </p>
            </div>

            <div>
              <h3 className="font-bold">DÉCIMA CUARTA. — Legislación aplicable.</h3>
              <p>
                El presente contrato se rige, en lo relativo a la asociación en participación, por los artículos 252 a 259 de la <strong>Ley General de Sociedades Mercantiles</strong> y el Código de Comercio; y en lo relativo a la promesa de contrato, por los artículos 7.524, 7.525, 7.527 y 7.530 del <strong>Código Civil del Estado de México</strong>.
              </p>
            </div>
          </div>

          <p className="mt-8">
            Leído que fue el presente contrato y enteradas las partes de su contenido y alcance legal, lo firman por triplicado en la ciudad de Metepec, Estado de México, a {fechaActual}.
          </p>

          <div className="grid grid-cols-3 gap-8 mt-16 pt-8">
            <div className="text-center">
              <div className="border-t border-foreground/30 pt-4 mx-4">
                <p className="font-bold text-xs">EL ASOCIANTE / PROMITENTE SOCIO ASOCIANTE</p>
                <p className="mt-1">C. Rodrigo Márquez de la Serna</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-foreground/30 pt-4 mx-4">
                <p className="font-bold text-xs">EL ASOCIANTE DE SYNAPSIA / PROMITENTE SOCIO ASOCIANTE DE SYNAPSIA</p>
                <p className="mt-1">C. Octavio Márquez Mendoza</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-foreground/30 pt-4 mx-4">
                <p className="font-bold text-xs">EL ASOCIADO / PROMITENTE SOCIO ASOCIADO</p>
                <p className="mt-1">C. Rafael Runard Rueda de León Contreras</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 mt-12">
            <div className="text-center">
              <div className="border-t border-foreground/30 pt-4 mx-8">
                <p className="font-bold">TESTIGO</p>
                <p>Nombre: ____________________________</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-foreground/30 pt-4 mx-8">
                <p className="font-bold">TESTIGO</p>
                <p>Nombre: ____________________________</p>
              </div>
            </div>
          </div>
        </article>

        {/* Botón de impresión */}
        <div className="text-center mt-12 print:hidden">
          <button
            onClick={() => window.print()}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Imprimir Contratos
          </button>
        </div>
      </div>
    </div>
  );
};

export default Contratos;
