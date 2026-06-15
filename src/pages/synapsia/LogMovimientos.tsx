import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, LogOut, Search, Filter } from "lucide-react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Movement {
  id: string; inventory_id: string; health_unit_id: string;
  movement_type: string; quantity: number;
  reference_type: string | null; reference_id: string | null;
  notes: string | null; created_by: string; created_at: string;
  medication_inventory: { medication_name: string } | null;
  health_units: { name: string } | null;
}

export default function LogMovimientos() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("todas");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = (supabase.from as any)("inventory_movements")
        .select("*, medication_inventory(medication_name), health_units(name)")
        .order("created_at", { ascending: false });
      if (typeFilter !== "todas") q = q.eq("movement_type", typeFilter);
      const { data } = await q;
      setMovements((data as any) || []);
      setLoading(false);
    })();
  }, [typeFilter]);

  const filtered = search
    ? movements.filter(m =>
        (m.medication_inventory?.medication_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (m.notes || "").toLowerCase().includes(search.toLowerCase()) ||
        (m.health_units?.name || "").toLowerCase().includes(search.toLowerCase())
      )
    : movements;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/synapsia/admin")}><ArrowLeft className="w-4 h-4" /></Button>
            <img src={synapsiaIcon} alt="" className="w-9 h-9" />
            <div>
              <h1 className="text-lg font-bold">Log de movimientos de inventario</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[["todas","Todas"],["entry","Entradas"],["exit","Salidas"],["adjustment","Ajustes"]].map(([v,l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar medicamento, unidad..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <p className="text-sm text-muted-foreground">{filtered.length} movimiento(s)</p>
        </div>

        {loading ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">Cargando...</CardContent></Card>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">Sin movimientos registrados.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {filtered.map(m => (
              <Card key={m.id}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={
                          m.movement_type === "entry" ? "bg-green-500/10 text-green-700 border-green-500/30" :
                          m.movement_type === "exit" ? "bg-red-500/10 text-red-700 border-red-500/30" :
                          "bg-amber-500/10 text-amber-700 border-amber-500/30"
                        }>
                          {m.movement_type === "entry" ? "Entrada" : m.movement_type === "exit" ? "Salida" : "Ajuste"}
                        </Badge>
                        <span className="font-medium text-sm truncate">{m.medication_inventory?.medication_name || "—"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>Unidad: {m.health_units?.name || "—"}</span>
                        {m.reference_type && <span>Ref: {m.reference_type}</span>}
                        {m.notes && <span className="truncate">{m.notes}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-bold text-base ${m.movement_type === "entry" ? "text-green-600" : m.movement_type === "exit" ? "text-red-600" : "text-amber-600"}`}>
                        {m.movement_type === "entry" ? "+" : "-"}{m.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground">{format(new Date(m.created_at), "PPp", { locale: es })}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
