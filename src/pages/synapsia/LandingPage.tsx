import { Link } from "react-router-dom";
import {
  Brain,
  Calendar,
  Users,
  ClipboardList,
  BarChart3,
  Shield,
  Building2,
  Heart,
  FileText,
  DollarSign,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Star,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Gestión de Pacientes",
    description:
      "Registro completo, expedientes clínicos, historial médico y seguimiento personalizado de cada paciente.",
  },
  {
    icon: Calendar,
    title: "Agenda Inteligente",
    description:
      "Programación de citas con sincronización bidireccional a Google Calendar. Vista de calendario diaria, semanal y mensual.",
  },
  {
    icon: ClipboardList,
    title: "Control Administrativo",
    description:
      "Inventario, requisiciones, órdenes de compra, gastos por unidad y control de caja chica.",
  },
  {
    icon: BarChart3,
    title: "Métricas y Reportes",
    description:
      "Dashboard ejecutivo con indicadores clave, reportes financieros y análisis de ocupación por unidad.",
  },
  {
    icon: Shield,
    title: "Control de Acceso",
    description:
      "Sistema de roles y permisos: admin, dueño, recepción, especialista, enfermería, intendencia y más.",
  },
  {
    icon: DollarSign,
    title: "Facturación y Nómina",
    description:
      "Generación de facturas, control de cartera, cálculo de nómina y gestión de evaluaciones de desempeño.",
  },
];

const units = [
  { name: "Clínica del Adulto Mayor", icon: Heart },
  { name: "Centro Neurológico", icon: Brain },
  { name: "Unidad de Rehabilitación", icon: Building2 },
];

