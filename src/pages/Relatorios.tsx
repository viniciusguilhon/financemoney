import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";

const comparacaoMensal = [
  { mes: "Jul", receitas: 5000, despesas: 3800 },
  { mes: "Ago", receitas: 5200, despesas: 4100 },
  { mes: "Set", receitas: 5500, despesas: 3600 },
  { mes: "Out", receitas: 5800, despesas: 4200 },
  { mes: "Nov", receitas: 6000, despesas: 4000 },
  { mes: "Dez", receitas: 6500, despesas: 4800 },
  { mes: "Jan", receitas: 6200, despesas: 4300 },
  { mes: "Fev", receitas: 7700, despesas: 4500 },
];

const evolucaoSaldo = comparacaoMensal.map((m) => ({
  mes: m.mes,
  saldo: m.receitas - m.despesas,
}));

const topCategorias = [
  { name: "Moradia", value: 1800, color: "hsl(215, 50%, 18%)" },
  { name: "Mercado", value: 1200, color: "hsl(152, 60%, 42%)" },
  { name: "Transporte", value: 600, color: "hsl(38, 92%, 55%)" },
  { name: "Lazer", value: 400, color: "hsl(280, 60%, 55%)" },
  { name: "Saúde", value: 350, color: "hsl(0, 72%, 55%)" },
  { name: "Educação", value: 150, color: "hsl(200, 50%, 55%)" },
];

const totalDespesas = topCategorias.reduce((acc, c) => acc + c.value, 0);

const Relatorios = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão anual e comparativa</p>
      </div>

      {/* Annual Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="gradient-hero rounded-xl p-5 text-primary-foreground">
          <p className="text-sm opacity-80">Receitas Anuais</p>
          <p className="text-2xl font-display font-bold mt-1">R$ 68.900</p>
        </div>
        <div className="bg-card rounded-xl p-5 shadow-card">
          <p className="text-sm text-muted-foreground">Despesas Anuais</p>
          <p className="text-2xl font-display font-bold mt-1 text-destructive">R$ 37.300</p>
        </div>
        <div className="bg-card rounded-xl p-5 shadow-card">
          <p className="text-sm text-muted-foreground">Economia Anual</p>
          <p className="text-2xl font-display font-bold mt-1 text-success">R$ 31.600</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Comparação mensal */}
        <div className="bg-card rounded-xl p-5 shadow-card">
          <h3 className="font-display font-semibold text-foreground mb-4">Comparação Mensal</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={comparacaoMensal}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "hsl(215, 15%, 50%)" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(215, 15%, 50%)" }} />
              <Tooltip
                contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(210,20%,90%)", borderRadius: "8px", fontSize: "13px" }}
                formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
              />
              <Bar dataKey="receitas" fill="hsl(152, 60%, 42%)" radius={[4, 4, 0, 0]} name="Receitas" />
              <Bar dataKey="despesas" fill="hsl(215, 50%, 18%)" radius={[4, 4, 0, 0]} name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Evolução do Saldo */}
        <div className="bg-card rounded-xl p-5 shadow-card">
          <h3 className="font-display font-semibold text-foreground mb-4">Evolução da Economia</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={evolucaoSaldo}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "hsl(215, 15%, 50%)" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(215, 15%, 50%)" }} />
              <Tooltip
                contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(210,20%,90%)", borderRadius: "8px", fontSize: "13px" }}
                formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Economia"]}
              />
              <Line type="monotone" dataKey="saldo" stroke="hsl(152, 60%, 42%)" strokeWidth={3} dot={{ fill: "hsl(152, 60%, 42%)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ranking de categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-5 shadow-card">
          <h3 className="font-display font-semibold text-foreground mb-4">Despesas por Categoria</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={topCategorias} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {topCategorias.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(210,20%,90%)", borderRadius: "8px", fontSize: "13px" }}
                formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
              />
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
              const pct = (cat.value / totalDespesas) * 100;
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">#{i + 1} {cat.name}</span>
                    <span className="text-muted-foreground">R$ {cat.value.toLocaleString("pt-BR")} ({pct.toFixed(0)}%)</span>
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
    </div>
  );
};

export default Relatorios;
