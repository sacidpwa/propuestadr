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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, LogOut, CheckCircle, AlertTriangle, ClipboardCheck } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { toast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

interface InventoryItem {
  id: string; medication_name: string; presentation: string | null;
  current_stock: number; min_stock: number; unit: string;
}
interface Confirmation {
  id: string; confirmed_at: string; notes: string | null;
  confirmed_by: string;
}

export default function ConfirmacionInventario() {
  const { id: unitId } = useParams<{ id: string }>();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [unitName, setUnitName] = useState("");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [lastConf, setLastConf] = useState<Confirmation | null>(null);
  const [reported, setReported] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<Confirmation[]>([]);
  const [historyItems, setHistoryItems] = useState<Record<string, number>>({});
  const [historyDetailId, setHistoryDetailId] = useState<string | null>(null);

  useEffect(() => {
    if (!unitId) return;
    (async () => {
      const { data: u } = await (supabase.from as any)("health_units").select("name").eq("id", unitId).maybeSingle();
      setUnitName((u as any)?.name ?? "");
    })();
  }, [unitId]);

  useEffect(() => {
    if (!unitId) return;
    (async () => {
      const { data: inv } = await (supabase.from as any)("medication_inventory")
        .select("id, medication_name, presentation, current_stock, min_stock, unit")
        .eq("health_unit_id", unitId).order("medication_name");
      setItems((inv as any) || []);
      const init: Record<string, number> = {};
      for (const i of (inv as any[] || [])) init[i.id] = i.current_stock;
      setReported(init);

      const { data: conf } = await (supabase.from as any)("inventory_confirmations")
        .select("*").eq("health_unit_id", unitId)
        .order("confirmed_at", { ascending: false }).limit(1).maybeSingle();
      setLastConf((conf as any) || null);
    })();
  }, [unitId]);

  const daysSinceLast = lastConf ? differenceInDays(new Date(), new Date(lastConf.confirmed_at)) : null;
  const isOverdue = daysSinceLast !== null && daysSinceLast >= 3;

  function updateReported(id: string, val: number) {
    setReported({ ...reported, [id]: val });
  }

  async function saveConfirmation() {
    if (!unitId || !user) return;
    setSaving(true);
    const { data: conf, error } = await (supabase.from as any)("inventory_confirmations").insert({
      health_unit_id: unitId, confirmed_by: user.id, notes: notes || null,
    }).select().single();
    if (error || !conf) { toast({ title: "Error", description: error?.message, variant: "destructive" }); setSaving(false); return; }
    for (const item of items) {
      const reportedQty = reported[item.id] ?? item.current_stock;
      await (supabase.from as any)("inventory_confirmation_items").insert({
        confirmation_id: conf.id, inventory_id: item.id, reported_stock: reportedQty,
      });
      if (reportedQty !== item.current_stock) {
        const diff = reportedQty - item.current_stock;
        await (supabase.from as any)("medication_inventory").update({ current_stock: reportedQty }).eq("id", item.id);
        await (supabase.from as any)("inventory_movements").insert({
          inventory_id: item.id, health_unit_id: unitId,
          movement_type: diff > 0 ? "entry" : "exit", quantity: Math.abs(diff),
          reference_type: "adjustment", notes: "Ajuste por confirmación de inventario",
          created_by: user.id,
        });
      }
    }
    toast({ title: "Inventario confirmado" });
    setLastConf({ id: conf.id, confirmed_at: conf.confirmed_at, notes: conf.notes, confirmed_by: user.id });
    setSaving(false);
  }

  async function loadHistory() {
    if (!unitId) return;
    const { data } = await (supabase.from as any)("inventory_confirmations")
      .select("*").eq("health_unit_id", unitId)
      .order("confirmed_at", { ascending: false });
    setHistory((data as any) || []);
    setHistoryOpen(true);
  }

  async function loadHistoryDetail(confId: string) {
    const { data } = await (supabase.from as any)("inventory_confirmation_items")
      .select("inventory_id, reported_stock, medication_inventory(medication_name)")
      .eq("confirmation_id", confId);
    const map: Record<string, number> = {};
    for (const r of (data as any[] || [])) {
      map[r.inventory_id] = r.reported_stock;
    }
    setHistoryItems(map);
    setHistoryDetailId(confId);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/synapsia/unidades/${unitId}`)}><ArrowLeft className="w-4 h-4" /></Button>
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold">Confirmación de inventario — {unitName}</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadHistory}><ClipboardCheck className="w-4 h-4 mr-1" /> Historial</Button>
            <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {isOverdue && (
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="py-3 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <p className="font-medium text-sm">Confirmación atrasada</p>
                <p className="text-xs text-muted-foreground">Última confirmación hace {daysSinceLast} días. Debe confirmarse cada 3 días.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {lastConf && !isOverdue && (
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="py-3 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              <div>
                <p className="font-medium text-sm">Última confirmación: {format(new Date(lastConf.confirmed_at), "PPp", { locale: es })}</p>
                <p className="text-xs text-muted-foreground">Confirmado hace {daysSinceLast} día(s)</p>
              </div>
            </CardContent>
          </Card>
        )}

        {items.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">No hay medicamentos en el inventario de esta unidad.</CardContent></Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Registra el stock actual de cada medicamento</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medicamento</TableHead>
                      <TableHead>Presentación</TableHead>
                      <TableHead className="text-right">Stock en sistema</TableHead>
                      <TableHead className="text-right">Stock reportado</TableHead>
                      <TableHead className="text-center">Unidad</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map(item => (
                      <TableRow key={item.id} className={reported[item.id] !== item.current_stock ? "bg-amber-500/5" : ""}>
                        <TableCell className="font-medium">{item.medication_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.presentation || "—"}</TableCell>
                        <TableCell className="text-right">{item.current_stock}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number" min="0" className="w-24 text-right h-8 ml-auto"
                            value={reported[item.id] ?? item.current_stock}
                            onChange={(e) => updateReported(item.id, parseInt(e.target.value) || 0)}
                          />
                        </TableCell>
                        <TableCell className="text-center">{item.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex items-start gap-3">
              <div className="flex-1">
                <Label>Notas (opcional)</Label>
                <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Novedades durante el conteo..." />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={saveConfirmation} disabled={saving}>
                {saving ? "Guardando..." : "Confirmar inventario"}
              </Button>
            </div>
          </>
        )}
      </main>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Historial de confirmaciones</DialogTitle></DialogHeader>
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Sin confirmaciones previas.</p>
          ) : (
            <div className="space-y-2">
              {history.map(h => (
                <Card key={h.id} className="cursor-pointer hover:shadow-sm" onClick={() => loadHistoryDetail(h.id)}>
                  <CardContent className="py-2 text-sm flex items-center justify-between">
                    <span>{format(new Date(h.confirmed_at), "PPp", { locale: es })}</span>
                    {historyDetailId === h.id && Object.keys(historyItems).length > 0 && (
                      <span className="text-xs text-muted-foreground">{Object.keys(historyItems).length} items</span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
