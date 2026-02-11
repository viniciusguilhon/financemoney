import { useState } from "react";
import { Plus, Search, Filter, ArrowUpRight, ArrowDownRight, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const categorias = [
  "Mercado", "Farmácia", "Energia", "Água", "Wi-Fi", "Combustível",
  "Carro", "Moto", "Academia", "Pets", "Celular", "Lazer",
  "Moradia", "Transporte", "Saúde", "Educação", "Outros",
];

interface Transaction {
  id: number;
  data: string;
  categoria: string;
  descricao: string;
  valor: number;
  tipo: "entrada" | "saida";
  conta: string;
  pago: boolean;
  parcelas?: number;
  parcelaAtual?: number;
}

const mockTransactions: Transaction[] = [
  { id: 1, data: "2026-02-10", categoria: "Mercado", descricao: "Supermercado Dia", valor: 245.90, tipo: "saida", conta: "Nubank", pago: true },
  { id: 2, data: "2026-02-05", categoria: "Receita", descricao: "Salário", valor: 6200.00, tipo: "entrada", conta: "Itaú", pago: true },
  { id: 3, data: "2026-02-08", categoria: "Moradia", descricao: "Conta de Luz", valor: 189.50, tipo: "saida", conta: "Nubank", pago: true },
  { id: 4, data: "2026-02-09", categoria: "Transporte", descricao: "Uber", valor: 32.40, tipo: "saida", conta: "Nubank", pago: false },
  { id: 5, data: "2026-02-07", categoria: "Receita", descricao: "Freelance", valor: 1500.00, tipo: "entrada", conta: "Nubank", pago: true },
  { id: 6, data: "2026-02-06", categoria: "Saúde", descricao: "Farmácia", valor: 87.30, tipo: "saida", conta: "C6 Bank", pago: true },
  { id: 7, data: "2026-02-04", categoria: "Lazer", descricao: "Netflix", valor: 39.90, tipo: "saida", conta: "Nubank", pago: true, parcelas: 1 },
  { id: 8, data: "2026-02-03", categoria: "Educação", descricao: "Curso Online", valor: 297.00, tipo: "saida", conta: "Itaú", pago: false, parcelas: 3, parcelaAtual: 1 },
];

const Lancamentos = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [parcelado, setParcelado] = useState(false);

  const [form, setForm] = useState({
    data: "", categoria: "", descricao: "", valor: "", tipo: "saida" as "entrada" | "saida",
    conta: "", parcelas: "1",
  });

  const filtered = transactions.filter((t) =>
    t.descricao.toLowerCase().includes(search.toLowerCase()) ||
    t.categoria.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = () => {
    const newTx: Transaction = {
      id: Date.now(),
      data: form.data,
      categoria: form.categoria,
      descricao: form.descricao,
      valor: parseFloat(form.valor),
      tipo: form.tipo,
      conta: form.conta,
      pago: false,
      parcelas: parcelado ? parseInt(form.parcelas) : undefined,
      parcelaAtual: parcelado ? 1 : undefined,
    };
    setTransactions([newTx, ...transactions]);
    setOpen(false);
    setForm({ data: "", categoria: "", descricao: "", valor: "", tipo: "saida", conta: "", parcelas: "1" });
    setParcelado(false);
  };

  const togglePago = (id: number) => {
    setTransactions(transactions.map((t) =>
      t.id === id ? { ...t, pago: !t.pago } : t
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Lançamentos</h1>
          <p className="text-muted-foreground text-sm mt-1">Registre suas receitas e despesas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground hover:opacity-90 gap-2">
              <Plus className="w-4 h-4" /> Novo Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Novo Lançamento</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data</Label>
                  <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as "entrada" | "saida" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <Input placeholder="Ex: Supermercado" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Valor (R$)</Label>
                  <Input type="number" step="0.01" placeholder="0,00" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {categorias.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Conta / Banco</Label>
                <Select value={form.conta} onValueChange={(v) => setForm({ ...form, conta: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nubank">Nubank</SelectItem>
                    <SelectItem value="Itaú">Itaú</SelectItem>
                    <SelectItem value="C6 Bank">C6 Bank</SelectItem>
                    <SelectItem value="Bradesco">Bradesco</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Parcelado?</Label>
                <Switch checked={parcelado} onCheckedChange={setParcelado} />
              </div>
              {parcelado && (
                <div>
                  <Label>Número de parcelas</Label>
                  <Input type="number" min="2" max="48" value={form.parcelas} onChange={(e) => setForm({ ...form, parcelas: e.target.value })} />
                </div>
              )}
              <Button onClick={handleSubmit} className="gradient-primary text-primary-foreground hover:opacity-90 w-full">
                Salvar Lançamento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar transações..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Transactions List */}
      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <div className="divide-y divide-border">
          {filtered.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  tx.tipo === "entrada" ? "bg-accent" : "bg-destructive/10"
                }`}>
                  {tx.tipo === "entrada" ? (
                    <ArrowUpRight className="w-5 h-5 text-success" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{tx.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    {tx.categoria} • {tx.conta} • {new Date(tx.data + "T12:00:00").toLocaleDateString("pt-BR")}
                    {tx.parcelas && tx.parcelas > 1 && ` • ${tx.parcelaAtual}/${tx.parcelas}x`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${
                  tx.tipo === "entrada" ? "text-success" : "text-destructive"
                }`}>
                  {tx.tipo === "entrada" ? "+" : "-"}R$ {tx.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
                <button
                  onClick={() => togglePago(tx.id)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${
                    tx.pago
                      ? "bg-success border-success text-primary-foreground"
                      : "border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  {tx.pago ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Lancamentos;
