import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PinPrompt from "@/components/synapsia/PinPrompt";
import { ArrowLeft, LogOut, Plus, Check, X, ShoppingCart, Package, Loader2, Building2, Phone, Mail, MapPin, Truck } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PO {
  id: string; po_number: string | null; vendor_name: string | null;
  vendor_rfc: string | null; vendor_phone: string | null; vendor_email: string | null;
  vendor_address: string | null; delivery_address: string | null;
  payment_terms: string | null; delivery_date: string | null;
  department: string | null; requested_by_name: string | null;
  subtotal: number; tax_amount: number; total_amount: number;
  status: string; requisition_id: string | null;
  authorized_by: string | null; authorized_at: string | null;
  procured_by: string | null; procured_at: string | null;
  stocked_by: string | null; stocked_at: string | null;
  notes: string | null; created_by: string; created_at: string;
  health_unit_id: string;
}
interface POItem {
  id: string; medication_name: string; quantity: number; unit: string;
  unit_price: number; total_price: number; notes: string | null;
}
interface Req {
  id: string; title: string; total_amount: number; created_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  pendiente: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
  autorizada: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  rechazada: "bg-red-500/10 text-red-700 border-red-500/30",
  comprada: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  abastecida: "bg-green-600/10 text-green-700 border-green-600/30",
  cancelada: "bg-muted text-muted-foreground border-border",
};

