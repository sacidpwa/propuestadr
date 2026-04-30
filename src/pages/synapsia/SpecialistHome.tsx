import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Calendar, FileText, LogOut, Users } from "lucide-react";

export default function SpecialistHome() {
  const { user, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Synapsia · Especialista</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bienvenido</h2>
          <p className="text-sm text-muted-foreground mt-1">Gestiona tu agenda, pacientes y expedientes.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Tool to="/synapsia/calendar" icon={<Calendar className="w-6 h-6 text-primary" />} title="Mi agenda" desc="Visualiza y agenda tus consultas." />
          <Tool to="/synapsia/patients" icon={<Users className="w-6 h-6 text-primary" />} title="Pacientes" desc="Registra pacientes y abre expedientes." />
          <Tool to="/synapsia/records" icon={<FileText className="w-6 h-6 text-primary" />} title="Expedientes" desc="Consulta y agrega notas de evolución." />
        </div>
      </main>
    </div>
  );
}

function Tool({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to} className="group">
      <Card className="h-full transition-all hover:shadow-md hover:border-primary/40">
        <CardHeader>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">{icon}</div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{desc}</CardDescription>
        </CardHeader>
        <CardContent><Button variant="outline" size="sm" className="w-full">Abrir</Button></CardContent>
      </Card>
    </Link>
  );
}
