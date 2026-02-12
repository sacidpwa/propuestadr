import heroBg from "@/assets/hero-bg.jpg";

const CoverSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-navy/80" />
      
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <div className="divider-gold mb-8" />
        <p className="text-gold font-sans text-sm tracking-[0.3em] uppercase mb-6 font-medium">
          Propuesta de Consultoría Estratégica
        </p>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white leading-tight mb-6">
          Plan de Reingeniería
          <br />
          <span className="text-gradient-gold">& Transformación Digital</span>
        </h1>
        <p className="text-white/60 font-sans text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light leading-relaxed">
          Consolidación operativa, gobierno corporativo y plan de sucesión para
          el ecosistema de salud mental del Dr. Rodrigo Márquez
        </p>
        <div className="divider-gold mb-10" />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-white/50 font-sans text-sm tracking-wider uppercase">
          <span>Preparado para: <strong className="text-gold font-medium">Dr. Rodrigo Márquez</strong></span>
          <span className="hidden sm:block">•</span>
          <span>Febrero 2026</span>
          <span className="hidden sm:block">•</span>
          <span>Confidencial</span>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-gold/40 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-gold/60 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default CoverSection;
