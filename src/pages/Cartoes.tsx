import { CreditCard, Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockCards = [
  { id: 1, nome: "Nubank Mastercard", bandeira: "Mastercard", limite: 8000, usado: 3200, vencimento: 10, cor: "hsl(280, 60%, 50%)" },
  { id: 2, nome: "Itaú Visa", bandeira: "Visa", limite: 12000, usado: 5400, vencimento: 15, cor: "hsl(215, 50%, 18%)" },
  { id: 3, nome: "C6 Carbon", bandeira: "Mastercard", limite: 5000, usado: 1800, vencimento: 20, cor: "hsl(0, 0%, 15%)" },
];

const Cartoes = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Cartões de Crédito</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie seus cartões e faturas</p>
        </div>
        <Button className="gradient-primary text-primary-foreground hover:opacity-90 gap-2">
          <Plus className="w-4 h-4" /> Adicionar Cartão
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {mockCards.map((card) => {
          const disponivel = card.limite - card.usado;
          const pct = (card.usado / card.limite) * 100;
          return (
            <div key={card.id} className="rounded-2xl p-6 text-primary-foreground shadow-elevated animate-fade-in" style={{ background: `linear-gradient(135deg, ${card.cor}, ${card.cor}cc)` }}>
              <div className="flex items-center justify-between mb-8">
                <CreditCard className="w-8 h-8 opacity-80" />
                <span className="text-xs font-medium opacity-70">{card.bandeira}</span>
              </div>
              <p className="text-lg font-display font-bold mb-1">{card.nome}</p>
              <p className="text-xs opacity-70 mb-6">Vencimento dia {card.vencimento}</p>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="opacity-70">Usado</span>
                  <span className="font-semibold">R$ {card.usado.toLocaleString("pt-BR")}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-primary-foreground/20">
                  <div
                    className="h-2 rounded-full bg-primary-foreground/80 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="opacity-70">Disponível</span>
                  <span className="font-semibold">R$ {disponivel.toLocaleString("pt-BR")}</span>
                </div>
              </div>

              <Button variant="ghost" size="sm" className="mt-4 w-full text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 gap-2">
                <Eye className="w-4 h-4" /> Ver Fatura
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Cartoes;
