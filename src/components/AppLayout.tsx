import { ReactNode, useState, useEffect, useCallback, memo } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ArrowLeftRight, CreditCard, Landmark, TrendingUp,
  BarChart3, Menu, X, User, LogOut, Sun, Moon, RefreshCw, MessageCircle, PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useFinance } from "@/contexts/FinanceContext";
import MoneyLogo from "@/components/MoneyLogo";
import ConfirmDialog from "@/components/ConfirmDialog";
import WelcomeDialog from "@/components/WelcomeDialog";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/lancamentos", label: "Lançamentos", icon: ArrowLeftRight },
  { path: "/cartoes", label: "Cartões", icon: CreditCard },
  { path: "/bancos", label: "Bancos", icon: Landmark },
  { path: "/investimentos", label: "Investimentos", icon: TrendingUp },
  { path: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { path: "/tutorial", label: "Tutorial de Uso", icon: PlayCircle },
  { path: "/perfil", label: "Perfil", icon: User },
];

const bottomNavItems = navItems.filter(i => ["/", "/lancamentos", "/cartoes", "/bancos", "/investimentos"].includes(i.path));

interface WhatsAppConfig {
  enabled: boolean;
  url: string;
  label: string;
  color: string;
}

interface AppLayoutProps {
  children: ReactNode;
}

// Memoized nav item component
const NavItem = memo(({ item, active, collapsed, onClick }: { 
  item: typeof navItems[0]; 
  active: boolean; 
  collapsed: boolean;
  onClick?: () => void;
}) => (
  <Link
    to={item.path}
    onClick={onClick}
    title={collapsed ? item.label : undefined}
    className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150",
      collapsed && "justify-center px-0",
      active
        ? "bg-primary/15 text-primary"
        : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
    )}
  >
    <item.icon className={cn("w-[18px] h-[18px] flex-shrink-0", active && "text-primary")} />
    {!collapsed && item.label}
  </Link>
));
NavItem.displayName = "NavItem";

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const { refreshData } = useFinance();
  const [whatsapp, setWhatsapp] = useState<WhatsAppConfig | null>(null);
  

  useEffect(() => {
    let mounted = true;
    fetch(`${SUPABASE_URL}/functions/v1/admin-templates?type=settings&key=whatsapp_support`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data && mounted) setWhatsapp(data); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setTimeout(() => setRefreshing(false), 600);
  }, [refreshData]);

  const closeMobileMenu = useCallback(() => setMobileOpen(false), []);
  const toggleSidebar = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSidebarCollapsed(prev => !prev);
  }, []);

  const sidebarWidth = sidebarCollapsed ? "w-16" : "w-60";
  const mainMargin = sidebarCollapsed ? "md:ml-16" : "md:ml-60";

  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden">
      {/* Desktop/Tablet Sidebar */}
      <aside className={cn("hidden md:flex flex-col bg-sidebar fixed h-full z-30 transition-all duration-200", sidebarWidth)}>
        <div className="flex items-center justify-between px-3 py-5 cursor-pointer" onClick={() => navigate("/")}>
          {!sidebarCollapsed && <MoneyLogo />}
          {sidebarCollapsed && <div className="w-full flex justify-center"><MoneyLogo size="sm" hideText /></div>}
        </div>

        {/* Hamburger toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); setSidebarCollapsed(!sidebarCollapsed); }}
          className="hidden md:flex items-center justify-center mx-auto mb-2 w-8 h-8 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          <Menu className="w-4 h-4" />
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
          {/* Refresh button - Desktop */}
          <button
            onClick={handleRefresh}
            title={sidebarCollapsed ? "Atualizar dados" : undefined}
            className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent w-full transition-colors", sidebarCollapsed && "justify-center px-0")}
          >
            <RefreshCw className={cn("w-[18px] h-[18px]", refreshing && "animate-spin")} />
            {!sidebarCollapsed && "Atualizar"}
          </button>
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
            className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-destructive hover:bg-destructive/10 w-full transition-colors", sidebarCollapsed && "justify-center px-0")}
          >
            <LogOut className="w-[18px] h-[18px]" />
            {!sidebarCollapsed && "Sair"}
          </button>

          {/* WhatsApp Support Button */}
          {whatsapp?.enabled && whatsapp.url && (
            <a
              href={whatsapp.url}
              target="_blank"
              rel="noopener noreferrer"
              title={sidebarCollapsed ? whatsapp.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium w-full transition-colors text-white bg-gradient-to-r from-emerald-500 to-emerald-700",
                sidebarCollapsed && "justify-center px-0"
              )}
            >
              <MessageCircle className="w-[18px] h-[18px] flex-shrink-0" />
              {!sidebarCollapsed && whatsapp.label}
            </a>
          )}

          {!sidebarCollapsed && <p className="text-[10px] text-sidebar-foreground/30 text-center mt-3">Finanças PRO © 2026</p>}
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-3 z-40 pt-[env(safe-area-inset-top)] h-[calc(3.5rem+env(safe-area-inset-top))]">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <MoneyLogo size="sm" />
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleRefresh} className="text-sidebar-foreground p-2" title="Atualizar dados">
            <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
          </button>
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
            className="absolute top-[calc(3.5rem+env(safe-area-inset-top))] left-0 right-0 bg-sidebar border-b border-sidebar-border p-3 space-y-1 animate-fade-in"
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
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </button>
            {/* WhatsApp in mobile menu */}
            {whatsapp?.enabled && whatsapp.url && (
              <a
                href={whatsapp.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium w-full text-white bg-gradient-to-r from-emerald-500 to-emerald-700"
                onClick={() => setMobileOpen(false)}
              >
                <MessageCircle className="w-5 h-5" />
                {whatsapp.label}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30 flex justify-around py-1.5 px-1 safe-area-bottom">
        {navItems.filter(i => ["/", "/lancamentos", "/cartoes", "/bancos", "/investimentos"].includes(i.path)).map((item) => {
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
              <item.icon className={cn("w-5 h-5", active && "text-primary")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className={cn("flex-1 pt-[calc(3.5rem+env(safe-area-inset-top))] md:pt-0 pb-16 md:pb-0 transition-all duration-200", mainMargin)}>
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
        confirmLabel="Sair"
      />

      <WelcomeDialog />
    </div>
  );
};

export default AppLayout;
