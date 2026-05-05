import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Brain, FileSignature, HeartPulse, Loader2, Lock, LogOut, NotebookPen, Pill, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Patient { id: string; full_name: string; phone: string | null; email: string | null; date_of_birth: string | null; }
interface Record {
  id?: string; patient_id?: string;
  gender?: string | null; marital_status?: string | null; occupation?: string | null; address?: string | null;
  emergency_contact_name?: string | null; emergency_contact_phone?: string | null;
  heredofamiliares?: string | null; personales_no_patologicos?: string | null; personales_patologicos?: string | null;
  alergias?: string | null; medicamentos_actuales?: string | null;
  diagnostico_cie10?: string | null; diagnostico_descripcion?: string | null;
  plan_terapeutico?: string | null; observaciones?: string | null;
}
interface Note {
  id: string; session_date: string; specialist_id: string; is_locked: boolean;
  motivo_consulta: string | null; padecimiento_actual: string | null;
  apariencia: string | null; conciencia: string | null; orientacion: string | null;
  afecto: string | null; pensamiento: string | null; juicio: string | null;
  diagnostico_sesion: string | null; plan_sesion: string | null;
  medicamentos: string | null; proxima_cita: string | null; notas_libres: string | null;
  specialists?: { full_name: string };
}
interface Consent { id: string; consent_type: string; content: string; signed_at: string; signed_by_name: string | null; witness_name: string | null; }
interface Vital {
  id: string; measured_at: string;
  systolic_bp: number | null; diastolic_bp: number | null; heart_rate: number | null; resp_rate: number | null;
  temperature: number | null; weight_kg: number | null; height_cm: number | null; bmi: number | null; oxygen_saturation: number | null; notes: string | null;
}
interface PrescItem { id?: string; medicamento: string; presentacion?: string; dosis?: string; via?: string; frecuencia?: string; duracion?: string; indicaciones?: string; }
interface Prescription { id: string; issued_at: string; diagnostico: string | null; indicaciones: string | null; is_locked: boolean; specialist_id: string; prescription_items?: PrescItem[]; }

const empty: Record = {};
const emptyNote = {
  motivo_consulta: "", padecimiento_actual: "",
  apariencia: "", conciencia: "", orientacion: "", afecto: "", pensamiento: "", juicio: "",
  diagnostico_sesion: "", plan_sesion: "", medicamentos: "", proxima_cita: "", notas_libres: "",
};
const emptyVital = { systolic_bp: "", diastolic_bp: "", heart_rate: "", resp_rate: "", temperature: "", weight_kg: "", height_cm: "", oxygen_saturation: "", notes: "" };
const emptyConsent = { consent_type: "Consentimiento informado de tratamiento", content: "", signed_by_name: "", witness_name: "" };
const emptyPresc = { diagnostico: "", indicaciones: "" };
const emptyPItem: PrescItem = { medicamento: "", presentacion: "", dosis: "", via: "Oral", frecuencia: "", duracion: "", indicaciones: "" };

async function logAudit(action: string, entity: string, entity_id?: string, metadata?: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("audit_log").insert({ user_id: user.id, action, entity, entity_id, metadata });
}

