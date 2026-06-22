import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, LogOut, Plus, Save, Pencil, Trash2, DollarSign } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { toast } from "@/hooks/use-toast";

interface ServicePrice {
  id: string; concept: string; description: string | null;
  price: number; category: string; requires_prescription: boolean;
  is_active: boolean;
}

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "inscripcion", label: "Inscripción" },
  { value: "estancia", label: "Estancia" },
  { value: "servicios", label: "Servicios" },
  { value: "terapias", label: "Terapias" },
  { value: "consultas", label: "Consultas" },
  { value: "medicamentos", label: "Medicamentos" },
  { value: "alimentacion", label: "Alimentación" },
  { value: "transporte", label: "Transporte" },
];

export default function ServicePrices() {
  const { id: unitId } = useParams<{ id: string }>();
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const [prices, setPrices] = useState<ServicePrice[]>([]);
  const [unitName, setUnitName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ concept: "", description: "", price: 0, category: "general", requires_prescription: false });
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!unitId) return;
    loadUnit();
    loadPrices();
  }, [unitId]);

  async function loadUnit() {
    const { data } = await (supabase.from as any)("health_units").select("name").eq("id", unitId).maybeSingle();
    if (data) setUnitName((data as any).name);
  }

  async function loadPrices() {
    const { data } = await (supabase.from as any)("service_prices")
      .select("*").eq("health_unit_id", unitId).order("category").order("concept");
    setPrices((data as any) || []);
  }

  async function handleAdd() {
    if (!form.concept.trim() || !form.price) { toast({ title: "Completa concepto y precio", variant: "destructive" }); return; }
    const { error } = await (supabase.from as any)("service_prices").insert({
      health_unit_id: unitId,
      concept: form.concept.toUpperCase(),
      description: form.description.toUpperCase() || null,
      price: form.price,
      category: form.category,
      requires_prescription: form.requires_prescription,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Precio agregado" });
    setForm({ concept: "", description: "", price: 0, category: "general", requires_prescription: false });
    setAdding(false);
    loadPrices();
  }

  async function handleUpdate(id: string) {
    if (!form.concept.trim() || !form.price) { toast({ title: "Completa concepto y precio", variant: "destructive" }); return; }
    const { error } = await (supabase.from as any)("service_prices").update({
      concept: form.concept.toUpperCase(),
      description: form.description.toUpperCase() || null,
      price: form.price,
      category: form.category,
      requires_prescription: form.requires_prescription,
    }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Precio actualizado" });
    setEditingId(null);
    loadPrices();
  }

  async function handleToggleActive(id: string, current: boolean) {
    await (supabase.from as any)("service_prices").update({ is_active: !current }).eq("id", id);
    loadPrices();
  }

  async function handleDelete(id: string) {
    await (supabase.from as any)("service_prices").delete().eq("id", id);
    toast({ title: "Precio eliminado" });
    loadPrices();
  }

  function startEdit(p: ServicePrice) {
    setForm({ concept: p.concept, description: p.description || "", price: p.price, category: p.category, requires_prescription: p.requires_prescription });
    setEditingId(p.id);
    setAdding(false);
  }

  const canEdit = hasRole("admin") || hasRole("dueno") || hasRole("administrativo") || hasRole("asistente_admin");
  const filtered = prices.filter(p => !filter || p.concept.toLowerCase().includes(filter.toLowerCase()) || p.category.toLowerCase().includes(filter.toLowerCase()));

  const grouped = filtered.reduce((acc, p) => {
    const cat = CATEGORIES.find(c => c.value === p.category)?.label || p.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, ServicePrice[]>);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/synapsia/unidades/${unitId}`)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold">{unitName} — Precios</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Buscar concepto o categoría..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-72"
            />
          </div>
          {canEdit && (
            <Button onClick={() => { setAdding(true); setEditingId(null); setForm({ concept: "", description: "", price: 0, category: "general", requires_prescription: false }); }}>
              <Plus className="w-4 h-4 mr-1" /> Agregar precio
            </Button>
          )}
        </div>

        {(adding || editingId) && (
          <Card>
            <CardHeader><CardTitle className="text-sm">{editingId ? "Editar precio" : "Nuevo precio"}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-3 gap-3">
                <div><Label>Concepto</Label><Input value={form.concept} onChange={e => setForm({ ...form, concept: e.target.value.toUpperCase() })} placeholder="EJ: CONSULTA PSICOLÓGICA" /></div>
                <div><Label>Precio $</Label><Input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} /></div>
                <div><Label>Categoría</Label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Descripción (opcional)</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value.toUpperCase() })} /></div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.requires_prescription} onChange={e => setForm({ ...form, requires_prescription: e.target.checked })} className="w-4 h-4" />
                    <span className="text-sm">Requiere receta médica</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setAdding(false); setEditingId(null); }}>Cancelar</Button>
                <Button onClick={editingId ? () => handleUpdate(editingId) : handleAdd}>
                  <Save className="w-4 h-4 mr-1" /> Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {filtered.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Sin precios registrados.</CardContent></Card>
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <Card key={category}>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> {category}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-center">Receta</TableHead>
                      <TableHead className="text-center">Activo</TableHead>
                      {canEdit && <TableHead className="text-right">Acción</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map(p => (
                      <TableRow key={p.id} className={!p.is_active ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{p.concept}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.description || "—"}</TableCell>
                        <TableCell className="text-right font-mono font-medium">${Number(p.price).toLocaleString()}</TableCell>
                        <TableCell className="text-center">{p.requires_prescription ? <Badge variant="outline" className="text-[10px]">Sí</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="text-center">
                          {canEdit ? (
                            <button onClick={() => handleToggleActive(p.id, p.is_active)} className="text-xs underline cursor-pointer">
                              {p.is_active ? "Sí" : "No"}
                            </button>
                          ) : (
                            <span className="text-xs">{p.is_active ? "Sí" : "No"}</span>
                          )}
                        </TableCell>
                        {canEdit && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => startEdit(p)}><Pencil className="w-3 h-3" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)}><Trash2 className="w-3 h-3 text-red-500" /></Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}
