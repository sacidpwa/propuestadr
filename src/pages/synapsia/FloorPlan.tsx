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
  Stethoscope, ClipboardList, FileText, DollarSign, LogIn, RotateCw, RotateCcw,
  Armchair, Sofa, Bed, Square, DoorClosed, Bath, Droplet, Package,
  Coffee, Refrigerator, Monitor, BookOpen, Archive, Wind,
  BarChart3, Users, Wallet, Calendar as CalendarIcon, Calculator, LayoutDashboard,
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
  // Mobiliario para pacientes / personal
  { value: "silla_espera", label: "Silla de espera", icon: Armchair, color: "#64748b", w: 38, h: 38, decorative: false },
  { value: "sillon", label: "Sillón", icon: Sofa, color: "#7c3aed", w: 70, h: 42, decorative: false },
  { value: "silla", label: "Silla", icon: Armchair, color: "#475569", w: 34, h: 34, decorative: false },
  { value: "escritorio", label: "Escritorio", icon: Square, color: "#92400e", w: 110, h: 50, decorative: false },
  { value: "camilla", label: "Camilla", icon: Bed, color: "#0e7490", w: 90, h: 45, decorative: false },
  // Elementos de layout (decorativos, no asignables)
  { value: "puerta", label: "Puerta", icon: DoorClosed, color: "#a16207", w: 50, h: 12, decorative: true },
  { value: "bano", label: "Baño", icon: Bath, color: "#0369a1", w: 80, h: 80, decorative: true },
  { value: "lavamanos", label: "Lavamanos", icon: Droplet, color: "#0891b2", w: 45, h: 30, decorative: true },
  { value: "bodega", label: "Bodega", icon: Package, color: "#57534e", w: 90, h: 70, decorative: true },
  { value: "mesa_centro", label: "Mesa de centro", icon: Coffee, color: "#78350f", w: 70, h: 45, decorative: true },
  { value: "estante", label: "Estante", icon: BookOpen, color: "#44403c", w: 80, h: 25, decorative: true },
  { value: "archivero", label: "Archivero", icon: Archive, color: "#3f3f46", w: 55, h: 35, decorative: true },
  { value: "refrigerador", label: "Refrigerador", icon: Refrigerator, color: "#1e293b", w: 45, h: 45, decorative: true },
  { value: "tv", label: "Pantalla / TV", icon: Monitor, color: "#0f172a", w: 60, h: 18, decorative: true },
  { value: "aire", label: "Aire acond.", icon: Wind, color: "#475569", w: 55, h: 18, decorative: true },
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
  const { user, signOut, hasRole } = useAuth();
  const isOwner = hasRole("dueno") || hasRole("admin");
  const isReception = hasRole("recepcion");
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

  // Tamaño de canvas (persistente)
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>(() => {
    try { const s = JSON.parse(localStorage.getItem("synapsia_canvas_size") || "null"); if (s?.w && s?.h) return s; } catch {}
    return { w: 1800, h: 1200 };
  });
  useEffect(() => { localStorage.setItem("synapsia_canvas_size", JSON.stringify(canvasSize)); }, [canvasSize]);

  // Zoom del canvas (responsive). Persistente, con auto-fit en móvil.
  const [zoom, setZoom] = useState<number>(() => {
    const v = parseFloat(localStorage.getItem("synapsia_canvas_zoom") || "");
    return Number.isFinite(v) && v > 0 ? v : 1;
  });
  const zoomRef = useRef(zoom);
  useEffect(() => { zoomRef.current = zoom; localStorage.setItem("synapsia_canvas_zoom", String(zoom)); }, [zoom]);
  const fitToWidth = () => {
    const el = canvasRef.current; if (!el) return;
    const avail = el.clientWidth - 4;
    const z = Math.min(1.5, Math.max(0.2, avail / canvasSize.w));
    setZoom(Number(z.toFixed(3)));
  };
  // Auto-fit en móvil al montar / cambiar tamaño
  useEffect(() => {
    const handle = () => { if (window.innerWidth < 768) fitToWidth(); };
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize.w]);

  // Selección múltiple
  const [selectedZoneIds, setSelectedZoneIds] = useState<Set<string>>(new Set());
  const [selectedFurnIds, setSelectedFurnIds] = useState<Set<string>>(new Set());
  const [dragOverFurnId, setDragOverFurnId] = useState<string | null>(null);
  const [dragOverZoneId, setDragOverZoneId] = useState<string | null>(null);

  // Multi-drag (mover grupo)
  const groupDragRef = useRef<{ startX: number; startY: number; zones: Map<string, { x: number; y: number }>; furn: Map<string, { x: number; y: number }>; latestZ: Map<string, { x: number; y: number }>; latestF: Map<string, { x: number; y: number }>; } | null>(null);

  // Marquee de selección
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const marqueeRef = useRef<{ startX: number; startY: number; additive: boolean } | null>(null);

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

  // Atajos de teclado en modo edición: flechas rotan 90°, Supr/Backspace elimina
  useEffect(() => {
    if (!editMode) return;
    const onKey = async (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;

      if ((e.key === "Delete" || e.key === "Backspace")) {
        if (selectedZoneIds.size + selectedFurnIds.size > 1) { e.preventDefault(); await deleteSelection(); return; }
        if (selectedFurniture) { e.preventDefault(); await deleteFurniture(selectedFurniture); return; }
        if (selectedZone) { e.preventDefault(); await deleteZone(selectedZone); return; }
      }

      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const delta = e.key === "ArrowRight" ? 90 : -90;
        if (selectedFurniture) { e.preventDefault(); await rotateFurnitureBy(selectedFurniture, delta); return; }
        if (selectedZone) { e.preventDefault(); await rotateZoneBy(selectedZone, delta); return; }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editMode, selectedFurniture, selectedZone, selectedZoneIds, selectedFurnIds]);

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
  const deleteZone = async (zoneArg?: Zone) => {
    const z = zoneArg || selectedZone;
    if (!z) return;
    if (!confirm(`¿Eliminar la zona "${z.name}"?`)) return;
    const { error } = await supabase.from("floor_zones").update({ is_active: false }).eq("id", z.id);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { setZoneEditOpen(false); setSelectedZone(null); fetchZones(); toast({ title: "Zona eliminada" }); }
  };

  // ===== Zone Drag / Resize / Rotate =====
  const onMouseDownZone = (e: React.MouseEvent, z: Zone, mode: "move" | "resize" | "rotate") => {
    if (!editMode) return;
    e.preventDefault(); e.stopPropagation();
    // Si hay selección múltiple y arrastro un miembro → mover grupo
    if (mode === "move" && (selectedZoneIds.size + selectedFurnIds.size > 1) && selectedZoneIds.has(z.id)) {
      startGroupDrag(e, selectedZoneIds, selectedFurnIds);
      return;
    }
    setSelectedZone(z); setSelectedFurniture(null);
    if (!(e.shiftKey || e.metaKey || e.ctrlKey)) { setSelectedZoneIds(new Set([z.id])); setSelectedFurnIds(new Set()); }
    else { setSelectedZoneIds(prev => new Set(prev).add(z.id)); }
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
    const z = zoomRef.current || 1;
    const dx = (e.clientX - d.startX) / z, dy = (e.clientY - d.startY) / z;
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
    setZones(prev => prev.map(zz => zz.id === d.id ? next : zz));
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
  const deleteFurniture = async (furnArg?: Furniture) => {
    const f = furnArg || selectedFurniture;
    if (!f) return;
    if (!confirm(`¿Eliminar este mobiliario${f.label ? ` "${f.label}"` : ""}?`)) return;
    await supabase.from("floor_furniture" as any).update({ is_active: false }).eq("id", f.id);
    setFurnEditOpen(false); setSelectedFurniture(null); fetchFurniture();
    toast({ title: "Mobiliario eliminado" });
  };

  const rotateFurnitureBy = async (f: Furniture, deg: number) => {
    const newRot = (f.rotation || 0) + deg;
    setFurniture(prev => prev.map(x => x.id === f.id ? { ...x, rotation: newRot } : x));
    setSelectedFurniture({ ...f, rotation: newRot });
    await supabase.from("floor_furniture" as any).update({ rotation: newRot }).eq("id", f.id);
  };
  const rotateZoneBy = async (z: Zone, deg: number) => {
    const newRot = (z.rotation || 0) + deg;
    setZones(prev => prev.map(x => x.id === z.id ? { ...x, rotation: newRot } : x));
    setSelectedZone({ ...z, rotation: newRot });
    await supabase.from("floor_zones").update({ rotation: newRot }).eq("id", z.id);
  };

  // ===== Selección múltiple helpers =====
  const toggleSelectZone = (z: Zone, additive: boolean) => {
    setSelectedZoneIds(prev => {
      const next = new Set(additive ? prev : []);
      if (additive && next.has(z.id)) next.delete(z.id); else next.add(z.id);
      return next;
    });
    if (!additive) setSelectedFurnIds(new Set());
    setSelectedZone(z); setSelectedFurniture(null);
  };
  const toggleSelectFurn = (f: Furniture, additive: boolean) => {
    setSelectedFurnIds(prev => {
      const next = new Set(additive ? prev : []);
      if (additive && next.has(f.id)) next.delete(f.id); else next.add(f.id);
      return next;
    });
    if (!additive) setSelectedZoneIds(new Set());
    setSelectedFurniture(f); setSelectedZone(null);
  };
  const clearSelection = () => {
    setSelectedZoneIds(new Set()); setSelectedFurnIds(new Set());
    setSelectedZone(null); setSelectedFurniture(null);
  };

  // Mover grupo
  const startGroupDrag = (e: React.MouseEvent, zoneIds: Set<string>, furnIds: Set<string>) => {
    const zMap = new Map<string, { x: number; y: number }>();
    const fMap = new Map<string, { x: number; y: number }>();
    zones.forEach(z => { if (zoneIds.has(z.id)) zMap.set(z.id, { x: z.x, y: z.y }); });
    furniture.forEach(f => { if (furnIds.has(f.id)) fMap.set(f.id, { x: f.x, y: f.y }); });
    groupDragRef.current = {
      startX: e.clientX, startY: e.clientY,
      zones: zMap, furn: fMap,
      latestZ: new Map(zMap), latestF: new Map(fMap),
    };
    document.addEventListener("mousemove", onGroupMove);
    document.addEventListener("mouseup", onGroupUp);
  };
  const onGroupMove = (e: MouseEvent) => {
    const g = groupDragRef.current; if (!g) return;
    const z = zoomRef.current || 1;
    const dx = (e.clientX - g.startX) / z, dy = (e.clientY - g.startY) / z;
    const nz = new Map<string, { x: number; y: number }>();
    g.zones.forEach((p, id) => nz.set(id, { x: Math.max(0, p.x + dx), y: Math.max(0, p.y + dy) }));
    const nf = new Map<string, { x: number; y: number }>();
    g.furn.forEach((p, id) => nf.set(id, { x: Math.max(0, p.x + dx), y: Math.max(0, p.y + dy) }));
    g.latestZ = nz; g.latestF = nf;
    setZones(prev => prev.map(zz => nz.has(zz.id) ? { ...zz, ...nz.get(zz.id)! } : zz));
    setFurniture(prev => prev.map(f => nf.has(f.id) ? { ...f, ...nf.get(f.id)! } : f));
  };
  const onGroupUp = async () => {
    document.removeEventListener("mousemove", onGroupMove);
    document.removeEventListener("mouseup", onGroupUp);
    const g = groupDragRef.current; if (!g) return;
    groupDragRef.current = null;
    const zUpdates = Array.from(g.latestZ.entries()).map(([id, p]) =>
      supabase.from("floor_zones").update({ x: p.x, y: p.y }).eq("id", id));
    const fUpdates = Array.from(g.latestF.entries()).map(([id, p]) =>
      supabase.from("floor_furniture" as any).update({ x: p.x, y: p.y }).eq("id", id));
    await Promise.all([...zUpdates, ...fUpdates]);
  };

  // Eliminar selección múltiple
  const deleteSelection = async () => {
    if (selectedZoneIds.size === 0 && selectedFurnIds.size === 0) return;
    if (!confirm(`¿Eliminar ${selectedZoneIds.size} zona(s) y ${selectedFurnIds.size} mueble(s) seleccionados?`)) return;
    if (selectedZoneIds.size > 0)
      await supabase.from("floor_zones").update({ is_active: false }).in("id", Array.from(selectedZoneIds));
    if (selectedFurnIds.size > 0)
      await supabase.from("floor_furniture" as any).update({ is_active: false }).in("id", Array.from(selectedFurnIds));
    clearSelection(); fetchZones(); fetchFurniture();
  };

  // Marquee selection
  const onCanvasMouseDown = (e: React.MouseEvent) => {
    if (!editMode) return;
    if (e.target !== e.currentTarget) return; // solo si clickeo el fondo
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const z = zoomRef.current || 1;
    const sx = (e.clientX - rect.left) / z, sy = (e.clientY - rect.top) / z;
    marqueeRef.current = { startX: sx, startY: sy, additive: e.shiftKey || e.metaKey || e.ctrlKey };
    setMarquee({ x: sx, y: sy, w: 0, h: 0 });
    const move = (ev: MouseEvent) => {
      const m = marqueeRef.current; if (!m) return;
      const cx = (ev.clientX - rect.left) / z, cy = (ev.clientY - rect.top) / z;
      setMarquee({
        x: Math.min(m.startX, cx), y: Math.min(m.startY, cy),
        w: Math.abs(cx - m.startX), h: Math.abs(cy - m.startY),
      });
    };
    const up = (ev: MouseEvent) => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      const m = marqueeRef.current; if (!m) { setMarquee(null); return; }
      const cx = (ev.clientX - rect.left) / z, cy = (ev.clientY - rect.top) / z;
      const x1 = Math.min(m.startX, cx), y1 = Math.min(m.startY, cy);
      const x2 = Math.max(m.startX, cx), y2 = Math.max(m.startY, cy);
      const within = (ix: number, iy: number, iw: number, ih: number) =>
        ix < x2 && ix + iw > x1 && iy < y2 && iy + ih > y1;
      const newZ = new Set(m.additive ? selectedZoneIds : []);
      const newF = new Set(m.additive ? selectedFurnIds : []);
      zones.forEach(zz => { if (within(zz.x, zz.y, zz.width, zz.height)) newZ.add(zz.id); });
      furniture.forEach(f => { if (within(f.x, f.y, f.width, f.height)) newF.add(f.id); });
      setSelectedZoneIds(newZ); setSelectedFurnIds(newF);
      setMarquee(null); marqueeRef.current = null;
      if (newZ.size + newF.size === 0) clearSelection();
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  };

  const onMouseDownFurn = (e: React.MouseEvent, f: Furniture, mode: "move" | "resize" | "rotate") => {
    if (!editMode) return;
    e.preventDefault(); e.stopPropagation();
    if (mode === "move" && (selectedZoneIds.size + selectedFurnIds.size > 1) && selectedFurnIds.has(f.id)) {
      startGroupDrag(e, selectedZoneIds, selectedFurnIds);
      return;
    }
    setSelectedFurniture(f); setSelectedZone(null);
    if (!(e.shiftKey || e.metaKey || e.ctrlKey)) { setSelectedFurnIds(new Set([f.id])); setSelectedZoneIds(new Set()); }
    else { setSelectedFurnIds(prev => new Set(prev).add(f.id)); }
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
    const z = zoomRef.current || 1;
    const dx = (e.clientX - d.startX) / z, dy = (e.clientY - d.startY) / z;
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
    setFurniture(prev => prev.map(zz => zz.id === d.id ? next : zz));
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

  // === Drag & Drop: sentar paciente en una silla / mueble ===
  const seatPatientOnFurniture = async (furnitureId: string, patientId: string) => {
    const target = furniture.find(f => f.id === furnitureId);
    if (!target) return;
    const def = FURNITURE_TYPES.find(t => t.value === target.furniture_type);
    if (def?.decorative) {
      toast({ variant: "destructive", title: "No disponible", description: "Este elemento es decorativo." });
      return;
    }
    // 1) Liberar CUALQUIER otra silla que tenga al mismo paciente (no puede estar en dos lugares)
    const previous = furniture.filter(f => f.patient_id === patientId && f.id !== furnitureId);
    for (const p of previous) {
      const { error: relErr } = await supabase.from("floor_furniture").update({ patient_id: null }).eq("id", p.id);
      if (relErr) { toast({ variant: "destructive", title: "Error", description: relErr.message }); return; }
    }
    // 2) Asignar paciente a la nueva silla
    const { error: fErr } = await supabase
      .from("floor_furniture")
      .update({ patient_id: patientId })
      .eq("id", furnitureId);
    if (fErr) { toast({ variant: "destructive", title: "Error", description: fErr.message }); return; }

    // 3) Sincronizar el flow: zona = la del mueble; etapa según el tipo de zona destino
    const flow = flows.find(fl => fl.patient_id === patientId && fl.stage !== "salida");
    if (flow) {
      const targetZone = zones.find(z => z.id === target.zone_id);
      const upd: any = { zone_id: target.zone_id ?? null };
      if (targetZone?.zone_type === "consultorio") {
        upd.stage = "consulta";
        if (!flow.in_consult_at) upd.in_consult_at = new Date().toISOString();
        if (targetZone.specialist_id) upd.specialist_id = targetZone.specialist_id;
      } else if (targetZone?.zone_type === "recepcion" || targetZone?.zone_type === "espera") {
        upd.stage = "espera";
      }
      const { error: flErr } = await supabase.from("patient_flow").update(upd).eq("id", flow.id);
      if (flErr) { toast({ variant: "destructive", title: "Error", description: flErr.message }); return; }
    }
    fetchFurniture();
    fetchFlows();
    const dest = zones.find(z => z.id === target.zone_id);
    toast({ title: "Paciente movido", description: dest ? `Ahora en ${dest.name}.` : "Sentado en silla sin zona." });
  };

  const movePatientToZone = async (zoneId: string, patientId: string) => {
    const targetZone = zones.find(z => z.id === zoneId);
    if (!targetZone) return;

    const occupiedFurniture = furniture.filter(f => f.patient_id === patientId);
    for (const f of occupiedFurniture) {
      const { error } = await supabase.from("floor_furniture").update({ patient_id: null }).eq("id", f.id);
      if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }
    }

    const upd: any = { zone_id: zoneId };
    if (targetZone.zone_type === "consultorio") {
      upd.stage = "consulta";
      upd.in_consult_at = new Date().toISOString();
      if (targetZone.specialist_id) upd.specialist_id = targetZone.specialist_id;
    } else if (targetZone.zone_type === "recepcion" || targetZone.zone_type === "espera") {
      upd.stage = "espera";
    }

    const { error } = await supabase
      .from("patient_flow")
      .update(upd)
      .eq("patient_id", patientId)
      .is("exited_at", null);
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }); return; }

    fetchFurniture();
    fetchFlows();
    toast({ title: "Paciente movido", description: `Ahora en ${targetZone.name}.` });
  };

  const releaseFurniture = async (furnitureId: string) => {
    const { error } = await supabase.from("floor_furniture").update({ patient_id: null }).eq("id", furnitureId);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { fetchFurniture(); toast({ title: "Silla liberada" }); }
  };

  // Set de IDs de pacientes ya sentados en algún mueble (no deben aparecer en la lista de la zona)
  const seatedPatientIds = useMemo(() => {
    const s = new Set<string>();
    for (const f of furniture) if (f.patient_id) s.add(f.patient_id);
    return s;
  }, [furniture]);

  const flowsByZone = useMemo(() => {
    const map: Record<string, Flow[]> = {};
    for (const f of flows) {
      // Si ya está sentado en una silla, no duplicarlo en la lista textual de la zona
      if (seatedPatientIds.has(f.patient_id)) continue;
      const k = f.zone_id ?? "__unassigned__";
      (map[k] ||= []).push(f);
    }
    return map;
  }, [flows, seatedPatientIds]);

  const patientById = (id: string | null) => id ? patients.find(p => p.id === id) : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold">Synapsia · Planta en vivo</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(isOwner || isReception) && (
              <Button variant={editMode ? "default" : "outline"} size="sm" onClick={() => setEditMode(!editMode)}>
                {editMode ? <Unlock className="w-4 h-4 mr-1" /> : <Lock className="w-4 h-4 mr-1" />}
                {editMode ? "Modo edición" : "Bloqueado"}
              </Button>
            )}
            {editMode && <Button size="sm" onClick={openNewZone}><Plus className="w-4 h-4 mr-1" /> Nueva zona</Button>}
            <Button size="sm" variant="secondary" onClick={() => openIntake()}><LogIn className="w-4 h-4 mr-1" /> Registrar llegada</Button>
            <Button variant="ghost" size="icon" onClick={signOut} title="Cerrar sesión"><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      {editMode && (
        <div className="bg-muted/50 border-b">
          <div className="max-w-[1600px] mx-auto px-4 py-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground mr-2">Agregar mobiliario:</span>
            {FURNITURE_TYPES.filter(t => !t.decorative).map(t => {
              const Icon = t.icon;
              return (
                <Button key={t.value} variant="outline" size="sm" onClick={() => addFurniture(t.value)} className="h-8">
                  <Icon className="w-3.5 h-3.5 mr-1" /> {t.label}
                </Button>
              );
            })}
            <span className="w-px h-6 bg-border mx-1" />
            <span className="text-xs font-semibold text-muted-foreground mr-1">Layout:</span>
            {FURNITURE_TYPES.filter(t => t.decorative).map(t => {
              const Icon = t.icon;
              return (
                <Button key={t.value} variant="outline" size="sm" onClick={() => addFurniture(t.value)} className="h-8">
                  <Icon className="w-3.5 h-3.5 mr-1" /> {t.label}
                </Button>
              );
            })}
            <span className="ml-auto text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
              {/* Tamaño del canvas */}
              <span className="flex items-center gap-1 px-2 py-1 rounded border bg-background">
                <span className="font-semibold">Canvas:</span>
                <Input type="number" className="h-6 w-20 text-[11px]" value={canvasSize.w}
                  onChange={(e) => setCanvasSize(s => ({ ...s, w: Math.max(400, parseInt(e.target.value) || 0) }))} />
                <span>×</span>
                <Input type="number" className="h-6 w-20 text-[11px]" value={canvasSize.h}
                  onChange={(e) => setCanvasSize(s => ({ ...s, h: Math.max(400, parseInt(e.target.value) || 0) }))} />
                <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]" onClick={() => setCanvasSize(s => ({ w: s.w + 200, h: s.h }))}>+W</Button>
                <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]" onClick={() => setCanvasSize(s => ({ w: s.w, h: s.h + 200 }))}>+H</Button>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border bg-background font-mono text-[10px]">←</kbd>
                <kbd className="px-1.5 py-0.5 rounded border bg-background font-mono text-[10px]">→</kbd>
                Rotar 90°
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border bg-background font-mono text-[10px]">Shift</kbd>+clic múltiple · arrastra el fondo para seleccionar
              </span>
              {(selectedZoneIds.size + selectedFurnIds.size > 1) && (
                <>
                  <span className="px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/40 font-semibold">
                    {selectedZoneIds.size + selectedFurnIds.size} elementos
                  </span>
                  <Button size="sm" variant="outline" className="h-7" onClick={clearSelection}>Limpiar</Button>
                  <Button size="sm" variant="destructive" className="h-7" onClick={deleteSelection}>
                    <Trash2 className="w-3 h-3 mr-1" />Eliminar selección
                  </Button>
                </>
              )}
              {selectedFurniture && (selectedZoneIds.size + selectedFurnIds.size <= 1) && (
                <>
                  <span className="px-2 py-0.5 rounded bg-accent/20 text-accent-foreground border border-accent/40">Mueble: {selectedFurniture.label || FURNITURE_TYPES.find(t => t.value === selectedFurniture.furniture_type)?.label}</span>
                  <Button size="sm" variant="outline" className="h-7" onClick={() => rotateFurnitureBy(selectedFurniture, -90)} title="Rotar 90° izq."><RotateCcw className="w-3 h-3" /></Button>
                  <Button size="sm" variant="outline" className="h-7" onClick={() => rotateFurnitureBy(selectedFurniture, 90)} title="Rotar 90° der."><RotateCw className="w-3 h-3" /></Button>
                  <Button size="sm" variant="destructive" className="h-7" onClick={() => deleteFurniture(selectedFurniture)}><Trash2 className="w-3 h-3 mr-1" />Eliminar mueble</Button>
                </>
              )}
              {selectedZone && !selectedFurniture && (selectedZoneIds.size + selectedFurnIds.size <= 1) && (
                <>
                  <span className="px-2 py-0.5 rounded bg-accent/20 text-accent-foreground border border-accent/40">Zona: {selectedZone.name}</span>
                  <Button size="sm" variant="outline" className="h-7" onClick={() => rotateZoneBy(selectedZone, -90)} title="Rotar 90° izq."><RotateCcw className="w-3 h-3" /></Button>
                  <Button size="sm" variant="outline" className="h-7" onClick={() => rotateZoneBy(selectedZone, 90)} title="Rotar 90° der."><RotateCw className="w-3 h-3" /></Button>
                  <Button size="sm" variant="destructive" className="h-7" onClick={() => deleteZone(selectedZone)}><Trash2 className="w-3 h-3 mr-1" />Eliminar zona</Button>
                </>
              )}
            </span>
          </div>
        </div>
      )}

      <main className="max-w-[1800px] mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-[230px_1fr_300px] gap-4">
        {/* === Panel izquierdo: herramientas por rol === */}
        <aside className="space-y-3 order-2 lg:order-1">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Herramientas</CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              <Link to="/synapsia/calendar" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start"><CalendarIcon className="w-4 h-4 mr-2" />Agenda</Button>
              </Link>
              <Link to="/synapsia/patients" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start"><Users className="w-4 h-4 mr-2" />Pacientes</Button>
              </Link>
              {(isOwner || isReception) && (
                <Link to="/synapsia/metrics" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start"><BarChart3 className="w-4 h-4 mr-2" />Métricas</Button>
                </Link>
              )}
              {isReception && !isOwner && (
                <Link to="/synapsia/users" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start"><Stethoscope className="w-4 h-4 mr-2" />Especialistas</Button>
                </Link>
              )}
              {isOwner && (
                <>
                  <Link to="/synapsia/users" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start"><UserCheck className="w-4 h-4 mr-2" />Usuarios y roles</Button>
                  </Link>
                  <Link to="/synapsia/expenses" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start"><Wallet className="w-4 h-4 mr-2" />Gastos</Button>
                  </Link>
                  <Link to="/synapsia/admin" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start"><DollarSign className="w-4 h-4 mr-2" />Admin</Button>
                  </Link>
                  <Link to="/synapsia/cotizador" className="block">
                    <Button variant="outline" size="sm" className="w-full justify-start"><Calculator className="w-4 h-4 mr-2" />Cotizador</Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Acciones rápidas</CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              <Button size="sm" className="w-full justify-start" onClick={() => openIntake()}>
                <LogIn className="w-4 h-4 mr-2" />Registrar llegada
              </Button>
              {(isOwner || isReception) && (
                <Button size="sm" variant={editMode ? "default" : "outline"} className="w-full justify-start" onClick={() => setEditMode(!editMode)}>
                  {editMode ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                  {editMode ? "Salir de edición" : "Editar planta"}
                </Button>
              )}
            </CardContent>
          </Card>
        </aside>

        {/* === Centro: canvas === */}
        <div className="order-1 lg:order-2 min-w-0">
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
              <div
                className="canvas-inner relative"
                style={{ width: canvasSize.w, height: canvasSize.h }}
                onMouseDown={onCanvasMouseDown}
                onClick={(e) => { if (editMode && e.target === e.currentTarget) clearSelection(); }}
              >
                {/* ZONES */}
                {zones.map((z) => {
                  const occupants = (flowsByZone[z.id] || []);
                  const isZoneDropTarget = dragOverZoneId === z.id;
                  return (
                    <div
                      key={z.id}
                      onMouseDown={(e) => onMouseDownZone(e, z, "move")}
                      onClick={(e) => { if (!editMode) { e.stopPropagation(); setSelectedZone(z); } }}
                      onDoubleClick={() => editMode && openEditZone(z)}
                      onDragOver={(e) => { if (editMode) return; if (e.dataTransfer.types.includes("text/patient-id")) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (dragOverZoneId !== z.id) setDragOverZoneId(z.id); } }}
                      onDragLeave={(e) => { if (e.currentTarget.contains(e.relatedTarget as Node)) return; if (dragOverZoneId === z.id) setDragOverZoneId(null); }}
                      onDrop={(e) => {
                        if (editMode) return;
                        const pid = e.dataTransfer.getData("text/patient-id");
                        setDragOverZoneId(null);
                        if (pid) { e.preventDefault(); e.stopPropagation(); movePatientToZone(z.id, pid); }
                      }}
                      className={`absolute rounded-xl shadow-sm border-2 ${editMode ? "cursor-move" : "cursor-pointer"} transition-shadow hover:shadow-md ${editMode && selectedZoneIds.has(z.id) ? "ring-2 ring-primary ring-offset-2" : ""} ${isZoneDropTarget ? "ring-4 ring-emerald-400 ring-offset-2" : ""}`}
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
                            draggable
                            onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData("text/patient-id", f.patient_id); e.dataTransfer.effectAllowed = "move"; }}
                            onClick={(e) => { e.stopPropagation(); setSelectedFlow(f); }}
                            onMouseDown={(e) => e.stopPropagation()}
                            className={`w-full text-left flex items-center gap-1.5 px-1.5 py-1 rounded border ${STAGE_COLOR[f.stage]} hover:scale-[1.02] transition-transform cursor-grab active:cursor-grabbing`}
                            title="Arrastra a una silla"
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
                  const canSeat = !def.decorative;
                  const isDropTarget = canSeat && dragOverFurnId === f.id;
                  const patientDraggable = isOccupied && !editMode;
                  return (
                    <div
                      key={f.id}
                      draggable={patientDraggable}
                      onDragStart={(e) => {
                        if (!patientDraggable || !occupant) return;
                        e.stopPropagation();
                        e.dataTransfer.setData("text/patient-id", occupant.id);
                        e.dataTransfer.setData("text/from-furniture-id", f.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onMouseDown={(e) => { if (patientDraggable) return; onMouseDownFurn(e, f, "move"); }}
                      onClick={(e) => { e.stopPropagation(); if (editMode) { setSelectedFurniture(f); setSelectedZone(null); } else { const d = FURNITURE_TYPES.find(t => t.value === f.furniture_type); if (d?.decorative) return; setSelectedFurniture(f); openEditFurniture(f); } }}
                      onDoubleClick={() => editMode && openEditFurniture(f)}
                      onDragOver={(e) => { if (!canSeat || editMode) return; if (e.dataTransfer.types.includes("text/patient-id")) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (dragOverFurnId !== f.id) setDragOverFurnId(f.id); } }}
                      onDragLeave={() => { if (dragOverFurnId === f.id) setDragOverFurnId(null); }}
                      onDrop={(e) => {
                        if (!canSeat || editMode) return;
                        const pid = e.dataTransfer.getData("text/patient-id");
                        const fromFurn = e.dataTransfer.getData("text/from-furniture-id");
                        setDragOverFurnId(null);
                        setDragOverZoneId(null);
                        if (fromFurn === f.id) return; // soltó en la misma silla
                        if (pid) { e.preventDefault(); e.stopPropagation(); seatPatientOnFurniture(f.id, pid); }
                      }}
                      className={`absolute rounded-md shadow-sm border-2 flex flex-col items-center justify-center text-white ${editMode ? "cursor-move" : (patientDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer")} hover:shadow-md transition-shadow ${editMode && (selectedFurnIds.has(f.id) || selectedFurniture?.id === f.id) ? "ring-2 ring-accent ring-offset-2" : ""} ${isDropTarget ? "ring-4 ring-emerald-400 ring-offset-2 scale-105" : ""}`}
                      style={{
                        left: f.x, top: f.y, width: f.width, height: f.height,
                        background: isOccupied ? f.color : `${f.color}cc`,
                        borderColor: isOccupied ? "#0f172a" : f.color,
                        transform: `rotate(${f.rotation}deg)`, transformOrigin: "center center",
                      }}
                      title={def.label + (occupant ? ` · ${occupant.full_name} (arrastra para mover)` : (canSeat ? " · Arrastra un paciente aquí" : ""))}
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

                {marquee && (
                  <div
                    className="absolute pointer-events-none border-2 border-dashed border-primary bg-primary/10 rounded-sm"
                    style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }}
                  />
                )}
                {zones.length === 0 && furniture.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                    Activa el modo edición y crea tu primera zona o agrega mobiliario.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        </div>

        <div className="space-y-3 order-3 lg:order-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Sin ubicar ({(flowsByZone["__unassigned__"] || []).length})</CardTitle></CardHeader>
            <CardContent className="space-y-1.5 max-h-72 overflow-auto">
              {(flowsByZone["__unassigned__"] || []).map((f) => (
                <button
                  key={f.id}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData("text/patient-id", f.patient_id); e.dataTransfer.effectAllowed = "move"; }}
                  onClick={() => setSelectedFlow(f)}
                  className={`w-full text-left p-2 rounded border ${STAGE_COLOR[f.stage]} cursor-grab active:cursor-grabbing`}
                  title="Arrastra a una silla para ubicarlo"
                >
                  <div className="text-xs font-semibold">{f.patients.full_name}</div>
                  <div className="text-[10px] opacity-70">{STAGE_LABEL[f.stage]} · {formatDistanceToNow(new Date(f.arrived_at), { locale: es, addSuffix: true })}</div>
                </button>
              ))}
              {(flowsByZone["__unassigned__"] || []).length === 0 && <p className="text-xs text-muted-foreground">Arrastra desde aquí o usa "Registrar llegada".</p>}
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
            {selectedZone && <Button variant="destructive" onClick={() => deleteZone()}><Trash2 className="w-4 h-4 mr-1" />Eliminar</Button>}
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
            <Button variant="destructive" onClick={() => deleteFurniture()}><Trash2 className="w-4 h-4 mr-1" />Eliminar</Button>
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
      <Sheet open={!!selectedFlow && !editMode} onOpenChange={(o) => !o && setSelectedFlow(null)}>
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
      <Sheet open={!!selectedZone && !zoneEditOpen && !editMode} onOpenChange={(o) => !o && setSelectedZone(null)}>
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
