import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinance, Bank } from "@/contexts/FinanceContext";
import { supabase } from "@/integrations/supabase/client";
import ConfirmDialog from "@/components/ConfirmDialog";
import BankLogo, { BankTemplate } from "@/components/BankLogo";

const Bancos = () => {
  const { banks, addBank, updateBank, deleteBank } = useFinance();
  const [bankOpen, setBankOpen] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<BankTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<BankTemplate | null>(null);
  const [bankForm, setBankForm] = useState({ nome: "", saldo: "" });

  useEffect(() => {
    let mounted = true;
    supabase.from("bank_templates").select("*").order("nome").then(({ data }) => {
      if (data && mounted) setTemplates(data as BankTemplate[]);
    });
    return () => { mounted = false; };
  }, []);

  const totalSaldo = useMemo(() => banks.reduce((acc, b) => acc + b.saldo, 0), [banks]);

  const resetBankForm = useCallback(() => {
    setBankForm({ nome: "", saldo: "" });
    setSelectedTemplate(null);
    setEditingBankId(null);
  }, []);

  const handleBankSubmit = useCallback(() => {
    if (!selectedTemplate && !editingBankId) return;
    const template = selectedTemplate || templates.find((t) => t.nome === banks.find((b) => b.id === editingBankId)?.nome);
    const data = {
      nome: selectedTemplate?.nome || bankForm.nome,
      saldo: parseFloat(bankForm.saldo) || 0,
      cor: template?.cor || "",
      logo: template?.nome || "",
      customLogo: template?.logo_url || undefined,
    };
    if (editingBankId) updateBank(editingBankId, { ...data, saldo: parseFloat(bankForm.saldo) || 0 });
    else addBank(data);
    setBankOpen(false);
    resetBankForm();
  }, [selectedTemplate, editingBankId, templates, banks, bankForm, addBank, updateBank, resetBankForm]);

  const fmt = useCallback((v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, []);

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
          <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md rounded-2xl">
            <DialogHeader><DialogTitle>{editingBankId ? "Editar Banco" : "Nova Conta Bancária"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              {!editingBankId && (
                <div>
                  <Label>Selecione o Banco</Label>
                  {templates.length === 0 ? (
                    <p className="text-sm text-muted-foreground mt-2">Nenhum banco disponível. O administrador precisa cadastrá-los primeiro.</p>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-2">
                      {templates.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedTemplate(t);
                            setBankForm({ ...bankForm, nome: t.nome });
                          }}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                            selectedTemplate?.id === t.id ? "border-primary bg-accent" : "border-border hover:border-primary/40"
                          }`}
                        >
                          {t.logo_url ? (
                            <img src={t.logo_url} alt={t.nome} className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground font-bold text-[10px]"
                              style={{ backgroundColor: t.cor }}
                            >
                              {t.abbr}
                            </div>
                          )}
                          <span className="text-[10px] text-muted-foreground truncate w-full text-center">{t.nome}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div>
                <Label>Nome da Conta</Label>
                <Input
                  value={bankForm.nome}
                  onChange={(e) => setBankForm({ ...bankForm, nome: e.target.value })}
                  placeholder="Ex: Conta Corrente Nubank"
                  readOnly={!editingBankId && !!selectedTemplate}
                />
              </div>
              <div>
                <Label>Saldo Atual (R$)</Label>
                <Input type="number" step="0.01" value={bankForm.saldo} onChange={(e) => setBankForm({ ...bankForm, saldo: e.target.value })} placeholder="0,00" />
              </div>
              <Button onClick={handleBankSubmit} className="gradient-primary text-primary-foreground w-full" disabled={!editingBankId && !selectedTemplate}>
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Saldo Total */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 80% 20%, white, transparent 50%)" }} />
        <p className="text-sm opacity-80 relative z-[1]">Saldo Total</p>
        <p className="text-3xl font-display font-bold mt-1 relative z-[1]">{fmt(totalSaldo)}</p>
        <p className="text-xs opacity-60 mt-1 relative z-[1]">{banks.length} conta(s) cadastrada(s)</p>
      </div>

      {/* Bank Cards */}
      {banks.length === 0 ? (
        <div className="bg-card rounded-xl p-12 shadow-card text-center text-muted-foreground">Nenhuma conta bancária cadastrada.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {banks.map((bank) => (
            <div key={bank.id} className="bg-card rounded-2xl p-5 shadow-elevated animate-fade-in relative group border border-border">
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setBankForm({ nome: bank.nome, saldo: bank.saldo.toString() }); setEditingBankId(bank.id); setBankOpen(true); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDeleteId(bank.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <BankLogo bank={bank} templates={templates} size={44} />
                <div>
                  <span className="font-semibold text-foreground text-sm">{bank.nome}</span>
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
