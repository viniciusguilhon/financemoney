import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Plus, Trash2, Upload, Lock, CreditCard, Building2, MessageCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface BankTemplate {
  id: string;
  nome: string;
  logo_url: string | null;
  cor: string;
  abbr: string;
}

interface CardTemplate {
  id: string;
  nome: string;
  image_url: string | null;
  bandeira: string;
}

interface WhatsAppConfig {
  enabled: boolean;
  url: string;
  label: string;
  color: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const Admin = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [bankTemplates, setBankTemplates] = useState<BankTemplate[]>([]);
  const [cardTemplates, setCardTemplates] = useState<CardTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  // Bank form
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [bankForm, setBankForm] = useState({ nome: "", cor: "hsl(215, 50%, 50%)", abbr: "" });
  const [bankImageFile, setBankImageFile] = useState<File | null>(null);
  const [bankImagePreview, setBankImagePreview] = useState("");
  const bankFileRef = useRef<HTMLInputElement>(null);

  // Card form
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [cardForm, setCardForm] = useState({ nome: "", bandeira: "Mastercard" });
  const [cardImageFile, setCardImageFile] = useState<File | null>(null);
  const [cardImagePreview, setCardImagePreview] = useState("");
  const cardFileRef = useRef<HTMLInputElement>(null);

  // WhatsApp config
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig>({
    enabled: false, url: "", label: "Suporte", color: "hsl(142, 70%, 45%)",
  });
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  const bandeiras = ["Mastercard", "Visa", "Elo", "Amex", "Hipercard"];

