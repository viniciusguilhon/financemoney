import { useState } from "react";
import { CreditCard, Plus, Pencil, Trash2, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinance, Card } from "@/contexts/FinanceContext";
import ConfirmDialog from "@/components/ConfirmDialog";

const cardColors = [
  { name: "Roxo", value: "hsl(280, 60%, 50%)" },
  { name: "Azul Escuro", value: "hsl(215, 50%, 18%)" },
  { name: "Preto", value: "hsl(0, 0%, 12%)" },
  { name: "Verde", value: "hsl(152, 60%, 42%)" },
  { name: "Dourado", value: "hsl(38, 92%, 55%)" },
  { name: "Vermelho", value: "hsl(0, 72%, 45%)" },
  { name: "Azul", value: "hsl(210, 80%, 50%)" },
];

const bandeiras = ["Mastercard", "Visa", "Elo", "Amex", "Hipercard"];

const BandeiraLogo = ({ bandeira, size = "sm" }: { bandeira: string; size?: "sm" | "md" }) => {
  const s = size === "sm" ? "text-[8px] w-8 h-5" : "text-[10px] w-10 h-6";
  const colors: Record<string, string> = {
    Mastercard: "bg-gradient-to-r from-red-500 to-yellow-500",
    Visa: "bg-gradient-to-r from-blue-600 to-blue-800",
    Elo: "bg-gradient-to-r from-yellow-400 to-black",
    Amex: "bg-gradient-to-r from-blue-400 to-blue-600",
    Hipercard: "bg-gradient-to-r from-red-600 to-red-800",
  };
  return (
    <div className={`${s} ${colors[bandeira] || "bg-muted"} rounded flex items-center justify-center text-white font-bold`}>
      {bandeira.slice(0, 4)}
    </div>
  );
};

