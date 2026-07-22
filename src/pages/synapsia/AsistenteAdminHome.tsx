import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut, ClipboardList, ShoppingCart, HandCoins, Package, AlertTriangle, Building2, ArrowRight, ShoppingBag, Sparkles, Wrench, Pill } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";

interface Req {
  id: string; title: string; total_amount: number; status: string; priority: string;
  created_at: string; req_type: string; health_unit_id: string; vendor_name?: string;
}

interface Unit { id: string; name: string; }

interface PO { id: string; vendor_name: string; total_amount: number; status: string; created_at: string; health_unit_id: string; }

interface InvAlert { id: string; medication_name: string; current_stock: number; min_stock: number; unit: string; health_unit_id: string; }

const REQ_TYPE_MAP: Record<string, string> = {
  medicamentos: "Medicamentos", limpieza: "Limpieza", mantenimiento: "Mantenimiento",
  servicio_mantenimiento: "Servicio", pago_proveedor: "Pago proveedor",
};

const STATUS_STYLE: Record<string, string> = {
  pendiente: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
  autorizada: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  comprada: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  abastecida: "bg-green-600/10 text-green-700 border-green-600/30",
  pagada: "bg-indigo-500/10 text-indigo-700 border-indigo-500/30",
};

export default function AsistenteAdminHome() {
  const { signOut, user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [units, setUnits] = useState<Unit[]>([]);
  const [pendingReqs, setPendingReqs] = useState<Req[]>([]);
  const [pendingPos, setPendingPos] = useState<PO[]>([]);
  const [pendingPays, setPendingPays] = useState<Req[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<InvAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const medReqs = useMemo(() => pendingReqs.filter(r => r.req_type === "medicamentos"), [pendingReqs]);
  const limpiezaReqs = useMemo(() => pendingReqs.filter(r => r.req_type === "limpieza"), [pendingReqs]);
  const mantenimientoReqs = useMemo(() => pendingReqs.filter(r => r.req_type === "mantenimiento" || r.req_type === "servicio_mantenimiento"), [pendingReqs]);

  useEffect(() => {
    if (!hasRole("asistente_admin") && !hasRole("admin") && !hasRole("dueno")) {
      navigate("/synapsia/unidades");
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const { data: u } = await supabase.from("health_units").select("id, name");
      const unitList = (u || []) as Unit[];
      setUnits(unitList);
      const unitIds = unitList.map((x) => x.id);

      if (unitIds.length === 0) return;

      const [reqRes, poRes, payRes, invRes] = await Promise.all([
        supabase.from("requisitions").select("*").in("health_unit_id", unitIds).in("status", ["pendiente", "autorizada"]).order("created_at", { ascending: false }),
        supabase.from("purchase_orders").select("*").in("health_unit_id", unitIds).in("status", ["pendiente", "autorizada", "comprada"]).order("created_at", { ascending: false }),
        supabase.from("requisitions").select("*").in("health_unit_id", unitIds).eq("req_type", "pago_proveedor").in("status", ["pendiente", "autorizada", "pagada"]).order("created_at", { ascending: false }),
        supabase.from("medication_inventory").select("*").in("health_unit_id", unitIds).order("medication_name"),
      ]);

      setPendingReqs((reqRes.data || []) as Req[]);
      setPendingPos((poRes.data || []) as PO[]);
      setPendingPays((payRes.data || []) as Req[]);

      const inv = (invRes.data || []) as InvAlert[];
      setLowStockAlerts(inv.filter((i) => i.current_stock <= i.min_stock));
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function unitName(id: string) {
    return units.find((u) => u.id === id)?.name ?? id.slice(0, 8);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={synapsiaIcon} alt="" className="w-10 h-10" />
            <div>
              <h1 className="text-lg font-bold">Synapsia · Asistencia administrativa</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/synapsia/unidades")}>
              <Building2 className="w-4 h-4 mr-1" /> Unidades
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Panel de trabajo</h2>
          <p className="text-sm text-muted-foreground mt-1">Requisiciones, compras, pagos e inventario en todas las unidades.</p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<ClipboardList className="w-5 h-5 text-yellow-600" />} label="Requisiciones pendientes" value={pendingReqs.length} />
              <StatCard icon={<ShoppingCart className="w-5 h-5 text-blue-600" />} label="Órdenes de compra activas" value={pendingPos.length} />
              <StatCard icon={<HandCoins className="w-5 h-5 text-indigo-600" />} label="Pagos pendientes" value={pendingPays.filter((p) => p.status === "autorizada" || p.status === "pendiente").length} />
              <StatCard icon={<AlertTriangle className="w-5 h-5 text-red-600" />} label="Alertas de inventario" value={lowStockAlerts.length} />
            </div>

            {pendingReqs.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-yellow-600" />
                    <CardTitle className="text-base">Requisiciones pendientes</CardTitle>
                  </div>
                  <Badge variant="outline">{pendingReqs.length} pendientes</Badge>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingReqs.slice(0, 10).map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-xs">{unitName(r.health_unit_id)}</TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">{r.title}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-[10px]">{REQ_TYPE_MAP[r.req_type] || r.req_type}</Badge></TableCell>
                          <TableCell>${(r.total_amount || 0).toLocaleString()}</TableCell>
                          <TableCell><Badge className={`text-[10px] ${STATUS_STYLE[r.status] || ""}`} variant="outline">{r.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/synapsia/unidades/${r.health_unit_id}/ordenes-compra?req_id=${r.id}`)}>
                              <ShoppingCart className="w-3 h-3 mr-1" /> OC
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {limpiezaReqs.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-green-600" />
                    <CardTitle className="text-base">Requisiciones de limpieza</CardTitle>
                  </div>
                  <Badge variant="outline">{limpiezaReqs.length} pendientes</Badge>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {limpiezaReqs.slice(0, 10).map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-xs">{unitName(r.health_unit_id)}</TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">{r.title}</TableCell>
                          <TableCell>${(r.total_amount || 0).toLocaleString()}</TableCell>
                          <TableCell><Badge className={`text-[10px] ${STATUS_STYLE[r.status] || ""}`} variant="outline">{r.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/synapsia/unidades/${r.health_unit_id}/ordenes-compra?req_id=${r.id}`)}>
                              <ShoppingCart className="w-3 h-3 mr-1" /> OC
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {mantenimientoReqs.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-orange-600" />
                    <CardTitle className="text-base">Requisiciones de mantenimiento</CardTitle>
                  </div>
                  <Badge variant="outline">{mantenimientoReqs.length} pendientes</Badge>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mantenimientoReqs.slice(0, 10).map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-xs">{unitName(r.health_unit_id)}</TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">{r.title}</TableCell>
                          <TableCell>${(r.total_amount || 0).toLocaleString()}</TableCell>
                          <TableCell><Badge className={`text-[10px] ${STATUS_STYLE[r.status] || ""}`} variant="outline">{r.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/synapsia/unidades/${r.health_unit_id}/ordenes-compra?req_id=${r.id}`)}>
                              <ShoppingCart className="w-3 h-3 mr-1" /> OC
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {pendingPays.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HandCoins className="w-5 h-5 text-indigo-600" />
                    <CardTitle className="text-base">Órdenes de pago</CardTitle>
                  </div>
                  <Badge variant="outline">{pendingPays.filter((p) => p.status === "pendiente").length} sin procesar</Badge>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPays.slice(0, 10).map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-xs">{unitName(r.health_unit_id)}</TableCell>
                          <TableCell className="font-medium">{r.vendor_name || r.title}</TableCell>
                          <TableCell>${(r.total_amount || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] ${STATUS_STYLE[r.status] || ""}`} variant="outline">
                              {r.status === "pagada" ? "Pagada (Esther)" : r.status === "autorizada" ? "Autorizada" : "Pendiente"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {lowStockAlerts.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-red-600" />
                    <CardTitle className="text-base">Inventario — Alertas de stock mínimo</CardTitle>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/synapsia/unidades/${lowStockAlerts[0]?.health_unit_id}/inventario`)}>
                    <ArrowRight className="w-3 h-3 mr-1" /> Ir a inventario
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Medicamento</TableHead>
                        <TableHead>Stock actual</TableHead>
                        <TableHead>Stock mínimo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockAlerts.slice(0, 10).map((i) => (
                        <TableRow key={i.id}>
                          <TableCell className="text-xs">{unitName(i.health_unit_id)}</TableCell>
                          <TableCell className="font-medium">{i.medication_name}</TableCell>
                          <TableCell className="text-red-600 font-medium">{i.current_stock} {i.unit}</TableCell>
                          <TableCell>{i.min_stock} {i.unit}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {pendingReqs.length === 0 && pendingPays.length === 0 && lowStockAlerts.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No hay tareas pendientes. Todo está al día.</p>
                </CardContent>
              </Card>
            )}

            {units.length > 1 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Unidades de salud</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {units.map(u => (
                    <Card key={u.id} className="cursor-pointer hover:shadow-md transition" onClick={() => navigate(`/synapsia/unidades/${u.id}`)}>
                      <CardContent className="py-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-medium">{u.name}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}


