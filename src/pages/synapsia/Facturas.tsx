import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import PinPrompt from "@/components/synapsia/PinPrompt";
import { ArrowLeft, LogOut, Plus, Paperclip, Check, AlertTriangle } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { toast } from "@/hooks/use-toast";
import { fmt } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Invoice {
  id: string; patient_name: string; invoice_number: string | null; invoice_date: string;
  amount: number; concept: string | null; file_url: string | null; status: string;
  error_reason: string | null; uploaded_by: string; verified_by: string | null; verified_at: string | null;
}

const STATUS_STYLE: Record<string, string> = {
  pendiente: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
  verificada: "bg-green-500/10 text-green-700 border-green-500/30",
  erronea: "bg-red-500/10 text-red-700 border-red-500/30",
  cancelada: "bg-muted text-muted-foreground border-border",
};

export default function Facturas() {
  const { id: unitId } = useParams<{ id: string }>();
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const [unitName, setUnitName] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState("pendiente");
  const [open, setOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinAction, setPinAction] = useState<() => Promise<void>>(() => async () => {});
  const [pinTitle, setPinTitle] = useState("");
  const [form, setForm] = useState({ patient_name: "", invoice_number: "", invoice_date: new Date().toISOString().slice(0, 10), amount: 0, concept: "", file: undefined as File | undefined });

  const canUpload = hasRole("admin") || hasRole("dueno") || hasRole("contador");
  const canVerify = hasRole("admin") || hasRole("dueno") || hasRole("administrativo");

  useEffect(() => {
    if (!unitId) return;
    (async () => {
      const { data: u } = await (supabase.from as any)("health_units").select("name").eq("id", unitId).maybeSingle();
      setUnitName((u as any)?.name ?? "");
    })();
  }, [unitId]);

  async function load() {
    if (!unitId) return;
    let q = (supabase.from as any)("patient_invoices").select("*").eq("health_unit_id", unitId).order("invoice_date", { ascending: false });
    if (filter !== "todas") q = q.eq("status", filter);
    const { data } = await q;
    setInvoices((data as any) || []);
  }
  useEffect(() => { load(); }, [unitId, filter]);

  const totals = useMemo(() => {
    const p = invoices.filter(i => i.status === "pendiente").reduce((s, i) => s + Number(i.amount), 0);
    const v = invoices.filter(i => i.status === "verificada").reduce((s, i) => s + Number(i.amount), 0);
    const e = invoices.filter(i => i.status === "erronea").reduce((s, i) => s + Number(i.amount), 0);
    return { p, v, e };
  }, [invoices]);

  async function save() {
    if (!unitId || !user) return;
    if (!form.patient_name.trim() || !form.amount) { toast({ title: "Faltan datos", variant: "destructive" }); return; }
    let path: string | null = null;
    if (form.file) {
      const p = `${user.id}/${Date.now()}-${form.file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error } = await supabase.storage.from("receipts").upload(p, form.file);
      if (error) { toast({ title: "Error subiendo archivo", description: error.message, variant: "destructive" }); return; }
      path = p;
    }
    const { error } = await (supabase.from as any)("patient_invoices").insert({
      health_unit_id: unitId, patient_name: form.patient_name, invoice_number: form.invoice_number || null,
      invoice_date: form.invoice_date, amount: form.amount, concept: form.concept || null,
      file_url: path, uploaded_by: user.id,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Factura subida" });
    setOpen(false);
    setForm({ patient_name: "", invoice_number: "", invoice_date: new Date().toISOString().slice(0, 10), amount: 0, concept: "", file: undefined });
    load();
  }

  async function verify(inv: Invoice, status: "verificada" | "erronea", error_reason?: string) {
    const { error } = await (supabase.from as any)("patient_invoices").update({
      status, error_reason: error_reason || null, verified_by: user!.id, verified_at: new Date().toISOString(),
    }).eq("id", inv.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    await (supabase.from as any)("audit_log").insert({ entity: "patient_invoices", entity_id: inv.id, action: status, user_id: user!.id, metadata: { error_reason } });
    toast({ title: `Factura ${status}` });
    load();
  }

  function askPin(title: string, action: () => Promise<void>) { setPinTitle(title); setPinAction(() => action); setPinOpen(true); }

  async function viewFile(path: string) {
    const { data } = await supabase.storage.from("receipts").createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/synapsia/unidades/${unitId}`)}><ArrowLeft className="w-4 h-4" /></Button>
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold">Facturas de ingreso — {unitName}</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Pendientes</p><p className="text-xl font-bold text-yellow-700">{fmt(totals.p)}</p></CardContent></Card>
          <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Verificadas</p><p className="text-xl font-bold text-green-700">{fmt(totals.v)}</p></CardContent></Card>
          <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Erróneas</p><p className="text-xl font-bold text-red-700">{fmt(totals.e)}</p></CardContent></Card>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              {["pendiente", "verificada", "erronea", "todas"].map(s => <TabsTrigger key={s} value={s} className="capitalize">{s}</TabsTrigger>)}
            </TabsList>
          </Tabs>
          {canUpload && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" /> Subir factura</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nueva factura</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Paciente</Label><Input value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Folio</Label><Input value={form.invoice_number} onChange={e => setForm({ ...form, invoice_number: e.target.value })} /></div>
                    <div><Label>Fecha</Label><Input type="date" value={form.invoice_date} onChange={e => setForm({ ...form, invoice_date: e.target.value })} /></div>
                  </div>
                  <div><Label>Monto</Label><Input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} /></div>
                  <div><Label>Concepto</Label><Textarea rows={2} value={form.concept} onChange={e => setForm({ ...form, concept: e.target.value })} /></div>
                  <div><Label>Archivo PDF/XML</Label><Input type="file" accept=".pdf,.xml,image/*" onChange={e => setForm({ ...form, file: e.target.files?.[0] })} /></div>
                </div>
                <DialogFooter><Button onClick={save}>Guardar</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="space-y-2">
          {invoices.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">Sin facturas.</CardContent></Card>}
          {invoices.map(inv => (
            <Card key={inv.id}>
              <CardContent className="py-3 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`capitalize ${STATUS_STYLE[inv.status]}`}>{inv.status}</Badge>
                    <span className="text-xs text-muted-foreground">{format(new Date(inv.invoice_date), "PP", { locale: es })}</span>
                    {inv.invoice_number && <span className="text-xs text-muted-foreground">· Folio {inv.invoice_number}</span>}
                  </div>
                  <p className="font-medium mt-1">{inv.patient_name}</p>
                  {inv.concept && <p className="text-xs text-muted-foreground">{inv.concept}</p>}
                  {inv.status === "erronea" && inv.error_reason && (
                    <p className="text-xs text-red-700 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {inv.error_reason}</p>
                  )}
                </div>
                <div className="text-right space-y-1">
                  <p className="font-bold">{fmt(Number(inv.amount))}</p>
                  <div className="flex gap-1 justify-end">
                    {inv.file_url && <Button size="icon" variant="ghost" onClick={() => viewFile(inv.file_url!)}><Paperclip className="w-4 h-4" /></Button>}
                    {canVerify && inv.status === "pendiente" && (
                      <>
                        <Button size="sm" onClick={() => askPin("Verificar factura", async () => verify(inv, "verificada"))}><Check className="w-4 h-4 mr-1" /> Verificar</Button>
                        <Button size="sm" variant="destructive" onClick={() => {
                          const r = window.prompt("Motivo del error:") || "";
                          if (!r) return;
                          askPin("Marcar como errónea", async () => verify(inv, "erronea", r));
                        }}>Errónea</Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <PinPrompt open={pinOpen} onOpenChange={setPinOpen} title={pinTitle} onConfirm={pinAction} />
    </div>
  );
}
