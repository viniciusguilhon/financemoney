import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ImageCropper from "@/components/ImageCropper";
import { toast } from "@/hooks/use-toast";

const WelcomeDialog = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("nome").eq("id", user.id).single().then(({ data }) => {
      if (data && (!data.nome || data.nome.trim() === "")) {
        setOpen(true);
      }
    });
  }, [user]);

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

  const handleCropComplete = (file: File) => {
    setCroppedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user || !name.trim()) {
      toast({ title: "Digite seu nome", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      // Update name
      await supabase.from("profiles").update({ nome: name.trim() }).eq("id", user.id);

      // Upload avatar if selected
      if (croppedFile) {
        const path = `${user.id}/avatar.jpg`;
        await supabase.storage.from("avatars").upload(path, croppedFile, { upsert: true });
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;
        await supabase.from("profiles").update({ avatar_url: newUrl }).eq("id", user.id);
      }

      toast({ title: `Bem-vindo(a), ${name.trim()}! 🎉` });
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-sm [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="font-display text-center text-xl">Bem-vindo ao Money! 🎉</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-center">
            Para começar, nos diga seu nome e adicione uma foto de perfil.
          </p>
          <div className="flex flex-col items-center gap-4 py-2">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full gradient-primary flex items-center justify-center text-primary-foreground">
                    <User className="w-10 h-10" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            </div>

            {/* Name */}
            <div className="w-full space-y-1.5">
              <Label>Seu nome</Label>
              <Input
                placeholder="Como devemos te chamar?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground">
              {saving ? "Salvando..." : "Começar a usar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ImageCropper
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageSrc={cropperSrc}
        onCropComplete={handleCropComplete}
        circular
      />
    </>
  );
};

export default WelcomeDialog;
