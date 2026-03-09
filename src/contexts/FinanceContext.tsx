import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  mesAno: string;
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

export interface SavingsGoal {
  id: string;
  nome: string;
  descricao: string;
  valorAlvo: number;
  valorAtual: number;
  imageUrl?: string;
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
  currentMonth: number;
  currentYear: number;
  setCurrentMonth: (m: number) => void;
  setCurrentYear: (y: number) => void;
  currentMesAno: string;
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getMonthTransactions: () => Transaction[];
  cards: Card[];
  addCard: (c: Omit<Card, "id">) => void;
  updateCard: (id: string, c: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  banks: Bank[];
  addBank: (b: Omit<Bank, "id">) => void;
  updateBank: (id: string, b: Partial<Bank>) => void;
  deleteBank: (id: string) => void;
  bills: Bill[];
  addBill: (b: Omit<Bill, "id">) => void;
  updateBill: (id: string, b: Partial<Bill>) => void;
  deleteBill: (id: string) => void;
  getMonthBills: () => Bill[];
  investments: Investment[];
  addInvestment: (i: Omit<Investment, "id">) => void;
  updateInvestment: (id: string, i: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;
  categories: Category[];
  addCategory: (c: Omit<Category, "id">) => void;
  updateCategory: (id: string, c: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  savingsGoals: SavingsGoal[];
  addSavingsGoal: (g: Omit<SavingsGoal, "id">) => void;
  updateSavingsGoal: (id: string, g: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  loading: boolean;
  refreshData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType>(null!);

export const useFinance = () => useContext(FinanceContext);

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
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
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setCards([]);
      setBanks([]);
      setBills([]);
      setInvestments([]);
      setCategories(defaultCategories);
      setSavingsGoals([]);
      setLoading(false);
      return;
    }
    loadAll();
  }, [user]);

  const loadAll = async () => {
    if (!user) return;
    setLoading(true);
    const [txRes, cardsRes, banksRes, billsRes, invRes, catRes, goalsRes] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("cards").select("*").eq("user_id", user.id),
      supabase.from("banks").select("*").eq("user_id", user.id),
      supabase.from("bills").select("*").eq("user_id", user.id),
      supabase.from("investments").select("*").eq("user_id", user.id),
      supabase.from("categories").select("*").eq("user_id", user.id),
      supabase.from("savings_goals").select("*").eq("user_id", user.id),
    ]);

