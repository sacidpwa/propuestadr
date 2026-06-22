import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, LogOut, Plus, Pencil, Search } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { toast } from "@/hooks/use-toast";

type Area = "enfermeria" | "intendencia" | "mantenimiento" | "administrativo" | "medicina" | "administracion" | "rrhh" | "recepcion" | "otro";
type Frequency = "semanal" | "quincenal" | "mensual";

interface Employee {
  id: string; full_name: string; rfc: string | null; position: string | null;
  area: Area; health_unit_id: string | null; base_salary: number;
  frequency: Frequency; bank: string | null; bank_account: string | null; is_active: boolean;
  notes: string | null;
}

interface HealthUnit {
  id: string; name: string;
}

interface EmployeeUnit {
  employee_id: string; health_unit_id: string;
}

const AREA_LABELS: Record<string, string> = {
  enfermeria: "Enfermería", intendencia: "Intendencia", mantenimiento: "Mantenimiento",
  administrativo: "Administrativo", medicina: "Medicina", administracion: "Administración",
  rrhh: "RR.HH.", recepcion: "Recepción", otro: "Otro",
};

export default function PlantillaLaboral() {
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<(Employee & { unitNames: string })[]>([]);
  const [units, setUnits] = useState<HealthUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Employee>>({
    area: "enfermeria", frequency: "quincenal", base_salary: 0, is_active: true,
  });
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);

  const canManage = hasRole("admin") || hasRole("dueno") || hasRole("administrativo") || hasRole("asistente_admin") || hasRole("rrhh");

  useEffect(() => {
    (async () => {
      const { data: u } = await (supabase.from as any)("health_units").select("id, name").eq("is_active", true).order("name");
      setUnits((u as HealthUnit[]) || []);
    })();
  }, []);

  const load = async () => {
    setLoading(true);
    const [{ data: emp }, { data: eunits }] = await Promise.all([
      (supabase.from as any)("payroll_employees").select("*").order("full_name"),
      (supabase.from as any)("payroll_employee_units").select("*"),
    ]);
    const employeesArr = (emp as Employee[]) || [];
    const empUnitsArr = (eunits as EmployeeUnit[]) || [];

    const unitMap = new Map(units.map((u) => [u.id, u.name]));
    const empToUnits: Record<string, string[]> = {};
    empUnitsArr.forEach((eu) => {
      if (!empToUnits[eu.employee_id]) empToUnits[eu.employee_id] = [];
      empToUnits[eu.employee_id].push(eu.health_unit_id);
    });

    setEmployees(
      employeesArr.map((e) => ({
        ...e,
        unitNames: (empToUnits[e.id] || [])
          .map((uid) => unitMap.get(uid) || uid)
          .join(", "),
      }))
    );
    setLoading(false);
  };

  useEffect(() => { if (units.length) load(); }, [units]);

  const openNew = () => {
    setEditingId(null);
    setForm({ area: "enfermeria", frequency: "quincenal", base_salary: 0, is_active: true });
    setSelectedUnits([]);
    setDialogOpen(true);
  };

  const openEdit = async (emp: Employee & { unitNames: string }) => {
    setEditingId(emp.id);
    setForm({ ...emp });
    const { data: eu } = await (supabase.from as any)("payroll_employee_units")
      .select("health_unit_id").eq("employee_id", emp.id);
    setSelectedUnits((eu as { health_unit_id: string }[] || []).map((e) => e.health_unit_id));
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.full_name || !form.area) {
      toast({ title: "Faltan datos", description: "Nombre y área son obligatorios", variant: "destructive" });
      return;
    }

    if (editingId) {
      const { error } = await (supabase.from as any)("payroll_employees")
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq("id", editingId);
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });

      await (supabase.from as any)("payroll_employee_units").delete().eq("employee_id", editingId);
      if (selectedUnits.length) {
        await (supabase.from as any)("payroll_employee_units").insert(
          selectedUnits.map((huid) => ({ employee_id: editingId, health_unit_id: huid }))
        );
      }
      toast({ title: "Empleado actualizado" });
    } else {
      const { data: inserted, error } = await (supabase.from as any)("payroll_employees")
        .insert({ ...form, created_by: user!.id })
        .select()
        .single();
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });

      if (selectedUnits.length && inserted) {
        await (supabase.from as any)("payroll_employee_units").insert(
          selectedUnits.map((huid) => ({ employee_id: inserted.id, health_unit_id: huid }))
        );
      }
      toast({ title: "Empleado registrado" });
    }

    setDialogOpen(false);
    setEditingId(null);
    setForm({ area: "enfermeria", frequency: "quincenal", base_salary: 0, is_active: true });
    setSelectedUnits([]);
    load();
  };

  const toggleActive = async (emp: Employee & { unitNames: string }) => {
    const { error } = await (supabase.from as any)("payroll_employees")
      .update({ is_active: !emp.is_active, updated_at: new Date().toISOString() })
      .eq("id", emp.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: emp.is_active ? "Empleado desactivado" : "Empleado activado" });
    load();
  };

  const toggleUnit = (uid: string) => {
    setSelectedUnits((prev) =>
      prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid]
    );
  };

  const filtered = employees.filter(
    (e) =>
      !search ||
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (e.position || "").toLowerCase().includes(search.toLowerCase()) ||
      e.unitNames.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/synapsia/unidades")}><ArrowLeft className="w-4 h-4" /></Button>
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold">Plantilla laboral</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empleado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {canManage && (
            <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" />Nuevo empleado</Button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Puesto</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Unidades</TableHead>
                  <TableHead className="text-right">Sueldo base</TableHead>
                  <TableHead>Frecuencia</TableHead>
                  <TableHead>Estado</TableHead>
                  {canManage && <TableHead className="w-24">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{e.position || "—"}</TableCell>
                    <TableCell className="capitalize">{AREA_LABELS[e.area] || e.area}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate" title={e.unitNames}>
                      {e.unitNames || "—"}
                    </TableCell>
                    <TableCell className="text-right">${Number(e.base_salary).toLocaleString()}</TableCell>
                    <TableCell className="capitalize">{e.frequency}</TableCell>
                    <TableCell>
                      <Badge variant={e.is_active ? "default" : "outline"}>
                        {e.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(e)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(e)}
                          >
                            {e.is_active ? "Desactivar" : "Activar"}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {!loading && !filtered.length && (
                  <TableRow>
                    <TableCell colSpan={canManage ? 8 : 7} className="text-center text-muted-foreground py-8">
                      {search ? "Sin resultados" : "No hay empleados registrados"}
                    </TableCell>
                  </TableRow>
                )}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={canManage ? 8 : 7} className="text-center text-muted-foreground py-8">
                      Cargando...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar empleado" : "Nuevo empleado"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label>Nombre completo *</Label>
              <Input
                value={form.full_name || ""}
                onChange={(e) => setForm({ ...form, full_name: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>RFC</Label>
                <Input
                  value={form.rfc || ""}
                  onChange={(e) => setForm({ ...form, rfc: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <Label>Puesto</Label>
                <Input
                  value={form.position || ""}
                  onChange={(e) => setForm({ ...form, position: e.target.value.toUpperCase() })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Área *</Label>
                <Select
                  value={form.area}
                  onValueChange={(v) => setForm({ ...form, area: v as Area })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(AREA_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Frecuencia de pago</Label>
                <Select
                  value={form.frequency}
                  onValueChange={(v) => setForm({ ...form, frequency: v as Frequency })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="quincenal">Quincenal</SelectItem>
                    <SelectItem value="mensual">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Sueldo base (por periodo)</Label>
              <Input
                type="number"
                value={form.base_salary || 0}
                onChange={(e) => setForm({ ...form, base_salary: Number(e.target.value) })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Banco</Label>
                <Input
                  value={form.bank || ""}
                  onChange={(e) => setForm({ ...form, bank: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <Label>Cuenta / CLABE</Label>
                <Input
                  value={form.bank_account || ""}
                  onChange={(e) => setForm({ ...form, bank_account: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                value={form.notes || ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <Label className="mb-2 block">Unidades de salud donde labora</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-md p-3">
                {units.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={selectedUnits.includes(u.id)}
                      onCheckedChange={() => toggleUnit(u.id)}
                    />
                    {u.name}
                  </label>
                ))}
                {!units.length && (
                  <p className="text-sm text-muted-foreground col-span-2">No hay unidades activas</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{editingId ? "Actualizar" : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
