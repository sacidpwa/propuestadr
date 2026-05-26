import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, LogOut, Loader2, UserPlus, KeyRound, ShieldCheck, BarChart3, Users as UsersIcon, Pencil, Stethoscope } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";

type Role = "admin" | "recepcion" | "especialista" | "administrativo" | "dueno" | "promotor" | "enfermera" | "intendencia" | "mantenimiento" | "asistente_admin" | "contador" | "rrhh" | "empleado";
const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador (super)",
  dueno: "Dueño",
  especialista: "Especialista",
  recepcion: "Recepción",
  administrativo: "Administrativo",
  promotor: "Promotor",
  enfermera: "Enfermera",
  intendencia: "Intendencia",
  mantenimiento: "Mantenimiento",
  asistente_admin: "Asistente administrativo",
  contador: "Contador",
  rrhh: "RRHH / Nómina",
  empleado: "Empleado",
};
const PRIMARY_ROLE_OPTIONS: Role[] = ["dueno","especialista","recepcion","administrativo","promotor","enfermera","intendencia","mantenimiento","asistente_admin","contador","rrhh","empleado","admin"];
const ADDITIONAL_ROLE_OPTIONS: Role[] = ["especialista","recepcion","administrativo","promotor","enfermera","intendencia","mantenimiento","asistente_admin","contador","rrhh","empleado","dueno"];
type Area = "enfermeria"|"intendencia"|"administracion"|"abastecimiento"|"mantenimiento"|"contabilidad"|"rrhh"|"direccion";
const AREA_LABEL: Record<Area,string> = { enfermeria:"Enfermería", intendencia:"Intendencia", administracion:"Administración", abastecimiento:"Abastecimiento", mantenimiento:"Mantenimiento", contabilidad:"Contabilidad", rrhh:"RRHH", direccion:"Dirección" };
interface HealthUnit { id: string; name: string; is_active: boolean; }
interface Assignment { id: string; user_id: string; health_unit_id: string; area: Area; is_active: boolean; }

interface Specialist {
  id: string; full_name: string; specialty: string; consultation_fee: number;
  is_active: boolean; is_partner: boolean; user_id: string | null; email: string | null;
}
interface Profile { user_id: string; full_name: string; email: string | null; pin_set_at?: string | null; is_active?: boolean; }
interface UserRoleRow { user_id: string; role: Role; }

