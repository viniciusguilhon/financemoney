import { useState } from "react";
import { TrendingUp, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinance, Investment } from "@/contexts/FinanceContext";
import ConfirmDialog from "@/components/ConfirmDialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const invColors = ["hsl(152, 60%, 42%)", "hsl(215, 50%, 18%)", "hsl(38, 92%, 55%)", "hsl(280, 60%, 55%)", "hsl(0, 72%, 55%)"];
const invCategories = ["Renda Fixa", "Renda Variável", "Fundos Imobiliários", "Criptomoedas", "Negócios", "Outros"];

const Investimentos = () => {
  const { investments, addInvestment, updateInvestment, deleteInvestment } = useFinance();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", categoria: "Renda Fixa", investido: "", retorno: "", data: "", cor: invColors[0] });

  const totalInvestido = investments.reduce((acc, i) => acc + i.investido, 0);
  const totalRetorno = investments.reduce((acc, i) => acc + i.retorno, 0);

  const resetForm = () => { setForm({ nome: "", categoria: "Renda Fixa", investido: "", retorno: "", data: "", cor: invColors[0] }); setEditingId(null); };

  const openEdit = (inv: Investment) => {
    setForm({ nome: inv.nome, categoria: inv.categoria, investido: inv.investido.toString(), retorno: inv.retorno.toString(), data: inv.data, cor: inv.cor });
    setEditingId(inv.id);
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.nome || !form.investido) return;
    const data = {
      nome: form.nome, categoria: form.categoria,
      investido: parseFloat(form.investido), retorno: parseFloat(form.retorno) || 0,
      data: form.data, cor: form.cor,
    };
    if (editingId) updateInvestment(editingId, data);
    else addInvestment(data);
    setOpen(false);
    resetForm();
  };

  // Evolution chart
  const evolucaoData = investments.map((inv) => ({
    nome: inv.nome.length > 10 ? inv.nome.slice(0, 10) + "…" : inv.nome,
    investido: inv.investido,
    retorno: inv.retorno,
  }));

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Investimentos</h1>
          <p className="text-muted-foreground text-sm mt-1">Acompanhe seus investimentos e negócios</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground hover:opacity-90 gap-2">
              <Plus className="w-4 h-4" /> Novo Investimento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle className="font-display">{editingId ? "Editar Investimento" : "Novo Investimento"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Tesouro Selic" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoria</Label>
                  <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{invCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Data</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Valor Investido (R$)</Label><Input type="number" step="0.01" value={form.investido} onChange={(e) => setForm({ ...form, investido: e.target.value })} /></div>
                <div><Label>Retorno (R$)</Label><Input type="number" step="0.01" value={form.retorno} onChange={(e) => setForm({ ...form, retorno: e.target.value })} /></div>
              </div>
              <div>
                <Label>Cor</Label>
                <div className="flex gap-2 mt-1">
                  {invColors.map((c) => (
                    <button key={c} onClick={() => setForm({ ...form, cor: c })} className={`w-8 h-8 rounded-full border-2 ${form.cor === c ? "border-primary" : "border-transparent"}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <Button onClick={handleSubmit} className="gradient-primary text-primary-foreground w-full">{editingId ? "Salvar" : "Adicionar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 80% 20%, white, transparent 50%)" }} />
          <p className="text-sm opacity-80 relative z-[1]">Total Investido</p>
          <p className="text-3xl font-display font-bold mt-1 relative z-[1]">{fmt(totalInvestido)}</p>
        </div>
        <div className="bg-card rounded-xl p-6 shadow-card">
          <p className="text-sm text-muted-foreground">Retorno Total</p>
          <p className={`text-3xl font-display font-bold mt-1 ${totalRetorno >= 0 ? "text-success" : "text-destructive"}`}>
            {totalRetorno >= 0 ? "+" : ""}{fmt(totalRetorno)}
          </p>
        </div>
      </div>

      {investments.length === 0 ? (
        <div className="bg-card rounded-xl p-12 shadow-card text-center text-muted-foreground">
          Nenhum investimento cadastrado. Adicione seu primeiro investimento!
        </div>
      ) : (
        <>
          <div className="bg-card rounded-xl p-5 shadow-card">
            <h3 className="font-display font-semibold text-foreground mb-4">Visão Geral</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={evolucaoData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="nome" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <Tooltip formatter={(value: number) => [fmt(value), ""]} />
                <Bar dataKey="investido" fill="hsl(152, 60%, 42%)" radius={[4, 4, 0, 0]} name="Investido" />
                <Bar dataKey="retorno" fill="hsl(38, 92%, 55%)" radius={[4, 4, 0, 0]} name="Retorno" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-xl p-5 shadow-card">
            <h3 className="font-display font-semibold text-foreground mb-4">Meus Investimentos</h3>
            <div className="divide-y divide-border">
              {investments.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${inv.cor}20` }}>
                      <TrendingUp className="w-5 h-5" style={{ color: inv.cor }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{inv.nome}</p>
                      <p className="text-xs text-muted-foreground">{inv.categoria}{inv.data && ` • ${new Date(inv.data + "T12:00:00").toLocaleDateString("pt-BR")}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{fmt(inv.investido)}</p>
                      <p className={`text-xs font-medium ${inv.retorno >= 0 ? "text-success" : "text-destructive"}`}>
                        {inv.retorno >= 0 ? "+" : ""}{fmt(inv.retorno)}
                      </p>
                    </div>
                    <button onClick={() => openEdit(inv)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteId(inv.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={() => { if (deleteId) { deleteInvestment(deleteId); setDeleteId(null); } }} />
    </div>
  );
};

export default Investimentos;
