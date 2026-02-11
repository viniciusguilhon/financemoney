import { useState } from "react";
import { Plus, Search, ArrowUpRight, ArrowDownRight, Check, Clock, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useFinance, Transaction } from "@/contexts/FinanceContext";
import MonthYearSelector from "@/components/MonthYearSelector";
import ConfirmDialog from "@/components/ConfirmDialog";

const Lancamentos = () => {
  const {
    getMonthTransactions, addTransaction, updateTransaction, deleteTransaction,
    categories, banks, currentMesAno,
    addCategory,
  } = useFinance();
  const monthTx = getMonthTransactions();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [parcelado, setParcelado] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [newCat, setNewCat] = useState({ nome: "", tipo: "saida" as "entrada" | "saida" | "ambos" });

  const [form, setForm] = useState({
    data: "", categoria: "", descricao: "", valor: "", tipo: "saida" as "entrada" | "saida",
    conta: "", parcelas: "1",
  });

  const filtered = monthTx.filter((t) =>
    t.descricao.toLowerCase().includes(search.toLowerCase()) ||
    t.categoria.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setForm({ data: "", categoria: "", descricao: "", valor: "", tipo: "saida", conta: "", parcelas: "1" });
    setParcelado(false);
    setEditingId(null);
  };

  const openEdit = (tx: Transaction) => {
    setForm({
      data: tx.data, categoria: tx.categoria, descricao: tx.descricao,
      valor: tx.valor.toString(), tipo: tx.tipo, conta: tx.conta,
      parcelas: tx.parcelas?.toString() || "1",
    });
    setParcelado(!!tx.parcelas && tx.parcelas > 1);
    setEditingId(tx.id);
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.data || !form.descricao || !form.valor) return;
    const txData = {
      data: form.data,
      categoria: form.categoria || "Outros",
      descricao: form.descricao,
      valor: parseFloat(form.valor),
      tipo: form.tipo,
      conta: form.conta || "Geral",
      pago: false,
      parcelas: parcelado ? parseInt(form.parcelas) : undefined,
      parcelaAtual: parcelado ? 1 : undefined,
      mesAno: currentMesAno,
    };
    if (editingId) {
      updateTransaction(editingId, txData);
    } else {
      addTransaction(txData);
    }
    setOpen(false);
    resetForm();
  };

  const togglePago = (id: string) => {
    const tx = monthTx.find((t) => t.id === id);
    if (tx) updateTransaction(id, { pago: !tx.pago });
  };

  const filteredCategories = categories.filter((c) =>
    form.tipo === "entrada" ? c.tipo === "entrada" || c.tipo === "ambos" : c.tipo === "saida" || c.tipo === "ambos"
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Lançamentos</h1>
          <p className="text-muted-foreground text-sm mt-1">Registre suas receitas e despesas</p>
        </div>
        <div className="flex items-center gap-2">
          <MonthYearSelector />
          <Dialog open={catOpen} onOpenChange={setCatOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Plus className="w-3 h-3" /> Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader><DialogTitle>Nova Categoria</DialogTitle></DialogHeader>
              <div className="grid gap-3 py-2">
                <div><Label>Nome</Label><Input value={newCat.nome} onChange={(e) => setNewCat({ ...newCat, nome: e.target.value })} /></div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={newCat.tipo} onValueChange={(v) => setNewCat({ ...newCat, tipo: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                      <SelectItem value="ambos">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => { if (newCat.nome) { addCategory(newCat); setCatOpen(false); setNewCat({ nome: "", tipo: "saida" }); } }} className="gradient-primary text-primary-foreground">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground hover:opacity-90 gap-2">
                <Plus className="w-4 h-4" /> Novo Lançamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">{editingId ? "Editar Lançamento" : "Novo Lançamento"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Data</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
                  <div>
                    <Label>Tipo</Label>
                    <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as "entrada" | "saida" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="entrada">Entrada</SelectItem><SelectItem value="saida">Saída</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Descrição</Label><Input placeholder="Ex: Supermercado" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Valor (R$)</Label><Input type="number" step="0.01" placeholder="0,00" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} /></div>
                  <div>
                    <Label>Categoria</Label>
                    <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {filteredCategories.map((c) => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Conta / Banco</Label>
                  <Select value={form.conta} onValueChange={(v) => setForm({ ...form, conta: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {banks.length > 0
                        ? banks.map((b) => <SelectItem key={b.id} value={b.nome}>{b.nome}</SelectItem>)
                        : <SelectItem value="Geral">Geral</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Parcelado?</Label>
                  <Switch checked={parcelado} onCheckedChange={setParcelado} />
                </div>
                {parcelado && (
                  <div><Label>Número de parcelas</Label><Input type="number" min="2" max="48" value={form.parcelas} onChange={(e) => setForm({ ...form, parcelas: e.target.value })} /></div>
                )}
                <Button onClick={handleSubmit} className="gradient-primary text-primary-foreground hover:opacity-90 w-full">
                  {editingId ? "Salvar Alterações" : "Salvar Lançamento"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar transações..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">Nenhum lançamento encontrado neste mês.</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tx.tipo === "entrada" ? "bg-accent" : "bg-destructive/10"}`}>
                    {tx.tipo === "entrada" ? <ArrowUpRight className="w-5 h-5 text-success" /> : <ArrowDownRight className="w-5 h-5 text-destructive" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{tx.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.categoria} • {tx.conta} • {new Date(tx.data + "T12:00:00").toLocaleDateString("pt-BR")}
                      {tx.parcelas && tx.parcelas > 1 && ` • ${tx.parcelaAtual}/${tx.parcelas}x`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${tx.tipo === "entrada" ? "text-success" : "text-destructive"}`}>
                    {tx.tipo === "entrada" ? "+" : "-"}R$ {tx.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                  <button onClick={() => togglePago(tx.id)} className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${tx.pago ? "bg-success border-success text-primary-foreground" : "border-muted-foreground/30 text-muted-foreground"}`}>
                    {tx.pago ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => openEdit(tx)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteId(tx.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={() => { if (deleteId) { deleteTransaction(deleteId); setDeleteId(null); } }}
      />
    </div>
  );
};

export default Lancamentos;
