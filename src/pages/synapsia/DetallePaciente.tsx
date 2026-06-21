import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PinPrompt from "@/components/synapsia/PinPrompt";
import {
  ArrowLeft, LogOut, Save, Pencil, Phone, Mail, Cake, MapPin,
  DollarSign, Calendar, ShieldAlert, UserCheck, FileText, Plus,
  History, CreditCard, Download, AlertCircle, Receipt
} from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PatientData {
  id: string; full_name: string; phone: string | null; email: string | null;
  date_of_birth: string | null; notes: string | null; health_unit_id: string | null;
  tutor_name: string; tutor_phone: string; tutor_email: string; tutor_relationship: string;
  address: string; monthly_fee: string; payment_date: string;
  tipo_estancia: string; tipo_pago: string; paga: string;
  main_notes: string;
}

interface FeePayment {
  id: string; amount: number; method: string; reference: string | null;
  paid_at: string; notes: string | null;
  fee_id: string;
  fee?: { amount: number; patient_name: string };
}

interface PatientInvoice {
  id: string; invoice_number: string | null; invoice_date: string;
  amount: number; concept: string | null; status: string;
}

export default function DetallePaciente() {
  const { unitId, patientId } = useParams<{ unitId: string; patientId: string }>();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("resumen");
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [editing, setEditing] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinAction, setPinAction] = useState<"edit" | null>(null);
  const [saving, setSaving] = useState(false);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [invoices, setInvoices] = useState<PatientInvoice[]>([]);
  const [newInvoiceOpen, setNewInvoiceOpen] = useState(false);
  const [invForm, setInvForm] = useState({ concept: "", amount: 0 });

  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", date_of_birth: "", address: "",
    tutor_name: "", tutor_phone: "", tutor_email: "", tutor_relationship: "",
    monthly_fee: "", payment_date: "", tipo_estancia: "", tipo_pago: "", paga: "", notes: "",
  });

  useEffect(() => {
    if (!patientId) return;
    loadPatient();
    loadPayments();
    loadInvoices();
  }, [patientId]);

  async function loadPatient() {
    const { data } = await (supabase.from as any)("patients").select("*").eq("id", patientId).maybeSingle();
    if (!data) return;
    const p = data as any;
    let meta: any = {};
    if (p.notes) { try { meta = JSON.parse(p.notes); } catch {} }
    const pd: PatientData = {
      id: p.id, full_name: p.full_name, phone: p.phone, email: p.email,
      date_of_birth: p.date_of_birth, notes: p.notes, health_unit_id: p.health_unit_id,
      tutor_name: meta._tutor?.name || "", tutor_phone: meta._tutor?.phone || "",
      tutor_email: meta._tutor?.email || "", tutor_relationship: meta._tutor?.relationship || "",
      address: meta._address || "", monthly_fee: meta._monthly_fee || "",
      payment_date: meta._payment_date || "",
      tipo_estancia: meta._tipo_estancia || "", tipo_pago: meta._tipo_pago || "", paga: meta._paga || "",
      main_notes: meta._main || "",
    };
    setPatient(pd);
    setForm({
      full_name: pd.full_name, phone: pd.phone || "", email: pd.email || "",
      date_of_birth: pd.date_of_birth ? pd.date_of_birth.slice(0, 10) : "",
      address: pd.address, tutor_name: pd.tutor_name, tutor_phone: pd.tutor_phone,
      tutor_email: pd.tutor_email, tutor_relationship: pd.tutor_relationship,
      monthly_fee: pd.monthly_fee, payment_date: pd.payment_date,
      tipo_estancia: pd.tipo_estancia, tipo_pago: pd.tipo_pago, paga: pd.paga,
      notes: pd.main_notes,
    });
  }

  async function loadPayments() {
    const { data: fees } = await (supabase.from as any)("client_fees")
      .select("id, amount, patient_name").eq("health_unit_id", unitId).contains("patient_name", patient ? patient.full_name : "");
    if (!fees) return;
    const feeIds = (fees as any[]).map((f: any) => f.id);
    if (feeIds.length === 0) return;
    const { data: pmts } = await (supabase.from as any)("client_fee_payments")
      .select("*, fee:client_fees(amount, patient_name)")
      .in("fee_id", feeIds)
      .gte("paid_at", `${new Date().getFullYear()}-01-01`)
      .order("paid_at", { ascending: false });
    setPayments((pmts as any) || []);
  }

  async function loadInvoices() {
    const { data } = await (supabase.from as any)("patient_invoices")
      .select("*").eq("patient_id", patientId).order("invoice_date", { ascending: false });
    setInvoices((data as any) || []);
  }

  async function handleSave() {
    const metaNotes = JSON.stringify({
      _tutor: { name: form.tutor_name, phone: form.tutor_phone, email: form.tutor_email, relationship: form.tutor_relationship },
      _address: form.address,
      _monthly_fee: form.monthly_fee,
      _payment_date: form.payment_date,
      _tipo_estancia: form.tipo_estancia,
      _tipo_pago: form.tipo_pago,
      _paga: form.paga,
      _main: form.notes,
    });
    const { error } = await (supabase.from as any)("patients").update({
      full_name: form.full_name,
      phone: form.phone || null,
      email: form.email || null,
      date_of_birth: form.date_of_birth || null,
      notes: metaNotes,
    }).eq("id", patientId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Paciente actualizado" });
    setEditing(false);
    loadPatient();
  }

  async function handleNewInvoice() {
    if (!patientId || !unitId || !patient) return;
    if (!invForm.concept.trim() || !invForm.amount) { toast({ title: "Completa concepto y monto", variant: "destructive" }); return; }
    const { error } = await (supabase.from as any)("patient_invoices").insert({
      patient_id: patientId,
      patient_name: patient.full_name,
      health_unit_id: unitId,
      amount: invForm.amount,
      concept: invForm.concept,
      invoice_date: new Date().toISOString().slice(0, 10),
      status: "pendiente",
      uploaded_by: user!.id,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Gasto extra registrado" });
    setInvForm({ concept: "", amount: 0 });
    setNewInvoiceOpen(false);
    loadInvoices();
  }

  if (!patient) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Cargando...</p>
    </div>
  );

  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount), 0);
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const monthlyFeeNum = parseFloat(patient.monthly_fee) || 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/synapsia/unidades/${unitId}/registro-paciente`)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold">{patient.full_name}</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="resumen"><UserCheck className="w-4 h-4 mr-1" />Resumen</TabsTrigger>
            <TabsTrigger value="estado-cuenta"><DollarSign className="w-4 h-4 mr-1" />Estado de cuenta</TabsTrigger>
            <TabsTrigger value="nota-venta"><Receipt className="w-4 h-4 mr-1" />Nota de venta</TabsTrigger>
            <TabsTrigger value="historial"><History className="w-4 h-4 mr-1" />Historial</TabsTrigger>
          </TabsList>

          {/* === RESUMEN === */}
          <TabsContent value="resumen">
            {!editing ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Datos del paciente</CardTitle>
                    <Button size="sm" variant="outline" onClick={() => { setPinAction("edit"); setPinOpen(true); }}>
                      <Pencil className="w-4 h-4 mr-1" /> Editar
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Nombre:</span><p className="font-medium">{patient.full_name}</p></div>
                      <div><span className="text-muted-foreground">Teléfono:</span><p>{patient.phone || "—"}</p></div>
                      <div><span className="text-muted-foreground">Email:</span><p>{patient.email || "—"}</p></div>
                      <div><span className="text-muted-foreground">Fecha nac.:</span><p>{patient.date_of_birth ? format(new Date(patient.date_of_birth), "PP", { locale: es }) : "—"}</p></div>
                      <div><span className="text-muted-foreground">Dirección:</span><p>{patient.address || "—"}</p></div>
                      <div><span className="text-muted-foreground">Mensualidad:</span><p className="font-bold text-green-700">${monthlyFeeNum.toLocaleString()}</p></div>
                      <div><span className="text-muted-foreground">Día de pago:</span><p className="font-medium">Día {patient.payment_date || "—"} de cada mes</p></div>
                      <div><span className="text-muted-foreground">Tipo estancia:</span><p>{patient.tipo_estancia || "—"}</p></div>
                      <div><span className="text-muted-foreground">Tipo pago:</span><p>{patient.tipo_pago || "—"}</p></div>
                      <div className="sm:col-span-2"><span className="text-muted-foreground">Paga:</span><p className="font-medium">{patient.paga || "—"}</p></div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> Tutor responsable</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Nombre:</span><p className="font-medium">{patient.tutor_name || "—"}</p></div>
                      <div><span className="text-muted-foreground">Parentesco:</span><p>{patient.tutor_relationship || "—"}</p></div>
                      <div><span className="text-muted-foreground">Teléfono:</span><p>{patient.tutor_phone || "—"}</p></div>
                      <div><span className="text-muted-foreground">Email:</span><p>{patient.tutor_email || "—"}</p></div>
                    </div>
                  </CardContent>
                </Card>

                {patient.main_notes && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Notas</CardTitle></CardHeader>
                    <CardContent><p className="text-sm whitespace-pre-wrap">{patient.main_notes}</p></CardContent>
                  </Card>
                )}

                {/* Indicadores rápidos */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Mensualidad</p><p className="text-xl font-bold text-green-700">${monthlyFeeNum.toLocaleString()}</p></CardContent></Card>
                  <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Pagado {new Date().getFullYear()}</p><p className="text-xl font-bold">${totalPaid.toLocaleString()}</p></CardContent></Card>
                  <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Facturado extra</p><p className="text-xl font-bold text-amber-700">${totalInvoiced.toLocaleString()}</p></CardContent></Card>
                  <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Gastos extras</p><p className="text-xl font-bold">{invoices.length}</p></CardContent></Card>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
                <Card>
                  <CardHeader><CardTitle className="text-base">Editar paciente</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2"><Label>Nombre</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value.toUpperCase() })} /></div>
                      <div><Label>Teléfono</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                      <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                      <div><Label>Fecha nac.</Label><Input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} /></div>
                      <div><Label>Dirección</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value.toUpperCase() })} /></div>
                      <div><Label>Mensualidad $</Label><Input type="number" min="0" step="0.01" value={form.monthly_fee} onChange={e => setForm({ ...form, monthly_fee: e.target.value })} /></div>
                      <div><Label>Día de pago (1-31)</Label><Input type="number" min="1" max="31" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} placeholder="Ej: 5" /></div>
                      <div><Label>Tipo estancia</Label>
                        <Select value={form.tipo_estancia} onValueChange={v => setForm({ ...form, tipo_estancia: v })}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PERMANENTE">PERMANENTE</SelectItem>
                            <SelectItem value="ESTANCIA DE DIA">ESTANCIA DE DÍA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Tipo pago</Label><Input value={form.tipo_pago} onChange={e => setForm({ ...form, tipo_pago: e.target.value.toUpperCase() })} placeholder="MENSUAL, QUINCENAL, ETC" /></div>
                      <div className="sm:col-span-2"><Label>Paga</Label><Input value={form.paga} onChange={e => setForm({ ...form, paga: e.target.value.toUpperCase() })} placeholder="DESCRIPCIÓN" /></div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div><Label>Tutor nombre</Label><Input value={form.tutor_name} onChange={e => setForm({ ...form, tutor_name: e.target.value.toUpperCase() })} /></div>
                      <div><Label>Parentesco</Label>
                        <Select value={form.tutor_relationship} onValueChange={v => setForm({ ...form, tutor_relationship: v })}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                          <SelectContent>
                            {["MADRE","PADRE","HIJO(A)","HERMANO(A)","CONYUGE","FAMILIAR","TUTOR LEGAL","OTRO"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Tutor teléfono</Label><Input value={form.tutor_phone} onChange={e => setForm({ ...form, tutor_phone: e.target.value })} /></div>
                      <div><Label>Tutor email</Label><Input value={form.tutor_email} onChange={e => setForm({ ...form, tutor_email: e.target.value })} /></div>
                    </div>
                    <div><Label>Notas</Label><Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value.toUpperCase() })} /></div>
                  </CardContent>
                </Card>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
                  <Button type="submit" disabled={saving}><Save className="w-4 h-4 mr-1" />Guardar</Button>
                </div>
              </form>
            )}
          </TabsContent>

          {/* === ESTADO DE CUENTA === */}
          <TabsContent value="estado-cuenta">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="w-5 h-5" /> Pagos registrados — {new Date().getFullYear()}
                </CardTitle>
                <CardDescription>Total pagado: ${totalPaid.toLocaleString()}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {payments.length === 0 ? (
                  <CardContent className="text-center text-muted-foreground py-8">Sin pagos registrados en el año.</CardContent>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground text-xs">
                          <th className="text-left px-4 py-2 font-medium">Fecha</th>
                          <th className="text-left px-4 py-2 font-medium">Método</th>
                          <th className="text-left px-4 py-2 font-medium">Referencia</th>
                          <th className="text-right px-4 py-2 font-medium">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map(p => (
                          <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="px-4 py-2">{format(new Date(p.paid_at), "PP", { locale: es })}</td>
                            <td className="px-4 py-2 capitalize">{p.method || "—"}</td>
                            <td className="px-4 py-2 font-mono text-xs">{p.reference || "—"}</td>
                            <td className="px-4 py-2 text-right font-mono font-medium">${Number(p.amount).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === NOTA DE VENTA === */}
          <TabsContent value="nota-venta">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Gastos extras del paciente</h3>
                  <p className="text-sm text-muted-foreground">Agrega consumos adicionales (enfermería, alimentación, servicios, etc.)</p>
                </div>
                <Button onClick={() => setNewInvoiceOpen(true)}><Plus className="w-4 h-4 mr-1" /> Agregar gasto</Button>
              </div>

              {newInvoiceOpen && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Nuevo gasto extra</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div><Label>Concepto</Label>
                        <Select value={invForm.concept} onValueChange={v => setInvForm({ ...invForm, concept: v })}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enfermeria">Enfermería (curaciones, cuidados)</SelectItem>
                            <SelectItem value="alimentacion">Alimentación especial / suplementos</SelectItem>
                            <SelectItem value="medicamentos">Medicamentos no cubiertos</SelectItem>
                            <SelectItem value="transporte">Transporte / traslado</SelectItem>
                            <SelectItem value="terapias">Terapias adicionales</SelectItem>
                            <SelectItem value="servicios">Servicios generales</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Monto $</Label><Input type="number" min="0" step="0.01" value={invForm.amount} onChange={e => setInvForm({ ...invForm, amount: parseFloat(e.target.value) || 0 })} /></div>
                    </div>
                    {invForm.concept === "otro" && (
                      <div><Label>Especificar concepto</Label><Input placeholder="Describe el gasto..." onChange={e => setInvForm({ ...invForm, concept: e.target.value })} /></div>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setNewInvoiceOpen(false)}>Cancelar</Button>
                      <Button onClick={handleNewInvoice}>Registrar</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Gastos registrados</CardTitle>
                  <CardDescription>Total: ${totalInvoiced.toLocaleString()}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {invoices.length === 0 ? (
                    <CardContent className="text-center text-muted-foreground py-8">Sin gastos extras registrados.</CardContent>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground text-xs">
                            <th className="text-left px-4 py-2 font-medium">Fecha</th>
                            <th className="text-left px-4 py-2 font-medium">Concepto</th>
                            <th className="text-left px-4 py-2 font-medium">Estado</th>
                            <th className="text-right px-4 py-2 font-medium">Monto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map(inv => (
                            <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/50">
                              <td className="px-4 py-2">{format(new Date(inv.invoice_date), "PP", { locale: es })}</td>
                              <td className="px-4 py-2">{inv.concept || "—"}</td>
                              <td className="px-4 py-2">
                                <Badge variant={inv.status === "verificada" ? "secondary" : inv.status === "erronea" ? "destructive" : "outline"}>
                                  {inv.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-2 text-right font-mono font-medium">${Number(inv.amount).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* === HISTORIAL === */}
          <TabsContent value="historial">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="w-5 h-5" /> Historial de notas y gastos
                </CardTitle>
                <CardDescription>Todos los registros asociados al paciente</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {invoices.length === 0 ? (
                  <CardContent className="text-center text-muted-foreground py-8">Sin historial disponible.</CardContent>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground text-xs">
                          <th className="text-left px-4 py-2 font-medium">Fecha</th>
                          <th className="text-left px-4 py-2 font-medium">Tipo</th>
                          <th className="text-left px-4 py-2 font-medium">Concepto</th>
                          <th className="text-left px-4 py-2 font-medium">Estado</th>
                          <th className="text-right px-4 py-2 font-medium">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map(inv => (
                          <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="px-4 py-2">{format(new Date(inv.invoice_date), "PP", { locale: es })}</td>
                            <td className="px-4 py-2">Gasto extra</td>
                            <td className="px-4 py-2">{inv.concept || "—"}</td>
                            <td className="px-4 py-2">
                              <Badge variant={inv.status === "verificada" ? "secondary" : inv.status === "erronea" ? "destructive" : "outline"}>
                                {inv.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-right font-mono font-medium">${Number(inv.amount).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <PinPrompt
        open={pinOpen}
        onOpenChange={setPinOpen}
        title="Editar paciente"
        description="Ingresa tu PIN de seguridad para editar los datos del paciente."
        onConfirm={async () => { setEditing(true); }}
      />
    </div>
  );
}
