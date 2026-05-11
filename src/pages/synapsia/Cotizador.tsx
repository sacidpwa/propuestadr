import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  LogOut, FileText, Plus, Trash2, Loader2, Download, Calculator, ArrowLeft, Building2, Pencil,
} from "lucide-react";
import { generateQuotePDF } from "@/lib/quotePdf";

interface CostItem {
  concept: string;
  unit: string;
  price: number | null;
  proposed?: boolean; // Marca conceptos cuyo precio fue propuesto y debe revisarse
}

type ServiceType = "senior_living" | "centro_benesse" | "personalizado";
type RoomType = "compartida" | "individual";
type CustomPeriod = "dia" | "semana" | "mes";

const PERIOD_LABELS: Record<CustomPeriod, { singular: string; plural: string }> = {
  dia: { singular: "día", plural: "días" },
  semana: { singular: "semana", plural: "semanas" },
  mes: { singular: "mes", plural: "meses" },
};

interface Quote {
  id: string;
  quote_number: string;
  service_type: ServiceType;
  base_monthly_price: number;
  room_type?: RoomType | null;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  resident_name: string | null;
  resident_age: number | null;
  estimated_admission_date: string | null;
  notes: string | null;
  additional_costs: CostItem[];
  other_to_quote: CostItem[];
  created_at: string;
}

const SERVICE_LABELS: Record<ServiceType, string> = {
  senior_living: "Senior Living",
  centro_benesse: "Centro Benesse",
  personalizado: "Personalizado",
};

// Precios base extraídos del Excel Costos_2026_General
// Benesse no tiene habitación individual en el Excel: usamos propuesta de $85,000
const SERVICE_PRICES: Record<ServiceType, Record<RoomType, number>> = {
  senior_living: { compartida: 35000, individual: 50000 },
  centro_benesse: { compartida: 65000, individual: 85000 }, // individual = propuesta a revisar
  personalizado: { compartida: 0, individual: 0 },
};

// Catálogos por defecto basados en el Excel del cliente.
// proposed: true marca valores propuestos por el asistente que el cliente debe revisar.
const DEFAULT_COSTS: Record<ServiceType, CostItem[]> = {
  senior_living: [
    { concept: "Inscripción", unit: "pago único", price: 40000 },
    { concept: "Estancia por día", unit: "por día", price: 1624 },
    { concept: "Estancia de día (8 hrs / 3 alimentos)", unit: "por día", price: 1200, proposed: true },
    { concept: "Kit de ingreso", unit: "pago único", price: 2100 },
    { concept: "Cuidador particular (dentro de la institución)", unit: "por hora", price: 120 },
    { concept: "Enfermera particular (dentro de la institución)", unit: "por hora", price: 130 },
    { concept: "Acompañante terapéutico (dentro de la institución)", unit: "por hora", price: 150 },
    { concept: "Cuidador particular (fuera de la institución)", unit: "por hora", price: 130 },
    { concept: "Enfermera particular (fuera de la institución)", unit: "por hora", price: 150 },
    { concept: "Acompañante terapéutico (fuera de la institución)", unit: "por hora", price: 170 },
    { concept: "Consulta de emergencia", unit: "por evento", price: 2500 },
    { concept: "Consulta psiquiátrica", unit: "por consulta", price: 2000 },
    { concept: "Consulta Dr. Rodrigo Márquez de la Serna", unit: "por consulta", price: 2500, proposed: true },
  ],
  centro_benesse: [
    { concept: "Inscripción", unit: "pago único", price: 50000, proposed: true },
    { concept: "Kit de ingreso", unit: "pago único", price: 3500, proposed: true },
    { concept: "Cuidador particular (dentro de la institución)", unit: "por hora", price: 120 },
    { concept: "Enfermera particular (dentro de la institución)", unit: "por hora", price: 130 },
    { concept: "Acompañante terapéutico (dentro de la institución)", unit: "por hora", price: 150 },
    { concept: "Cuidador particular (fuera de la institución)", unit: "por hora", price: 130 },
    { concept: "Enfermera particular (fuera de la institución)", unit: "por hora", price: 150 },
    { concept: "Acompañante terapéutico (fuera de la institución)", unit: "por hora", price: 170 },
    { concept: "Terapia ocupacional (cuota semestral)", unit: "semestral", price: 1200, proposed: true },
    { concept: "Consulta de emergencia", unit: "por evento", price: 2500 },
    { concept: "Consulta psicológica individual", unit: "por consulta", price: 1200, proposed: true },
    { concept: "Consulta psicológica grupal (por persona)", unit: "por sesión", price: 700, proposed: true },
    { concept: "Consulta psiquiátrica", unit: "por consulta", price: 2000 },
    { concept: "Consulta Dr. Rodrigo Márquez de la Serna", unit: "por consulta", price: 2500, proposed: true },
  ],
  personalizado: [],
};

