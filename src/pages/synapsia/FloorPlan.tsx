import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, LogOut, Plus, Trash2, Lock, Unlock, User, UserCheck,
  Stethoscope, ClipboardList, FileText, DollarSign, LogIn,
} from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Zone {
  id: string;
  name: string;
  zone_type: string;
  color: string;
  x: number; y: number; width: number; height: number;
  specialist_id: string | null;
  capacity: number;
  notes: string | null;
}
interface Specialist { id: string; full_name: string; specialty: string; user_id: string | null; consultation_fee: number; }
interface Patient { id: string; full_name: string; phone: string | null; date_of_birth: string | null; }
interface Flow {
  id: string;
  patient_id: string;
  zone_id: string | null;
  specialist_id: string | null;
  stage: string; // espera | consulta | pago | salida
  arrived_at: string;
  in_consult_at: string | null;
  to_payment_at: string | null;
  exited_at: string | null;
  patients: Patient;
  specialists: { full_name: string; specialty: string } | null;
}

const ZONE_TYPES = [
  { value: "consultorio", label: "Consultorio", color: "#1e3a8a" },
  { value: "recepcion", label: "Recepción", color: "#b45309" },
  { value: "espera", label: "Sala de espera", color: "#475569" },
  { value: "laboratorio", label: "Laboratorio", color: "#047857" },
  { value: "otro", label: "Otro", color: "#6b21a8" },
];

const STAGE_LABEL: Record<string, string> = {
  espera: "En espera", consulta: "En consulta", pago: "Por pagar", salida: "Salida",
};
const STAGE_COLOR: Record<string, string> = {
  espera: "bg-amber-100 text-amber-900 border-amber-300",
  consulta: "bg-blue-100 text-blue-900 border-blue-300",
  pago: "bg-rose-100 text-rose-900 border-rose-300",
  salida: "bg-slate-100 text-slate-700 border-slate-300",
};

