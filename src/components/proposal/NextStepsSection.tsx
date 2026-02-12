import SectionHeader from "./SectionHeader";

const steps = [
  { number: "01", text: "Revisión y aprobación de esta propuesta" },
  { number: "02", text: "Firma de contrato de consultoría y NDA" },
  { number: "03", text: "Anticipo del 30% para inicio de Fase 1" },
  { number: "04", text: "Reunión de arranque con el Dr. Márquez y equipo clave" },
  { number: "05", text: "Inicio del diagnóstico integral en las 4 unidades" },
];

const NextStepsSection = () => {
  return (
    <section className="section-padding bg-background">
      <div className="max-w-4xl mx-auto">
        <SectionHeader
          number="05 — Siguientes Pasos"
          title="Para Comenzar"
          subtitle="Acciones inmediatas para poner en marcha este plan de transformación."
        />

        <div className="space-y-4">
          {steps.map((s) => (
            <div
              key={s.number}
              className="flex items-center gap-6 bg-card border border-border rounded-lg p-6 hover:border-gold/30 transition-all duration-500"
            >
              <span className="text-3xl font-serif font-bold text-gold/30">{s.number}</span>
              <p className="font-sans text-foreground/80">{s.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="divider-gold mb-8" />
          <p className="text-muted-foreground font-sans text-sm tracking-wider uppercase mb-4">
            Documento Confidencial
          </p>
          <p className="text-2xl font-serif font-bold text-foreground mb-2">
            ¿Listo para transformar su práctica?
          </p>
          <p className="text-muted-foreground font-sans mb-8">
            Contacto para agendar reunión de presentación
          </p>
          <div className="divider-gold" />
          <p className="text-muted-foreground/50 font-sans text-xs mt-8">
            © 2026 — Propuesta elaborada con carácter confidencial
          </p>
        </div>
      </div>
    </section>
  );
};

export default NextStepsSection;
