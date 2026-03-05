import { useState, useRef } from "react";
import { Plus, Search, ArrowUpRight, ArrowDownRight, Check, Clock, Pencil, Trash2, Receipt, Target, Upload, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useFinance, Transaction, SavingsGoal } from "@/contexts/FinanceContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import MonthYearSelector from "@/components/MonthYearSelector";
import ConfirmDialog from "@/components/ConfirmDialog";
import ImageCropper from "@/components/ImageCropper";

const Lancamentos = () => {
  const {
    getMonthTransactions, addTransaction, updateTransaction, deleteTransaction,
    categories, banks, currentMesAno,
    addCategory,
    getMonthBills, addBill, updateBill, deleteBill,
    savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal,
  } = useFinance();
  const { user } = useAuth();
  const monthTx = getMonthTransactions();
  const monthBills = getMonthBills();
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [filterCategoria, setFilterCategoria] = useState<string>("todas");
  const [filterConta, setFilterConta] = useState<string>("todas");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [open, setOpen] = useState(false);
  const [parcelado, setParcelado] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [newCat, setNewCat] = useState({ nome: "", tipo: "saida" as "entrada" | "saida" | "ambos" });

  // Bills state
  const [billOpen, setBillOpen] = useState(false);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [deleteBillId, setDeleteBillId] = useState<string | null>(null);
  const [billForm, setBillForm] = useState({ desc: "", valor: "", vencimento: "", tipo: "pagar" as "pagar" | "receber" });

  // Savings goal state
  const [goalOpen, setGoalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  const [goalForm, setGoalForm] = useState({ nome: "", descricao: "", valorAlvo: "", valorAtual: "" });
  const [goalImageFile, setGoalImageFile] = useState<File | null>(null);
  const [goalImagePreview, setGoalImagePreview] = useState("");
  const [goalUploading, setGoalUploading] = useState(false);
  const [goalCropperOpen, setGoalCropperOpen] = useState(false);
  const [goalCropperSrc, setGoalCropperSrc] = useState("");
  const goalFileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    data: "", categoria: "", descricao: "", valor: "", tipo: "saida" as "entrada" | "saida",
    conta: "", parcelas: "1",
  });

  const filtered = monthTx.filter((t) => {
    const matchSearch = t.descricao.toLowerCase().includes(search.toLowerCase()) || t.categoria.toLowerCase().includes(search.toLowerCase());
    const matchTipo = filterTipo === "todos" || t.tipo === filterTipo;
    const matchCategoria = filterCategoria === "todas" || t.categoria === filterCategoria;
    const matchConta = filterConta === "todas" || t.conta === filterConta;
    const matchStatus = filterStatus === "todos" || (filterStatus === "pago" ? t.pago : !t.pago);
    return matchSearch && matchTipo && matchCategoria && matchConta && matchStatus;
  });

  const resetForm = () => {
    setForm({ data: "", categoria: "", descricao: "", valor: "", tipo: "saida", conta: "", parcelas: "1" });
    setParcelado(false);
    setEditingId(null);
  };

  const resetBillForm = () => { setBillForm({ desc: "", valor: "", vencimento: "", tipo: "pagar" }); setEditingBillId(null); };

  const resetGoalForm = () => {
    setGoalForm({ nome: "", descricao: "", valorAlvo: "", valorAtual: "" });
    setGoalImageFile(null);
    setGoalImagePreview("");
    setEditingGoalId(null);
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

  const handleBillSubmit = () => {
    if (!billForm.desc || !billForm.valor) return;
    const data = { desc: billForm.desc, valor: parseFloat(billForm.valor), vencimento: billForm.vencimento, pago: false, tipo: billForm.tipo, mesAno: currentMesAno };
    if (editingBillId) updateBill(editingBillId, data);
    else addBill(data);
    setBillOpen(false);
    resetBillForm();
  };

  const handleGoalSubmit = async () => {
    if (!goalForm.nome || !goalForm.valorAlvo) return;
    setGoalUploading(true);
    try {
      let imageUrl: string | undefined;
      if (goalImageFile && user) {
        const ext = goalImageFile.name.split('.').pop();
        const path = `${user.id}/goal-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("avatars").upload(path, goalImageFile, { upsert: true });
        if (!error) {
          const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
          imageUrl = urlData.publicUrl;
        }
      }
      const goalData = {
        nome: goalForm.nome,
        descricao: goalForm.descricao,
        valorAlvo: parseFloat(goalForm.valorAlvo),
        valorAtual: parseFloat(goalForm.valorAtual || "0"),
        imageUrl,
      };
      if (editingGoalId) {
        updateSavingsGoal(editingGoalId, goalData);
      } else {
        addSavingsGoal(goalData);
      }
      setGoalOpen(false);
      resetGoalForm();
    } finally {
      setGoalUploading(false);
    }
  };

  const openEditGoal = (g: SavingsGoal) => {
    setGoalForm({ nome: g.nome, descricao: g.descricao, valorAlvo: g.valorAlvo.toString(), valorAtual: g.valorAtual.toString() });
    setGoalImagePreview(g.imageUrl || "");
    setEditingGoalId(g.id);
    setGoalOpen(true);
  };

  const togglePago = (id: string) => {
    const tx = monthTx.find((t) => t.id === id);
    if (tx) updateTransaction(id, { pago: !tx.pago });
  };

  const filteredCategories = categories.filter((c) =>
    form.tipo === "entrada" ? c.tipo === "entrada" || c.tipo === "ambos" : c.tipo === "saida" || c.tipo === "ambos"
  );

  const contasPagar = monthBills.filter((b) => b.tipo === "pagar");
  const contasReceber = monthBills.filter((b) => b.tipo === "receber");
  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-5 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-display font-bold text-foreground">Lançamentos</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">Registre suas receitas, despesas, contas e metas</p>
        </div>
        <MonthYearSelector />
      </div>

      <Tabs defaultValue="transacoes" className="w-full overflow-hidden">
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="transacoes" className="gap-1.5 text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-4 flex-shrink-0"><ArrowUpRight className="w-4 h-4" /> Transações</TabsTrigger>
          <TabsTrigger value="contas" className="gap-1.5 text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-4 flex-shrink-0"><Receipt className="w-4 h-4" /> Contas</TabsTrigger>
          <TabsTrigger value="metas" className="gap-1.5 text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-4 flex-shrink-0"><Target className="w-4 h-4" /> Metas</TabsTrigger>
        </TabsList>

        {/* Tab: Transações */}
        <TabsContent value="transacoes" className="space-y-4 mt-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar transações..." className="pl-10 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            <div className="flex items-center gap-2">
              <Dialog open={catOpen} onOpenChange={setCatOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 text-xs">
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
                  <Button className="gradient-primary text-primary-foreground hover:opacity-90 gap-1.5 text-xs" size="sm">
                    <Plus className="w-3.5 h-3.5" /> Novo Lançamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-[130px] h-8 text-xs"><Filter className="w-3 h-3 mr-1" /><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="saida">Saídas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas categorias</SelectItem>
                  {[...new Set(monthTx.map(t => t.categoria))].map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterConta} onValueChange={setFilterConta}>
                <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Conta" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas contas</SelectItem>
                  {[...new Set(monthTx.map(t => t.conta))].map(conta => (
                    <SelectItem key={conta} value={conta}>{conta}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos status</SelectItem>
                  <SelectItem value="pago">Pagos</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-card overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">Nenhum lançamento encontrado neste mês.</div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 md:p-4 hover:bg-muted/50 transition-colors gap-2">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.tipo === "entrada" ? "bg-accent" : "bg-destructive/10"}`}>
                        {tx.tipo === "entrada" ? <ArrowUpRight className="w-4 h-4 text-success" /> : <ArrowDownRight className="w-4 h-4 text-destructive" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{tx.descricao}</p>
                        <p className="text-[11px] md:text-xs text-muted-foreground truncate">
                          {tx.categoria} • {tx.conta} • {new Date(tx.data + "T12:00:00").toLocaleDateString("pt-BR")}
                          {tx.parcelas && tx.parcelas > 1 && ` • ${tx.parcelaAtual}/${tx.parcelas}x`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                      <span className={`text-xs md:text-sm font-semibold whitespace-nowrap ${tx.tipo === "entrada" ? "text-success" : "text-destructive"}`}>
                        {tx.tipo === "entrada" ? "+" : "-"}R$ {tx.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                      <button onClick={() => togglePago(tx.id)} className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center border-2 transition-colors flex-shrink-0 ${tx.pago ? "bg-success border-success text-primary-foreground" : "border-muted-foreground/30 text-muted-foreground"}`}>
                        {tx.pago ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      </button>
                      <button onClick={() => openEdit(tx)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(tx.id)} className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab: Contas a Pagar/Receber */}
        <TabsContent value="contas" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={billOpen} onOpenChange={(o) => { setBillOpen(o); if (!o) resetBillForm(); }}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground hover:opacity-90 gap-1.5 text-xs" size="sm"><Plus className="w-3.5 h-3.5" /> Nova Conta</Button>
              </DialogTrigger>
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
          </div>

          <div className="bg-card rounded-xl p-4 md:p-5 shadow-card border border-border">
            <h3 className="font-display font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-destructive" /> Contas a Pagar
            </h3>
            {contasPagar.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhuma conta a pagar neste mês.</p>
            ) : (
              <div className="divide-y divide-border">
                {contasPagar.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-3 gap-2">
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-medium text-foreground truncate">{c.desc}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">Vencimento: {c.vencimento ? new Date(c.vencimento + "T12:00:00").toLocaleDateString("pt-BR") : "-"}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs md:text-sm font-semibold text-destructive whitespace-nowrap">{fmt(c.valor)}</span>
                      <button onClick={() => updateBill(c.id, { pago: !c.pago })} className={`text-[10px] md:text-xs px-2 py-0.5 md:py-1 rounded-full font-medium cursor-pointer whitespace-nowrap ${c.pago ? "bg-accent text-accent-foreground" : "bg-warning/10 text-warning"}`}>
                        {c.pago ? "Pago" : "Pendente"}
                      </button>
                      <button onClick={() => { setBillForm({ desc: c.desc, valor: c.valor.toString(), vencimento: c.vencimento, tipo: c.tipo }); setEditingBillId(c.id); setBillOpen(true); }} className="p-1 rounded hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteBillId(c.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl p-4 md:p-5 shadow-card border border-border">
            <h3 className="font-display font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-success" /> Contas a Receber
            </h3>
            {contasReceber.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhuma conta a receber neste mês.</p>
            ) : (
              <div className="divide-y divide-border">
                {contasReceber.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-3 gap-2">
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-medium text-foreground truncate">{c.desc}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">Vencimento: {c.vencimento ? new Date(c.vencimento + "T12:00:00").toLocaleDateString("pt-BR") : "-"}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs md:text-sm font-semibold text-success whitespace-nowrap">{fmt(c.valor)}</span>
                      <button onClick={() => updateBill(c.id, { pago: !c.pago })} className={`text-[10px] md:text-xs px-2 py-0.5 md:py-1 rounded-full font-medium cursor-pointer whitespace-nowrap ${c.pago ? "bg-accent text-accent-foreground" : "bg-warning/10 text-warning"}`}>
                        {c.pago ? "Recebido" : "Pendente"}
                      </button>
                      <button onClick={() => { setBillForm({ desc: c.desc, valor: c.valor.toString(), vencimento: c.vencimento, tipo: c.tipo }); setEditingBillId(c.id); setBillOpen(true); }} className="p-1 rounded hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteBillId(c.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab: Metas de Economia */}
        <TabsContent value="metas" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={goalOpen} onOpenChange={(o) => { setGoalOpen(o); if (!o) resetGoalForm(); }}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground hover:opacity-90 gap-1.5 text-xs" size="sm"><Plus className="w-3.5 h-3.5" /> Nova Meta</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="font-display">{editingGoalId ? "Editar Meta" : "Nova Meta de Economia"}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-2">
                  <div><Label>O que deseja comprar?</Label><Input placeholder="Ex: iPhone 16" value={goalForm.nome} onChange={(e) => setGoalForm({ ...goalForm, nome: e.target.value })} /></div>
                  <div><Label>Descrição</Label><Input placeholder="Descrição da meta" value={goalForm.descricao} onChange={(e) => setGoalForm({ ...goalForm, descricao: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Valor Total (R$)</Label><Input type="number" step="0.01" placeholder="0,00" value={goalForm.valorAlvo} onChange={(e) => setGoalForm({ ...goalForm, valorAlvo: e.target.value })} /></div>
                    <div><Label>Já Economizado (R$)</Label><Input type="number" step="0.01" placeholder="0,00" value={goalForm.valorAtual} onChange={(e) => setGoalForm({ ...goalForm, valorAtual: e.target.value })} /></div>
                  </div>
                  <div>
                    <Label>Imagem do Item</Label>
                    <div className="flex items-center gap-3 mt-2">
                      {goalImagePreview && <img src={goalImagePreview} alt="Preview" className="w-14 h-14 rounded-xl object-cover border border-border" />}
                      <input ref={goalFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setGoalCropperSrc(reader.result as string);
                            setGoalCropperOpen(true);
                          };
                          reader.readAsDataURL(file);
                          e.target.value = "";
                        }
                      }} />
                      <Button type="button" variant="outline" size="sm" onClick={() => goalFileRef.current?.click()} className="gap-1.5 text-xs">
                        <Upload className="w-3.5 h-3.5" /> Upload
                      </Button>
                      {goalImagePreview && (
                        <Button type="button" variant="outline" size="sm" onClick={() => { setGoalImageFile(null); setGoalImagePreview(""); }} className="gap-1.5 text-xs text-destructive hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" /> Remover
                        </Button>
                      )}
                    </div>
                  </div>
                  <Button onClick={handleGoalSubmit} disabled={goalUploading} className="gradient-primary text-primary-foreground w-full">
                    {goalUploading ? "Salvando..." : editingGoalId ? "Salvar Alterações" : "Criar Meta"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {savingsGoals.length === 0 ? (
            <div className="bg-card rounded-xl p-12 shadow-card text-center">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Nenhuma meta cadastrada ainda.</p>
              <p className="text-xs text-muted-foreground mt-1">Crie uma meta para acompanhar seu progresso!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savingsGoals.map((goal) => {
                const pct = goal.valorAlvo > 0 ? Math.min((goal.valorAtual / goal.valorAlvo) * 100, 100) : 0;
                return (
                  <div key={goal.id} className="bg-card rounded-xl p-4 md:p-5 shadow-card border border-border space-y-3">
                    <div className="flex items-start gap-3">
                      {goal.imageUrl ? (
                        <img src={goal.imageUrl} alt={goal.nome} className="w-14 h-14 md:w-16 md:h-16 rounded-xl object-cover border border-border flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Target className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm font-bold text-foreground truncate">{goal.nome}</p>
                        <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 truncate">{goal.descricao}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => openEditGoal(goal)} className="p-1 md:p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteGoalId(goal.id)} className="p-1 md:p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] md:text-xs mb-2">
                        <span className="text-muted-foreground">{fmt(goal.valorAtual)}</span>
                        <span className="font-semibold text-foreground">{fmt(goal.valorAlvo)}</span>
                      </div>
                      <Progress value={pct} className="h-2.5 md:h-3" />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[10px] md:text-xs font-semibold text-primary">{pct.toFixed(0)}% concluído</span>
                        <span className="text-[10px] md:text-xs text-muted-foreground">Falta: {fmt(Math.max(goal.valorAlvo - goal.valorAtual, 0))}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={() => { if (deleteId) { deleteTransaction(deleteId); setDeleteId(null); } }}
      />
      <ConfirmDialog
        open={!!deleteBillId}
        onOpenChange={(o) => !o && setDeleteBillId(null)}
        onConfirm={() => { if (deleteBillId) { deleteBill(deleteBillId); setDeleteBillId(null); } }}
      />
      <ConfirmDialog
        open={!!deleteGoalId}
        onOpenChange={(o) => !o && setDeleteGoalId(null)}
        onConfirm={() => { if (deleteGoalId) { deleteSavingsGoal(deleteGoalId); setDeleteGoalId(null); } }}
      />

      <ImageCropper
        open={goalCropperOpen}
        onOpenChange={setGoalCropperOpen}
        imageSrc={goalCropperSrc}
        onCropComplete={(croppedFile) => {
          setGoalImageFile(croppedFile);
          const reader = new FileReader();
          reader.onloadend = () => setGoalImagePreview(reader.result as string);
          reader.readAsDataURL(croppedFile);
        }}
      />
    </div>
  );
};

export default Lancamentos;