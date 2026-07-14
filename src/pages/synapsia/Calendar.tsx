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
import { ArrowLeft, Brain, CalendarPlus, ChevronLeft, ChevronRight, LogOut, Loader2, Trash2, UserPlus, XCircle, CalendarCheck, Link as LinkIcon, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAuthUrl, buildEventFromAppointment, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, getValidAccessToken } from "@/lib/googleCalendar";

interface Specialist { id: string; full_name: string; specialty: string; user_id: string | null; }
interface Patient { id: string; full_name: string; }
interface Appointment {
  id: string;
  patient_id: string | null;
  specialist_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  reason: string | null;
  notes: string | null;
  appointment_type?: string;
  google_event_id?: string;
  google_calendar_id?: string;
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
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [showAllPatients, setShowAllPatients] = useState(true);
  const [patientSearch, setPatientSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [newPatientOpen, setNewPatientOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({ full_name: "", phone: "", email: "" });
  const [savingPatient, setSavingPatient] = useState(false);
  const [form, setForm] = useState({
    appointment_type: "cita",
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

  // Google Calendar sync state
  const [gcalConnected, setGcalConnected] = useState(false);
  const [gcalConnecting, setGcalConnecting] = useState(false);
  const [mySpecialistId, setMySpecialistId] = useState<string | null>(null);

  useEffect(() => {
    const spec = specialists.find(s => s.user_id === user?.id);
    if (spec) {
      setMySpecialistId(spec.id);
      // Check if already connected
      checkGcalConnection(spec.id);
    }
  }, [specialists, user?.id]);

  const checkGcalConnection = async (specialistId: string) => {
    const { data } = await supabase
      .from("specialists")
      .select("google_access_token, google_refresh_token, calendar_sync_enabled")
      .eq("id", specialistId)
      .single();
    setGcalConnected(!!(data?.google_access_token && data?.calendar_sync_enabled));
  };

  const connectGoogleCalendar = () => {
    if (!mySpecialistId) return;
    setGcalConnecting(true);
    const state = mySpecialistId;
    window.location.href = getAuthUrl(state);
  };

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
      .select("*")
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
      appointment_type: "cita",
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
      appointment_type: a.appointment_type || "cita",
      patient_id: a.patient_id || "",
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
    const isPersonal = form.appointment_type === "personal";
    const resolvedSpecialistId = form.specialist_id || mySpecialistId || "";
    const payload: any = {
      patient_id: isPersonal ? null : form.patient_id || null,
      specialist_id: resolvedSpecialistId,
      scheduled_at,
      duration_minutes: parseInt(form.duration_minutes),
      reason: form.reason || null,
      notes: form.notes || null,
      status: form.status,
      appointment_type: form.appointment_type,
    };
    let error;
    let appointmentId = editing?.id;
    if (editing) {
      ({ error } = await supabase.from("appointments").update(payload).eq("id", editing.id));
    } else {
      payload.created_by = user?.id;
      const { error: insError } = await supabase.from("appointments").insert(payload);
      error = insError;
    }
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else {
      toast({ title: editing ? "Cita actualizada" : "Cita agendada" });
      setOpen(false);
      await fetchAppointments();
      // Sync with Google Calendar
      if (resolvedSpecialistId) {
        const isPersonal = form.appointment_type === "personal";
        const patientName = isPersonal ? "Personal" : (patients.find(p => p.id === form.patient_id)?.full_name || "Paciente");
        const specName = specialists.find(s => s.id === resolvedSpecialistId)?.full_name || "Especialista";
        // Find the latest appointment that matches
        const latestAppt = appointments.find(a => 
          !editing && a.specialist_id === resolvedSpecialistId && 
          a.scheduled_at === new Date(`${form.date}T${form.time}:00`).toISOString() &&
          !a.google_event_id
        );
        const syncAppt = editing || latestAppt;
        if (syncAppt) {
          const appt = { ...payload, id: syncAppt.id, patients: isPersonal ? null : { full_name: patientName }, specialists: { full_name: specName } };
          const accessToken = await getValidAccessToken(resolvedSpecialistId);
          if (accessToken) {
            const event = buildEventFromAppointment(appt, patientName, specName);
            if (isPersonal) {
              event.summary = form.reason || "Cita personal";
            }
            if (editing && (editing as any).google_event_id) {
              await updateCalendarEvent(accessToken, "primary", (editing as any).google_event_id, event);
            } else {
              const created = await createCalendarEvent(accessToken, "primary", event);
              if (created) {
                await supabase.from("appointments").update({ google_event_id: created.id }).eq("id", syncAppt.id);
              }
            }
          }
        }
      }
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!editing) return;
    if (!confirm("¿Eliminar esta cita? Esta acción no se puede deshacer.")) return;
    setLoading(true);
    const googleEventId = (editing as any).google_event_id;
    const { error } = await supabase.from("appointments").delete().eq("id", editing.id);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else {
      toast({ title: "Cita eliminada" });
      setOpen(false);
      fetchAppointments();
      // Sync with Google Calendar
      if (googleEventId && mySpecialistId) {
        const accessToken = await getValidAccessToken(mySpecialistId);
        if (accessToken) await deleteCalendarEvent(accessToken, "primary", googleEventId);
      }
    }
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!editing) return;
    setLoading(true);
    const { error } = await supabase.from("appointments").update({ status: "cancelada" }).eq("id", editing.id);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else {
      toast({ title: "Cita cancelada" });
      setOpen(false);
      fetchAppointments();
      // Sync with Google Calendar - update event to show cancelled
      const googleEventId = (editing as any).google_event_id;
      if (googleEventId && mySpecialistId) {
        const accessToken = await getValidAccessToken(mySpecialistId);
        if (accessToken) {
          await updateCalendarEvent(accessToken, "primary", googleEventId, { summary: `[CANCELADA] ${(editing as any).summary || "Cita"}`, colorId: "11" });
        }
      }
    }
    setLoading(false);
  };

  // Filter patients by selected specialist (patients who have had appointments with that specialist)
  useEffect(() => {
    const loadFiltered = async () => {
      if (!form.specialist_id) { setFilteredPatients([]); return; }
      const { data } = await supabase
        .from("appointments")
        .select("patient_id, patients(id, full_name)")
        .eq("specialist_id", form.specialist_id);
      const map = new Map<string, Patient>();
      (data as any[] || []).forEach((r) => {
        if (r.patients) map.set(r.patients.id, { id: r.patients.id, full_name: r.patients.full_name });
      });
      // Always include the currently selected patient even if not in history
      if (form.patient_id && !map.has(form.patient_id)) {
        const p = patients.find(x => x.id === form.patient_id);
        if (p) map.set(p.id, p);
      }
      const list = Array.from(map.values()).sort((a, b) => a.full_name.localeCompare(b.full_name));
      setFilteredPatients(list);
    };
    loadFiltered();
    // eslint-disable-next-line
  }, [form.specialist_id, patients]);

  const handleNewPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPatient(true);
    const { data, error } = await supabase
      .from("patients")
      .insert({ full_name: newPatient.full_name, phone: newPatient.phone || null, email: newPatient.email || null })
      .select("id, full_name").single();
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else if (data) {
      toast({ title: "Paciente registrado" });
      const p = { id: data.id, full_name: data.full_name };
      setPatients(prev => [...prev, p].sort((a,b) => a.full_name.localeCompare(b.full_name)));
      setFilteredPatients(prev => [...prev, p].sort((a,b) => a.full_name.localeCompare(b.full_name)));
      setForm(f => ({ ...f, patient_id: data.id }));
      setNewPatient({ full_name: "", phone: "", email: "" });
      setNewPatientOpen(false);
    }
    setSavingPatient(false);
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
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => openNew()}><CalendarPlus className="w-4 h-4 mr-1" /> Nueva cita</Button>
          {mySpecialistId && (
            <>
              {gcalConnected ? (
                <Button variant="outline" size="sm" className="gap-1" disabled={gcalConnecting}>
                  <CalendarCheck className="w-4 h-4" /> Google Calendar conectado
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={connectGoogleCalendar} disabled={gcalConnecting}>
                  {gcalConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                  Conectar Google Calendar
                </Button>
              )}
            </>
          )}
        </div>
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
                            className={`w-full text-left rounded p-1 text-[11px] mb-1 border ${a.appointment_type === "personal" ? "bg-purple-100 text-purple-800 border-purple-200" : STATUS_COLOR[a.status]}`}
                          >
                            <div className="font-semibold truncate">{format(parseISO(a.scheduled_at), "HH:mm")} · {a.appointment_type === "personal" ? (a.reason || "Personal") : (patients.find(p => p.id === a.patient_id)?.full_name || "Paciente")}</div>
                            <div className="truncate opacity-80">{specialists.find(s => s.id === a.specialist_id)?.full_name || ""}</div>
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
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 sm:p-6 pb-2 border-b shrink-0">
            <DialogTitle>{editing ? "Editar cita" : "Nueva cita"}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 min-h-0">
            <form id="appt-form" onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-2">
                <Label>Tipo de cita *</Label>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant={form.appointment_type === "cita" ? "default" : "outline"} onClick={() => setForm({ ...form, appointment_type: "cita", patient_id: "" })}>Cita</Button>
                  <Button type="button" size="sm" variant={form.appointment_type === "personal" ? "default" : "outline"} onClick={() => setForm({ ...form, appointment_type: "personal", patient_id: "" })}>Personal</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Especialista *</Label>
                <Select value={form.specialist_id} onValueChange={(v) => setForm({ ...form, specialist_id: v, patient_id: "" })} disabled={!isClinical}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar especialista" /></SelectTrigger>
                  <SelectContent>
                    {specialists.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.full_name} — {s.specialty}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.appointment_type === "cita" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Label>Paciente *</Label>
                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowAllPatients(s => !s)}>
                      {showAllPatients ? "Solo del especialista" : "Ver todos"}
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="h-7" onClick={() => setNewPatientOpen(true)}>
                      <UserPlus className="w-3 h-3 mr-1" /> Nuevo
                    </Button>
                  </div>
                </div>
                <Input
                  placeholder="Buscar paciente..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="h-9"
                />
                <Select value={form.patient_id} onValueChange={(v) => setForm({ ...form, patient_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar paciente" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {(() => {
                      const base = showAllPatients ? patients : filteredPatients;
                      const q = patientSearch.trim().toLowerCase();
                      const list = q ? base.filter(p => p.full_name.toLowerCase().includes(q)) : base;
                      if (list.length === 0) return (
                        <div className="p-2 text-xs text-muted-foreground text-center">
                          {showAllPatients ? "Sin coincidencias." : 'Sin pacientes previos. Usa "Ver todos" o "Nuevo".'}
                        </div>
                      );
                      return list.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>);
                    })()}
                  </SelectContent>
                </Select>
              </div>
              )}
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
            </form>
          </div>
          <div className="border-t p-4 space-y-2 shrink-0">
            <Button type="submit" form="appt-form" className="w-full" disabled={loading || (form.appointment_type === "cita" && !form.patient_id) || !form.specialist_id}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "Guardar cambios" : "Agendar"}
            </Button>
            {editing && (
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" onClick={handleCancel} disabled={loading || form.status === "cancelada"}>
                  <XCircle className="w-4 h-4 mr-1" /> Cancelar cita
                </Button>
                <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
                  <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={newPatientOpen} onOpenChange={setNewPatientOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Nuevo paciente</DialogTitle></DialogHeader>
          <form onSubmit={handleNewPatient} className="space-y-3">
            <div className="space-y-2"><Label>Nombre completo *</Label><Input required value={newPatient.full_name} onChange={e => setNewPatient({ ...newPatient, full_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Teléfono</Label><Input value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={newPatient.email} onChange={e => setNewPatient({ ...newPatient, email: e.target.value })} /></div>
            <Button type="submit" className="w-full" disabled={savingPatient || !newPatient.full_name}>
              {savingPatient ? <Loader2 className="w-4 h-4 animate-spin" /> : "Registrar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
