import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinance, Bank, BANK_LOGOS } from "@/contexts/FinanceContext";
import MonthYearSelector from "@/components/MonthYearSelector";
import ConfirmDialog from "@/components/ConfirmDialog";

const Bancos = () => {
  const { banks, addBank, updateBank, deleteBank, getMonthBills, addBill, updateBill, deleteBill, currentMesAno } = useFinance();
  const monthBills = getMonthBills();
  const [bankOpen, setBankOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "bank" | "bill"; id: string } | null>(null);

  const [bankForm, setBankForm] = useState({ nome: "", saldo: "", logo: "nubank" });
  const [billForm, setBillForm] = useState({ desc: "", valor: "", vencimento: "", tipo: "pagar" as "pagar" | "receber" });

  const totalSaldo = banks.reduce((acc, b) => acc + b.saldo, 0);

  const resetBankForm = () => { setBankForm({ nome: "", saldo: "", logo: "nubank" }); setEditingBankId(null); };
  const resetBillForm = () => { setBillForm({ desc: "", valor: "", vencimento: "", tipo: "pagar" }); setEditingBillId(null); };

  const handleBankSubmit = () => {
    if (!bankForm.nome) return;
    const logoInfo = BANK_LOGOS[bankForm.logo] || BANK_LOGOS.outro;
    const data = { nome: bankForm.nome, saldo: parseFloat(bankForm.saldo) || 0, cor: logoInfo.color, logo: bankForm.logo };
    if (editingBankId) updateBank(editingBankId, data);
    else addBank(data);
    setBankOpen(false);
    resetBankForm();
  };

  const handleBillSubmit = () => {
    if (!billForm.desc || !billForm.valor) return;
    const data = { desc: billForm.desc, valor: parseFloat(billForm.valor), vencimento: billForm.vencimento, pago: false, tipo: billForm.tipo, mesAno: currentMesAno };
    if (editingBillId) updateBill(editingBillId, data);
    else addBill(data);
    setBillOpen(false);
    resetBillForm();
  };

  const contasPagar = monthBills.filter((b) => b.tipo === "pagar");
  const contasReceber = monthBills.filter((b) => b.tipo === "receber");

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const BankLogo = ({ logoKey, size = 40 }: { logoKey?: string; size?: number }) => {
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
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Bancos e Contas</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie suas contas bancárias</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <MonthYearSelector />
          <Dialog open={billOpen} onOpenChange={(o) => { setBillOpen(o); if (!o) resetBillForm(); }}>
            <DialogTrigger asChild><Button variant="outline" className="gap-2"><Plus className="w-4 h-4" /> Conta</Button></DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader><DialogTitle>{editingBillId ? "Editar Conta" : "Nova Conta a Pagar/Receber"}</DialogTitle></DialogHeader>
              <div className="grid gap-3 py-2">
                <div><Label>Descrição</Label><Input value={billForm.desc} onChange={(e) => setBillForm({ ...billForm, desc: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={billForm.valor} onChange={(e) => setBillForm({ ...billForm, valor: e.target.value })} /></div>
                  <div>
                    <Label>Tipo</Label>
                    <Select value={billForm.tipo} onValueChange={(v) => setBillForm({ ...billForm, tipo: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="pagar">A Pagar</SelectItem><SelectItem value="receber">A Receber</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Vencimento</Label><Input type="date" value={billForm.vencimento} onChange={(e) => setBillForm({ ...billForm, vencimento: e.target.value })} /></div>
                <Button onClick={handleBillSubmit} className="gradient-primary text-primary-foreground w-full">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
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
                <div><Label>Nome da Conta</Label><Input value={bankForm.nome} onChange={(e) => setBankForm({ ...bankForm, nome: e.target.value })} placeholder="Ex: Conta Corrente Nubank" /></div>
                <div><Label>Saldo Atual (R$)</Label><Input type="number" step="0.01" value={bankForm.saldo} onChange={(e) => setBankForm({ ...bankForm, saldo: e.target.value })} placeholder="0,00" /></div>
                <Button onClick={handleBankSubmit} className="gradient-primary text-primary-foreground w-full">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
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
                <button onClick={() => { setBankForm({ nome: bank.nome, saldo: bank.saldo.toString(), logo: bank.logo || "outro" }); setEditingBankId(bank.id); setBankOpen(true); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDeleteTarget({ type: "bank", id: bank.id })} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <BankLogo logoKey={bank.logo} size={44} />
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

      {/* Contas a Pagar */}
      <div className="bg-card rounded-xl p-5 shadow-card">
        <h3 className="font-display font-semibold text-foreground mb-4">Contas a Pagar</h3>
        {contasPagar.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">Nenhuma conta a pagar neste mês.</p>
        ) : (
          <div className="divide-y divide-border">
            {contasPagar.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{c.desc}</p>
                  <p className="text-xs text-muted-foreground">Vencimento: {c.vencimento ? new Date(c.vencimento + "T12:00:00").toLocaleDateString("pt-BR") : "-"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-destructive">{fmt(c.valor)}</span>
                  <button onClick={() => updateBill(c.id, { pago: !c.pago })} className={`text-xs px-2 py-1 rounded-full font-medium cursor-pointer ${c.pago ? "bg-accent text-accent-foreground" : "bg-warning/10 text-warning"}`}>
                    {c.pago ? "Pago" : "Pendente"}
                  </button>
                  <button onClick={() => { setBillForm({ desc: c.desc, valor: c.valor.toString(), vencimento: c.vencimento, tipo: c.tipo }); setEditingBillId(c.id); setBillOpen(true); }} className="p-1 rounded hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteTarget({ type: "bill", id: c.id })} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contas a Receber */}
      <div className="bg-card rounded-xl p-5 shadow-card">
        <h3 className="font-display font-semibold text-foreground mb-4">Contas a Receber</h3>
        {contasReceber.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">Nenhuma conta a receber neste mês.</p>
        ) : (
          <div className="divide-y divide-border">
            {contasReceber.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{c.desc}</p>
                  <p className="text-xs text-muted-foreground">Vencimento: {c.vencimento ? new Date(c.vencimento + "T12:00:00").toLocaleDateString("pt-BR") : "-"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-success">{fmt(c.valor)}</span>
                  <button onClick={() => updateBill(c.id, { pago: !c.pago })} className={`text-xs px-2 py-1 rounded-full font-medium cursor-pointer ${c.pago ? "bg-accent text-accent-foreground" : "bg-warning/10 text-warning"}`}>
                    {c.pago ? "Recebido" : "Pendente"}
                  </button>
                  <button onClick={() => { setBillForm({ desc: c.desc, valor: c.valor.toString(), vencimento: c.vencimento, tipo: c.tipo }); setEditingBillId(c.id); setBillOpen(true); }} className="p-1 rounded hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteTarget({ type: "bill", id: c.id })} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            if (deleteTarget.type === "bank") deleteBank(deleteTarget.id);
            else deleteBill(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
};

export default Bancos;
