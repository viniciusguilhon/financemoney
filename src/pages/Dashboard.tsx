import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import MonthYearSelector from "@/components/MonthYearSelector";
import { useFinance } from "@/contexts/FinanceContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";

const Dashboard = () => {
  const { getMonthTransactions, currentMonth, currentYear, transactions } = useFinance();
  const monthTx = getMonthTransactions();

  const receitas = monthTx.filter((t) => t.tipo === "entrada").reduce((a, t) => a + t.valor, 0);
  const despesas = monthTx.filter((t) => t.tipo === "saida").reduce((a, t) => a + t.valor, 0);
  const saldo = receitas - despesas;
  const economia = receitas - despesas;

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

  // Category data
  const catMap = new Map<string, number>();
  monthTx.filter((t) => t.tipo === "saida").forEach((t) => {
    catMap.set(t.categoria, (catMap.get(t.categoria) || 0) + t.valor);
  });
  const colors = ["hsl(152, 60%, 42%)", "hsl(215, 50%, 18%)", "hsl(38, 92%, 55%)", "hsl(280, 60%, 55%)", "hsl(0, 72%, 55%)", "hsl(200, 50%, 55%)"];
  const categoryData = Array.from(catMap.entries()).map(([name, value], i) => ({
    name, value, color: colors[i % colors.length],
  }));

  const lastTx = monthTx.slice(0, 5);

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Dashboard</h1>
        </div>
        <MonthYearSelector />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Saldo Atual" value={fmt(saldo)} icon={<Wallet className="w-5 h-5 text-primary" />} variant="primary" />
        <StatCard title="Receitas" value={fmt(receitas)} icon={<TrendingUp className="w-5 h-5 text-success" />} variant="success" />
        <StatCard title="Despesas" value={fmt(despesas)} icon={<TrendingDown className="w-5 h-5 text-destructive" />} variant="destructive" />
        <StatCard title="Economia" value={fmt(economia)} icon={<PiggyBank className="w-5 h-5 text-warning" />} variant="warning" />
      </div>

      {monthTx.length === 0 ? (
        <div className="bg-card rounded-xl p-12 shadow-card text-center">
          <p className="text-muted-foreground">Nenhum lançamento neste mês. Comece adicionando suas receitas e despesas!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl p-5 shadow-card">
              <h3 className="font-display font-semibold text-foreground mb-4">Receitas vs Despesas</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <Tooltip formatter={(value: number) => [fmt(value), ""]} />
                  <Bar dataKey="receitas" fill="hsl(152, 60%, 42%)" radius={[4, 4, 0, 0]} name="Receitas" />
                  <Bar dataKey="despesas" fill="hsl(215, 50%, 18%)" radius={[4, 4, 0, 0]} name="Despesas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-xl p-5 shadow-card">
              <h3 className="font-display font-semibold text-foreground mb-4">Evolução do Saldo</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <Tooltip formatter={(value: number) => [fmt(value), "Saldo"]} />
                  <Line type="monotone" dataKey="saldo" stroke="hsl(152, 60%, 42%)" strokeWidth={3} dot={{ fill: "hsl(152, 60%, 42%)", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {categoryData.length > 0 && (
              <div className="bg-card rounded-xl p-5 shadow-card">
                <h3 className="font-display font-semibold text-foreground mb-4">Gastos por Categoria</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [fmt(value), ""]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2">
                  {categoryData.map((cat) => (
                    <div key={cat.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className={`bg-card rounded-xl p-5 shadow-card ${categoryData.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}`}>
              <h3 className="font-display font-semibold text-foreground mb-4">Últimas Transações</h3>
              <div className="space-y-3">
                {lastTx.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tx.tipo === "entrada" ? "bg-accent" : "bg-destructive/10"}`}>
                        {tx.tipo === "entrada" ? <ArrowUpRight className="w-4 h-4 text-success" /> : <ArrowDownRight className="w-4 h-4 text-destructive" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{tx.descricao}</p>
                        <p className="text-xs text-muted-foreground">{tx.categoria} • {new Date(tx.data + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${tx.tipo === "entrada" ? "text-success" : "text-destructive"}`}>
                      {tx.tipo === "entrada" ? "+" : "-"}{fmt(tx.valor)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
