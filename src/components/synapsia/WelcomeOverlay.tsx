import { useEffect, useState } from "react";
import synapsiaIcon from "@/assets/synapsia-icon.svg";

export default function WelcomeOverlay({ name, onDone }: { name: string; onDone: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2200);
    const t2 = setTimeout(onDone, 2700);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[hsl(220,40%,13%)] via-[hsl(220,30%,18%)] to-[hsl(220,25%,22%)] transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
    >
      <img
        src={synapsiaIcon}
        alt="Synapsia"
        className="w-28 h-28 mb-6 animate-[scale-in_0.6s_ease-out] drop-shadow-2xl"
      />
      <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight animate-[fade-in_0.8s_ease-out_0.3s_both]">
        Bienvenido(a)
      </h1>
      <p className="text-2xl md:text-3xl text-primary-foreground/90 mt-3 font-light animate-[fade-in_0.8s_ease-out_0.7s_both]">
        {name}
      </p>
      <div className="mt-8 h-0.5 w-48 bg-white/20 overflow-hidden rounded-full">
        <div className="h-full bg-white/80 animate-[slide-in-right_2s_ease-out]" />
      </div>
    </div>
  );
}
