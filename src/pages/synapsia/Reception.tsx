import { useState, useEffect } from "react";
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
  UserPlus, LogOut, Clock, CreditCard, Users, Brain, Search,
  CheckCircle2, Loader2, DollarSign, Stethoscope, Plus, Trash2
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Specialist {
  id: string;
  full_name: string;
  specialty: string;
  consultation_fee: number;
  is_active: boolean;
}

interface Patient {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
}

interface Visit {
  id: string;
  patient_id: string;
  specialist_id: string;
  arrival_time: string;
  departure_time: string | null;
  status: string;
  notes: string | null;
  patients: Patient;
  specialists: Specialist;
}

const statusLabels: Record<string, string> = {
  en_espera: "En espera",
  en_consulta: "En consulta",
  atendido: "Atendido",
  cancelado: "Cancelado",
};

const statusColors: Record<string, string> = {
  en_espera: "bg-yellow-100 text-yellow-800 border-yellow-200",
  en_consulta: "bg-blue-100 text-blue-800 border-blue-200",
  atendido: "bg-green-100 text-green-800 border-green-200",
  cancelado: "bg-red-100 text-red-800 border-red-200",
};

export default function Reception() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [isNewVisitOpen, setIsNewVisitOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isSpecialistsOpen, setIsSpecialistsOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  // New patient form
  const [newPatient, setNewPatient] = useState({ full_name: "", phone: "", email: "", date_of_birth: "", notes: "" });
  // New visit form
  const [newVisit, setNewVisit] = useState({ patient_id: "", specialist_id: "", notes: "" });
  // Payment form
  const [payment, setPayment] = useState({ amount: "", payment_method: "", notes: "" });
  // New specialist form
  const [newSpecialist, setNewSpecialist] = useState({ full_name: "", specialty: "", consultation_fee: "", phone: "", email: "" });

  useEffect(() => {
    fetchSpecialists();
    fetchTodayVisits();
    fetchPatients();
  }, []);

  const fetchSpecialists = async () => {
    const { data } = await supabase.from("specialists").select("*").eq("is_active", true);
    setSpecialists((data as any[]) || []);
  };

  const fetchPatients = async () => {
    const { data } = await supabase.from("patients").select("id, full_name, phone, email").order("full_name");
    setPatients((data as any[]) || []);
  };

  const fetchTodayVisits = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data } = await supabase
      .from("visits")
      .select("*, patients(*), specialists(*)")
      .gte("arrival_time", today.toISOString())
      .lt("arrival_time", tomorrow.toISOString())
      .order("arrival_time", { ascending: false });

    setVisits((data as any[]) || []);
  };

  const handleNewPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, data } = await supabase.from("patients").insert({
      full_name: newPatient.full_name,
      phone: newPatient.phone || null,
      email: newPatient.email || null,
      date_of_birth: newPatient.date_of_birth || null,
      notes: newPatient.notes || null,
    }).select().single();

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Paciente registrado exitosamente" });
      setNewPatient({ full_name: "", phone: "", email: "", date_of_birth: "", notes: "" });
      setIsNewPatientOpen(false);
      fetchPatients();
      // Auto-select this patient for visit
      if (data) {
        setNewVisit(prev => ({ ...prev, patient_id: data.id }));
        setIsNewVisitOpen(true);
      }
    }
    setLoading(false);
  };

  const handleNewVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("visits").insert({
      patient_id: newVisit.patient_id,
      specialist_id: newVisit.specialist_id,
      receptionist_id: user?.id,
      notes: newVisit.notes || null,
      status: "en_espera" as any,
    });

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Visita registrada" });
      setNewVisit({ patient_id: "", specialist_id: "", notes: "" });
      setIsNewVisitOpen(false);
      fetchTodayVisits();
    }
    setLoading(false);
  };

  const updateVisitStatus = async (visitId: string, status: string) => {
    const updates: any = { status };
    if (status === "en_consulta") {
      // nothing extra
    } else if (status === "atendido") {
      updates.departure_time = new Date().toISOString();
    }

    const { error } = await supabase.from("visits").update(updates).eq("id", visitId);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      fetchTodayVisits();
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit) return;
    setLoading(true);

    const { error } = await supabase.from("payments").insert({
      visit_id: selectedVisit.id,
      amount: parseFloat(payment.amount),
      payment_method: payment.payment_method as any,
      collected_by: user?.id,
      notes: payment.notes || null,
    });

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Cobro registrado exitosamente" });
      setPayment({ amount: "", payment_method: "", notes: "" });
      setIsPaymentOpen(false);
      setSelectedVisit(null);
      // Mark as atendido if not already
      if (selectedVisit.status !== "atendido") {
        await updateVisitStatus(selectedVisit.id, "atendido");
      }
      fetchTodayVisits();
    }
    setLoading(false);
  };

  const openPaymentDialog = (visit: Visit) => {
    setSelectedVisit(visit);
    setPayment({
      amount: visit.specialists.consultation_fee?.toString() || "",
      payment_method: "",
      notes: "",
    });
    setIsPaymentOpen(true);
  };

  const filteredVisits = visits.filter(v =>
    v.patients.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.specialists.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: visits.length,
    enEspera: visits.filter(v => v.status === "en_espera").length,
    enConsulta: visits.filter(v => v.status === "en_consulta").length,
    atendidos: visits.filter(v => v.status === "atendido").length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Synapsia</h1>
              <p className="text-xs text-muted-foreground">Recepción</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
            </span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
              <Users className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total hoy</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.enEspera}</p>
                <p className="text-xs text-muted-foreground">En espera</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
              <Brain className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.enConsulta}</p>
                <p className="text-xs text-muted-foreground">En consulta</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.atendidos}</p>
                <p className="text-xs text-muted-foreground">Atendidos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente o especialista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Dialog open={isNewPatientOpen} onOpenChange={setIsNewPatientOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <UserPlus className="w-4 h-4 mr-1" /> Nuevo Paciente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Nuevo Paciente</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleNewPatient} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre completo *</Label>
                    <Input required value={newPatient.full_name} onChange={e => setNewPatient(p => ({ ...p, full_name: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <Input value={newPatient.phone} onChange={e => setNewPatient(p => ({ ...p, phone: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={newPatient.email} onChange={e => setNewPatient(p => ({ ...p, email: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de nacimiento</Label>
                    <Input type="date" value={newPatient.date_of_birth} onChange={e => setNewPatient(p => ({ ...p, date_of_birth: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Notas</Label>
                    <Textarea value={newPatient.notes} onChange={e => setNewPatient(p => ({ ...p, notes: e.target.value }))} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Registrar Paciente"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isNewVisitOpen} onOpenChange={setIsNewVisitOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Clock className="w-4 h-4 mr-1" /> Registrar Visita
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Visita</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleNewVisit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Paciente *</Label>
                    <Select value={newVisit.patient_id} onValueChange={v => setNewVisit(p => ({ ...p, patient_id: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Especialista *</Label>
                    <Select value={newVisit.specialist_id} onValueChange={v => setNewVisit(p => ({ ...p, specialist_id: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar especialista" />
                      </SelectTrigger>
                      <SelectContent>
                        {specialists.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.full_name} — {s.specialty === "psiquiatra" ? "Psiquiatra" : "Psicólogo"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Notas</Label>
                    <Textarea value={newVisit.notes} onChange={e => setNewVisit(p => ({ ...p, notes: e.target.value }))} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading || !newVisit.patient_id || !newVisit.specialist_id}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Registrar Visita"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Visits table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Visitas del Día</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hora</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Especialista</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead>Salida</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay visitas registradas hoy
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVisits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(visit.arrival_time), "HH:mm")}
                      </TableCell>
                      <TableCell className="font-medium">{visit.patients.full_name}</TableCell>
                      <TableCell>
                        <div>
                          <span>{visit.specialists.full_name}</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            ({visit.specialists.specialty === "psiquiatra" ? "Psiq." : "Psic."})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[visit.status]}>
                          {statusLabels[visit.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {visit.departure_time ? format(new Date(visit.departure_time), "HH:mm") : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {visit.status === "en_espera" && (
                            <Button size="sm" variant="outline" onClick={() => updateVisitStatus(visit.id, "en_consulta")}>
                              En consulta
                            </Button>
                          )}
                          {visit.status === "en_consulta" && (
                            <Button size="sm" variant="outline" onClick={() => openPaymentDialog(visit)}>
                              <DollarSign className="w-3 h-3 mr-1" /> Cobrar
                            </Button>
                          )}
                          {visit.status === "atendido" && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Listo
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Cobro</DialogTitle>
          </DialogHeader>
          {selectedVisit && (
            <div className="space-y-1 text-sm text-muted-foreground mb-2">
              <p><strong>Paciente:</strong> {selectedVisit.patients.full_name}</p>
              <p><strong>Especialista:</strong> {selectedVisit.specialists.full_name}</p>
            </div>
          )}
          <form onSubmit={handlePayment} className="space-y-4">
            <div className="space-y-2">
              <Label>Monto *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                required
                value={payment.amount}
                onChange={e => setPayment(p => ({ ...p, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Método de pago *</Label>
              <Select value={payment.payment_method} onValueChange={v => setPayment(p => ({ ...p, payment_method: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea value={payment.notes} onChange={e => setPayment(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !payment.payment_method}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <CreditCard className="w-4 h-4 mr-1" /> Confirmar Cobro
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
