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
import { ArrowLeft, Brain, Loader2, LogOut, NotebookPen, Save } from "lucide-react";
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
  id: string; session_date: string; specialist_id: string;
  motivo_consulta: string | null; padecimiento_actual: string | null;
  apariencia: string | null; conciencia: string | null; orientacion: string | null;
  afecto: string | null; pensamiento: string | null; juicio: string | null;
  diagnostico_sesion: string | null; plan_sesion: string | null;
  medicamentos: string | null; proxima_cita: string | null; notas_libres: string | null;
  specialists?: { full_name: string };
}

const empty: Record = {};
const emptyNote = {
  motivo_consulta: "", padecimiento_actual: "",
  apariencia: "", conciencia: "", orientacion: "", afecto: "", pensamiento: "", juicio: "",
  diagnostico_sesion: "", plan_sesion: "", medicamentos: "", proxima_cita: "", notas_libres: "",
};

export default function MedicalRecord() {
  const { patientId } = useParams<{ patientId: string }>();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [record, setRecord] = useState<Record>(empty);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteForm, setNoteForm] = useState(emptyNote);
  const [specialistId, setSpecialistId] = useState<string | null>(null);

  useEffect(() => { if (patientId) load(); /* eslint-disable-next-line */ }, [patientId]);

  const load = async () => {
    const [{ data: p }, { data: r }, { data: n }, { data: sp }] = await Promise.all([
      supabase.from("patients").select("id, full_name, phone, email, date_of_birth").eq("id", patientId!).maybeSingle(),
      supabase.from("medical_records").select("*").eq("patient_id", patientId!).maybeSingle(),
      supabase.from("medical_notes").select("*, specialists(full_name)").eq("patient_id", patientId!).order("session_date", { ascending: false }),
      supabase.from("specialists").select("id").eq("user_id", user?.id ?? "").maybeSingle(),
    ]);
    setPatient(p as any);
    setRecord((r as any) ?? { patient_id: patientId });
    setNotes((n as any) ?? []);
    setSpecialistId((sp as any)?.id ?? null);
  };

  const saveRecord = async () => {
    setLoading(true);
    const payload = { ...record, patient_id: patientId, created_by: user?.id };
    let error;
    if (record.id) ({ error } = await supabase.from("medical_records").update(payload).eq("id", record.id));
    else ({ error } = await supabase.from("medical_records").upsert(payload, { onConflict: "patient_id" }));
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: "Expediente guardado" }); load(); }
    setLoading(false);
  };

  const saveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!specialistId) {
      toast({ variant: "destructive", title: "Sin especialista vinculado", description: "Tu cuenta no está asociada a un perfil de especialista." });
      return;
    }
    setLoading(true);
    const payload: any = { ...noteForm, patient_id: patientId, specialist_id: specialistId };
    if (!payload.proxima_cita) delete payload.proxima_cita;
    const { error } = await supabase.from("medical_notes").insert(payload);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: "Nota registrada" }); setNoteOpen(false); setNoteForm(emptyNote); load(); }
    setLoading(false);
  };

  const upd = (k: keyof Record, v: string) => setRecord(r => ({ ...r, [k]: v }));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Button>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"><Brain className="w-5 h-5 text-primary-foreground" /></div>
            <div>
              <h1 className="text-lg font-bold">Expediente Médico</h1>
              <p className="text-xs text-muted-foreground">{patient?.full_name || "—"}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <Tabs defaultValue="ficha">
          <TabsList>
            <TabsTrigger value="ficha">Ficha clínica</TabsTrigger>
            <TabsTrigger value="notas">Notas de evolución ({notes.length})</TabsTrigger>
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

          <TabsContent value="notas" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
                <DialogTrigger asChild><Button><NotebookPen className="w-4 h-4 mr-1" /> Nueva nota</Button></DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Nota de evolución</DialogTitle></DialogHeader>
                  <form onSubmit={saveNote} className="space-y-3">
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
                    <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar nota"}</Button>
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
                    <span>{format(new Date(n.session_date), "PPpp", { locale: es })}</span>
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
        </Tabs>
      </main>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <div className="space-y-2"><Label>{label}</Label><Input value={value} onChange={e => onChange(e.target.value)} /></div>;
}
function Area({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <div className="space-y-2"><Label>{label}</Label><Textarea rows={2} value={value} onChange={e => onChange(e.target.value)} /></div>;
}
function Row({ label, v }: { label: string; v: string }) {
  return <p><span className="font-medium">{label}:</span> <span className="text-muted-foreground">{v}</span></p>;
}
