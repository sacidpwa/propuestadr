import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { exchangeCodeForTokens } from "@/lib/googleCalendar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Procesando autorización...");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      const state = searchParams.get("state");

      if (error) {
        setStatus("error");
        setMessage(`Error: ${error}`);
        toast({ variant: "destructive", title: "Error de autorización", description: error });
        return;
      }

      if (!code) {
        setStatus("error");
        setMessage("No se recibió código de autorización");
        return;
      }

      try {
        const tokens = await exchangeCodeForTokens(code);
        if (!tokens) throw new Error("No se pudieron obtener tokens");

        // state contains the specialist_id
        const specialistId = state;
        if (!specialistId) throw new Error("Estado inválido");

        // Save tokens to specialist record via RPC (bypasses RLS)
        const { error } = await supabase.rpc("save_google_tokens", {
          p_specialist_id: specialistId,
          p_access_token: tokens.access_token,
          p_refresh_token: tokens.refresh_token,
          p_expiry: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
        });

        if (error) throw error;

        setStatus("success");
        setMessage("¡Google Calendar conectado correctamente!");
        toast({ title: "Éxito", description: "Calendar sincronizado" });
      } catch (err: any) {
        console.error(err);
        setStatus("error");
        setMessage(`Error: ${err.message}`);
        toast({ variant: "destructive", title: "Error", description: err.message });
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-4 p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">{message}</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">¡Conectado!</h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            <button
              onClick={() => navigate("/synapsia/calendar")}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Volver a la Agenda
            </button>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-500 mb-2">Error</h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            <button
              onClick={() => navigate("/synapsia/calendar")}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Volver a la Agenda
            </button>
          </>
        )}
      </div>
    </div>
  );
}