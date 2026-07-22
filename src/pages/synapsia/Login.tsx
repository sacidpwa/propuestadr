import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import synapsiaLogo from "@/assets/synapsia-logo.svg";
import WelcomeOverlay from "@/components/synapsia/WelcomeOverlay";

const routeForRoles = (roles: string[]): string => {
  if (roles.includes("admin")) return "/synapsia";
  if (roles.includes("recepcion") || roles.includes("especialista")) return "/synapsia";
  if (roles.includes("administrativo")) return "/synapsia/admin";
  if (roles.includes("promotor")) return "/synapsia/cotizador";
  return "/synapsia";
};

export default function SynapsiaLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [welcome, setWelcome] = useState<{ name: string; target: string } | null>(null);

  const redirectByRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/synapsia");
      return;
    }
    const displayName =
      (user.user_metadata as any)?.full_name ||
      (user.email ? user.email.split("@")[0] : "Usuario");
    let target = "/synapsia";
    if (user.email?.toLowerCase() === "esther.z@synapsia.mx") {
      target = "/synapsia/dashboard";
    } else {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const roles = (data || []).map((r) => r.role as string);
      target = routeForRoles(roles);
    }
    setWelcome({ name: displayName, target });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: error.message === "Invalid login credentials"
          ? "Credenciales inválidas. Verifica tu email y contraseña."
          : error.message,
      });
    } else {
      await redirectByRole();
    }
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signUp(email, password, fullName);
    if (error) {
      toast({
        variant: "destructive",
        title: "Error al registrarse",
        description: error.message,
      });
    } else {
      toast({
        title: "Cuenta creada",
        description: "Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesión.",
      });
      await redirectByRole();
    }
    setIsLoading(false);
  };

  return (
    <>
      {welcome && (
        <WelcomeOverlay name={welcome.name} onDone={() => navigate(welcome.target)} />
      )}
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(220,40%,13%)] via-[hsl(220,30%,18%)] to-[hsl(220,25%,22%)] p-4">
      <Card className="w-full max-w-md border-none shadow-2xl bg-card/95 backdrop-blur">
        <CardHeader className="text-center space-y-4 pb-2">
          <img src={synapsiaLogo} alt="Synapsia" className="mx-auto h-20 w-auto" />
          <CardDescription className="text-muted-foreground">
            Sistema de Gestión Clínica
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register">Registro</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Correo electrónico</Label>
                  <Input id="login-email" type="email" placeholder="correo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Input id="login-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Iniciando sesión...</> : "Iniciar Sesión"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Nombre completo</Label>
                  <Input id="reg-name" type="text" placeholder="Tu nombre" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Correo electrónico</Label>
                  <Input id="reg-email" type="email" placeholder="correo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Contraseña</Label>
                  <Input id="reg-password" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</> : "Crear Cuenta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
