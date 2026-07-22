import SectionHeader from "./SectionHeader";
import { Building2, Brain, HeartPulse, Home } from "lucide-react";

const units = [
  {
    icon: Brain,
    name: "Synapsia",
    type: "Consultorios Especializados",
    description:
      "Centro de diagnóstico y consulta psiquiátrica con 7 consultorios: 3 rentados a psicólogos (infantil, grupal/general, psicoanálisis), atención psiquiátrica directa y estudios de resonancia/tomografía.",
    details: [
      "7 consultorios operativos",
      "3 en renta a psicólogos externos",
      "Estudios de resonancia y tomografía",
      "Canal de referencia a Clínica Alcatraces",
    ],
    status: "Operativa",
  },
  {
    icon: Building2,
    name: "Clínica Alcatraces",
    type: "Clínica Psiquiátrica",
    description:
      "Internamiento para pacientes con desórdenes psiquiátricos crónicos y atención de pacientes agudos (temporales). Recibe canalizaciones directas de Synapsia.",
    details: [
      "Pacientes crónicos (largo plazo)",
      "Pacientes agudos (temporales)",
      "Canalización desde Synapsia",
      "Atención 24/7",
    ],
    status: "Operativa",
  },
  {
    icon: HeartPulse,
    name: "Benesse",
    type: "Clínica de Adicciones",
    description:
      "Clínica voluntaria con capacidad para 13 residentes en Cacalomacán, Toluca. Un año de operación. Próxima incorporación de tratamiento para desórdenes alimenticios.",
    details: [
      "Capacidad: 13 residentes",
      "Clínica voluntaria",
      "1 año de operación",
      "4 socios (requiere estrategia de retiro)",
      "Expansión: desórdenes alimenticios",
    ],
    status: "En reestructura",
  },
  {
    icon: Home,
    name: "Alcatraces Senior Living",
    type: "Casa de Descanso",
    description:
      "Residencia para adultos mayores con actividades supervisadas. Inicio de operaciones enero 2026 con capacidad para 13 residentes.",
    details: [
      "Capacidad: 13 residentes",
      "Actividades cuidadas",
      "Inicio: Enero 2026",
      "Nueva unidad de negocio",
    ],
    status: "Nueva apertura",
  },
];

const BusinessUnitsSection = () => {
  return (
    <section id="ecosistema" className="section-padding bg-background">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          number="01 — Diagnóstico"
          title="Ecosistema Actual"
          subtitle="Cuatro unidades de negocio interconectadas bajo un modelo de gestión centralizado en la figura del Dr. Márquez."
        />

        <div className="grid md:grid-cols-2 gap-6">
          {units.map((unit, i) => (
            <div
              key={unit.name}
              className="group bg-card border border-border rounded-lg p-8 hover:border-gold/30 transition-all duration-500 hover:shadow-lg hover:shadow-gold/5"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-navy flex items-center justify-center">
                    <unit.icon className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold text-foreground">{unit.name}</h3>
                    <p className="text-sm text-muted-foreground font-sans">{unit.type}</p>
                  </div>
                </div>
                <span className={`text-xs font-sans font-medium px-3 py-1 rounded-full ${
                  unit.status === "Operativa"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : unit.status === "En reestructura"
                    ? "bg-amber-500/10 text-amber-600"
                    : "bg-blue-500/10 text-blue-600"
                }`}>
                  {unit.status}
                </span>
              </div>

              <p className="text-muted-foreground font-sans text-sm leading-relaxed mb-6">
                {unit.description}
              </p>

              <ul className="space-y-2">
                {unit.details.map((detail) => (
                  <li key={detail} className="flex items-center gap-2 text-sm font-sans text-foreground/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold/60" />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Flow diagram */}
        <div className="mt-16 bg-navy rounded-lg p-8 md:p-12">
          <h3 className="text-xl font-serif text-white font-bold mb-8 text-center">
            Flujo de Pacientes entre Unidades
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2">
            {["Synapsia", "Clínica Alcatraces", "Benesse", "Senior Living"].map((name, i) => (
              <div key={name} className="flex items-center gap-2">
                <div className="bg-navy-light border border-gold/20 rounded-lg px-6 py-4 text-center min-w-[160px]">
                  <p className="text-gold font-sans text-xs uppercase tracking-wider mb-1">Unidad {i + 1}</p>
                  <p className="text-white font-serif font-semibold text-sm">{name}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block text-gold/40 text-2xl">→</div>
                )}
              </div>
            ))}
          </div>
          <p className="text-white/40 text-center font-sans text-xs mt-6 tracking-wider uppercase">
            Canalización y referencia de pacientes entre unidades
          </p>
        </div>
      </div>
    </section>
  );
};

export default BusinessUnitsSection;
