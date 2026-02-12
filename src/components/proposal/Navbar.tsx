import { useState, useEffect } from "react";
import logoImage from "@/assets/logo-dranur.svg";

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
        scrolled
          ? "bg-navy/95 backdrop-blur-md shadow-lg shadow-black/20 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <img src={logoImage} alt="Dranur Logo" className="h-48 w-auto" />
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
      </div>
    </nav>
  );
};

export default Navbar;
