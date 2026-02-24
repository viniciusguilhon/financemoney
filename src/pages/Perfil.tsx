import { useState, useEffect, useRef } from "react";
import { User, Lock, Palette, Trash2, Camera, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import ConfirmDialog from "@/components/ConfirmDialog";
import ImageCropper from "@/components/ImageCropper";
import { toast } from "@/hooks/use-toast";

const Perfil = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      supabase.from("profiles").select("nome, avatar_url").eq("id", user.id).single().then(({ data }) => {
        if (data) {
          setName(data.nome || "");
          setAvatarUrl(data.avatar_url || null);
        }
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ nome: name }).eq("id", user.id);
    toast({ title: "Perfil atualizado!" });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropperSrc(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCroppedUpload = async (croppedFile: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const path = `${user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, croppedFile, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: newUrl }).eq("id", user.id);
      setAvatarUrl(newUrl);
      toast({ title: "Foto atualizada!" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar foto", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user) return;
    setUploading(true);
    try {
      await supabase.storage.from("avatars").remove([`${user.id}/avatar.jpg`]);
      await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
      setAvatarUrl(null);
      toast({ title: "Foto removida!" });
    } catch (err: any) {
      toast({ title: "Erro ao remover foto", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPw.length < 6) {
      toast({ title: "Senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (newPw !== confirmPw) {
      toast({ title: "Senhas não coincidem", variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Senha alterada com sucesso!" });
      setNewPw("");
      setConfirmPw("");
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl md:text-3xl font-display font-bold text-foreground">Perfil</h1>
        <p className="text-muted-foreground text-xs md:text-sm mt-1">Gerencie suas informações pessoais</p>
      </div>

      {/* Avatar */}
      <div className="bg-card rounded-xl p-4 md:p-6 shadow-card">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full relative overflow-hidden flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full gradient-primary flex items-center justify-center text-primary-foreground">
                <User className="w-8 h-8 md:w-10 md:h-10" />
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="w-5 h-5 text-white" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base md:text-lg font-display font-bold text-foreground truncate">{name || "Usuário"}</p>
            <p className="text-xs md:text-sm text-muted-foreground truncate">{email}</p>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="text-xs gap-1.5">
                <Camera className="w-3.5 h-3.5" /> {uploading ? "Enviando..." : "Alterar foto"}
              </Button>
              {avatarUrl && (
                <Button size="sm" variant="outline" onClick={handleDeleteAvatar} disabled={uploading} className="text-xs gap-1.5 text-destructive hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" /> Remover
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-card rounded-xl p-4 md:p-6 shadow-card space-y-4">
        <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-2">
          <User className="w-4 h-4 text-primary" /> Informações Pessoais
        </h3>
        <div className="grid gap-4">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} disabled className="opacity-60" />
          </div>
          <Button onClick={handleSaveProfile} className="gradient-primary text-primary-foreground w-fit" size="sm">Salvar Alterações</Button>
        </div>
      </div>

      {/* Password */}
      <div className="bg-card rounded-xl p-4 md:p-6 shadow-card space-y-4">
        <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" /> Alterar Senha
        </h3>
        <div className="grid gap-4">
          <div>
            <Label>Nova Senha</Label>
            <div className="relative">
              <Input type={showPw ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} className="pr-10" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label>Confirmar Nova Senha</Label>
            <Input type={showPw ? "text" : "password"} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
          </div>
          <Button onClick={handleChangePassword} className="gradient-primary text-primary-foreground w-fit" size="sm">Alterar Senha</Button>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-card rounded-xl p-4 md:p-6 shadow-card space-y-4">
        <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" /> Preferências
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs md:text-sm font-medium text-foreground">Modo Escuro</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">Alternar entre tema claro e escuro</p>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-card rounded-xl p-4 md:p-6 shadow-card border border-destructive/20 space-y-4">
        <h3 className="font-display font-semibold text-destructive text-sm flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Zona de Perigo
        </h3>
        <p className="text-xs md:text-sm text-muted-foreground">Uma vez excluída, sua conta não poderá ser recuperada.</p>
        <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>Excluir Minha Conta</Button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => { setDeleteOpen(false); signOut(); }}
        title="Excluir conta?"
        description="Esta ação é irreversível. Todos os seus dados serão permanentemente removidos."
      />

      <ImageCropper
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageSrc={cropperSrc}
        onCropComplete={handleCroppedUpload}
        circular
      />
    </div>
  );
};

export default Perfil;