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
  Stethoscope, ClipboardList, FileText, DollarSign, LogIn, RotateCw,
  Armchair, Sofa, Bed, Square,
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
  rotation: number;
  specialist_id: string | null;
  capacity: number;
  notes: string | null;
}
interface Furniture {
  id: string;
  zone_id: string | null;
  furniture_type: string;
  label: string | null;
  x: number; y: number; width: number; height: number;
  rotation: number;
  color: string;
  patient_id: string | null;
}
interface Specialist { id: string; full_name: string; specialty: string; user_id: string | null; consultation_fee: number; }
interface Patient { id: string; full_name: string; phone: string | null; date_of_birth: string | null; }
interface Flow {
  id: string;
  patient_id: string;
  zone_id: string | null;
  specialist_id: string | null;
  stage: string;
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

const FURNITURE_TYPES = [
  { value: "silla_espera", label: "Silla de espera", icon: Armchair, color: "#64748b", w: 38, h: 38 },
  { value: "sillon", label: "Sillón", icon: Sofa, color: "#7c3aed", w: 70, h: 42 },
  { value: "silla", label: "Silla", icon: Armchair, color: "#475569", w: 34, h: 34 },
  { value: "escritorio", label: "Escritorio", icon: Square, color: "#92400e", w: 110, h: 50 },
  { value: "camilla", label: "Camilla", icon: Bed, color: "#0f766e", w: 120, h: 50 },
  { value: "mesa", label: "Mesa", icon: Square, color: "#525252", w: 70, h: 70 },
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
  const [furniture, setFurniture] = useState<Furniture[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(null);
  const [selectedFurniture, setSelectedFurniture] = useState<Furniture | null>(null);

  const [zoneEditOpen, setZoneEditOpen] = useState(false);
  const [zoneForm, setZoneForm] = useState({
    name: "", zone_type: "consultorio", color: "#1e3a8a", specialist_id: "", capacity: "1", notes: ""
  });

  const [furnEditOpen, setFurnEditOpen] = useState(false);
  const [furnForm, setFurnForm] = useState({
    furniture_type: "silla_espera", label: "", color: "#64748b", patient_id: "", zone_id: "",
  });

  const [intakeOpen, setIntakeOpen] = useState(false);
  const [intakeForm, setIntakeForm] = useState({ patient_id: "", zone_id: "", specialist_id: "" });

  // drag/resize/rotate state for ZONES
  const dragRef = useRef<{ id: string; mode: "move" | "resize" | "rotate"; startX: number; startY: number; orig: Zone; latest: Zone; cx?: number; cy?: number; startAngle?: number } | null>(null);
  // drag/resize/rotate state for FURNITURE
  const fDragRef = useRef<{ id: string; mode: "move" | "resize" | "rotate"; startX: number; startY: number; orig: Furniture; latest: Furniture; cx?: number; cy?: number; startAngle?: number } | null>(null);

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => {
    const ch = supabase
      .channel("floor-canvas")
      .on("postgres_changes", { event: "*", schema: "public", table: "floor_zones" }, () => fetchZones())
      .on("postgres_changes", { event: "*", schema: "public", table: "floor_furniture" }, () => fetchFurniture())
      .on("postgres_changes", { event: "*", schema: "public", table: "patient_flow" }, () => fetchFlows())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Rotación 90° con flechas izquierda/derecha sobre el mueble seleccionado (modo edición)
  useEffect(() => {
    if (!editMode || !selectedFurniture) return;
    const onKey = async (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      e.preventDefault();
      const delta = e.key === "ArrowRight" ? 90 : -90;
      const newRot = (selectedFurniture.rotation || 0) + delta;
      setFurniture(prev => prev.map(x => x.id === selectedFurniture.id ? { ...x, rotation: newRot } : x));
      setSelectedFurniture({ ...selectedFurniture, rotation: newRot });
      await supabase.from("floor_furniture" as any).update({ rotation: newRot }).eq("id", selectedFurniture.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editMode, selectedFurniture]);

  const fetchAll = async () => { await Promise.all([fetchZones(), fetchFurniture(), fetchFlows(), fetchSpecialists(), fetchPatients()]); };
  const fetchZones = async () => {
    const { data } = await supabase.from("floor_zones").select("*").eq("is_active", true).order("created_at");
    setZones((data as any) || []);
  };
  const fetchFurniture = async () => {
    const { data } = await supabase.from("floor_furniture" as any).select("*").eq("is_active", true).order("created_at");
    setFurniture((data as any) || []);
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
      payload.x = 60; payload.y = 60; payload.width = 200; payload.height = 140; payload.rotation = 0;
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

  // ===== Zone Drag / Resize / Rotate =====
  const onMouseDownZone = (e: React.MouseEvent, z: Zone, mode: "move" | "resize" | "rotate") => {
    if (!editMode) return;
    e.preventDefault(); e.stopPropagation();
    const rect = canvasRef.current?.querySelector(".canvas-inner")?.getBoundingClientRect();
    const cx = (rect?.left ?? 0) + z.x + z.width / 2;
    const cy = (rect?.top ?? 0) + z.y + z.height / 2;
    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
    dragRef.current = { id: z.id, mode, startX: e.clientX, startY: e.clientY, orig: { ...z }, latest: { ...z }, cx, cy, startAngle };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };
  const onMove = (e: MouseEvent) => {
    const d = dragRef.current; if (!d) return;
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
    let next: Zone = d.latest;
    if (d.mode === "move") {
      next = { ...d.orig, x: Math.max(0, d.orig.x + dx), y: Math.max(0, d.orig.y + dy) };
    } else if (d.mode === "resize") {
      next = { ...d.orig, width: Math.max(80, d.orig.width + dx), height: Math.max(60, d.orig.height + dy) };
    } else if (d.mode === "rotate" && d.cx !== undefined && d.cy !== undefined && d.startAngle !== undefined) {
      const ang = Math.atan2(e.clientY - d.cy, e.clientX - d.cx) * 180 / Math.PI;
      next = { ...d.orig, rotation: d.orig.rotation + (ang - d.startAngle) };
    }
    d.latest = next;
    setZones(prev => prev.map(z => z.id === d.id ? next : z));
  };
  const onUp = async () => {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    const d = dragRef.current; if (!d) return;
    const z = d.latest;
    dragRef.current = null;
    await supabase.from("floor_zones").update({ x: z.x, y: z.y, width: z.width, height: z.height, rotation: z.rotation }).eq("id", z.id);
  };

  // ===== Furniture =====
  const addFurniture = async (type: string) => {
    const def = FURNITURE_TYPES.find(t => t.value === type);
    if (!def) return;
    const payload: any = {
      furniture_type: type,
      color: def.color,
      x: 80, y: 80, width: def.w, height: def.h, rotation: 0,
    };
    const { error } = await supabase.from("floor_furniture" as any).insert(payload);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else fetchFurniture();
  };
  const openEditFurniture = (f: Furniture) => {
    setSelectedFurniture(f);
    setFurnForm({
      furniture_type: f.furniture_type,
      label: f.label ?? "",
      color: f.color,
      patient_id: f.patient_id ?? "",
      zone_id: f.zone_id ?? "",
    });
    setFurnEditOpen(true);
  };
  const saveFurniture = async () => {
    if (!selectedFurniture) return;
    const { error } = await supabase.from("floor_furniture" as any).update({
      furniture_type: furnForm.furniture_type,
      label: furnForm.label || null,
      color: furnForm.color,
      patient_id: furnForm.patient_id || null,
      zone_id: furnForm.zone_id || null,
    }).eq("id", selectedFurniture.id);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { setFurnEditOpen(false); fetchFurniture(); }
  };
  const deleteFurniture = async () => {
    if (!selectedFurniture) return;
    if (!confirm("¿Eliminar este mobiliario?")) return;
    await supabase.from("floor_furniture" as any).update({ is_active: false }).eq("id", selectedFurniture.id);
    setFurnEditOpen(false); fetchFurniture();
  };

  const onMouseDownFurn = (e: React.MouseEvent, f: Furniture, mode: "move" | "resize" | "rotate") => {
    if (!editMode) return;
    e.preventDefault(); e.stopPropagation();
    setSelectedFurniture(f);
    const rect = canvasRef.current?.querySelector(".canvas-inner")?.getBoundingClientRect();
    const cx = (rect?.left ?? 0) + f.x + f.width / 2;
    const cy = (rect?.top ?? 0) + f.y + f.height / 2;
    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
    fDragRef.current = { id: f.id, mode, startX: e.clientX, startY: e.clientY, orig: { ...f }, latest: { ...f }, cx, cy, startAngle };
    document.addEventListener("mousemove", onFMove);
    document.addEventListener("mouseup", onFUp);
  };
  const onFMove = (e: MouseEvent) => {
    const d = fDragRef.current; if (!d) return;
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
    let next: Furniture = d.latest;
    if (d.mode === "move") {
      next = { ...d.orig, x: Math.max(0, d.orig.x + dx), y: Math.max(0, d.orig.y + dy) };
    } else if (d.mode === "resize") {
      next = { ...d.orig, width: Math.max(20, d.orig.width + dx), height: Math.max(20, d.orig.height + dy) };
    } else if (d.mode === "rotate" && d.cx !== undefined && d.cy !== undefined && d.startAngle !== undefined) {
      const ang = Math.atan2(e.clientY - d.cy, e.clientX - d.cx) * 180 / Math.PI;
      next = { ...d.orig, rotation: d.orig.rotation + (ang - d.startAngle) };
    }
    d.latest = next;
    setFurniture(prev => prev.map(z => z.id === d.id ? next : z));
  };
  const onFUp = async () => {
    document.removeEventListener("mousemove", onFMove);
    document.removeEventListener("mouseup", onFUp);
    const d = fDragRef.current; if (!d) return;
    const f = d.latest;
    fDragRef.current = null;
    await supabase.from("floor_furniture" as any).update({ x: f.x, y: f.y, width: f.width, height: f.height, rotation: f.rotation }).eq("id", f.id);
  };

  // ===== Patient flow =====
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

  const flowsByZone = useMemo(() => {
    const map: Record<string, Flow[]> = {};
    for (const f of flows) {
      const k = f.zone_id ?? "__unassigned__";
      (map[k] ||= []).push(f);
    }
    return map;
  }, [flows]);

  const patientById = (id: string | null) => id ? patients.find(p => p.id === id) : null;

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

      {editMode && (
        <div className="bg-muted/50 border-b">
          <div className="max-w-[1600px] mx-auto px-4 py-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground mr-2">Agregar mobiliario:</span>
            {FURNITURE_TYPES.map(t => {
              const Icon = t.icon;
              return (
                <Button key={t.value} variant="outline" size="sm" onClick={() => addFurniture(t.value)} className="h-8">
                  <Icon className="w-3.5 h-3.5 mr-1" /> {t.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      <main className="max-w-[1600px] mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Plano del consultorio</span>
              <span className="text-xs font-normal text-muted-foreground">
                {editMode ? "Mover · esquina ↘ redimensionar · ↻ rotar · doble-clic: editar" : "Click en zona, mueble o paciente"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={canvasRef}
              className="relative w-full bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] border rounded-lg overflow-auto"
              style={{ height: "70vh", minHeight: 500 }}
            >
              <div className="canvas-inner relative" style={{ width: 1800, height: 1200 }}>
                {/* ZONES */}
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
                        transform: `rotate(${z.rotation}deg)`, transformOrigin: "center center",
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
                            onMouseDown={(e) => e.stopPropagation()}
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
                        <>
                          <div
                            onMouseDown={(e) => onMouseDownZone(e, z, "resize")}
                            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
                            style={{ background: z.color, clipPath: "polygon(100% 0, 100% 100%, 0 100%)", borderBottomRightRadius: 8 }}
                          />
                          <button
                            onMouseDown={(e) => onMouseDownZone(e, z, "rotate")}
                            className="absolute -top-7 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-2 shadow flex items-center justify-center cursor-grab active:cursor-grabbing"
                            style={{ borderColor: z.color }}
                            title="Rotar"
                          >
                            <RotateCw className="w-3 h-3" style={{ color: z.color }} />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}

                {/* FURNITURE */}
                {furniture.map((f) => {
                  const def = FURNITURE_TYPES.find(t => t.value === f.furniture_type) ?? FURNITURE_TYPES[0];
                  const Icon = def.icon;
                  const occupant = patientById(f.patient_id);
                  const isOccupied = !!occupant;
                  return (
                    <div
                      key={f.id}
                      onMouseDown={(e) => onMouseDownFurn(e, f, "move")}
                      onClick={(e) => { if (!editMode) { e.stopPropagation(); setSelectedFurniture(f); openEditFurniture(f); } }}
                      onDoubleClick={() => editMode && openEditFurniture(f)}
                      className={`absolute rounded-md shadow-sm border-2 flex flex-col items-center justify-center text-white ${editMode ? "cursor-move" : "cursor-pointer"} hover:shadow-md transition-shadow`}
                      style={{
                        left: f.x, top: f.y, width: f.width, height: f.height,
                        background: isOccupied ? f.color : `${f.color}cc`,
                        borderColor: isOccupied ? "#0f172a" : f.color,
                        transform: `rotate(${f.rotation}deg)`, transformOrigin: "center center",
                      }}
                      title={def.label + (occupant ? ` · ${occupant.full_name}` : "")}
                    >
                      <Icon className="w-4 h-4 opacity-90" />
                      {(f.label || occupant) && (
                        <span className="text-[9px] font-semibold truncate max-w-full px-1 leading-tight mt-0.5">
                          {occupant?.full_name ?? f.label}
                        </span>
                      )}
                      {isOccupied && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                      )}
                      {editMode && (
                        <>
                          <div
                            onMouseDown={(e) => onMouseDownFurn(e, f, "resize")}
                            className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize bg-white/80"
                            style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
                          />
                          <button
                            onMouseDown={(e) => onMouseDownFurn(e, f, "rotate")}
                            className="absolute -top-5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border shadow flex items-center justify-center cursor-grab active:cursor-grabbing"
                            title="Rotar"
                          >
                            <RotateCw className="w-2.5 h-2.5 text-foreground" />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}

                {zones.length === 0 && furniture.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                    Activa el modo edición y crea tu primera zona o agrega mobiliario.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

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

      {/* === Furniture editor dialog === */}
      <Dialog open={furnEditOpen} onOpenChange={setFurnEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar mobiliario</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={furnForm.furniture_type} onValueChange={(v) => { const t = FURNITURE_TYPES.find(x => x.value === v); setFurnForm({ ...furnForm, furniture_type: v, color: t?.color ?? furnForm.color }); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FURNITURE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Color</Label><Input type="color" value={furnForm.color} onChange={(e) => setFurnForm({ ...furnForm, color: e.target.value })} className="h-10 p-1" /></div>
            </div>
            <div className="space-y-2"><Label>Etiqueta</Label><Input value={furnForm.label} onChange={(e) => setFurnForm({ ...furnForm, label: e.target.value })} placeholder="Silla A, Escritorio Dr. ..." /></div>
            <div className="space-y-2">
              <Label>Zona contenedora</Label>
              <Select value={furnForm.zone_id || "__none__"} onValueChange={(v) => setFurnForm({ ...furnForm, zone_id: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Sin zona" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin zona</SelectItem>
                  {zones.map(z => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Paciente sentado / asignado</Label>
              <Select value={furnForm.patient_id || "__none__"} onValueChange={(v) => setFurnForm({ ...furnForm, patient_id: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Vacío" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Vacío</SelectItem>
                  {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="destructive" onClick={deleteFurniture}><Trash2 className="w-4 h-4 mr-1" />Eliminar</Button>
            <Button variant="outline" onClick={() => setFurnEditOpen(false)}>Cancelar</Button>
            <Button onClick={saveFurniture}>Guardar</Button>
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
