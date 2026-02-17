import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Landmark,
  BarChart3,
  Receipt,
} from "lucide-react";
import MonthYearSelector from "@/components/MonthYearSelector";
import { useFinance } from "@/contexts/FinanceContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";

const Dashboard = () => {
  const {
    getMonthTransactions, currentMonth, currentYear, transactions,
    cards, banks, investments, getMonthBills,
  } = useFinance();

  const monthTx = getMonthTransactions();
  const monthBills = getMonthBills();

  const receitas = monthTx.filter((t) => t.tipo === "entrada").reduce((a, t) => a + t.valor, 0);
  const despesas = monthTx.filter((t) => t.tipo === "saida").reduce((a, t) => a + t.valor, 0);
  const saldo = receitas - despesas;
  const economia = receitas - despesas;

  const aPagar = monthBills.filter((b) => b.tipo === "pagar" && !b.pago).reduce((a, b) => a + b.valor, 0);
  const aReceber = monthBills.filter((b) => b.tipo === "receber" && !b.pago).reduce((a, b) => a + b.valor, 0);

  const totalLimiteCartoes = cards.reduce((a, c) => a + c.limite, 0);
  const totalUsadoCartoes = cards.reduce((a, c) => a + c.usado, 0);
  const totalSaldoBancos = banks.reduce((a, b) => a + b.saldo, 0);
  const totalInvestido = investments.reduce((a, i) => a + i.investido, 0);
  const totalRetorno = investments.reduce((a, i) => a + i.retorno, 0);

  // Chart data: last 6 months
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(currentYear, currentMonth - 1 - (5 - i), 1);
    const mesAno = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const mTx = transactions.filter((t) => t.mesAno === mesAno);
    const rec = mTx.filter((t) => t.tipo === "entrada").reduce((a, t) => a + t.valor, 0);
    const desp = mTx.filter((t) => t.tipo === "saida").reduce((a, t) => a + t.valor, 0);
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return { mes: monthNames[d.getMonth()], receitas: rec, despesas: desp, saldo: rec - desp };
  });

  // Category spending ranking
  const catMap = new Map<string, number>();
  monthTx.filter((t) => t.tipo === "saida").forEach((t) => {
    catMap.set(t.categoria, (catMap.get(t.categoria) || 0) + t.valor);
  });
  const categoryRanking = Array.from(catMap.entries())
    .sort((a, b) => b[1] - a[1]);

  // Category income ranking
  const incomeMap = new Map<string, number>();
  monthTx.filter((t) => t.tipo === "entrada").forEach((t) => {
    incomeMap.set(t.categoria, (incomeMap.get(t.categoria) || 0) + t.valor);
  });
  const incomeRanking = Array.from(incomeMap.entries())
    .sort((a, b) => b[1] - a[1]);

  const colors = [
    "hsl(152, 60%, 42%)", "hsl(215, 50%, 18%)", "hsl(38, 92%, 55%)",
    "hsl(280, 60%, 55%)", "hsl(0, 72%, 55%)", "hsl(200, 50%, 55%)",
    "hsl(320, 60%, 50%)", "hsl(45, 80%, 50%)",
  ];

  const pieData = categoryRanking.map(([name, value], i) => ({
    name, value, color: colors[i % colors.length],
  }));

  const lastTx = monthTx.slice(0, 5);

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Dashboard</h1>
        <MonthYearSelector />
      </div>

      {/* Top Cards - Main KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Saldo" value={fmt(saldo)} icon={<Wallet className="w-4 h-4" />} variant="primary" />
        <KpiCard label="Entradas" value={fmt(receitas)} icon={<TrendingUp className="w-4 h-4" />} variant="success" />
        <KpiCard label="Saídas" value={fmt(despesas)} icon={<TrendingDown className="w-4 h-4" />} variant="destructive" />
        <KpiCard label="Economia" value={fmt(economia)} icon={<PiggyBank className="w-4 h-4" />} variant="warning" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MiniCard label="A Receber" value={fmt(aReceber)} className="text-success" />
        <MiniCard label="A Pagar" value={fmt(aPagar)} className="text-destructive" />
        <MiniCard label="Saldo Bancos" value={fmt(totalSaldoBancos)} className="text-foreground" />
        <MiniCard label="Cartões (usado)" value={fmt(totalUsadoCartoes)} className="text-warning" />
        <MiniCard label="Investido" value={fmt(totalInvestido)} className="text-primary" />
        <MiniCard label="Retorno Invest." value={fmt(totalRetorno)} className="text-success" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ranking de Gastos */}
        <div className="bg-card rounded-xl p-4 shadow-card">
          <h3 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-destructive" /> Ranking de Gastos
          </h3>
          {categoryRanking.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Sem gastos neste mês</p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {categoryRanking.map(([cat, val], i) => (
                <div key={cat} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                    <span className="text-xs text-foreground truncate">{cat}</span>
                  </div>
                  <span className="text-xs font-semibold text-destructive whitespace-nowrap">{fmt(val)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ranking de Rendas */}
        <div className="bg-card rounded-xl p-4 shadow-card">
          <h3 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-success" /> Ranking de Rendas
          </h3>
          {incomeRanking.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Sem receitas neste mês</p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {incomeRanking.map(([cat, val], i) => (
                <div key={cat} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-success" />
                    <span className="text-xs text-foreground truncate">{cat}</span>
                  </div>
                  <span className="text-xs font-semibold text-success whitespace-nowrap">{fmt(val)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gastos por Categoria (Pie) */}
        <div className="bg-card rounded-xl p-4 shadow-card">
          <h3 className="font-display font-semibold text-foreground text-sm mb-3">Gastos por Categoria</h3>
          {pieData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Sem dados</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [fmt(value), ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                {pieData.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-4 shadow-card">
          <h3 className="font-display font-semibold text-foreground text-sm mb-3">Receitas vs Despesas</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <Tooltip formatter={(value: number) => [fmt(value), ""]} />
              <Bar dataKey="receitas" fill="hsl(152, 60%, 42%)" radius={[3, 3, 0, 0]} name="Receitas" />
              <Bar dataKey="despesas" fill="hsl(215, 50%, 18%)" radius={[3, 3, 0, 0]} name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card">
          <h3 className="font-display font-semibold text-foreground text-sm mb-3">Evolução do Saldo</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <Tooltip formatter={(value: number) => [fmt(value), "Saldo"]} />
              <Line type="monotone" dataKey="saldo" stroke="hsl(152, 60%, 42%)" strokeWidth={2.5} dot={{ fill: "hsl(152, 60%, 42%)", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row: Bancos + Cartões + Últimas Transações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bancos */}
        <div className="bg-card rounded-xl p-4 shadow-card">
          <h3 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-primary" /> Bancos
          </h3>
          {banks.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum banco cadastrado</p>
          ) : (
            <div className="space-y-2">
              {banks.map((b) => (
                <div key={b.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: b.cor }} />
                    <span className="text-xs font-medium text-foreground">{b.nome}</span>
                  </div>
                  <span className="text-xs font-semibold text-foreground">{fmt(b.saldo)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1 border-t border-border">
                <span className="text-xs font-semibold text-muted-foreground">Total</span>
                <span className="text-xs font-bold text-primary">{fmt(totalSaldoBancos)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Cartões */}
        <div className="bg-card rounded-xl p-4 shadow-card">
          <h3 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-warning" /> Cartões
          </h3>
          {cards.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum cartão cadastrado</p>
          ) : (
            <div className="space-y-2">
              {cards.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.cor }} />
                    <span className="text-xs font-medium text-foreground truncate">{c.nome}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-warning">{fmt(c.usado)}</span>
                    <span className="text-[10px] text-muted-foreground"> / {fmt(c.limite)}</span>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1 border-t border-border">
                <span className="text-xs font-semibold text-muted-foreground">Disponível</span>
                <span className="text-xs font-bold text-success">{fmt(totalLimiteCartoes - totalUsadoCartoes)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Últimas Transações */}
        <div className="bg-card rounded-xl p-4 shadow-card">
          <h3 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" /> Últimas Transações
          </h3>
          {lastTx.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhuma transação neste mês</p>
          ) : (
            <div className="space-y-2">
              {lastTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-6 h-6 rounded flex items-center justify-center ${tx.tipo === "entrada" ? "bg-accent" : "bg-destructive/10"}`}>
                      {tx.tipo === "entrada" ? <ArrowUpRight className="w-3 h-3 text-success" /> : <ArrowDownRight className="w-3 h-3 text-destructive" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{tx.descricao}</p>
                      <p className="text-[10px] text-muted-foreground">{tx.categoria}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold whitespace-nowrap ${tx.tipo === "entrada" ? "text-success" : "text-destructive"}`}>
                    {tx.tipo === "entrada" ? "+" : "-"}{fmt(tx.valor)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Small helper components (Dashboard-only) ── */

const KpiCard = ({ label, value, icon, variant }: {
  label: string; value: string; icon: React.ReactNode;
  variant: "primary" | "success" | "destructive" | "warning";
}) => {
  const bg = {
    primary: "gradient-primary text-primary-foreground",
    success: "bg-card border border-success/20",
    destructive: "bg-card border border-destructive/20",
    warning: "bg-card border border-warning/20",
  }[variant];

  const isPrimary = variant === "primary";

  return (
    <div className={`rounded-xl p-4 shadow-card ${bg}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-medium ${isPrimary ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{label}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isPrimary ? "bg-primary-foreground/20" : "bg-accent"}`}>
          {icon}
        </div>
      </div>
      <p className={`text-lg md:text-xl font-display font-bold ${isPrimary ? "text-primary-foreground" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
};

const MiniCard = ({ label, value, className }: { label: string; value: string; className?: string }) => (
  <div className="bg-card rounded-lg p-3 shadow-card border border-border">
    <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
    <p className={`text-sm font-bold ${className}`}>{value}</p>
  </div>
);

export default Dashboard;
