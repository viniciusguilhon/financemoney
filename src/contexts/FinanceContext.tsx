import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface Transaction {
  id: string;
  data: string;
  categoria: string;
  descricao: string;
  valor: number;
  tipo: "entrada" | "saida";
  conta: string;
  pago: boolean;
  parcelas?: number;
  parcelaAtual?: number;
  mesAno: string; // "2026-02"
}

export interface Card {
  id: string;
  nome: string;
  bandeira: string;
  limite: number;
  usado: number;
  vencimento: number;
  cor: string;
  customImage?: string;
}

export interface Bank {
  id: string;
  nome: string;
  saldo: number;
  cor: string;
  logo?: string;
  customLogo?: string;
}

export const BANK_LOGOS: Record<string, { name: string; color: string; abbr: string }> = {
  nubank: { name: "Nubank", color: "hsl(280, 60%, 50%)", abbr: "Nu" },
  inter: { name: "Inter", color: "hsl(25, 100%, 50%)", abbr: "In" },
  itau: { name: "Itaú", color: "hsl(30, 100%, 50%)", abbr: "Itaú" },
  bradesco: { name: "Bradesco", color: "hsl(0, 72%, 50%)", abbr: "Br" },
  bb: { name: "Banco do Brasil", color: "hsl(45, 100%, 50%)", abbr: "BB" },
  caixa: { name: "Caixa", color: "hsl(210, 100%, 40%)", abbr: "Cx" },
  santander: { name: "Santander", color: "hsl(0, 80%, 45%)", abbr: "St" },
  c6: { name: "C6 Bank", color: "hsl(0, 0%, 10%)", abbr: "C6" },
  btg: { name: "BTG Pactual", color: "hsl(215, 50%, 18%)", abbr: "BTG" },
  neon: { name: "Neon", color: "hsl(195, 100%, 50%)", abbr: "Ne" },
  picpay: { name: "PicPay", color: "hsl(152, 80%, 40%)", abbr: "PP" },
  mercadopago: { name: "Mercado Pago", color: "hsl(200, 100%, 45%)", abbr: "MP" },
  outro: { name: "Outro", color: "hsl(215, 20%, 50%)", abbr: "?" },
};

export interface Bill {
  id: string;
  desc: string;
  valor: number;
  vencimento: string;
  pago: boolean;
  tipo: "pagar" | "receber";
  mesAno: string;
}

export interface Investment {
  id: string;
  nome: string;
  categoria: string;
  investido: number;
  retorno: number;
  data: string;
  cor: string;
}

export interface Category {
  id: string;
  nome: string;
  tipo: "entrada" | "saida" | "ambos";
}

const defaultCategories: Category[] = [
  { id: "1", nome: "Mercado", tipo: "saida" },
  { id: "2", nome: "Farmácia", tipo: "saida" },
  { id: "3", nome: "Energia", tipo: "saida" },
  { id: "4", nome: "Água", tipo: "saida" },
  { id: "5", nome: "Wi-Fi", tipo: "saida" },
  { id: "6", nome: "Combustível", tipo: "saida" },
  { id: "7", nome: "Carro", tipo: "saida" },
  { id: "8", nome: "Moto", tipo: "saida" },
  { id: "9", nome: "Academia", tipo: "saida" },
  { id: "10", nome: "Pets", tipo: "saida" },
  { id: "11", nome: "Celular", tipo: "saida" },
  { id: "12", nome: "Lazer", tipo: "saida" },
  { id: "13", nome: "Moradia", tipo: "saida" },
  { id: "14", nome: "Transporte", tipo: "saida" },
  { id: "15", nome: "Saúde", tipo: "saida" },
  { id: "16", nome: "Educação", tipo: "saida" },
  { id: "17", nome: "Salário", tipo: "entrada" },
  { id: "18", nome: "Freelance", tipo: "entrada" },
  { id: "19", nome: "Outros", tipo: "ambos" },
];

interface FinanceContextType {
  // Current month/year
  currentMonth: number;
  currentYear: number;
  setCurrentMonth: (m: number) => void;
  setCurrentYear: (y: number) => void;
  currentMesAno: string;

  // Transactions
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getMonthTransactions: () => Transaction[];

  // Cards
  cards: Card[];
  addCard: (c: Omit<Card, "id">) => void;
  updateCard: (id: string, c: Partial<Card>) => void;
  deleteCard: (id: string) => void;