  const adminFetch = async (method: string, type: string, body?: any) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-templates?type=${type}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": adminPassword,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro");
    }
    return res.json();
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
        const data = await res.json();
        setBankTemplates(data);
        const cardRes = await fetch(`${SUPABASE_URL}/functions/v1/admin-templates?type=card`, {
          headers: { "x-admin-password": password },
        });
        if (cardRes.ok) setCardTemplates(await cardRes.json());
        // Load WhatsApp config
        const settingsRes = await fetch(`${SUPABASE_URL}/functions/v1/admin-templates?type=settings&key=whatsapp_support`);
        if (settingsRes.ok) {
          const cfg = await settingsRes.json();
          setWhatsappConfig(cfg);
        }
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
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.readAsDataURL(file);
    });
    const data = await adminFetch("POST", type, {
      action: "upload-image",
      fileName: file.name,
      fileBase64: base64,
      contentType: file.type,
    });
    return data.url;
  };

  const handleAddBank = async () => {
    if (!bankForm.nome || !bankForm.abbr) return;
    try {
      setLoading(true);
      let logo_url = null;
      if (bankImageFile) {
        logo_url = await uploadImage(bankImageFile, "bank");
      }
      const data = await adminFetch("POST", "bank", {
        action: "create",
        template: { nome: bankForm.nome, cor: bankForm.cor, abbr: bankForm.abbr, logo_url },
      });
      setBankTemplates((prev) => [...prev, data]);
      setBankDialogOpen(false);
      setBankForm({ nome: "", cor: "hsl(215, 50%, 50%)", abbr: "" });
      setBankImageFile(null);
      setBankImagePreview("");
      toast({ title: "Banco adicionado!" });
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    if (!cardForm.nome) return;
    try {
      setLoading(true);
      let image_url = null;
      if (cardImageFile) {
        image_url = await uploadImage(cardImageFile, "card");
      }
      const data = await adminFetch("POST", "card", {
        action: "create",
        template: { nome: cardForm.nome, bandeira: cardForm.bandeira, image_url },
      });
      setCardTemplates((prev) => [...prev, data]);
      setCardDialogOpen(false);
      setCardForm({ nome: "", bandeira: "Mastercard" });
      setCardImageFile(null);
      setCardImagePreview("");
      toast({ title: "Cartão adicionado!" });
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string, type: "bank" | "card") => {
    try {
      await adminFetch("POST", type, { action: "delete", id });
      if (type === "bank") setBankTemplates((prev) => prev.filter((t) => t.id !== id));
      else setCardTemplates((prev) => prev.filter((t) => t.id !== id));
      toast({ title: "Removido!" });
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    }
  };

  const handleSaveWhatsapp = async () => {
    try {
      setSavingWhatsapp(true);
      await adminFetch("POST", "settings", {
        action: "update",
        key: "whatsapp_support",
        value: whatsappConfig,
      });
      toast({ title: "Configuração salva!" });
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setSavingWhatsapp(false);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (s: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

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
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Painel Administrador</h1>
            <p className="text-sm text-muted-foreground">Gerencie templates e configurações</p>
          </div>
          <Button variant="outline" onClick={() => { setAuthenticated(false); setAdminPassword(""); setPassword(""); }}>
            Sair
          </Button>
        </div>

        <Tabs defaultValue="banks" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="banks" className="gap-2"><Building2 className="w-4 h-4" /> Bancos</TabsTrigger>
            <TabsTrigger value="cards" className="gap-2"><CreditCard className="w-4 h-4" /> Cartões</TabsTrigger>
            <TabsTrigger value="settings" className="gap-2"><Settings className="w-4 h-4" /> Config</TabsTrigger>
          </TabsList>

          <TabsContent value="banks" className="space-y-4 mt-4">
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
                      <Button type="button" variant="outline" size="sm" onClick={() => bankFileRef.current?.click()} className="gap-2">
                        <Upload className="w-4 h-4" /> Upload
                      </Button>
                    </div>
                  </div>
                  <Button onClick={handleAddBank} disabled={loading} className="gradient-primary text-primary-foreground">
                    {loading ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bankTemplates.map((t) => (
                <div key={t.id} className="bg-card rounded-2xl p-4 border border-border shadow-card flex items-center gap-3 group">
                  {t.logo_url ? (
                    <img src={t.logo_url} alt={t.nome} className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-primary-foreground font-bold" style={{ backgroundColor: t.cor }}>
                      {t.abbr}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{t.nome}</p>
                    <p className="text-xs text-muted-foreground">{t.abbr}</p>
                  </div>
                  <button onClick={() => handleDeleteTemplate(t.id, "bank")} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {bankTemplates.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">Nenhum banco cadastrado ainda.</p>}
            </div>
          </TabsContent>

          <TabsContent value="cards" className="space-y-4 mt-4">
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
                    <select
                      value={cardForm.bandeira}
                      onChange={(e) => setCardForm({ ...cardForm, bandeira: e.target.value })}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {bandeiras.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Imagem do Cartão</Label>
                    <div className="flex items-center gap-3 mt-2">
                      {cardImagePreview && <img src={cardImagePreview} alt="Preview" className="w-20 h-12 rounded-lg object-cover border border-border" />}
                      <input ref={cardFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setCardImageFile, setCardImagePreview)} />
                      <Button type="button" variant="outline" size="sm" onClick={() => cardFileRef.current?.click()} className="gap-2">
                        <Upload className="w-4 h-4" /> Upload
                      </Button>
                    </div>
                  </div>
                  <Button onClick={handleAddCard} disabled={loading} className="gradient-primary text-primary-foreground">
                    {loading ? "Salvando..." : "Salvar"}
                  </Button>
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
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{t.nome}</p>
                    <p className="text-xs text-muted-foreground">{t.bandeira}</p>
                  </div>
                  <button onClick={() => handleDeleteTemplate(t.id, "card")} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {cardTemplates.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">Nenhum cartão cadastrado ainda.</p>}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6 mt-4">
            <div className="bg-card rounded-2xl p-6 border border-border shadow-card space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: whatsappConfig.color }}>
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">Botão de Suporte WhatsApp</h3>
                  <p className="text-xs text-muted-foreground">Configure o botão de suporte que aparece no menu lateral</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Ativar botão</Label>
                <Switch
                  checked={whatsappConfig.enabled}
                  onCheckedChange={(checked) => setWhatsappConfig({ ...whatsappConfig, enabled: checked })}
                />
              </div>

              <div>
                <Label>URL do WhatsApp</Label>
                <Input
                  value={whatsappConfig.url}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, url: e.target.value })}
                  placeholder="https://wa.me/5511999999999"
                  className="mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Use o formato: https://wa.me/NUMERO</p>
              </div>

              <div>
                <Label>Nome do botão</Label>
                <Input
                  value={whatsappConfig.label}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, label: e.target.value })}
                  placeholder="Suporte"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Cor do botão (HSL)</Label>
                <div className="flex items-center gap-3 mt-1">
                  <Input
                    value={whatsappConfig.color}
                    onChange={(e) => setWhatsappConfig({ ...whatsappConfig, color: e.target.value })}
                    placeholder="hsl(142, 70%, 45%)"
                  />
                  <div className="w-10 h-10 rounded-lg flex-shrink-0 border border-border" style={{ backgroundColor: whatsappConfig.color }} />
                </div>
              </div>

              <Button onClick={handleSaveWhatsapp} disabled={savingWhatsapp} className="w-full gradient-primary text-primary-foreground">
                {savingWhatsapp ? "Salvando..." : "Salvar Configuração"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
