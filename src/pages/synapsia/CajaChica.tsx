import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, LogOut, Plus, Trash2, Loader2, PiggyBank, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { fmt } from "@/lib/utils";

interface Movement {
  id: string; type: string; amount: number; category: string | null;
  description: string | null; reference_date: string; created_by: string | null;
  created_at: string;
}

const TYPE_LABEL: Record<string, string> = { apertura: "Apertura", entrada: "Entrada", salida: "Salida" };
const TYPE_STYLE: Record<string, string> = {
  apertura: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  entrada: "bg-green-500/10 text-green-700 border-green-500/30",
  salida: "bg-red-500/10 text-red-700 border-red-500/30",
};

const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export default function CajaChica() {
  const { id: unitId } = useParams<{ id: string }>();
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const [unitName, setUnitName] = useState("");
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("movimientos");

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: "entrada", amount: 0, category: "", description: "", date: format(now, "yyyy-MM-dd") });

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
      setLoading(true);
      const { data } = await (supabase.from as any)("petty_cash")
        .select("*")
        .eq("health_unit_id", unitId)
        .order("reference_date", { ascending: false })
        .order("created_at", { ascending: false });
      setMovements((data as any) || []);
      setLoading(false);
    })();
  }, [unitId]);

  const balance = useMemo(() => {
    let b = 0;
    for (const m of [...movements].reverse()) {
      if (m.type === "apertura" || m.type === "entrada") b += Number(m.amount);
      else b -= Number(m.amount);
    }
    return b;
  }, [movements]);

  const filteredByMonth = useMemo(() => {
    return movements.filter(m => {
      const d = new Date(m.reference_date);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });
  }, [movements, month, year]);

  const summary = useMemo(() => {
    const map = new Map<string, { entradas: number; salidas: number }>();
    for (const m of filteredByMonth) {
      if (m.type === "apertura") continue;
      const cat = m.category || "Sin categoría";
      if (!map.has(cat)) map.set(cat, { entradas: 0, salidas: 0 });
      const entry = map.get(cat)!;
      if (m.type === "entrada") entry.entradas += Number(m.amount);
      else entry.salidas += Number(m.amount);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredByMonth]);

  const monthTotal = useMemo(() => {
    let e = 0, s = 0;
    for (const m of filteredByMonth) {
      if (m.type === "apertura") continue;
      if (m.type === "entrada") e += Number(m.amount);
      else s += Number(m.amount);
    }
    return { entradas: e, salidas: s };
  }, [filteredByMonth]);

  function defaultForm() {
    return { type: "entrada", amount: 0, category: "", description: "", date: format(new Date(), "yyyy-MM-dd") };
  }

  async function save() {
    if (!unitId || !user) return;
    if (!form.amount || form.amount <= 0) { toast({ title: "Monto inválido", variant: "destructive" }); return; }
    if (form.type !== "apertura" && !form.category.trim()) { toast({ title: "Categoría requerida", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await (supabase.from as any)("petty_cash").insert({
      health_unit_id: unitId,
      type: form.type,
      amount: form.amount,
      category: form.category.trim() || null,
      description: form.description.trim() || null,
      reference_date: form.date,
      created_by: user.id,
    });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Movimiento registrado" });
    setOpen(false);
    setForm(defaultForm());
    const { data } = await (supabase.from as any)("petty_cash")
      .select("*")
      .eq("health_unit_id", unitId)
      .order("reference_date", { ascending: false })
      .order("created_at", { ascending: false });
    setMovements((data as any) || []);
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este movimiento?")) return;
    const { error } = await (supabase.from as any)("petty_cash").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setMovements(prev => prev.filter(m => m.id !== id));
  }

  function openNew() {
    setForm({ ...defaultForm(), type: movements.length === 0 ? "apertura" : "entrada" });
    setOpen(true);
  }

  const canEdit = hasRole("admin") || hasRole("dueno") || hasRole("administrativo") || hasRole("contador");
  const canDelete = hasRole("admin") || hasRole("dueno");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/synapsia/unidades/${unitId}`)}><ArrowLeft className="w-4 h-4" /></Button>
            <PiggyBank className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold">Caja Chica — {unitName}</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">Saldo actual</p>
              <p className={`text-2xl font-bold ${balance >= 0 ? "text-green-700" : "text-red-700"}`}>{fmt(balance)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">Entradas ({MONTHS[month - 1]})</p>
              <p className="text-xl font-bold text-green-700">{fmt(monthTotal.entradas)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">Salidas ({MONTHS[month - 1]})</p>
              <p className="text-xl font-bold text-red-700">{fmt(monthTotal.salidas)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
              <TabsTrigger value="resumen">Resumen mensual</TabsTrigger>
            </TabsList>
          </Tabs>
          {canEdit && <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Nuevo movimiento</Button>}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); }}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[100px] text-center">{MONTHS[month - 1]} {year}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); }}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <Dialog open={open} onOpenChange={v => { if (!v) { setForm(defaultForm()); } setOpen(v); }}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Nuevo movimiento</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {movements.length === 0 && <SelectItem value="apertura">Apertura (saldo inicial)</SelectItem>}
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="salida">Salida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Monto</Label><Input type="number" min="0" step="0.01" value={form.amount || ""} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} /></div>
              {form.type !== "apertura" && <div><Label>Categoría</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Ej: Papelería, Transporte, Café..." /></div>}
              <div><Label>Descripción (opcional)</Label><Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Fecha</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setOpen(false); setForm(defaultForm()); }}>Cancelar</Button>
              <Button onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {tab === "movimientos" && (
          <div className="space-y-2">
            {loading && <Card><CardContent className="py-10 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></CardContent></Card>}
            {!loading && filteredByMonth.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">Sin movimientos este mes.</CardContent></Card>}
            {!loading && filteredByMonth.map(m => (
              <Card key={m.id}>
                <CardContent className="py-3 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`capitalize ${TYPE_STYLE[m.type]}`}>{TYPE_LABEL[m.type]}</Badge>
                      <span className="text-xs text-muted-foreground">{format(new Date(m.reference_date), "PP", { locale: es })}</span>
                      {m.category && <span className="text-xs text-muted-foreground">· {m.category}</span>}
                    </div>
                    {m.description && <p className="text-sm mt-1">{m.description}</p>}
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <p className={`font-bold text-base ${m.type === "salida" ? "text-red-600" : m.type === "entrada" ? "text-green-600" : ""}`}>
                      {m.type === "salida" ? "-" : "+"}{fmt(Number(m.amount))}
                    </p>
                    {canDelete && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(m.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {tab === "resumen" && (
          <Card>
            <CardContent className="py-4">
              {summary.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">Sin movimientos este mes.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-2 font-medium">Categoría</th>
                        <th className="text-right py-2 font-medium">Entradas</th>
                        <th className="text-right py-2 font-medium">Salidas</th>
                        <th className="text-right py-2 font-medium">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.map(([cat, vals]) => {
                        const bal = vals.entradas - vals.salidas;
                        return (
                          <tr key={cat} className="border-b last:border-0">
                            <td className="py-2">{cat}</td>
                            <td className="text-right py-2 text-green-600">{fmt(vals.entradas)}</td>
                            <td className="text-right py-2 text-red-600">{fmt(vals.salidas)}</td>
                            <td className={`text-right py-2 font-medium ${bal >= 0 ? "text-green-700" : "text-red-700"}`}>{fmt(bal)}</td>
                          </tr>
                        );
                      })}
                      <tr className="border-t-2 font-semibold">
                        <td className="py-2">Total</td>
                        <td className="text-right py-2 text-green-700">{fmt(monthTotal.entradas)}</td>
                        <td className="text-right py-2 text-red-700">{fmt(monthTotal.salidas)}</td>
                        <td className={`text-right py-2 ${monthTotal.entradas - monthTotal.salidas >= 0 ? "text-green-700" : "text-red-700"}`}>
                          {fmt(monthTotal.entradas - monthTotal.salidas)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
