import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Mail, CheckCheck, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface UnreadMessage {
  id: string;
  sender_id: string;
  subject: string | null;
  body: string;
  created_at: string;
  sender_name?: string;
}

export default function UnreadMessagesPrompt() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<UnreadMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("admin_messages" as any)
      .select("id, sender_id, subject, body, created_at")
      .eq("receiver_id", user.id)
      .eq("is_read", false)
      .order("created_at", { ascending: true });

    if (!data || !data.length) return;

    const senderIds = [...new Set((data as any[]).map((m) => m.sender_id))];
    const { data: profiles } = await supabase
      .from("profiles" as any)
      .select("id, full_name")
      .in("id", senderIds);

    const nameMap = new Map<string, string>();
    ((profiles as any[]) || []).forEach((p) => nameMap.set(p.id, p.full_name || "Usuario"));

    const enriched = (data as any[]).map((m) => ({
      ...m,
      sender_name: nameMap.get(m.sender_id) || "Usuario",
    }));

    setMessages(enriched);
    setCurrentIndex(0);
    setOpen(true);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(fetchUnread, 1500);
    return () => clearTimeout(timer);
  }, [fetchUnread]);

  const markAsRead = async (msgId: string) => {
    await supabase.from("admin_messages" as any).update({ is_read: true }).eq("id", msgId);
    const remaining = messages.filter((m) => m.id !== msgId);
    setMessages(remaining);
    if (currentIndex >= remaining.length && remaining.length > 0) {
      setCurrentIndex(remaining.length - 1);
    }
  };

  const markAllAsRead = async () => {
    const ids = messages.map((m) => m.id);
    if (ids.length) {
      await supabase.from("admin_messages" as any).update({ is_read: true }).in("id", ids);
    }
    setMessages([]);
    setOpen(false);
  };

  const dismiss = () => {
    setOpen(false);
  };

  const current = messages[currentIndex];

  if (!messages.length) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Tienes {messages.length} mensaje{messages.length > 1 ? "s" : ""} nuevo{messages.length > 1 ? "s" : ""}
          </DialogTitle>
        </DialogHeader>

        {current && (
          <div className="space-y-3">
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">De: {current.sender_name}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(current.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                </span>
              </div>
              {current.subject && (
                <p className="text-sm font-semibold mb-1">{current.subject}</p>
              )}
              <p className="text-sm whitespace-pre-wrap">{current.body}</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {currentIndex + 1} de {messages.length}
                </span>
                {messages.length > 1 && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={currentIndex === 0}
                      onClick={() => setCurrentIndex((i) => i - 1)}
                    >
                      Anterior
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={currentIndex >= messages.length - 1}
                      onClick={() => setCurrentIndex((i) => i + 1)}
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { markAsRead(current.id); }}>
                  <CheckCheck className="w-3 h-3 mr-1" />Leído
                </Button>
                <Button size="sm" className="h-7 text-xs" onClick={dismiss}>
                  <X className="w-3 h-3 mr-1" />Cerrar
                </Button>
              </div>
            </div>

            {messages.length > 1 && (
              <Button size="sm" variant="ghost" className="w-full text-xs" onClick={markAllAsRead}>
                Marcar todo como leído
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
