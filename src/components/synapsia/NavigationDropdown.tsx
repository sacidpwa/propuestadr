import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navigation } from "lucide-react";

const NAV_LINKS = [
  { label: "Planta en vivo", path: "/synapsia/floor" },
  { label: "Unidades de salud", path: "/synapsia/unidades" },
  { label: "Dashboard ejecutivo", path: "/synapsia/dashboard" },
  { label: "Centro de autorizaciones", path: "/synapsia/autorizaciones" },
  { label: "Plantilla laboral", path: "/synapsia/plantilla" },
  { label: "Panel de administración", path: "/synapsia/admin-panel" },
  { label: "Usuarios", path: "/synapsia/users" },
  { label: "Admin home", path: "/synapsia/admin" },
];

export default function NavigationDropdown() {
  const navigate = useNavigate();

  return (
    <Select onValueChange={(v) => navigate(v)}>
      <SelectTrigger className="w-[180px] h-9 text-xs">
        <Navigation className="w-3 h-3 mr-2" />
        <SelectValue placeholder="Navegar a..." />
      </SelectTrigger>
      <SelectContent>
        {NAV_LINKS.map((l) => (
          <SelectItem key={l.path} value={l.path}>{l.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
