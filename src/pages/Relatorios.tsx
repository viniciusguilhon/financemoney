import { useFinance } from "@/contexts/FinanceContext";
import MonthYearSelector from "@/components/MonthYearSelector";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";

const colors = ["hsl(152, 60%, 42%)", "hsl(215, 50%, 18%)", "hsl(38, 92%, 55%)", "hsl(280, 60%, 55%)", "hsl(0, 72%, 55%)", "hsl(200, 50%, 55%)"];

const Relatorios = () => {
  const { transactions, currentYear } = useFinance();

  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  // Annual data
  const comparacaoMensal = monthNames.map((mes, i) => {
    const mesAno = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
    const mTx = transactions.filter((t) => t.mesAno === mesAno);
    return {
      mes,
      receitas: mTx.filter((t) => t.tipo === "entrada").reduce((a, t) => a + t.valor, 0),
      despesas: mTx.filter((t) => t.tipo === "saida").reduce((a, t) => a + t.valor, 0),
    };
  });

  const evolucaoSaldo = comparacaoMensal.map((m) => ({ mes: m.mes, saldo: m.receitas - m.despesas }));

  const totalReceitas = comparacaoMensal.reduce((a, m) => a + m.receitas, 0);
  const totalDespesas = comparacaoMensal.reduce((a, m) => a + m.despesas, 0);
  const totalEconomia = totalReceitas - totalDespesas;

  // Category ranking for year
  const yearTx = transactions.filter((t) => t.mesAno.startsWith(String(currentYear)));
  const catMap = new Map<string, number>();
  yearTx.filter((t) => t.tipo === "saida").forEach((t) => catMap.set(t.categoria, (catMap.get(t.categoria) || 0) + t.valor));
  const topCategorias = Array.from(catMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));

  const totalCatDespesas = topCategorias.reduce((a, c) => a + c.value, 0);
  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground text-sm mt-1">Visão anual consolidada — {currentYear}</p>
        </div>
        <MonthYearSelector />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80">Receitas Anuais</p>
          <p className="text-2xl font-display font-bold mt-1">{fmt(totalReceitas)}</p>
        </div>
        <div className="bg-card rounded-xl p-5 shadow-card">
          <p className="text-sm text-muted-foreground">Despesas Anuais</p>
          <p className="text-2xl font-display font-bold mt-1 text-destructive">{fmt(totalDespesas)}</p>
        </div>
        <div className="bg-card rounded-xl p-5 shadow-card">
          <p className="text-sm text-muted-foreground">Economia Anual</p>
          <p className={`text-2xl font-display font-bold mt-1 ${totalEconomia >= 0 ? "text-success" : "text-destructive"}`}>{fmt(totalEconomia)}</p>
        </div>
      </div>

      {yearTx.length === 0 ? (
        <div className="bg-card rounded-xl p-12 shadow-card text-center text-muted-foreground">
          Nenhum dado disponível para {currentYear}. Comece adicionando lançamentos!
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl p-5 shadow-card">
              <h3 className="font-display font-semibold text-foreground mb-4">Comparação Mensal</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={comparacaoMensal}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <Tooltip formatter={(value: number) => [fmt(value), ""]} />
                  <Bar dataKey="receitas" fill="hsl(152, 60%, 42%)" radius={[4, 4, 0, 0]} name="Receitas" />
                  <Bar dataKey="despesas" fill="hsl(0, 72%, 55%)" radius={[4, 4, 0, 0]} name="Despesas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-xl p-5 shadow-card">
              <h3 className="font-display font-semibold text-foreground mb-4">Evolução da Economia</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={evolucaoSaldo}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <Tooltip formatter={(value: number) => [fmt(value), "Economia"]} />
                  <Line type="monotone" dataKey="saldo" stroke="hsl(152, 60%, 42%)" strokeWidth={3} dot={{ fill: "hsl(152, 60%, 42%)", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {topCategorias.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-card rounded-xl p-5 shadow-card">
                <h3 className="font-display font-semibold text-foreground mb-4">Despesas por Categoria</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={topCategorias} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {topCategorias.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => [fmt(value), ""]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2">
                  {topCategorias.map((cat) => (
                    <div key={cat.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-card rounded-xl p-5 shadow-card lg:col-span-2">
                <h3 className="font-display font-semibold text-foreground mb-4">Ranking de Gastos</h3>
                <div className="space-y-3">
                  {topCategorias.map((cat, i) => {
                    const pct = totalCatDespesas > 0 ? (cat.value / totalCatDespesas) * 100 : 0;
                    return (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">#{i + 1} {cat.name}</span>
                          <span className="text-muted-foreground">{fmt(cat.value)} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-muted">
                          <div className="h-2.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Relatorios;
