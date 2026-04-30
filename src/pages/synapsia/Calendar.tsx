import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Brain, CalendarPlus, ChevronLeft, ChevronRight, LogOut, Loader2 } from "lucide-react";

interface Specialist { id: string; full_name: string; specialty: string; user_id: string | null; }
interface Patient { id: string; full_name: string; }
interface Appointment {
  id: string;
  patient_id: string;
  specialist_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  reason: string | null;
  notes: string | null;
  patients: { full_name: string };
  specialists: { full_name: string; specialty: string };
}

const STATUS_LABEL: Record<string, string> = {
  programada: "Programada",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  completada: "Completada",
  no_asistio: "No asistió",
};

const STATUS_COLOR: Record<string, string> = {
  programada: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmada: "bg-blue-100 text-blue-800 border-blue-200",
  cancelada: "bg-red-100 text-red-800 border-red-200",
  completada: "bg-green-100 text-green-800 border-green-200",
  no_asistio: "bg-gray-200 text-gray-700 border-gray-300",
};

export default function CalendarPage() {
  const { user, signOut, hasRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState({
    patient_id: "",
    specialist_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "09:00",
    duration_minutes: "60",
    reason: "",
    notes: "",
    status: "programada",
  });

  const isClinical = hasRole("admin") || hasRole("recepcion");

  useEffect(() => { fetchSpecialists(); fetchPatients(); }, []);
  useEffect(() => { fetchAppointments(); /* eslint-disable-next-line */ }, [weekStart]);

  const fetchSpecialists = async () => {
    const { data } = await supabase.from("specialists").select("id, full_name, specialty, user_id").eq("is_active", true).order("full_name");
    setSpecialists((data as any) || []);
  };
  const fetchPatients = async () => {
    const { data } = await supabase.from("patients").select("id, full_name").order("full_name");
    setPatients((data as any) || []);
  };
  const fetchAppointments = async () => {
    const from = weekStart.toISOString();
    const to = addDays(weekStart, 7).toISOString();
    const { data, error } = await supabase
      .from("appointments")
      .select("*, patients(full_name), specialists(full_name, specialty)")
      .gte("scheduled_at", from).lt("scheduled_at", to)
      .order("scheduled_at");
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    setAppointments((data as any) || []);
  };

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => 8 + i), []); // 8 a 19

  const openNew = (date?: Date, hour?: number) => {
    setEditing(null);
    setForm({
      patient_id: "",
      specialist_id: isClinical ? "" : (specialists.find(s => s.user_id === user?.id)?.id || ""),
      date: format(date ?? new Date(), "yyyy-MM-dd"),
      time: hour != null ? `${String(hour).padStart(2, "0")}:00` : "09:00",
      duration_minutes: "60",
      reason: "",
      notes: "",
      status: "programada",
    });
    setOpen(true);
  };

  const openEdit = (a: Appointment) => {
    setEditing(a);
    const d = parseISO(a.scheduled_at);
    setForm({
      patient_id: a.patient_id,
      specialist_id: a.specialist_id,
      date: format(d, "yyyy-MM-dd"),
      time: format(d, "HH:mm"),
      duration_minutes: String(a.duration_minutes),
      reason: a.reason ?? "",
      notes: a.notes ?? "",
      status: a.status,
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const scheduled_at = new Date(`${form.date}T${form.time}:00`).toISOString();
    const payload: any = {
      patient_id: form.patient_id,
      specialist_id: form.specialist_id,
      scheduled_at,
      duration_minutes: parseInt(form.duration_minutes),
      reason: form.reason || null,
      notes: form.notes || null,
      status: form.status,
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from("appointments").update(payload).eq("id", editing.id));
    } else {
      payload.created_by = user?.id;
      ({ error } = await supabase.from("appointments").insert(payload));
    }
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: editing ? "Cita actualizada" : "Cita agendada" }); setOpen(false); fetchAppointments(); }
    setLoading(false);
  };

  const goBack = () => {
    if (hasRole("admin")) navigate("/synapsia");
    else if (hasRole("recepcion")) navigate("/synapsia");
    else navigate("/synapsia");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={goBack}><ArrowLeft className="w-4 h-4" /></Button>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Synapsia · Agenda</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft className="w-4 h-4" /></Button>
            <h2 className="text-base font-semibold capitalize">
              {format(weekStart, "d MMM", { locale: es })} – {format(addDays(weekStart, 6), "d MMM yyyy", { locale: es })}
            </h2>
            <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Hoy</Button>
          </div>
          <Button size="sm" onClick={() => openNew()}><CalendarPlus className="w-4 h-4 mr-1" /> Nueva cita</Button>
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <div className="min-w-[800px] grid grid-cols-[60px_repeat(7,1fr)]">
              <div className="border-b border-r bg-muted/50 p-2 text-xs font-medium" />
              {days.map((d) => (
                <div key={d.toISOString()} className={`border-b border-r p-2 text-center ${isSameDay(d, new Date()) ? "bg-primary/10" : "bg-muted/50"}`}>
                  <div className="text-xs text-muted-foreground capitalize">{format(d, "EEE", { locale: es })}</div>
                  <div className="text-sm font-semibold">{format(d, "d MMM", { locale: es })}</div>
                </div>
              ))}
              {hours.map((h) => (
                <>
                  <div key={`h-${h}`} className="border-b border-r p-1 text-xs text-muted-foreground text-right pr-2">{`${h}:00`}</div>
                  {days.map((d) => {
                    const slot = appointments.filter((a) => {
                      const ad = parseISO(a.scheduled_at);
                      return isSameDay(ad, d) && ad.getHours() === h;
                    });
                    return (
                      <div
                        key={`${d.toISOString()}-${h}`}
                        className="border-b border-r min-h-[64px] p-1 hover:bg-accent/30 cursor-pointer"
                        onClick={() => slot.length === 0 && openNew(d, h)}
                      >
                        {slot.map((a) => (
                          <button
                            key={a.id}
                            onClick={(e) => { e.stopPropagation(); openEdit(a); }}
                            className={`w-full text-left rounded p-1 text-[11px] mb-1 border ${STATUS_COLOR[a.status]}`}
                          >
                            <div className="font-semibold truncate">{format(parseISO(a.scheduled_at), "HH:mm")} · {a.patients.full_name}</div>
                            <div className="truncate opacity-80">{a.specialists.full_name}</div>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Editar cita" : "Nueva cita"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select value={form.patient_id} onValueChange={(v) => setForm({ ...form, patient_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar paciente" /></SelectTrigger>
                <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Especialista *</Label>
              <Select value={form.specialist_id} onValueChange={(v) => setForm({ ...form, specialist_id: v })} disabled={!isClinical}>
                <SelectTrigger><SelectValue placeholder="Seleccionar especialista" /></SelectTrigger>
                <SelectContent>
                  {specialists.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name} — {s.specialty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2 col-span-1"><Label>Fecha *</Label><Input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div className="space-y-2 col-span-1"><Label>Hora *</Label><Input type="time" required value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></div>
              <div className="space-y-2 col-span-1"><Label>Min</Label><Input type="number" min="15" step="15" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Motivo</Label><Input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
            <div className="space-y-2"><Label>Notas</Label><Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <Button type="submit" className="w-full" disabled={loading || !form.patient_id || !form.specialist_id}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "Guardar cambios" : "Agendar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
