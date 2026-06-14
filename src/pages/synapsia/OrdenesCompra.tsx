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
import { ArrowLeft, LogOut, Plus, Check, X, ShoppingCart, Package, Loader2 } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PO {
  id: string; po_number: string | null; vendor_name: string | null;
  total_amount: number; status: string; requisition_id: string | null;
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

const STATUS_FLOW: Record<string, string[]> = {
  pendiente: ["autorizada", "rechazada"],
  autorizada: ["comprada"],
  comprada: ["abastecida"],
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
  const [vendorName, setVendorName] = useState("");
  const [poNotes, setPoNotes] = useState("");
  const [poItems, setPoItems] = useState<Array<{ medication_name: string; quantity: number; unit: string; unit_price: number }>>([]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPo, setDetailPo] = useState<PO | null>(null);
  const [detailItems, setDetailItems] = useState<POItem[]>([]);

  const [reqs, setReqs] = useState<Req[]>([]);
  const [availReqs, setAvailReqs] = useState<Req[]>([]);

  const canDiana = hasRole("admin") || hasRole("dueno") || hasRole("asistente_admin");
  const canEsther = hasRole("admin") || hasRole("dueno") || hasRole("administrativo");
  const canProcure = hasRole("admin") || hasRole("dueno") || hasRole("asistente_admin") || hasRole("administrativo");
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
      .eq("status", "autorizada")
      .order("created_at", { ascending: false });
    setAvailReqs((data as any) || []);
  }

  function openCreate() {
    loadAvailReqs();
    setOpen(true);
  }

  async function loadReqItems(reqId: string) {
    const { data } = await (supabase.from as any)("requisition_items").select("*").eq("requisition_id", reqId);
    const items: any[] = (data as any) || [];
    setPoItems(items.map(it => ({
      medication_name: it.description,
      quantity: it.quantity,
      unit: it.unit || "pza",
      unit_price: it.unit_price,
    })));
  }

  async function createPO() {
    if (!unitId || !user) return;
    if (!poItems.length) { toast({ title: "Agrega al menos un item", variant: "destructive" }); return; }
    setLoading(true);
    const { data: poNum } = await supabase.rpc("generate_po_number");
    const total = poItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    const { data: created, error } = await (supabase.from as any)("purchase_orders").insert({
      health_unit_id: unitId, requisition_id: selectedReq || null,
      po_number: poNum, vendor_name: vendorName || null,
      total_amount: total, created_by: user.id, notes: poNotes || null,
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
    setPoItems([]);
    setVendorName("");
    setPoNotes("");
    setSelectedReq("");
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
                    {po.vendor_name && <p className="text-sm text-muted-foreground mt-1">Proveedor: {po.vendor_name}</p>}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva orden de compra</DialogTitle></DialogHeader>
          <div className="space-y-3">
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
            <div><Label>Proveedor</Label><Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} /></div>
            <div className="space-y-2 border rounded p-3">
              <div className="flex items-center justify-between">
                <Label>Items</Label>
                <Button type="button" size="sm" variant="outline" onClick={addPoItem}><Plus className="w-3 h-3 mr-1" /> Agregar</Button>
              </div>
              {poItems.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end border rounded p-2">
                  <div className="col-span-4"><Label className="text-xs">Medicamento</Label><Input value={it.medication_name} onChange={e => updatePoItem(idx, "medication_name", e.target.value)} /></div>
                  <div className="col-span-2"><Label className="text-xs">Cant.</Label><Input type="number" min="0" step="0.01" value={it.quantity} onChange={e => updatePoItem(idx, "quantity", parseFloat(e.target.value) || 0)} /></div>
                  <div className="col-span-2"><Label className="text-xs">Unidad</Label>
                    <Select value={it.unit} onValueChange={v => updatePoItem(idx, "unit", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["pza", "kg", "ml", "l", "caja", "frasco", "blister", "tubo"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2"><Label className="text-xs">P. unit.</Label><Input type="number" min="0" step="0.01" value={it.unit_price} onChange={e => updatePoItem(idx, "unit_price", parseFloat(e.target.value) || 0)} /></div>
                  <div className="col-span-2"><Button type="button" variant="ghost" size="icon" onClick={() => removePoItem(idx)}><X className="w-4 h-4" /></Button></div>
                </div>
              ))}
              <div className="text-right text-sm font-medium">Total: ${poItems.reduce((s, i) => s + i.quantity * i.unit_price, 0).toFixed(2)}</div>
            </div>
            <div><Label>Notas</Label><Textarea rows={2} value={poNotes} onChange={e => setPoNotes(e.target.value)} /></div>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailPo && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {detailPo.po_number}
                  <Badge variant="outline" className={`capitalize ${STATUS_STYLE[detailPo.status]}`}>{detailPo.status}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {detailPo.vendor_name && <p className="text-sm"><b>Proveedor:</b> {detailPo.vendor_name}</p>}
                <p className="text-sm"><b>Total:</b> ${Number(detailPo.total_amount || 0).toFixed(2)}</p>
                {detailPo.notes && <p className="text-sm text-muted-foreground">{detailPo.notes}</p>}
                {detailPo.authorized_at && <p className="text-xs text-muted-foreground">Autorizada: {format(new Date(detailPo.authorized_at), "PPp", { locale: es })}</p>}
                {detailPo.procured_at && <p className="text-xs text-muted-foreground">Comprada: {format(new Date(detailPo.procured_at), "PPp", { locale: es })}</p>}
                {detailPo.stocked_at && <p className="text-xs text-muted-foreground">Abastecida: {format(new Date(detailPo.stocked_at), "PPp", { locale: es })}</p>}

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medicamento</TableHead>
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
