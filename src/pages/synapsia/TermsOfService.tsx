export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto prose prose-sm">
        <h1 className="text-2xl font-bold mb-4">Términos de Servicio</h1>
        <p className="text-muted-foreground text-sm">Última actualización: 14 de julio de 2026</p>

        <h2 className="text-lg font-semibold mt-6">1. Aceptación de los términos</h2>
        <p>Al acceder y utilizar Synapsia ERP ("el Sistema"), usted acepta estos términos de servicio. Si no está de acuerdo con alguno de estos términos, no utilice el Sistema.</p>

        <h2 className="text-lg font-semibold mt-6">2. Descripción del servicio</h2>
        <p>Synapsia ERP es un sistema de gestión clínica que permite:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Gestión de pacientes y registros médicos.</li>
          <li>Programación y administración de citas.</li>
          <li>Sincronización con Google Calendar y Google Tasks.</li>
          <li>Gestión administrativa, financiera y de recursos humanos.</li>
          <li>Generación de reportes y métricas.</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6">3. Cuentas de usuario</h2>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Cada usuario es responsable de mantener la confidencialidad de su contraseña.</li>
          <li>Los usuarios son responsables de todas las actividades que ocurran bajo su cuenta.</li>
          <li>Debe notificar inmediatamente cualquier uso no autorizado de su cuenta.</li>
          <li>El acceso al Sistema está restringido al personal autorizado de la organización.</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6">4. Uso aceptable</h2>
        <p>Los usuarios se comprometen a:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Utilizar el Sistema únicamente para fines laborales autorizados.</li>
          <li>No compartir credenciales de acceso con terceros.</li>
          <li>No intentar acceder a datos de otros usuarios sin autorización.</li>
          <li>Cumplir con todas las leyes aplicables, incluyendo la protección de datos personales y salud.</li>
          <li>No utilizar el Sistema para fines ilegales o no autorizados.</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6">5. Integración con Google</h2>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>El Sistema se integra con Google Calendar y Google Tasks mediante OAuth 2.0.</li>
          <li>Al conectar su cuenta de Google, usted autoriza al Sistema a acceder a su calendario y tareas.</li>
          <li>Puede desconectar su cuenta de Google en cualquier momento desde la interfaz del Sistema.</li>
          <li>El Sistema no accede a correo electrónico, contactos ni otros servicios de Google.</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6">6. Propiedad intelectual</h2>
        <p>Todo el contenido, diseño y código del Sistema son propiedad de Synapsia. No se permite la reproducción, distribución o modificación no autorizada.</p>

        <h2 className="text-lg font-semibold mt-6">7. Limitación de responsabilidad</h2>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>El Sistema se proporciona "tal cual" sin garantías de ningún tipo.</li>
          <li>No garantizamos disponibilidad ininterrumpida del servicio.</li>
          <li>No somos responsables por pérdidas de datos causadas por fallos técnicos.</li>
          <li>Los usuarios son responsables de mantener copias de seguridad de sus datos cuando sea necesario.</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6">8. Disponibilidad del servicio</h2>
        <p>Nos esforzamos por mantener el Sistema disponible 24/7, pero podemos realizar mantenimiento programado con notificación previa cuando sea posible.</p>

        <h2 className="text-lg font-semibold mt-6">9. Terminación</h2>
        <p>Podemos suspender o cancelar el acceso de un usuario si se detecta un uso indebido del Sistema o una violación de estos términos.</p>

        <h2 className="text-lg font-semibold mt-6">10. Cambios en los términos</h2>
        <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los usuarios serán notificados de cambios significativos a través del Sistema.</p>

        <h2 className="text-lg font-semibold mt-6">11. Contacto</h2>
        <p>Para preguntas sobre estos términos de servicio, contactar a: <strong>sacidpwa@gmail.com</strong></p>
      </div>
    </div>
  );
}
