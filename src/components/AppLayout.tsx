import { ReactNode, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ArrowLeftRight, CreditCard, Landmark, TrendingUp,
  BarChart3, Menu, X, User, LogOut, Sun, Moon, PanelLeftClose, PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import MoneyLogo from "@/components/MoneyLogo";
import ConfirmDialog from "@/components/ConfirmDialog";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/lancamentos", label: "Lançamentos", icon: ArrowLeftRight },
  { path: "/cartoes", label: "Cartões", icon: CreditCard },
  { path: "/bancos", label: "Bancos", icon: Landmark },
  { path: "/investimentos", label: "Investimentos", icon: TrendingUp },
  { path: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { path: "/perfil", label: "Perfil", icon: User },
];

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();

  const sidebarWidth = sidebarCollapsed ? "w-16" : "w-60";
  const mainMargin = sidebarCollapsed ? "md:ml-16" : "md:ml-60";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop/Tablet Sidebar */}
      <aside className={cn("hidden md:flex flex-col bg-sidebar fixed h-full z-30 transition-all duration-200", sidebarWidth)}>
        <div className="flex items-center justify-between px-3 py-5 cursor-pointer" onClick={() => navigate("/")}>
          {!sidebarCollapsed && <MoneyLogo />}
          {sidebarCollapsed && <div className="w-full flex justify-center"><MoneyLogo size="sm" /></div>}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); setSidebarCollapsed(!sidebarCollapsed); }}
          className="hidden md:flex items-center justify-center mx-auto mb-2 w-8 h-8 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>

        <nav className="flex-1 px-2 py-2 space-y-0.5">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={sidebarCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150",
                  sidebarCollapsed && "justify-center px-0",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <item.icon className={cn("w-[18px] h-[18px] flex-shrink-0", active && "text-primary")} />
                {!sidebarCollapsed && item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-2 py-4 space-y-0.5">
          <button
            onClick={toggleTheme}
            title={sidebarCollapsed ? (theme === "light" ? "Modo Escuro" : "Modo Claro") : undefined}
            className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent w-full transition-colors", sidebarCollapsed && "justify-center px-0")}
          >
            {theme === "light" ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
            {!sidebarCollapsed && (theme === "light" ? "Modo Escuro" : "Modo Claro")}
          </button>
          <button
            onClick={() => setLogoutOpen(true)}
            title={sidebarCollapsed ? "Sair" : undefined}
            className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent w-full transition-colors", sidebarCollapsed && "justify-center px-0")}
          >
            <LogOut className="w-[18px] h-[18px]" />
            {!sidebarCollapsed && "Sair"}
          </button>
          {!sidebarCollapsed && <p className="text-[10px] text-sidebar-foreground/30 text-center mt-3">Money © 2026</p>}
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-3 z-40">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <MoneyLogo size="sm" />
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggleTheme} className="text-sidebar-foreground p-2">
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-sidebar-foreground p-2">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-foreground/50" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute top-14 left-0 right-0 bg-sidebar border-b border-sidebar-border p-3 space-y-1 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => { setMobileOpen(false); setLogoutOpen(true); }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent w-full"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30 flex justify-around py-1.5 px-1">
        {navItems.slice(0, 5).map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[9px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("w-4 h-4", active && "text-primary")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className={cn("flex-1 pt-14 md:pt-0 pb-16 md:pb-0 transition-all duration-200", mainMargin)}>
        <div className="p-3 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Logout Confirmation */}
      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        onConfirm={() => { setLogoutOpen(false); signOut(); }}
        title="Deseja sair?"
        description="Tem certeza que deseja sair da sua conta?"
      />
    </div>
  );
};

export default AppLayout;