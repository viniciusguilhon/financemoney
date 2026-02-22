import { useState, useRef } from "react";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinance, Bank, BANK_LOGOS } from "@/contexts/FinanceContext";
import ConfirmDialog from "@/components/ConfirmDialog";

const Bancos = () => {
  const { banks, addBank, updateBank, deleteBank } = useFinance();
  const [bankOpen, setBankOpen] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [bankForm, setBankForm] = useState({ nome: "", saldo: "", logo: "nubank", customLogo: "" });
  const logoInputRef = useRef<HTMLInputElement>(null);

  const totalSaldo = banks.reduce((acc, b) => acc + b.saldo, 0);

  const resetBankForm = () => { setBankForm({ nome: "", saldo: "", logo: "nubank", customLogo: "" }); setEditingBankId(null); };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setBankForm({ ...bankForm, customLogo: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleBankSubmit = () => {
    if (!bankForm.nome) return;
    const logoInfo = BANK_LOGOS[bankForm.logo] || BANK_LOGOS.outro;
    const data = { nome: bankForm.nome, saldo: parseFloat(bankForm.saldo) || 0, cor: logoInfo.color, logo: bankForm.logo, customLogo: bankForm.customLogo || undefined };
    if (editingBankId) updateBank(editingBankId, data);
    else addBank(data);
    setBankOpen(false);
    resetBankForm();
  };

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const BankLogo = ({ logoKey, customLogo, size = 40 }: { logoKey?: string; customLogo?: string; size?: number }) => {
    if (customLogo) {
      return <img src={customLogo} alt="Logo" className="rounded-xl object-cover shadow-sm" style={{ width: size, height: size }} />;
    }
    const info = BANK_LOGOS[logoKey || "outro"] || BANK_LOGOS.outro;
    return (
      <div
        className="rounded-xl flex items-center justify-center font-bold text-primary-foreground shadow-sm"
        style={{ width: size, height: size, backgroundColor: info.color, fontSize: size * 0.3 }}
      >
        {info.abbr}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Bancos</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie suas contas bancárias</p>
        </div>
        <Dialog open={bankOpen} onOpenChange={(o) => { setBankOpen(o); if (!o) resetBankForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground hover:opacity-90 gap-2"><Plus className="w-4 h-4" /> Nova Conta</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>{editingBankId ? "Editar Banco" : "Nova Conta Bancária"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div>
                <Label>Banco</Label>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-2">
                  {Object.entries(BANK_LOGOS).map(([key, info]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setBankForm({ ...bankForm, logo: key, nome: bankForm.nome || info.name });
                      }}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                        bankForm.logo === key ? "border-primary bg-accent" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground font-bold text-[10px]"
                        style={{ backgroundColor: info.color }}
                      >
                        {info.abbr}
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate w-full text-center">{info.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Logo Personalizada (opcional)</Label>
                <div className="flex items-center gap-3 mt-2">
                  {bankForm.customLogo && (
                    <img src={bankForm.customLogo} alt="Logo" className="w-12 h-12 rounded-xl object-cover border border-border" />
                  )}
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => logoInputRef.current?.click()}>
                    <Upload className="w-4 h-4" /> {bankForm.customLogo ? "Trocar" : "Upload"}
                  </Button>
                  {bankForm.customLogo && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setBankForm({ ...bankForm, customLogo: "" })}>Remover</Button>
                  )}
                </div>
              </div>
              <div><Label>Nome da Conta</Label><Input value={bankForm.nome} onChange={(e) => setBankForm({ ...bankForm, nome: e.target.value })} placeholder="Ex: Conta Corrente Nubank" /></div>
              <div><Label>Saldo Atual (R$)</Label><Input type="number" step="0.01" value={bankForm.saldo} onChange={(e) => setBankForm({ ...bankForm, saldo: e.target.value })} placeholder="0,00" /></div>
              <Button onClick={handleBankSubmit} className="gradient-primary text-primary-foreground w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Saldo Total */}
      <div className="gradient-hero rounded-2xl p-6 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 80% 20%, white, transparent 50%)" }} />
        <p className="text-sm opacity-80">Saldo Total</p>
        <p className="text-3xl font-display font-bold mt-1">{fmt(totalSaldo)}</p>
        <p className="text-xs opacity-60 mt-1">{banks.length} conta(s) cadastrada(s)</p>
      </div>

      {/* Bank Cards */}
      {banks.length === 0 ? (
        <div className="bg-card rounded-xl p-12 shadow-card text-center text-muted-foreground">Nenhuma conta bancária cadastrada.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {banks.map((bank) => (
            <div key={bank.id} className="bg-card rounded-2xl p-5 shadow-elevated animate-fade-in relative group border border-border">
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setBankForm({ nome: bank.nome, saldo: bank.saldo.toString(), logo: bank.logo || "outro", customLogo: bank.customLogo || "" }); setEditingBankId(bank.id); setBankOpen(true); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDeleteId(bank.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <BankLogo logoKey={bank.logo} customLogo={bank.customLogo} size={44} />
                <div>
                  <span className="font-semibold text-foreground text-sm">{bank.nome}</span>
                  <p className="text-[10px] text-muted-foreground">{BANK_LOGOS[bank.logo || "outro"]?.name || "Banco"}</p>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Saldo disponível</p>
                  <p className={`text-xl font-display font-bold ${bank.saldo >= 0 ? "text-success" : "text-destructive"}`}>{fmt(bank.saldo)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={() => { if (deleteId) { deleteBank(deleteId); setDeleteId(null); } }}
      />
    </div>
  );
};

export default Bancos;