const DEFAULT_OTHER_TO_QUOTE: CostItem[] = [
  { concept: "5 alimentos al día", unit: "incluido en cotización a medida", price: null },
  { concept: "Cuidado médico continuo", unit: "según valoración", price: null },
  { concept: "Actividades recreativas", unit: "según programa", price: null },
  { concept: "Terapia ocupacional", unit: "por sesión", price: null },
  { concept: "Instalaciones y esparcimiento", unit: "incluido", price: null },
  { concept: "Acompañamiento médico a citas externas", unit: "por evento", price: null },
  { concept: "Traslados especializados / ambulancia", unit: "por servicio", price: null },
  { concept: "Lavandería personal", unit: "por mes", price: null },
];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(n);

export default function Cotizador() {
  const { user, signOut, hasRole } = useAuth();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const skipAutoLoad = useRef(false);

  const [form, setForm] = useState({
    service_type: "senior_living" as ServiceType,
    room_type: "compartida" as RoomType,
    base_monthly_price: SERVICE_PRICES.senior_living.compartida,
    custom_period: "dia" as CustomPeriod,
    custom_unit_price: 0,
    custom_quantity: 1,
    custom_concept: "",
    client_name: "",
    client_phone: "",
    client_email: "",
    resident_name: "",
    resident_age: "",
    estimated_admission_date: "",
    notes: "",
    additional_costs: [...DEFAULT_COSTS.senior_living],
    other_to_quote: [...DEFAULT_OTHER_TO_QUOTE],
  });

  useEffect(() => {
    fetchQuotes();
  }, []);

  // Al cambiar de servicio o tipo de habitación, sugiere el precio del catálogo y recarga conceptos
  useEffect(() => {
    if (skipAutoLoad.current) { skipAutoLoad.current = false; return; }
    setForm((prev) => ({
      ...prev,
      base_monthly_price: SERVICE_PRICES[prev.service_type][prev.room_type],
      additional_costs: [...DEFAULT_COSTS[prev.service_type]],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.service_type]);

  useEffect(() => {
    if (editId) return;
    setForm((prev) => ({
      ...prev,
      base_monthly_price: SERVICE_PRICES[prev.service_type][prev.room_type],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.room_type]);

  const fetchQuotes = async () => {
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }
    setQuotes((data as any[]) || []);
  };

  const resetForm = () => {
    setForm({
      service_type: "senior_living",
      room_type: "compartida",
      base_monthly_price: SERVICE_PRICES.senior_living.compartida,
      custom_period: "dia",
      custom_unit_price: 0,
      custom_quantity: 1,
      custom_concept: "",
      client_name: "",
      client_phone: "",
      client_email: "",
      resident_name: "",
      resident_age: "",
      estimated_admission_date: "",
      notes: "",
      additional_costs: [...DEFAULT_COSTS.senior_living],
      other_to_quote: [...DEFAULT_OTHER_TO_QUOTE],
    });
  };

  const updateCostItem = (
    section: "additional_costs" | "other_to_quote",
    index: number,
    field: keyof CostItem,
    value: string,
  ) => {
    setForm((prev) => {
      const items = [...prev[section]];
      const item = { ...items[index] };
      if (field === "price") {
        item.price = value === "" ? null : parseFloat(value);
        // Al editar el precio, deja de ser "propuesto"
        item.proposed = false;
      } else {
        (item as any)[field] = value;
      }
      items[index] = item;
      return { ...prev, [section]: items };
    });
  };

  const addCostItem = (section: "additional_costs" | "other_to_quote") => {
    setForm((prev) => ({
      ...prev,
      [section]: [...prev[section], { concept: "", unit: "", price: null }],
    }));
  };

  const removeCostItem = (section: "additional_costs" | "other_to_quote", index: number) => {
    setForm((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
  };

  const generateQuoteNumber = () => {
    const yy = new Date().getFullYear().toString().slice(-2);
    const ts = Date.now().toString().slice(-6);
    return `COT-${yy}${ts}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isCustom = form.service_type === "personalizado";
    const base_monthly_price = isCustom
      ? (form.custom_unit_price || 0) * (form.custom_quantity || 0)
      : form.base_monthly_price;

    const customMeta = isCustom
      ? `__CUSTOM__${JSON.stringify({
          period: form.custom_period,
          unit_price: form.custom_unit_price,
          quantity: form.custom_quantity,
          concept: form.custom_concept,
        })}__END__`
      : "";

    const cleanNotes = (form.notes || "").replace(/__CUSTOM__.*?__END__/gs, "").trim();

    const basePayload: any = {
      service_type: form.service_type,
      base_monthly_price,
      client_name: form.client_name,
      client_phone: form.client_phone || null,
      client_email: form.client_email || null,
      resident_name: form.resident_name || null,
      resident_age: form.resident_age ? parseInt(form.resident_age) : null,
      estimated_admission_date: form.estimated_admission_date || null,
      notes: [
        cleanNotes,
        isCustom
          ? `Servicio personalizado: ${form.custom_concept || "—"} · ${form.custom_quantity} ${PERIOD_LABELS[form.custom_period].plural} × ${formatCurrency(form.custom_unit_price)} por ${PERIOD_LABELS[form.custom_period].singular}`
          : `Tipo de habitación: ${form.room_type === "compartida" ? "Compartida" : "Individual"}`,
        customMeta,
      ].filter(Boolean).join("\n"),
      additional_costs: form.additional_costs,
      other_to_quote: form.other_to_quote,
    };

    let data: any;
    let error: any;
    if (editId) {
      ({ data, error } = await supabase
        .from("quotes")
        .update(basePayload)
        .eq("id", editId)
        .select()
        .single());
    } else {
      const quote_number = generateQuoteNumber();
      ({ data, error } = await supabase
        .from("quotes")
        .insert({ ...basePayload, quote_number, created_by: user?.id })
        .select()
        .single());
    }

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      setLoading(false);
      return;
    }

    toast({
      title: editId ? "Cotización actualizada" : "Cotización guardada",
      description: `Folio ${data.quote_number}`,
    });
    generateQuotePDF({
      ...(data as any),
      room_type: isCustom ? null : form.room_type,
      custom_period: isCustom ? form.custom_period : null,
      custom_unit_price: isCustom ? form.custom_unit_price : null,
      custom_quantity: isCustom ? form.custom_quantity : null,
      custom_concept: isCustom ? form.custom_concept : null,
    });
    resetForm();
    setEditId(null);
    setIsOpen(false);
    fetchQuotes();
    setLoading(false);
  };

  const parseCustomMeta = (notes: string | null) => {
    const m = notes?.match(/__CUSTOM__(.+?)__END__/);
    if (!m) return null;
    try { return JSON.parse(m[1]); } catch { return null; }
  };

  const openEdit = (q: Quote) => {
    const custom = parseCustomMeta(q.notes);
    const isCustom = q.service_type === "personalizado";
    // Detect room_type from notes for legacy records
    let roomType: RoomType = "compartida";
    if (q.notes?.includes("Individual")) roomType = "individual";
    const cleanNotes = (q.notes || "")
      .replace(/__CUSTOM__.*?__END__/gs, "")
      .replace(/Tipo de habitación:.*$/gm, "")
      .replace(/Servicio personalizado:.*$/gm, "")
      .trim();

    skipAutoLoad.current = true;
    setEditId(q.id);
    setForm({
      service_type: q.service_type,
      room_type: roomType,
      base_monthly_price: q.base_monthly_price,
      custom_period: (custom?.period as CustomPeriod) || "dia",
      custom_unit_price: custom?.unit_price ?? 0,
      custom_quantity: custom?.quantity ?? 1,
      custom_concept: custom?.concept ?? "",
      client_name: q.client_name,
      client_phone: q.client_phone || "",
      client_email: q.client_email || "",
      resident_name: q.resident_name || "",
      resident_age: q.resident_age != null ? String(q.resident_age) : "",
      estimated_admission_date: q.estimated_admission_date || "",
      notes: cleanNotes,
      additional_costs: (q.additional_costs as CostItem[]) || [],
      other_to_quote: (q.other_to_quote as CostItem[]) || [],
    });
    setIsOpen(true);
    void isCustom;
  };

  const handleDownload = (q: Quote) => {
    const custom = parseCustomMeta(q.notes) || {};
    generateQuotePDF({
      ...(q as any),
      custom_period: custom.period ?? null,
      custom_unit_price: custom.unit_price ?? null,
      custom_quantity: custom.quantity ?? null,
      custom_concept: custom.concept ?? null,
    });
  };

  const suggestedBasePrice = SERVICE_PRICES[form.service_type][form.room_type];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={hasRole("admin") ? "/synapsia" : "/synapsia/admin"}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Calculator className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Cotizador</h1>
              <p className="text-xs text-muted-foreground">Senior Living & Centro Benesse</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Senior Living</p>
                <p className="text-sm">
                  Compartida <span className="font-bold">{formatCurrency(35000)}</span> · Individual <span className="font-bold">{formatCurrency(50000)}</span>
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Centro Benesse</p>
                <p className="text-sm">
                  Compartida <span className="font-bold">{formatCurrency(65000)}</span> · Individual <span className="font-bold">{formatCurrency(85000)}</span>
                  <Badge variant="outline" className="ml-2 text-[10px]">Individual: propuesta</Badge>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Cotizaciones generadas</h2>
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) { resetForm(); setEditId(null); } }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" /> Nueva Cotización
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editId ? "Editar Cotización" : "Nueva Cotización"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label>Servicio *</Label>
                  <Select
                    value={form.service_type}
                    onValueChange={(v) => setForm((p) => ({ ...p, service_type: v as ServiceType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="senior_living">Senior Living</SelectItem>
                      <SelectItem value="centro_benesse">Centro Benesse</SelectItem>
                      <SelectItem value="personalizado">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.service_type !== "personalizado" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Habitación *</Label>
                      <Select
                        value={form.room_type}
                        onValueChange={(v) => setForm((p) => ({ ...p, room_type: v as RoomType }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compartida">Compartida</SelectItem>
                          <SelectItem value="individual">Individual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Cuota mensual (MXN) *</Label>
                      <Input
                        type="number"
                        min={0}
                        step={500}
                        required
                        value={form.base_monthly_price}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, base_monthly_price: parseFloat(e.target.value) || 0 }))
                        }
                        className="font-semibold"
                      />
                      <p className="text-xs text-muted-foreground">
                        Sugerido: {formatCurrency(suggestedBasePrice)}
                        {form.base_monthly_price !== suggestedBasePrice && " (editado)"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                    <h3 className="font-semibold text-sm">Cotización personalizada</h3>
                    <div className="space-y-2">
                      <Label>Concepto del servicio</Label>
                      <Input
                        placeholder="Ej. Estancia temporal, acompañamiento nocturno…"
                        value={form.custom_concept}
                        onChange={(e) => setForm((p) => ({ ...p, custom_concept: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label>Periodo *</Label>
                        <Select
                          value={form.custom_period}
                          onValueChange={(v) => setForm((p) => ({ ...p, custom_period: v as CustomPeriod }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dia">Día</SelectItem>
                            <SelectItem value="semana">Semana</SelectItem>
                            <SelectItem value="mes">Mes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Costo unitario (MXN) *</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          required
                          value={form.custom_unit_price}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, custom_unit_price: parseFloat(e.target.value) || 0 }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cantidad de {PERIOD_LABELS[form.custom_period].plural} *</Label>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          required
                          value={form.custom_quantity}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, custom_quantity: parseInt(e.target.value) || 0 }))
                          }
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t pt-3">
                      <span className="text-sm text-muted-foreground">
                        {form.custom_quantity} {PERIOD_LABELS[form.custom_period].plural} ×{" "}
                        {formatCurrency(form.custom_unit_price)}
                      </span>
                      <span className="text-lg font-bold text-primary">
                        Total: {formatCurrency((form.custom_unit_price || 0) * (form.custom_quantity || 0))}
                      </span>
                    </div>
                  </div>
                )}

                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-sm">Datos del cliente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Nombre del contacto *</Label>
                      <Input required value={form.client_name} onChange={(e) => setForm((p) => ({ ...p, client_name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <Input value={form.client_phone} onChange={(e) => setForm((p) => ({ ...p, client_phone: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={form.client_email} onChange={(e) => setForm((p) => ({ ...p, client_email: e.target.value }))} />
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-sm">Datos del residente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>Nombre del residente</Label>
                      <Input value={form.resident_name} onChange={(e) => setForm((p) => ({ ...p, resident_name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Edad</Label>
                      <Input type="number" min="0" max="120" value={form.resident_age} onChange={(e) => setForm((p) => ({ ...p, resident_age: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha estimada de ingreso</Label>
                      <Input type="date" value={form.estimated_admission_date} onChange={(e) => setForm((p) => ({ ...p, estimated_admission_date: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notas</Label>
                    <Textarea rows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
                  </div>
                </div>

                <CostsEditor
                  title="Costos adicionales"
                  hint="Catálogo precargado con tarifas oficiales 2026. Los marcados con 💡 son propuestas a revisar."
                  items={form.additional_costs}
                  onAdd={() => addCostItem("additional_costs")}
                  onRemove={(i) => removeCostItem("additional_costs", i)}
                  onChange={(i, f, v) => updateCostItem("additional_costs", i, f, v)}
                  showPrice
                />

                <CostsEditor
                  title="Otros a cotizar"
                  hint="Servicios cuyo precio se determina al evaluar al residente."
                  items={form.other_to_quote}
                  onAdd={() => addCostItem("other_to_quote")}
                  onRemove={(i) => removeCostItem("other_to_quote", i)}
                  onChange={(i, f, v) => updateCostItem("other_to_quote", i, f, v)}
                  showPrice={false}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><FileText className="w-4 h-4 mr-2" /> {editId ? "Actualizar y generar PDF" : "Guardar y generar PDF"}</>)}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead className="text-right">Mensual</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aún no hay cotizaciones. Crea la primera con el botón "Nueva Cotización".
                    </TableCell>
                  </TableRow>
                ) : (
                  quotes.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-mono text-xs">{q.quote_number}</TableCell>
                      <TableCell className="text-xs">{format(new Date(q.created_at), "dd MMM yyyy HH:mm", { locale: es })}</TableCell>
                      <TableCell>
                        <div className="font-medium">{q.client_name}</div>
                        {q.resident_name && <div className="text-xs text-muted-foreground">Residente: {q.resident_name}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{SERVICE_LABELS[q.service_type]}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(q.base_monthly_price)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(q)}>
                          <Pencil className="w-4 h-4 mr-1" /> Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(q)}>
                          <Download className="w-4 h-4 mr-1" /> PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

interface CostsEditorProps {
  title: string;
  hint: string;
  items: CostItem[];
  showPrice: boolean;
  onAdd: () => void;
  onRemove: (i: number) => void;
  onChange: (i: number, field: keyof CostItem, value: string) => void;
}

function CostsEditor({ title, hint, items, showPrice, onAdd, onRemove, onChange }: CostsEditorProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus className="w-3 h-3 mr-1" /> Agregar
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <div className={`${showPrice ? "col-span-5" : "col-span-6"} flex items-center gap-1`}>
              {item.proposed && <span title="Valor propuesto, revisar">💡</span>}
              <Input
                placeholder="Concepto"
                value={item.concept}
                onChange={(e) => onChange(i, "concept", e.target.value)}
              />
            </div>
            <Input
              className={showPrice ? "col-span-3" : "col-span-5"}
              placeholder="Unidad (ej. por hora)"
              value={item.unit}
              onChange={(e) => onChange(i, "unit", e.target.value)}
            />
            {showPrice && (
              <Input
                className="col-span-3"
                type="number"
                min="0"
                step="0.01"
                placeholder="Precio MXN"
                value={item.price ?? ""}
                onChange={(e) => onChange(i, "price", e.target.value)}
              />
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="col-span-1"
              onClick={() => onRemove(i)}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">Sin conceptos. Agrega uno con el botón.</p>
        )}
      </div>
    </div>
  );
}
