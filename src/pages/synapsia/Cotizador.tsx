import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  LogOut, FileText, Plus, Trash2, Loader2, Download, Calculator, ArrowLeft, Building2,
} from "lucide-react";
import { generateQuotePDF } from "@/lib/quotePdf";

interface CostItem {
  concept: string;
  unit: string;
  price: number | null;
}

interface Quote {
  id: string;
  quote_number: string;
  service_type: "senior_living" | "centro_benesse";
  base_monthly_price: number;
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

const SERVICE_LABELS: Record<string, string> = {
  senior_living: "Senior Living",
  centro_benesse: "Centro Benesse",
};

const SERVICE_PRICES: Record<string, number> = {
  senior_living: 30000,
  centro_benesse: 65000,
};

const DEFAULT_ADDITIONAL_COSTS: CostItem[] = [
  { concept: "Enfermero por hora", unit: "por hora", price: 250 },
  { concept: "Cuidado terapéutico por hora", unit: "por hora", price: 350 },
  { concept: "Traslado a hospital / ambulancia", unit: "por servicio", price: 1800 },
  { concept: "Lavandería personal", unit: "por mes", price: 1500 },
  { concept: "Alimentación de invitado", unit: "por comida", price: 250 },
];

const DEFAULT_OTHER_TO_QUOTE: CostItem[] = [
  { concept: "5 alimentos al día", unit: "incluido en cotización a medida", price: null },
  { concept: "Cuidado médico continuo", unit: "según valoración", price: null },
  { concept: "Actividades recreativas", unit: "según programa", price: null },
  { concept: "Terapia ocupacional", unit: "por sesión", price: null },
  { concept: "Instalaciones y esparcimiento", unit: "incluido", price: null },
  { concept: "Acompañamiento médico a citas externas", unit: "por evento", price: null },
];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(n);

export default function Cotizador() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [form, setForm] = useState({
    service_type: "senior_living" as "senior_living" | "centro_benesse",
    client_name: "",
    client_phone: "",
    client_email: "",
    resident_name: "",
    resident_age: "",
    estimated_admission_date: "",
    notes: "",
    additional_costs: [...DEFAULT_ADDITIONAL_COSTS],
    other_to_quote: [...DEFAULT_OTHER_TO_QUOTE],
  });

  useEffect(() => {
    fetchQuotes();
  }, []);

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
      client_name: "",
      client_phone: "",
      client_email: "",
      resident_name: "",
      resident_age: "",
      estimated_admission_date: "",
      notes: "",
      additional_costs: [...DEFAULT_ADDITIONAL_COSTS],
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
      } else {
        item[field] = value as any;
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

  const generateQuoteNumber = async () => {
    const { data, error } = await supabase.rpc("nextval" as any, { sequence: "quotes_folio_seq" } as any);
    if (!error && data) return `COT-${data}`;
    // fallback if rpc not exposed
    const yy = new Date().getFullYear().toString().slice(-2);
    const ts = Date.now().toString().slice(-6);
    return `COT-${yy}${ts}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const quote_number = await generateQuoteNumber();
    const base_monthly_price = SERVICE_PRICES[form.service_type];

    const payload = {
      quote_number,
      service_type: form.service_type,
      base_monthly_price,
      client_name: form.client_name,
      client_phone: form.client_phone || null,
      client_email: form.client_email || null,
      resident_name: form.resident_name || null,
      resident_age: form.resident_age ? parseInt(form.resident_age) : null,
      estimated_admission_date: form.estimated_admission_date || null,
      notes: form.notes || null,
      additional_costs: form.additional_costs as any,
      other_to_quote: form.other_to_quote as any,
      created_by: user?.id,
    };

    const { data, error } = await supabase.from("quotes").insert(payload).select().single();

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      setLoading(false);
      return;
    }

    toast({ title: "Cotización guardada", description: `Folio ${quote_number}` });
    generateQuotePDF(data as any);
    resetForm();
    setIsOpen(false);
    fetchQuotes();
    setLoading(false);
  };

  const handleDownload = (q: Quote) => {
    generateQuotePDF(q);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/synapsia">
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
                <p className="text-2xl font-bold">{formatCurrency(30000)}<span className="text-sm font-normal text-muted-foreground"> / mes</span></p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Centro Benesse</p>
                <p className="text-2xl font-bold">{formatCurrency(65000)}<span className="text-sm font-normal text-muted-foreground"> / mes</span></p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Cotizaciones generadas</h2>
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" /> Nueva Cotización
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nueva Cotización</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Servicio *</Label>
                    <Select
                      value={form.service_type}
                      onValueChange={(v) => setForm((p) => ({ ...p, service_type: v as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="senior_living">Senior Living — {formatCurrency(30000)}/mes</SelectItem>
                        <SelectItem value="centro_benesse">Centro Benesse — {formatCurrency(65000)}/mes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Precio mensual base</Label>
                    <Input value={formatCurrency(SERVICE_PRICES[form.service_type])} disabled />
                  </div>
                </div>

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
                  hint="Conceptos con precio definido. Edítalos según el caso."
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
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><FileText className="w-4 h-4 mr-2" /> Guardar y generar PDF</>)}
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
            <Input
              className="col-span-5"
              placeholder="Concepto"
              value={item.concept}
              onChange={(e) => onChange(i, "concept", e.target.value)}
            />
            <Input
              className={showPrice ? "col-span-3" : "col-span-6"}
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
