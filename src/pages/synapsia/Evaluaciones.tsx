import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, LogOut, Plus, Save, Trash2, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import synapsiaIcon from "@/assets/synapsia-icon.svg";

interface HealthUnit { id: string; name: string; }
interface Evaluation {
  id: string;
  interview_date: string;
  full_name: string;
  position: string;
  health_unit_id: string | null;
  reports_to: string | null;
  team_in_charge: string | null;
  info_received: string | null;
  info_processing: string | null;
  info_generated: string | null;
  tools_used: string | null;
  frequency: string | null;
  pain_points: string | null;
  observations: string | null;
}

const empty = {
  interview_date: new Date().toISOString().slice(0, 10),
  full_name: "",
  position: "",
  health_unit_id: "",
  reports_to: "",
  team_in_charge: "",
  info_received: "",
  info_processing: "",
  info_generated: "",
  tools_used: "",
  frequency: "",
  pain_points: "",
  observations: "",
};

const DRAFT_KEY = "synapsia:evaluaciones:draft";

export default function Evaluaciones() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [units, setUnits] = useState<HealthUnit[]>([]);
  const [items, setItems] = useState<Evaluation[]>([]);
  const [form, setForm] = useState<typeof empty>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastDraftAt, setLastDraftAt] = useState<Date | null>(null);

  const load = async () => {
    const [u, e] = await Promise.all([
      (supabase.from as any)("health_units").select("id,name").order("name"),
      (supabase.from as any)("staff_evaluations").select("*").order("interview_date", { ascending: false }),
    ]);
    setUnits((u.data as any) || []);
    setItems((e.data as any) || []);
  };

  useEffect(() => { load(); }, []);

  // Restaurar borrador local si existe (sobrevive a sesión expirada)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.form && (parsed.form.full_name || parsed.form.position || parsed.form.info_received || parsed.form.info_processing || parsed.form.info_generated)) {
        setForm(parsed.form);
        setEditingId(parsed.editingId || null);
        setShowForm(true);
        if (parsed.savedAt) setLastDraftAt(new Date(parsed.savedAt));
        toast.info("Borrador recuperado del autoguardado");
      }
    } catch {}
  }, []);

  // Autoguardado local cada 20s mientras hay contenido
  useEffect(() => {
    if (!showForm) return;
    const hasContent = !!(form.full_name || form.position || form.info_received || form.info_processing || form.info_generated || form.team_in_charge || form.reports_to || form.tools_used || form.pain_points || form.observations);
    if (!hasContent) return;
    const tick = () => {
      try {
        const savedAt = new Date().toISOString();
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, editingId, savedAt }));
        setLastDraftAt(new Date(savedAt));
      } catch {}
    };
    const id = setInterval(tick, 20000);
    return () => clearInterval(id);
  }, [form, editingId, showForm]);

  const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch {} setLastDraftAt(null); };

  const reset = () => { setForm(empty); setEditingId(null); setShowForm(false); clearDraft(); };

  const save = async () => {
    if (!form.full_name.trim() || !form.position.trim()) {
      toast.error("Nombre y puesto son obligatorios");
      return;
    }
    setSaving(true);
    const payload: any = {
      ...form,
      health_unit_id: form.health_unit_id || null,
      interviewer_id: user?.id,
    };
    const { error } = editingId
      ? await (supabase.from as any)("staff_evaluations").update(payload).eq("id", editingId)
      : await (supabase.from as any)("staff_evaluations").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editingId ? "Evaluación actualizada" : "Evaluación registrada");
    reset();
    load();
  };

  const edit = (e: Evaluation) => {
    setForm({
      interview_date: e.interview_date,
      full_name: e.full_name,
      position: e.position,
      health_unit_id: e.health_unit_id || "",
      reports_to: e.reports_to || "",
      team_in_charge: e.team_in_charge || "",
      info_received: e.info_received || "",
      info_processing: e.info_processing || "",
      info_generated: e.info_generated || "",
      tools_used: e.tools_used || "",
      frequency: e.frequency || "",
      pain_points: e.pain_points || "",
      observations: e.observations || "",
    });
    setEditingId(e.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta evaluación?")) return;
    const { error } = await (supabase.from as any)("staff_evaluations").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Eliminada");
    load();
  };

  const setF = (k: keyof typeof empty, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/synapsia")}><ArrowLeft className="w-4 h-4" /></Button>
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold">Evaluación de personal administrativo</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Entrevistas</h2>
            <p className="text-sm text-muted-foreground">Registra cómo cada colaborador recibe, procesa y genera información por complejo de salud.</p>
          </div>
          {!showForm && (
            <Button onClick={() => { setForm(empty); setEditingId(null); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Nueva evaluación
            </Button>
          )}
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? "Editar evaluación" : "Nueva evaluación"}</CardTitle>
              <CardDescription>
                Completa la información levantada durante la entrevista.
                {lastDraftAt && (
                  <span className="block text-xs text-emerald-600 mt-1">
                    ✓ Borrador autoguardado a las {lastDraftAt.toLocaleTimeString("es-MX")}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Fecha de entrevista</Label>
                  <Input type="date" value={form.interview_date} onChange={(e) => setF("interview_date", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Nombre completo *</Label>
                  <Input value={form.full_name} onChange={(e) => setF("full_name", e.target.value)} placeholder="Nombre del colaborador" />
                </div>
                <div className="space-y-1.5">
                  <Label>Puesto *</Label>
                  <Input value={form.position} onChange={(e) => setF("position", e.target.value)} placeholder="Ej. Asistente administrativo" />
                </div>
                <div className="space-y-1.5">
                  <Label>Complejo de salud</Label>
                  <Select value={form.health_unit_id || "none"} onValueChange={(v) => setF("health_unit_id", v === "none" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona unidad" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar / Transversal</SelectItem>
                      {units.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>¿A quién le reporta?</Label>
                  <Input value={form.reports_to} onChange={(e) => setF("reports_to", e.target.value)} placeholder="Jefe directo" />
                </div>
                <div className="space-y-1.5">
                  <Label>Frecuencia de actividades</Label>
                  <Input value={form.frequency} onChange={(e) => setF("frequency", e.target.value)} placeholder="Diario, semanal, mensual..." />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Personal a su cargo</Label>
                <Textarea rows={2} value={form.team_in_charge} onChange={(e) => setF("team_in_charge", e.target.value)} placeholder="Nombres y puestos de quienes le reportan" />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Información que RECIBE</Label>
                  <Textarea rows={4} value={form.info_received} onChange={(e) => setF("info_received", e.target.value)} placeholder="¿Qué datos/reportes recibe y de quién?" />
                </div>
                <div className="space-y-1.5">
                  <Label>Cómo la PROCESA</Label>
                  <Textarea rows={4} value={form.info_processing} onChange={(e) => setF("info_processing", e.target.value)} placeholder="Pasos, validaciones, criterios..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Información que GENERA</Label>
                  <Textarea rows={4} value={form.info_generated} onChange={(e) => setF("info_generated", e.target.value)} placeholder="Entregables, reportes, a quién los envía" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Herramientas / sistemas usados</Label>
                  <Textarea rows={3} value={form.tools_used} onChange={(e) => setF("tools_used", e.target.value)} placeholder="Excel, WhatsApp, Synapsia, papel..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Dolores / cuellos de botella</Label>
                  <Textarea rows={3} value={form.pain_points} onChange={(e) => setF("pain_points", e.target.value)} placeholder="¿Qué le hace perder tiempo?" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Observaciones generales</Label>
                <Textarea rows={3} value={form.observations} onChange={(e) => setF("observations", e.target.value)} />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={reset}>Cancelar</Button>
                <Button onClick={save} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" /> {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {items.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
              Aún no hay evaluaciones registradas.
            </CardContent></Card>
          )}
          {items.map((e) => {
            const unit = units.find((u) => u.id === e.health_unit_id);
            return (
              <Card key={e.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{e.full_name} <span className="text-muted-foreground font-normal">— {e.position}</span></CardTitle>
                      <CardDescription className="mt-1 flex flex-wrap gap-2 items-center">
                        <span>{new Date(e.interview_date).toLocaleDateString("es-MX")}</span>
                        {unit && <Badge variant="secondary">{unit.name}</Badge>}
                        {e.reports_to && <span>· Reporta a: {e.reports_to}</span>}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => edit(e)}>Editar</Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(e.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
                  {e.info_received && <div><p className="font-medium mb-1">Recibe</p><p className="text-muted-foreground whitespace-pre-wrap">{e.info_received}</p></div>}
                  {e.info_processing && <div><p className="font-medium mb-1">Procesa</p><p className="text-muted-foreground whitespace-pre-wrap">{e.info_processing}</p></div>}
                  {e.info_generated && <div><p className="font-medium mb-1">Genera</p><p className="text-muted-foreground whitespace-pre-wrap">{e.info_generated}</p></div>}
                  {e.team_in_charge && <div><p className="font-medium mb-1">A su cargo</p><p className="text-muted-foreground whitespace-pre-wrap">{e.team_in_charge}</p></div>}
                  {e.tools_used && <div><p className="font-medium mb-1">Herramientas</p><p className="text-muted-foreground whitespace-pre-wrap">{e.tools_used}</p></div>}
                  {e.pain_points && <div><p className="font-medium mb-1">Dolores</p><p className="text-muted-foreground whitespace-pre-wrap">{e.pain_points}</p></div>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
