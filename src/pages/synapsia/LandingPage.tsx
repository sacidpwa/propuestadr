import { Link } from "react-router-dom";
import { Brain } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold">Synapsia</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Sistema de Gestión Clínica</p>
            </div>
          </div>
          <Link to="/synapsia/login" className="px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs sm:text-sm font-medium hover:opacity-90">
            Iniciar Sesión
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 text-center space-y-6 sm:space-y-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary mx-auto flex items-center justify-center">
            <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">Sistema de Gestión Clínica</h2>
          <p className="text-muted-foreground text-sm sm:text-lg max-w-xl mx-auto">
            Gestión, Control y Planeación para unidades clínicas. Administra pacientes, citas, inventario, nómina y más desde una sola plataforma.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto text-sm">
            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-semibold mb-1">Pacientes</h3>
              <p className="text-muted-foreground text-xs">Gestión completa de pacientes y expedientes clínicos</p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-semibold mb-1">Agenda</h3>
              <p className="text-muted-foreground text-xs">Programación de citas con sincronización a Google Calendar</p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-semibold mb-1">Administración</h3>
              <p className="text-muted-foreground text-xs">Inventario, nómina, facturación y reportes</p>
            </div>
          </div>
          <Link to="/synapsia/login" className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90">
            Comenzar
          </Link>
        </div>
      </main>

      <footer className="border-t py-4 sm:py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 text-xs text-muted-foreground">
          <p>&copy; 2026 Synapsia. Todos los derechos reservados.</p>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/privacy" className="hover:underline">Política de Privacidad</Link>
            <Link to="/terms" className="hover:underline">Términos de Servicio</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
