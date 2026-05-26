import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, LogOut, Pill, Wallet, FileText, Users, ClipboardList, Sparkles, Wrench, HandCoins, Receipt, ShoppingBag } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";

interface HealthUnit { id: string; name: string; description: string | null; }

const APPS = [
  { key: "medicamentos", label: "Control de medicamentos", desc: "Hoja por paciente (enfermería)", icon: Pill, route: "enfermeria", ready: true },
  { key: "menus", label: "Menús semanales", desc: "Plan alimenticio y consumo", icon: ClipboardList, route: "enfermeria", ready: true },
  { key: "gastos", label: "Control de gastos", desc: "Gastos, ingresos y órdenes de pago", icon: Wallet },
  { key: "ingresos", label: "Ingresos (facturas)", desc: "Facturas de pacientes y verificación", icon: Receipt },
  { key: "nomina", label: "Nómina", desc: "Plantilla, incidencias y recibos", icon: Users },
  { key: "req-medicamentos", label: "Requisición de medicamentos", desc: "Solicitudes de insumos médicos", icon: ShoppingBag, route: "requisiciones/medicamentos", ready: true },
  { key: "req-limpieza", label: "Requisición de limpieza", desc: "Insumos de intendencia", icon: Sparkles, route: "requisiciones/limpieza", ready: true },
  { key: "req-mantenimiento", label: "Requisición de mantenimiento", desc: "Insumos de mantenimiento", icon: Wrench, route: "requisiciones/mantenimiento", ready: true },
  { key: "req-servicio", label: "Servicios de mantenimiento", desc: "Reparaciones y servicios externos", icon: Wrench, route: "requisiciones/servicio_mantenimiento", ready: true },
  { key: "pago-proveedores", label: "Pago a proveedores", desc: "Órdenes y verificación con PIN", icon: HandCoins, route: "requisiciones/pago_proveedor", ready: true },
  { key: "cobranza", label: "Cartera de clientes", desc: "Cuotas y morosos", icon: FileText },
];

export default function UnidadDetalle() {
  const { id } = useParams<{ id: string }>();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [unit, setUnit] = useState<HealthUnit | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await (supabase.from as any)("health_units").select("*").eq("id", id).maybeSingle();
      setUnit((data as any) || null);
    })();
  }, [id]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/synapsia/unidades")}><ArrowLeft className="w-4 h-4" /></Button>
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold">{unit?.name ?? "Unidad"}</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Aplicativos</h2>
          <p className="text-sm text-muted-foreground">{unit?.description}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {APPS.map(({ key, label, desc, icon: Icon, route, ready }) => (
            <Card key={key} className={ready ? "cursor-pointer hover:shadow-md transition" : "opacity-80"} onClick={() => ready && route && navigate(`/synapsia/unidades/${id}/${route}`)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Icon className="w-7 h-7 text-primary" />
                  <Badge variant={ready ? "default" : "outline"} className="text-[10px]">{ready ? "Disponible" : "Próximamente"}</Badge>
                </div>
                <CardTitle className="text-base mt-2">{label}</CardTitle>
                <CardDescription className="text-xs">{desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm" variant={ready ? "default" : "outline"} disabled={!ready}>Abrir</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