const VirtualCard = ({ card, onEdit, onDelete }: { card: Card; onEdit: () => void; onDelete: () => void }) => {
  const disponivel = card.limite - card.usado;
  const pct = card.limite > 0 ? (card.usado / card.limite) * 100 : 0;
  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="relative group">
      {/* Card */}
      <div
        className="rounded-2xl p-6 text-white shadow-elevated animate-fade-in relative overflow-hidden aspect-[1.6/1] flex flex-col justify-between"
        style={{ background: `linear-gradient(135deg, ${card.cor}, ${card.cor}bb, ${card.cor}88)` }}
      >
        {/* Glossy overlay */}
        <div className="absolute inset-0 opacity-15" style={{ background: "radial-gradient(ellipse at 30% 20%, white, transparent 60%)" }} />
        <div className="absolute top-0 right-0 w-40 h-40 opacity-5" style={{ background: "radial-gradient(circle, white, transparent 70%)" }} />

        {/* Edit/Delete */}
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button onClick={onEdit} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>

        {/* Top row */}
        <div className="flex items-start justify-between relative z-[1]">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 opacity-70 rotate-90" />
          </div>
          <BandeiraLogo bandeira={card.bandeira} size="md" />
        </div>

        {/* Chip */}
        <div className="relative z-[1]">
          <div className="w-10 h-7 rounded-md bg-gradient-to-br from-yellow-300/80 to-yellow-600/80 mb-3 flex items-center justify-center">
            <div className="w-6 h-4 rounded-sm border border-yellow-700/30 bg-gradient-to-br from-yellow-200/50 to-yellow-500/50" />
          </div>
          <p className="text-base font-mono tracking-[0.2em] opacity-90">•••• •••• •••• {String(Math.abs(card.id.charCodeAt(0) * 137 % 10000)).padStart(4, "0")}</p>
        </div>

        {/* Bottom row */}
        <div className="flex items-end justify-between relative z-[1]">
          <div>
            <p className="text-[10px] uppercase opacity-50 tracking-wider">Titular</p>
            <p className="text-sm font-semibold tracking-wide">{card.nome}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase opacity-50 tracking-wider">Venc.</p>
            <p className="text-sm font-mono">{String(card.vencimento).padStart(2, "0")}/••</p>
          </div>
        </div>
      </div>

      {/* Card Info below */}
      <div className="mt-3 bg-card rounded-xl p-4 shadow-card border border-border">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Fatura Atual</span>
            <span className="font-bold text-foreground">{fmt(card.usado)}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(pct, 100)}%`,
                background: pct > 80 ? "hsl(0, 72%, 50%)" : pct > 50 ? "hsl(38, 92%, 55%)" : "hsl(152, 60%, 42%)",
              }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Disponível</span>
            <span className="font-bold text-success">{fmt(disponivel)}</span>
          </div>
          <div className="flex justify-between text-xs pt-1 border-t border-border">
            <span className="text-muted-foreground">Limite Total</span>
            <span className="font-semibold text-foreground">{fmt(card.limite)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Cartoes = () => {
  const { cards, addCard, updateCard, deleteCard } = useFinance();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", bandeira: "Mastercard", limite: "", vencimento: "", cor: cardColors[0].value });

  const resetForm = () => { setForm({ nome: "", bandeira: "Mastercard", limite: "", vencimento: "", cor: cardColors[0].value }); setEditingId(null); };

  const openEdit = (c: Card) => {
    setForm({ nome: c.nome, bandeira: c.bandeira, limite: c.limite.toString(), vencimento: c.vencimento.toString(), cor: c.cor });
    setEditingId(c.id);
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.nome || !form.limite) return;
    const data = { nome: form.nome, bandeira: form.bandeira, limite: parseFloat(form.limite), usado: 0, vencimento: parseInt(form.vencimento) || 10, cor: form.cor };
    if (editingId) updateCard(editingId, data);
    else addCard(data);
    setOpen(false);
    resetForm();
  };

  const totalLimite = cards.reduce((a, c) => a + c.limite, 0);
  const totalUsado = cards.reduce((a, c) => a + c.usado, 0);
  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Cartões de Crédito</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie seus cartões e faturas</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground hover:opacity-90 gap-2">
              <Plus className="w-4 h-4" /> Adicionar Cartão
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle className="font-display">{editingId ? "Editar Cartão" : "Novo Cartão"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div><Label>Nome do Cartão</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Nubank Gold" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Bandeira</Label>
                  <Select value={form.bandeira} onValueChange={(v) => setForm({ ...form, bandeira: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {bandeiras.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Dia Vencimento</Label><Input type="number" min="1" max="31" value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} /></div>
              </div>
              <div><Label>Limite (R$)</Label><Input type="number" step="0.01" value={form.limite} onChange={(e) => setForm({ ...form, limite: e.target.value })} /></div>
              <div>
                <Label>Cor do Cartão</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {cardColors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setForm({ ...form, cor: c.value })}
                      className={`w-10 h-10 rounded-xl border-2 transition-all ${form.cor === c.value ? "border-primary scale-110" : "border-transparent"}`}
                      style={{ background: `linear-gradient(135deg, ${c.value}, ${c.value}bb)` }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleSubmit} className="gradient-primary text-primary-foreground w-full">{editingId ? "Salvar" : "Adicionar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      {cards.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl p-4 shadow-card border border-border text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Limite Total</p>
            <p className="text-lg font-display font-bold text-foreground">{fmt(totalLimite)}</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card border border-border text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Usado</p>
            <p className="text-lg font-display font-bold text-warning">{fmt(totalUsado)}</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card border border-border text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Disponível</p>
            <p className="text-lg font-display font-bold text-success">{fmt(totalLimite - totalUsado)}</p>
          </div>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="bg-card rounded-xl p-12 shadow-card text-center text-muted-foreground">
          Nenhum cartão cadastrado. Adicione seu primeiro cartão!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <VirtualCard
              key={card.id}
              card={card}
              onEdit={() => openEdit(card)}
              onDelete={() => setDeleteId(card.id)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={() => { if (deleteId) { deleteCard(deleteId); setDeleteId(null); } }} />
    </div>
  );
};

export default Cartoes;
