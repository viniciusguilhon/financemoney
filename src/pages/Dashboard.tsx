import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight,
  CreditCard, Landmark, BarChart3, Receipt, Target, DollarSign, ShieldCheck,
} from "lucide-react";
import MonthYearSelector from "@/components/MonthYearSelector";
import { useFinance, BANK_LOGOS } from "@/contexts/FinanceContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
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

  const aPagar = monthBills.filter((b) => b.tipo === "pagar" && !b.pago).reduce((a, b) => a + b.valor, 0);
  const aReceber = monthBills.filter((b) => b.tipo === "receber" && !b.pago).reduce((a, b) => a + b.valor, 0);
  const pagos = monthBills.filter((b) => b.tipo === "pagar" && b.pago).length;
  const totalBillsPagar = monthBills.filter((b) => b.tipo === "pagar").length;

  const totalLimiteCartoes = cards.reduce((a, c) => a + c.limite, 0);
  const totalUsadoCartoes = cards.reduce((a, c) => a + c.usado, 0);
  const totalSaldoBancos = banks.reduce((a, b) => a + b.saldo, 0);
  const totalInvestido = investments.reduce((a, i) => a + i.investido, 0);
  const totalRetorno = investments.reduce((a, i) => a + i.retorno, 0);
  const rentabilidade = totalInvestido > 0 ? ((totalRetorno / totalInvestido) * 100).toFixed(1) : "0.0";

  const txPagas = monthTx.filter((t) => t.pago).length;
  const txTotal = monthTx.length;

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
  const categoryRanking = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]);

  const incomeMap = new Map<string, number>();
  monthTx.filter((t) => t.tipo === "entrada").forEach((t) => {
    incomeMap.set(t.categoria, (incomeMap.get(t.categoria) || 0) + t.valor);
  });
  const incomeRanking = Array.from(incomeMap.entries()).sort((a, b) => b[1] - a[1]);

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

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{monthNames[currentMonth - 1]} de {currentYear}</p>
        </div>
        <MonthYearSelector />
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <HeroKpi
          label="Saldo do Mês"
          value={fmt(saldo)}
          icon={<Wallet className="w-5 h-5" />}
          trend={saldo >= 0 ? "positive" : "negative"}
          detail={saldo >= 0 ? "Positivo" : "Negativo"}
          gradient="from-emerald-500 to-emerald-700"
        />
        <HeroKpi
          label="Receitas"
          value={fmt(receitas)}
          icon={<TrendingUp className="w-5 h-5" />}
          trend="positive"
          detail={`${monthTx.filter(t => t.tipo === "entrada").length} entradas`}
          gradient="from-blue-500 to-blue-700"
        />
        <HeroKpi
          label="Despesas"
          value={fmt(despesas)}
          icon={<TrendingDown className="w-5 h-5" />}
          trend="negative"
          detail={`${monthTx.filter(t => t.tipo === "saida").length} saídas`}
          gradient="from-red-500 to-red-700"
        />
        <HeroKpi
          label="Economia"
          value={fmt(saldo)}
          icon={<PiggyBank className="w-5 h-5" />}
          trend={saldo >= 0 ? "positive" : "negative"}
          detail={receitas > 0 ? `${((saldo / receitas) * 100).toFixed(0)}% das receitas` : "—"}
          gradient="from-amber-500 to-orange-600"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <InfoCard icon={<DollarSign className="w-4 h-4 text-success" />} label="A Receber" value={fmt(aReceber)} accent="success" />
        <InfoCard icon={<Receipt className="w-4 h-4 text-destructive" />} label="A Pagar" value={fmt(aPagar)} accent="destructive" extra={totalBillsPagar > 0 ? `${pagos}/${totalBillsPagar} pagas` : undefined} />
        <InfoCard icon={<Landmark className="w-4 h-4 text-primary" />} label="Saldo Bancos" value={fmt(totalSaldoBancos)} accent="primary" extra={`${banks.length} conta(s)`} />
        <InfoCard icon={<CreditCard className="w-4 h-4 text-warning" />} label="Fatura Cartões" value={fmt(totalUsadoCartoes)} accent="warning" extra={totalLimiteCartoes > 0 ? `${((totalUsadoCartoes/totalLimiteCartoes)*100).toFixed(0)}% do limite` : undefined} />
        <InfoCard icon={<Target className="w-4 h-4 text-primary" />} label="Investimentos" value={fmt(totalInvestido)} accent="primary" extra={`Retorno: ${rentabilidade}%`} />
        <InfoCard icon={<ShieldCheck className="w-4 h-4 text-success" />} label="Status Mês" value={`${txPagas}/${txTotal}`} accent="success" extra="pagos/total" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
          <h3 className="font-display font-semibold text-foreground text-sm mb-4">Receitas vs Despesas</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <Tooltip formatter={(value: number) => [fmt(value), ""]} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }} />
              <Bar dataKey="receitas" fill="hsl(152, 60%, 42%)" radius={[6, 6, 0, 0]} name="Receitas" />
              <Bar dataKey="despesas" fill="hsl(0, 72%, 55%)" radius={[6, 6, 0, 0]} name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
          <h3 className="font-display font-semibold text-foreground text-sm mb-4">Evolução do Saldo</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(152, 60%, 42%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(152, 60%, 42%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <Tooltip formatter={(value: number) => [fmt(value), "Saldo"]} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }} />
              <Area type="monotone" dataKey="saldo" stroke="hsl(152, 60%, 42%)" strokeWidth={2.5} fill="url(#saldoGradient)" dot={{ fill: "hsl(152, 60%, 42%)", r: 4, strokeWidth: 2, stroke: "white" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Middle Row: Rankings + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ranking de Gastos */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
          <h3 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-destructive" /> Maiores Gastos
          </h3>
          {categoryRanking.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Sem gastos neste mês</p>
          ) : (
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {categoryRanking.map(([cat, val], i) => {
                const maxVal = categoryRanking[0][1];
                const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-foreground font-medium">{cat}</span>
                      <span className="text-xs font-bold text-destructive">{fmt(val)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ranking de Rendas */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
          <h3 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-success" /> Maiores Receitas
          </h3>
          {incomeRanking.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Sem receitas neste mês</p>
          ) : (
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {incomeRanking.map(([cat, val], i) => {
                const maxVal = incomeRanking[0][1];
                const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-foreground font-medium">{cat}</span>
                      <span className="text-xs font-bold text-success">{fmt(val)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
          <h3 className="font-display font-semibold text-foreground text-sm mb-3">Gastos por Categoria</h3>
          {pieData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Sem dados</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [fmt(value), ""]} contentStyle={{ borderRadius: 12, border: "none" }} />
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

      {/* Bottom Row: Banks + Cards + Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bancos */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
          <h3 className="font-display font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-primary" /> Contas Bancárias
          </h3>
          {banks.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhum banco cadastrado</p>
          ) : (
            <div className="space-y-3">
              {banks.map((b) => {
                const info = BANK_LOGOS[b.logo || "outro"] || BANK_LOGOS.outro;
                return (
                  <div key={b.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-bold text-white overflow-hidden" style={{ backgroundColor: b.customLogo ? undefined : info.color }}>
                        {b.customLogo ? <img src={b.customLogo} alt={b.nome} className="w-full h-full object-cover" /> : info.abbr}
                      </div>
                      <div>
                        <span className="text-xs font-medium text-foreground">{b.nome}</span>
                        <p className="text-[10px] text-muted-foreground">{info.name}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold ${b.saldo >= 0 ? "text-success" : "text-destructive"}`}>{fmt(b.saldo)}</span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs font-semibold text-muted-foreground">Total</span>
                <span className="text-sm font-bold text-primary">{fmt(totalSaldoBancos)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Cartões */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
          <h3 className="font-display font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-warning" /> Cartões de Crédito
          </h3>
          {cards.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhum cartão cadastrado</p>
          ) : (
            <div className="space-y-3">
              {cards.map((c) => {
                const pct = c.limite > 0 ? (c.usado / c.limite) * 100 : 0;
                return (
                  <div key={c.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.cor }} />
                        <span className="text-xs font-medium text-foreground">{c.nome}</span>
                      </div>
                      <span className="text-xs font-bold text-warning">{fmt(c.usado)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct > 80 ? "hsl(0, 72%, 50%)" : "hsl(38, 92%, 55%)" }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{pct.toFixed(0)}% usado</span>
                      <span>Limite: {fmt(c.limite)}</span>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs font-semibold text-muted-foreground">Disponível Total</span>
                <span className="text-sm font-bold text-success">{fmt(totalLimiteCartoes - totalUsadoCartoes)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Últimas Transações */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
          <h3 className="font-display font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" /> Últimas Transações
          </h3>
          {lastTx.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhuma transação neste mês</p>
          ) : (
            <div className="space-y-3">
              {lastTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.tipo === "entrada" ? "bg-accent" : "bg-destructive/10"}`}>
                      {tx.tipo === "entrada" ? <ArrowUpRight className="w-4 h-4 text-success" /> : <ArrowDownRight className="w-4 h-4 text-destructive" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">{tx.descricao}</p>
                      <p className="text-[10px] text-muted-foreground">{tx.categoria} • {tx.conta}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold whitespace-nowrap ${tx.tipo === "entrada" ? "text-success" : "text-destructive"}`}>
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

/* ── Premium KPI Cards ── */
const HeroKpi = ({ label, value, icon, trend, detail, gradient }: {
  label: string; value: string; icon: React.ReactNode;
  trend: "positive" | "negative"; detail: string; gradient: string;
}) => (
  <div className={`rounded-2xl p-4 shadow-elevated relative overflow-hidden bg-gradient-to-br ${gradient}`}>
    <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 80% 20%, white, transparent 50%)" }} />
    <div className="relative z-[1]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-white/80">{label}</span>
        <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white">
          {icon}
        </div>
      </div>
      <p className="text-xl md:text-2xl font-display font-bold text-white">{value}</p>
      <p className="text-[10px] text-white/60 mt-1 flex items-center gap-1">
        {trend === "positive" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {detail}
      </p>
    </div>
  </div>
);

const InfoCard = ({ icon, label, value, accent, extra }: {
  icon: React.ReactNode; label: string; value: string; accent: string; extra?: string;
}) => (
  <div className="bg-card rounded-xl p-3 shadow-card border border-border">
    <div className="flex items-center gap-1.5 mb-1.5">
      {icon}
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
    <p className={`text-sm font-bold text-${accent}`}>{value}</p>
    {extra && <p className="text-[9px] text-muted-foreground mt-0.5">{extra}</p>}
  </div>
);

export default Dashboard;
