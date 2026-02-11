import { TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const mockInvestments = [
  { id: 1, nome: "Tesouro Selic", categoria: "Renda Fixa", investido: 10000, retorno: 850, cor: "hsl(152, 60%, 42%)" },
  { id: 2, nome: "CDB Banco Inter", categoria: "Renda Fixa", investido: 5000, retorno: 380, cor: "hsl(215, 50%, 18%)" },
  { id: 3, nome: "Ações PETR4", categoria: "Renda Variável", investido: 3000, retorno: -120, cor: "hsl(38, 92%, 55%)" },
  { id: 4, nome: "FII XPLG11", categoria: "Fundos Imobiliários", investido: 8000, retorno: 640, cor: "hsl(280, 60%, 55%)" },
];

const evolucaoData = [
  { mes: "Set", valor: 20000 },
  { mes: "Out", valor: 21200 },
  { mes: "Nov", valor: 22500 },
  { mes: "Dez", valor: 23800 },
  { mes: "Jan", valor: 25100 },
  { mes: "Fev", valor: 26750 },
];

const Investimentos = () => {
  const totalInvestido = mockInvestments.reduce((acc, i) => acc + i.investido, 0);
  const totalRetorno = mockInvestments.reduce((acc, i) => acc + i.retorno, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Investimentos</h1>
          <p className="text-muted-foreground text-sm mt-1">Acompanhe seus investimentos e negócios</p>
        </div>
        <Button className="gradient-primary text-primary-foreground hover:opacity-90 gap-2">
          <Plus className="w-4 h-4" /> Novo Investimento
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="gradient-hero rounded-xl p-6 text-primary-foreground">
          <p className="text-sm opacity-80">Total Investido</p>
          <p className="text-3xl font-display font-bold mt-1">
            R$ {totalInvestido.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="bg-card rounded-xl p-6 shadow-card">
          <p className="text-sm text-muted-foreground">Retorno Total</p>
          <p className={`text-3xl font-display font-bold mt-1 ${totalRetorno >= 0 ? "text-success" : "text-destructive"}`}>
            {totalRetorno >= 0 ? "+" : ""}R$ {totalRetorno.toLocaleString("pt-BR")}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl p-5 shadow-card">
        <h3 className="font-display font-semibold text-foreground mb-4">Evolução Patrimonial</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={evolucaoData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "hsl(215, 15%, 50%)" }} />
            <YAxis tick={{ fontSize: 12, fill: "hsl(215, 15%, 50%)" }} />
            <Tooltip
              contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(210,20%,90%)", borderRadius: "8px", fontSize: "13px" }}
              formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Patrimônio"]}
            />
            <Bar dataKey="valor" fill="hsl(152, 60%, 42%)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-xl p-5 shadow-card">
        <h3 className="font-display font-semibold text-foreground mb-4">Meus Investimentos</h3>
        <div className="divide-y divide-border">
          {mockInvestments.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${inv.cor}20` }}>
                  <TrendingUp className="w-5 h-5" style={{ color: inv.cor }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{inv.nome}</p>
                  <p className="text-xs text-muted-foreground">{inv.categoria}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">R$ {inv.investido.toLocaleString("pt-BR")}</p>
                <p className={`text-xs font-medium ${inv.retorno >= 0 ? "text-success" : "text-destructive"}`}>
                  {inv.retorno >= 0 ? "+" : ""}R$ {inv.retorno.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Investimentos;
