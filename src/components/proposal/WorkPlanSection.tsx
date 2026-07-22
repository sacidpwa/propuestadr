import SectionHeader from "./SectionHeader";
import { CheckCircle2 } from "lucide-react";

const phases = [
  {
    phase: "Fase 1",
    title: "Diagnóstico & Arquitectura",
    duration: "Mes 1-2",
    items: [
      "Levantamiento detallado de procesos actuales en cada unidad",
      "Mapeo de flujos financieros y estructura de costos",
      "Auditoría de la estructura societaria de Benesse",
      "Definición de KPIs por unidad de negocio",
      "Arquitectura del sistema de gobierno corporativo",
    ],
  },
  {
    phase: "Fase 2",
    title: "Digitalización Operativa",
    duration: "Mes 2-4",
    items: [
      "Implementación de sistema de recepción digital (citas, expedientes)",
      "Plataforma de cobro y facturación integrada",
      "Digitalización de diagnósticos y seguimiento clínico",
      "Dashboard de control centralizado con KPIs en tiempo real",
      "Integración entre las 4 unidades de negocio",
    ],
  },
  {
    phase: "Fase 3",
    title: "Gobierno & Reestructura",
    duration: "Mes 3-5",
    items: [
      "Estrategia legal de retiro de socios de Benesse",
      "Creación de organigrama funcional con delegación de roles",
      "Manual de operaciones por unidad",
      "Definición de perfiles y contratación de mandos medios",
      "Diseño de marca: logo y anuncio luminoso para Benesse",
    ],
  },
  {
    phase: "Fase 4",
    title: "Crecimiento & Sucesión",
    duration: "Mes 5-8",
    items: [
      "Estrategia de marketing digital y redes sociales",
      "Incorporación del programa de desórdenes alimenticios",
      "Plan de sucesión y retiro gradual del Dr. Márquez",
      "Capacitación a equipo directivo sucesor",
      "Modelo de supervisión remota para el Dr. Márquez",
    ],
  },
];

const WorkPlanSection = () => {
  return (
    <section id="plan" className="section-padding bg-background">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          number="03 — Plan de Trabajo"
          title="Hoja de Ruta Estratégica"
          subtitle="Metodología de implementación en 4 fases con entregables concretos y medibles."
        />

        <div className="space-y-6">
          {phases.map((p, i) => (
            <div
              key={p.phase}
              className="bg-card border border-border rounded-lg overflow-hidden hover:border-gold/30 transition-all duration-500"
            >
              <div className="flex flex-col md:flex-row">
                <div className="bg-navy p-6 md:p-8 md:w-64 flex flex-col justify-center shrink-0">
                  <span className="text-gold font-sans text-xs tracking-[0.2em] uppercase font-medium">
                    {p.phase}
                  </span>
                  <h3 className="text-white font-serif font-bold text-lg mt-1">{p.title}</h3>
                  <p className="text-white/40 font-sans text-sm mt-2">{p.duration}</p>
                </div>
                <div className="p-6 md:p-8 flex-1">
                  <ul className="space-y-3">
                    {p.items.map((item) => (
                      <li key={item} className="flex items-start gap-3 font-sans text-sm text-foreground/80">
                        <CheckCircle2 className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkPlanSection;
