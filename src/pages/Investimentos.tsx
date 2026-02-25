import { useState } from "react";
import { TrendingUp, Plus, Pencil, Trash2, Bitcoin, Store, ShoppingBag, Globe, Briefcase, BarChart3, PieChart as PieChartIcon, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFinance, Investment } from "@/contexts/FinanceContext";
import ConfirmDialog from "@/components/ConfirmDialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const invColors = ["hsl(152, 60%, 42%)", "hsl(215, 50%, 18%)", "hsl(38, 92%, 55%)", "hsl(280, 60%, 55%)", "hsl(0, 72%, 55%)", "hsl(200, 50%, 55%)", "hsl(320, 60%, 50%)", "hsl(45, 80%, 50%)"];

const invCategories = [
  { value: "Renda Fixa", icon: Briefcase, label: "Renda Fixa" },
  { value: "Renda Variável", icon: BarChart3, label: "Renda Variável" },
  { value: "Fundos Imobiliários", icon: Store, label: "Fundos Imobiliários" },
  { value: "Criptomoedas", icon: Bitcoin, label: "Criptomoedas" },
  { value: "NFTs", icon: Layers, label: "NFTs" },
  { value: "Negócio Local", icon: Store, label: "Negócio Local" },
  { value: "Negócio Digital", icon: Globe, label: "Negócio Digital" },
  { value: "Venda de Produtos", icon: ShoppingBag, label: "Venda de Produtos" },
  { value: "Infoprodutos", icon: Globe, label: "Infoprodutos" },
  { value: "Outros", icon: TrendingUp, label: "Outros" },
];

