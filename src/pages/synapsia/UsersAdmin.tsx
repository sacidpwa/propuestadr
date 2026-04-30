import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Brain, LogOut, Loader2 } from "lucide-react";

interface Specialist {
  id: string; full_name: string; specialty: string; consultation_fee: number;
  is_active: boolean; is_partner: boolean; user_id: string | null; email: string | null;
}
interface Profile { user_id: string; full_name: string; email: string | null; }

export default function UsersAdmin() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchAll(); }, []);
  const fetchAll = async () => {
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase.from("specialists").select("*").order("full_name"),
      supabase.from("profiles").select("user_id, full_name, email"),
    ]);
    setSpecialists((s as any) || []);
    setProfiles((p as any) || []);
  };

  const togglePartner = async (id: string, v: boolean) => {
    await supabase.from("specialists").update({ is_partner: v }).eq("id", id);
    fetchAll();
  };
  const toggleActive = async (id: string, v: boolean) => {
    await supabase.from("specialists").update({ is_active: v }).eq("id", id);
    fetchAll();
  };

  const linkUser = async (specialistId: string, userId: string) => {
    setLoading(true);
    const { error } = await supabase.from("specialists").update({ user_id: userId || null }).eq("id", specialistId);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else toast({ title: "Vinculación actualizada" });
    fetchAll();
    setLoading(false);
  };

  const grantSpecialistRole = async (userId: string) => {
    if (!userId) return;
    setLoading(true);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "especialista" as any });
    if (error && !error.message.includes("duplicate")) toast({ variant: "destructive", title: "Error", description: error.message });
    else toast({ title: "Rol 'especialista' asignado" });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/synapsia/admin")}><ArrowLeft className="w-4 h-4" /></Button>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"><Brain className="w-5 h-5 text-primary-foreground" /></div>
            <div><h1 className="text-lg font-bold">Especialistas y Socios</h1><p className="text-xs text-muted-foreground">{user?.email}</p></div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Configuración por especialista</CardTitle></CardHeader>
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
                {specialists.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.full_name}</TableCell>
                    <TableCell className="text-sm">{s.specialty}</TableCell>
                    <TableCell className="text-right font-mono">${Number(s.consultation_fee).toLocaleString()}</TableCell>
                    <TableCell><Switch checked={s.is_active} onCheckedChange={(v) => toggleActive(s.id, v)} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={s.is_partner} onCheckedChange={(v) => togglePartner(s.id, v)} />
                        {s.is_partner && <Badge variant="default">Socio</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select value={s.user_id ?? ""} onValueChange={(v) => linkUser(s.id, v)}>
                          <SelectTrigger className="w-56"><SelectValue placeholder="Sin vincular" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={"__none__"}>— Sin vincular —</SelectItem>
                            {profiles.map(p => (
                              <SelectItem key={p.user_id} value={p.user_id}>{p.full_name} ({p.email})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {s.user_id && (
                          <Button size="sm" variant="outline" onClick={() => grantSpecialistRole(s.user_id!)} disabled={loading}>
                            Asignar rol
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">
          Para que un especialista entre al sistema con su agenda y expedientes: 1) la persona se registra desde el login con su email; 2) aquí lo vinculas a su perfil y le asignas el rol "especialista".
        </p>
      </main>
    </div>
  );
}