export default function FloorPlan() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [zones, setZones] = useState<Zone[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(null);

  const [zoneEditOpen, setZoneEditOpen] = useState(false);
  const [zoneForm, setZoneForm] = useState({
    name: "", zone_type: "consultorio", color: "#1e3a8a", specialist_id: "", capacity: "1", notes: ""
  });

  const [intakeOpen, setIntakeOpen] = useState(false);
  const [intakeForm, setIntakeForm] = useState({ patient_id: "", zone_id: "", specialist_id: "" });

  // drag/resize state
  const dragRef = useRef<{ id: string; mode: "move" | "resize"; startX: number; startY: number; orig: Zone; latest: Zone } | null>(null);

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => {
    const ch = supabase
      .channel("floor-canvas")
      .on("postgres_changes", { event: "*", schema: "public", table: "floor_zones" }, () => fetchZones())
      .on("postgres_changes", { event: "*", schema: "public", table: "patient_flow" }, () => fetchFlows())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const fetchAll = async () => { await Promise.all([fetchZones(), fetchFlows(), fetchSpecialists(), fetchPatients()]); };
  const fetchZones = async () => {
    const { data } = await supabase.from("floor_zones").select("*").eq("is_active", true).order("created_at");
    setZones((data as any) || []);
  };
  const fetchSpecialists = async () => {
    const { data } = await supabase.from("specialists").select("id, full_name, specialty, user_id, consultation_fee").eq("is_active", true).order("full_name");
    setSpecialists((data as any) || []);
  };
  const fetchPatients = async () => {
    const { data } = await supabase.from("patients").select("id, full_name, phone, date_of_birth").order("full_name");
    setPatients((data as any) || []);
  };
  const fetchFlows = async () => {
    const since = new Date(); since.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("patient_flow")
      .select("*, patients(id,full_name,phone,date_of_birth), specialists(full_name,specialty)")
      .gte("arrived_at", since.toISOString())
      .is("exited_at", null)
      .order("arrived_at");
    setFlows((data as any) || []);
  };

  // ===== Zone editor =====
  const openNewZone = () => {
    setSelectedZone(null);
    setZoneForm({ name: "", zone_type: "consultorio", color: "#1e3a8a", specialist_id: "", capacity: "1", notes: "" });
    setZoneEditOpen(true);
  };
  const openEditZone = (z: Zone) => {
    setSelectedZone(z);
    setZoneForm({
      name: z.name, zone_type: z.zone_type, color: z.color,
      specialist_id: z.specialist_id ?? "", capacity: String(z.capacity), notes: z.notes ?? "",
    });
    setZoneEditOpen(true);
  };
  const saveZone = async () => {
    const payload: any = {
      name: zoneForm.name,
      zone_type: zoneForm.zone_type,
      color: zoneForm.color,
      specialist_id: zoneForm.specialist_id || null,
      capacity: parseInt(zoneForm.capacity) || 1,
      notes: zoneForm.notes || null,
    };
    let error;
    if (selectedZone) {
      ({ error } = await supabase.from("floor_zones").update(payload).eq("id", selectedZone.id));
    } else {
      payload.x = 60; payload.y = 60; payload.width = 200; payload.height = 140;
      ({ error } = await supabase.from("floor_zones").insert(payload));
    }
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: selectedZone ? "Zona actualizada" : "Zona creada" }); setZoneEditOpen(false); fetchZones(); }
  };
  const deleteZone = async () => {
    if (!selectedZone) return;
    if (!confirm("¿Eliminar esta zona?")) return;
    const { error } = await supabase.from("floor_zones").update({ is_active: false }).eq("id", selectedZone.id);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { setZoneEditOpen(false); fetchZones(); }
  };

  // ===== Drag / Resize =====
  const onMouseDownZone = (e: React.MouseEvent, z: Zone, mode: "move" | "resize") => {
    if (!editMode) return;
    e.preventDefault(); e.stopPropagation();
    dragRef.current = { id: z.id, mode, startX: e.clientX, startY: e.clientY, orig: { ...z } };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };
  const onMove = (e: MouseEvent) => {
    const d = dragRef.current; if (!d) return;
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
    setZones(prev => prev.map(z => {
      if (z.id !== d.id) return z;
      if (d.mode === "move") return { ...z, x: Math.max(0, d.orig.x + dx), y: Math.max(0, d.orig.y + dy) };
      return { ...z, width: Math.max(80, d.orig.width + dx), height: Math.max(60, d.orig.height + dy) };
    }));
  };
  const onUp = async () => {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    const d = dragRef.current; if (!d) return;
    const z = (zones.find(zz => zz.id === d.id));
    dragRef.current = null;
    if (!z) return;
    await supabase.from("floor_zones").update({ x: z.x, y: z.y, width: z.width, height: z.height }).eq("id", z.id);
  };

  // ===== Patient flow actions =====
  const openIntake = (zoneId?: string) => {
    setIntakeForm({ patient_id: "", zone_id: zoneId ?? "", specialist_id: "" });
    setIntakeOpen(true);
  };
  const checkInPatient = async () => {
    if (!intakeForm.patient_id) return;
    const payload: any = {
      patient_id: intakeForm.patient_id,
      zone_id: intakeForm.zone_id || null,
      specialist_id: intakeForm.specialist_id || null,
      stage: "espera",
      created_by: user?.id,
    };
    const { error } = await supabase.from("patient_flow").insert(payload);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: "Paciente registrado en recepción" }); setIntakeOpen(false); fetchFlows(); }
  };

  const moveFlow = async (flow: Flow, zoneId: string | null, stage?: string) => {
    const upd: any = { zone_id: zoneId };
    if (stage) {
      upd.stage = stage;
      if (stage === "consulta" && !flow.in_consult_at) upd.in_consult_at = new Date().toISOString();
      if (stage === "pago" && !flow.to_payment_at) upd.to_payment_at = new Date().toISOString();
    }
    const { error } = await supabase.from("patient_flow").update(upd).eq("id", flow.id);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { fetchFlows(); setSelectedFlow(null); }
  };
  const exitFlow = async (flow: Flow) => {
    const { error } = await supabase.from("patient_flow").update({ stage: "salida", exited_at: new Date().toISOString() }).eq("id", flow.id);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { fetchFlows(); setSelectedFlow(null); }
  };

  // group flows by zone, plus unassigned
  const flowsByZone = useMemo(() => {
    const map: Record<string, Flow[]> = {};
    for (const f of flows) {
      const k = f.zone_id ?? "__unassigned__";
      (map[k] ||= []).push(f);
    }
    return map;
  }, [flows]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/synapsia")}><ArrowLeft className="w-4 h-4" /></Button>
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold">Synapsia · Planta en vivo</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={editMode ? "default" : "outline"} size="sm" onClick={() => setEditMode(!editMode)}>
              {editMode ? <Unlock className="w-4 h-4 mr-1" /> : <Lock className="w-4 h-4 mr-1" />}
              {editMode ? "Modo edición" : "Bloqueado"}
            </Button>
            {editMode && <Button size="sm" onClick={openNewZone}><Plus className="w-4 h-4 mr-1" /> Nueva zona</Button>}
            <Button size="sm" variant="secondary" onClick={() => openIntake()}><LogIn className="w-4 h-4 mr-1" /> Registrar llegada</Button>
            <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        {/* CANVAS */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Plano del consultorio</span>
              <span className="text-xs font-normal text-muted-foreground">
                {editMode ? "Arrastra para mover · esquina inferior derecha para redimensionar" : "Click en una zona o paciente para ver detalles"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={canvasRef}
              className="relative w-full bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] border rounded-lg overflow-auto"
              style={{ height: "70vh", minHeight: 500 }}
            >
              <div className="relative" style={{ width: 1800, height: 1200 }}>
                {zones.map((z) => {
                  const occupants = (flowsByZone[z.id] || []);
                  return (
                    <div
                      key={z.id}
                      onMouseDown={(e) => onMouseDownZone(e, z, "move")}
                      onClick={(e) => { if (!editMode) { e.stopPropagation(); setSelectedZone(z); } }}
                      onDoubleClick={() => editMode && openEditZone(z)}
                      className={`absolute rounded-xl shadow-sm border-2 ${editMode ? "cursor-move" : "cursor-pointer"} transition-shadow hover:shadow-md`}
                      style={{
                        left: z.x, top: z.y, width: z.width, height: z.height,
                        background: `${z.color}10`, borderColor: z.color,
                      }}
                    >
                      <div className="p-2 flex items-center justify-between gap-1" style={{ background: z.color, color: "white", borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                        <div className="flex items-center gap-1 min-w-0">
                          {z.zone_type === "consultorio" && <Stethoscope className="w-3.5 h-3.5 shrink-0" />}
                          {z.zone_type === "recepcion" && <ClipboardList className="w-3.5 h-3.5 shrink-0" />}
                          {z.zone_type === "espera" && <User className="w-3.5 h-3.5 shrink-0" />}
                          {z.zone_type === "laboratorio" && <FileText className="w-3.5 h-3.5 shrink-0" />}
                          <span className="text-xs font-semibold truncate">{z.name}</span>
                        </div>
                        <Badge variant="secondary" className="h-5 text-[10px] px-1.5">{occupants.length}/{z.capacity}</Badge>
                      </div>
                      <div className="p-2 space-y-1 overflow-auto" style={{ maxHeight: z.height - 40 }}>
                        {z.specialist_id && (
                          <div className="text-[10px] flex items-center gap-1 text-muted-foreground">
                            <UserCheck className="w-3 h-3" />
                            {specialists.find(s => s.id === z.specialist_id)?.full_name ?? "—"}
                          </div>
                        )}
                        {occupants.map((f) => (
                          <button
                            key={f.id}
                            onClick={(e) => { e.stopPropagation(); setSelectedFlow(f); }}
                            className={`w-full text-left flex items-center gap-1.5 px-1.5 py-1 rounded border ${STAGE_COLOR[f.stage]} hover:scale-[1.02] transition-transform`}
                          >
                            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
                              <User className="w-3 h-3 text-foreground" />
                            </div>
                            <span className="text-[11px] font-medium truncate">{f.patients.full_name}</span>
                          </button>
                        ))}
                      </div>
                      {editMode && (
                        <div
                          onMouseDown={(e) => onMouseDownZone(e, z, "resize")}
                          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
                          style={{ background: z.color, clipPath: "polygon(100% 0, 100% 100%, 0 100%)", borderBottomRightRadius: 8 }}
                        />
                      )}
                    </div>
                  );
                })}
                {zones.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                    Activa el modo edición y crea tu primera zona (consultorio, recepción, espera, laboratorio).
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SIDE: Unassigned + legend */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Sin ubicar ({(flowsByZone["__unassigned__"] || []).length})</CardTitle></CardHeader>
            <CardContent className="space-y-1.5 max-h-72 overflow-auto">
              {(flowsByZone["__unassigned__"] || []).map((f) => (
                <button key={f.id} onClick={() => setSelectedFlow(f)} className={`w-full text-left p-2 rounded border ${STAGE_COLOR[f.stage]}`}>
                  <div className="text-xs font-semibold">{f.patients.full_name}</div>
                  <div className="text-[10px] opacity-70">{STAGE_LABEL[f.stage]} · {formatDistanceToNow(new Date(f.arrived_at), { locale: es, addSuffix: true })}</div>
                </button>
              ))}
              {(flowsByZone["__unassigned__"] || []).length === 0 && <p className="text-xs text-muted-foreground">Sin pacientes pendientes de asignar.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Especialistas presentes</CardTitle></CardHeader>
            <CardContent className="space-y-1.5 max-h-72 overflow-auto">
              {specialists.map((s) => {
                const inZone = zones.find(z => z.specialist_id === s.id);
                const myFlows = flows.filter(f => f.specialist_id === s.id);
                return (
                  <button key={s.id} onClick={() => setSelectedSpecialist(s)} className="w-full text-left p-2 rounded border hover:bg-accent/50 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{s.full_name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{s.specialty} · {inZone?.name ?? "Sin asignar"}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{myFlows.length}</Badge>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Etapas</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {Object.entries(STAGE_LABEL).map(([k, v]) => (
                <div key={k} className={`text-xs px-2 py-1 rounded border ${STAGE_COLOR[k]}`}>{v}</div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* === Zone editor dialog === */}
      <Dialog open={zoneEditOpen} onOpenChange={setZoneEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{selectedZone ? "Editar zona" : "Nueva zona"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Nombre *</Label><Input value={zoneForm.name} onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })} placeholder="Consultorio 1" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={zoneForm.zone_type} onValueChange={(v) => { const t = ZONE_TYPES.find(x => x.value === v); setZoneForm({ ...zoneForm, zone_type: v, color: t?.color ?? zoneForm.color }); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ZONE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Color</Label><Input type="color" value={zoneForm.color} onChange={(e) => setZoneForm({ ...zoneForm, color: e.target.value })} className="h-10 p-1" /></div>
            </div>
            <div className="space-y-2">
              <Label>Especialista asignado</Label>
              <Select value={zoneForm.specialist_id || "__none__"} onValueChange={(v) => setZoneForm({ ...zoneForm, specialist_id: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Ninguno" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Ninguno</SelectItem>
                  {specialists.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name} — {s.specialty}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2"><Label>Capacidad</Label><Input type="number" min="1" value={zoneForm.capacity} onChange={(e) => setZoneForm({ ...zoneForm, capacity: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Notas</Label><Textarea rows={2} value={zoneForm.notes} onChange={(e) => setZoneForm({ ...zoneForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter className="gap-2">
            {selectedZone && <Button variant="destructive" onClick={deleteZone}><Trash2 className="w-4 h-4 mr-1" />Eliminar</Button>}
            <Button variant="outline" onClick={() => setZoneEditOpen(false)}>Cancelar</Button>
            <Button onClick={saveZone} disabled={!zoneForm.name}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Intake dialog === */}
      <Dialog open={intakeOpen} onOpenChange={setIntakeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar llegada de paciente</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select value={intakeForm.patient_id} onValueChange={(v) => setIntakeForm({ ...intakeForm, patient_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar paciente" /></SelectTrigger>
                <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Especialista esperado</Label>
              <Select value={intakeForm.specialist_id || "__none__"} onValueChange={(v) => setIntakeForm({ ...intakeForm, specialist_id: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Sin especialista" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin asignar</SelectItem>
                  {specialists.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ubicación inicial</Label>
              <Select value={intakeForm.zone_id || "__none__"} onValueChange={(v) => setIntakeForm({ ...intakeForm, zone_id: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Sin ubicar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin ubicar</SelectItem>
                  {zones.map(z => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIntakeOpen(false)}>Cancelar</Button>
            <Button onClick={checkInPatient} disabled={!intakeForm.patient_id}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Patient flow side panel === */}
      <Sheet open={!!selectedFlow} onOpenChange={(o) => !o && setSelectedFlow(null)}>
        <SheetContent className="w-[380px] sm:w-[420px]">
          {selectedFlow && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedFlow.patients.full_name}</SheetTitle>
                <SheetDescription>
                  <Badge className={STAGE_COLOR[selectedFlow.stage]} variant="outline">{STAGE_LABEL[selectedFlow.stage]}</Badge>
                  <span className="ml-2 text-xs">Llegó {formatDistanceToNow(new Date(selectedFlow.arrived_at), { locale: es, addSuffix: true })}</span>
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs">Teléfono</Label><div>{selectedFlow.patients.phone ?? "—"}</div></div>
                  <div><Label className="text-xs">Nacimiento</Label><div>{selectedFlow.patients.date_of_birth ?? "—"}</div></div>
                </div>
                <div><Label className="text-xs">Especialista</Label><div>{selectedFlow.specialists?.full_name ?? "Sin asignar"}</div></div>

                <div className="border rounded p-2 bg-muted/30 text-xs space-y-1">
                  <div>Llegada: {format(new Date(selectedFlow.arrived_at), "HH:mm", { locale: es })}</div>
                  {selectedFlow.in_consult_at && <div>En consulta: {format(new Date(selectedFlow.in_consult_at), "HH:mm")}</div>}
                  {selectedFlow.to_payment_at && <div>A pago: {format(new Date(selectedFlow.to_payment_at), "HH:mm")}</div>}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Mover a zona</Label>
                  <Select value={selectedFlow.zone_id ?? "__none__"} onValueChange={(v) => moveFlow(selectedFlow, v === "__none__" ? null : v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin ubicar</SelectItem>
                      {zones.map(z => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" onClick={() => moveFlow(selectedFlow, selectedFlow.zone_id, "consulta")}>
                    <Stethoscope className="w-4 h-4 mr-1" /> En consulta
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => moveFlow(selectedFlow, selectedFlow.zone_id, "pago")}>
                    <DollarSign className="w-4 h-4 mr-1" /> A pago
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="secondary" asChild>
                    <Link to={`/synapsia/records/${selectedFlow.patient_id}`}><FileText className="w-4 h-4 mr-1" /> Expediente</Link>
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => exitFlow(selectedFlow)}>
                    Marcar salida
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* === Zone side panel (view mode) === */}
      <Sheet open={!!selectedZone && !zoneEditOpen} onOpenChange={(o) => !o && setSelectedZone(null)}>
        <SheetContent className="w-[360px]">
          {selectedZone && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedZone.name}</SheetTitle>
                <SheetDescription>{ZONE_TYPES.find(t => t.value === selectedZone.zone_type)?.label}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-3 text-sm">
                {selectedZone.specialist_id && (
                  <div>
                    <Label className="text-xs">Especialista a cargo</Label>
                    <div>{specialists.find(s => s.id === selectedZone.specialist_id)?.full_name}</div>
                  </div>
                )}
                <div>
                  <Label className="text-xs">Pacientes ({(flowsByZone[selectedZone.id] || []).length}/{selectedZone.capacity})</Label>
                  <div className="space-y-1 mt-1">
                    {(flowsByZone[selectedZone.id] || []).map(f => (
                      <button key={f.id} onClick={() => { setSelectedZone(null); setSelectedFlow(f); }} className={`w-full text-left p-2 rounded border ${STAGE_COLOR[f.stage]}`}>
                        <div className="text-xs font-semibold">{f.patients.full_name}</div>
                        <div className="text-[10px] opacity-70">{STAGE_LABEL[f.stage]}</div>
                      </button>
                    ))}
                    {(flowsByZone[selectedZone.id] || []).length === 0 && <p className="text-xs text-muted-foreground">Vacío.</p>}
                  </div>
                </div>
                <Button size="sm" className="w-full" variant="outline" onClick={() => openIntake(selectedZone.id)}>
                  <Plus className="w-4 h-4 mr-1" /> Asignar paciente aquí
                </Button>
                {selectedZone.notes && <div className="text-xs text-muted-foreground border-l-2 pl-2">{selectedZone.notes}</div>}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* === Specialist side panel === */}
      <Sheet open={!!selectedSpecialist} onOpenChange={(o) => !o && setSelectedSpecialist(null)}>
        <SheetContent className="w-[380px]">
          {selectedSpecialist && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedSpecialist.full_name}</SheetTitle>
                <SheetDescription>{selectedSpecialist.specialty} · ${Number(selectedSpecialist.consultation_fee).toLocaleString("es-MX")}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-2 text-sm">
                <div>
                  <Label className="text-xs">Pacientes hoy</Label>
                  <div className="space-y-1 mt-1">
                    {flows.filter(f => f.specialist_id === selectedSpecialist.id).map(f => (
                      <button key={f.id} onClick={() => { setSelectedSpecialist(null); setSelectedFlow(f); }} className={`w-full text-left p-2 rounded border ${STAGE_COLOR[f.stage]}`}>
                        <div className="text-xs font-semibold">{f.patients.full_name}</div>
                        <div className="text-[10px] opacity-70">{STAGE_LABEL[f.stage]}</div>
                      </button>
                    ))}
                    {flows.filter(f => f.specialist_id === selectedSpecialist.id).length === 0 && <p className="text-xs text-muted-foreground">Sin pacientes activos.</p>}
                  </div>
                </div>
                <Button size="sm" className="w-full" variant="secondary" asChild>
                  <Link to="/synapsia/metrics"><FileText className="w-4 h-4 mr-1" /> Ver métricas y estado de cuenta</Link>
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
