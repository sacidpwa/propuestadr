import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, PieChart as RePieChart, Pie, Cell } from "recharts";
import {
  ArrowLeft, LogOut, Menu, X, Pill, Wallet, FileText, Users, ClipboardList,
  Sparkles, Wrench, HandCoins, Receipt, ShoppingBag, ShoppingCart, Package,
  ClipboardCheck, Building2, UserCheck, TrendingUp, TrendingDown, DollarSign,
  AlertCircle, ChevronLeft, ChevronRight, BookOpen, PiggyBank, CalendarDays, PieChart
} from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface HealthUnit { id: string; name: string; description: string | null; }

interface AppEntry {
  key: string; label: string; desc: string; icon: any; route: string;
  roles: string[];
}

const APPS: AppEntry[] = [
  { key: "dashboard", label: "Dashboard", desc: "KPIs y resumen operativo", icon: Building2, route: "", roles: ["admin", "dueno", "administrativo", "asistente_admin", "contador", "rrhh", "enfermera", "intendencia", "mantenimiento"] },
  { key: "registro-paciente", label: "Registro de paciente/residente", desc: "Datos del paciente y tutor responsable", icon: Users, route: "registro-paciente", roles: ["admin", "dueno", "administrativo", "asistente_admin", "recepcion", "enfermera", "especialista"] },
  { key: "medicamentos", label: "Control de medicamentos", desc: "Hoja por paciente (enfermería)", icon: Pill, route: "enfermeria", roles: ["admin", "dueno", "administrativo", "asistente_admin", "enfermera", "especialista"] },
  { key: "menus", label: "Menús semanales", desc: "Plan alimenticio y consumo", icon: ClipboardList, route: "enfermeria", roles: ["admin", "dueno", "administrativo", "asistente_admin", "enfermera", "especialista"] },
  { key: "gastos", label: "Control de flujos", desc: "Flujo de efectivo, ingresos y gastos", icon: Wallet, route: "gastos", roles: ["admin", "dueno", "administrativo", "asistente_admin"] },
  { key: "ingresos", label: "Facturas de ingreso", desc: "Facturas de pacientes y verificación", icon: Receipt, route: "facturas", roles: ["admin", "dueno", "administrativo", "contador"] },
  { key: "nomina", label: "Nómina", desc: "Periodos y pagos", icon: Users, route: "nomina", roles: ["admin", "dueno", "administrativo", "contador", "rrhh"] },
  { key: "plantilla", label: "Plantilla laboral", desc: "Empleados y asignación de unidades", icon: ClipboardCheck, route: "/synapsia/plantilla", roles: ["admin", "dueno", "administrativo", "asistente_admin", "contador", "rrhh"] },
  { key: "req-medicamentos", label: "Requisición de medicamentos", desc: "Solicitudes de insumos médicos", icon: ShoppingBag, route: "requisiciones/medicamentos", roles: ["admin", "dueno", "administrativo", "asistente_admin", "enfermera", "intendencia", "mantenimiento"] },
  { key: "req-limpieza", label: "Requisición de limpieza", desc: "Insumos de intendencia", icon: Sparkles, route: "requisiciones/limpieza", roles: ["admin", "dueno", "administrativo", "asistente_admin", "enfermera", "intendencia", "mantenimiento"] },
  { key: "req-mantenimiento", label: "Requisición de mantenimiento", desc: "Insumos de mantenimiento", icon: Wrench, route: "requisiciones/mantenimiento", roles: ["admin", "dueno", "administrativo", "asistente_admin", "enfermera", "intendencia", "mantenimiento"] },
  { key: "req-servicio", label: "Servicios de mantenimiento", desc: "Reparaciones y servicios externos", icon: Wrench, route: "requisiciones/servicio_mantenimiento", roles: ["admin", "dueno", "administrativo", "asistente_admin", "enfermera", "intendencia", "mantenimiento"] },
  { key: "pago-proveedores", label: "Pago a proveedores", desc: "Órdenes y verificación con PIN", icon: HandCoins, route: "requisiciones/pago_proveedor", roles: ["admin", "dueno", "administrativo", "asistente_admin", "intendencia", "mantenimiento"] },
  { key: "cobranza", label: "Cartera de clientes", desc: "Cuotas y morosos", icon: FileText, route: "cartera", roles: ["admin", "dueno", "administrativo", "contador"] },
  { key: "ordenes-compra", label: "Órdenes de compra", desc: "Generar, autorizar y abastecer", icon: ShoppingCart, route: "ordenes-compra", roles: ["admin", "dueno", "administrativo", "asistente_admin"] },
  { key: "inventario", label: "Inventario de medicamentos", desc: "Stock, entradas, alertas de mínimo", icon: Package, route: "inventario", roles: ["admin", "dueno", "administrativo", "asistente_admin", "enfermera"] },
  { key: "confirmar-inventario", label: "Confirmar inventario", desc: "Conteo físico cada 3 días", icon: ClipboardCheck, route: "confirmar-inventario", roles: ["admin", "dueno", "enfermera"] },
  { key: "precios", label: "Precios por servicio", desc: "Catálogo de precios de la unidad", icon: DollarSign, route: "precios", roles: ["admin", "dueno", "administrativo", "asistente_admin", "contador", "enfermera"] },
  { key: "diario", label: "Diario de pacientes", desc: "Registro diario de consultas y pagos", icon: BookOpen, route: "diario", roles: ["admin", "dueno", "administrativo", "asistente_admin", "recepcion"] },
  { key: "caja-chica", label: "Caja Chica", desc: "Control de efectivo menor por unidad", icon: PiggyBank, route: "caja-chica", roles: ["admin", "dueno", "administrativo", "contador"] },
];

interface FeeOverdue { id: string; patient_name: string; amount: number; next_due_date: string; days_overdue: number; }

interface AbonoEntry {
  patient_name: string;
  total_abonos: number;
  cuota_mensual: number;
  pendiente: number;
  fecha_pago: string;
  notas: string;
}

interface PatientSummary {
  patient_id: string;
  patient_name: string;
  ingresos: number;
  egresos: number;
  abonos: number;
  saldo: number;
}

