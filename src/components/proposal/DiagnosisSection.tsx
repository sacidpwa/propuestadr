import SectionHeader from "./SectionHeader";
import { AlertTriangle, Users, BarChart3, Cog } from "lucide-react";

const problems = [
  {
    icon: Users,
    title: "Centralización Excesiva",
    description:
      "Toda la toma de decisiones recae en el Dr. Márquez. Atiende personalmente las 4 unidades, creando un cuello de botella operativo y un riesgo de continuidad.",
    impact: "Alto",
  },
  {
    icon: BarChart3,
    title: "Ausencia de KPIs y Controles",
    description:
      "No existen indicadores clave de rendimiento ni tableros de control digitales. La información financiera y operativa se maneja de forma fragmentada.",
    impact: "Alto",
  },
  {
    icon: Cog,
    title: "Procesos Manuales",
    description:
      "Recepción, cobro, diagnóstico y administración se realizan sin sistemas digitales integrados, generando ineficiencia y pérdida de información.",
    impact: "Medio-Alto",
  },
  {
    icon: AlertTriangle,
    title: "Estructura Societaria Compleja (Benesse)",
    description:
      "Benesse opera con 4 socios. Se requiere una estrategia legal y financiera para el retiro progresivo de socios sin afectar la operación.",
    impact: "Alto",
  },
];

const DiagnosisSection = () => {
  return (
    <section id="diagnostico" className="section-padding bg-navy">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          number="02 — Hallazgos"
          title="Diagnóstico Inicial"
          subtitle="Áreas críticas identificadas que limitan el crecimiento y la sustentabilidad del ecosistema."
          light
        />

        <div className="grid md:grid-cols-2 gap-6">
          {problems.map((p) => (
            <div
              key={p.title}
              className="bg-navy-light border border-white/5 rounded-lg p-8 hover:border-gold/20 transition-all duration-500"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                  <p.icon className="w-5 h-5 text-gold" />
                </div>
                <span className="text-xs font-sans font-medium text-red-400 bg-red-400/10 px-3 py-1 rounded-full">
                  Impacto: {p.impact}
                </span>
              </div>
              <h3 className="text-lg font-serif font-bold text-white mb-3">{p.title}</h3>
              <p className="text-white/50 font-sans text-sm leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DiagnosisSection;
