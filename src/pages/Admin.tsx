import { useState, useEffect, useRef } from "react";
import {
  Eye, EyeOff, Plus, Trash2, Upload, Lock, CreditCard, Building2, MessageCircle,
  Settings, Users, User, Phone, Mail, LayoutDashboard, Pencil, Ban, ShieldCheck,
  KeyRound, Search, ChevronLeft, ChevronRight, UserPlus, UserX, Activity,
  PlayCircle, Video, GripVertical, Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import MoneyLogo from "@/components/MoneyLogo";

interface BankTemplate { id: string; nome: string; logo_url: string | null; cor: string; abbr: string; }
interface CardTemplate { id: string; nome: string; image_url: string | null; bandeira: string; }
interface WhatsAppConfig { enabled: boolean; url: string; label: string; color: string; }
interface TutorialVideo { id: string; title: string; url: string; order: number; }
interface TutorialConfig { videos: TutorialVideo[]; }
interface UserProfile {
  id: string; nome: string; email: string; whatsapp: string;
  avatar_url: string | null; created_at: string;
  last_sign_in_at: string | null; banned: boolean;
}
interface DashboardStats { totalUsers: number; newThisMonth: number; activeToday: number; bannedCount: number; }

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const extractYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match ? match[1] : null;
};

const Admin = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [bankTemplates, setBankTemplates] = useState<BankTemplate[]>([]);
  const [cardTemplates, setCardTemplates] = useState<CardTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [bankForm, setBankForm] = useState({ nome: "", cor: "hsl(215, 50%, 50%)", abbr: "" });
  const [bankImageFile, setBankImageFile] = useState<File | null>(null);
  const [bankImagePreview, setBankImagePreview] = useState("");
  const bankFileRef = useRef<HTMLInputElement>(null);

  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [cardForm, setCardForm] = useState({ nome: "", bandeira: "Mastercard" });
  const [cardImageFile, setCardImageFile] = useState<File | null>(null);
  const [cardImagePreview, setCardImagePreview] = useState("");
  const cardFileRef = useRef<HTMLInputElement>(null);

  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig>({
    enabled: false, url: "", label: "Suporte", color: "hsl(142, 70%, 45%)",
  });
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [stats, setStats] = useState<DashboardStats>({ totalUsers: 0, newThisMonth: 0, activeToday: 0, bannedCount: 0 });

  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editUserForm, setEditUserForm] = useState({ id: "", nome: "", whatsapp: "" });
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [signupDisabled, setSignupDisabled] = useState(false);
  const [savingSignup, setSavingSignup] = useState(false);
  const [tutorialConfig, setTutorialConfig] = useState<TutorialConfig>({ videos: [] });
  const [savingTutorial, setSavingTutorial] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");

  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({ email: "", password: "", nome: "", whatsapp: "" });
  const [creatingUser, setCreatingUser] = useState(false);

  const bandeiras = ["Mastercard", "Visa", "Elo", "Amex", "Hipercard"];

  const adminFetch = async (method: string, type: string, body?: any) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-templates?type=${type}`, {
      method,
      headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro");
    }
    return res.json();
  };

  const loadData = async (pw: string) => {
    const headers = { "x-admin-password": pw };
    const [bankRes, cardRes, settingsRes, usersRes, dashRes, signupRes, tutorialRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/functions/v1/admin-templates?type=bank`, { headers }),
      fetch(`${SUPABASE_URL}/functions/v1/admin-templates?type=card`, { headers }),
      fetch(`${SUPABASE_URL}/functions/v1/admin-templates?type=settings&key=whatsapp_support`),
      fetch(`${SUPABASE_URL}/functions/v1/admin-templates?type=users`, { headers }),
      fetch(`${SUPABASE_URL}/functions/v1/admin-templates?type=dashboard`, { headers }),
      fetch(`${SUPABASE_URL}/functions/v1/admin-templates?type=settings&key=signup_disabled`),
      fetch(`${SUPABASE_URL}/functions/v1/admin-templates?type=settings&key=tutorial_videos`),
    ]);
    if (bankRes.ok) setBankTemplates(await bankRes.json());
    if (cardRes.ok) setCardTemplates(await cardRes.json());
    if (settingsRes.ok) {
      const d = await settingsRes.json();
      if (d && typeof d === 'object') setWhatsappConfig(prev => ({ ...prev, ...d }));
    }
    if (usersRes.ok) setUsers(await usersRes.json());
    if (dashRes.ok) setStats(await dashRes.json());
    if (signupRes.ok) {
      const d = await signupRes.json();
      setSignupDisabled(d?.disabled === true);
    }
    if (tutorialRes.ok) {
      const d = await tutorialRes.json();
      if (d && Array.isArray(d.videos)) setTutorialConfig(d);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-templates?type=bank`, {
        headers: { "x-admin-password": password },
      });
      if (res.ok) {
        setAdminPassword(password);
        setAuthenticated(true);
        await loadData(password);
      } else {
        toast({ title: "Senha incorreta", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao conectar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File, type: string): Promise<string> => {
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve) => {
      reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
      reader.readAsDataURL(file);
    });
    const data = await adminFetch("POST", type, { action: "upload-image", fileName: file.name, fileBase64: base64, contentType: file.type });
    return data.url;
  };

  const handleAddBank = async () => {
    if (!bankForm.nome || !bankForm.abbr) return;
    try {
      setLoading(true);
      let logo_url = null;
      if (bankImageFile) logo_url = await uploadImage(bankImageFile, "bank");
      const data = await adminFetch("POST", "bank", { action: "create", template: { ...bankForm, logo_url } });
      setBankTemplates((prev) => [...prev, data]);
      setBankDialogOpen(false);
      setBankForm({ nome: "", cor: "hsl(215, 50%, 50%)", abbr: "" });
      setBankImageFile(null); setBankImagePreview("");
      toast({ title: "Banco adicionado!" });
    } catch (err: any) { toast({ title: err.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleAddCard = async () => {
    if (!cardForm.nome) return;
    try {
      setLoading(true);
      let image_url = null;
      if (cardImageFile) image_url = await uploadImage(cardImageFile, "card");
      const data = await adminFetch("POST", "card", { action: "create", template: { ...cardForm, image_url } });
      setCardTemplates((prev) => [...prev, data]);
      setCardDialogOpen(false);
      setCardForm({ nome: "", bandeira: "Mastercard" });
      setCardImageFile(null); setCardImagePreview("");
      toast({ title: "Cartão adicionado!" });
    } catch (err: any) { toast({ title: err.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleDeleteTemplate = async (id: string, type: "bank" | "card") => {
    try {
      await adminFetch("POST", type, { action: "delete", id });
      if (type === "bank") setBankTemplates((prev) => prev.filter((t) => t.id !== id));
      else setCardTemplates((prev) => prev.filter((t) => t.id !== id));
      toast({ title: "Removido!" });
    } catch (err: any) { toast({ title: err.message, variant: "destructive" }); }
  };

  const handleSaveWhatsapp = async () => {
    try {
      setSavingWhatsapp(true);
      await adminFetch("POST", "settings", { action: "update", key: "whatsapp_support", value: whatsappConfig });
      toast({ title: "Configuração salva!" });
    } catch (err: any) { toast({ title: err.message, variant: "destructive" }); }
    finally { setSavingWhatsapp(false); }
  };

  const handleEditUser = async () => {
    try {
      await adminFetch("POST", "users", { action: "update", ...editUserForm });
      setUsers(prev => prev.map(u => u.id === editUserForm.id ? { ...u, nome: editUserForm.nome, whatsapp: editUserForm.whatsapp } : u));
      setEditUserOpen(false);
      toast({ title: "Usuário atualizado!" });
    } catch (err: any) { toast({ title: err.message, variant: "destructive" }); }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await adminFetch("POST", "users", { action: "delete", id });
      setUsers(prev => prev.filter(u => u.id !== id));
      setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
      toast({ title: "Usuário excluído!" });
    } catch (err: any) { toast({ title: err.message, variant: "destructive" }); }
  };

  const handleBanUser = async (id: string, ban: boolean) => {
    try {
      await adminFetch("POST", "users", { action: "ban", id, ban });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, banned: ban } : u));
      toast({ title: ban ? "Usuário bloqueado!" : "Usuário desbloqueado!" });
    } catch (err: any) { toast({ title: err.message, variant: "destructive" }); }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await adminFetch("POST", "users", { action: "reset-password", email });
      toast({ title: "Link de redefinição enviado!" });
    } catch (err: any) { toast({ title: err.message, variant: "destructive" }); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (f: File | null) => void, setPreview: (s: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreateUser = async () => {
    if (!createUserForm.email || !createUserForm.password) {
      toast({ title: "E-mail e senha são obrigatórios", variant: "destructive" });
      return;
    }
    if (createUserForm.password.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    try {
      setCreatingUser(true);
      await adminFetch("POST", "users", {
        action: "create",
        email: createUserForm.email,
        password: createUserForm.password,
        nome: createUserForm.nome,
        whatsapp: createUserForm.whatsapp,
      });
      toast({ title: "Usuário criado com sucesso!" });
      setCreateUserOpen(false);
      setCreateUserForm({ email: "", password: "", nome: "", whatsapp: "" });
      await loadData(adminPassword);
    } catch (err: any) {
      toast({ title: err.message || "Erro ao criar usuário", variant: "destructive" });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleToggleSignup = async () => {
    try {
      setSavingSignup(true);
      await adminFetch("POST", "settings", { action: "update", key: "signup_disabled", value: { disabled: signupDisabled } });
      toast({ title: signupDisabled ? "Cadastro desativado!" : "Cadastro ativado!" });
    } catch (err: any) { toast({ title: err.message, variant: "destructive" }); }
    finally { setSavingSignup(false); }
  };

  const handleAddTutorialVideo = () => {
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) return;
    const newVideo: TutorialVideo = {
      id: Date.now().toString(),
      title: newVideoTitle.trim(),
      url: newVideoUrl.trim(),
      order: tutorialConfig.videos.length,
    };
    setTutorialConfig(prev => ({ videos: [...prev.videos, newVideo] }));
    setNewVideoTitle("");
    setNewVideoUrl("");
  };

  const handleRemoveTutorialVideo = (id: string) => {
    setTutorialConfig(prev => ({
      videos: prev.videos.filter(v => v.id !== id).map((v, i) => ({ ...v, order: i })),
    }));
  };

  const handleSaveTutorial = async () => {
    try {
      setSavingTutorial(true);
      await adminFetch("POST", "settings", { action: "update", key: "tutorial_videos", value: tutorialConfig });
      toast({ title: "Tutoriais salvos!" });
    } catch (err: any) { toast({ title: err.message, variant: "destructive" }); }
    finally { setSavingTutorial(false); }
  };

  const filteredUsers = users.filter(u =>
    u.nome.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.whatsapp.includes(userSearch)
  );

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Usuários", icon: Users },
    { id: "banks", label: "Bancos", icon: Building2 },
    { id: "cards", label: "Cartões", icon: CreditCard },
    { id: "tutorials", label: "Tutoriais", icon: Video },
    { id: "settings", label: "Configurações", icon: Settings },
  ];

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="bg-card rounded-2xl p-8 shadow-elevated border border-border w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">Painel Admin</h1>
            <p className="text-sm text-muted-foreground mt-1">Digite a senha de administrador</p>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button onClick={handleLogin} className="w-full gradient-primary text-primary-foreground" disabled={loading}>
              {loading ? "Verificando..." : "Entrar"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? "w-16" : "w-60"} bg-card border-r border-border flex flex-col transition-all duration-300 flex-shrink-0`}>
        <div className="p-4 flex items-center justify-between border-b border-border">
          {!sidebarCollapsed && <h2 className="font-display font-bold text-foreground text-lg">Admin</h2>}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                activeSection === item.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-border">
          <button
            onClick={() => { setAuthenticated(false); setAdminPassword(""); setPassword(""); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Lock className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Dashboard */}
          {activeSection === "dashboard" && (
            <>
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Visão geral do sistema</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={<Users className="w-5 h-5" />} label="Total de Usuários" value={stats.totalUsers} gradient="from-blue-500 to-blue-700" />
                <StatCard icon={<UserPlus className="w-5 h-5" />} label="Novos este mês" value={stats.newThisMonth} gradient="from-emerald-500 to-emerald-700" />
                <StatCard icon={<Activity className="w-5 h-5" />} label="Ativos hoje" value={stats.activeToday} gradient="from-amber-500 to-orange-600" />
                <StatCard icon={<UserX className="w-5 h-5" />} label="Bloqueados" value={stats.bannedCount} gradient="from-red-500 to-red-700" />
              </div>
              <div className="bg-card rounded-2xl p-5 border border-border shadow-card">
                <h3 className="font-display font-semibold text-foreground mb-4">Últimos Usuários Cadastrados</h3>
                <div className="space-y-3">
                  {users.slice(0, 5).map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-4 h-4 text-primary" /></div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">{u.nome || "Sem nome"}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("pt-BR")}</p>
                        {u.banned && <span className="text-[10px] text-destructive font-medium">Bloqueado</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Users */}
          {activeSection === "users" && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Usuários</h1>
                  <p className="text-sm text-muted-foreground">{users.length} usuário(s) cadastrado(s)</p>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar por nome, email ou WhatsApp..." className="pl-10" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
              </div>
              <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Usuário</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">WhatsApp</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Último Login</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Status</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {u.avatar_url ? (
                                <img src={u.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-4 h-4 text-primary" /></div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-foreground truncate">{u.nome || "Sem nome"}</p>
                                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-xs text-muted-foreground">{u.whatsapp || "—"}</span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-xs text-muted-foreground">
                              {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "Nunca"}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            {u.banned ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                                <Ban className="w-3 h-3" /> Bloqueado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                                <ShieldCheck className="w-3 h-3" /> Ativo
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => { setEditUserForm({ id: u.id, nome: u.nome, whatsapp: u.whatsapp }); setEditUserOpen(true); }}
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Editar"
                              ><Pencil className="w-3.5 h-3.5" /></button>
                              <button
                                onClick={() => handleResetPassword(u.email)}
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Resetar senha"
                              ><KeyRound className="w-3.5 h-3.5" /></button>
                              <button
                                onClick={() => handleBanUser(u.id, !u.banned)}
                                className={`p-1.5 rounded-lg transition-colors ${u.banned ? "hover:bg-accent text-accent-foreground" : "hover:bg-destructive/10 text-muted-foreground hover:text-destructive"}`}
                                title={u.banned ? "Desbloquear" : "Bloquear"}
                              ><Ban className="w-3.5 h-3.5" /></button>
                              <button
                                onClick={() => setDeleteUserId(u.id)}
                                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Excluir"
                              ><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && <p className="text-muted-foreground text-center py-8 text-sm">Nenhum usuário encontrado.</p>}
                </div>
              </div>
            </>
          )}

          {/* Banks */}
          {activeSection === "banks" && (
            <>
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Templates de Bancos</h1>
                <p className="text-sm text-muted-foreground">Gerencie os templates de bancos disponíveis</p>
              </div>
              <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary text-primary-foreground gap-2"><Plus className="w-4 h-4" /> Adicionar Banco</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Novo Template de Banco</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-2">
                    <div><Label>Nome</Label><Input value={bankForm.nome} onChange={(e) => setBankForm({ ...bankForm, nome: e.target.value })} placeholder="Ex: Nubank" /></div>
                    <div><Label>Abreviação</Label><Input value={bankForm.abbr} onChange={(e) => setBankForm({ ...bankForm, abbr: e.target.value })} placeholder="Ex: Nu" maxLength={4} /></div>
                    <div><Label>Cor (HSL)</Label><Input value={bankForm.cor} onChange={(e) => setBankForm({ ...bankForm, cor: e.target.value })} placeholder="hsl(280, 60%, 50%)" /></div>
                    <div>
                      <Label>Logo (imagem)</Label>
                      <div className="flex items-center gap-3 mt-2">
                        {bankImagePreview && <img src={bankImagePreview} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-border" />}
                        <input ref={bankFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setBankImageFile, setBankImagePreview)} />
                        <Button type="button" variant="outline" size="sm" onClick={() => bankFileRef.current?.click()} className="gap-2"><Upload className="w-4 h-4" /> Upload</Button>
                      </div>
                    </div>
                    <Button onClick={handleAddBank} disabled={loading} className="gradient-primary text-primary-foreground">{loading ? "Salvando..." : "Salvar"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bankTemplates.map((t) => (
                  <div key={t.id} className="bg-card rounded-2xl p-4 border border-border shadow-card flex items-center gap-3 group">
                    {t.logo_url ? (
                      <img src={t.logo_url} alt={t.nome} className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-primary-foreground font-bold" style={{ backgroundColor: t.cor }}>{t.abbr}</div>
                    )}
                    <div className="flex-1"><p className="font-semibold text-foreground">{t.nome}</p><p className="text-xs text-muted-foreground">{t.abbr}</p></div>
                    <button onClick={() => handleDeleteTemplate(t.id, "bank")} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                {bankTemplates.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">Nenhum banco cadastrado ainda.</p>}
              </div>
            </>
          )}

          {/* Cards */}
          {activeSection === "cards" && (
            <>
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Templates de Cartões</h1>
                <p className="text-sm text-muted-foreground">Gerencie os templates de cartões disponíveis</p>
              </div>
              <Dialog open={cardDialogOpen} onOpenChange={setCardDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary text-primary-foreground gap-2"><Plus className="w-4 h-4" /> Adicionar Cartão</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Novo Template de Cartão</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-2">
                    <div><Label>Nome</Label><Input value={cardForm.nome} onChange={(e) => setCardForm({ ...cardForm, nome: e.target.value })} placeholder="Ex: Nubank Gold" /></div>
                    <div>
                      <Label>Bandeira</Label>
                      <select value={cardForm.bandeira} onChange={(e) => setCardForm({ ...cardForm, bandeira: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                        {bandeiras.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Imagem do Cartão</Label>
                      <div className="flex items-center gap-3 mt-2">
                        {cardImagePreview && <img src={cardImagePreview} alt="Preview" className="w-20 h-12 rounded-lg object-cover border border-border" />}
                        <input ref={cardFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setCardImageFile, setCardImagePreview)} />
                        <Button type="button" variant="outline" size="sm" onClick={() => cardFileRef.current?.click()} className="gap-2"><Upload className="w-4 h-4" /> Upload</Button>
                      </div>
                    </div>
                    <Button onClick={handleAddCard} disabled={loading} className="gradient-primary text-primary-foreground">{loading ? "Salvando..." : "Salvar"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cardTemplates.map((t) => (
                  <div key={t.id} className="bg-card rounded-2xl p-4 border border-border shadow-card flex items-center gap-3 group">
                    {t.image_url ? (
                      <img src={t.image_url} alt={t.nome} className="w-20 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-20 h-12 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">{t.nome.slice(0, 4)}</div>
                    )}
                    <div className="flex-1"><p className="font-semibold text-foreground">{t.nome}</p><p className="text-xs text-muted-foreground">{t.bandeira}</p></div>
                    <button onClick={() => handleDeleteTemplate(t.id, "card")} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                {cardTemplates.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">Nenhum cartão cadastrado ainda.</p>}
              </div>
            </>
          )}

          {/* Tutorials */}
          {activeSection === "tutorials" && (
            <>
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Tutoriais</h1>
                <p className="text-sm text-muted-foreground">Gerencie os vídeos tutoriais do YouTube</p>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border shadow-card space-y-5">
                <h3 className="font-display font-semibold text-foreground">Adicionar Vídeo</h3>
                <div className="grid gap-3">
                  <div><Label>Título do vídeo</Label><Input value={newVideoTitle} onChange={(e) => setNewVideoTitle(e.target.value)} placeholder="Ex: Como cadastrar um banco" className="mt-1" /></div>
                  <div><Label>URL do YouTube</Label><Input value={newVideoUrl} onChange={(e) => setNewVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="mt-1" /></div>
                  <Button onClick={handleAddTutorialVideo} variant="outline" className="gap-2 w-fit"><Plus className="w-4 h-4" /> Adicionar à lista</Button>
                </div>
              </div>
              {tutorialConfig.videos.length > 0 && (
                <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-display font-semibold text-foreground text-sm">Vídeos ({tutorialConfig.videos.length})</h3>
                  </div>
                  <div className="divide-y divide-border">
                    {tutorialConfig.videos.map((video, idx) => (
                      <div key={video.id} className="flex items-center gap-3 p-3">
                        <span className="text-xs text-muted-foreground w-6 text-center">{idx + 1}</span>
                        <PlayCircle className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{video.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{video.url}</p>
                        </div>
                        <button onClick={() => handleRemoveTutorialVideo(video.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Button onClick={handleSaveTutorial} disabled={savingTutorial} className="w-full gradient-primary text-primary-foreground">{savingTutorial ? "Salvando..." : "Salvar Tutoriais"}</Button>
            </>
          )}

          {/* Settings */}
          {activeSection === "settings" && (
            <>
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Configurações</h1>
                <p className="text-sm text-muted-foreground">Gerencie as configurações do sistema</p>
              </div>

              {/* Signup Toggle */}
              <div className="bg-card rounded-2xl p-6 border border-border shadow-card space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">Cadastro de Usuários</h3>
                    <p className="text-xs text-muted-foreground">Controle se novos usuários podem se cadastrar</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Desativar cadastro (Cadastre-se)</Label>
                  <Switch checked={signupDisabled} onCheckedChange={(checked) => { setSignupDisabled(checked); }} disabled={savingSignup} />
                </div>
                <Button onClick={handleToggleSignup} disabled={savingSignup} className="w-full gradient-primary text-primary-foreground">{savingSignup ? "Salvando..." : "Salvar"}</Button>
              </div>

              {/* WhatsApp */}
              <div className="bg-card rounded-2xl p-6 border border-border shadow-card space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">Botão de Suporte WhatsApp</h3>
                    <p className="text-xs text-muted-foreground">Configure o botão de suporte que aparece no menu lateral</p>
                  </div>
                </div>
                <div className="flex items-center justify-between"><Label>Ativar botão</Label><Switch checked={whatsappConfig.enabled} onCheckedChange={(checked) => setWhatsappConfig({ ...whatsappConfig, enabled: checked })} /></div>
                <div><Label>URL do WhatsApp</Label><Input value={whatsappConfig.url} onChange={(e) => setWhatsappConfig({ ...whatsappConfig, url: e.target.value })} placeholder="https://wa.me/5511999999999" className="mt-1" /><p className="text-[10px] text-muted-foreground mt-1">Use o formato: https://wa.me/NUMERO</p></div>
                <div><Label>Nome do botão</Label><Input value={whatsappConfig.label} onChange={(e) => setWhatsappConfig({ ...whatsappConfig, label: e.target.value })} placeholder="Suporte" className="mt-1" /></div>
                <Button onClick={handleSaveWhatsapp} disabled={savingWhatsapp} className="w-full gradient-primary text-primary-foreground">{savingWhatsapp ? "Salvando..." : "Salvar Configuração"}</Button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Edit User Dialog */}
      <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Editar Usuário</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div><Label>Nome</Label><Input value={editUserForm.nome} onChange={(e) => setEditUserForm({ ...editUserForm, nome: e.target.value })} /></div>
            <div><Label>WhatsApp</Label><Input value={editUserForm.whatsapp} onChange={(e) => setEditUserForm({ ...editUserForm, whatsapp: e.target.value })} /></div>
            <Button onClick={handleEditUser} className="gradient-primary text-primary-foreground">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirm */}
      <ConfirmDialog
        open={!!deleteUserId}
        onOpenChange={(open) => { if (!open) setDeleteUserId(null); }}
        onConfirm={() => { if (deleteUserId) { handleDeleteUser(deleteUserId); setDeleteUserId(null); } }}
        title="Excluir usuário?"
        description="Esta ação é irreversível. O usuário e todos os seus dados serão permanentemente removidos."
      />
    </div>
  );
};

const StatCard = ({ icon, label, value, gradient }: { icon: React.ReactNode; label: string; value: number; gradient: string; }) => (
  <div className={`rounded-2xl p-4 shadow-elevated relative overflow-hidden bg-gradient-to-br ${gradient}`}>
    <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 80% 20%, white, transparent 50%)" }} />
    <div className="relative z-[1]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-white/80">{label}</span>
        <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white">{icon}</div>
      </div>
      <p className="text-2xl font-display font-bold text-white">{value}</p>
    </div>
  </div>
);

export default Admin;
