const Contratos = () => {
  const fechaActual = "26 de febrero de 2026";

  return (
    <div className="bg-background min-h-screen py-12 px-6 md:px-20 print:px-12 print:py-6">
      <div className="max-w-4xl mx-auto space-y-16 font-sans text-foreground text-sm leading-relaxed">

        {/* ========== CONTRATO 1: PRESTACIÓN DE SERVICIOS ========== */}
        <article className="space-y-6">
          <h1 className="text-2xl font-serif font-bold text-center uppercase tracking-wide">
            Contrato de Prestación de Servicios Profesionales de Consultoría
          </h1>

          <p>
            Contrato de prestación de servicios profesionales que celebran, por una parte, el{" "}
            <strong>C. Rafael Runard Rueda de León Contreras</strong>, en su carácter de prestador de servicios, a quien en lo sucesivo se le denominará <strong>"EL CONSULTOR"</strong>; y por la otra, el{" "}
            <strong>Dr. Rodrigo Márquez de la Serna</strong>, en su carácter de contratante, a quien en lo sucesivo se le denominará <strong>"EL CLIENTE"</strong>; al tenor de las siguientes declaraciones y cláusulas:
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
                <li>Llamarse <strong>Dr. Rodrigo Márquez de la Serna</strong>, de nacionalidad mexicana, mayor de edad, con domicilio en Calle Parque Los Laureles 3800, 402, MZ14 LT11, Residencial Foresta Crystal Lagoons, C.P. 52144, Metepec, Estado de México.</li>
                <li>CURP: <strong>MASR761003HDFRRD07</strong>.</li>
                <li>Clave de Elector: <strong>MRSRRD76100309H000</strong>.</li>
                <li>Que es titular y/o socio mayoritario de las unidades de negocio denominadas <strong>Synapsia</strong>, <strong>Clínica Alcatraces</strong>, <strong>Benesse</strong> y <strong>Alcatraces Senior Living</strong>.</li>
                <li>Que requiere los servicios profesionales de consultoría para la reingeniería, digitalización y reestructuración de las unidades de negocio antes mencionadas.</li>
                <li>Que es su voluntad celebrar el presente contrato.</li>
              </ol>
            </div>
          </div>

          <h2 className="text-lg font-serif font-bold mt-8">CLÁUSULAS</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold">PRIMERA. — Objeto del contrato.</h3>
              <p>EL CONSULTOR se obliga a prestar a EL CLIENTE los siguientes servicios profesionales de consultoría:</p>
              <ol className="list-decimal pl-6 space-y-1 mt-2">
                <li>Diagnóstico integral de las cuatro unidades de negocio (Synapsia, Clínica Alcatraces, Benesse y Alcatraces Senior Living).</li>
                <li>Diseño de gobierno corporativo y organigrama funcional.</li>
                <li>Estrategia de retiro de socios para Benesse.</li>
                <li>Plan de sucesión del Dr. Márquez.</li>
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
                Como contraprestación por el descuento otorgado conforme a la cláusula segunda, EL CLIENTE se obliga a otorgar a EL CONSULTOR participación accionaria en sus unidades de negocio conforme a lo siguiente:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong>10% (diez por ciento)</strong> de participación accionaria en <strong>Synapsia</strong>.</li>
                <li><strong>10% (diez por ciento)</strong> de participación accionaria en <strong>Clínica Alcatraces</strong>.</li>
                <li><strong>10% (diez por ciento)</strong> de participación accionaria en <strong>Benesse</strong>.</li>
                <li><strong>5% (cinco por ciento)</strong> de participación accionaria en <strong>Alcatraces Senior Living</strong>.</li>
              </ul>
              <p className="mt-2">
                Dicha participación se formalizará mediante el Contrato de Asociación en Participación que las partes suscriben de manera simultánea al presente instrumento, y se protocolizará ante Notario Público conforme a lo estipulado en dicho contrato.
              </p>
            </div>

            <div>
              <h3 className="font-bold">CUARTA. — Forma de pago.</h3>
              <p>
                El monto de $420,000.00 más IVA se pagará en mensualidades con base en el avance de los trabajos, durante un periodo estimado de <strong>8 (ocho) meses</strong>. Cada pago mensual se realizará dentro de los primeros 5 (cinco) días hábiles del mes correspondiente, previa presentación de factura fiscal por parte de EL CONSULTOR.
              </p>
            </div>

            <div>
              <h3 className="font-bold">QUINTA. — Plazo.</h3>
              <p>
                El plazo estimado para la ejecución de los servicios es de <strong>8 (ocho) meses</strong> contados a partir de la firma del presente contrato, pudiendo ser ampliado de común acuerdo entre las partes mediante addendum por escrito.
              </p>
            </div>

            <div>
              <h3 className="font-bold">SEXTA. — Obligaciones de EL CONSULTOR.</h3>
              <ol className="list-[lower-alpha] pl-6 space-y-1">
                <li>Ejecutar los servicios con diligencia, profesionalismo y en los plazos acordados.</li>
                <li>Presentar informes periódicos de avance.</li>
                <li>Guardar estricta confidencialidad sobre toda la información a la que tenga acceso.</li>
                <li>Entregar todos los entregables descritos en la cláusula primera.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold">SÉPTIMA. — Obligaciones de EL CLIENTE.</h3>
              <ol className="list-[lower-alpha] pl-6 space-y-1">
                <li>Proporcionar a EL CONSULTOR la información y acceso necesarios para la ejecución de los servicios.</li>
                <li>Realizar los pagos en los términos pactados.</li>
                <li>Formalizar la participación accionaria conforme a la cláusula tercera.</li>
                <li>Designar un punto de contacto para la coordinación de los trabajos.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold">OCTAVA. — Confidencialidad.</h3>
              <p>
                Ambas partes se obligan a mantener en estricta confidencialidad toda la información intercambiada con motivo del presente contrato, incluyendo pero no limitándose a información financiera, operativa, estratégica y de pacientes. Esta obligación subsistirá por un periodo de 5 (cinco) años posteriores a la terminación del contrato.
              </p>
            </div>

            <div>
              <h3 className="font-bold">NOVENA. — Propiedad intelectual.</h3>
              <p>
                Los entregables desarrollados por EL CONSULTOR en ejecución del presente contrato serán propiedad de EL CLIENTE una vez liquidado el pago total de los servicios. EL CONSULTOR conservará el derecho de utilizar las metodologías y conocimientos generales empleados.
              </p>
            </div>

            <div>
              <h3 className="font-bold">DÉCIMA. — Terminación anticipada.</h3>
              <p>
                Cualquiera de las partes podrá dar por terminado el presente contrato mediante aviso por escrito con al menos 30 (treinta) días naturales de anticipación. En caso de terminación anticipada, EL CLIENTE deberá pagar los servicios efectivamente prestados hasta la fecha de terminación, y la participación accionaria se ajustará proporcionalmente al porcentaje de avance de los trabajos.
              </p>
            </div>

            <div>
              <h3 className="font-bold">DÉCIMA PRIMERA. — Resolución de controversias.</h3>
              <p>
                Para la interpretación y cumplimiento del presente contrato, las partes se someten a la jurisdicción de los tribunales competentes de la ciudad de Toluca, Estado de México, renunciando a cualquier otro fuero que pudiera corresponderles por razón de su domicilio presente o futuro.
              </p>
            </div>

            <div>
              <h3 className="font-bold">DÉCIMA SEGUNDA. — Legislación aplicable.</h3>
              <p>
                El presente contrato se rige por las disposiciones del Código Civil Federal, el Código Civil del Estado de México y demás legislación aplicable en materia de prestación de servicios profesionales.
              </p>
            </div>
          </div>

          <p className="mt-8">
            Leído que fue el presente contrato y enteradas las partes de su contenido y alcance legal, lo firman por duplicado en la ciudad de Metepec, Estado de México, a {fechaActual}.
          </p>

          <div className="grid grid-cols-2 gap-12 mt-16 pt-8">
            <div className="text-center space-y-16">
              <div className="border-t border-foreground/30 pt-4 mx-8">
                <p className="font-bold">EL CONSULTOR</p>
                <p>C. Rafael Runard Rueda de León Contreras</p>
              </div>
            </div>
            <div className="text-center space-y-16">
              <div className="border-t border-foreground/30 pt-4 mx-8">
                <p className="font-bold">EL CLIENTE</p>
                <p>Dr. Rodrigo Márquez de la Serna</p>
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

        {/* ========== CONTRATO 2: ASOCIACIÓN EN PARTICIPACIÓN ========== */}
        <article className="space-y-6">
          <h1 className="text-2xl font-serif font-bold text-center uppercase tracking-wide">
            Contrato de Asociación en Participación
          </h1>

          <p>
            Contrato de asociación en participación que celebran, por una parte, el{" "}
            <strong>Dr. Rodrigo Márquez de la Serna</strong>, a quien en lo sucesivo se le denominará <strong>"EL ASOCIANTE"</strong>; y por la otra, el{" "}
            <strong>C. Rafael Runard Rueda de León Contreras</strong>, a quien en lo sucesivo se le denominará <strong>"EL ASOCIADO"</strong>; al tenor de las siguientes declaraciones y cláusulas:
          </p>

          <h2 className="text-lg font-serif font-bold mt-8">DECLARACIONES</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold">I. Declara EL ASOCIANTE:</h3>
              <ol className="list-[lower-alpha] pl-6 space-y-1">
                <li>Llamarse <strong>Dr. Rodrigo Márquez de la Serna</strong>, de nacionalidad mexicana, mayor de edad, con CURP: <strong>MASR761003HDFRRD07</strong>, con domicilio en Calle Parque Los Laureles 3800, 402, MZ14 LT11, Residencial Foresta Crystal Lagoons, C.P. 52144, Metepec, Estado de México.</li>
                <li>Que es titular y/o socio mayoritario de las unidades de negocio: <strong>Synapsia</strong>, <strong>Clínica Alcatraces</strong>, <strong>Benesse</strong> y <strong>Alcatraces Senior Living</strong>.</li>
                <li>Que tiene plena capacidad jurídica y facultades suficientes para obligarse en los términos del presente contrato y otorgar la participación accionaria aquí pactada.</li>
                <li>Que es su libre voluntad celebrar el presente contrato.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold">II. Declara EL ASOCIADO:</h3>
              <ol className="list-[lower-alpha] pl-6 space-y-1">
                <li>Llamarse <strong>C. Rafael Runard Rueda de León Contreras</strong>, de nacionalidad mexicana, mayor de edad, con CURP: <strong>RUCR840927HDFDNF02</strong>, con domicilio en Calle Hacienda Santa Rosa 62, Fraccionamiento Santa Elena, C.P. 52105, San Mateo Atenco, Estado de México.</li>
                <li>Que aporta sus conocimientos, experiencia profesional y servicios de consultoría como contribución a la asociación en participación.</li>
                <li>Que es su libre voluntad celebrar el presente contrato.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold">III. Declaran ambas partes:</h3>
              <ol className="list-[lower-alpha] pl-6 space-y-1">
                <li>Que de manera simultánea al presente instrumento han suscrito un Contrato de Prestación de Servicios Profesionales de Consultoría.</li>
                <li>Que como parte de la negociación de dicho contrato, acordaron que EL ASOCIADO otorgaría un descuento de $120,000.00 M.N. a cambio de participación accionaria en las unidades de negocio de EL ASOCIANTE.</li>
                <li>Que reconocen la validez y obligatoriedad del presente contrato conforme a los artículos 252 a 259 de la Ley General de Sociedades Mercantiles.</li>
              </ol>
            </div>
          </div>

          <h2 className="text-lg font-serif font-bold mt-8">CLÁUSULAS</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold">PRIMERA. — Objeto.</h3>
              <p>
                El presente contrato tiene por objeto establecer los términos y condiciones de la asociación en participación mediante la cual EL ASOCIANTE otorga a EL ASOCIADO participación accionaria en sus unidades de negocio, a cambio de la aportación consistente en servicios profesionales de consultoría y el descuento económico otorgado en el Contrato de Prestación de Servicios.
              </p>
            </div>

            <div>
              <h3 className="font-bold">SEGUNDA. — Participación accionaria.</h3>
              <p>EL ASOCIANTE se obliga a otorgar a EL ASOCIADO la siguiente participación accionaria:</p>
              <div className="mt-3 border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left px-4 py-3 font-bold">Unidad de Negocio</th>
                      <th className="text-center px-4 py-3 font-bold">% de Participación</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3">Synapsia</td>
                      <td className="text-center px-4 py-3 font-bold">10%</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3">Clínica Alcatraces</td>
                      <td className="text-center px-4 py-3 font-bold">10%</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3">Benesse</td>
                      <td className="text-center px-4 py-3 font-bold">10%</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3">Alcatraces Senior Living</td>
                      <td className="text-center px-4 py-3 font-bold">5%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="font-bold">TERCERA. — Aportación de EL ASOCIADO.</h3>
              <p>
                La aportación de EL ASOCIADO consiste en:
              </p>
              <ol className="list-[lower-alpha] pl-6 space-y-1 mt-2">
                <li>Un descuento de <strong>$120,000.00 (ciento veinte mil pesos 00/100 M.N.)</strong> sobre el monto total de los servicios de consultoría pactados en el Contrato de Prestación de Servicios.</li>
                <li>Sus conocimientos, experiencia y trabajo profesional en la ejecución de los servicios de consultoría, reingeniería de procesos y digitalización de las unidades de negocio.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold">CUARTA. — Condición para la materialización.</h3>
              <p>
                La participación accionaria establecida en la cláusula segunda quedará sujeta a la condición de que EL ASOCIADO concluya satisfactoriamente la totalidad de los trabajos y entregables pactados en el Contrato de Prestación de Servicios Profesionales de Consultoría. Se entenderá por conclusión satisfactoria la entrega y aceptación de todos los entregables por parte de EL ASOCIANTE.
              </p>
            </div>

            <div>
              <h3 className="font-bold">QUINTA. — Protocolización ante Notario Público.</h3>
              <p>
                Una vez concluidos satisfactoriamente los trabajos de consultoría conforme a la cláusula cuarta, las partes se obligan a acudir ante <strong>Notario Público</strong> del Estado de México para:
              </p>
              <ol className="list-[lower-alpha] pl-6 space-y-1 mt-2">
                <li>Protocolizar la constitución formal de las sociedades mercantiles correspondientes a cada unidad de negocio, en caso de no existir previamente.</li>
                <li>Formalizar e inscribir la participación accionaria de EL ASOCIADO en los porcentajes establecidos en la cláusula segunda.</li>
                <li>Inscribir las modificaciones correspondientes ante el Registro Público de Comercio.</li>
              </ol>
              <p className="mt-2">
                Los gastos notariales y de registro serán cubiertos en partes iguales por ambas partes, salvo pacto en contrario.
              </p>
            </div>

            <div>
              <h3 className="font-bold">SEXTA. — Plazo para la protocolización.</h3>
              <p>
                La protocolización deberá realizarse dentro de los <strong>60 (sesenta) días naturales</strong> siguientes a la conclusión de los trabajos de consultoría. En caso de que EL ASOCIANTE no cumpla con esta obligación, EL ASOCIADO tendrá derecho a exigir judicialmente el cumplimiento forzoso del presente contrato.
              </p>
            </div>

            <div>
              <h3 className="font-bold">SÉPTIMA. — Derechos de EL ASOCIADO.</h3>
              <p>Una vez formalizada la participación accionaria, EL ASOCIADO tendrá derecho a:</p>
              <ol className="list-[lower-alpha] pl-6 space-y-1 mt-2">
                <li>Participar en las utilidades de cada unidad de negocio en proporción a su porcentaje accionario.</li>
                <li>Participar con voz y voto en las asambleas de socios o accionistas.</li>
                <li>Tener acceso a la información financiera y operativa de las unidades de negocio.</li>
                <li>Los demás derechos que la ley otorga a los socios o accionistas.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold">OCTAVA. — Obligaciones de EL ASOCIADO como socio.</h3>
              <ol className="list-[lower-alpha] pl-6 space-y-1">
                <li>No competir directa ni indirectamente con las unidades de negocio de EL ASOCIANTE durante la vigencia de su participación accionaria.</li>
                <li>Guardar confidencialidad respecto de toda información privilegiada a la que tenga acceso.</li>
                <li>Contribuir con su experiencia profesional al desarrollo y crecimiento de las unidades de negocio.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold">NOVENA. — Restricciones a la transmisión de acciones.</h3>
              <p>
                EL ASOCIADO no podrá ceder, transmitir, gravar o enajenar su participación accionaria sin el consentimiento previo y por escrito de EL ASOCIANTE. En caso de que EL ASOCIADO desee vender su participación, EL ASOCIANTE tendrá derecho de preferencia para adquirirla en las mismas condiciones ofrecidas por terceros.
              </p>
            </div>

            <div>
              <h3 className="font-bold">DÉCIMA. — Duración.</h3>
              <p>
                El presente contrato de asociación en participación tendrá una duración indefinida, subsistiendo mientras las unidades de negocio continúen en operación y EL ASOCIADO mantenga su participación accionaria.
              </p>
            </div>

            <div>
              <h3 className="font-bold">DÉCIMA PRIMERA. — Causas de terminación.</h3>
              <p>El presente contrato terminará por:</p>
              <ol className="list-[lower-alpha] pl-6 space-y-1 mt-2">
                <li>Mutuo acuerdo de las partes.</li>
                <li>Incumplimiento grave de cualquiera de las partes a sus obligaciones.</li>
                <li>Disolución y liquidación de las unidades de negocio.</li>
                <li>Cesión total de la participación accionaria de EL ASOCIADO conforme a la cláusula novena.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-bold">DÉCIMA SEGUNDA. — Resolución de controversias.</h3>
              <p>
                Para la interpretación y cumplimiento del presente contrato, las partes se someten a la jurisdicción de los tribunales competentes de la ciudad de Toluca, Estado de México, renunciando a cualquier otro fuero que pudiera corresponderles.
              </p>
            </div>

            <div>
              <h3 className="font-bold">DÉCIMA TERCERA. — Legislación aplicable.</h3>
              <p>
                El presente contrato se rige por las disposiciones de la Ley General de Sociedades Mercantiles (artículos 252 a 259), el Código de Comercio y demás legislación mercantil aplicable.
              </p>
            </div>
          </div>

          <p className="mt-8">
            Leído que fue el presente contrato y enteradas las partes de su contenido y alcance legal, lo firman por duplicado en la ciudad de Metepec, Estado de México, a {fechaActual}.
          </p>

          <div className="grid grid-cols-2 gap-12 mt-16 pt-8">
            <div className="text-center">
              <div className="border-t border-foreground/30 pt-4 mx-8">
                <p className="font-bold">EL ASOCIANTE</p>
                <p>Dr. Rodrigo Márquez de la Serna</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-foreground/30 pt-4 mx-8">
                <p className="font-bold">EL ASOCIADO</p>
                <p>C. Rafael Runard Rueda de León Contreras</p>
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
        <div className="text-center print:hidden mt-12">
          <button
            onClick={() => window.print()}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-sans font-semibold hover:opacity-90 transition-opacity"
          >
            Imprimir contratos
          </button>
        </div>
      </div>
    </div>
  );
};

export default Contratos;
