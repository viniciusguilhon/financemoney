import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFinance } from "@/contexts/FinanceContext";
import { cn } from "@/lib/utils";

const monthNamesShort = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const monthNamesFull = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const MonthYearSelector = () => {
  const { currentMonth, currentYear, setCurrentMonth, setCurrentYear } = useFinance();
  const [viewYear, setViewYear] = useState(currentYear);
  const [open, setOpen] = useState(false);

  const prev = () => {
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const next = () => {
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const selectMonth = (m: number) => {
    setCurrentMonth(m);
    setCurrentYear(viewYear);
    setOpen(false);
  };

  const now = new Date();
  const todayMonth = now.getMonth() + 1;
  const todayYear = now.getFullYear();

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={prev} className="h-8 w-8">
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-[170px] gap-2 text-sm font-semibold">
            <CalendarDays className="w-4 h-4" />
            {monthNamesFull[currentMonth - 1]} {currentYear}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-4 pointer-events-auto" align="center">
          {/* Year selector */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewYear(viewYear - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-bold text-foreground">{viewYear}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewYear(viewYear + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-2">
            {monthNamesShort.map((name, i) => {
              const m = i + 1;
              const isSelected = m === currentMonth && viewYear === currentYear;
              const isToday = m === todayMonth && viewYear === todayYear;
              return (
                <button
                  key={name}
                  onClick={() => selectMonth(m)}
                  className={cn(
                    "px-2 py-2 rounded-lg text-sm font-medium transition-all",
                    isSelected
                      ? "gradient-primary text-primary-foreground shadow-sm"
                      : isToday
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {name}
                </button>
              );
            })}
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 mt-3 pt-3 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => { setCurrentMonth(todayMonth); setCurrentYear(todayYear); setOpen(false); }}
            >
              Hoje
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setViewYear(viewYear - 1)}
            >
              {viewYear - 1}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setViewYear(viewYear + 1)}
            >
              {viewYear + 1}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Button variant="ghost" size="icon" onClick={next} className="h-8 w-8">
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default MonthYearSelector;
