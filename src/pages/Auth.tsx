import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import MoneyLogo from "@/components/MoneyLogo";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type AuthMode = "login" | "signup" | "forgot";

const Auth = () => {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signupDisabled, setSignupDisabled] = useState(false);

  useEffect(() => {
    fetch(`${SUPABASE_URL}/functions/v1/admin-templates?type=settings&key=signup_disabled`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data && data.disabled) setSignupDisabled(true); })
      .catch(() => {});
  }, []);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleSignup = async () => {
    if (!email || !password) return;
    if (password !== confirmPassword) {
      toast({ title: "Senhas não coincidem", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (!whatsapp.trim()) {
      toast({ title: "Informe seu número de WhatsApp", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, "", whatsapp.trim());
    if (error) {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Conta criada!", description: "Verifique seu email para confirmar o cadastro." });
      setMode("login");
    }
    setLoading(false);
  };

  const handleForgot = async () => {
    if (!email) return;
    setLoading(true);
    const { error } = await resetPassword(email);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email enviado!", description: "Verifique sua caixa de entrada para redefinir a senha." });
      setMode("login");
    }
    setLoading(false);
  };

  const reset = () => {
    setEmail("");
    setPassword("");
    setNome("");
    setWhatsapp("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirm(false);
  };

  return (
    <div className="min-h-[100dvh] flex items-start sm:items-center justify-center bg-background p-4 pt-16 sm:pt-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <MoneyLogo size="lg" />
          <p className="text-muted-foreground text-sm">
            {mode === "login" && "Entre na sua conta"}
            {mode === "signup" && "Crie sua conta gratuita"}
            {mode === "forgot" && "Recupere sua senha"}
          </p>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-elevated border border-border space-y-4">
          {mode === "forgot" && (
            <button onClick={() => { setMode("login"); reset(); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-3 h-3" /> Voltar ao login
            </button>
          )}



          <div>
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="email" placeholder="seu@email.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          {mode !== "forgot" && (
            <div>
              <Label>Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (mode === "login" ? handleLogin() : handleSignup())}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === "signup" && (
            <>
              <div>
                <Label>Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label>WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    className="pl-10"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {mode === "login" && (
            <div className="flex justify-end">
              <button onClick={() => { setMode("forgot"); reset(); }} className="text-xs text-primary hover:underline">
                Esqueci minha senha
              </button>
            </div>
          )}

          <Button
            onClick={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgot}
            disabled={loading}
            className="w-full gradient-primary text-primary-foreground hover:opacity-90"
          >
            {loading ? "Aguarde..." : mode === "login" ? "Entrar" : mode === "signup" ? "Cadastrar" : "Enviar Link"}
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            !signupDisabled && <>Não tem conta? <button onClick={() => { setMode("signup"); reset(); }} className="text-primary font-medium hover:underline">Cadastre-se</button></>
          ) : mode === "signup" ? (
            <>Já tem conta? <button onClick={() => { setMode("login"); reset(); }} className="text-primary font-medium hover:underline">Entrar</button></>
          ) : null}
        </p>
      </div>
    </div>
  );
};

export default Auth;
