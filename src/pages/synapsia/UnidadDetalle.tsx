import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, LogOut, Pill, Wallet, FileText, Users, ClipboardList, Sparkles, Wrench, HandCoins, Receipt, ShoppingBag, ShoppingCart, Package, ClipboardCheck } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";

interface HealthUnit { id: string; name: string; description: string | null; }

interface AppEntry {
  key: string; label: string; desc: string; icon: any; route: string;
  roles: string[];
}

const APPS: AppEntry[] = [
  { key: "medicamentos", label: "Control de medicamentos", desc: "Hoja por paciente (enfermería)", icon: Pill, route: "enfermeria", roles: ["admin", "dueno", "administrativo", "asistente_admin", "enfermera", "especialista"] },
  { key: "menus", label: "Menús semanales", desc: "Plan alimenticio y consumo", icon: ClipboardList, route: "enfermeria", roles: ["admin", "dueno", "administrativo", "asistente_admin", "enfermera", "especialista"] },
  { key: "gastos", label: "Control de gastos", desc: "Gastos, ingresos y órdenes de pago", icon: Wallet, route: "gastos", roles: ["admin", "dueno", "administrativo", "asistente_admin"] },
  { key: "ingresos", label: "Facturas de ingreso", desc: "Facturas de pacientes y verificación", icon: Receipt, route: "facturas", roles: ["admin", "dueno", "administrativo", "contador"] },
  { key: "nomina", label: "Nómina", desc: "Plantilla, periodos y pagos", icon: Users, route: "nomina", roles: ["admin", "dueno", "administrativo", "contador", "rrhh"] },
  { key: "req-medicamentos", label: "Requisición de medicamentos", desc: "Solicitudes de insumos médicos", icon: ShoppingBag, route: "requisiciones/medicamentos", roles: ["admin", "dueno", "administrativo", "asistente_admin", "enfermera", "intendencia", "mantenimiento"] },
  { key: "req-limpieza", label: "Requisición de limpieza", desc: "Insumos de intendencia", icon: Sparkles, route: "requisiciones/limpieza", roles: ["admin", "dueno", "administrativo", "asistente_admin", "enfermera", "intendencia", "mantenimiento"] },
  { key: "req-mantenimiento", label: "Requisición de mantenimiento", desc: "Insumos de mantenimiento", icon: Wrench, route: "requisiciones/mantenimiento", roles: ["admin", "dueno", "administrativo", "asistente_admin", "enfermera", "intendencia", "mantenimiento"] },
  { key: "req-servicio", label: "Servicios de mantenimiento", desc: "Reparaciones y servicios externos", icon: Wrench, route: "requisiciones/servicio_mantenimiento", roles: ["admin", "dueno", "administrativo", "asistente_admin", "enfermera", "intendencia", "mantenimiento"] },
  { key: "pago-proveedores", label: "Pago a proveedores", desc: "Órdenes y verificación con PIN", icon: HandCoins, route: "requisiciones/pago_proveedor", roles: ["admin", "dueno", "administrativo", "asistente_admin", "enfermera", "intendencia", "mantenimiento"] },
  { key: "cobranza", label: "Cartera de clientes", desc: "Cuotas y morosos", icon: FileText, route: "cartera", roles: ["admin", "dueno", "administrativo", "contador"] },
  { key: "ordenes-compra", label: "Órdenes de compra", desc: "Generar, autorizar y abastecer", icon: ShoppingCart, route: "ordenes-compra", roles: ["admin", "dueno", "administrativo", "asistente_admin"] },
  { key: "inventario", label: "Inventario de medicamentos", desc: "Stock, entradas, alertas de mínimo", icon: Package, route: "inventario", roles: ["admin", "dueno", "administrativo", "asistente_admin", "enfermera"] },
  { key: "confirmar-inventario", label: "Confirmar inventario", desc: "Conteo físico cada 3 días", icon: ClipboardCheck, route: "confirmar-inventario", roles: ["admin", "dueno", "enfermera"] },
];

export default function UnidadDetalle() {
  const { id } = useParams<{ id: string }>();
  const { user, signOut, hasRole } = useAuth();
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
          {APPS.filter(a => a.roles.some(r => hasRole(r))).map(({ key, label, desc, icon: Icon, route }) => (
            <Card key={key} className="cursor-pointer hover:shadow-md transition" onClick={() => navigate(`/synapsia/unidades/${id}/${route}`)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Icon className="w-7 h-7 text-primary" />
                  <Badge variant="default" className="text-[10px]">Disponible</Badge>
                </div>
                <CardTitle className="text-base mt-2">{label}</CardTitle>
                <CardDescription className="text-xs">{desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm">Abrir</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
