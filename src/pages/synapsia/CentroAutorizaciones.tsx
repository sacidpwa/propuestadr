import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PinPrompt from "@/components/synapsia/PinPrompt";
import { ArrowLeft, LogOut, Check, X, ClipboardList, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface HealthUnit { id: string; name: string; }
interface PendingReq { id: string; title: string; req_type: string; priority: string; total_amount: number; created_at: string; health_unit_id: string; requested_by: string; description: string | null; }
interface PendingPayroll { id: string; area: string; period_start: string; period_end: string; total_amount: number; frequency: string; health_unit_id: string; }
interface PendingInv { id: string; patient_name: string; amount: number; invoice_date: string; concept: string | null; health_unit_id: string | null; patient_id: string | null; }

const REQ_TYPE_LABEL: Record<string, string> = {
  medicamentos: "Medicamentos", limpieza: "Limpieza", mantenimiento: "Mantenimiento",
  servicio_mantenimiento: "Servicio", pago_proveedor: "Pago proveedor",
};

const REQ_PRIORITY_STYLE: Record<string, string> = {
  baja: "bg-gray-500/10 text-gray-700", media: "bg-blue-500/10 text-blue-700",
  alta: "bg-orange-500/10 text-orange-700", urgente: "bg-red-500/10 text-red-700",
};

export default function CentroAutorizaciones() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [units, setUnits] = useState<HealthUnit[]>([]);
  const [pendingReqs, setPendingReqs] = useState<PendingReq[]>([]);
  const [pendingPayroll, setPendingPayroll] = useState<PendingPayroll[]>([]);
  const [pendingInv, setPendingInv] = useState<PendingInv[]>([]);
  const [verifiedByIds, setVerifiedByIds] = useState<Record<string, string>>({});
  const [pinOpen, setPinOpen] = useState(false);
  const [pinAction, setPinAction] = useState<() => Promise<void>>(() => async () => {});
  const [pinTitle, setPinTitle] = useState("");
  const [tab, setTab] = useState("requisiciones");

  useEffect(() => {
    (async () => {
      const { data: u } = await (supabase.from as any)("health_units").select("id,name").order("name");
      setUnits((u as any) || []);
    })();
  }, []);

  const loadAll = async () => {
    const [{ data: reqs }, { data: payroll }, { data: inv }] = await Promise.all([
      (supabase.from as any)("requisitions").select("*").eq("status", "pendiente").order("priority", { ascending: false }).order("created_at", { ascending: false }),
      (supabase.from as any)("payroll_runs").select("*").eq("status", "borrador").order("period_end", { ascending: false }),
      (supabase.from as any)("patient_invoices").select("*").eq("status", "pendiente").order("invoice_date", { ascending: false }),
    ]);
    setPendingReqs((reqs as any) || []);
    setPendingPayroll((payroll as any) || []);
    setPendingInv((inv as any) || []);
  };

  useEffect(() => { loadAll(); }, []);

  function askPin(title: string, action: () => Promise<void>) {
    setPinTitle(title);
    setPinAction(() => action);
    setPinOpen(true);
  }

  const unitName = (id: string) => units.find(u => u.id === id)?.name || "—";

  async function authorizeReq(req: PendingReq) {
    const { error } = await (supabase.from as any)("requisitions").update({
      status: "autorizada", authorized_by: user!.id, authorized_at: new Date().toISOString(),
    }).eq("id", req.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    await (supabase.from as any)("audit_log").insert({
      entity: "requisitions", entity_id: req.id, action: "autorizada", user_id: user!.id,
      metadata: { authorized_by: user!.id },
    });
    toast({ title: "Requisición autorizada" });
    loadAll();
  }

  async function rejectReq(req: PendingReq) {
    const reason = window.prompt("Motivo del rechazo:") || "";
    if (!reason) return;
    const { error } = await (supabase.from as any)("requisitions").update({
      status: "rechazada", rejected_reason: reason, authorized_by: user!.id, authorized_at: new Date().toISOString(),
    }).eq("id", req.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    await (supabase.from as any)("audit_log").insert({
      entity: "requisitions", entity_id: req.id, action: "rechazada", user_id: user!.id,
      metadata: { reason },
    });
    toast({ title: "Requisición rechazada" });
    loadAll();
  }

  async function authorizePayroll(run: PendingPayroll) {
    const { error } = await (supabase.from as any)("payroll_runs").update({
      status: "autorizada", authorized_by: user!.id, authorized_at: new Date().toISOString(),
    }).eq("id", run.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Nómina autorizada" });
    loadAll();
  }

  async function verifyInvoice(inv: PendingInv, status: "verificada" | "erronea") {
    let error_reason: string | null = null;
    if (status === "erronea") {
      error_reason = window.prompt("Describe el error:") || "";
      if (!error_reason) return;
    }
    const { error } = await (supabase.from as any)("patient_invoices").update({
      status, verified_by: user!.id, verified_at: new Date().toISOString(), error_reason,
    }).eq("id", inv.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: status === "verificada" ? "Factura verificada" : "Factura marcada con error" });
    loadAll();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/synapsia")}><ArrowLeft className="w-4 h-4" /></Button>
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold">Centro de Autorizaciones</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="requisiciones" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              Requisiciones {pendingReqs.length > 0 && <Badge className="ml-1">{pendingReqs.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="nomina" className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Nómina {pendingPayroll.length > 0 && <Badge className="ml-1">{pendingPayroll.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="facturas" className="gap-2">
              <FileText className="w-4 h-4" />
              Facturas {pendingInv.length > 0 && <Badge className="ml-1">{pendingInv.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requisiciones" className="space-y-3 mt-4">
            {pendingReqs.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No hay requisiciones pendientes.</CardContent></Card>
            ) : pendingReqs.map(r => (
              <Card key={r.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">pendiente</Badge>
                        <Badge variant="secondary" className={`capitalize ${REQ_PRIORITY_STYLE[r.priority]}`}>{r.priority}</Badge>
                        <span className="text-xs text-muted-foreground">{REQ_TYPE_LABEL[r.req_type] || r.req_type}</span>
                        <span className="text-xs text-muted-foreground">· {unitName(r.health_unit_id)}</span>
                      </div>
                      <p className="font-medium mt-1">{r.title}</p>
                      {r.description && <p className="text-sm text-muted-foreground truncate">{r.description}</p>}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{format(new Date(r.created_at), "PP", { locale: es })}</span>
                        <span className="font-mono">${Number(r.total_amount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" onClick={() => askPin("Autorizar requisición", () => authorizeReq(r))}>
                        <Check className="w-4 h-4 mr-1" /> Autorizar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => askPin("Rechazar requisición", () => rejectReq(r))}>
                        <X className="w-4 h-4 mr-1" /> Rechazar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="nomina" className="space-y-3 mt-4">
            {pendingPayroll.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No hay nóminas pendientes.</CardContent></Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Área</TableHead>
                        <TableHead>Periodo</TableHead>
                        <TableHead>Frecuencia</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPayroll.map(r => (
                        <TableRow key={r.id}>
                          <TableCell>{unitName(r.health_unit_id)}</TableCell>
                          <TableCell className="capitalize">{r.area}</TableCell>
                          <TableCell className="text-xs">{r.period_start} — {r.period_end}</TableCell>
                          <TableCell className="capitalize text-xs">{r.frequency}</TableCell>
                          <TableCell className="text-right font-mono">${Number(r.total_amount).toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" onClick={() => askPin("Autorizar nómina", () => authorizePayroll(r))}>
                              <Check className="w-4 h-4 mr-1" /> Autorizar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="facturas" className="space-y-3 mt-4">
            {pendingInv.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No hay facturas pendientes.</CardContent></Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead className="text-right">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingInv.map(f => (
                        <TableRow key={f.id}>
                          <TableCell className="font-medium">
                            <button
                              className="underline text-left hover:text-primary"
                              onClick={() => {
                                if (f.health_unit_id) {
                                  navigate(`/synapsia/unidades/${f.health_unit_id}/paciente/${f.patient_id}?tab=nota-venta`);
                                }
                              }}
                            >
                              {f.patient_name}
                            </button>
                          </TableCell>
                          <TableCell>{f.health_unit_id ? unitName(f.health_unit_id) : "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{f.concept || "—"}</TableCell>
                          <TableCell className="text-xs">{format(new Date(f.invoice_date), "dd/MM/yyyy", { locale: es })}</TableCell>
                          <TableCell className="text-right font-mono">${Number(f.amount).toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button size="sm" onClick={() => askPin("Verificar factura", () => verifyInvoice(f, "verificada"))}>
                                <Check className="w-4 h-4 mr-1" /> Verificar
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => askPin("Marcar error en factura", () => verifyInvoice(f, "erronea"))}>
                                <X className="w-4 h-4 mr-1" /> Error
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <PinPrompt open={pinOpen} onOpenChange={setPinOpen} title={pinTitle} onConfirm={pinAction} />
    </div>
  );
}
