import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, X, ChevronDown } from "lucide-react";
import { format } from "date-fns";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin", dueno: "Dueño", especialista: "Especialista", recepcion: "Recepción",
  administrativo: "Administrativo", promotor: "Promotor", enfermera: "Enfermería",
  intendencia: "Intendencia", mantenimiento: "Mantenimiento", asistente_admin: "Asistente Admin",
  contador: "Contador", rrhh: "RRHH", empleado: "Empleado",
};

interface Contact {
  user_id: string;
  full_name: string;
  email: string;
  roles: string[];
  last_message_at?: string;
  unread?: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export default function FloatingSACID() {
  const { user } = useAuth();
  const [panelOpen, setPanelOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchContacts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_profiles_with_roles" as any)
      .select("*");
    const list = ((data as any[]) || []).filter((u) => u.user_id !== user?.id);

    const contactsWithMeta = await Promise.all(
      list.map(async (c) => {
        const { data: msgs } = await supabase
          .from("admin_messages" as any)
          .select("created_at, is_read, sender_id")
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${c.user_id}),and(sender_id.eq.${c.user_id},receiver_id.eq.${user.id})`)
          .order("created_at", { ascending: false })
          .limit(1);

        const lastMsg = (msgs as any[])?.[0] || null;

        const { count: unread } = await supabase
          .from("admin_messages" as any)
          .select("id", { count: "exact", head: true })
          .eq("sender_id", c.user_id)
          .eq("receiver_id", user.id)
          .eq("is_read", false);

        return {
          ...c,
          last_message_at: lastMsg?.created_at || null,
          unread: unread || 0,
        };
      })
    );

    contactsWithMeta.sort((a, b) => {
      if (!a.last_message_at && !b.last_message_at) return 0;
      if (!a.last_message_at) return 1;
      if (!b.last_message_at) return -1;
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });

    setContacts(contactsWithMeta);
  }, [user]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    const { count } = await supabase
      .from("admin_messages" as any)
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("is_read", false);
    setUnreadCount(count || 0);
  }, [user]);

  useEffect(() => {
    fetchContacts();
    fetchUnreadCount();
    const interval = setInterval(() => {
      fetchUnreadCount();
      if (panelOpen && !selectedContact) fetchContacts();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchContacts, fetchUnreadCount, panelOpen, selectedContact]);

  const fetchMessages = useCallback(async (contactId: string) => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("admin_messages" as any)
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });

    const msgs = (data as any[]) || [];
    setMessages(msgs);

    const unread = msgs.filter((m) => m.sender_id === contactId && !m.is_read);
    if (unread.length) {
      await Promise.all(unread.map((m) =>
        supabase.from("admin_messages" as any).update({ is_read: true }).eq("id", m.id)
      ));
      fetchUnreadCount();
      fetchContacts();
    }
    setLoading(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [user, fetchUnreadCount, fetchContacts]);

  useEffect(() => {
    if (selectedContact) fetchMessages(selectedContact.user_id);
  }, [selectedContact, fetchMessages]);

  const sendMessage = async () => {
    if (!input.trim() || !selectedContact || !user) return;
    await supabase.from("admin_messages" as any).insert({
      sender_id: user.id,
      receiver_id: selectedContact.user_id,
      body: input.trim(),
    });
    setInput("");
    fetchMessages(selectedContact.user_id);
    fetchContacts();
  };

  const togglePanel = () => {
    setPanelOpen(!panelOpen);
    if (!panelOpen) {
      setSelectedContact(null);
      setMessages([]);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={togglePanel}
          className="h-14 rounded-full shadow-lg px-5 bg-gradient-to-r from-primary to-primary/80 hover:shadow-xl transition-all"
        >
          <MessageSquare className="w-5 h-5 mr-2" />
          <span className="font-bold text-sm">SACID</span>
          {unreadCount > 0 && (
            <Badge className="ml-2 bg-red-500 text-white px-1.5 py-0.5 text-xs min-w-[20px] text-center">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Panel */}
      {panelOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 h-[500px] bg-card border rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="font-bold text-sm">SACID Mensajería</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary/80"
              onClick={() => setPanelOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {!selectedContact ? (
            /* Contact List */
            <div className="flex-1 overflow-y-auto">
              {contacts.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">Sin usuarios</p>
              )}
              {contacts.map((c) => (
                <div
                  key={c.user_id}
                  className="px-4 py-3 border-b cursor-pointer hover:bg-muted/50 transition-colors flex items-center gap-3"
                  onClick={() => setSelectedContact(c)}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                    {c.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{c.full_name.split(" ")[0]}</p>
                      {c.unread && c.unread > 0 && (
                        <Badge className="bg-red-500 text-white px-1.5 py-0.5 text-[10px] min-w-[18px] text-center ml-2">
                          {c.unread}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate">
                        {ROLE_LABELS[c.roles?.[0]] || c.roles?.[0] || "Usuario"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {c.last_message_at
                          ? format(new Date(c.last_message_at), "HH:mm")
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Chat View */
            <>
              {/* Contact header */}
              <div
                className="px-4 py-2 border-b flex items-center gap-2 cursor-pointer hover:bg-muted/30 shrink-0"
                onClick={() => { setSelectedContact(null); setMessages([]); fetchContacts(); }}
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                  {selectedContact.full_name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-sm">{selectedContact.full_name}</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-muted/20">
                {loading && <p className="text-center text-xs text-muted-foreground py-4">Cargando...</p>}
                {!loading && messages.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-4">Sin mensajes</p>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-background border"}`}>
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <p className="text-[10px] opacity-70 mt-1 text-right">
                        {format(new Date(m.created_at), "HH:mm")}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t flex gap-2 shrink-0">
                <Input
                  placeholder="Escribe..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="text-sm"
                />
                <Button size="icon" className="shrink-0 h-9 w-9" onClick={sendMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
