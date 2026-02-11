import { useState } from "react";
import { Landmark, Plus, ArrowLeftRight, Pencil, Trash2, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinance, Bank, Bill } from "@/contexts/FinanceContext";
import MonthYearSelector from "@/components/MonthYearSelector";
import ConfirmDialog from "@/components/ConfirmDialog";

const bankColors = ["hsl(280, 60%, 50%)", "hsl(25, 90%, 50%)", "hsl(0, 0%, 15%)", "hsl(0, 72%, 50%)", "hsl(152, 60%, 42%)"];

const Bancos = () => {
  const { banks, addBank, updateBank, deleteBank, getMonthBills, addBill, updateBill, deleteBill, currentMesAno } = useFinance();
  const monthBills = getMonthBills();
  const [bankOpen, setBankOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "bank" | "bill"; id: string } | null>(null);

  const [bankForm, setBankForm] = useState({ nome: "", saldo: "", cor: bankColors[0] });
  const [billForm, setBillForm] = useState({ desc: "", valor: "", vencimento: "", tipo: "pagar" as "pagar" | "receber" });

  const totalSaldo = banks.reduce((acc, b) => acc + b.saldo, 0);

  const resetBankForm = () => { setBankForm({ nome: "", saldo: "", cor: bankColors[0] }); setEditingBankId(null); };
  const resetBillForm = () => { setBillForm({ desc: "", valor: "", vencimento: "", tipo: "pagar" }); setEditingBillId(null); };

  const handleBankSubmit = () => {
    if (!bankForm.nome) return;
    const data = { nome: bankForm.nome, saldo: parseFloat(bankForm.saldo) || 0, cor: bankForm.cor };
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
            <DialogContent className="sm:max-w-sm">
              <DialogHeader><DialogTitle>{editingBankId ? "Editar Banco" : "Nova Conta Bancária"}</DialogTitle></DialogHeader>
              <div className="grid gap-3 py-2">
                <div><Label>Nome do Banco</Label><Input value={bankForm.nome} onChange={(e) => setBankForm({ ...bankForm, nome: e.target.value })} /></div>
                <div><Label>Saldo Inicial (R$)</Label><Input type="number" step="0.01" value={bankForm.saldo} onChange={(e) => setBankForm({ ...bankForm, saldo: e.target.value })} /></div>
                <div>
                  <Label>Cor</Label>
                  <div className="flex gap-2 mt-1">
                    {bankColors.map((c) => (
                      <button key={c} onClick={() => setBankForm({ ...bankForm, cor: c })} className={`w-8 h-8 rounded-full border-2 ${bankForm.cor === c ? "border-primary" : "border-transparent"}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <Button onClick={handleBankSubmit} className="gradient-primary text-primary-foreground w-full">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="gradient-hero rounded-xl p-6 text-primary-foreground">
        <p className="text-sm opacity-80">Saldo Total</p>
        <p className="text-3xl font-display font-bold mt-1">R$ {totalSaldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
      </div>

      {banks.length === 0 ? (
        <div className="bg-card rounded-xl p-12 shadow-card text-center text-muted-foreground">Nenhuma conta bancária cadastrada.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {banks.map((bank) => (
            <div key={bank.id} className="bg-card rounded-xl p-5 shadow-card animate-fade-in relative group">
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setBankForm({ nome: bank.nome, saldo: bank.saldo.toString(), cor: bank.cor }); setEditingBankId(bank.id); setBankOpen(true); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDeleteTarget({ type: "bank", id: bank.id })} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${bank.cor}20` }}>
                  <Landmark className="w-5 h-5" style={{ color: bank.cor }} />
                </div>
                <span className="font-medium text-foreground">{bank.nome}</span>
              </div>
              <p className="text-xl font-display font-bold text-foreground">R$ {bank.saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
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
                  <span className="text-sm font-semibold text-destructive">R$ {c.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
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
                  <span className="text-sm font-semibold text-success">R$ {c.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
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