export default function UsersAdmin() {
  const { user, signOut, hasRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rolesByUser, setRolesByUser] = useState<Record<string, Role[]>>({});
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [pinDialog, setPinDialog] = useState<{ open: boolean; userId: string | null; name: string }>({ open: false, userId: null, name: "" });
  const [pinValue, setPinValue] = useState("");
  const [editDialog, setEditDialog] = useState<{ open: boolean; userId: string | null; full_name: string; email: string }>({ open: false, userId: null, full_name: "", email: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [units, setUnits] = useState<HealthUnit[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; userId: string | null; name: string }>({ open: false, userId: null, name: "" });
  const [newAssign, setNewAssign] = useState<{ unit: string; area: Area }>({ unit: "", area: "enfermeria" });

  const [newUser, setNewUser] = useState({
    email: "", password: "", full_name: "", role: "recepcion" as Role, pin: "", also_especialista: false,
  });

  // Crear especialista (sin cuenta de usuario asociada)
  const [specOpen, setSpecOpen] = useState(false);
  const [specLoading, setSpecLoading] = useState(false);
  const [newSpec, setNewSpec] = useState({ full_name: "", specialty: "psiquiatra" as "psiquiatra" | "psicologo", consultation_fee: "0", phone: "", email: "" });

  const isOwnerOrAdmin = hasRole("admin") || hasRole("dueno");
  const isReception = hasRole("recepcion");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [{ data: s }, { data: p }, { data: r }, { data: u }, { data: a }] = await Promise.all([
      supabase.from("specialists").select("*").order("full_name"),
      supabase.from("profiles").select("user_id, full_name, email, pin_set_at, is_active").order("full_name"),
      supabase.from("user_roles").select("user_id, role"),
      (supabase.from as any)("health_units").select("id,name,is_active").order("name"),
      (supabase.from as any)("employee_assignments").select("id,user_id,health_unit_id,area,is_active"),
    ]);
    setSpecialists((s as any) || []);
    setProfiles((p as any) || []);
    const map: Record<string, Role[]> = {};
    (r as UserRoleRow[] | null)?.forEach((row) => {
      map[row.user_id] = [...(map[row.user_id] || []), row.role];
    });
    setRolesByUser(map);
    setUnits((u as any) || []);
    setAssignments((a as any) || []);
  };

  const addAssignment = async () => {
    if (!assignDialog.userId || !newAssign.unit) return;
    const { error } = await (supabase.from as any)("employee_assignments").insert({
      user_id: assignDialog.userId, health_unit_id: newAssign.unit, area: newAssign.area,
    });
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: "Asignación agregada" }); fetchAll(); }
  };
  const removeAssignment = async (id: string) => {
    const { error } = await (supabase.from as any)("employee_assignments").delete().eq("id", id);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else fetchAll();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const additional = newUser.also_especialista && newUser.role !== "especialista" ? ["especialista"] : [];
    const { data, error } = await supabase.functions.invoke("admin-create-user", {
      body: {
        email: newUser.email,
        password: newUser.password,
        full_name: newUser.full_name,
        role: newUser.role,
        pin: newUser.pin || null,
        additional_roles: additional,
      },
    });
    if (error || (data as any)?.error) {
      toast({ variant: "destructive", title: "No se pudo crear", description: (data as any)?.error || error?.message });
    } else {
      toast({ title: "Usuario creado", description: (data as any)?.warning || "Cuenta lista para iniciar sesión." });
      setCreateOpen(false);
      setNewUser({ email: "", password: "", full_name: "", role: "recepcion", pin: "", also_especialista: false });
      fetchAll();
    }
    setLoading(false);
  };

  const setPrimaryRole = async (userId: string, role: Role) => {
    const { error } = await supabase.rpc("admin_set_user_role", { _user_id: userId, _role: role });
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: "Rol actualizado" }); fetchAll(); }
  };

  const toggleAdditionalRole = async (userId: string, role: Role, has: boolean) => {
    const fn = has ? "admin_remove_user_role" : "admin_add_user_role";
    const { error } = await supabase.rpc(fn, { _user_id: userId, _role: role });
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else fetchAll();
  };

  const submitPin = async () => {
    if (!pinDialog.userId) return;
    if (!/^[0-9]{4,8}$/.test(pinValue)) {
      toast({ variant: "destructive", title: "PIN inválido", description: "4 a 8 dígitos numéricos." });
      return;
    }
    const { error } = await supabase.rpc("admin_set_user_pin", { _user_id: pinDialog.userId, _pin: pinValue });
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: "PIN establecido" }); setPinDialog({ open: false, userId: null, name: "" }); setPinValue(""); fetchAll(); }
  };

  const submitEdit = async () => {
    if (!editDialog.userId) return;
    if (!editDialog.full_name.trim()) {
      toast({ variant: "destructive", title: "Nombre requerido" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editDialog.email)) {
      toast({ variant: "destructive", title: "Email inválido" });
      return;
    }
    setEditLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-update-user", {
      body: { user_id: editDialog.userId, full_name: editDialog.full_name.trim(), email: editDialog.email.trim().toLowerCase() },
    });
    if (error || (data as any)?.error) {
      toast({ variant: "destructive", title: "No se pudo actualizar", description: (data as any)?.error || error?.message });
    } else {
      toast({ title: "Usuario actualizado" });
      setEditDialog({ open: false, userId: null, full_name: "", email: "" });
      fetchAll();
    }
    setEditLoading(false);
  };

  const togglePartner = async (id: string, v: boolean) => { await supabase.from("specialists").update({ is_partner: v }).eq("id", id); fetchAll(); };
  const toggleActive = async (id: string, v: boolean) => { await supabase.from("specialists").update({ is_active: v }).eq("id", id); fetchAll(); };
  const linkUser = async (specialistId: string, userId: string) => {
    const finalId = userId === "__none__" ? null : userId;
    await supabase.from("specialists").update({ user_id: finalId }).eq("id", specialistId);
    fetchAll();
  };

  const createSpecialist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpec.full_name.trim()) { toast({ variant: "destructive", title: "Nombre requerido" }); return; }
    setSpecLoading(true);
    const { error } = await supabase.from("specialists").insert({
      full_name: newSpec.full_name.trim(),
      specialty: newSpec.specialty,
      consultation_fee: Number(newSpec.consultation_fee) || 0,
      phone: newSpec.phone.trim() || null,
      email: newSpec.email.trim() || null,
      is_active: true,
    } as any);
    setSpecLoading(false);
    if (error) toast({ variant: "destructive", title: "No se pudo registrar", description: error.message });
    else {
      toast({ title: "Especialista registrado" });
      setSpecOpen(false);
      setNewSpec({ full_name: "", specialty: "psiquiatra", consultation_fee: "0", phone: "", email: "" });
      fetchAll();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Button>
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div><h1 className="text-lg font-bold">Gestión de usuarios</h1><p className="text-xs text-muted-foreground">{user?.email}</p></div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2"><UsersIcon className="w-6 h-6" /> {isOwnerOrAdmin ? "Usuarios y roles" : "Especialistas"}</h2>
            <p className="text-sm text-muted-foreground">{isOwnerOrAdmin ? "Crea cuentas, asigna roles, establece PIN de seguridad y vincula especialistas." : "Registra y mantiene el catálogo de especialistas."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setSpecOpen(true)}><Stethoscope className="w-4 h-4 mr-2" /> Nuevo especialista</Button>
          {isOwnerOrAdmin && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button><UserPlus className="w-4 h-4 mr-2" /> Nuevo usuario</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Crear usuario</DialogTitle>
                  <DialogDescription>El usuario quedará confirmado y podrá iniciar sesión inmediatamente.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-3">
                  <div className="space-y-1.5"><Label>Nombre completo *</Label><Input required value={newUser.full_name} onChange={(e) => setNewUser((p) => ({ ...p, full_name: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>Correo electrónico *</Label><Input required type="email" value={newUser.email} onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>Contraseña inicial *</Label><Input required type="text" minLength={8} value={newUser.password} onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))} placeholder="Mínimo 8 caracteres" /></div>
                  <div className="space-y-1.5">
                    <Label>Rol principal *</Label>
                    <Select value={newUser.role} onValueChange={(v) => setNewUser((p) => ({ ...p, role: v as Role }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRIMARY_ROLE_OPTIONS.map((r) => (
                          <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {newUser.role === "dueno" && (
                    <label className="flex items-center gap-2 text-sm">
                      <Switch checked={newUser.also_especialista} onCheckedChange={(v) => setNewUser((p) => ({ ...p, also_especialista: v }))} />
                      También es especialista
                    </label>
                  )}
                  <div className="space-y-1.5">
                    <Label>PIN de seguridad (opcional, 4–8 dígitos)</Label>
                    <Input inputMode="numeric" maxLength={8} value={newUser.pin} onChange={(e) => setNewUser((p) => ({ ...p, pin: e.target.value.replace(/\D/g, "") }))} placeholder="Ej. 1234" />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear usuario"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
          </div>
        </div>

        {isOwnerOrAdmin && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Cuentas registradas</CardTitle><CardDescription>Asigna rol principal, agrega rol secundario (ej. dueño + especialista) y establece PIN.</CardDescription></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol principal</TableHead>
                  <TableHead>Roles adicionales</TableHead>
                  <TableHead>PIN</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => {
                  const userRoles = rolesByUser[p.user_id] || [];
                  const primary = userRoles[0];
                  return (
                    <TableRow key={p.user_id}>
                      <TableCell>
                        <div className="font-medium">{p.full_name}</div>
                        <div className="text-xs text-muted-foreground">{p.email}</div>
                      </TableCell>
                      <TableCell>
                        <Select value={primary || ""} onValueChange={(v) => setPrimaryRole(p.user_id, v as Role)} disabled={!isOwnerOrAdmin}>
                          <SelectTrigger className="w-44"><SelectValue placeholder="Sin rol" /></SelectTrigger>
                          <SelectContent>
                            {PRIMARY_ROLE_OPTIONS.map((r) => (
                              <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {ADDITIONAL_ROLE_OPTIONS.filter((r) => r !== primary).map((r) => {
                            const has = userRoles.includes(r);
                            return (
                              <Badge
                                key={r}
                                variant={has ? "default" : "outline"}
                                className="cursor-pointer text-xs"
                                onClick={() => isOwnerOrAdmin && toggleAdditionalRole(p.user_id, r, has)}
                              >
                                {ROLE_LABEL[r]}
                              </Badge>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {p.pin_set_at ? (
                          <Badge variant="secondary" className="gap-1"><ShieldCheck className="w-3 h-3" /> Configurado</Badge>
                        ) : (
                          <Badge variant="outline">Sin PIN</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditDialog({ open: true, userId: p.user_id, full_name: p.full_name, email: p.email ?? "" })} disabled={!isOwnerOrAdmin}>
                            <Pencil className="w-3 h-3 mr-1" /> Editar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setPinDialog({ open: true, userId: p.user_id, name: p.full_name })} disabled={!isOwnerOrAdmin}>
                            <KeyRound className="w-3 h-3 mr-1" /> PIN
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/synapsia/metrics?user=${p.user_id}`)}>
                            <BarChart3 className="w-3 h-3 mr-1" /> Métricas
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        )}

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Especialistas y socios</CardTitle><CardDescription>Marca quién es socio (reparto de gastos), activa/desactiva y vincula a una cuenta de usuario.</CardDescription></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Especialidad</TableHead>
                  <TableHead className="text-right">Tarifa</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead>Socio</TableHead>
                  <TableHead>Cuenta vinculada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {specialists.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.full_name}</TableCell>
                    <TableCell className="text-sm capitalize">{s.specialty}</TableCell>
                    <TableCell className="text-right font-mono">${Number(s.consultation_fee).toLocaleString()}</TableCell>
                    <TableCell><Switch checked={s.is_active} onCheckedChange={(v) => toggleActive(s.id, v)} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={s.is_partner} onCheckedChange={(v) => togglePartner(s.id, v)} />
                        {s.is_partner && <Badge>Socio</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={s.user_id ?? ""} onValueChange={(v) => linkUser(s.id, v)}>
                        <SelectTrigger className="w-56"><SelectValue placeholder="Sin vincular" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Sin vincular —</SelectItem>
                          {profiles.map((p) => (
                            <SelectItem key={p.user_id} value={p.user_id}>{p.full_name} ({p.email})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* New specialist dialog */}
      <Dialog open={specOpen} onOpenChange={setSpecOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar especialista</DialogTitle>
            <DialogDescription>Da de alta al especialista en el catálogo. La cuenta de usuario se vincula después.</DialogDescription>
          </DialogHeader>
          <form onSubmit={createSpecialist} className="space-y-3">
            <div className="space-y-1.5"><Label>Nombre completo *</Label><Input required value={newSpec.full_name} onChange={(e) => setNewSpec((p) => ({ ...p, full_name: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>Especialidad *</Label>
              <Select value={newSpec.specialty} onValueChange={(v) => setNewSpec((p) => ({ ...p, specialty: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="psiquiatra">Psiquiatra</SelectItem>
                  <SelectItem value="psicologo">Psicólogo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Tarifa por consulta</Label><Input type="number" min="0" value={newSpec.consultation_fee} onChange={(e) => setNewSpec((p) => ({ ...p, consultation_fee: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5"><Label>Teléfono</Label><Input value={newSpec.phone} onChange={(e) => setNewSpec((p) => ({ ...p, phone: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Correo</Label><Input type="email" value={newSpec.email} onChange={(e) => setNewSpec((p) => ({ ...p, email: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSpecOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={specLoading}>{specLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Registrar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PIN dialog */}
      <Dialog open={pinDialog.open} onOpenChange={(v) => { if (!v) { setPinDialog({ open: false, userId: null, name: "" }); setPinValue(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Establecer PIN para {pinDialog.name}</DialogTitle><DialogDescription>4 a 8 dígitos numéricos.</DialogDescription></DialogHeader>
          <Input inputMode="numeric" maxLength={8} value={pinValue} onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ""))} placeholder="••••" className="text-center text-xl tracking-[0.5em]" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPinDialog({ open: false, userId: null, name: "" })}>Cancelar</Button>
            <Button onClick={submitPin} disabled={pinValue.length < 4}>Guardar PIN</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit user dialog */}
      <Dialog open={editDialog.open} onOpenChange={(v) => { if (!v) setEditDialog({ open: false, userId: null, full_name: "", email: "" }); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>Actualiza el nombre completo y/o el correo electrónico de inicio de sesión.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nombre completo</Label>
              <Input value={editDialog.full_name} onChange={(e) => setEditDialog((p) => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Correo electrónico</Label>
              <Input type="email" value={editDialog.email} onChange={(e) => setEditDialog((p) => ({ ...p, email: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Cambiar el correo modifica también el usuario de inicio de sesión.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, userId: null, full_name: "", email: "" })}>Cancelar</Button>
            <Button onClick={submitEdit} disabled={editLoading}>{editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar cambios"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
