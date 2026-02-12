import SectionHeader from "./SectionHeader";

const deliverables = [
  {
    category: "Diagnóstico & Estrategia",
    items: [
      { name: "Diagnóstico integral de las 4 unidades", price: "$45,000" },
      { name: "Diseño de gobierno corporativo y organigrama", price: "$35,000" },
      { name: "Estrategia de retiro de socios (Benesse)", price: "$40,000" },
      { name: "Plan de sucesión del Dr. Márquez", price: "$30,000" },
    ],
  },
  {
    category: "Digitalización",
    items: [
      { name: "Sistema de recepción y expediente digital", price: "$60,000" },
      { name: "Plataforma de cobro y facturación", price: "$45,000" },
      { name: "Dashboard de KPIs centralizado", price: "$50,000" },
      { name: "Integración entre unidades de negocio", price: "$35,000" },
    ],
  },
  {
    category: "Marketing & Crecimiento",
    items: [
      { name: "Diseño de marca Benesse (logo, luminoso)", price: "$25,000" },
      { name: "Estrategia de redes sociales (4 unidades)", price: "$35,000" },
      { name: "Plan de incorporación desórdenes alimenticios", price: "$20,000" },
      { name: "Manuales de operación por unidad", price: "$30,000" },
    ],
  },
  {
    category: "Relaciones & Contenido",
    items: [
      { name: "Redes de colaboración con consultorios médicos", price: "$25,000" },
      { name: "Videopodcast y cápsulas informativas de salud mental", price: "$35,000" },
      { name: "Relaciones comerciales con institutos de prevención", price: "$30,000" },
    ],
  },
];

const PricingSection = () => {
  return (
    <section id="inversion" className="section-padding bg-navy">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          number="04 — Inversión"
          title="Propuesta Económica"
          subtitle="Desglose de entregables con inversión estimada por categoría. Precios en MXN + IVA."
          light
        />

        <div className="space-y-8">
          {deliverables.map((cat) => (
            <div key={cat.category}>
              <h3 className="text-lg font-serif font-bold text-gold mb-4">{cat.category}</h3>
              <div className="bg-navy-light border border-white/5 rounded-lg overflow-hidden">
                {cat.items.map((item, i) => (
                  <div
                    key={item.name}
                    className={`flex items-center justify-between px-6 py-4 ${
                      i !== cat.items.length - 1 ? "border-b border-white/5" : ""
                    }`}
                  >
                    <span className="text-white/70 font-sans text-sm">{item.name}</span>
                    <span className="text-gold font-sans font-semibold text-sm">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gold/10 border border-gold/20 rounded-lg p-8 flex flex-col md:flex-row items-center justify-between">
          <div>
            <p className="text-white/50 font-sans text-sm uppercase tracking-wider">Inversión Total Estimada</p>
            <p className="text-4xl font-serif font-bold text-gold mt-1">$540,000 MXN</p>
            <p className="text-white/40 font-sans text-xs mt-1">+ IVA | Sujeto a ajustes tras diagnóstico detallado</p>
          </div>
          <div className="mt-6 md:mt-0 text-right">
            <p className="text-white/50 font-sans text-sm">Duración estimada</p>
            <p className="text-2xl font-serif font-bold text-white">8 meses</p>
            <p className="text-white/40 font-sans text-xs mt-1">Pagos mensuales con base en avance</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
