import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, LogOut, Plus, AlertTriangle, Package, ArrowUpDown, History } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface InventoryItem {
  id: string; medication_name: string; presentation: string | null;
  current_stock: number; min_stock: number; unit: string; notes: string | null;
}
interface Movement {
  id: string; movement_type: string; quantity: number;
  reference_type: string | null; notes: string | null;
  created_by: string; created_at: string;
}

export default function Inventario() {
  const { id: unitId } = useParams<{ id: string }>();
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const [unitName, setUnitName] = useState("");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [showMovements, setShowMovements] = useState(false);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustNote, setAdjustNote] = useState("");

  const [form, setForm] = useState({ medication_name: "", presentation: "", current_stock: 0, min_stock: 0, unit: "pza", notes: "" });

  const canManage = hasRole("admin") || hasRole("dueno") || hasRole("administrativo") || hasRole("asistente_admin");
  const canAdjust = hasRole("admin") || hasRole("dueno") || hasRole("administrativo");
  const canConfirm = hasRole("enfermera");

  useEffect(() => {
    if (!unitId) return;
    (async () => {
      const { data: u } = await (supabase.from as any)("health_units").select("name").eq("id", unitId).maybeSingle();
      setUnitName((u as any)?.name ?? "");
    })();
  }, [unitId]);

  async function load() {
    if (!unitId) return;
    const { data } = await (supabase.from as any)("medication_inventory")
      .select("*").eq("health_unit_id", unitId).order("medication_name");
    setItems((data as any) || []);
  }

  useEffect(() => { load(); }, [unitId]);

  async function loadMovements(inventoryId: string) {
    const { data } = await (supabase.from as any)("inventory_movements")
      .select("*").eq("inventory_id", inventoryId).order("created_at", { ascending: false });
    setMovements((data as any) || []);
    setShowMovements(true);
  }

  async function saveItem() {
    if (!unitId || !form.medication_name.trim()) { toast({ title: "Nombre del medicamento requerido", variant: "destructive" }); return; }
    const { error } = await (supabase.from as any)("medication_inventory").insert({
      health_unit_id: unitId, medication_name: form.medication_name,
      presentation: form.presentation || null, current_stock: form.current_stock,
      min_stock: form.min_stock, unit: form.unit, notes: form.notes || null,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    if (form.current_stock > 0) {
      const { data: inv } = await (supabase.from as any)("medication_inventory")
        .select("id").eq("health_unit_id", unitId).eq("medication_name", form.medication_name).maybeSingle();
      if (inv && user) {
        await (supabase.from as any)("inventory_movements").insert({
          inventory_id: inv.id, health_unit_id: unitId,
          movement_type: "entry", quantity: form.current_stock,
          notes: "Registro inicial", created_by: user.id,
        });
      }
    }
    toast({ title: "Medicamento agregado" });
    setOpen(false);
    setForm({ medication_name: "", presentation: "", current_stock: 0, min_stock: 0, unit: "pza", notes: "" });
    load();
  }

  async function updateItem() {
    if (!editItem) return;
    const { error } = await (supabase.from as any)("medication_inventory").update({
      min_stock: editItem.min_stock, notes: editItem.notes || null, presentation: editItem.presentation || null,
    }).eq("id", editItem.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Actualizado" });
    setEditItem(null);
    load();
  }

  async function doAdjust() {
    if (!adjustItem || !user || !adjustQty) return;
    const movementType = adjustQty > 0 ? "entry" : "exit";
    const qty = Math.abs(adjustQty);
    await (supabase.from as any)("medication_inventory").update({
      current_stock: Number(adjustItem.current_stock) + adjustQty,
    }).eq("id", adjustItem.id);
    await (supabase.from as any)("inventory_movements").insert({
      inventory_id: adjustItem.id, health_unit_id: unitId,
      movement_type: movementType, quantity: qty,
      reference_type: "adjustment", notes: adjustNote || "Ajuste manual", created_by: user.id,
    });
    toast({ title: "Stock ajustado" });
    setAdjustOpen(false);
    setAdjustQty(0);
    setAdjustNote("");
    load();
  }

  const lowStock = items.filter(i => i.current_stock <= i.min_stock);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/synapsia/unidades/${unitId}`)}><ArrowLeft className="w-4 h-4" /></Button>
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold">Inventario de medicamentos — {unitName}</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {lowStock.length > 0 && (
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="py-3 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <p className="font-medium text-sm">{lowStock.length} medicamento(s) con stock bajo</p>
                <p className="text-xs text-muted-foreground">
                  {lowStock.map(i => i.medication_name).join(", ")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {items.length} medicamento{items.length !== 1 ? "s" : ""} registrados
          </h2>
          {canManage && (
            <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1" /> Agregar medicamento</Button>
          )}
        </div>

        {items.length === 0 && (
          <Card><CardContent className="py-10 text-center text-muted-foreground">Inventario vacío. Agrega medicamentos o ingresa stock desde una orden de compra.</CardContent></Card>
        )}

        {items.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicamento</TableHead>
                    <TableHead>Presentación</TableHead>
                    <TableHead className="text-right">Stock actual</TableHead>
                    <TableHead className="text-right">Stock mínimo</TableHead>
                    <TableHead className="text-center">Unidad</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(item => (
                    <TableRow key={item.id} className={item.current_stock <= item.min_stock ? "bg-red-500/5" : ""}>
                      <TableCell className="font-medium">{item.medication_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.presentation || "—"}</TableCell>
                      <TableCell className="text-right">
                        <span className={item.current_stock <= item.min_stock ? "text-red-600 font-bold" : ""}>
                          {item.current_stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{item.min_stock}</TableCell>
                      <TableCell className="text-center">{item.unit}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="icon" variant="ghost" onClick={() => loadMovements(item.id)} title="Movimientos">
                            <History className="w-4 h-4" />
                          </Button>
                          {canAdjust && (
                            <Button size="icon" variant="ghost" onClick={() => { setAdjustItem(item); setAdjustQty(0); setAdjustNote(""); setAdjustOpen(true); }} title="Ajustar stock">
                              <ArrowUpDown className="w-4 h-4" />
                            </Button>
                          )}
                          {canManage && (
                            <Button size="icon" variant="ghost" onClick={() => setEditItem(item)} title="Editar">
                              <Package className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agregar medicamento al inventario</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Medicamento *</Label><Input value={form.medication_name} onChange={e => setForm({ ...form, medication_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Presentación</Label><Input value={form.presentation} onChange={e => setForm({ ...form, presentation: e.target.value })} placeholder="tableta, jarabe, ampolla" /></div>
              <div><Label>Unidad</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                  {["pza", "kg", "ml", "l", "caja", "frasco", "blister", "tubo"].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Stock inicial</Label><Input type="number" min="0" value={form.current_stock} onChange={e => setForm({ ...form, current_stock: parseInt(e.target.value) || 0 })} /></div>
              <div><Label>Stock mínimo</Label><Input type="number" min="0" value={form.min_stock} onChange={e => setForm({ ...form, min_stock: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div><Label>Notas</Label><Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={saveItem}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(v) => !v && setEditItem(null)}>
        <DialogContent>
          {editItem && (
            <>
              <DialogHeader><DialogTitle>Editar: {editItem.medication_name}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Presentación</Label><Input value={editItem.presentation || ""} onChange={e => setEditItem({ ...editItem, presentation: e.target.value })} /></div>
                <div><Label>Stock mínimo</Label><Input type="number" min="0" value={editItem.min_stock} onChange={e => setEditItem({ ...editItem, min_stock: parseInt(e.target.value) || 0 })} /></div>
                <div><Label>Notas</Label><Textarea rows={2} value={editItem.notes || ""} onChange={e => setEditItem({ ...editItem, notes: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={updateItem}>Actualizar</Button></DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          {adjustItem && (
            <>
              <DialogHeader><DialogTitle>Ajustar stock: {adjustItem.medication_name}</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">Stock actual: <b>{adjustItem.current_stock} {adjustItem.unit}</b></p>
              <div className="space-y-3 mt-2">
                <div><Label>Cantidad (+ entrada, - salida)</Label>
                  <Input type="number" value={adjustQty} onChange={e => setAdjustQty(parseInt(e.target.value) || 0)} placeholder="Ej: 10 para entrada, -5 para salida" />
                </div>
                <div><Label>Motivo</Label><Textarea rows={2} value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="Ej: Ajuste por conteo físico" /></div>
              </div>
              <DialogFooter><Button onClick={doAdjust} disabled={!adjustQty}>Aplicar ajuste</Button></DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showMovements} onOpenChange={setShowMovements}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Movimientos</DialogTitle></DialogHeader>
          {movements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin movimientos registrados.</p>
          ) : (
            <div className="space-y-2">
              {movements.map(m => (
                <div key={m.id} className="flex items-center justify-between border rounded p-2 text-sm">
                  <div>
                    <Badge variant="outline" className={m.movement_type === "entry" ? "bg-green-500/10 text-green-700" : "bg-red-500/10 text-red-700"}>
                      {m.movement_type === "entry" ? "+" : "-"}{m.quantity}
                    </Badge>
                    <span className="ml-2 text-muted-foreground">{m.reference_type || "manual"}</span>
                    {m.notes && <p className="text-xs text-muted-foreground mt-1">{m.notes}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground">{format(new Date(m.created_at), "PPp", { locale: es })}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
