import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";

const links = [
  { label: "Inicio", href: "#inicio" },
  { label: "Ecosistema", href: "#ecosistema" },
  { label: "Diagnóstico", href: "#diagnostico" },
  { label: "Plan", href: "#plan" },
  { label: "Inversión", href: "#inversion" },
  { label: "Pasos", href: "#pasos" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-navy/95 backdrop-blur-md shadow-lg shadow-black/20 py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <div />
        <div className="flex items-center gap-6 md:gap-8">
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleClick(e, link.href)}
                className="font-sans text-xs tracking-[0.15em] uppercase text-white/60 hover:text-gold transition-colors duration-300"
              >
                {link.label}
              </a>
            ))}
          </div>
          <Link
            to="/synapsia/login"
            className="flex items-center gap-1.5 font-sans text-xs tracking-[0.15em] uppercase text-white/60 hover:text-gold transition-colors duration-300 border border-white/20 hover:border-gold/60 rounded-full px-3 py-1.5"
            aria-label="Acceso"
          >
            <LogIn className="w-3 h-3" />
            <span className="hidden sm:inline">Acceso</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