interface DashboardData {
  patients: number;
  staff: number;
  expenses: number;
  income: number;
  inventoryItems: number;
  pendingRequisitions: number;
  activePOs: number;
  activeFees: number;
  overdueFees: number;
  overdueAmount: number;
  overdueList: FeeOverdue[];
  recentExpenses: any[];
  consultationsToday: number;
  collectedToday: number;
  consultationsMonth: number;
  collectedMonth: number;
  dailyInOut: { day: string; ingresos: number; egresos: number }[];
  todayConsultations: any[];
  periodExpenses: number;
  periodIncome: number;
  monthlyAbonos: AbonoEntry[];
  totalAbonosMes: number;
  monthly: { month: string; ingresos: number; gastos: number }[];
  patientSummary: PatientSummary[];
  expenseByCategory: { name: string; value: number; entries: any[] }[];
  incomeByPatient: { name: string; value: number; entries: any[] }[];
  staffList: any[];
}

const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MONTHS_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function localDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00");
}

function getPeriodRange(period: string, customFrom?: string, customTo?: string): { from: string; to: string; label: string; year: number; month: number | null } {
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();

  if (period.startsWith("mes-")) {
    const [, m, y] = period.split("-");
    const month = parseInt(m);
    const year = parseInt(y);
    const d = new Date(year, month - 1, 1);
    const s = startOfMonth(d);
    const e = endOfMonth(d);
    return { from: format(s, "yyyy-MM-dd"), to: format(e, "yyyy-MM-dd"), label: `${MONTHS_FULL[month - 1]} ${year}`, year, month };
  }

  if (period.startsWith("ano-")) {
    const year = parseInt(period.split("-")[1]);
    const s = new Date(year, 0, 1);
    return { from: format(s, "yyyy-MM-dd"), to: today, label: `Año ${year}`, year, month: null };
  }

  switch (period) {
    case "historico":
      return { from: "2020-01-01", to: today, label: "Histórico", year: curYear, month: null };
    case "custom": {
      const from = customFrom || today;
      const to = customTo || today;
      return { from, to, label: `${from} — ${to}`, year: curYear, month: null };
    }
    default: {
      const s = startOfMonth(now);
      const e = endOfMonth(now);
      return { from: format(s, "yyyy-MM-dd"), to: format(e, "yyyy-MM-dd"), label: `${MONTHS_FULL[curMonth - 1]} ${curYear}`, year: curYear, month: curMonth };
    }
  }
}

