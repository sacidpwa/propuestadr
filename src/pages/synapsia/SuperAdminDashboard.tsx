import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, LogOut, Plus, Users, ListTodo, Target, MessageSquare, Check, Clock, AlertTriangle, Send, Eye, Trash2, Pencil } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { toast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface UserProfile {
  user_id: string;
  email: string;
  full_name: string;
  roles: string[];
  last_sign_in_at: string | null;
  user_created_at: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  assigned_by: string;
  health_unit_id: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  assignee_name?: string;
  creator_name?: string;
}

interface AccessLog {
  id: string;
  user_id: string;
  action: string;
  page: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_name?: string;
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  assigned_by: string;
  health_unit_id: string | null;
  goal_type: string;
  target_value: number | null;
  current_value: number | null;
  unit: string | null;
  period_start: string | null;
  period_end: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  assignee_name?: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string | null;
  body: string;
  is_read: boolean;
  parent_id: string | null;
  created_at: string;
  sender_name?: string;
  receiver_name?: string;
}

const PRIORITY_STYLE: Record<string, string> = {
  baja: "bg-gray-100 text-gray-700",
  media: "bg-blue-100 text-blue-700",
  alta: "bg-orange-100 text-orange-700",
  urgente: "bg-red-100 text-red-700",
};

const STATUS_STYLE: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-700",
  en_progreso: "bg-blue-100 text-blue-700",
  completada: "bg-green-100 text-green-700",
  cancelada: "bg-gray-100 text-gray-700",
  activa: "bg-blue-100 text-blue-700",
  vencida: "bg-red-100 text-red-700",
};