export default function MedicalRecord() {
  const { patientId } = useParams<{ patientId: string }>();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [record, setRecord] = useState<Record>(empty);
  const [notes, setNotes] = useState<Note[]>([]);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteForm, setNoteForm] = useState(emptyNote);
  const [vitalOpen, setVitalOpen] = useState(false);
  const [vitalForm, setVitalForm] = useState(emptyVital);
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentForm, setConsentForm] = useState(emptyConsent);
  const [prescOpen, setPrescOpen] = useState(false);
  const [prescForm, setPrescForm] = useState(emptyPresc);
  const [prescItems, setPrescItems] = useState<PrescItem[]>([{ ...emptyPItem }]);
  const [specialistId, setSpecialistId] = useState<string | null>(null);

  // Claves de autoguardado local por paciente
  const kRecord = patientId ? `draft:record:${patientId}` : "";
  const kNote = patientId ? `draft:note:${patientId}` : "";
  const kVital = patientId ? `draft:vital:${patientId}` : "";
  const kConsent = patientId ? `draft:consent:${patientId}` : "";
  const kPresc = patientId ? `draft:presc:${patientId}` : "";
  const kPrescItems = patientId ? `draft:prescItems:${patientId}` : "";
  const [hasNoteDraft, setHasNoteDraft] = useState(false);
  const [hasPrescDraft, setHasPrescDraft] = useState(false);
  const [hasVitalDraft, setHasVitalDraft] = useState(false);
  const [hasConsentDraft, setHasConsentDraft] = useState(false);

  useEffect(() => { if (patientId) load(); /* eslint-disable-next-line */ }, [patientId]);

  // Detectar borradores existentes al cargar
  useEffect(() => {
    if (!patientId) return;
    setHasNoteDraft(!!localStorage.getItem(kNote));
    setHasPrescDraft(!!localStorage.getItem(kPresc));
    setHasVitalDraft(!!localStorage.getItem(kVital));
    setHasConsentDraft(!!localStorage.getItem(kConsent));
  }, [patientId]);

  // Autoguardado local del expediente principal
  useEffect(() => {
    if (!patientId) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(kRecord, JSON.stringify(record)); } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [record, patientId]);

  // Autoguardado de la nota en edición
  useEffect(() => {
    if (!patientId || !noteOpen) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(kNote, JSON.stringify(noteForm)); setHasNoteDraft(true); } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [noteForm, noteOpen, patientId]);

  // Autoguardado vitales
  useEffect(() => {
    if (!patientId || !vitalOpen) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(kVital, JSON.stringify(vitalForm)); setHasVitalDraft(true); } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [vitalForm, vitalOpen, patientId]);

  // Autoguardado consentimiento
  useEffect(() => {
    if (!patientId || !consentOpen) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(kConsent, JSON.stringify(consentForm)); setHasConsentDraft(true); } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [consentForm, consentOpen, patientId]);

  // Autoguardado receta
  useEffect(() => {
    if (!patientId || !prescOpen) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(kPresc, JSON.stringify(prescForm));
        localStorage.setItem(kPrescItems, JSON.stringify(prescItems));
        setHasPrescDraft(true);
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [prescForm, prescItems, prescOpen, patientId]);


  const load = async () => {
    const [{ data: p }, { data: r }, { data: n }, { data: sp }, { data: cs }, { data: vs }, { data: pr }] = await Promise.all([
      supabase.from("patients").select("id, full_name, phone, email, date_of_birth").eq("id", patientId!).maybeSingle(),
      supabase.from("medical_records").select("*").eq("patient_id", patientId!).maybeSingle(),
      supabase.from("medical_notes").select("*, specialists(full_name)").eq("patient_id", patientId!).order("session_date", { ascending: false }),
      supabase.from("specialists").select("id").eq("user_id", user?.id ?? "").maybeSingle(),
      supabase.from("informed_consents").select("*").eq("patient_id", patientId!).order("signed_at", { ascending: false }),
      supabase.from("vital_signs").select("*").eq("patient_id", patientId!).order("measured_at", { ascending: false }),
      supabase.from("prescriptions").select("*, prescription_items(*)").eq("patient_id", patientId!).order("issued_at", { ascending: false }),
    ]);
    setPatient(p as any);
    setRecord((r as any) ?? { patient_id: patientId });
    setNotes((n as any) ?? []);
    setSpecialistId((sp as any)?.id ?? null);
    setConsents((cs as any) ?? []);
    setVitals((vs as any) ?? []);
    setPrescriptions((pr as any) ?? []);
    if (patientId) logAudit("view", "patient_record", patientId);
  };

  const saveRecord = async () => {
    setLoading(true);
    const payload = { ...record, patient_id: patientId, created_by: user?.id };
    let error;
    if (record.id) ({ error } = await supabase.from("medical_records").update(payload).eq("id", record.id));
    else ({ error } = await supabase.from("medical_records").upsert(payload, { onConflict: "patient_id" }));
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: "Expediente guardado" }); logAudit("update", "medical_record", record.id); load(); }
    setLoading(false);
  };

  const saveNote = async (e: React.FormEvent, lock: boolean) => {
    e.preventDefault();
    if (!specialistId) {
      toast({ variant: "destructive", title: "Sin especialista vinculado", description: "Tu cuenta no está asociada a un perfil de especialista." });
      return;
    }
    setLoading(true);
    const payload: any = { ...noteForm, patient_id: patientId, specialist_id: specialistId, is_locked: lock };
    if (!payload.proxima_cita) delete payload.proxima_cita;
    const { data, error } = await supabase.from("medical_notes").insert(payload).select().single();
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else {
      toast({ title: lock ? "Nota firmada y bloqueada" : "Nota guardada (borrador)" });
      logAudit(lock ? "lock_note" : "create_note", "medical_note", (data as any)?.id);
      setNoteOpen(false); setNoteForm(emptyNote); load();
    }
    setLoading(false);
  };

  const saveVital = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const num = (v: string) => v === "" ? null : Number(v);
    const w = num(vitalForm.weight_kg); const h = num(vitalForm.height_cm);
    const bmi = w && h ? Number((w / Math.pow(h / 100, 2)).toFixed(2)) : null;
    const payload: any = {
      patient_id: patientId, created_by: user?.id,
      systolic_bp: num(vitalForm.systolic_bp), diastolic_bp: num(vitalForm.diastolic_bp),
      heart_rate: num(vitalForm.heart_rate), resp_rate: num(vitalForm.resp_rate),
      temperature: num(vitalForm.temperature), weight_kg: w, height_cm: h, bmi,
      oxygen_saturation: num(vitalForm.oxygen_saturation), notes: vitalForm.notes || null,
    };
    const { data, error } = await supabase.from("vital_signs").insert(payload).select().single();
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: "Signos vitales registrados" }); logAudit("create", "vital_signs", (data as any)?.id); setVitalOpen(false); setVitalForm(emptyVital); load(); }
    setLoading(false);
  };

  const saveConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = { ...consentForm, patient_id: patientId, created_by: user?.id };
    const { data, error } = await supabase.from("informed_consents").insert(payload).select().single();
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: "Consentimiento registrado" }); logAudit("create", "informed_consent", (data as any)?.id); setConsentOpen(false); setConsentForm(emptyConsent); load(); }
    setLoading(false);
  };

  const savePrescription = async (e: React.FormEvent, lock: boolean) => {
    e.preventDefault();
    if (!specialistId) { toast({ variant: "destructive", title: "Sin especialista vinculado" }); return; }
    if (prescItems.filter(i => i.medicamento.trim()).length === 0) {
      toast({ variant: "destructive", title: "Agrega al menos un medicamento" }); return;
    }
    setLoading(true);
    const { data: pres, error } = await supabase.from("prescriptions").insert({
      patient_id: patientId, specialist_id: specialistId, ...prescForm, is_locked: lock,
    }).select().single();
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); setLoading(false); return; }
    const items = prescItems.filter(i => i.medicamento.trim()).map(i => ({ ...i, prescription_id: (pres as any).id }));
    if (items.length) {
      const { error: e2 } = await supabase.from("prescription_items").insert(items);
      if (e2) { toast({ variant: "destructive", title: "Error medicamentos", description: e2.message }); setLoading(false); return; }
    }
    toast({ title: lock ? "Receta emitida y bloqueada" : "Receta guardada (borrador)" });
    logAudit(lock ? "issue_prescription" : "draft_prescription", "prescription", (pres as any).id);
    setPrescOpen(false); setPrescForm(emptyPresc); setPrescItems([{ ...emptyPItem }]); load();
    setLoading(false);
  };

  const upd = (k: keyof Record, v: string) => setRecord(r => ({ ...r, [k]: v }));
  const updItem = (idx: number, k: keyof PrescItem, v: string) => setPrescItems(items => items.map((it, i) => i === idx ? { ...it, [k]: v } : it));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Button>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"><Brain className="w-5 h-5 text-primary-foreground" /></div>
            <div>
              <h1 className="text-lg font-bold">Expediente Médico Electrónico</h1>
              <p className="text-xs text-muted-foreground">{patient?.full_name || "—"}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <Tabs defaultValue="ficha">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="ficha">Ficha clínica</TabsTrigger>
            <TabsTrigger value="vitales"><HeartPulse className="w-3 h-3 mr-1" /> Signos vitales</TabsTrigger>
            <TabsTrigger value="notas">Notas ({notes.length})</TabsTrigger>
            <TabsTrigger value="recetas"><Pill className="w-3 h-3 mr-1" /> Recetas</TabsTrigger>
            <TabsTrigger value="consentimientos"><FileSignature className="w-3 h-3 mr-1" /> Consentimientos</TabsTrigger>
          </TabsList>

          <TabsContent value="ficha" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Identificación</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Sexo" value={record.gender ?? ""} onChange={v => upd("gender", v)} />
                <Field label="Estado civil" value={record.marital_status ?? ""} onChange={v => upd("marital_status", v)} />
                <Field label="Ocupación" value={record.occupation ?? ""} onChange={v => upd("occupation", v)} />
                <Field label="Dirección" value={record.address ?? ""} onChange={v => upd("address", v)} />
                <Field label="Contacto de emergencia" value={record.emergency_contact_name ?? ""} onChange={v => upd("emergency_contact_name", v)} />
                <Field label="Teléfono de emergencia" value={record.emergency_contact_phone ?? ""} onChange={v => upd("emergency_contact_phone", v)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Antecedentes</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Area label="Heredofamiliares" value={record.heredofamiliares ?? ""} onChange={v => upd("heredofamiliares", v)} />
                <Area label="Personales no patológicos" value={record.personales_no_patologicos ?? ""} onChange={v => upd("personales_no_patologicos", v)} />
                <Area label="Personales patológicos" value={record.personales_patologicos ?? ""} onChange={v => upd("personales_patologicos", v)} />
                <Area label="Alergias" value={record.alergias ?? ""} onChange={v => upd("alergias", v)} />
                <Area label="Medicamentos actuales" value={record.medicamentos_actuales ?? ""} onChange={v => upd("medicamentos_actuales", v)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Diagnóstico y plan</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="CIE-10" value={record.diagnostico_cie10 ?? ""} onChange={v => upd("diagnostico_cie10", v)} />
                  <div className="md:col-span-2">
                    <Field label="Descripción del diagnóstico" value={record.diagnostico_descripcion ?? ""} onChange={v => upd("diagnostico_descripcion", v)} />
                  </div>
                </div>
                <Area label="Plan terapéutico" value={record.plan_terapeutico ?? ""} onChange={v => upd("plan_terapeutico", v)} />
                <Area label="Observaciones generales" value={record.observaciones ?? ""} onChange={v => upd("observaciones", v)} />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={saveRecord} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Guardar expediente</>}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="vitales" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={vitalOpen} onOpenChange={setVitalOpen}>
                <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" /> Registrar signos vitales</Button></DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader><DialogTitle>Signos vitales</DialogTitle></DialogHeader>
                  <form onSubmit={saveVital} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <NumField label="TA Sistólica (mmHg)" v={vitalForm.systolic_bp} onChange={v => setVitalForm({ ...vitalForm, systolic_bp: v })} />
                    <NumField label="TA Diastólica (mmHg)" v={vitalForm.diastolic_bp} onChange={v => setVitalForm({ ...vitalForm, diastolic_bp: v })} />
                    <NumField label="FC (lpm)" v={vitalForm.heart_rate} onChange={v => setVitalForm({ ...vitalForm, heart_rate: v })} />
                    <NumField label="FR (rpm)" v={vitalForm.resp_rate} onChange={v => setVitalForm({ ...vitalForm, resp_rate: v })} />
                    <NumField label="Temp (°C)" v={vitalForm.temperature} onChange={v => setVitalForm({ ...vitalForm, temperature: v })} step="0.1" />
                    <NumField label="SpO₂ (%)" v={vitalForm.oxygen_saturation} onChange={v => setVitalForm({ ...vitalForm, oxygen_saturation: v })} />
                    <NumField label="Peso (kg)" v={vitalForm.weight_kg} onChange={v => setVitalForm({ ...vitalForm, weight_kg: v })} step="0.1" />
                    <NumField label="Talla (cm)" v={vitalForm.height_cm} onChange={v => setVitalForm({ ...vitalForm, height_cm: v })} step="0.1" />
                    <div className="col-span-2 md:col-span-3"><Area label="Notas" value={vitalForm.notes} onChange={v => setVitalForm({ ...vitalForm, notes: v })} /></div>
                    <div className="col-span-2 md:col-span-3"><Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}</Button></div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            {vitals.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Sin registros</p> : vitals.map(v => (
              <Card key={v.id}><CardContent className="pt-4 text-sm grid grid-cols-2 md:grid-cols-4 gap-2">
                <p className="col-span-2 md:col-span-4 text-xs text-muted-foreground">{format(new Date(v.measured_at), "PPpp", { locale: es })}</p>
                {v.systolic_bp && <p>TA: {v.systolic_bp}/{v.diastolic_bp}</p>}
                {v.heart_rate && <p>FC: {v.heart_rate} lpm</p>}
                {v.resp_rate && <p>FR: {v.resp_rate} rpm</p>}
                {v.temperature && <p>T: {v.temperature}°C</p>}
                {v.oxygen_saturation && <p>SpO₂: {v.oxygen_saturation}%</p>}
                {v.weight_kg && <p>Peso: {v.weight_kg} kg</p>}
                {v.height_cm && <p>Talla: {v.height_cm} cm</p>}
                {v.bmi && <p>IMC: {v.bmi}</p>}
                {v.notes && <p className="col-span-2 md:col-span-4 text-muted-foreground">{v.notes}</p>}
              </CardContent></Card>
            ))}
          </TabsContent>

          <TabsContent value="notas" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
                <DialogTrigger asChild><Button><NotebookPen className="w-4 h-4 mr-1" /> Nueva nota</Button></DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Nota de evolución</DialogTitle></DialogHeader>
                  <form onSubmit={(e) => saveNote(e, false)} className="space-y-3">
                    <Area label="Motivo de consulta" value={noteForm.motivo_consulta} onChange={v => setNoteForm({ ...noteForm, motivo_consulta: v })} />
                    <Area label="Padecimiento actual" value={noteForm.padecimiento_actual} onChange={v => setNoteForm({ ...noteForm, padecimiento_actual: v })} />
                    <div className="border-t pt-3">
                      <p className="text-sm font-semibold mb-2">Examen mental</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Field label="Apariencia" value={noteForm.apariencia} onChange={v => setNoteForm({ ...noteForm, apariencia: v })} />
                        <Field label="Conciencia" value={noteForm.conciencia} onChange={v => setNoteForm({ ...noteForm, conciencia: v })} />
                        <Field label="Orientación" value={noteForm.orientacion} onChange={v => setNoteForm({ ...noteForm, orientacion: v })} />
                        <Field label="Afecto" value={noteForm.afecto} onChange={v => setNoteForm({ ...noteForm, afecto: v })} />
                        <Field label="Pensamiento" value={noteForm.pensamiento} onChange={v => setNoteForm({ ...noteForm, pensamiento: v })} />
                        <Field label="Juicio" value={noteForm.juicio} onChange={v => setNoteForm({ ...noteForm, juicio: v })} />
                      </div>
                    </div>
                    <Area label="Diagnóstico de la sesión" value={noteForm.diagnostico_sesion} onChange={v => setNoteForm({ ...noteForm, diagnostico_sesion: v })} />
                    <Area label="Plan / indicaciones" value={noteForm.plan_sesion} onChange={v => setNoteForm({ ...noteForm, plan_sesion: v })} />
                    <Area label="Medicamentos" value={noteForm.medicamentos} onChange={v => setNoteForm({ ...noteForm, medicamentos: v })} />
                    <div className="space-y-2"><Label>Próxima cita</Label><Input type="date" value={noteForm.proxima_cita} onChange={e => setNoteForm({ ...noteForm, proxima_cita: e.target.value })} /></div>
                    <Area label="Notas adicionales" value={noteForm.notas_libres} onChange={v => setNoteForm({ ...noteForm, notas_libres: v })} />
                    <div className="flex gap-2">
                      <Button type="submit" variant="outline" className="flex-1" disabled={loading}>Guardar borrador</Button>
                      <Button type="button" className="flex-1" disabled={loading} onClick={(e) => saveNote(e as any, true)}>
                        <Lock className="w-4 h-4 mr-1" /> Firmar y bloquear
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Una vez bloqueada, la nota no podrá modificarse (NOM-024-SSA3-2012).</p>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sin notas de evolución</p>
            ) : notes.map(n => (
              <Card key={n.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {n.is_locked && <Lock className="w-3 h-3 text-primary" />}
                      {format(new Date(n.session_date), "PPpp", { locale: es })}
                    </span>
                    <span className="text-xs text-muted-foreground">{n.specialists?.full_name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  {n.motivo_consulta && <Row label="Motivo" v={n.motivo_consulta} />}
                  {n.diagnostico_sesion && <Row label="Diagnóstico" v={n.diagnostico_sesion} />}
                  {n.plan_sesion && <Row label="Plan" v={n.plan_sesion} />}
                  {n.medicamentos && <Row label="Medicamentos" v={n.medicamentos} />}
                  {n.proxima_cita && <Row label="Próxima cita" v={n.proxima_cita} />}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="recetas" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={prescOpen} onOpenChange={setPrescOpen}>
                <DialogTrigger asChild><Button><Pill className="w-4 h-4 mr-1" /> Nueva receta</Button></DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Receta médica</DialogTitle></DialogHeader>
                  <form onSubmit={(e) => savePrescription(e, false)} className="space-y-3">
                    <Area label="Diagnóstico" value={prescForm.diagnostico} onChange={v => setPrescForm({ ...prescForm, diagnostico: v })} />
                    <div className="space-y-3 border-t pt-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Medicamentos</p>
                        <Button type="button" size="sm" variant="outline" onClick={() => setPrescItems([...prescItems, { ...emptyPItem }])}><Plus className="w-3 h-3 mr-1" /> Agregar</Button>
                      </div>
                      {prescItems.map((it, idx) => (
                        <Card key={idx}><CardContent className="pt-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-muted-foreground">#{idx + 1}</p>
                            {prescItems.length > 1 && <Button type="button" size="icon" variant="ghost" onClick={() => setPrescItems(prescItems.filter((_, i) => i !== idx))}><Trash2 className="w-3 h-3" /></Button>}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <Field label="Medicamento *" value={it.medicamento} onChange={v => updItem(idx, "medicamento", v)} />
                            <Field label="Presentación" value={it.presentacion ?? ""} onChange={v => updItem(idx, "presentacion", v)} />
                            <Field label="Dosis" value={it.dosis ?? ""} onChange={v => updItem(idx, "dosis", v)} />
                            <Field label="Vía" value={it.via ?? ""} onChange={v => updItem(idx, "via", v)} />
                            <Field label="Frecuencia" value={it.frecuencia ?? ""} onChange={v => updItem(idx, "frecuencia", v)} />
                            <Field label="Duración" value={it.duracion ?? ""} onChange={v => updItem(idx, "duracion", v)} />
                          </div>
                          <Area label="Indicaciones" value={it.indicaciones ?? ""} onChange={v => updItem(idx, "indicaciones", v)} />
                        </CardContent></Card>
                      ))}
                    </div>
                    <Area label="Indicaciones generales" value={prescForm.indicaciones} onChange={v => setPrescForm({ ...prescForm, indicaciones: v })} />
                    <div className="flex gap-2">
                      <Button type="submit" variant="outline" className="flex-1" disabled={loading}>Guardar borrador</Button>
                      <Button type="button" className="flex-1" disabled={loading} onClick={(e) => savePrescription(e as any, true)}>
                        <Lock className="w-4 h-4 mr-1" /> Emitir y bloquear
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            {prescriptions.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Sin recetas</p> : prescriptions.map(p => (
              <Card key={p.id}>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">{p.is_locked && <Lock className="w-3 h-3 text-primary" />}{format(new Date(p.issued_at), "PP", { locale: es })}</span>
                </CardTitle></CardHeader>
                <CardContent className="text-sm space-y-2">
                  {p.diagnostico && <Row label="Dx" v={p.diagnostico} />}
                  {p.prescription_items?.map((it, i) => (
                    <div key={i} className="border-l-2 border-primary/40 pl-2">
                      <p className="font-medium">{it.medicamento} {it.presentacion}</p>
                      <p className="text-xs text-muted-foreground">{[it.dosis, it.via, it.frecuencia, it.duracion].filter(Boolean).join(" · ")}</p>
                      {it.indicaciones && <p className="text-xs">{it.indicaciones}</p>}
                    </div>
                  ))}
                  {p.indicaciones && <Row label="Indicaciones" v={p.indicaciones} />}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="consentimientos" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={consentOpen} onOpenChange={setConsentOpen}>
                <DialogTrigger asChild><Button><FileSignature className="w-4 h-4 mr-1" /> Nuevo consentimiento</Button></DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader><DialogTitle>Consentimiento informado</DialogTitle></DialogHeader>
                  <form onSubmit={saveConsent} className="space-y-3">
                    <Field label="Tipo de consentimiento" value={consentForm.consent_type} onChange={v => setConsentForm({ ...consentForm, consent_type: v })} />
                    <Area label="Contenido / texto del consentimiento" value={consentForm.content} onChange={v => setConsentForm({ ...consentForm, content: v })} />
                    <Field label="Firmado por (paciente / responsable)" value={consentForm.signed_by_name} onChange={v => setConsentForm({ ...consentForm, signed_by_name: v })} />
                    <Field label="Testigo" value={consentForm.witness_name} onChange={v => setConsentForm({ ...consentForm, witness_name: v })} />
                    <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}</Button>
                    <p className="text-xs text-muted-foreground">El documento físico firmado debe conservarse en archivo según NOM-004-SSA3-2012.</p>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            {consents.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Sin consentimientos</p> : consents.map(c => (
              <Card key={c.id}>
                <CardHeader className="pb-2"><CardTitle className="text-sm">{c.consent_type}</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p className="text-xs text-muted-foreground">{format(new Date(c.signed_at), "PPpp", { locale: es })}</p>
                  <p className="whitespace-pre-wrap">{c.content}</p>
                  {c.signed_by_name && <p className="text-xs"><b>Firma:</b> {c.signed_by_name}</p>}
                  {c.witness_name && <p className="text-xs"><b>Testigo:</b> {c.witness_name}</p>}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <div className="space-y-2"><Label>{label}</Label><Input value={value} onChange={e => onChange(e.target.value)} /></div>;
}
function NumField({ label, v, onChange, step }: { label: string; v: string; onChange: (v: string) => void; step?: string }) {
  return <div className="space-y-2"><Label className="text-xs">{label}</Label><Input type="number" step={step ?? "1"} value={v} onChange={e => onChange(e.target.value)} /></div>;
}
function Area({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <div className="space-y-2"><Label>{label}</Label><Textarea rows={2} value={value} onChange={e => onChange(e.target.value)} /></div>;
}
function Row({ label, v }: { label: string; v: string }) {
  return <p><span className="font-medium">{label}:</span> <span className="text-muted-foreground">{v}</span></p>;
}
