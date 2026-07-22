import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, LogOut, Pill, Plus, Utensils, Search } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { toast } from "@/hooks/use-toast";
import { format, startOfWeek, addDays } from "date-fns";
import { es } from "date-fns/locale";

interface HealthUnit { id: string; name: string; }
interface Patient { id: string; full_name: string; health_unit_id: string | null; }
interface MedLog {
  id: string; patient_id: string; log_type: string; medication: string | null;
  dose: string | null; route: string | null; description: string | null;
  event_at: string; recorded_by: string; notes: string | null;
}

const LOG_TYPES = [
  { value: "medicamento", label: "Medicamento" },
  { value: "estudio", label: "Estudio" },
  { value: "consulta", label: "Consulta" },
  { value: "salida", label: "Salida" },
  { value: "otro", label: "Otro" },
];
const MEALS = [
  { key: "desayuno", label: "Desayuno" },
  { key: "colacion_am", label: "Colación AM" },
  { key: "comida", label: "Comida" },
  { key: "colacion_pm", label: "Colación PM" },
  { key: "cena", label: "Cena" },
];

export default function Enfermeria() {
  const { id: unitId } = useParams<{ id: string }>();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [unit, setUnit] = useState<HealthUnit | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState<MedLog[]>([]);
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState({ log_type: "medicamento", medication: "", dose: "", route: "", description: "", notes: "", event_at: format(new Date(), "yyyy-MM-dd'T'HH:mm") });

  // Menus
  const [weekStart, setWeekStart] = useState(() => format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"));
  const [menu, setMenu] = useState<Record<number, any>>({});

  useEffect(() => {
    if (!unitId) return;
    (async () => {
      const { data: u } = await (supabase.from as any)("health_units").select("id,name").eq("id", unitId).maybeSingle();
      setUnit((u as any) || null);
      const { data: p } = await supabase.from("patients").select("id, full_name, health_unit_id").eq("health_unit_id", unitId).order("full_name");
      setPatients((p as any) || []);
    })();
  }, [unitId]);

  useEffect(() => {
    const pid = params.get("patient");
    if (pid) setSelectedPatient(pid);
  }, [params]);

  useEffect(() => {
    if (!selectedPatient) { setLogs([]); return; }
    loadLogs();
  }, [selectedPatient]);

  useEffect(() => { if (unitId) loadMenu(); }, [unitId, weekStart, selectedPatient]);

  async function loadLogs() {
    const { data } = await (supabase.from as any)("medication_log").select("*").eq("patient_id", selectedPatient).order("event_at", { ascending: false }).limit(200);
    setLogs((data as any) || []);
  }

  async function loadMenu() {
    const q = (supabase.from as any)("meal_plans").select("*").eq("health_unit_id", unitId).eq("week_start", weekStart);
    const { data } = selectedPatient ? await q.or(`patient_id.eq.${selectedPatient},patient_id.is.null`) : await q.is("patient_id", null);
    const map: Record<number, any> = {};
    (data || []).forEach((r: any) => { if (!map[r.day_of_week] || r.patient_id) map[r.day_of_week] = r; });
    setMenu(map);
  }

  const filteredPatients = useMemo(() => patients.filter(p => p.full_name.toLowerCase().includes(search.toLowerCase())), [patients, search]);

  async function saveLog() {
    if (!selectedPatient || !unitId || !user) return;
    const payload: any = {
      patient_id: selectedPatient,
      health_unit_id: unitId,
      log_type: form.log_type,
      medication: form.medication || null,
      dose: form.dose || null,
      route: form.route || null,
      description: form.description || null,
      notes: form.notes || null,
      event_at: new Date(form.event_at).toISOString(),
      recorded_by: user.id,
    };
    const { error } = await (supabase.from as any)("medication_log").insert(payload);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    if (form.log_type === "medicamento" && form.medication) {
      const patient = patients.find(p => p.id === selectedPatient);
      await (supabase.from as any)("patient_invoices").insert({
        patient_id: selectedPatient,
        patient_name: patient?.full_name || "—",
        health_unit_id: unitId,
        amount: 0,
        concept: `MEDICAMENTO - ${form.medication.toUpperCase()}${form.dose ? ` (${form.dose})` : ""}`,
        invoice_date: form.event_at.slice(0, 10),
        status: "pendiente",
        uploaded_by: user.id,
        source: "medication",
        source_id: null,
      });
    }
    toast({ title: "Registrado" });
    setNewOpen(false);
    setForm({ log_type: "medicamento", medication: "", dose: "", route: "", description: "", notes: "", event_at: format(new Date(), "yyyy-MM-dd'T'HH:mm") });
    loadLogs();
  }

  async function saveMenuDay(day: number, field: string, value: string) {
    if (!unitId || !user) return;
    const existing = menu[day];
    if (existing) {
      const { error } = await (supabase.from as any)("meal_plans").update({ [field]: value }).eq("id", existing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    } else {
      const { data, error } = await (supabase.from as any)("meal_plans").insert({
        health_unit_id: unitId, patient_id: selectedPatient, week_start: weekStart, day_of_week: day, [field]: value, created_by: user.id,
      }).select().single();
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      setMenu(m => ({ ...m, [day]: data }));
      return;
    }
    setMenu(m => ({ ...m, [day]: { ...existing, [field]: value } }));
  }

  async function markIntake(day: number, mealKey: string, consumed: boolean) {
    if (!selectedPatient || !unitId || !user) return;
    const date = format(addDays(new Date(weekStart), day), "yyyy-MM-dd");
    const { error } = await (supabase.from as any)("meal_intake").insert({
      patient_id: selectedPatient, health_unit_id: unitId, intake_date: date, meal: mealKey, consumed, recorded_by: user.id,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: consumed ? "Marcado como consumido" : "Marcado como no consumido" });
  }

  const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/synapsia/unidades/${unitId}`)}><ArrowLeft className="w-4 h-4" /></Button>
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold">Enfermería — {unit?.name}</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid lg:grid-cols-[280px_1fr] gap-6">
        <aside className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Pacientes</CardTitle>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
                <Input className="pl-8 h-9" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent className="p-2 max-h-[70vh] overflow-y-auto space-y-1">
              {filteredPatients.map(p => (
                <button key={p.id} onClick={() => { setSelectedPatient(p.id); setParams({ patient: p.id }); }}
                  className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-accent ${selectedPatient === p.id ? "bg-accent font-medium" : ""}`}>
                  {p.full_name}
                </button>
              ))}
              {filteredPatients.length === 0 && <p className="text-xs text-muted-foreground p-3">Sin pacientes en esta unidad.</p>}
            </CardContent>
          </Card>
        </aside>

        <section>
          {!selectedPatient ? (
            <Card><CardContent className="py-16 text-center text-muted-foreground">Selecciona un paciente para ver su hoja de enfermería.</CardContent></Card>
          ) : (
            <Tabs defaultValue="log">
              <TabsList>
                <TabsTrigger value="log"><Pill className="w-4 h-4 mr-1" /> Hoja de control</TabsTrigger>
                <TabsTrigger value="menu"><Utensils className="w-4 h-4 mr-1" /> Menú semanal</TabsTrigger>
              </TabsList>

              <TabsContent value="log" className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Registro</h3>
                  <Dialog open={newOpen} onOpenChange={setNewOpen}>
                    <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nuevo registro</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Nuevo registro</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Tipo</Label>
                            <Select value={form.log_type} onValueChange={v => setForm({ ...form, log_type: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>{LOG_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Fecha y hora</Label>
                            <Input type="datetime-local" value={form.event_at} onChange={e => setForm({ ...form, event_at: e.target.value })} />
                          </div>
                        </div>
                        {form.log_type === "medicamento" && (
                          <div className="grid grid-cols-3 gap-3">
                            <div><Label>Medicamento</Label><Input value={form.medication} onChange={e => setForm({ ...form, medication: e.target.value })} /></div>
                            <div><Label>Dosis</Label><Input value={form.dose} onChange={e => setForm({ ...form, dose: e.target.value })} /></div>
                            <div><Label>Vía</Label><Input value={form.route} onChange={e => setForm({ ...form, route: e.target.value })} placeholder="oral, IV..." /></div>
                          </div>
                        )}
                        <div><Label>Descripción</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ej. salida a consulta externa" /></div>
                        <div><Label>Notas</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                        <Button onClick={saveLog} className="w-full">Guardar</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="space-y-2">
                  {logs.length === 0 && <p className="text-sm text-muted-foreground">Sin registros aún.</p>}
                  {logs.map(l => (
                    <Card key={l.id}>
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="capitalize">{l.log_type}</Badge>
                              <span className="text-xs text-muted-foreground">{format(new Date(l.event_at), "PPpp", { locale: es })}</span>
                            </div>
                            <div className="text-sm mt-1">
                              {l.medication && <span className="font-medium">{l.medication}</span>}
                              {l.dose && <span className="text-muted-foreground"> · {l.dose}</span>}
                              {l.route && <span className="text-muted-foreground"> · {l.route}</span>}
                            </div>
                            {l.description && <p className="text-sm text-muted-foreground">{l.description}</p>}
                            {l.notes && <p className="text-xs text-muted-foreground italic">{l.notes}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="menu" className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">Menú semanal</h3>
                    <p className="text-xs text-muted-foreground">Semana del {format(new Date(weekStart), "PP", { locale: es })}</p>
                  </div>
                  <Input type="date" value={weekStart} onChange={e => setWeekStart(format(startOfWeek(new Date(e.target.value), { weekStartsOn: 1 }), "yyyy-MM-dd"))} className="w-48" />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-muted">
                        <th className="text-left p-2 border">Día</th>
                        {MEALS.map(m => <th key={m.key} className="text-left p-2 border">{m.label}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {days.map((d, idx) => (
                        <tr key={idx}>
                          <td className="p-2 border font-medium bg-muted/40 align-top">{d}<div className="text-xs text-muted-foreground font-normal">{format(addDays(new Date(weekStart), idx), "dd/MM")}</div></td>
                          {MEALS.map(m => (
                            <td key={m.key} className="p-1 border align-top min-w-[140px]">
                              <Textarea
                                rows={2}
                                className="text-xs min-h-[60px]"
                                value={menu[idx]?.[m.key] ?? ""}
                                onChange={e => setMenu(mm => ({ ...mm, [idx]: { ...(mm[idx] || {}), [m.key]: e.target.value } }))}
                                onBlur={e => saveMenuDay(idx, m.key, e.target.value)}
                              />
                              <label className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1 cursor-pointer">
                                <Checkbox onCheckedChange={(c) => markIntake(idx, m.key, !!c)} /> consumido
                              </label>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </section>
      </main>
    </div>
  );
}
