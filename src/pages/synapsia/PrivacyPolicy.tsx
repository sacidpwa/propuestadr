export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto prose prose-sm">
        <h1 className="text-2xl font-bold mb-4">Política de Privacidad</h1>
        <p className="text-muted-foreground text-sm">Última actualización: 14 de julio de 2026</p>

        <h2 className="text-lg font-semibold mt-6">1. Información que recopilamos</h2>
        <p>Synapsia ERP recopila información necesaria para el funcionamiento del sistema de gestión clínica:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li><strong>Datos de identificación:</strong> nombre completo, correo electrónico y contraseña de los usuarios.</li>
          <li><strong>Datos de pacientes:</strong> nombre, teléfono, correo electrónico, historial médico, citas y notas clínicas.</li>
          <li><strong>Datos de Google Calendar:</strong> cuando un especialista conecta su cuenta de Google, accedemos a su calendario para sincronizar citas. No accedemos a otros datos de su cuenta de Google.</li>
          <li><strong>Datos de Google Tasks:</strong> cuando un especialista conecta su cuenta de Google, accedemos a sus listas de tareas para gestionar tareas relacionadas con el trabajo.</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6">2. Uso de la información</h2>
        <p>Utilizamos la información recopilada para:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Gestionar citas, pacientes y registros médicos.</li>
          <li>Sincronizar citas con Google Calendar del especialista.</li>
          <li>Gestionar tareas a través de Google Tasks.</li>
          <li>Generar reportes y métricas para la administración.</li>
          <li>Controlar accesos según el rol del usuario.</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6">3. Acceso a Google Calendar y Tasks</h2>
        <p>Cuando un especialista conecta su cuenta de Google:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Solo accedemos a <strong>Calendar</strong> y <strong>Tasks</strong>, no a correo, contactos ni otros servicios.</li>
          <li>Los tokens de acceso se almacenan de forma segura en nuestra base de datos.</li>
          <li>El especialista puede desconectar su cuenta de Google en cualquier momento desde la agenda.</li>
          <li>La sincronización es bidireccional: los cambios en la app se reflejan en Google y viceversa.</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6">4. Almacenamiento y seguridad</h2>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Los datos se almacenan en Supabase (infraestructura en la nube con cifrado).</li>
          <li>Las contraseñas se almacenan de forma hasheada.</li>
          <li>Implementamos políticas de nivel de fila (RLS) para controlar el acceso a los datos.</li>
          <li>No compartimos datos con terceros excepto cuando es necesario para el funcionamiento del sistema.</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6">5. Derechos del usuario</h2>
        <p>Los usuarios pueden:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Solicitar acceso a sus datos personales.</li>
          <li>Solicitar la eliminación de sus datos.</li>
          <li>Desconectar su cuenta de Google en cualquier momento.</li>
          <li>Solicitar la corrección de datos inexactos.</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6">6. Retención de datos</h2>
        <p>Los datos se conservan mientras la cuenta del usuario esté activa. Al eliminar una cuenta, los datos se eliminan de forma permanente dentro de los 30 días siguientes.</p>

        <h2 className="text-lg font-semibold mt-6">7. Cambios en esta política</h2>
        <p> Nos reservamos el derecho de actualizar esta política. Los usuarios serán notificados de cambios significativos a través del sistema.</p>

        <h2 className="text-lg font-semibold mt-6">8. Contacto</h2>
        <p>Para preguntas sobre esta política de privacidad, contactar a: <strong>sacidpwa@gmail.com</strong></p>
      </div>
    </div>
  );
}