const testimonials = [
  {
    name: "Dra. María López",
    role: "Directora Clínica",
    text: "Synapsia transformó la forma en que gestionamos nuestras citas y pacientes. La sincronización con Google Calendar nos ahorra horas cada semana.",
  },
  {
    name: "Carlos Ramírez",
    role: "Administrador",
    text: "El control de inventario y gastos por unidad nos dio visibilidad total. Ahora tomamos decisiones basadas en datos reales.",
  },
  {
    name: "Ana García",
    role: "Recepcionista",
    text: "Registrar pacientes y agendar citas nunca fue tan fácil. La interfaz es intuitiva y el soporte siempre está disponible.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold">Synapsia</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                Sistema de Gestión Clínica
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/privacy"
              className="hidden md:inline-block text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacidad
            </Link>
            <Link
              to="/terms"
              className="hidden md:inline-block text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Términos
            </Link>
            <Link
              to="/synapsia/login"
              className="px-3 sm:px-5 py-2 bg-primary text-primary-foreground rounded-lg text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-6">
            <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
            Plataforma de gestión clínica integral
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 sm:mb-6">
            Gestión, Control y Planeación
            <br />
            <span className="text-primary">para tu Unidad Clínica</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-lg lg:text-xl max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            Administra pacientes, agenda citas, controla inventario, nómina y
            finanzas desde una sola plataforma. Integración directa con Google
            Calendar para que nunca pierdas una cita.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/synapsia/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity text-sm sm:text-base"
            >
              Comenzar Ahora
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 border rounded-lg font-medium hover:bg-muted transition-colors text-sm sm:text-base"
            >
              Conocer Más
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-20 lg:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h3 className="text-2xl sm:text-3xl font-bold mb-3">
              Todo lo que necesitas en un solo lugar
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
              Herramientas diseñadas específicamente para unidades clínicas,
              hospitales y centros de salud.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-5 sm:p-6 rounded-xl border bg-card hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold mb-2 text-sm sm:text-base">
                  {f.title}
                </h4>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Units */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h3 className="text-2xl sm:text-3xl font-bold mb-3">
              Unidades que confían en nosotros
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
              Gestiona múltiples unidades clínicas desde una sola plataforma con
              dashboards independientes.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {units.map((u) => (
              <div
                key={u.name}
                className="p-6 sm:p-8 rounded-xl border bg-card text-center hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <u.icon className="w-7 h-7 text-primary" />
                </div>
                <h4 className="font-semibold text-sm sm:text-base">{u.name}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20 lg:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h3 className="text-2xl sm:text-3xl font-bold mb-3">
              ¿Cómo funciona?
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
              En tres pasos simples tu unidad clínica estará funcionando con
              Synapsia.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: "1",
                title: "Configura tu unidad",
                desc: "Registra las unidades clínicas, servicios, precios y personal autorizado.",
              },
              {
                step: "2",
                title: "Conecta tu calendario",
                desc: "Vincula Google Calendar de cada especialista para sincronizar citas automáticamente.",
              },
              {
                step: "3",
                title: "Gestiona todo",
                desc: "Pacientes, inventario, finanzas y más. Todo desde un solo panel de control.",
              },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {s.step}
                </div>
                <h4 className="font-semibold mb-2 text-sm sm:text-base">
                  {s.title}
                </h4>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h3 className="text-2xl sm:text-3xl font-bold mb-3">
              Lo que dicen nuestros usuarios
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="p-5 sm:p-6 rounded-xl border bg-card"
              >
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-primary text-primary"
                    />
                  ))}
                </div>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-4">
                  "{t.text}"
                </p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-muted-foreground text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Synapsia */}
      <section className="py-16 sm:py-20 lg:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
                Sobre Synapsia
              </h3>
              <div className="space-y-3 sm:space-y-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
                <p>
                  <strong className="text-foreground">Synapsia</strong> es un
                  sistema de gestión integral diseñado para unidades clínicas,
                  hospitales y centros de salud en México. Nuestra plataforma
                  centraliza todas las operaciones administrativas y clínicas en
                  un solo lugar.
                </p>
                <p>
                  Desde la recepción de pacientes hasta el control financiero,
                  Synapsia ofrece herramientas que simplifican el trabajo
                  diario del personal médico y administrativo, permitiéndoles
                  enfocarse en lo que más importa: la atención al paciente.
                </p>
                <p>
                  Nuestra integración con Google Calendar permite a cada
                  especialista sincronizar su agenda personal con el sistema,
                  eliminando conflictos de horarios y reduciendo las
                  ausencias no justificadas.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { number: "500+", label: "Pacientes Registrados" },
                { number: "3", label: "Unidades Activas" },
                { number: "50+", label: "Citas Diarias" },
                { number: "99%", label: "Disponibilidad" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-4 sm:p-6 rounded-xl border bg-card text-center"
                >
                  <p className="text-2xl sm:text-3xl font-bold text-primary mb-1">
                    {stat.number}
                  </p>
                  <p className="text-muted-foreground text-xs">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h3 className="text-2xl sm:text-3xl font-bold mb-3">
              Integraciones que simplifican tu trabajo
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
              Conecta con las herramientas que ya uses a diario.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
            <div className="p-5 sm:p-6 rounded-xl border bg-card text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-[#4285F4]/10 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-sm">Google Calendar</h4>
              <p className="text-muted-foreground text-xs mt-1">
                Sincronización bidireccional de citas
              </p>
            </div>
            <div className="p-5 sm:p-6 rounded-xl border bg-card text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-[#4285F4]/10 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#4285F4">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" />
                </svg>
              </div>
              <h4 className="font-semibold text-sm">Google Tasks</h4>
              <p className="text-muted-foreground text-xs mt-1">
                Gestión de tareas del equipo
              </p>
            </div>
            <div className="p-5 sm:p-6 rounded-xl border bg-card text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold text-sm">Reportes</h4>
              <p className="text-muted-foreground text-xs mt-1">
                Exportación de datos y métricas
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 sm:py-20 lg:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h3 className="text-2xl sm:text-3xl font-bold mb-3">
              Contáctanos
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
              ¿Tienes preguntas? Estamos aquí para ayudarte.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
            <div className="p-5 sm:p-6 rounded-xl border bg-card text-center">
              <Phone className="w-5 h-5 text-primary mx-auto mb-3" />
              <h4 className="font-semibold text-sm mb-1">Teléfono</h4>
              <p className="text-muted-foreground text-xs">
                +52 (XXX) XXX-XXXX
              </p>
            </div>
            <div className="p-5 sm:p-6 rounded-xl border bg-card text-center">
              <Mail className="w-5 h-5 text-primary mx-auto mb-3" />
              <h4 className="font-semibold text-sm mb-1">Correo</h4>
              <p className="text-muted-foreground text-xs">
                contacto@synapsiaerp.site
              </p>
            </div>
            <div className="p-5 sm:p-6 rounded-xl border bg-card text-center">
              <MapPin className="w-5 h-5 text-primary mx-auto mb-3" />
              <h4 className="font-semibold text-sm mb-1">Ubicación</h4>
              <p className="text-muted-foreground text-xs">México</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold mb-4">
            ¿Listo para transformar tu clínica?
          </h3>
          <p className="text-muted-foreground text-sm sm:text-lg mb-8 max-w-xl mx-auto">
            Únete a las unidades clínicas que ya confían en Synapsia para
            gestionar sus operaciones diarias.
          </p>
          <Link
            to="/synapsia/login"
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity text-sm sm:text-base"
          >
            Empezar Ahora
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 mb-8">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Brain className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold">Synapsia</span>
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-sm">
                Sistema de gestión integral para unidades clínicas. Gestión,
                Control y Planeación en una sola plataforma.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Plataforma</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-foreground transition-colors">
                    Funcionalidades
                  </a>
                </li>
                <li>
                  <Link to="/synapsia/login" className="hover:text-foreground transition-colors">
                    Iniciar Sesión
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Legal</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li>
                  <Link to="/privacy" className="hover:text-foreground transition-colors">
                    Política de Privacidad
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-foreground transition-colors">
                    Términos de Servicio
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>&copy; 2026 Synapsia. Todos los derechos reservados.</p>
            <div className="flex items-center gap-3 sm:gap-4">
              <Link to="/privacy" className="hover:underline">
                Privacidad
              </Link>
              <Link to="/terms" className="hover:underline">
                Términos
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
