import { memo } from "react";
import { Bank } from "@/contexts/FinanceContext";

interface BankTemplate {
  id: string;
  nome: string;
  logo_url: string | null;
  cor: string;
  abbr: string;
}

interface BankLogoProps {
  bank: Bank;
  templates: BankTemplate[];
  size?: number;
}

const BankLogo = memo(({ bank, templates, size = 40 }: BankLogoProps) => {
  const template = templates.find((t) => t.nome === bank.nome || t.nome === bank.logo);
  
  if (template?.logo_url) {
    return (
      <img
        src={template.logo_url}
        alt={bank.nome}
        className="rounded-xl object-cover shadow-sm"
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }
  
  if (bank.customLogo) {
    return (
      <img
        src={bank.customLogo}
        alt="Logo"
        className="rounded-xl object-cover shadow-sm"
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }
  
  const abbr = template?.abbr || bank.nome.slice(0, 2);
  const color = template?.cor || bank.cor || "hsl(215, 20%, 50%)";
  
  return (
    <div
      className="rounded-xl flex items-center justify-center font-bold text-primary-foreground shadow-sm"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.3 }}
    >
      {abbr}
    </div>
  );
});

BankLogo.displayName = "BankLogo";

export default BankLogo;
export type { BankTemplate };
