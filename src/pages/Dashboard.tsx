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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const monthlyData = [
  { mes: "Jan", receitas: 5200, despesas: 3800 },
  { mes: "Fev", receitas: 4800, despesas: 4200 },
  { mes: "Mar", receitas: 5500, despesas: 3600 },
  { mes: "Abr", receitas: 6000, despesas: 4100 },
  { mes: "Mai", receitas: 5800, despesas: 3900 },
  { mes: "Jun", receitas: 6200, despesas: 4500 },
];

const saldoEvolution = [
  { dia: "01", saldo: 2500 },
  { dia: "05", saldo: 3100 },
  { dia: "10", saldo: 2800 },
  { dia: "15", saldo: 3500 },
  { dia: "20", saldo: 3200 },
  { dia: "25", saldo: 4100 },
  { dia: "30", saldo: 3800 },
];

const categoryData = [
  { name: "Mercado", value: 1200, color: "hsl(152, 60%, 42%)" },
  { name: "Moradia", value: 1800, color: "hsl(215, 50%, 18%)" },
  { name: "Transporte", value: 600, color: "hsl(38, 92%, 55%)" },
  { name: "Lazer", value: 400, color: "hsl(280, 60%, 55%)" },
  { name: "Saúde", value: 350, color: "hsl(0, 72%, 55%)" },
  { name: "Outros", value: 250, color: "hsl(200, 50%, 55%)" },
];

const recentTransactions = [
  { id: 1, desc: "Supermercado Dia", cat: "Mercado", valor: -245.90, data: "10/02/2026" },
  { id: 2, desc: "Salário", cat: "Receita", valor: 6200.00, data: "05/02/2026" },
  { id: 3, desc: "Conta de Luz", cat: "Moradia", valor: -189.50, data: "08/02/2026" },
  { id: 4, desc: "Uber", cat: "Transporte", valor: -32.40, data: "09/02/2026" },
  { id: 5, desc: "Freelance", cat: "Receita", valor: 1500.00, data: "07/02/2026" },
];

const Dashboard = () => {
  const [currentMonth] = useState("Fevereiro 2026");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{currentMonth}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Saldo Atual"
          value="R$ 3.800,00"
          icon={<Wallet className="w-5 h-5 text-primary" />}
          trend="12% vs mês anterior"
          trendUp
          variant="primary"
        />
        <StatCard
          title="Receitas"
          value="R$ 7.700,00"
          icon={<TrendingUp className="w-5 h-5 text-success" />}
          trend="8% vs mês anterior"
          trendUp
          variant="success"
        />
        <StatCard
          title="Despesas"
          value="R$ 4.500,00"
          icon={<TrendingDown className="w-5 h-5 text-destructive" />}
          trend="5% vs mês anterior"
          variant="destructive"
        />
        <StatCard
          title="Economia"
          value="R$ 3.200,00"
          icon={<PiggyBank className="w-5 h-5 text-warning" />}
          trend="15% vs mês anterior"
          trendUp
          variant="warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart */}
        <div className="bg-card rounded-xl p-5 shadow-card">
          <h3 className="font-display font-semibold text-foreground mb-4">Receitas vs Despesas</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "hsl(215, 15%, 50%)" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(215, 15%, 50%)" }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(210, 20%, 90%)",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
                formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
              />
              <Bar dataKey="receitas" fill="hsl(152, 60%, 42%)" radius={[4, 4, 0, 0]} name="Receitas" />
              <Bar dataKey="despesas" fill="hsl(215, 50%, 18%)" radius={[4, 4, 0, 0]} name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart */}
        <div className="bg-card rounded-xl p-5 shadow-card">
          <h3 className="font-display font-semibold text-foreground mb-4">Evolução do Saldo</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={saldoEvolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
              <XAxis dataKey="dia" tick={{ fontSize: 12, fill: "hsl(215, 15%, 50%)" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(215, 15%, 50%)" }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(210, 20%, 90%)",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
                formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Saldo"]}
              />
              <Line
                type="monotone"
                dataKey="saldo"
                stroke="hsl(152, 60%, 42%)"
                strokeWidth={3}
                dot={{ fill: "hsl(152, 60%, 42%)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pie Chart */}
        <div className="bg-card rounded-xl p-5 shadow-card">
          <h3 className="font-display font-semibold text-foreground mb-4">Gastos por Categoria</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(210, 20%, 90%)",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
                formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
              />
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

        {/* Recent Transactions */}
        <div className="bg-card rounded-xl p-5 shadow-card lg:col-span-2">
          <h3 className="font-display font-semibold text-foreground mb-4">Últimas Transações</h3>
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    tx.valor > 0 ? "bg-accent" : "bg-destructive/10"
                  }`}>
                    {tx.valor > 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-success" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{tx.desc}</p>
                    <p className="text-xs text-muted-foreground">{tx.cat} • {tx.data}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${
                  tx.valor > 0 ? "text-success" : "text-destructive"
                }`}>
                  {tx.valor > 0 ? "+" : ""}R$ {Math.abs(tx.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
