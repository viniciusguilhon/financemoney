import { useState } from "react";
import { User, Mail, Lock, Palette, Trash2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeContext";
import { Switch } from "@/components/ui/switch";
import ConfirmDialog from "@/components/ConfirmDialog";

const Perfil = () => {
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState("Usuário");
  const [email, setEmail] = useState("usuario@email.com");
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie suas informações pessoais</p>
      </div>

      {/* Avatar */}
      <div className="bg-card rounded-xl p-6 shadow-card">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-primary-foreground relative">
            <User className="w-10 h-10" />
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-card shadow-card flex items-center justify-center border border-border">
              <Camera className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          <div>
            <p className="text-lg font-display font-bold text-foreground">{name}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-card rounded-xl p-6 shadow-card space-y-4">
        <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
          <User className="w-5 h-5 text-primary" /> Informações Pessoais
        </h3>
        <div className="grid gap-4">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button className="gradient-primary text-primary-foreground w-fit">Salvar Alterações</Button>
        </div>
      </div>

      {/* Password */}
      <div className="bg-card rounded-xl p-6 shadow-card space-y-4">
        <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" /> Alterar Senha
        </h3>
        <div className="grid gap-4">
          <div><Label>Senha Atual</Label><Input type="password" /></div>
          <div><Label>Nova Senha</Label><Input type="password" /></div>
          <div><Label>Confirmar Nova Senha</Label><Input type="password" /></div>
          <Button className="gradient-primary text-primary-foreground w-fit">Alterar Senha</Button>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-card rounded-xl p-6 shadow-card space-y-4">
        <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" /> Preferências
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Modo Escuro</p>
            <p className="text-xs text-muted-foreground">Alternar entre tema claro e escuro</p>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-card rounded-xl p-6 shadow-card border border-destructive/20 space-y-4">
        <h3 className="font-display font-semibold text-destructive flex items-center gap-2">
          <Trash2 className="w-5 h-5" /> Zona de Perigo
        </h3>
        <p className="text-sm text-muted-foreground">Uma vez excluída, sua conta não poderá ser recuperada.</p>
        <Button variant="destructive" onClick={() => setDeleteOpen(true)}>Excluir Minha Conta</Button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => setDeleteOpen(false)}
        title="Excluir conta?"
        description="Esta ação é irreversível. Todos os seus dados serão permanentemente removidos."
      />
    </div>
  );
};

export default Perfil;