export default function UnidadDetalle() {
  const { id } = useParams<{ id: string }>();
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const [unit, setUnit] = useState<HealthUnit | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [period, setPeriod] = useState(`mes-${new Date().getMonth() + 1}-${new Date().getFullYear()}`);
  const [viewMode, setViewMode] = useState<"period" | "execution">("period");
  const [customFrom, setCustomFrom] = useState(format(new Date(), "yyyy-MM-dd"));
  const [customTo, setCustomTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    patients: 0, staff: 0, expenses: 0, income: 0,
    inventoryItems: 0, pendingRequisitions: 0, activePOs: 0,
    activeFees: 0, overdueFees: 0, overdueAmount: 0,
    overdueList: [], recentExpenses: [],
    consultationsToday: 0, collectedToday: 0,
    consultationsMonth: 0, collectedMonth: 0,
    dailyInOut: [], todayConsultations: [],
    periodExpenses: 0, periodIncome: 0,
    monthlyAbonos: [], totalAbonosMes: 0,
    monthly: [],
    patientSummary: [],
    expenseByCategory: [],
    incomeByPatient: [],
    staffList: [],
  });
  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const [patientSummaryLoading, setPatientSummaryLoading] = useState(false);
  const [categoryDetailOpen, setCategoryDetailOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{ name: string; value: number; entries: any[] } | null>(null);
  const [categorySort, setCategorySort] = useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc">("date_desc");
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [staffSort, setStaffSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "full_name", dir: "asc" });
  const [incomePatientOpen, setIncomePatientOpen] = useState(false);
  const [selectedIncomePatient, setSelectedIncomePatient] = useState<{ name: string; value: number; entries: any[] } | null>(null);
  const [incomePatientSort, setIncomePatientSort] = useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc">("date_desc");

  const loadDashboard = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
    const pr = getPeriodRange(period, customFrom, customTo);
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const periodMonths: { month: number; year: number }[] = [];
    const fromDate = localDate(pr.from);
    const toDate = localDate(pr.to);
    const cursor = localDate(pr.from);
    cursor.setDate(1);
    while (cursor <= toDate) {
      periodMonths.push({ month: cursor.getMonth() + 1, year: cursor.getFullYear() });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const q = (builder: any) => new Promise<{ data: any[]; count: number | null }>((resolve) => {
      builder.then((res: any) => resolve(res)).catch(() => resolve({ data: [], count: null }));
    });

    const [patientRes, staffUnitsRes, staffAllRes, invRes, reqRes, poRes, feeRes, expenseAllEntriesRes, incomeAllEntriesRes, incomeDetailRes, monthlyRes, consultDailyRes, consultTodayRes, consultMonthRes, abonosRes, recentRes, todayDetailRes, expenseCategoryRes] = await Promise.all([
      q((supabase.from as any)("patients").select("id").eq("health_unit_id", id)),
      q((supabase.from as any)("payroll_employee_units").select("employee_id").eq("health_unit_id", id)),
      q((supabase.from as any)("payroll_employees").select("*").eq("is_active", true)),
      q((supabase.from as any)("medication_inventory").select("id", { count: "exact", head: true }).eq("health_unit_id", id)),
      q((supabase.from as any)("requisitions").select("id", { count: "exact", head: true }).eq("health_unit_id", id).in("status", ["pendiente", "autorizada"])),
      q((supabase.from as any)("purchase_orders").select("id", { count: "exact", head: true }).eq("health_unit_id", id).in("status", ["pendiente", "autorizada", "comprada"])),
      q((supabase.from as any)("client_fees").select("*").eq("health_unit_id", id).eq("is_active", true)),
      q((supabase.from as any)("expense_entries").select("amount, expense_date, period_month, period_year, entry_type").eq("health_unit_id", id).eq("entry_type", "gasto")),
      q((supabase.from as any)("expense_entries").select("amount, expense_date, period_month, period_year, entry_type").eq("health_unit_id", id).eq("entry_type", "ingreso")),
      q((supabase.from as any)("expense_entries").select("amount, expense_date, period_month, period_year, entry_type, patient_name, description, category").eq("health_unit_id", id).eq("entry_type", "ingreso")),
      q((supabase.from as any)("expense_entries").select("amount, entry_type, period_month").eq("health_unit_id", id).eq("period_year", currentYear)),
      q((supabase.from as any)("consultation_log").select("record_date, amount_collected").eq("health_unit_id", id).gte("record_date", pr.from).lte("record_date", pr.to).order("record_date")),
      q((supabase.from as any)("consultation_log").select("amount_collected", { count: "exact", head: false }).eq("health_unit_id", id).eq("record_date", todayStr)),
      q((supabase.from as any)("consultation_log").select("amount_collected", { count: "exact", head: false }).eq("health_unit_id", id).gte("record_date", `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`)),
      q((supabase.from as any)("client_fee_payments").select("amount, paid_at, fee_id").gte("paid_at", `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`)),
      q((supabase.from as any)("expense_entries").select("*").eq("health_unit_id", id).order("created_at", { ascending: false }).limit(5)),
      q((supabase.from as any)("consultation_log").select("*").eq("health_unit_id", id).eq("record_date", todayStr).order("created_at")),
      q((supabase.from as any)("expense_entries").select("description, amount, category, expense_date, period_month, period_year, notes").eq("health_unit_id", id).eq("entry_type", "gasto")),
    ]);

    const unitEmployeeIds = ((staffUnitsRes.data as any[]) || []).map((u: any) => u.employee_id);
    const staffList = ((staffAllRes.data as any[]) || []).filter((e: any) => unitEmployeeIds.includes(e.id));

    const allExpenses = (expenseAllEntriesRes.data as any[]) || [];
    const allIncomes = (incomeAllEntriesRes.data as any[]) || [];

    const matchesPeriod = (e: any) => periodMonths.some(pm => pm.month === e.period_month && pm.year === e.period_year);
    const matchesDateRange = (e: any) => e.expense_date >= pr.from && e.expense_date <= pr.to;

    const expensesFiltered = viewMode === "period" ? allExpenses.filter(matchesPeriod) : allExpenses.filter(matchesDateRange);
    const incomeFiltered = viewMode === "period" ? allIncomes.filter(matchesPeriod) : allIncomes.filter(matchesDateRange);

    const expenses = expensesFiltered.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
    const income = incomeFiltered.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);

    const periodExpenses = expenses;
    const periodIncome = income;

    const monthlyMap: Record<string, { ingresos: number; gastos: number }> = {};
    for (let m = 0; m < 12; m++) monthlyMap[MONTHS[m]] = { ingresos: 0, gastos: 0 };
    ((monthlyRes.data as any[]) || []).forEach((e: any) => {
      const m = MONTHS[Number(e.period_month) - 1];
      if (monthlyMap[m]) {
        if (e.entry_type === "ingreso") monthlyMap[m].ingresos += Number(e.amount || 0);
        else monthlyMap[m].gastos += Number(e.amount || 0);
      }
    });
    const monthly = Object.entries(monthlyMap).map(([month, v]) => ({ month, ...v }));

    const expensesByDate = allExpenses.filter(matchesDateRange);
    const incomeByDate = allIncomes.filter(matchesDateRange);

    const periodFrom = localDate(pr.from);
    const periodTo = localDate(pr.to);
    const dayCount = Math.ceil((periodTo.getTime() - periodFrom.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const dailyMap: Record<string, { ingresos: number; egresos: number }> = {};
    for (let d = 0; d < dayCount; d++) {
      const dt = localDate(pr.from);
      dt.setDate(dt.getDate() + d);
      const key = format(dt, "yyyy-MM-dd");
      dailyMap[key] = { ingresos: 0, egresos: 0 };
    }

    const dailyExpenses: Record<string, number> = {};
    expensesByDate.forEach((e: any) => {
      const key = e.expense_date?.slice(0, 10);
      if (key && dailyMap[key]) {
        dailyMap[key].egresos += Number(e.amount || 0);
      }
    });

    const dailyIncome: Record<string, number> = {};
    incomeByDate.forEach((e: any) => {
      const key = e.expense_date?.slice(0, 10);
      if (key && dailyMap[key]) {
        dailyMap[key].ingresos += Number(e.amount || 0);
      }
    });

    ((consultDailyRes.data as any[]) || []).forEach((c: any) => {
      const key = c.record_date?.slice(0, 10);
      if (key && dailyMap[key]) {
        dailyMap[key].ingresos += Number(c.amount_collected || 0);
      }
    });

    const dailyInOut = Object.entries(dailyMap).map(([day, v]) => ({
      day: day.slice(8, 10), ...v,
    }));

    const todayConsultations = (consultTodayRes.data as any[]) || [];
    const consultationsToday = todayConsultations.length;
    const collectedToday = todayConsultations.reduce((s: number, c: any) => s + Number(c.amount_collected || 0), 0);

    const monthConsultations = (consultMonthRes.data as any[]) || [];
    const consultationsMonth = monthConsultations.length;
    const collectedMonth = monthConsultations.reduce((s: number, c: any) => s + Number(c.amount_collected || 0), 0);

    const activeFees = (feeRes.data as any[]) || [];
    const today = new Date();
    const overdue = activeFees.filter((f: any) => f.next_due_date && localDate(f.next_due_date) < today);
    const overdueAmount = overdue.reduce((s: number, f: any) => s + Number(f.amount || 0), 0);
    const overdueList = overdue.map((f: any) => ({
      id: f.id, patient_name: f.patient_name, amount: Number(f.amount),
      next_due_date: f.next_due_date,
      days_overdue: Math.floor((today.getTime() - localDate(f.next_due_date).getTime()) / (1000 * 60 * 60 * 24)),
    })).sort((a: any, b: any) => b.days_overdue - a.days_overdue);

    const abonosData = (abonosRes.data as any[]) || [];
    const feeMap: Record<string, any> = {};
    activeFees.forEach((f: any) => { feeMap[f.id] = f; });

    const abonoMap: Record<string, AbonoEntry> = {};
    abonosData.forEach((a: any) => {
      const fee = feeMap[a.fee_id];
      if (!fee) return;
      const name = fee.patient_name || "Desconocido";
      if (!abonoMap[name]) {
        abonoMap[name] = { patient_name: name, total_abonos: 0, cuota_mensual: Number(fee.amount || 0), pendiente: 0, fecha_pago: fee.next_due_date || "", notas: fee.notes || "" };
      }
      abonoMap[name].total_abonos += Number(a.amount || 0);
    });

    Object.values(abonoMap).forEach((entry) => {
      entry.pendiente = Math.max(0, entry.cuota_mensual - entry.total_abonos);
    });

    const monthlyAbonos = Object.values(abonoMap).sort((a, b) => b.total_abonos - a.total_abonos);
    const totalAbonosMes = abonosData.reduce((s: number, a: any) => s + Number(a.amount || 0), 0);

    const catMap: Record<string, { name: string; value: number; entries: any[] }> = {};
    ((expenseCategoryRes.data as any[]) || []).filter((e: any) => {
      return viewMode === "period" ? periodMonths.some(pm => pm.month === e.period_month && pm.year === e.period_year) : (e.expense_date >= pr.from && e.expense_date <= pr.to);
    }).forEach((e: any) => {
      const cat = e.category || "Sin categoría";
      if (!catMap[cat]) catMap[cat] = { name: cat, value: 0, entries: [] };
      catMap[cat].value += Number(e.amount || 0);
      catMap[cat].entries.push(e);
    });
    const expenseByCategory = Object.values(catMap).sort((a, b) => b.value - a.value);

    const patMap: Record<string, { name: string; value: number; entries: any[] }> = {};
    ((incomeDetailRes.data as any[]) || []).filter((e: any) => {
      return viewMode === "period" ? periodMonths.some(pm => pm.month === e.period_month && pm.year === e.period_year) : (e.expense_date >= pr.from && e.expense_date <= pr.to);
    }).forEach((e: any) => {
      const pat = e.patient_name || "Sin paciente";
      if (!patMap[pat]) patMap[pat] = { name: pat, value: 0, entries: [] };
      patMap[pat].value += Number(e.amount || 0);
      patMap[pat].entries.push(e);
    });
    const incomeByPatient = Object.values(patMap).sort((a, b) => b.value - a.value);

    setData(prev => ({
      patients: (patientRes.data as any[])?.length || 0,
      staff: staffList.length,
      expenses, income,
      inventoryItems: invRes.count || 0,
      pendingRequisitions: reqRes.count || 0,
      activePOs: poRes.count || 0,
      activeFees: activeFees.length,
      overdueFees: overdue.length,
      overdueAmount,
      overdueList,
      recentExpenses: (recentRes.data as any[]) || [],
      consultationsToday, collectedToday,
      consultationsMonth, collectedMonth,
      dailyInOut,
      todayConsultations: (todayDetailRes.data as any[]) || [],
      periodExpenses, periodIncome,
      monthlyAbonos, totalAbonosMes,
      monthly,
      patientSummary: prev.patientSummary,
      expenseByCategory,
      incomeByPatient,
      staffList,
    }));
    setLoading(false);
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setLoading(false);
    }
  }, [id, period, viewMode, customFrom, customTo]);

  async function loadPatientSummary() {
    if (!id) return;
    setPatientSummaryLoading(true);
    setPatientDialogOpen(true);

    try {
    const pr = getPeriodRange(period, customFrom, customTo);

    const qp = (builder: any) => new Promise<{ data: any[]; error: any }>((resolve) => {
      builder.then((res: any) => resolve(res)).catch(() => resolve({ data: [], error: null }));
    });

    const [patientsRes, incomeRes, expenseRes, abonosRes, consultRes, feesRes] = await Promise.all([
      qp((supabase.from as any)("patients").select("id, full_name").eq("health_unit_id", id)),
      qp((supabase.from as any)("expense_entries").select("patient_id, patient_name, amount").eq("health_unit_id", id).eq("entry_type", "ingreso").gte("expense_date", pr.from).lte("expense_date", pr.to)),
      qp((supabase.from as any)("expense_entries").select("patient_id, patient_name, amount").eq("health_unit_id", id).eq("entry_type", "gasto").gte("expense_date", pr.from).lte("expense_date", pr.to)),
      qp((supabase.from as any)("client_fee_payments").select("amount, fee_id").gte("paid_at", pr.from)),
      qp((supabase.from as any)("consultation_log").select("patient_name, amount_collected").eq("health_unit_id", id).gte("record_date", pr.from).lte("record_date", pr.to)),
      qp((supabase.from as any)("client_fees").select("id, patient_name").eq("health_unit_id", id)),
    ]);

    const patientsList = (patientsRes.data as any[]) || [];
    const incomeEntries = (incomeRes.data as any[]) || [];
    const expenseEntries = (expenseRes.data as any[]) || [];
    const abonosEntries = (abonosRes.data as any[]) || [];
    const consultEntries = (consultRes.data as any[]) || [];
    const feesList = (feesRes.data as any[]) || [];

    const feeMap: Record<string, string> = {};
    feesList.forEach((f: any) => { feeMap[f.id] = f.patient_name; });

    const summaryMap: Record<string, PatientSummary> = {};

    patientsList.forEach((p: any) => {
      summaryMap[p.full_name] = {
        patient_id: p.id,
        patient_name: p.full_name,
        ingresos: 0,
        egresos: 0,
        abonos: 0,
        saldo: 0,
      };
    });

    incomeEntries.forEach((e: any) => {
      if (e.patient_name && summaryMap[e.patient_name]) {
        summaryMap[e.patient_name].ingresos += Number(e.amount || 0);
      }
    });

    consultEntries.forEach((c: any) => {
      if (c.patient_name && summaryMap[c.patient_name]) {
        summaryMap[c.patient_name].ingresos += Number(c.amount_collected || 0);
      }
    });

    expenseEntries.forEach((e: any) => {
      if (e.patient_name && summaryMap[e.patient_name]) {
        summaryMap[e.patient_name].egresos += Number(e.amount || 0);
      }
    });

    abonosEntries.forEach((a: any) => {
      const name = feeMap[a.fee_id];
      if (name && summaryMap[name]) {
        summaryMap[name].abonos += Number(a.amount || 0);
      }
    });

    const summary = Object.values(summaryMap).map(s => ({
      ...s,
      saldo: s.ingresos - s.egresos,
    })).sort((a, b) => b.ingresos - a.ingresos);

    setData(prev => ({ ...prev, patientSummary: summary }));
    } catch (err) {
      console.error("Error loading patient summary:", err);
    } finally {
      setPatientSummaryLoading(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data: u } = await (supabase.from as any)("health_units").select("*").eq("id", id).maybeSingle();
        setUnit((u as any) || null);
      } catch (err) {
        console.error("Error loading health unit:", err);
      }
    })();
    loadDashboard();
  }, [id, loadDashboard]);

  const apps = APPS.filter(a => a.key === "dashboard" || a.roles.some(r => hasRole(r)));
  const pr = getPeriodRange(period);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card shadow-sm z-10">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/synapsia/unidades")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden">
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:inline-flex">
              {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold">{unit?.name ?? "Unidad"}</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className={`hidden md:flex flex-col border-r bg-card transition-all duration-200 ${sidebarOpen ? "w-64" : "w-14"}`}>
          <ScrollArea className="flex-1 py-2">
            <nav className="space-y-0.5 px-2">
              {apps.map(({ key, label, icon: Icon, route }) => {
                const isDashboard = key === "dashboard";
                return (
                  <button
                    key={key}
                    onClick={() => navigate(isDashboard ? `/synapsia/unidades/${id}` : route.startsWith("/") ? route : `/synapsia/unidades/${id}/${route}`)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isDashboard ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
                    title={sidebarOpen ? undefined : label}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {sidebarOpen && <span className="truncate">{label}</span>}
                  </button>
                );
              })}
            </nav>
          </ScrollArea>
        </aside>

        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="w-64 bg-card border-r shadow-xl">
              <div className="flex items-center justify-between p-3 border-b">
                <span className="font-semibold text-sm">Aplicativos</span>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}><X className="w-4 h-4" /></Button>
              </div>
              <ScrollArea className="h-[calc(100vh-4rem)]">
                <nav className="space-y-0.5 p-2">
                  {apps.map(({ key, label, icon: Icon, route }) => {
                    const isDashboard = key === "dashboard";
                    return (
                      <button
                        key={key}
                        onClick={() => { setSidebarOpen(false); navigate(isDashboard ? `/synapsia/unidades/${id}` : route.startsWith("/") ? route : `/synapsia/unidades/${id}/${route}`); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{label}</span>
                      </button>
                    );
                  })}
                </nav>
              </ScrollArea>
            </div>
            <div className="flex-1 bg-black/30" onClick={() => setSidebarOpen(false)} />
          </div>
        )}

        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

            {/* Filtro de período */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CalendarDays className="w-4 h-4" /> Período: {pr.label}
              </h2>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex rounded-md border overflow-hidden text-xs">
                  <button
                    onClick={() => setViewMode("period")}
                    className={`px-3 py-1.5 transition-colors ${viewMode === "period" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
                  >Por mes</button>
                  <button
                    onClick={() => setViewMode("execution")}
                    className={`px-3 py-1.5 transition-colors ${viewMode === "execution" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
                  >Por fecha</button>
                </div>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Seleccionar período" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS_FULL.slice(0, new Date().getMonth() + 1).reverse().map((name, i) => {
                      const m = new Date().getMonth() + 1 - i;
                      const y = new Date().getFullYear();
                      return <SelectItem key={`mes-${m}-${y}`} value={`mes-${m}-${y}`}>{name} {y}</SelectItem>;
                    })}
                    {MONTHS_FULL.slice(0, 12).reverse().map((name, i) => {
                      const m = 12 - i;
                      const y = new Date().getFullYear() - 1;
                      return <SelectItem key={`mes-${m}-${y}`} value={`mes-${m}-${y}`}>{name} {y}</SelectItem>;
                    })}
                    <SelectItem value={`ano-${new Date().getFullYear()}`}>Año {new Date().getFullYear()}</SelectItem>
                    <SelectItem value="historico">Histórico</SelectItem>
                    <SelectItem value="custom">Rango personalizado...</SelectItem>
                  </SelectContent>
                </Select>
                {period === "custom" && (
                  <div className="flex items-center gap-2">
                    <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="w-40 h-9 text-xs" />
                    <span className="text-muted-foreground text-xs">a</span>
                    <Input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="w-40 h-9 text-xs" />
                  </div>
                )}
              </div>
            </div>

            {/* KPIs principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="cursor-pointer hover:border-blue-500/50 transition-colors" onClick={loadPatientSummary}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pacientes / Residentes</p>
                      <p className="text-xl font-bold">{data.patients}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-amber-500/50 transition-colors" onClick={() => setStaffDialogOpen(true)}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Empleados</p>
                      <p className="text-xl font-bold">{data.staff}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-sky-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Consultas del mes</p>
                      <p className="text-xl font-bold">{data.consultationsMonth}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <HandCoins className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Abonos del mes</p>
                      <p className="text-xl font-bold text-violet-700">${data.totalAbonosMes.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* KPIs del período */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Ingresos período</p>
                      <p className="text-xl font-bold text-emerald-700">${data.periodIncome.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Egresos período</p>
                      <p className="text-xl font-bold text-rose-700">${data.periodExpenses.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfica Ingresos vs Egresos del período */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" /> Ingresos vs Egresos
                </CardTitle>
                <CardDescription>Movimientos diarios del período: {pr.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {data.dailyInOut.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.dailyInOut} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={data.dailyInOut.length > 15 ? Math.floor(data.dailyInOut.length / 10) : 0} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                        <ReTooltip formatter={(v: number) => `$${Number(v).toLocaleString()}`} />
                        <Legend />
                        <Bar dataKey="ingresos" fill="#22c55e" name="Ingresos" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="egresos" fill="#ef4444" name="Egresos" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      Sin datos para el período seleccionado
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Gráfica de dona: Gastos por categoría */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="w-5 h-5" /> Gastos por categoría
                </CardTitle>
                <CardDescription>Distribución de gastos del período: {pr.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {data.expenseByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={data.expenseByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={110}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                          onClick={(entry) => {
                            setSelectedCategory({ name: entry.name, value: entry.value, entries: entry.entries });
                            setCategorySort("date_desc");
                            setCategoryDetailOpen(true);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          {data.expenseByCategory.map((_, i) => (
                            <Cell key={i} fill={["#ef4444","#f97316","#eab308","#22c55e","#06b6d4","#8b5cf6","#ec4899","#6366f1","#14b8a6","#f43f5e"][i % 10]} />
                          ))}
                        </Pie>
                        <ReTooltip formatter={(v: number) => `$${Number(v).toLocaleString()}`} />
                        <Legend />
                      </RePieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      Sin gastos registrados en el período
                    </div>
                  )}
                </div>
                {data.expenseByCategory.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground text-xs">
                          <th className="text-left px-3 py-2 font-medium">Categoría</th>
                          <th className="text-right px-3 py-2 font-medium">Monto</th>
                          <th className="text-right px-3 py-2 font-medium">% del total</th>
                          <th className="text-right px-3 py-2 font-medium">Movimientos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.expenseByCategory.map((cat) => {
                          const total = data.expenseByCategory.reduce((s, c) => s + c.value, 0);
                          const pct = total > 0 ? ((cat.value / total) * 100).toFixed(1) : "0";
                          return (
                            <tr
                              key={cat.name}
                              className="border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                              onClick={() => { setSelectedCategory(cat); setCategorySort("date_desc"); setCategoryDetailOpen(true); }}
                            >
                              <td className="px-3 py-2 font-medium">{cat.name}</td>
                              <td className="px-3 py-2 text-right font-mono text-red-700">${cat.value.toLocaleString()}</td>
                              <td className="px-3 py-2 text-right">{pct}%</td>
                              <td className="px-3 py-2 text-right">{cat.entries.length}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gráfica de dona: Ingresos por paciente */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" /> Ingresos por paciente
                </CardTitle>
                <CardDescription>Distribución de ingresos del período: {pr.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {data.incomeByPatient.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={data.incomeByPatient}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={110}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                          onClick={(entry) => {
                            setSelectedIncomePatient({ name: entry.name, value: entry.value, entries: entry.entries });
                            setIncomePatientSort("date_desc");
                            setIncomePatientOpen(true);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          {data.incomeByPatient.map((_, i) => (
                            <Cell key={i} fill={["#22c55e","#06b6d4","#8b5cf6","#eab308","#f97316","#ec4899","#6366f1","#14b8a6","#ef4444","#f43f5e"][i % 10]} />
                          ))}
                        </Pie>
                        <ReTooltip formatter={(v: number) => `$${Number(v).toLocaleString()}`} />
                        <Legend />
                      </RePieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      Sin ingresos registrados en el período
                    </div>
                  )}
                </div>
                {data.incomeByPatient.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground text-xs">
                          <th className="text-left px-3 py-2 font-medium">Paciente</th>
                          <th className="text-right px-3 py-2 font-medium">Monto</th>
                          <th className="text-right px-3 py-2 font-medium">% del total</th>
                          <th className="text-right px-3 py-2 font-medium">Movimientos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.incomeByPatient.map((pat) => {
                          const total = data.incomeByPatient.reduce((s, p) => s + p.value, 0);
                          const pct = total > 0 ? ((pat.value / total) * 100).toFixed(1) : "0";
                          return (
                            <tr
                              key={pat.name}
                              className="border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                              onClick={() => { setSelectedIncomePatient(pat); setIncomePatientSort("date_desc"); setIncomePatientOpen(true); }}
                            >
                              <td className="px-3 py-2 font-medium">{pat.name}</td>
                              <td className="px-3 py-2 text-right font-mono text-green-700">${pat.value.toLocaleString()}</td>
                              <td className="px-3 py-2 text-right">{pct}%</td>
                              <td className="px-3 py-2 text-right">{pat.entries.length}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Abonos mensuales de pacientes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <HandCoins className="w-5 h-5" /> Abonos mensuales de pacientes
                </CardTitle>
                <CardDescription>Pagos registrados en el mes actual — Total: ${data.totalAbonosMes.toLocaleString()}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {data.monthlyAbonos.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground text-xs">
                          <th className="text-left px-4 py-2 font-medium">Paciente</th>
                          <th className="text-right px-4 py-2 font-medium">Cuota mensual</th>
                          <th className="text-right px-4 py-2 font-medium">Abonado</th>
                          <th className="text-right px-4 py-2 font-medium">Pendiente</th>
                          <th className="text-left px-4 py-2 font-medium">Notas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.monthlyAbonos.map((a) => (
                          <tr key={a.patient_name} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="px-4 py-2 font-medium">{a.patient_name}</td>
                            <td className="px-4 py-2 text-right">${a.cuota_mensual.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right font-medium text-green-700">${a.total_abonos.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right">
                              <Badge variant={a.pendiente > 0 ? "destructive" : "secondary"} className={a.pendiente === 0 ? "bg-green-500/10 text-green-700" : ""}>
                                ${a.pendiente.toLocaleString()}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-xs text-muted-foreground truncate max-w-[200px]">{a.notas}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <HandCoins className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No hay abonos registrados este mes</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Consultas de hoy */}
            {data.todayConsultations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="w-5 h-5" /> Consultas de hoy
                  </CardTitle>
                  <CardDescription>{data.consultationsToday} consulta(s) — ${data.collectedToday.toLocaleString()} cobrado</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground text-xs">
                          <th className="text-left px-4 py-2 font-medium">Médico</th>
                          <th className="text-left px-4 py-2 font-medium">Paciente</th>
                          <th className="text-left px-4 py-2 font-medium">Servicio</th>
                          <th className="text-right px-4 py-2 font-medium">Costo</th>
                          <th className="text-right px-4 py-2 font-medium">Cobrado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.todayConsultations.map((c: any) => (
                          <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="px-4 py-2">{c.specialist_name}</td>
                            <td className="px-4 py-2 font-medium">{c.patient_name}</td>
                            <td className="px-4 py-2">{c.service_type}</td>
                            <td className="px-4 py-2 text-right">${Number(c.cost).toLocaleString()}</td>
                            <td className="px-4 py-2 text-right">${(c.amount_collected ? Number(c.amount_collected) : 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ingresos vs Gastos anual */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" /> Ingresos vs Gastos {new Date().getFullYear()}
                </CardTitle>
                <CardDescription>Comparativa mensual de ingresos y gastos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthly} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                      <ReTooltip formatter={(v: number) => `$${Number(v).toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="ingresos" fill="#22c55e" name="Ingresos" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="gastos" fill="#ef4444" name="Gastos" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pendiente de cobro */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Pendiente de cobro
                </CardTitle>
                <CardDescription>
                  {data.overdueFees > 0
                    ? `${data.overdueFees} cuota(s) vencida(s) por un total de $${data.overdueAmount.toLocaleString()}`
                    : "No hay cuotas vencidas"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {data.overdueList.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground text-xs">
                          <th className="text-left px-4 py-2 font-medium">Paciente</th>
                          <th className="text-left px-4 py-2 font-medium">Monto</th>
                          <th className="text-left px-4 py-2 font-medium">Vencimiento</th>
                          <th className="text-left px-4 py-2 font-medium">Días vencido</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.overdueList.map((fee) => (
                          <tr key={fee.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="px-4 py-2 font-medium">{fee.patient_name}</td>
                            <td className="px-4 py-2">${fee.amount.toLocaleString()}</td>
                            <td className="px-4 py-2 text-xs">{format(new Date(fee.next_due_date), "PP", { locale: es })}</td>
                            <td className="px-4 py-2">
                              <Badge variant={fee.days_overdue > 30 ? "destructive" : "secondary"} className={fee.days_overdue <= 30 ? "bg-amber-500/10 text-amber-700" : ""}>
                                {fee.days_overdue} días
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No hay cuotas vencidas</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Balance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-5 h-5" /> Balance financiero
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Ingresos totales</p>
                    <p className="text-2xl font-bold text-green-700">${data.income.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Gastos totales</p>
                    <p className="text-2xl font-bold text-red-700">${data.expenses.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Margen</p>
                    <p className={`text-2xl font-bold ${data.income - data.expenses >= 0 ? "text-green-700" : "text-red-700"}`}>
                      ${(data.income - data.expenses).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Cuotas por cobrar</p>
                    <p className="text-2xl font-bold">{data.overdueAmount > 0 ? `$${data.overdueAmount.toLocaleString()}` : "$0"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gastos recientes */}
            {data.recentExpenses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Movimientos recientes</CardTitle>
                  <CardDescription>Últimos 5 registros</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground text-xs">
                          <th className="text-left px-4 py-2 font-medium">Descripción</th>
                          <th className="text-left px-4 py-2 font-medium">Tipo</th>
                          <th className="text-left px-4 py-2 font-medium">Fecha</th>
                          <th className="text-right px-4 py-2 font-medium">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentExpenses.map((e: any) => (
                          <tr key={e.id} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="px-4 py-2 font-medium truncate max-w-[250px]">{e.description}</td>
                            <td className="px-4 py-2">
                              <Badge variant="outline" className={e.entry_type === "gasto" ? "bg-red-500/10 text-red-700" : "bg-green-500/10 text-green-700"}>
                                {e.entry_type}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-xs">
                              {e.expense_date ? format(localDate(e.expense_date), "PP", { locale: es }) : "—"}
                            </td>
                            <td className="px-4 py-2 text-right font-mono">${Number(e.amount).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Dialog resumen de pacientes */}
      <Dialog open={patientDialogOpen} onOpenChange={setPatientDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" /> Resumen por paciente — {pr.label}
            </DialogTitle>
          </DialogHeader>
          {patientSummaryLoading ? (
            <div className="py-12 text-center text-muted-foreground">Cargando...</div>
          ) : data.patientSummary.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs">
                    <th className="text-left px-3 py-2 font-medium">Paciente</th>
                    <th className="text-right px-3 py-2 font-medium">Ingresos</th>
                    <th className="text-right px-3 py-2 font-medium">Gastos</th>
                    <th className="text-right px-3 py-2 font-medium">Abonos</th>
                    <th className="text-right px-3 py-2 font-medium">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {data.patientSummary.map((p) => (
                    <tr key={p.patient_id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-3 py-2 font-medium">{p.patient_name}</td>
                      <td className="px-3 py-2 text-right text-green-700">${p.ingresos.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-red-700">${p.egresos.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-blue-700">${p.abonos.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">
                        <Badge variant={p.saldo >= 0 ? "secondary" : "destructive"} className={p.saldo >= 0 ? "bg-green-500/10 text-green-700" : ""}>
                          ${p.saldo.toLocaleString()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-bold text-xs">
                    <td className="px-3 py-2">Total</td>
                    <td className="px-3 py-2 text-right text-green-700">${data.patientSummary.reduce((s, p) => s + p.ingresos, 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-red-700">${data.patientSummary.reduce((s, p) => s + p.egresos, 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-blue-700">${data.patientSummary.reduce((s, p) => s + p.abonos, 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">${data.patientSummary.reduce((s, p) => s + p.saldo, 0).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No hay datos de pacientes para este período</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog detalle de categoría */}
      <Dialog open={categoryDetailOpen} onOpenChange={setCategoryDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" /> {selectedCategory?.name || "Categoría"} — {pr.label}
            </DialogTitle>
          </DialogHeader>
          {selectedCategory && selectedCategory.entries.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm text-muted-foreground">Total: </span>
                  <span className="font-bold text-red-700">${selectedCategory.value.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground ml-4">({selectedCategory.entries.length} movimiento(s))</span>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant={categorySort === "date_desc" || categorySort === "date_asc" ? "default" : "outline"} className="h-7 text-xs" onClick={() => setCategorySort(categorySort === "date_desc" ? "date_asc" : "date_desc")}>
                    <CalendarDays className="w-3 h-3 mr-1" /> Fecha {categorySort === "date_desc" ? "↓" : categorySort === "date_asc" ? "↑" : ""}
                  </Button>
                  <Button size="sm" variant={categorySort === "amount_desc" || categorySort === "amount_asc" ? "default" : "outline"} className="h-7 text-xs" onClick={() => setCategorySort(categorySort === "amount_desc" ? "amount_asc" : "amount_desc")}>
                    <DollarSign className="w-3 h-3 mr-1" /> Monto {categorySort === "amount_desc" ? "↓" : categorySort === "amount_asc" ? "↑" : ""}
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs">
                      <th className="text-left px-3 py-2 font-medium">Descripción</th>
                      <th className="text-left px-3 py-2 font-medium">Fecha</th>
                      <th className="text-right px-3 py-2 font-medium">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...selectedCategory.entries].sort((a, b) => {
                      if (categorySort === "date_desc") return new Date(b.expense_date || 0).getTime() - new Date(a.expense_date || 0).getTime();
                      if (categorySort === "date_asc") return new Date(a.expense_date || 0).getTime() - new Date(b.expense_date || 0).getTime();
                      if (categorySort === "amount_desc") return Number(b.amount || 0) - Number(a.amount || 0);
                      return Number(a.amount || 0) - Number(b.amount || 0);
                    }).map((e, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-3 py-2 font-medium">{e.description}</td>
                        <td className="px-3 py-2 text-xs">
                          {e.expense_date ? format(localDate(e.expense_date), "PP", { locale: es }) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-red-700">${Number(e.amount).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Wallet className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>Sin movimientos en esta categoría</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog detalle ingresos por paciente */}
      <Dialog open={incomePatientOpen} onOpenChange={setIncomePatientOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> {selectedIncomePatient?.name || "Paciente"} — {pr.label}
            </DialogTitle>
          </DialogHeader>
          {selectedIncomePatient && selectedIncomePatient.entries.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm text-muted-foreground">Total: </span>
                  <span className="font-bold text-green-700">${selectedIncomePatient.value.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground ml-4">({selectedIncomePatient.entries.length} movimiento(s))</span>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant={incomePatientSort === "date_desc" || incomePatientSort === "date_asc" ? "default" : "outline"} className="h-7 text-xs" onClick={() => setIncomePatientSort(incomePatientSort === "date_desc" ? "date_asc" : "date_desc")}>
                    <CalendarDays className="w-3 h-3 mr-1" /> Fecha {incomePatientSort === "date_desc" ? "↓" : incomePatientSort === "date_asc" ? "↑" : ""}
                  </Button>
                  <Button size="sm" variant={incomePatientSort === "amount_desc" || incomePatientSort === "amount_asc" ? "default" : "outline"} className="h-7 text-xs" onClick={() => setIncomePatientSort(incomePatientSort === "amount_desc" ? "amount_asc" : "amount_desc")}>
                    <DollarSign className="w-3 h-3 mr-1" /> Monto {incomePatientSort === "amount_desc" ? "↓" : incomePatientSort === "amount_asc" ? "↑" : ""}
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs">
                      <th className="text-left px-3 py-2 font-medium">Descripción</th>
                      <th className="text-left px-3 py-2 font-medium">Categoría</th>
                      <th className="text-left px-3 py-2 font-medium">Fecha</th>
                      <th className="text-right px-3 py-2 font-medium">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...selectedIncomePatient.entries].sort((a, b) => {
                      if (incomePatientSort === "date_desc") return new Date(b.expense_date || 0).getTime() - new Date(a.expense_date || 0).getTime();
                      if (incomePatientSort === "date_asc") return new Date(a.expense_date || 0).getTime() - new Date(b.expense_date || 0).getTime();
                      if (incomePatientSort === "amount_desc") return Number(b.amount || 0) - Number(a.amount || 0);
                      return Number(a.amount || 0) - Number(b.amount || 0);
                    }).map((e, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-3 py-2 font-medium">{e.description || "—"}</td>
                        <td className="px-3 py-2 text-xs">{e.category || "—"}</td>
                        <td className="px-3 py-2 text-xs">
                          {e.expense_date ? format(localDate(e.expense_date), "PP", { locale: es }) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-green-700">${Number(e.amount).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>Sin ingresos para este paciente</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog plantilla laboral */}
      <Dialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" /> Plantilla laboral — {unit?.name}
            </DialogTitle>
          </DialogHeader>
          {data.staffList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs">
                    {[
                      { key: "full_name", label: "Nombre", align: "left" },
                      { key: "position", label: "Puesto", align: "left" },
                      { key: "area", label: "Área", align: "left" },
                      { key: "frequency", label: "Frecuencia", align: "left" },
                      { key: "base_salary", label: "Salario", align: "right" },
                    ].map(col => (
                      <th
                        key={col.key}
                        className={`px-3 py-2 font-medium cursor-pointer hover:text-foreground transition-colors select-none ${col.align === "right" ? "text-right" : "text-left"}`}
                        onClick={() => setStaffSort(staffSort.key === col.key ? { key: col.key, dir: staffSort.dir === "asc" ? "desc" : "asc" } : { key: col.key, dir: "asc" })}
                      >
                        {col.label} {staffSort.key === col.key ? (staffSort.dir === "asc" ? "↑" : "↓") : ""}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...data.staffList].sort((a: any, b: any) => {
                    const av = a[staffSort.key] ?? "";
                    const bv = b[staffSort.key] ?? "";
                    if (staffSort.key === "base_salary") return staffSort.dir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
                    return staffSort.dir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
                  }).map((emp: any) => (
                    <tr key={emp.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-3 py-2 font-medium">{emp.full_name}</td>
                      <td className="px-3 py-2 text-xs">{emp.position || "—"}</td>
                      <td className="px-3 py-2 text-xs capitalize">{emp.area}</td>
                      <td className="px-3 py-2 text-xs capitalize">{emp.frequency}</td>
                      <td className="px-3 py-2 text-right font-mono">${Number(emp.base_salary).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No hay empleados asignados a esta unidad</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
