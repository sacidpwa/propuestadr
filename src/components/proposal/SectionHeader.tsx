interface SectionHeaderProps {
  number: string;
  title: string;
  subtitle?: string;
  light?: boolean;
}

const SectionHeader = ({ number, title, subtitle, light }: SectionHeaderProps) => {
  return (
    <div className="mb-12 md:mb-16">
      <span className={`font-sans text-xs tracking-[0.3em] uppercase font-medium ${light ? 'text-gold' : 'text-gold'}`}>
        {number}
      </span>
      <h2 className={`text-3xl md:text-5xl font-serif font-bold mt-3 mb-4 ${light ? 'text-white' : 'text-foreground'}`}>
        {title}
      </h2>
      <div className="divider-gold !mx-0 mb-4" />
      {subtitle && (
        <p className={`font-sans text-lg font-light max-w-2xl ${light ? 'text-white/60' : 'text-muted-foreground'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionHeader;
