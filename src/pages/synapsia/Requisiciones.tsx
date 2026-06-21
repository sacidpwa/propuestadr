import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import PinPrompt from "@/components/synapsia/PinPrompt";
import { ArrowLeft, LogOut, Plus, Trash2, Image as ImageIcon, Check, X, ShoppingCart, CreditCard } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { toast } from "@/hooks/use-toast";
import { fmt } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Req {
  id: string; req_type: string; title: string; description: string | null; vendor_name: string | null;
  priority: string; status: string; total_amount: number; payment_method: string | null;
  requested_by: string; authorized_by: string | null; created_at: string;
  health_unit_id: string;
}
interface Item { id: string; description: string; quantity: number; unit: string | null; unit_price: number; image_path: string | null; status: string; patient_name: string | null; daily_dose: number | null; delivered: boolean; notes: string | null; requires_prescription: boolean; suggested_pharmacy: string | null; suggested_pharmacy_price: number | null; }

const TYPE_MAP: Record<string, { label: string; pageType: string }> = {
  medicamentos: { label: "Medicamentos", pageType: "med" },
  limpieza: { label: "Limpieza", pageType: "lim" },
  mantenimiento: { label: "Mantenimiento (insumos)", pageType: "man" },
  servicio_mantenimiento: { label: "Servicio de mantenimiento", pageType: "srv" },
  pago_proveedor: { label: "Pago a proveedor", pageType: "pag" },
};

const STATUS_STYLE: Record<string, string> = {
  pendiente: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
  autorizada: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  rechazada: "bg-red-500/10 text-red-700 border-red-500/30",
  comprada: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  pagada: "bg-green-600/10 text-green-700 border-green-600/30",
  cancelada: "bg-muted text-muted-foreground border-border",
};

