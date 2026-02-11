import { useState } from "react";
import { CreditCard, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinance, Card } from "@/contexts/FinanceContext";
import ConfirmDialog from "@/components/ConfirmDialog";

const cardColors = ["hsl(280, 60%, 50%)", "hsl(215, 50%, 18%)", "hsl(0, 0%, 15%)", "hsl(152, 60%, 42%)", "hsl(38, 92%, 55%)"];

const Cartoes = () => {
  const { cards, addCard, updateCard, deleteCard } = useFinance();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", bandeira: "Mastercard", limite: "", vencimento: "", cor: cardColors[0] });

  const resetForm = () => { setForm({ nome: "", bandeira: "Mastercard", limite: "", vencimento: "", cor: cardColors[0] }); setEditingId(null); };

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
              <div><Label>Nome do Cartão</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Nubank Mastercard" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Bandeira</Label><Input value={form.bandeira} onChange={(e) => setForm({ ...form, bandeira: e.target.value })} /></div>
                <div><Label>Dia Vencimento</Label><Input type="number" min="1" max="31" value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} /></div>
              </div>
              <div><Label>Limite (R$)</Label><Input type="number" step="0.01" value={form.limite} onChange={(e) => setForm({ ...form, limite: e.target.value })} /></div>
              <div>
                <Label>Cor</Label>
                <div className="flex gap-2 mt-1">
                  {cardColors.map((c) => (
                    <button key={c} onClick={() => setForm({ ...form, cor: c })} className={`w-8 h-8 rounded-full border-2 ${form.cor === c ? "border-primary" : "border-transparent"}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <Button onClick={handleSubmit} className="gradient-primary text-primary-foreground w-full">{editingId ? "Salvar" : "Adicionar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {cards.length === 0 ? (
        <div className="bg-card rounded-xl p-12 shadow-card text-center text-muted-foreground">
          Nenhum cartão cadastrado. Adicione seu primeiro cartão!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card) => {
            const disponivel = card.limite - card.usado;
            const pct = card.limite > 0 ? (card.usado / card.limite) * 100 : 0;
            return (
              <div key={card.id} className="rounded-2xl p-6 text-primary-foreground shadow-elevated animate-fade-in relative group" style={{ background: `linear-gradient(135deg, ${card.cor}, ${card.cor}cc)` }}>
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(card)} className="p-1.5 rounded-lg bg-primary-foreground/20 hover:bg-primary-foreground/30"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteId(card.id)} className="p-1.5 rounded-lg bg-primary-foreground/20 hover:bg-primary-foreground/30"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <div className="flex items-center justify-between mb-8">
                  <CreditCard className="w-8 h-8 opacity-80" />
                  <span className="text-xs font-medium opacity-70">{card.bandeira}</span>
                </div>
                <p className="text-lg font-display font-bold mb-1">{card.nome}</p>
                <p className="text-xs opacity-70 mb-6">Vencimento dia {card.vencimento}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs"><span className="opacity-70">Usado</span><span className="font-semibold">R$ {card.usado.toLocaleString("pt-BR")}</span></div>
                  <div className="w-full h-2 rounded-full bg-primary-foreground/20"><div className="h-2 rounded-full bg-primary-foreground/80 transition-all" style={{ width: `${pct}%` }} /></div>
                  <div className="flex justify-between text-xs"><span className="opacity-70">Disponível</span><span className="font-semibold">R$ {disponivel.toLocaleString("pt-BR")}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} onConfirm={() => { if (deleteId) { deleteCard(deleteId); setDeleteId(null); } }} />
    </div>
  );
};

export default Cartoes;
