import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck } from "lucide-react";

interface PinPromptProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  description?: string;
  onConfirm: () => Promise<void> | void;
}

/** Modal that asks for the current user's security PIN before running a sensitive action. */
export default function PinPrompt({ open, onOpenChange, title = "Confirmar acción", description = "Ingresa tu PIN de seguridad para continuar.", onConfirm }: PinPromptProps) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.rpc("verify_pin", { _pin: pin });
    if (error || !data) {
      toast({ variant: "destructive", title: "PIN incorrecto", description: "Verifica tu PIN o configúralo en tu perfil." });
      setLoading(false);
      return;
    }
    try {
      await onConfirm();
      onOpenChange(false);
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) { onOpenChange(v); if (!v) setPin(""); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handle} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="text-center text-xl tracking-[0.5em]"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading || pin.length < 4}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