export default function Requisiciones() {
  const { id: unitId, type: typeKey } = useParams<{ id: string; type: string }>();
  const reqType = useMemo(() => {
    const entry = Object.entries(TYPE_MAP).find(([k]) => k === typeKey);
    return entry ? entry[0] : "medicamentos";
  }, [typeKey]);
  const typeLabel = TYPE_MAP[reqType]?.label ?? "Requisiciones";

  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const [unitName, setUnitName] = useState("");
  const [reqs, setReqs] = useState<Req[]>([]);
  const [filter, setFilter] = useState<string>("pendiente");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Req | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinAction, setPinAction] = useState<() => Promise<void>>(() => async () => {});
  const [pinTitle, setPinTitle] = useState("");

  const isManager = hasRole("admin") || hasRole("dueno") || hasRole("administrativo") || hasRole("asistente_admin");
  const canCreate = hasRole("enfermera") || hasRole("intendencia") || hasRole("mantenimiento") || isManager;

  const [form, setForm] = useState({ title: "", description: "", vendor_name: "", priority: "media" });
  const [newItems, setNewItems] = useState<Array<{
    description: string; quantity: number; unit: string; unit_price: number; file?: File;
    patient_name?: string; daily_dose?: number; delivered?: boolean; notes?: string;
    requires_prescription?: boolean; suggested_pharmacy?: string; suggested_pharmacy_price?: number;
  }>>([{ description: "", quantity: 1, unit: "", unit_price: 0, patient_name: "", daily_dose: 0, delivered: false, notes: "", requires_prescription: false, suggested_pharmacy: "", suggested_pharmacy_price: 0 }]);

  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [pastMeds, setPastMeds] = useState<string[]>([]);

  useEffect(() => {
    if (!unitId || reqType !== "medicamentos") return;
    (async () => {
      const { data: inv } = await (supabase.from as any)("medication_inventory").select("medication_name, current_stock").eq("health_unit_id", unitId);
      const map: Record<string, number> = {};
      (inv || []).forEach((r: any) => { map[r.medication_name] = r.current_stock; });
      setInventory(map);

      const { data: poItems } = await (supabase.from as any)("purchase_order_items")
        .select("medication_name")
        .in("purchase_order_id", (await (supabase.from as any)("purchase_orders").select("id").eq("health_unit_id", unitId)).data?.map((p: any) => p.id) || []);
      const names = [...new Set((poItems || []).map((r: any) => r.medication_name).filter(Boolean))] as string[];
      setPastMeds(names.sort());
    })();
  }, [unitId, reqType]);

  useEffect(() => {
    if (!unitId) return;
    (async () => {
      const { data: u } = await (supabase.from as any)("health_units").select("name").eq("id", unitId).maybeSingle();
      setUnitName((u as any)?.name ?? "");
    })();
  }, [unitId]);

  async function load() {
    if (!unitId) return;
    let q = (supabase.from as any)("requisitions").select("*").eq("health_unit_id", unitId).eq("req_type", reqType).order("created_at", { ascending: false });
    if (filter !== "todas") q = q.eq("status", filter);
    const { data } = await q;
    setReqs((data as any) || []);
  }

  useEffect(() => { load(); }, [unitId, reqType, filter]);

  async function openDetail(r: Req) {
    setEditing(r);
    const { data } = await (supabase.from as any)("requisition_items").select("*").eq("requisition_id", r.id).order("created_at");
    setItems((data as any) || []);
  }

  async function uploadImage(file: File): Promise<string | null> {
    const path = `${user!.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const { error } = await supabase.storage.from("requisitions").upload(path, file);
    if (error) { toast({ title: "Error al subir imagen", description: error.message, variant: "destructive" }); return null; }
    return path;
  }

  async function createReq() {
    if (!unitId || !user) return;
    if (!form.title.trim()) { toast({ title: "Falta título", variant: "destructive" }); return; }
    const total = newItems.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);
    const { data: created, error } = await (supabase.from as any)("requisitions").insert({
      health_unit_id: unitId, req_type: reqType, title: form.title, description: form.description || null,
      vendor_name: form.vendor_name || null, priority: form.priority, requested_by: user.id, total_amount: total,
    }).select().single();
    if (error || !created) { toast({ title: "Error", description: error?.message, variant: "destructive" }); return; }

    for (const it of newItems) {
      if (!it.description.trim()) continue;
      let img: string | null = null;
      if (it.file) img = await uploadImage(it.file);
      await (supabase.from as any)("requisition_items").insert({
        requisition_id: created.id, description: it.description, quantity: it.quantity, unit: it.unit || null, unit_price: it.unit_price, image_path: img,
        patient_name: it.patient_name || null, daily_dose: it.daily_dose || null, delivered: it.delivered || false, notes: it.notes || null,
        requires_prescription: it.requires_prescription || false, suggested_pharmacy: it.suggested_pharmacy || null, suggested_pharmacy_price: it.suggested_pharmacy_price || null,
      });
    }
    toast({ title: "Requisición creada" });
    setOpen(false);
    setForm({ title: "", description: "", vendor_name: "", priority: "media" });
    setNewItems([{ description: "", quantity: 1, unit: "", unit_price: 0, patient_name: "", daily_dose: 0, delivered: false, notes: "" }]);
    load();
  }

  async function changeStatus(r: Req, status: string, extra: Record<string, any> = {}) {
    const { error } = await (supabase.from as any)("requisitions").update({
      status, ...extra,
    }).eq("id", r.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    await (supabase.from as any)("audit_log").insert({ entity: "requisitions", entity_id: r.id, action: status, user_id: user!.id, metadata: extra });
    toast({ title: `Marcada como ${status}` });
    setEditing(null);
    load();
  }

  function askPin(title: string, action: () => Promise<void>) {
    setPinTitle(title);
    setPinAction(() => action);
    setPinOpen(true);
  }

  async function getSignedUrl(path: string) {
    const { data } = await supabase.storage.from("requisitions").createSignedUrl(path, 3600);
    return data?.signedUrl;
  }

  const STATUSES = ["pendiente", "autorizada", "comprada", "pagada", "rechazada", "todas"];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/synapsia/unidades/${unitId}`)}><ArrowLeft className="w-4 h-4" /></Button>
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold">{typeLabel} — {unitName}</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              {STATUSES.map(s => <TabsTrigger key={s} value={s} className="capitalize">{s}</TabsTrigger>)}
            </TabsList>
          </Tabs>
          {canCreate && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" /> Nueva requisición</Button></DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Nueva {typeLabel.toLowerCase()}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><Label>Título</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                    <div className="col-span-2"><Label>Descripción</Label><Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                    {(reqType === "pago_proveedor" || reqType === "servicio_mantenimiento") && (
                      <div className="col-span-2"><Label>Proveedor</Label><Input value={form.vendor_name} onChange={e => setForm({ ...form, vendor_name: e.target.value })} /></div>
                    )}
                    <div>
                      <Label>Prioridad</Label>
                      <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["baja", "media", "alta", "urgente"].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2 border-t pt-3">
                    <div className="flex items-center justify-between">
                      <Label>Items</Label>
                      <Button type="button" size="sm" variant="outline" onClick={() => setNewItems([...newItems, { description: "", quantity: 1, unit: "", unit_price: 0, patient_name: "", daily_dose: 0, delivered: false, notes: "", requires_prescription: false, suggested_pharmacy: "", suggested_pharmacy_price: 0 }])}><Plus className="w-3 h-3 mr-1" /> Agregar</Button>
                    </div>
                    {newItems.map((it, idx) => (
                      <div key={idx} className="space-y-2 border rounded p-3">
                        {reqType === "medicamentos" ? (
                          <>
                            <div className="grid grid-cols-12 gap-2 items-end">
                              <div className="col-span-4">
                                <Label className="text-xs">Medicamento</Label>
                                <Input list="pastMeds" value={it.description} onChange={e => { const c = [...newItems]; c[idx].description = e.target.value; setNewItems(c); }} />
                                <datalist id="pastMeds">{pastMeds.map(m => <option key={m} value={m} />)}</datalist>
                              </div>
                              <div className="col-span-2">
                                <Label className="text-xs">Paciente</Label>
                                <Input value={it.patient_name} onChange={e => { const c = [...newItems]; c[idx].patient_name = e.target.value; setNewItems(c); }} />
                              </div>
                              <div className="col-span-1">
                                <Label className="text-xs">Dosis/día</Label>
                                <Input type="number" min="0" step="0.01" value={it.daily_dose} onChange={e => { const c = [...newItems]; c[idx].daily_dose = parseFloat(e.target.value) || 0; setNewItems(c); }} />
                              </div>
                              <div className="col-span-2">
                                <Label className="text-xs">Cantidad</Label>
                                <Input type="number" min="0" step="0.01" value={it.quantity} onChange={e => { const c = [...newItems]; c[idx].quantity = parseFloat(e.target.value) || 0; setNewItems(c); }} />
                              </div>
                              <div className="col-span-1">
                                <Label className="text-xs">Unidad</Label>
                                <Select value={it.unit} onValueChange={v => { const c = [...newItems]; c[idx].unit = v; setNewItems(c); }}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {["pza", "tableta", "cápsula", "ampula", "frasco", "gotas", "ml", "kg", "caja", "blister", "tubo"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="col-span-1">
                                <Label className="text-xs">P. unit.</Label>
                                <Input type="number" min="0" step="0.01" value={it.unit_price} onChange={e => { const c = [...newItems]; c[idx].unit_price = parseFloat(e.target.value) || 0; setNewItems(c); }} />
                              </div>
                              <div className="col-span-1">
                                <Label className="text-xs">Stock</Label>
                                <div className="h-9 flex items-center text-sm font-medium">
                                  {inventory[it.description] !== undefined ? (
                                    <span className={inventory[it.description] <= 0 ? "text-red-600" : "text-green-700"}>
                                      {inventory[it.description]} {it.unit || "uds"}
                                    </span>
                                  ) : <span className="text-muted-foreground">—</span>}
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 items-end">
                              <div className="col-span-1 flex items-end pb-1">
                                <label className="flex items-center gap-1 text-xs cursor-pointer">
                                  <input type="checkbox" checked={it.requires_prescription} onChange={e => { const c = [...newItems]; c[idx].requires_prescription = e.target.checked; setNewItems(c); }} className="rounded" />
                                  Receta
                                </label>
                              </div>
                              <div className="col-span-4">
                                <Label className="text-xs">Farmacia sugerida</Label>
                                <Input value={it.suggested_pharmacy} onChange={e => { const c = [...newItems]; c[idx].suggested_pharmacy = e.target.value; setNewItems(c); }} placeholder="Ej: Farmacia Guadalajara" />
                              </div>
                              <div className="col-span-2">
                                <Label className="text-xs">Precio farmacia $</Label>
                                <Input type="number" min="0" step="0.01" value={it.suggested_pharmacy_price} onChange={e => { const c = [...newItems]; c[idx].suggested_pharmacy_price = parseFloat(e.target.value) || 0; setNewItems(c); }} />
                              </div>
                              <div className="col-span-1 flex items-end pb-1">
                                <label className="flex items-center gap-1 text-xs cursor-pointer">
                                  <input type="checkbox" checked={it.delivered} onChange={e => { const c = [...newItems]; c[idx].delivered = e.target.checked; setNewItems(c); }} className="rounded" />
                                  Entregado
                                </label>
                              </div>
                              <div className="col-span-2">
                                <Label className="text-xs">Foto</Label>
                                <Input type="file" accept="image/*" onChange={e => { const c = [...newItems]; c[idx].file = e.target.files?.[0]; setNewItems(c); }} />
                              </div>
                              <div className="col-span-1 flex items-end pb-1">
                                <Button type="button" variant="ghost" size="icon" onClick={() => setNewItems(newItems.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="col-span-5"><Label className="text-xs">Descripción</Label><Input value={it.description} onChange={e => { const c = [...newItems]; c[idx].description = e.target.value; setNewItems(c); }} /></div>
                            <div className="col-span-1"><Label className="text-xs">Cant.</Label><Input type="number" min="0" step="0.01" value={it.quantity} onChange={e => { const c = [...newItems]; c[idx].quantity = parseFloat(e.target.value) || 0; setNewItems(c); }} /></div>
                            <div className="col-span-2"><Label className="text-xs">Unidad</Label><Input value={it.unit} onChange={e => { const c = [...newItems]; c[idx].unit = e.target.value; setNewItems(c); }} placeholder="pza, kg" /></div>
                            <div className="col-span-2"><Label className="text-xs">P. unit.</Label><Input type="number" min="0" step="0.01" value={it.unit_price} onChange={e => { const c = [...newItems]; c[idx].unit_price = parseFloat(e.target.value) || 0; setNewItems(c); }} /></div>
                            <div className="col-span-1"><Label className="text-xs">Foto</Label><Input type="file" accept="image/*" onChange={e => { const c = [...newItems]; c[idx].file = e.target.files?.[0]; setNewItems(c); }} /></div>
                            <div className="col-span-1 flex items-end pb-1">
                              <Button type="button" variant="ghost" size="icon" onClick={() => setNewItems(newItems.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    <div className="text-right text-sm font-medium">Total estimado: {fmt(newItems.reduce((s, i) => s + (i.quantity || 0) * (i.unit_price || 0), 0))}</div>
                  </div>
                </div>
                <DialogFooter><Button onClick={createReq}>Crear</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="space-y-2">
          {reqs.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">Sin requisiciones.</CardContent></Card>}
          {reqs.map(r => (
            <Card key={r.id} className="cursor-pointer hover:shadow-md transition" onClick={() => openDetail(r)}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`capitalize ${STATUS_STYLE[r.status]}`}>{r.status}</Badge>
                      <Badge variant="secondary" className="capitalize">{r.priority}</Badge>
                      <span className="text-xs text-muted-foreground">{format(new Date(r.created_at), "PPp", { locale: es })}</span>
                    </div>
                    <p className="font-medium mt-1">{r.title}</p>
                    {r.vendor_name && <p className="text-xs text-muted-foreground">Proveedor: {r.vendor_name}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{fmt(Number(r.total_amount || 0))}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Detail dialog */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {editing.title}
                  <Badge variant="outline" className={`capitalize ${STATUS_STYLE[editing.status]}`}>{editing.status}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {editing.description && <p className="text-sm">{editing.description}</p>}
                {editing.vendor_name && <p className="text-sm"><b>Proveedor:</b> {editing.vendor_name}</p>}
                <p className="text-sm"><b>Total:</b> {fmt(Number(editing.total_amount || 0))}</p>
                {items.some(it => it.suggested_pharmacy) && (
                  <div className="text-sm">
                    <b>Farmacias sugeridas:</b>
                    <ul className="list-disc list-inside ml-2 mt-1">
                      {items.filter(it => it.suggested_pharmacy).map((it, i) => (
                        <li key={i}>{it.description}: <b>{it.suggested_pharmacy}</b>{it.suggested_pharmacy_price ? ` (${fmt(Number(it.suggested_pharmacy_price))})` : ""}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {editing.payment_method && <p className="text-sm"><b>Pago:</b> {editing.payment_method}</p>}

                <div className="border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      {reqType === "medicamentos" ? (
                        <tr><th className="text-left p-2">Medicamento</th><th className="text-left p-2">Paciente</th><th className="p-2">Dosis/día</th><th className="p-2">Cant.</th><th className="p-2">Unidad</th><th className="p-2">P.U.</th><th className="p-2">Stock</th><th className="p-2">Receta</th><th className="p-2">Entr.</th><th className="p-2">Foto</th><th className="p-2">Obs</th></tr>
                      ) : (
                        <tr><th className="text-left p-2">Descripción</th><th className="p-2">Cant.</th><th className="p-2">P.U.</th><th className="p-2">Foto</th></tr>
                      )}
                    </thead>
                    <tbody>
                      {items.map(it => (
                        <tr key={it.id} className="border-t">
                          <td className="p-2">{it.description}</td>
                          {reqType === "medicamentos" && (
                            <>
                              <td className="p-2">{it.patient_name || "—"}</td>
                              <td className="p-2 text-center">{it.daily_dose ?? "—"}</td>
                            </>
                          )}
                          <td className="p-2 text-center">{it.quantity}</td>
                          <td className="p-2 text-center">{it.unit || "—"}</td>
                          <td className="p-2 text-right">{fmt(Number(it.unit_price))}</td>
                          {reqType === "medicamentos" && (
                            <>
                              <td className="p-2 text-center">
                                {inventory[it.description] !== undefined ? (
                                  <span className={inventory[it.description] <= 0 ? "text-red-600 font-medium" : ""}>{inventory[it.description]}</span>
                                ) : "—"}
                              </td>
                              <td className="p-2 text-center">{it.requires_prescription ? "✅" : "—"}</td>
                              <td className="p-2 text-center">{it.delivered ? "✅" : "—"}</td>
                            </>
                          )}
                          <td className="p-2 text-center">
                            {it.image_path ? (
                              <Button variant="ghost" size="icon" onClick={async () => { const u = await getSignedUrl(it.image_path!); if (u) window.open(u, "_blank"); }}><ImageIcon className="w-4 h-4" /></Button>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                          {reqType === "medicamentos" && (
                            <td className="p-2 text-xs max-w-[120px] truncate" title={it.notes || ""}>{it.notes || "—"}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {isManager && (
                  <div className="flex flex-wrap gap-2 border-t pt-3">
                    {editing.status === "pendiente" && (
                      <>
                        <Button size="sm" onClick={() => askPin("Autorizar requisición", async () => changeStatus(editing, "autorizada", { authorized_by: user!.id, authorized_at: new Date().toISOString() }))}>
                          <Check className="w-4 h-4 mr-1" /> Autorizar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={async () => {
                          const reason = window.prompt("Motivo del rechazo:") || "";
                          if (!reason) return;
                          askPin("Rechazar requisición", async () => changeStatus(editing, "rechazada", { rejected_reason: reason, authorized_by: user!.id, authorized_at: new Date().toISOString() }));
                        }}><X className="w-4 h-4 mr-1" /> Rechazar</Button>
                      </>
                    )}
                    {editing.status === "autorizada" && reqType !== "pago_proveedor" && (
                      <Button size="sm" onClick={() => changeStatus(editing, "comprada", { executed_by: user!.id, executed_at: new Date().toISOString() })}>
                        <ShoppingCart className="w-4 h-4 mr-1" /> Marcar como comprada
                      </Button>
                    )}
                    {(editing.status === "autorizada" || editing.status === "comprada") && (
                      <Button size="sm" variant="secondary" onClick={async () => {
                        const method = window.prompt("Forma de pago (efectivo, transferencia, tarjeta...):") || "";
                        if (!method) return;
                        const ref = window.prompt("Referencia / folio:") || "";
                        askPin("Confirmar pago", async () => changeStatus(editing, "pagada", { payment_method: method, payment_reference: ref, paid_at: new Date().toISOString() }));
                      }}><CreditCard className="w-4 h-4 mr-1" /> Registrar pago</Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <PinPrompt open={pinOpen} onOpenChange={setPinOpen} title={pinTitle} onConfirm={pinAction} />
    </div>
  );
}