const Investimentos = () => {
  const { investments, addInvestment, updateInvestment, deleteInvestment } = useFinance();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState("Todos");
  const [form, setForm] = useState({ nome: "", categoria: "Renda Fixa", investido: "", retorno: "", data: "", cor: invColors[0], outroNome: "" });

  const totalInvestido = investments.reduce((acc, i) => acc + i.investido, 0);
  const totalRetorno = investments.reduce((acc, i) => acc + i.retorno, 0);
  const totalPatrimonio = totalInvestido + totalRetorno;
  const rentabilidade = totalInvestido > 0 ? ((totalRetorno / totalInvestido) * 100).toFixed(1) : "0.0";

  const filtered = filterCat === "Todos" ? investments : investments.filter((i) => i.categoria === filterCat);

  const resetForm = () => { setForm({ nome: "", categoria: "Renda Fixa", investido: "", retorno: "", data: "", cor: invColors[0], outroNome: "" }); setEditingId(null); };

  const openEdit = (inv: Investment) => {
    setForm({ nome: inv.nome, categoria: inv.categoria, investido: inv.investido.toString(), retorno: inv.retorno.toString(), data: inv.data, cor: inv.cor, outroNome: "" });
    setEditingId(inv.id);
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.nome || !form.investido) return;
    if (form.categoria === "Outros" && !form.outroNome.trim()) return;
    const finalCategoria = form.categoria === "Outros" ? `Outros: ${form.outroNome.trim()}` : form.categoria;
    const data = {
      nome: form.nome, categoria: finalCategoria,
      investido: parseFloat(form.investido), retorno: parseFloat(form.retorno) || 0,
      data: form.data, cor: form.cor,
    };
    if (editingId) updateInvestment(editingId, data);
    else addInvestment(data);
    setOpen(false);
    resetForm();
  };

  // Charts data
  const evolucaoData = filtered.map((inv) => ({
    nome: inv.nome.length > 8 ? inv.nome.slice(0, 8) + "…" : inv.nome,
    investido: inv.investido,
    retorno: inv.retorno,
  }));

  // Category breakdown for pie chart
  const catMap = new Map<string, number>();
  investments.forEach((inv) => {
    catMap.set(inv.categoria, (catMap.get(inv.categoria) || 0) + inv.investido);
  });
  const pieData = Array.from(catMap.entries()).map(([name, value], i) => ({
    name, value, color: invColors[i % invColors.length],
  }));

  // Performance ranking
  const perfRanking = [...investments]
    .filter((i) => i.investido > 0)
    .map((i) => ({ ...i, perf: (i.retorno / i.investido) * 100 }))
    .sort((a, b) => b.perf - a.perf);

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const getCatIcon = (cat: string) => {
    const found = invCategories.find((c) => c.value === cat);
    return found ? found.icon : TrendingUp;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-display font-bold text-foreground">Investimentos</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">Investimentos, negócios e rendimentos</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground hover:opacity-90 gap-2" size="sm">
              <Plus className="w-4 h-4" /> Novo Investimento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display">{editingId ? "Editar Investimento" : "Novo Investimento"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Tesouro Selic, Loja Online..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoria</Label>
                  <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v, outroNome: "" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{invCategories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Data</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
              </div>
              {form.categoria === "Outros" && (
                <div>
                  <Label>Qual tipo de investimento?</Label>
                  <Input value={form.outroNome} onChange={(e) => setForm({ ...form, outroNome: e.target.value })} placeholder="Ex: Ações internacionais, Forex..." />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Valor Investido (R$)</Label><Input type="number" step="0.01" value={form.investido} onChange={(e) => setForm({ ...form, investido: e.target.value })} /></div>
                <div><Label>Retorno (R$)</Label><Input type="number" step="0.01" value={form.retorno} onChange={(e) => setForm({ ...form, retorno: e.target.value })} /></div>
              </div>
              <div>
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {invColors.map((c) => (
                    <button key={c} onClick={() => setForm({ ...form, cor: c })} className={`w-7 h-7 rounded-full border-2 ${form.cor === c ? "border-primary scale-110" : "border-transparent"} transition-transform`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <Button onClick={handleSubmit} className="gradient-primary text-primary-foreground w-full">{editingId ? "Salvar" : "Adicionar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl p-3 md:p-4 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 80% 20%, white, transparent 50%)" }} />
          <p className="text-[10px] md:text-xs opacity-80 relative z-[1]">Total Investido</p>
          <p className="text-base md:text-2xl font-display font-bold mt-1 relative z-[1] truncate">{fmt(totalInvestido)}</p>
        </div>
        <div className="bg-card rounded-xl p-3 md:p-4 shadow-card border border-border">
          <p className="text-[10px] md:text-xs text-muted-foreground">Retorno Total</p>
          <p className={`text-base md:text-2xl font-display font-bold mt-1 truncate ${totalRetorno >= 0 ? "text-success" : "text-destructive"}`}>
            {totalRetorno >= 0 ? "+" : ""}{fmt(totalRetorno)}
          </p>
        </div>
        <div className="bg-card rounded-xl p-3 md:p-4 shadow-card border border-border">
          <p className="text-[10px] md:text-xs text-muted-foreground">Patrimônio Total</p>
          <p className="text-base md:text-2xl font-display font-bold mt-1 text-foreground truncate">{fmt(totalPatrimonio)}</p>
        </div>
        <div className="bg-card rounded-xl p-3 md:p-4 shadow-card border border-border">
          <p className="text-[10px] md:text-xs text-muted-foreground">Rentabilidade</p>
          <p className={`text-base md:text-2xl font-display font-bold mt-1 ${parseFloat(rentabilidade) >= 0 ? "text-success" : "text-destructive"}`}>
            {rentabilidade}%
          </p>
        </div>
      </div>

      {investments.length === 0 ? (
        <div className="bg-card rounded-xl p-12 shadow-card text-center text-muted-foreground">
          Nenhum investimento cadastrado. Adicione seu primeiro investimento!
        </div>
      ) : (
        <Tabs defaultValue="visao" className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="visao" className="gap-1.5 text-xs"><BarChart3 className="w-3.5 h-3.5" /> Visão Geral</TabsTrigger>
            <TabsTrigger value="lista" className="gap-1.5 text-xs"><Layers className="w-3.5 h-3.5" /> Meus Ativos</TabsTrigger>
            <TabsTrigger value="analise" className="gap-1.5 text-xs"><PieChartIcon className="w-3.5 h-3.5" /> Análise</TabsTrigger>
          </TabsList>

          <TabsContent value="visao" className="space-y-4 mt-4">
            {/* Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button onClick={() => setFilterCat("Todos")} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterCat === "Todos" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                Todos
              </button>
              {Array.from(new Set(investments.map((i) => i.categoria))).map((cat) => (
                <button key={cat} onClick={() => setFilterCat(cat)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterCat === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                  {cat}
                </button>
              ))}
            </div>

            <div className="bg-card rounded-xl p-4 md:p-5 shadow-card border border-border">
              <h3 className="font-display font-semibold text-foreground text-sm mb-4">Investido vs Retorno</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={evolucaoData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="nome" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <Tooltip formatter={(value: number) => [fmt(value), ""]} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }} />
                  <Bar dataKey="investido" fill="hsl(152, 60%, 42%)" radius={[4, 4, 0, 0]} name="Investido" />
                  <Bar dataKey="retorno" fill="hsl(38, 92%, 55%)" radius={[4, 4, 0, 0]} name="Retorno" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="lista" className="space-y-4 mt-4">
            {/* Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button onClick={() => setFilterCat("Todos")} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterCat === "Todos" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                Todos
              </button>
              {Array.from(new Set(investments.map((i) => i.categoria))).map((cat) => (
                <button key={cat} onClick={() => setFilterCat(cat)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterCat === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                  {cat}
                </button>
              ))}
            </div>

            <div className="bg-card rounded-xl p-4 md:p-5 shadow-card border border-border">
              <h3 className="font-display font-semibold text-foreground text-sm mb-4">Meus Investimentos & Negócios</h3>
              <div className="divide-y divide-border">
                {filtered.map((inv) => {
                  const CatIcon = getCatIcon(inv.categoria);
                  const perf = inv.investido > 0 ? ((inv.retorno / inv.investido) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={inv.id} className="flex items-center justify-between py-3 gap-2">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${inv.cor}20` }}>
                          <CatIcon className="w-4 h-4 md:w-5 md:h-5" style={{ color: inv.cor }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs md:text-sm font-medium text-foreground truncate">{inv.nome}</p>
                          <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                            {inv.categoria}{inv.data && ` • ${new Date(inv.data + "T12:00:00").toLocaleDateString("pt-BR")}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-xs md:text-sm font-semibold text-foreground whitespace-nowrap">{fmt(inv.investido)}</p>
                          <p className={`text-[10px] md:text-xs font-medium whitespace-nowrap ${inv.retorno >= 0 ? "text-success" : "text-destructive"}`}>
                            {inv.retorno >= 0 ? "+" : ""}{fmt(inv.retorno)} ({perf}%)
                          </p>
                        </div>
                        <button onClick={() => openEdit(inv)} className="p-1 md:p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteId(inv.id)} className="p-1 md:p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analise" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Pie chart by category */}
              <div className="bg-card rounded-xl p-4 md:p-5 shadow-card border border-border">
                <h3 className="font-display font-semibold text-foreground text-sm mb-4">Distribuição por Categoria</h3>
                {pieData.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">Sem dados</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" strokeWidth={0}>
                          {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(value: number) => [fmt(value), ""]} contentStyle={{ borderRadius: 12, border: "none" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                      {pieData.map((cat) => (
                        <div key={cat.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Performance ranking */}
              <div className="bg-card rounded-xl p-4 md:p-5 shadow-card border border-border">
                <h3 className="font-display font-semibold text-foreground text-sm mb-4">Ranking de Rentabilidade</h3>
                {perfRanking.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">Sem dados</p>
                ) : (
                  <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                    {perfRanking.map((inv, i) => {
                      const maxPerf = perfRanking[0].perf;
                      const barW = maxPerf > 0 ? (Math.abs(inv.perf) / Math.max(maxPerf, 1)) * 100 : 0;
                      return (
                        <div key={inv.id}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-foreground font-medium truncate mr-2">{i + 1}. {inv.nome}</span>
                            <span className={`text-xs font-bold whitespace-nowrap ${inv.perf >= 0 ? "text-success" : "text-destructive"}`}>{inv.perf.toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barW}%`, backgroundColor: inv.cor }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={() => { if (deleteId) { deleteInvestment(deleteId); setDeleteId(null); } }} />
    </div>
  );
};

export default Investimentos;