    if (txRes.data) setTransactions(txRes.data.map(mapTx));
    if (cardsRes.data) setCards(cardsRes.data.map(mapCard));
    if (banksRes.data) setBanks(banksRes.data.map(mapBank));
    if (billsRes.data) setBills(billsRes.data.map(mapBill));
    if (invRes.data) setInvestments(invRes.data.map(mapInv));
    if (goalsRes.data) setSavingsGoals(goalsRes.data.map(mapGoal));
    if (catRes.data && catRes.data.length > 0) {
      setCategories(catRes.data.map(mapCat));
    } else if (user) {
      const inserts = defaultCategories.map((c) => ({ user_id: user.id, nome: c.nome, tipo: c.tipo }));
      const { data } = await supabase.from("categories").insert(inserts).select();
      if (data) setCategories(data.map(mapCat));
    }
    setLoading(false);
  };

  const mapTx = (r: any): Transaction => ({
    id: r.id, data: r.data, categoria: r.categoria, descricao: r.descricao,
    valor: Number(r.valor), tipo: r.tipo as "entrada" | "saida", conta: r.conta,
    pago: r.pago, parcelas: r.parcelas, parcelaAtual: r.parcela_atual, mesAno: r.mes_ano,
  });
  const mapCard = (r: any): Card => ({
    id: r.id, nome: r.nome, bandeira: r.bandeira, limite: Number(r.limite),
    usado: Number(r.usado), vencimento: r.vencimento, cor: r.cor, customImage: r.custom_image,
  });
  const mapBank = (r: any): Bank => ({
    id: r.id, nome: r.nome, saldo: Number(r.saldo), cor: r.cor, logo: r.logo, customLogo: r.custom_logo,
  });
  const mapBill = (r: any): Bill => ({
    id: r.id, desc: r.descricao, valor: Number(r.valor), vencimento: r.vencimento || "",
    pago: r.pago, tipo: r.tipo as "pagar" | "receber", mesAno: r.mes_ano,
  });
  const mapInv = (r: any): Investment => ({
    id: r.id, nome: r.nome, categoria: r.categoria, investido: Number(r.investido),
    retorno: Number(r.retorno), data: r.data, cor: r.cor,
  });
  const mapCat = (r: any): Category => ({
    id: r.id, nome: r.nome, tipo: r.tipo as "entrada" | "saida" | "ambos",
  });
  const mapGoal = (r: any): SavingsGoal => ({
    id: r.id, nome: r.nome, descricao: r.descricao,
    valorAlvo: Number(r.valor_alvo), valorAtual: Number(r.valor_atual),
    imageUrl: r.image_url,
  });

  const getMonthTransactions = useCallback(
    () => transactions.filter((t) => t.mesAno === currentMesAno),
    [transactions, currentMesAno]
  );

  const getMonthBills = useCallback(
    () => bills.filter((b) => b.mesAno === currentMesAno),
    [bills, currentMesAno]
  );

  // CRUD helpers
  const addTransaction = async (t: Omit<Transaction, "id">) => {
    if (!user) return;
    const { data } = await supabase.from("transactions").insert({
      user_id: user.id, data: t.data, categoria: t.categoria, descricao: t.descricao,
      valor: t.valor, tipo: t.tipo, conta: t.conta, pago: t.pago,
      parcelas: t.parcelas, parcela_atual: t.parcelaAtual, mes_ano: t.mesAno,
    }).select().single();
    if (data) setTransactions((prev) => [mapTx(data), ...prev]);
    if (t.conta && t.conta !== "Geral") {
      const bank = banks.find((b) => b.nome === t.conta);
      if (bank) {
        const delta = t.tipo === "saida" ? -t.valor : t.valor;
        const newSaldo = bank.saldo + delta;
        await supabase.from("banks").update({ saldo: newSaldo }).eq("id", bank.id);
        setBanks((prev) => prev.map((b) => b.id === bank.id ? { ...b, saldo: newSaldo } : b));
      }
    }
  };

  const updateTransaction = async (id: string, t: Partial<Transaction>) => {
    const updates: any = {};
    if (t.data !== undefined) updates.data = t.data;
    if (t.categoria !== undefined) updates.categoria = t.categoria;
    if (t.descricao !== undefined) updates.descricao = t.descricao;
    if (t.valor !== undefined) updates.valor = t.valor;
    if (t.tipo !== undefined) updates.tipo = t.tipo;
    if (t.conta !== undefined) updates.conta = t.conta;
    if (t.pago !== undefined) updates.pago = t.pago;
    if (t.parcelas !== undefined) updates.parcelas = t.parcelas;
    if (t.parcelaAtual !== undefined) updates.parcela_atual = t.parcelaAtual;
    if (t.mesAno !== undefined) updates.mes_ano = t.mesAno;
    await supabase.from("transactions").update(updates).eq("id", id);
    setTransactions((prev) => prev.map((x) => (x.id === id ? { ...x, ...t } : x)));
  };

  const deleteTransaction = async (id: string) => {
    const tx = transactions.find((x) => x.id === id);
    if (tx && tx.conta && tx.conta !== "Geral") {
      const bank = banks.find((b) => b.nome === tx.conta);
      if (bank) {
        const delta = tx.tipo === "saida" ? tx.valor : -tx.valor;
        const newSaldo = bank.saldo + delta;
        await supabase.from("banks").update({ saldo: newSaldo }).eq("id", bank.id);
        setBanks((prev) => prev.map((b) => b.id === bank.id ? { ...b, saldo: newSaldo } : b));
      }
    }
    await supabase.from("transactions").delete().eq("id", id);
    setTransactions((prev) => prev.filter((x) => x.id !== id));
  };

  const addCard = async (c: Omit<Card, "id">) => {
    if (!user) return;
    const { data } = await supabase.from("cards").insert({
      user_id: user.id, nome: c.nome, bandeira: c.bandeira, limite: c.limite,
      usado: c.usado, vencimento: c.vencimento, cor: c.cor, custom_image: c.customImage,
    }).select().single();
    if (data) setCards((prev) => [...prev, mapCard(data)]);
  };

  const updateCard = async (id: string, c: Partial<Card>) => {
    const updates: any = {};
    if (c.nome !== undefined) updates.nome = c.nome;
    if (c.bandeira !== undefined) updates.bandeira = c.bandeira;
    if (c.limite !== undefined) updates.limite = c.limite;
    if (c.usado !== undefined) updates.usado = c.usado;
    if (c.vencimento !== undefined) updates.vencimento = c.vencimento;
    if (c.cor !== undefined) updates.cor = c.cor;
    if (c.customImage !== undefined) updates.custom_image = c.customImage;
    await supabase.from("cards").update(updates).eq("id", id);
    setCards((prev) => prev.map((x) => (x.id === id ? { ...x, ...c } : x)));
  };

  const deleteCard = async (id: string) => {
    await supabase.from("cards").delete().eq("id", id);
    setCards((prev) => prev.filter((x) => x.id !== id));
  };

  const addBank = async (b: Omit<Bank, "id">) => {
    if (!user) return;
    const { data } = await supabase.from("banks").insert({
      user_id: user.id, nome: b.nome, saldo: b.saldo, cor: b.cor, logo: b.logo, custom_logo: b.customLogo,
    }).select().single();
    if (data) setBanks((prev) => [...prev, mapBank(data)]);
  };

  const updateBank = async (id: string, b: Partial<Bank>) => {
    const updates: any = {};
    if (b.nome !== undefined) updates.nome = b.nome;
    if (b.saldo !== undefined) updates.saldo = b.saldo;
    if (b.cor !== undefined) updates.cor = b.cor;
    if (b.logo !== undefined) updates.logo = b.logo;
    if (b.customLogo !== undefined) updates.custom_logo = b.customLogo;
    await supabase.from("banks").update(updates).eq("id", id);
    setBanks((prev) => prev.map((x) => (x.id === id ? { ...x, ...b } : x)));
  };

  const deleteBank = async (id: string) => {
    await supabase.from("banks").delete().eq("id", id);
    setBanks((prev) => prev.filter((x) => x.id !== id));
  };

  const addBill = async (b: Omit<Bill, "id">) => {
    if (!user) return;
    const { data } = await supabase.from("bills").insert({
      user_id: user.id, descricao: b.desc, valor: b.valor, vencimento: b.vencimento || null,
      pago: b.pago, tipo: b.tipo, mes_ano: b.mesAno,
    }).select().single();
    if (data) setBills((prev) => [...prev, mapBill(data)]);
  };

  const updateBill = async (id: string, b: Partial<Bill>) => {
    const updates: any = {};
    if (b.desc !== undefined) updates.descricao = b.desc;
    if (b.valor !== undefined) updates.valor = b.valor;
    if (b.vencimento !== undefined) updates.vencimento = b.vencimento;
    if (b.pago !== undefined) updates.pago = b.pago;
    if (b.tipo !== undefined) updates.tipo = b.tipo;
    if (b.mesAno !== undefined) updates.mes_ano = b.mesAno;
    await supabase.from("bills").update(updates).eq("id", id);
    setBills((prev) => prev.map((x) => (x.id === id ? { ...x, ...b } : x)));
  };

  const deleteBill = async (id: string) => {
    await supabase.from("bills").delete().eq("id", id);
    setBills((prev) => prev.filter((x) => x.id !== id));
  };

  const addInvestment = async (i: Omit<Investment, "id">) => {
    if (!user) return;
    const { data } = await supabase.from("investments").insert({
      user_id: user.id, nome: i.nome, categoria: i.categoria, investido: i.investido,
      retorno: i.retorno, data: i.data, cor: i.cor,
    }).select().single();
    if (data) setInvestments((prev) => [...prev, mapInv(data)]);
  };

  const updateInvestment = async (id: string, i: Partial<Investment>) => {
    const updates: any = {};
    if (i.nome !== undefined) updates.nome = i.nome;
    if (i.categoria !== undefined) updates.categoria = i.categoria;
    if (i.investido !== undefined) updates.investido = i.investido;
    if (i.retorno !== undefined) updates.retorno = i.retorno;
    if (i.data !== undefined) updates.data = i.data;
    if (i.cor !== undefined) updates.cor = i.cor;
    await supabase.from("investments").update(updates).eq("id", id);
    setInvestments((prev) => prev.map((x) => (x.id === id ? { ...x, ...i } : x)));
  };

  const deleteInvestment = async (id: string) => {
    await supabase.from("investments").delete().eq("id", id);
    setInvestments((prev) => prev.filter((x) => x.id !== id));
  };

  const addCategory = async (c: Omit<Category, "id">) => {
    if (!user) return;
    const { data } = await supabase.from("categories").insert({
      user_id: user.id, nome: c.nome, tipo: c.tipo,
    }).select().single();
    if (data) setCategories((prev) => [...prev, mapCat(data)]);
  };

  const updateCategory = async (id: string, c: Partial<Category>) => {
    const updates: any = {};
    if (c.nome !== undefined) updates.nome = c.nome;
    if (c.tipo !== undefined) updates.tipo = c.tipo;
    await supabase.from("categories").update(updates).eq("id", id);
    setCategories((prev) => prev.map((x) => (x.id === id ? { ...x, ...c } : x)));
  };

  const deleteCategory = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id);
    setCategories((prev) => prev.filter((x) => x.id !== id));
  };

  const addSavingsGoal = async (g: Omit<SavingsGoal, "id">) => {
    if (!user) return;
    const { data } = await supabase.from("savings_goals").insert({
      user_id: user.id, nome: g.nome, descricao: g.descricao,
      valor_alvo: g.valorAlvo, valor_atual: g.valorAtual, image_url: g.imageUrl,
    }).select().single();
    if (data) setSavingsGoals((prev) => [...prev, mapGoal(data)]);
  };

  const updateSavingsGoal = async (id: string, g: Partial<SavingsGoal>) => {
    const updates: any = {};
    if (g.nome !== undefined) updates.nome = g.nome;
    if (g.descricao !== undefined) updates.descricao = g.descricao;
    if (g.valorAlvo !== undefined) updates.valor_alvo = g.valorAlvo;
    if (g.valorAtual !== undefined) updates.valor_atual = g.valorAtual;
    if (g.imageUrl !== undefined) updates.image_url = g.imageUrl;
    await supabase.from("savings_goals").update(updates).eq("id", id);
    setSavingsGoals((prev) => prev.map((x) => (x.id === id ? { ...x, ...g } : x)));
  };

  const deleteSavingsGoal = async (id: string) => {
    await supabase.from("savings_goals").delete().eq("id", id);
    setSavingsGoals((prev) => prev.filter((x) => x.id !== id));
  };

  const refreshData = useCallback(async () => {
    if (user) await loadAll();
  }, [user]);

  const value = useMemo<FinanceContextType>(() => ({
    currentMonth, currentYear, setCurrentMonth, setCurrentYear, currentMesAno,
    transactions, addTransaction, updateTransaction, deleteTransaction, getMonthTransactions,
    cards, addCard, updateCard, deleteCard,
    banks, addBank, updateBank, deleteBank,
    bills, addBill, updateBill, deleteBill, getMonthBills,
    investments, addInvestment, updateInvestment, deleteInvestment,
    categories, addCategory, updateCategory, deleteCategory,
    savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal,
    loading, refreshData,
  }), [currentMonth, currentYear, currentMesAno, transactions, cards, banks, bills, investments, categories, savingsGoals, loading, refreshData, getMonthTransactions, getMonthBills]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};
