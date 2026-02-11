import { Landmark, Plus, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockBanks = [
  { id: 1, nome: "Nubank", saldo: 4520.30, cor: "hsl(280, 60%, 50%)" },
  { id: 2, nome: "Itaú", saldo: 12340.00, cor: "hsl(25, 90%, 50%)" },
  { id: 3, nome: "C6 Bank", saldo: 2180.45, cor: "hsl(0, 0%, 15%)" },
  { id: 4, nome: "Bradesco", saldo: 890.20, cor: "hsl(0, 72%, 50%)" },
];

const contasPagar = [
  { id: 1, desc: "Aluguel", valor: 1500, vencimento: "15/02/2026", pago: false },
  { id: 2, desc: "Internet", valor: 119.90, vencimento: "20/02/2026", pago: false },
  { id: 3, desc: "Energia", valor: 189.50, vencimento: "10/02/2026", pago: true },
];

const Bancos = () => {
  const totalSaldo = mockBanks.reduce((acc, b) => acc + b.saldo, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Bancos e Contas</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie suas contas bancárias</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <ArrowLeftRight className="w-4 h-4" /> Transferir
          </Button>
          <Button className="gradient-primary text-primary-foreground hover:opacity-90 gap-2">
            <Plus className="w-4 h-4" /> Nova Conta
          </Button>
        </div>
      </div>

      {/* Total */}
      <div className="gradient-hero rounded-xl p-6 text-primary-foreground">
        <p className="text-sm opacity-80">Saldo Total</p>
        <p className="text-3xl font-display font-bold mt-1">
          R$ {totalSaldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Bank Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockBanks.map((bank) => (
          <div key={bank.id} className="bg-card rounded-xl p-5 shadow-card animate-fade-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${bank.cor}20` }}>
                <Landmark className="w-5 h-5" style={{ color: bank.cor }} />
              </div>
              <span className="font-medium text-foreground">{bank.nome}</span>
            </div>
            <p className="text-xl font-display font-bold text-foreground">
              R$ {bank.saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>

      {/* Contas a Pagar */}
      <div className="bg-card rounded-xl p-5 shadow-card">
        <h3 className="font-display font-semibold text-foreground mb-4">Contas a Pagar</h3>
        <div className="divide-y divide-border">
          {contasPagar.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{c.desc}</p>
                <p className="text-xs text-muted-foreground">Vencimento: {c.vencimento}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-destructive">
                  R$ {c.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  c.pago ? "bg-accent text-accent-foreground" : "bg-warning/10 text-warning"
                }`}>
                  {c.pago ? "Pago" : "Pendente"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Bancos;