export default function OrdenesCompra() {
  const { id: unitId } = useParams<{ id: string }>();
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const [unitName, setUnitName] = useState("");
  const [pos, setPos] = useState<PO[]>([]);
  const [filter, setFilter] = useState("pendiente");
  const [open, setOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinAction, setPinAction] = useState<() => Promise<void>>(() => async () => {});
  const [pinTitle, setPinTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedReq, setSelectedReq] = useState<string>("");
  const [form, setForm] = useState({
    vendor_name: "", vendor_rfc: "", vendor_phone: "", vendor_email: "", vendor_address: "",
    delivery_address: "", payment_terms: "Crédito 7 días", department: "",
    requested_by_name: "", delivery_date: "", notes: "",
  });
  const [poItems, setPoItems] = useState<Array<{ medication_name: string; quantity: number; unit: string; unit_price: number }>>([]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPo, setDetailPo] = useState<PO | null>(null);
  const [detailItems, setDetailItems] = useState<POItem[]>([]);

  const [reqs, setReqs] = useState<Req[]>([]);
  const [availReqs, setAvailReqs] = useState<Req[]>([]);

  const canDiana = hasRole("admin") || hasRole("dueno") || hasRole("asistente_admin");
  const canEsther = hasRole("admin") || hasRole("dueno") || hasRole("administrativo");
  const canProcure = hasRole("admin") || hasRole("dueno") || hasRole("administrativo") || hasRole("asistente_admin");
  const canStock = hasRole("admin") || hasRole("dueno") || hasRole("asistente_admin");

  useEffect(() => {
    if (!unitId) return;
    (async () => {
      const { data: u } = await (supabase.from as any)("health_units").select("name").eq("id", unitId).maybeSingle();
      setUnitName((u as any)?.name ?? "");
    })();
  }, [unitId]);

  async function loadPOs() {
    if (!unitId) return;
    let q = (supabase.from as any)("purchase_orders").select("*").eq("health_unit_id", unitId).order("created_at", { ascending: false });
    if (filter !== "todas") q = q.eq("status", filter);
    const { data } = await q;
    setPos((data as any) || []);
  }

  useEffect(() => { loadPOs(); }, [unitId, filter]);

  async function loadAvailReqs() {
    if (!unitId) return;
    const { data } = await (supabase.from as any)("requisitions")
      .select("id, title, total_amount, created_at")
      .eq("health_unit_id", unitId)
      .eq("req_type", "medicamentos")
      .in("status", ["autorizada"])
      .order("created_at", { ascending: false });
    setAvailReqs((data as any) || []);
  }

  function openCreate() {
    loadAvailReqs();
    setForm({ vendor_name: "", vendor_rfc: "", vendor_phone: "", vendor_email: "", vendor_address: "", delivery_address: "", payment_terms: "Crédito 7 días", department: "", requested_by_name: "", delivery_date: "", notes: "" });
    setPoItems([{ medication_name: "", quantity: 1, unit: "pza", unit_price: 0 }]);
    setSelectedReq("");
    setOpen(true);
  }

  async function loadReqItems(reqId: string) {
    const { data } = await (supabase.from as any)("requisition_items").select("*").eq("requisition_id", reqId);
    const items: any[] = (data as any) || [];
    if (items.length) {
      setPoItems(items.map(it => ({
        medication_name: it.description,
        quantity: it.quantity,
        unit: it.unit || "pza",
        unit_price: it.unit_price,
      })));
    }
  }

  const calcSubtotal = () => poItems.reduce((s, i) => s + (i.quantity || 0) * (i.unit_price || 0), 0);
  const calcTax = () => Math.round(calcSubtotal() * 0.16 * 100) / 100;
  const calcTotal = () => calcSubtotal() + calcTax();

  async function createPO() {
    if (!unitId || !user) return;
    if (!poItems.length) { toast({ title: "Agrega al menos un item", variant: "destructive" }); return; }
    setLoading(true);
    const { data: poNum } = await supabase.rpc("generate_po_number");
    const subtotal = calcSubtotal();
    const tax = calcTax();
    const total = subtotal + tax;
    const { data: created, error } = await (supabase.from as any)("purchase_orders").insert({
      health_unit_id: unitId, requisition_id: selectedReq || null,
      po_number: poNum, vendor_name: form.vendor_name || null,
      vendor_rfc: form.vendor_rfc || null, vendor_phone: form.vendor_phone || null,
      vendor_email: form.vendor_email || null, vendor_address: form.vendor_address || null,
      delivery_address: form.delivery_address || null,
      payment_terms: form.payment_terms || null, delivery_date: form.delivery_date || null,
      department: form.department || null, requested_by_name: form.requested_by_name || null,
      subtotal, tax_amount: tax, total_amount: total,
      created_by: user.id, notes: form.notes || null,
    }).select().single();
    if (error || !created) { toast({ title: "Error", description: error?.message, variant: "destructive" }); setLoading(false); return; }
    for (const it of poItems) {
      await (supabase.from as any)("purchase_order_items").insert({
        purchase_order_id: created.id,
        medication_name: it.medication_name,
        quantity: it.quantity, unit: it.unit,
        unit_price: it.unit_price,
      });
    }
    toast({ title: "Orden de compra creada", description: `Folio: ${poNum}` });
    setOpen(false);
    setLoading(false);
    loadPOs();
  }

  function addPoItem() {
    setPoItems([...poItems, { medication_name: "", quantity: 1, unit: "pza", unit_price: 0 }]);
  }

  function updatePoItem(idx: number, field: string, value: any) {
    const c = [...poItems];
    (c[idx] as any)[field] = value;
    setPoItems(c);
  }

  function removePoItem(idx: number) {
    setPoItems(poItems.filter((_, i) => i !== idx));
  }

  function askPin(title: string, action: () => Promise<void>) {
    setPinTitle(title);
    setPinAction(() => action);
    setPinOpen(true);
  }

  async function updateStatus(po: PO, status: string, extra: Record<string, any> = {}) {
    const { error } = await (supabase.from as any)("purchase_orders").update({
      status, ...extra,
    }).eq("id", po.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    await (supabase.from as any)("audit_log").insert({
      entity: "purchase_orders", entity_id: po.id, action: status, user_id: user!.id, metadata: extra,
    });
    toast({ title: `Orden ${status}` });
    setDetailOpen(false);
    loadPOs();
  }

  async function stockInventory(po: PO) {
    if (!user || !unitId) return;
    setLoading(true);
    await updateStatus(po, "abastecida", { stocked_by: user.id, stocked_at: new Date().toISOString() });
    for (const it of detailItems) {
      const med = it.medication_name.trim();
      if (!med || !it.quantity) continue;
      let { data: inv } = await (supabase.from as any)("medication_inventory")
        .select("id, current_stock")
        .eq("health_unit_id", unitId)
        .eq("medication_name", med)
        .maybeSingle();
      if (inv) {
        await (supabase.from as any)("medication_inventory").update({
          current_stock: Number(inv.current_stock) + it.quantity,
        }).eq("id", inv.id);
      } else {
        const { data: newInv } = await (supabase.from as any)("medication_inventory").insert({
          health_unit_id: unitId, medication_name: med,
          current_stock: it.quantity, unit: it.unit, min_stock: 0,
        }).select().single();
        inv = newInv as any;
      }
      await (supabase.from as any)("inventory_movements").insert({
        inventory_id: inv.id, health_unit_id: unitId,
        movement_type: "entry", quantity: it.quantity,
        reference_type: "purchase_order", reference_id: po.id,
        notes: `Entrada por OC ${po.po_number || ""}`, created_by: user.id,
      });
    }
    setLoading(false);
  }

  async function openDetail(po: PO) {
    setDetailPo(po);
    const { data } = await (supabase.from as any)("purchase_order_items").select("*").eq("purchase_order_id", po.id);
    setDetailItems((data as any) || []);
    setDetailOpen(true);
  }

  const FILTERS = ["pendiente", "autorizada", "comprada", "abastecida", "rechazada", "todas"];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/synapsia/unidades/${unitId}`)}><ArrowLeft className="w-4 h-4" /></Button>
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold">Órdenes de compra — {unitName}</h1>
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
              {FILTERS.map(s => <TabsTrigger key={s} value={s} className="capitalize">{s}</TabsTrigger>)}
            </TabsList>
          </Tabs>
          {(canDiana || canEsther) && (
            <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Nueva orden de compra</Button>
          )}
        </div>

        <div className="space-y-2">
          {pos.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">Sin órdenes de compra.</CardContent></Card>}
          {pos.map(po => (
            <Card key={po.id} className="cursor-pointer hover:shadow-md transition" onClick={() => openDetail(po)}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`capitalize ${STATUS_STYLE[po.status]}`}>{po.status}</Badge>
                      <span className="text-xs font-mono font-bold">{po.po_number}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(po.created_at), "PP", { locale: es })}</span>
                    </div>
                    {po.vendor_name && <p className="text-sm mt-1">{po.vendor_name}</p>}
                    {po.department && <p className="text-xs text-muted-foreground">Depto: {po.department}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${Number(po.total_amount || 0).toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva orden de compra</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Basada en requisición (opcional)</Label>
              <Select value={selectedReq} onValueChange={(v) => { setSelectedReq(v); loadReqItems(v); }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar requisición autorizada..." /></SelectTrigger>
                <SelectContent>
                  {availReqs.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.title} — ${Number(r.total_amount).toFixed(2)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded p-3 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Building2 className="w-4 h-4" /> Proveedor</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Nombre</Label><Input value={form.vendor_name} onChange={e => setForm({ ...form, vendor_name: e.target.value })} /></div>
                <div><Label>RFC</Label><Input value={form.vendor_rfc} onChange={e => setForm({ ...form, vendor_rfc: e.target.value })} /></div>
                <div><Label>Teléfono</Label><Input value={form.vendor_phone} onChange={e => setForm({ ...form, vendor_phone: e.target.value })} /></div>
                <div className="col-span-2"><Label>Email</Label><Input type="email" value={form.vendor_email} onChange={e => setForm({ ...form, vendor_email: e.target.value })} /></div>
                <div className="col-span-2"><Label>Dirección</Label><Textarea rows={2} value={form.vendor_address} onChange={e => setForm({ ...form, vendor_address: e.target.value })} /></div>
              </div>
            </div>

            <div className="border rounded p-3 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Truck className="w-4 h-4" /> Entrega</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Dirección de entrega</Label><Textarea rows={2} value={form.delivery_address} onChange={e => setForm({ ...form, delivery_address: e.target.value })} /></div>
                <div><Label>Fecha de entrega</Label><Input type="date" value={form.delivery_date} onChange={e => setForm({ ...form, delivery_date: e.target.value })} /></div>
                <div><Label>Condiciones de pago</Label>
                  <Select value={form.payment_terms} onValueChange={v => setForm({ ...form, payment_terms: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Crédito 7 días", "Crédito 15 días", "Crédito 30 días", "Contado", "Transferencia", "Otro"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Departamento solicitante</Label><Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
                <div><Label>Solicitado por</Label><Input value={form.requested_by_name} onChange={e => setForm({ ...form, requested_by_name: e.target.value })} /></div>
              </div>
            </div>

            <div className="border rounded p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label>Items</Label>
                <Button type="button" size="sm" variant="outline" onClick={addPoItem}><Plus className="w-3 h-3 mr-1" /> Agregar</Button>
              </div>
              {poItems.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end border rounded p-2">
                  <div className="col-span-4"><Label className="text-xs">Medicamento/Insumo</Label><Input value={it.medication_name} onChange={e => updatePoItem(idx, "medication_name", e.target.value)} /></div>
                  <div className="col-span-2"><Label className="text-xs">Cant.</Label><Input type="number" min="0" step="0.01" value={it.quantity} onChange={e => updatePoItem(idx, "quantity", parseFloat(e.target.value) || 0)} /></div>
                  <div className="col-span-2"><Label className="text-xs">Unidad</Label>
                    <Select value={it.unit} onValueChange={v => updatePoItem(idx, "unit", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["pza", "kg", "ml", "l", "caja", "frasco", "blister", "tubo", "par", "m", "servicio"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2"><Label className="text-xs">P. unit.</Label><Input type="number" min="0" step="0.01" value={it.unit_price} onChange={e => updatePoItem(idx, "unit_price", parseFloat(e.target.value) || 0)} /></div>
                  <div className="col-span-2 flex items-end justify-center">
                    <p className="text-xs font-mono">${((it.quantity || 0) * (it.unit_price || 0)).toFixed(2)}</p>
                  </div>
                </div>
              ))}
              <div className="border-t pt-2 space-y-1 text-right text-sm">
                <p>Subtotal: <span className="font-mono">${calcSubtotal().toFixed(2)}</span></p>
                <p>IVA (16%): <span className="font-mono">${calcTax().toFixed(2)}</span></p>
                <p className="text-base font-bold">TOTAL: <span className="font-mono">${calcTotal().toFixed(2)}</span></p>
              </div>
            </div>

            <div><Label>Notas / Instrucciones</Label><Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={createPO} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Crear orden de compra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={(v) => !v && setDetailOpen(false)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {detailPo && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  {detailPo.po_number}
                  <Badge variant="outline" className={`capitalize ${STATUS_STYLE[detailPo.status]}`}>{detailPo.status}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                {/* Proveedor */}
                {detailPo.vendor_name && (
                  <div className="border rounded p-3">
                    <h4 className="font-semibold mb-1 flex items-center gap-1"><Building2 className="w-4 h-4" /> Proveedor</h4>
                    <p>{detailPo.vendor_name}</p>
                    {detailPo.vendor_rfc && <p className="text-muted-foreground">RFC: {detailPo.vendor_rfc}</p>}
                    {detailPo.vendor_phone && <p className="text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {detailPo.vendor_phone}</p>}
                    {detailPo.vendor_email && <p className="text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> {detailPo.vendor_email}</p>}
                    {detailPo.vendor_address && <p className="text-muted-foreground flex items-start gap-1"><MapPin className="w-3 h-3 mt-0.5" /> {detailPo.vendor_address}</p>}
                  </div>
                )}

                {/* Entrega */}
                <div className="border rounded p-3">
                  <h4 className="font-semibold mb-1 flex items-center gap-1"><Truck className="w-4 h-4" /> Entrega</h4>
                  {detailPo.delivery_address && <p className="text-muted-foreground"><b>Dirección:</b> {detailPo.delivery_address}</p>}
                  {detailPo.delivery_date && <p className="text-muted-foreground"><b>Fecha:</b> {format(new Date(detailPo.delivery_date), "PP", { locale: es })}</p>}
                  {detailPo.payment_terms && <p className="text-muted-foreground"><b>Condiciones:</b> {detailPo.payment_terms}</p>}
                  {detailPo.department && <p className="text-muted-foreground"><b>Depto:</b> {detailPo.department}</p>}
                  {detailPo.requested_by_name && <p className="text-muted-foreground"><b>Solicitó:</b> {detailPo.requested_by_name}</p>}
                </div>

                {/* Items */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-center">Cant.</TableHead>
                      <TableHead className="text-center">Unidad</TableHead>
                      <TableHead className="text-right">P. unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailItems.map(it => (
                      <TableRow key={it.id}>
                        <TableCell>{it.medication_name}</TableCell>
                        <TableCell className="text-center">{it.quantity}</TableCell>
                        <TableCell className="text-center">{it.unit}</TableCell>
                        <TableCell className="text-right">${Number(it.unit_price).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">${Number(it.total_price).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Totals */}
                <div className="text-right space-y-1 border-t pt-2">
                  <p className="text-sm">Subtotal: <span className="font-mono">${Number(detailPo.subtotal || 0).toFixed(2)}</span></p>
                  <p className="text-sm">IVA: <span className="font-mono">${Number(detailPo.tax_amount || 0).toFixed(2)}</span></p>
                  <p className="text-base font-bold">TOTAL: <span className="font-mono">${Number(detailPo.total_amount || 0).toFixed(2)}</span></p>
                </div>

                {detailPo.notes && <p className="text-muted-foreground border-t pt-2"><b>Instrucciones:</b> {detailPo.notes}</p>}

                {/* Timeline */}
                <div className="border-t pt-2 space-y-1 text-xs text-muted-foreground">
                  {detailPo.authorized_at && <p>Autorizada: {format(new Date(detailPo.authorized_at), "PPp", { locale: es })}</p>}
                  {detailPo.procured_at && <p>Comprada: {format(new Date(detailPo.procured_at), "PPp", { locale: es })}</p>}
                  {detailPo.stocked_at && <p>Abastecida: {format(new Date(detailPo.stocked_at), "PPp", { locale: es })}</p>}
                  <p>Creada: {format(new Date(detailPo.created_at), "PPp", { locale: es })}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 border-t pt-3">
                  {detailPo.status === "pendiente" && canEsther && (
                    <>
                      <Button size="sm" onClick={() => askPin("Autorizar orden de compra", async () => updateStatus(detailPo, "autorizada", { authorized_by: user!.id, authorized_at: new Date().toISOString() }))}>
                        <Check className="w-4 h-4 mr-1" /> Autorizar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={async () => {
                        const reason = window.prompt("Motivo del rechazo:") || "";
                        if (!reason) return;
                        askPin("Rechazar orden", async () => updateStatus(detailPo, "rechazada", { notes: reason }));
                      }}><X className="w-4 h-4 mr-1" /> Rechazar</Button>
                    </>
                  )}
                  {detailPo.status === "autorizada" && (canDiana || canProcure) && (
                    <Button size="sm" onClick={() => askPin("Marcar como comprada", async () => updateStatus(detailPo, "comprada", { procured_by: user!.id, procured_at: new Date().toISOString() }))}>
                      <ShoppingCart className="w-4 h-4 mr-1" /> Marcar como comprada
                    </Button>
                  )}
                  {detailPo.status === "comprada" && canStock && (
                    <Button size="sm" onClick={() => askPin("Abastecer inventario", () => stockInventory(detailPo))} disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Package className="w-4 h-4 mr-1" />}
                      Abastecer e ingresar a inventario
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <PinPrompt open={pinOpen} onOpenChange={setPinOpen} title={pinTitle} onConfirm={pinAction} />
    </div>
  );
}
