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
interface TutorialPlaylist { id: string; name: string; videos: TutorialVideo[]; }
interface TutorialConfig { playlists?: TutorialPlaylist[]; videos?: TutorialVideo[]; }
interface UserProfile {
  id: string; nome: string; email: string; whatsapp: string;
  avatar_url: string | null; created_at: string;
  last_sign_in_at: string | null; banned: boolean;
}
interface DashboardStats { totalUsers: number; newThisMonth: number; activeToday: number; bannedCount: number; }
interface AppCustomization {
  appName: string;
  logoUrl: string;
  colors: {
    primary: string;
    dashboard: string;
    lancamentos: string;
    cartoes: string;
    bancos: string;
    investimentos: string;
    relatorios: string;
  };
}

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
  const [tutorialConfig, setTutorialConfig] = useState<TutorialConfig>({ playlists: [] });
  const [savingTutorial, setSavingTutorial] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [editPlaylistId, setEditPlaylistId] = useState<string | null>(null);
  const [editPlaylistName, setEditPlaylistName] = useState("");

  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({ email: "", password: "", nome: "", whatsapp: "" });
  const [creatingUser, setCreatingUser] = useState(false);

  // App Customization state
  const [appCustomization, setAppCustomization] = useState<AppCustomization>({
    appName: "Finanças PRO",
    logoUrl: "",
    colors: {
      primary: "hsl(152, 76%, 36%)",
      dashboard: "hsl(152, 76%, 36%)",
      lancamentos: "hsl(215, 70%, 50%)",
      cartoes: "hsl(280, 70%, 50%)",
      bancos: "hsl(200, 70%, 45%)",
      investimentos: "hsl(45, 90%, 50%)",
      relatorios: "hsl(340, 70%, 50%)",
    },
  });
  const [savingCustomization, setSavingCustomization] = useState(false);
  const [customLogoFile, setCustomLogoFile] = useState<File | null>(null);
  const [customLogoPreview, setCustomLogoPreview] = useState("");
  const customLogoRef = useRef<HTMLInputElement>(null);

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
    const [bankRes, cardRes, settingsRes, usersRes, dashRes, signupRes, tutorialRes, customizationRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/functions/v1/admin-templates?type=bank`, { headers }),
      fetch(`${SUPABASE_URL}/functions/v1/admin-templates?type=card`, { headers }),
      fetch(`${SUPABASE_URL}/functions/v1/admin-templates?type=settings&key=whatsapp_support`),
      fetch(`${SUPABASE_URL}/functions/v1/admin-templates?type=users`, { headers }),
      fetch(`${SUPABASE_URL}/functions/v1/admin-templates?type=dashboard`, { headers }),
      fetch(`${SUPABASE_URL}/functions/v1/admin-templates?type=settings&key=signup_disabled`),
      fetch(`${SUPABASE_URL}/functions/v1/admin-templates?type=settings&key=tutorial_videos`),
      fetch(`${SUPABASE_URL}/functions/v1/admin-templates?type=settings&key=app_customization`),
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
      if (d) {
        if (Array.isArray(d.playlists)) {
          setTutorialConfig(d);
          if (d.playlists.length > 0 && !activePlaylistId) setActivePlaylistId(d.playlists[0].id);
        } else if (Array.isArray(d.videos) && d.videos.length > 0) {
          const migrated: TutorialConfig = { playlists: [{ id: "default", name: "Playlist Principal", videos: d.videos }] };
          setTutorialConfig(migrated);
          setActivePlaylistId("default");
        }
      }
    }
    if (customizationRes.ok) {
      const d = await customizationRes.json();
      if (d && typeof d === 'object') {
        setAppCustomization(prev => ({ ...prev, ...d }));
        if (d.logoUrl) setCustomLogoPreview(d.logoUrl);
      }
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
    if (!createUserForm.email && !createUserForm.nome) {
      toast({ title: "Informe pelo menos o nome de usuário ou e-mail", variant: "destructive" });
      return;
    }
    if (!createUserForm.password) {
      toast({ title: "A senha é obrigatória", variant: "destructive" });
      return;
    }
    if (createUserForm.password.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    // If no email, generate a placeholder email from nome
    const email = createUserForm.email || `${createUserForm.nome.toLowerCase().replace(/\s+/g, '.')}@user.local`;
    try {
      setCreatingUser(true);
      await adminFetch("POST", "users", {
        action: "create",
        email,
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

  const handleAddPlaylist = () => {
    if (!newPlaylistName.trim()) return;
    const newPlaylist: TutorialPlaylist = {
      id: Date.now().toString(),
      name: newPlaylistName.trim(),
      videos: [],
    };
    setTutorialConfig(prev => ({ playlists: [...(prev.playlists || []), newPlaylist] }));
    setActivePlaylistId(newPlaylist.id);
    setNewPlaylistName("");
  };

  const handleRenamePlaylist = (id: string, name: string) => {
    setTutorialConfig(prev => ({
      playlists: (prev.playlists || []).map(p => p.id === id ? { ...p, name } : p),
    }));
    setEditPlaylistId(null);
  };

  const handleDeletePlaylist = (id: string) => {
    setTutorialConfig(prev => {
      const playlists = (prev.playlists || []).filter(p => p.id !== id);
      if (activePlaylistId === id) setActivePlaylistId(playlists[0]?.id || null);
      return { playlists };
    });
  };

  const handleAddTutorialVideo = () => {
    if (!newVideoTitle.trim() || !newVideoUrl.trim() || !activePlaylistId) return;
    const newVideo: TutorialVideo = {
      id: Date.now().toString(),
      title: newVideoTitle.trim(),
      url: newVideoUrl.trim(),
      order: 0,
    };
    setTutorialConfig(prev => ({
      playlists: (prev.playlists || []).map(p =>
        p.id === activePlaylistId
          ? { ...p, videos: [...p.videos, { ...newVideo, order: p.videos.length }] }
          : p
      ),
    }));
    setNewVideoTitle("");
    setNewVideoUrl("");
  };

  const handleRemoveTutorialVideo = (videoId: string) => {
    setTutorialConfig(prev => ({
      playlists: (prev.playlists || []).map(p =>
        p.id === activePlaylistId
          ? { ...p, videos: p.videos.filter(v => v.id !== videoId).map((v, i) => ({ ...v, order: i })) }
          : p
      ),
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

  const activePlaylist = (tutorialConfig.playlists || []).find(p => p.id === activePlaylistId);
  const totalVideos = (tutorialConfig.playlists || []).reduce((sum, p) => sum + p.videos.length, 0);

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
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <MoneyLogo size="lg" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">Painel Administrativo</h1>
              <p className="text-sm text-muted-foreground mt-1">Digite a senha de administrador</p>
            </div>
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
          {!sidebarCollapsed && <MoneyLogo size="sm" />}
          {sidebarCollapsed && <div className="w-full flex justify-center"><MoneyLogo size="sm" hideText /></div>}
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

              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={<Users className="w-5 h-5" />} label="Total de Usuários" value={stats.totalUsers} gradient="from-blue-500 to-blue-700" />
                <StatCard icon={<UserPlus className="w-5 h-5" />} label="Novos este mês" value={stats.newThisMonth} gradient="from-emerald-500 to-emerald-700" />
                <StatCard icon={<Activity className="w-5 h-5" />} label="Ativos hoje" value={stats.activeToday} gradient="from-amber-500 to-orange-600" />
                <StatCard icon={<UserX className="w-5 h-5" />} label="Bloqueados" value={stats.bannedCount} gradient="from-red-500 to-red-700" />
              </div>

              {/* Quick Actions + System Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Quick Actions */}
                <div className="bg-card rounded-2xl p-5 border border-border shadow-card">
                  <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-primary" /> Ações Rápidas
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setActiveSection("users")}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-primary/10 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                        <Users className="w-5 h-5 text-blue-500" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">Gerenciar Usuários</span>
                    </button>
                    <button
                      onClick={() => setActiveSection("banks")}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-primary/10 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                        <Building2 className="w-5 h-5 text-emerald-500" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">Bancos</span>
                    </button>
                    <button
                      onClick={() => setActiveSection("cards")}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-primary/10 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                        <CreditCard className="w-5 h-5 text-purple-500" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">Cartões</span>
                    </button>
                    <button
                      onClick={() => setActiveSection("settings")}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-primary/10 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                        <Settings className="w-5 h-5 text-amber-500" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">Configurações</span>
                    </button>
                  </div>
                </div>

                {/* System Status */}
                <div className="bg-card rounded-2xl p-5 border border-border shadow-card lg:col-span-2">
                  <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" /> Status do Sistema
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[11px] text-muted-foreground">Bancos</span>
                      </div>
                      <p className="text-xl font-display font-bold text-foreground">{bankTemplates.length}</p>
                      <p className="text-[10px] text-muted-foreground">templates cadastrados</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-2 mb-1">
                        <CreditCard className="w-3.5 h-3.5 text-purple-500" />
                        <span className="text-[11px] text-muted-foreground">Cartões</span>
                      </div>
                      <p className="text-xl font-display font-bold text-foreground">{cardTemplates.length}</p>
                      <p className="text-[10px] text-muted-foreground">templates cadastrados</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Video className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-[11px] text-muted-foreground">Tutoriais</span>
                      </div>
                      <p className="text-xl font-display font-bold text-foreground">{totalVideos}</p>
                      <p className="text-[10px] text-muted-foreground">vídeos em {(tutorialConfig.playlists || []).length} playlist(s)</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-[11px] text-muted-foreground">Suporte WhatsApp</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground mt-1">
                        {whatsappConfig.enabled ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3" /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Inativo</span>
                        )}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[11px] text-muted-foreground">Cadastro</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground mt-1">
                        {signupDisabled ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                            <Ban className="w-3 h-3" /> Desativado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3" /> Ativo
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[11px] text-muted-foreground">Taxa de Atividade</span>
                      </div>
                      <p className="text-xl font-display font-bold text-foreground">
                        {stats.totalUsers > 0 ? Math.round((stats.activeToday / stats.totalUsers) * 100) : 0}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">usuários ativos hoje</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Users Growth Bar + Recent Users */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* User Distribution */}
                <div className="bg-card rounded-2xl p-5 border border-border shadow-card">
                  <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> Distribuição de Usuários
                  </h3>
                  <div className="space-y-4">
                    {/* Active vs Banned bar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Ativos</span>
                        <span className="text-xs font-semibold text-foreground">{stats.totalUsers - stats.bannedCount}</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-700"
                          style={{ width: stats.totalUsers > 0 ? `${((stats.totalUsers - stats.bannedCount) / stats.totalUsers) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Bloqueados</span>
                        <span className="text-xs font-semibold text-foreground">{stats.bannedCount}</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-700"
                          style={{ width: stats.totalUsers > 0 ? `${(stats.bannedCount / stats.totalUsers) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Novos este mês</span>
                        <span className="text-xs font-semibold text-foreground">{stats.newThisMonth}</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700"
                          style={{ width: stats.totalUsers > 0 ? `${(stats.newThisMonth / stats.totalUsers) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>

                    {/* Summary pie-like visual */}
                    <div className="flex items-center justify-center pt-2">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Ativos</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Bloqueados</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Novos</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Users */}
                <div className="bg-card rounded-2xl p-5 border border-border shadow-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-primary" /> Últimos Cadastros
                    </h3>
                    <button
                      onClick={() => setActiveSection("users")}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Ver todos →
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {users.slice(0, 6).map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{u.nome || "Sem nome"}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-[11px] text-muted-foreground">{new Date(u.created_at).toLocaleDateString("pt-BR")}</p>
                          {u.banned ? (
                            <span className="text-[9px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full font-medium">Bloqueado</span>
                          ) : u.last_sign_in_at && (new Date().getTime() - new Date(u.last_sign_in_at).getTime()) < 86400000 ? (
                            <span className="text-[9px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full font-medium">Online</span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                    {users.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-6">Nenhum usuário cadastrado.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Users */}
          {activeSection === "users" && (
            <>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Usuários</h1>
                  <p className="text-sm text-muted-foreground">{users.length} usuário(s) cadastrado(s)</p>
                </div>
                <Button onClick={() => setCreateUserOpen(true)} className="gradient-primary text-primary-foreground gap-2">
                  <UserPlus className="w-4 h-4" /> Adicionar Usuário
                </Button>
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
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Área de Tutoriais</h1>
                  <p className="text-sm text-muted-foreground">Gerencie suas playlists e vídeos da área de membros</p>
                </div>
                <div className="flex items-center gap-2 bg-muted/60 rounded-full px-3 py-1.5">
                  <Video className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">{(tutorialConfig.playlists || []).length} playlist(s) · {totalVideos} vídeo(s)</span>
                </div>
              </div>

              {/* Create Playlist */}
              <div className="bg-card rounded-2xl p-5 border border-border shadow-card space-y-3">
                <h3 className="font-display font-semibold text-foreground text-sm">Criar nova Playlist</h3>
                <div className="flex gap-2">
                  <Input value={newPlaylistName} onChange={(e) => setNewPlaylistName(e.target.value)} placeholder="Nome da playlist (ex: Módulo 1 - Introdução)" className="flex-1" onKeyDown={(e) => e.key === "Enter" && handleAddPlaylist()} />
                  <Button onClick={handleAddPlaylist} variant="outline" className="gap-2 flex-shrink-0"><Plus className="w-4 h-4" /> Criar</Button>
                </div>
              </div>

              {/* Playlists Grid */}
              {(tutorialConfig.playlists || []).length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(tutorialConfig.playlists || []).map((pl) => {
                    const isActive = activePlaylistId === pl.id;
                    const firstYtId = pl.videos[0] ? extractYouTubeId(pl.videos[0].url) : null;
                    return (
                      <button
                        key={pl.id}
                        onClick={() => setActivePlaylistId(pl.id)}
                        className={`relative rounded-2xl border overflow-hidden text-left transition-all ${isActive ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/30"}`}
                      >
                        {/* Thumbnail */}
                        <div className="w-full h-24 bg-muted relative">
                          {firstYtId ? (
                            <img src={`https://img.youtube.com/vi/${firstYtId}/mqdefault.jpg`} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Video className="w-8 h-8 text-muted-foreground/30" /></div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                          <div className="absolute bottom-2 left-3 right-3">
                            <p className="text-xs font-bold text-white truncate">{pl.name}</p>
                            <p className="text-[10px] text-white/70">{pl.videos.length} vídeo(s)</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Active Playlist Detail */}
              {activePlaylist && (
                <div className="space-y-4">
                  {/* Playlist Header */}
                  <div className="bg-card rounded-2xl p-5 border border-border shadow-card">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      {editPlaylistId === activePlaylist.id ? (
                        <div className="flex gap-2 flex-1">
                          <Input value={editPlaylistName} onChange={(e) => setEditPlaylistName(e.target.value)} className="flex-1" onKeyDown={(e) => e.key === "Enter" && handleRenamePlaylist(activePlaylist.id, editPlaylistName)} />
                          <Button size="sm" onClick={() => handleRenamePlaylist(activePlaylist.id, editPlaylistName)}>Salvar</Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <PlayCircle className="w-5 h-5 text-primary flex-shrink-0" />
                          <h3 className="font-display font-bold text-foreground text-lg truncate">{activePlaylist.name}</h3>
                          <button onClick={() => { setEditPlaylistId(activePlaylist.id); setEditPlaylistName(activePlaylist.name); }} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                      <button onClick={() => handleDeletePlaylist(activePlaylist.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0" title="Excluir playlist"><Trash2 className="w-4 h-4" /></button>
                    </div>

                    {/* Add Video to this Playlist */}
                    <div className="space-y-3 border-t border-border pt-4">
                      <p className="text-xs font-medium text-muted-foreground">Adicionar vídeo a esta playlist</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div><Label className="text-xs">Título da aula</Label><Input value={newVideoTitle} onChange={(e) => setNewVideoTitle(e.target.value)} placeholder="Ex: Como cadastrar um banco" className="mt-1" /></div>
                        <div><Label className="text-xs">URL do YouTube</Label><Input value={newVideoUrl} onChange={(e) => setNewVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="mt-1" /></div>
                      </div>
                      {newVideoUrl && extractYouTubeId(newVideoUrl) && (
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                          <img src={`https://img.youtube.com/vi/${extractYouTubeId(newVideoUrl)}/mqdefault.jpg`} alt="Preview" className="w-24 h-14 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{newVideoTitle || "Sem título"}</p>
                            <p className="text-[10px] text-muted-foreground">Pré-visualização</p>
                          </div>
                        </div>
                      )}
                      <Button onClick={handleAddTutorialVideo} variant="outline" size="sm" className="gap-2"><Plus className="w-4 h-4" /> Adicionar vídeo</Button>
                    </div>
                  </div>

                  {/* Videos List */}
                  {activePlaylist.videos.length > 0 && (
                    <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
                      <div className="p-4 border-b border-border flex items-center gap-2">
                        <PlayCircle className="w-4 h-4 text-primary" />
                        <h3 className="font-display font-semibold text-foreground text-sm">Vídeos da Playlist</h3>
                        <span className="ml-auto text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">{activePlaylist.videos.length} aula(s)</span>
                      </div>
                      <div className="divide-y divide-border">
                        {activePlaylist.videos.map((video, idx) => {
                          const ytId = extractYouTubeId(video.url);
                          return (
                            <div key={video.id} className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors group">
                              <span className="text-xs font-bold text-muted-foreground w-6 text-center flex-shrink-0">{idx + 1}</span>
                              <div className="w-24 h-14 rounded-lg overflow-hidden flex-shrink-0 relative bg-muted">
                                {ytId ? (
                                  <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt={video.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center"><Image className="w-5 h-5 text-muted-foreground/40" /></div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-foreground truncate">{video.title}</p>
                                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{video.url}</p>
                              </div>
                              <button onClick={() => handleRemoveTutorialVideo(video.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button onClick={handleSaveTutorial} disabled={savingTutorial} className="w-full gradient-primary text-primary-foreground">{savingTutorial ? "Salvando..." : "Salvar Tudo"}</Button>
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

      {/* Create User Dialog */}
      <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar Usuário</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <p className="text-xs text-muted-foreground -mt-1">Informe pelo menos o <strong>nome de usuário</strong> ou o <strong>e-mail</strong>. A senha é obrigatória.</p>
            <div>
              <Label>Nome de usuário</Label>
              <Input value={createUserForm.nome} onChange={(e) => setCreateUserForm({ ...createUserForm, nome: e.target.value })} placeholder="Ex: João Silva" className="mt-1" />
            </div>
            <div>
              <Label>E-mail <span className="text-muted-foreground font-normal">(opcional se informar o nome)</span></Label>
              <Input type="email" value={createUserForm.email} onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })} placeholder="email@exemplo.com" className="mt-1" />
            </div>
            <div>
              <Label>Senha <span className="text-destructive text-xs">*</span></Label>
              <Input type="password" value={createUserForm.password} onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })} placeholder="Mínimo 6 caracteres" className="mt-1" />
            </div>
            <div>
              <Label>WhatsApp <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input value={createUserForm.whatsapp} onChange={(e) => setCreateUserForm({ ...createUserForm, whatsapp: e.target.value })} placeholder="(11) 99999-9999" className="mt-1" />
            </div>
            <Button onClick={handleCreateUser} disabled={creatingUser} className="gradient-primary text-primary-foreground">{creatingUser ? "Criando..." : "Criar Usuário"}</Button>
          </div>
        </DialogContent>
      </Dialog>

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
