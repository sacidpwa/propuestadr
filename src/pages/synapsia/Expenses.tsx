import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Brain, DollarSign, Loader2, LogOut, Plus, Trash2, Wallet } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface FixedExpense { id: string; name: string; category: string | null; default_amount: number; is_active: boolean; }
interface Entry { id: string; description: string; amount: number; expense_date: string; period_year: number; period_month: number; category: string | null; fixed_expense_id: string | null; }
interface PartnerSpec { id: string; full_name: string; is_partner: boolean; }
interface Payment { amount: number; created_at: string; visit_id: string; visits?: { specialist_id: string } | null; }

const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export default function Expenses() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const [fixed, setFixed] = useState<FixedExpense[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [partners, setPartners] = useState<PartnerSpec[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  const [openFixed, setOpenFixed] = useState(false);
  const [fixedForm, setFixedForm] = useState({ name: "", category: "", default_amount: "" });

  const [openEntry, setOpenEntry] = useState(false);
  const [entryForm, setEntryForm] = useState({
    fixed_expense_id: "", description: "", amount: "",
    expense_date: format(today, "yyyy-MM-dd"), category: "",
  });

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [year, month]);

  const fetchAll = async () => {
    const monthStart = new Date(year, month - 1, 1).toISOString();
    const monthEnd = new Date(year, month, 1).toISOString();
    const [{ data: f }, { data: e }, { data: s }, { data: p }] = await Promise.all([
      supabase.from("fixed_expenses").select("*").order("name"),
      supabase.from("expense_entries").select("*").eq("period_year", year).eq("period_month", month).order("expense_date", { ascending: false }),
      supabase.from("specialists").select("id, full_name, is_partner").eq("is_partner", true).eq("is_active", true),
      supabase.from("payments").select("amount, created_at, visit_id, visits(specialist_id)").gte("created_at", monthStart).lt("created_at", monthEnd),
    ]);
    setFixed((f as any) || []);
    setEntries((e as any) || []);
    setPartners((s as any) || []);
    setPayments((p as any) || []);
  };

  const saveFixed = async (ex: React.FormEvent) => {
    ex.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("fixed_expenses").insert({
      name: fixedForm.name,
      category: fixedForm.category || null,
      default_amount: parseFloat(fixedForm.default_amount || "0"),
    });
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: "Gasto fijo agregado" }); setOpenFixed(false); setFixedForm({ name: "", category: "", default_amount: "" }); fetchAll(); }
    setLoading(false);
  };

  const toggleFixed = async (id: string, value: boolean) => {
    await supabase.from("fixed_expenses").update({ is_active: value }).eq("id", id);
    fetchAll();
  };

  const applyMonth = async () => {
    setLoading(true);
    const active = fixed.filter(f => f.is_active);
    const existingNames = new Set(entries.filter(e => e.fixed_expense_id).map(e => e.fixed_expense_id));
    const toInsert = active.filter(f => !existingNames.has(f.id)).map(f => ({
      fixed_expense_id: f.id,
      description: f.name,
      amount: f.default_amount,
      expense_date: format(new Date(year, month - 1, 1), "yyyy-MM-dd"),
      period_year: year,
      period_month: month,
      category: f.category,
      created_by: user?.id,
    }));
    if (toInsert.length === 0) { toast({ title: "Sin nuevos gastos por aplicar" }); setLoading(false); return; }
    const { error } = await supabase.from("expense_entries").insert(toInsert);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: `${toInsert.length} gastos aplicados` }); fetchAll(); }
    setLoading(false);
  };

  const saveEntry = async (ex: React.FormEvent) => {
    ex.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("expense_entries").insert({
      fixed_expense_id: entryForm.fixed_expense_id || null,
      description: entryForm.description,
      amount: parseFloat(entryForm.amount),
      expense_date: entryForm.expense_date,
      period_year: year,
      period_month: month,
      category: entryForm.category || null,
      created_by: user?.id,
    });
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: "Gasto registrado" }); setOpenEntry(false); setEntryForm({ fixed_expense_id: "", description: "", amount: "", expense_date: format(today, "yyyy-MM-dd"), category: "" }); fetchAll(); }
    setLoading(false);
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("¿Eliminar gasto?")) return;
    await supabase.from("expense_entries").delete().eq("id", id);
    fetchAll();
  };

  const totalGastos = useMemo(() => entries.reduce((s, e) => s + Number(e.amount), 0), [entries]);
  const cuotaPorSocio = partners.length > 0 ? totalGastos / partners.length : 0;

  const reporte = useMemo(() => {
    return partners.map(p => {
      const ingresos = payments
        .filter(pay => pay.visits?.specialist_id === p.id)
        .reduce((s, pay) => s + Number(pay.amount), 0);
      const neto = ingresos - cuotaPorSocio;
      return { ...p, ingresos, gastos: cuotaPorSocio, neto };
    });
  }, [partners, payments, cuotaPorSocio]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/synapsia/admin")}><ArrowLeft className="w-4 h-4" /></Button>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"><Brain className="w-5 h-5 text-primary-foreground" /></div>
            <div><h1 className="text-lg font-bold">Gastos & Reporte de socios</h1><p className="text-xs text-muted-foreground">{user?.email}</p></div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Periodo:</Label>
            <Select value={String(month)} onValueChange={v => setMonth(parseInt(v))}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" className="w-24" value={year} onChange={e => setYear(parseInt(e.target.value || "0"))} />
          </div>
          <Button variant="outline" onClick={applyMonth} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar gastos fijos del mes"}
          </Button>
        </div>

        <Tabs defaultValue="movs">
          <TabsList>
            <TabsTrigger value="movs">Movimientos</TabsTrigger>
            <TabsTrigger value="catalog">Catálogo de gastos fijos</TabsTrigger>
            <TabsTrigger value="report">Reporte por socio</TabsTrigger>
          </TabsList>

          <TabsContent value="movs" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={openEntry} onOpenChange={setOpenEntry}>
                <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nuevo gasto</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Registrar gasto</DialogTitle></DialogHeader>
                  <form onSubmit={saveEntry} className="space-y-3">
                    <div className="space-y-2">
                      <Label>Gasto fijo (opcional)</Label>
                      <Select value={entryForm.fixed_expense_id} onValueChange={v => {
                        const f = fixed.find(x => x.id === v);
                        setEntryForm({ ...entryForm, fixed_expense_id: v, description: f?.name || entryForm.description, amount: f ? String(f.default_amount) : entryForm.amount, category: f?.category || entryForm.category });
                      }}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar (o dejar vacío)" /></SelectTrigger>
                        <SelectContent>{fixed.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Descripción *</Label><Input required value={entryForm.description} onChange={e => setEntryForm({ ...entryForm, description: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2"><Label>Monto *</Label><Input type="number" step="0.01" required value={entryForm.amount} onChange={e => setEntryForm({ ...entryForm, amount: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Fecha *</Label><Input type="date" required value={entryForm.expense_date} onChange={e => setEntryForm({ ...entryForm, expense_date: e.target.value })} /></div>
                    </div>
                    <div className="space-y-2"><Label>Categoría</Label><Input value={entryForm.category} onChange={e => setEntryForm({ ...entryForm, category: e.target.value })} /></div>
                    <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Gastos del periodo — Total: ${totalGastos.toLocaleString()}</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Descripción</TableHead><TableHead>Categoría</TableHead><TableHead className="text-right">Monto</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {entries.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Sin movimientos</TableCell></TableRow>
                      : entries.map(e => (
                        <TableRow key={e.id}>
                          <TableCell className="text-sm">{format(new Date(e.expense_date), "dd MMM", { locale: es })}</TableCell>
                          <TableCell>{e.description}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{e.category || "—"}</TableCell>
                          <TableCell className="text-right font-mono">${Number(e.amount).toLocaleString()}</TableCell>
                          <TableCell><Button size="icon" variant="ghost" onClick={() => deleteEntry(e.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="catalog" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={openFixed} onOpenChange={setOpenFixed}>
                <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nuevo gasto fijo</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Gasto fijo recurrente</DialogTitle></DialogHeader>
                  <form onSubmit={saveFixed} className="space-y-3">
                    <div className="space-y-2"><Label>Nombre *</Label><Input required value={fixedForm.name} onChange={e => setFixedForm({ ...fixedForm, name: e.target.value })} placeholder="Renta, Luz, Internet…" /></div>
                    <div className="space-y-2"><Label>Categoría</Label><Input value={fixedForm.category} onChange={e => setFixedForm({ ...fixedForm, category: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Monto mensual *</Label><Input type="number" step="0.01" required value={fixedForm.default_amount} onChange={e => setFixedForm({ ...fixedForm, default_amount: e.target.value })} /></div>
                    <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Agregar"}</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Categoría</TableHead><TableHead className="text-right">Monto</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {fixed.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Sin gastos fijos</TableCell></TableRow>
                      : fixed.map(f => (
                        <TableRow key={f.id}>
                          <TableCell className="font-medium">{f.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{f.category || "—"}</TableCell>
                          <TableCell className="text-right font-mono">${Number(f.default_amount).toLocaleString()}</TableCell>
                          <TableCell><Button size="sm" variant={f.is_active ? "default" : "outline"} onClick={() => toggleFixed(f.id, !f.is_active)}>{f.is_active ? "Activo" : "Inactivo"}</Button></TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="report" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Estado de resultados — {MONTHS[month - 1]} {year}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Total gastos: <strong>${totalGastos.toLocaleString()}</strong> · Socios activos: <strong>{partners.length}</strong> · Cuota por socio: <strong>${cuotaPorSocio.toLocaleString(undefined,{maximumFractionDigits:2})}</strong>
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Socio</TableHead><TableHead className="text-right">Ingresos (consultas)</TableHead><TableHead className="text-right">Gastos prorrateados</TableHead><TableHead className="text-right">Neto</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {reporte.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No hay socios marcados como tales</TableCell></TableRow>
                      : reporte.map(r => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.full_name}</TableCell>
                          <TableCell className="text-right font-mono text-green-700">${r.ingresos.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono text-red-700">−${r.gastos.toLocaleString(undefined,{maximumFractionDigits:2})}</TableCell>
                          <TableCell className={`text-right font-mono font-bold ${r.neto >= 0 ? "text-green-700" : "text-red-700"}`}>${r.neto.toLocaleString(undefined,{maximumFractionDigits:2})}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