  // Banks
  banks: Bank[];
  addBank: (b: Omit<Bank, "id">) => void;
  updateBank: (id: string, b: Partial<Bank>) => void;
  deleteBank: (id: string) => void;

  // Bills
  bills: Bill[];
  addBill: (b: Omit<Bill, "id">) => void;
  updateBill: (id: string, b: Partial<Bill>) => void;
  deleteBill: (id: string) => void;
  getMonthBills: () => Bill[];

  // Investments
  investments: Investment[];
  addInvestment: (i: Omit<Investment, "id">) => void;
  updateInvestment: (id: string, i: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;

  // Categories
  categories: Category[];
  addCategory: (c: Omit<Category, "id">) => void;
  updateCategory: (id: string, c: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType>(null!);

export const useFinance = () => useContext(FinanceContext);

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const currentMesAno = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);

  const getMonthTransactions = useCallback(
    () => transactions.filter((t) => t.mesAno === currentMesAno),
    [transactions, currentMesAno]
  );

  const getMonthBills = useCallback(
    () => bills.filter((b) => b.mesAno === currentMesAno),
    [bills, currentMesAno]
  );

  const value: FinanceContextType = {
    currentMonth, currentYear, setCurrentMonth, setCurrentYear, currentMesAno,
    transactions,
    addTransaction: (t) => {
      setTransactions((prev) => [{ ...t, id: uid() }, ...prev]);
      // Auto-deduct/add balance from bank
      if (t.conta && t.conta !== "Geral") {
        const bank = banks.find((b) => b.nome === t.conta);
        if (bank) {
          const delta = t.tipo === "saida" ? -t.valor : t.valor;
          setBanks((prev) => prev.map((b) => b.id === bank.id ? { ...b, saldo: b.saldo + delta } : b));
        }
      }
    },
    updateTransaction: (id, t) => setTransactions((prev) => prev.map((x) => (x.id === id ? { ...x, ...t } : x))),
    deleteTransaction: (id) => {
      const tx = transactions.find((x) => x.id === id);
      if (tx && tx.conta && tx.conta !== "Geral") {
        const bank = banks.find((b) => b.nome === tx.conta);
        if (bank) {
          const delta = tx.tipo === "saida" ? tx.valor : -tx.valor;
          setBanks((prev) => prev.map((b) => b.id === bank.id ? { ...b, saldo: b.saldo + delta } : b));
        }
      }
      setTransactions((prev) => prev.filter((x) => x.id !== id));
    },
    getMonthTransactions,
    cards,
    addCard: (c) => setCards((prev) => [...prev, { ...c, id: uid() }]),
    updateCard: (id, c) => setCards((prev) => prev.map((x) => (x.id === id ? { ...x, ...c } : x))),
    deleteCard: (id) => setCards((prev) => prev.filter((x) => x.id !== id)),
    banks,
    addBank: (b) => setBanks((prev) => [...prev, { ...b, id: uid() }]),
    updateBank: (id, b) => setBanks((prev) => prev.map((x) => (x.id === id ? { ...x, ...b } : x))),
    deleteBank: (id) => setBanks((prev) => prev.filter((x) => x.id !== id)),
    bills,
    addBill: (b) => setBills((prev) => [...prev, { ...b, id: uid() }]),
    updateBill: (id, b) => setBills((prev) => prev.map((x) => (x.id === id ? { ...x, ...b } : x))),
    deleteBill: (id) => setBills((prev) => prev.filter((x) => x.id !== id)),
    getMonthBills,
    investments,
    addInvestment: (i) => setInvestments((prev) => [...prev, { ...i, id: uid() }]),
    updateInvestment: (id, i) => setInvestments((prev) => prev.map((x) => (x.id === id ? { ...x, ...i } : x))),
    deleteInvestment: (id) => setInvestments((prev) => prev.filter((x) => x.id !== id)),
    categories,
    addCategory: (c) => setCategories((prev) => [...prev, { ...c, id: uid() }]),
    updateCategory: (id, c) => setCategories((prev) => prev.map((x) => (x.id === id ? { ...x, ...c } : x))),
    deleteCategory: (id) => setCategories((prev) => prev.filter((x) => x.id !== id)),
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};