export default function SuperAdminDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"tasks" | "access" | "goals" | "messages">("tasks");

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [units, setUnits] = useState<{ id: string; name: string }[]>([]);

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatPartner, setChatPartner] = useState<UserProfile | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");

  const [taskForm, setTaskForm] = useState({ title: "", description: "", assigned_to: "", priority: "media", due_date: "", health_unit_id: "" });
  const [goalForm, setGoalForm] = useState({ title: "", description: "", assigned_to: "", goal_type: "numerico", target_value: "", unit: "", period_start: "", period_end: "", health_unit_id: "" });
  const [messageForm, setMessageForm] = useState({ receiver_id: "", subject: "", body: "" });

  const [search, setSearch] = useState("");
  const [logFilter, setLogFilter] = useState("all");

  const q = useCallback(async <T,>(p: Promise<{ data: T; error: any }>): Promise<T> => {
    const { data, error } = await p;
    if (error) throw error;
    return data;
  }, []);

  const load = useCallback(async () => {
    try {
      const [usersData, tasksData, logsData, goalsData, msgsData, unitsData] = await Promise.all([
        q(supabase.from("user_profiles_with_roles" as any).select("*") as any),
        q(supabase.from("admin_tasks" as any).select("*").order("created_at", { ascending: false }) as any),
        q(supabase.from("access_logs" as any).select("*").order("created_at", { ascending: false }).limit(500) as any),
        q(supabase.from("admin_goals" as any).select("*").order("created_at", { ascending: false }) as any),
        q(supabase.from("admin_messages" as any).select("*").order("created_at", { ascending: false }) as any),
        q(supabase.from("health_units" as any).select("id, name").eq("is_active", true) as any),
      ]);

      const userMap = new Map<string, string>();
      ((usersData as any[]) || []).forEach((u: any) => userMap.set(u.user_id, u.full_name || u.email));

      setUsers((usersData as any[]) || []);
      setTasks(((tasksData as any[]) || []).map((t: any) => ({ ...t, assignee_name: userMap.get(t.assigned_to) || "—" })));
      setAccessLogs(((logsData as any[]) || []).map((l: any) => ({ ...l, user_name: userMap.get(l.user_id) || l.user_id })));
      setGoals(((goalsData as any[]) || []).map((g: any) => ({ ...g, assignee_name: userMap.get(g.assigned_to) || "—" })));
      setMessages((msgsData as any[]) || []);
      setUnits((unitsData as any[]) || []);
    } catch (err: any) {
      toast({ title: "Error cargando datos", description: err.message, variant: "destructive" });
    }
  }, [q]);

  useEffect(() => { load(); }, [load]);

  // ---- TASKS ----
  const createTask = async () => {
    if (!taskForm.title || !taskForm.assigned_to) {
      toast({ title: "Faltan datos", description: "Título y destinatario son obligatorios", variant: "destructive" });
      return;
    }
    try {
      await q(supabase.from("admin_tasks" as any).insert({
        title: taskForm.title, description: taskForm.description || null,
        assigned_to: taskForm.assigned_to, assigned_by: user!.id,
        health_unit_id: taskForm.health_unit_id || null,
        priority: taskForm.priority, due_date: taskForm.due_date || null,
      }) as any);
      toast({ title: "Tarea creada" });
      setTaskDialogOpen(false);
      setTaskForm({ title: "", description: "", assigned_to: "", priority: "media", due_date: "", health_unit_id: "" });
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const patch: any = { status, updated_at: new Date().toISOString() };
      if (status === "completada") patch.completed_at = new Date().toISOString();
      await q(supabase.from("admin_tasks" as any).update(patch).eq("id", taskId) as any);
      toast({ title: "Tarea actualizada" });
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await q(supabase.from("admin_tasks" as any).delete().eq("id", taskId) as any);
      toast({ title: "Tarea eliminada" });
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // ---- GOALS ----
  const createGoal = async () => {
    if (!goalForm.title || !goalForm.assigned_to) {
      toast({ title: "Faltan datos", description: "Título y destinatario son obligatorios", variant: "destructive" });
      return;
    }
    try {
      await q(supabase.from("admin_goals" as any).insert({
        title: goalForm.title, description: goalForm.description || null,
        assigned_to: goalForm.assigned_to, assigned_by: user!.id,
        health_unit_id: goalForm.health_unit_id || null,
        goal_type: goalForm.goal_type,
        target_value: goalForm.target_value ? Number(goalForm.target_value) : null,
        unit: goalForm.unit || null,
        period_start: goalForm.period_start || null,
        period_end: goalForm.period_end || null,
      }) as any);
      toast({ title: "Meta creada" });
      setGoalDialogOpen(false);
      setGoalForm({ title: "", description: "", assigned_to: "", goal_type: "numerico", target_value: "", unit: "", period_start: "", period_end: "", health_unit_id: "" });
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const updateGoalProgress = async (goalId: string, currentValue: number) => {
    try {
      const goal = goals.find((g) => g.id === goalId);
      const patch: any = { current_value: currentValue, updated_at: new Date().toISOString() };
      if (goal?.target_value && currentValue >= goal.target_value) {
        patch.status = "completada";
        patch.completed_at = new Date().toISOString();
      }
      await q(supabase.from("admin_goals" as any).update(patch).eq("id", goalId) as any);
      toast({ title: "Meta actualizada" });
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // ---- MESSAGES ----
  const sendMessage = async () => {
    if (!messageForm.receiver_id || !messageForm.body) {
      toast({ title: "Faltan datos", description: "Destinatario y mensaje son obligatorios", variant: "destructive" });
      return;
    }
    try {
      await q(supabase.from("admin_messages" as any).insert({
        sender_id: user!.id, receiver_id: messageForm.receiver_id,
        subject: messageForm.subject || null, body: messageForm.body,
      }) as any);
      toast({ title: "Mensaje enviado" });
      setMessageDialogOpen(false);
      setMessageForm({ receiver_id: "", subject: "", body: "" });
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const openChat = async (partner: UserProfile) => {
    setChatPartner(partner);
    setChatOpen(true);
    const relevant = messages.filter(
      (m) => (m.sender_id === user!.id && m.receiver_id === partner.user_id) ||
             (m.sender_id === partner.user_id && m.receiver_id === user!.id)
    );
    setChatMessages(relevant.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));

    const unread = relevant.filter((m) => m.sender_id === partner.user_id && !m.is_read);
    if (unread.length) {
      await Promise.all(unread.map((m) =>
        q(supabase.from("admin_messages" as any).update({ is_read: true }).eq("id", m.id) as any)
      ));
      load();
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !chatPartner) return;
    try {
      await q(supabase.from("admin_messages" as any).insert({
        sender_id: user!.id, receiver_id: chatPartner.user_id, body: chatInput.trim(),
      }) as any);
      setChatInput("");
      openChat(chatPartner);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const filteredUsers = users.filter((u) => u.user_id !== user?.id && (!search || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())));

  const unreadByUser = useMemo(() => {
    const map: Record<string, number> = {};
    messages.forEach((m) => {
      if (m.receiver_id === user?.id && !m.is_read) {
        map[m.sender_id] = (map[m.sender_id] || 0) + 1;
      }
    });
    return map;
  }, [messages, user]);

  const filteredLogs = accessLogs.filter((l) => logFilter === "all" || l.user_id === logFilter);

  const accessChartData = useMemo(() => {
    const byDay: Record<string, number> = {};
    const byUser: Record<string, number> = {};
    const byPage: Record<string, number> = {};
    filteredLogs.forEach((l) => {
      const day = l.created_at.slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
      byUser[l.user_name || l.user_id] = (byUser[l.user_name || l.user_id] || 0) + 1;
      byPage[l.page || "Inicio"] = (byPage[l.page || "Inicio"] || 0) + 1;
    });
    const barData = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date: date.slice(5), accesos: count }));
    const pieUserData = Object.entries(byUser).sort(([, a], [, b]) => b - a).slice(0, 8).map(([name, value]) => ({ name, value }));
    const piePageData = Object.entries(byPage).sort(([, a], [, b]) => b - a).slice(0, 8).map(([name, value]) => ({ name, value }));
    return { barData, pieUserData, piePageData };
  }, [filteredLogs]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/synapsia")}><ArrowLeft className="w-4 h-4" /></Button>
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold">Panel de Administración</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="tasks"><ListTodo className="w-4 h-4 mr-2" />Tareas</TabsTrigger>
            <TabsTrigger value="access"><Eye className="w-4 h-4 mr-2" />Accesos</TabsTrigger>
            <TabsTrigger value="goals"><Target className="w-4 h-4 mr-2" />Metas</TabsTrigger>
            <TabsTrigger value="messages"><MessageSquare className="w-4 h-4 mr-2" />Mensajes {unreadByUser[chatPartner?.user_id || ""] ? <Badge className="ml-1">{unreadByUser[chatPartner?.user_id || ""]}</Badge> : ""}</TabsTrigger>
          </TabsList>

          {/* ===================== TAREAS ===================== */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Input placeholder="Buscar tarea..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
              <Button onClick={() => setTaskDialogOpen(true)}><Plus className="w-4 h-4 mr-1" />Nueva tarea</Button>
            </div>
            <div className="grid gap-3">
              {tasks.filter((t) => !search || t.title.toLowerCase().includes(search.toLowerCase()) || (t.assignee_name || "").toLowerCase().includes(search.toLowerCase())).map((t) => (
                <Card key={t.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm">{t.title}</h3>
                          <Badge variant="outline" className={PRIORITY_STYLE[t.priority]}>{t.priority}</Badge>
                          <Badge variant="outline" className={STATUS_STYLE[t.status]}>{t.status}</Badge>
                        </div>
                        {t.description && <p className="text-xs text-muted-foreground mb-1">{t.description}</p>}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Para: <strong>{t.assignee_name}</strong></span>
                          {t.due_date && <span className={new Date(t.due_date) < new Date() && t.status !== "completada" ? "text-red-600 font-medium" : ""}>
                            <Clock className="w-3 h-3 inline mr-1" />Vence: {t.due_date}
                          </span>}
                          <span>Creada: {format(new Date(t.created_at), "dd/MM/yyyy")}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {t.status !== "completada" && (
                          <>
                            {t.status === "pendiente" && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateTaskStatus(t.id, "en_progreso")}>En progreso</Button>
                            )}
                            {t.status === "en_progreso" && (
                              <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => updateTaskStatus(t.id, "completada")}><Check className="w-3 h-3 mr-1" />Completar</Button>
                            )}
                          </>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={() => deleteTask(t.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!tasks.length && <Card><CardContent className="py-12 text-center text-muted-foreground">Sin tareas creadas</CardContent></Card>}
            </div>
          </TabsContent>

          {/* ===================== ACCESOS ===================== */}
          <TabsContent value="access" className="space-y-4">
            <div className="flex items-center gap-3">
              <Select value={logFilter} onValueChange={setLogFilter}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar por usuario" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.user_id} value={u.user_id}>{u.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">{filteredLogs.length} registros</span>
            </div>

            {/* Gráficas de accesos */}
            {filteredLogs.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                  <CardHeader><CardTitle className="text-sm">Accesos por día</CardTitle></CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={accessChartData.barData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="accesos" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">Por usuario</CardTitle></CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={accessChartData.pieUserData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2} dataKey="value" nameKey="name">
                          {accessChartData.pieUserData.map((_, i) => (
                            <Cell key={i} fill={["#6366f1","#22c55e","#f97316","#ec4899","#06b6d4","#eab308","#8b5cf6","#ef4444"][i % 8]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Página</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.slice(0, 100).map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.user_name}</TableCell>
                        <TableCell>{l.action}</TableCell>
                        <TableCell className="text-muted-foreground">{l.page || "—"}</TableCell>
                        <TableCell className="text-xs">{formatDistanceToNow(new Date(l.created_at), { addSuffix: true, locale: es })}</TableCell>
                      </TableRow>
                    ))}
                    {!filteredLogs.length && (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Sin registros de acceso</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===================== METAS ===================== */}
          <TabsContent value="goals" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Input placeholder="Buscar meta..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
              <Button onClick={() => setGoalDialogOpen(true)}><Plus className="w-4 h-4 mr-1" />Nueva meta</Button>
            </div>
            <div className="grid gap-3">
              {goals.filter((g) => !search || g.title.toLowerCase().includes(search.toLowerCase()) || (g.assignee_name || "").toLowerCase().includes(search.toLowerCase())).map((g) => {
                const pct = g.target_value ? Math.min(100, ((Number(g.current_value) || 0) / Number(g.target_value)) * 100) : 0;
                return (
                  <Card key={g.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-sm">{g.title}</h3>
                            <Badge variant="outline" className={STATUS_STYLE[g.status]}>{g.status}</Badge>
                          </div>
                          {g.description && <p className="text-xs text-muted-foreground mb-1">{g.description}</p>}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                            <span>Para: <strong>{g.assignee_name}</strong></span>
                            {g.period_start && g.period_end && <span>{g.period_start} — {g.period_end}</span>}
                          </div>
                          {g.target_value != null && (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs font-mono">{Number(g.current_value || 0)}/{Number(g.target_value)} {g.unit || ""}</span>
                            </div>
                          )}
                        </div>
                        {g.target_value != null && g.status !== "completada" && (
                          <div className="flex items-center gap-1 shrink-0">
                            <Input
                              type="number"
                              className="h-7 w-20 text-xs"
                              value={g.current_value || 0}
                              onChange={(e) => updateGoalProgress(g.id, Number(e.target.value))}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {!goals.length && <Card><CardContent className="py-12 text-center text-muted-foreground">Sin metas creadas</CardContent></Card>}
            </div>
          </TabsContent>

          {/* ===================== MENSAJES ===================== */}
          <TabsContent value="messages" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Input placeholder="Buscar usuario..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
              <Button onClick={() => setMessageDialogOpen(true)}><Plus className="w-4 h-4 mr-1" />Nuevo mensaje</Button>
            </div>
            <div className="grid gap-2">
              {filteredUsers.map((u) => {
                const unread = unreadByUser[u.user_id] || 0;
                const lastMsg = messages
                  .filter((m) => (m.sender_id === user!.id && m.receiver_id === u.user_id) || (m.sender_id === u.user_id && m.receiver_id === user!.id))
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                return (
                  <Card key={u.user_id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => openChat(u)}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                        {u.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{u.full_name}</span>
                          <span className="text-xs text-muted-foreground">{u.email}</span>
                          {u.roles.includes("admin") && <Badge variant="outline" className="text-xs">Admin</Badge>}
                        </div>
                        {lastMsg && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {lastMsg.sender_id === user!.id ? "Tú: " : ""}{lastMsg.body}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {unread > 0 && <Badge className="bg-primary text-white">{unread}</Badge>}
                        {lastMsg && <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: true, locale: es })}</span>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {!filteredUsers.length && <Card><CardContent className="py-12 text-center text-muted-foreground">Sin usuarios</CardContent></Card>}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ===== DIALOG NUEVA TAREA ===== */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nueva tarea</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título *</Label><Input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} /></div>
            <div><Label>Descripción</Label><Textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} /></div>
            <div><Label>Asignar a *</Label>
              <Select value={taskForm.assigned_to} onValueChange={(v) => setTaskForm({ ...taskForm, assigned_to: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar usuario" /></SelectTrigger>
                <SelectContent>
                  {users.filter((u) => u.user_id !== user?.id).map((u) => (
                    <SelectItem key={u.user_id} value={u.user_id}>{u.full_name} ({u.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Prioridad</Label>
                <Select value={taskForm.priority} onValueChange={(v) => setTaskForm({ ...taskForm, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Fecha límite</Label><Input type="date" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} /></div>
            </div>
            <div><Label>Unidad (opcional)</Label>
              <Select value={taskForm.health_unit_id} onValueChange={(v) => setTaskForm({ ...taskForm, health_unit_id: v })}>
                <SelectTrigger><SelectValue placeholder="Sin unidad" /></SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>Cancelar</Button>
            <Button onClick={createTask}>Crear tarea</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DIALOG NUEVA META ===== */}
      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nueva meta</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título *</Label><Input value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} /></div>
            <div><Label>Descripción</Label><Textarea value={goalForm.description} onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })} /></div>
            <div><Label>Asignar a *</Label>
              <Select value={goalForm.assigned_to} onValueChange={(v) => setGoalForm({ ...goalForm, assigned_to: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar usuario" /></SelectTrigger>
                <SelectContent>
                  {users.filter((u) => u.user_id !== user?.id).map((u) => (
                    <SelectItem key={u.user_id} value={u.user_id}>{u.full_name} ({u.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Tipo</Label>
                <Select value={goalForm.goal_type} onValueChange={(v) => setGoalForm({ ...goalForm, goal_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="numerico">Numérico</SelectItem>
                    <SelectItem value="porcentaje">Porcentaje</SelectItem>
                    <SelectItem value="tarea">Por tarea</SelectItem>
                    <SelectItem value="booleano">Sí/No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Meta objetivo</Label><Input type="number" value={goalForm.target_value} onChange={(e) => setGoalForm({ ...goalForm, target_value: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label>Unidad</Label><Input value={goalForm.unit} onChange={(e) => setGoalForm({ ...goalForm, unit: e.target.value })} placeholder="ej: pacientes" /></div>
              <div><Label>Inicio</Label><Input type="date" value={goalForm.period_start} onChange={(e) => setGoalForm({ ...goalForm, period_start: e.target.value })} /></div>
              <div><Label>Fin</Label><Input type="date" value={goalForm.period_end} onChange={(e) => setGoalForm({ ...goalForm, period_end: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalDialogOpen(false)}>Cancelar</Button>
            <Button onClick={createGoal}>Crear meta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DIALOG NUEVO MENSAJE ===== */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nuevo mensaje</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Para *</Label>
              <Select value={messageForm.receiver_id} onValueChange={(v) => setMessageForm({ ...messageForm, receiver_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar usuario" /></SelectTrigger>
                <SelectContent>
                  {users.filter((u) => u.user_id !== user?.id).map((u) => (
                    <SelectItem key={u.user_id} value={u.user_id}>{u.full_name} ({u.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Asunto</Label><Input value={messageForm.subject} onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })} /></div>
            <div><Label>Mensaje *</Label><Textarea rows={4} value={messageForm.body} onChange={(e) => setMessageForm({ ...messageForm, body: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>Cancelar</Button>
            <Button onClick={sendMessage}><Send className="w-4 h-4 mr-1" />Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== CHAT DIALOG ===== */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                {chatPartner?.full_name.charAt(0).toUpperCase()}
              </div>
              {chatPartner?.full_name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-2 min-h-[300px] max-h-[50vh] p-2 border rounded-md">
            {chatMessages.map((m) => (
              <div key={m.id} className={`flex ${m.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${m.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {m.subject && <p className="font-medium text-xs mb-1">{m.subject}</p>}
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p className="text-[10px] opacity-70 mt-1">{format(new Date(m.created_at), "dd/MM HH:mm")}</p>
                </div>
              </div>
            ))}
            {!chatMessages.length && <p className="text-center text-muted-foreground text-sm py-8">Sin mensajes aún</p>}
          </div>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Escribe un mensaje..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
            />
            <Button onClick={sendChatMessage}><Send className="w-4 h-4" /></Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
