import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Activity,
  FileText,
  LogOut,
  Menu,
  X,
  Hospital,
  Pill,
  Brain,
  Building,
  Box,
  Wallet,
  Calculator,
  Landmark,
  PieChart,
  FileSpreadsheet,
  PackageOpen,
  AlertTriangle,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  ArrowRightLeft, // Importar o ícone ArrowRightLeft
  FileCode2,
} from 'lucide-react';
import { cn } from '../lib/utils';

type NavLink = { name: string; path: string; icon: any };
type NavGroup = { name: string; links: NavLink[] };

export function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Visão Geral': true,
    'Cadastros Base': true,
    'Recepção & Atendimentos': true,
    'Atendimento Clínico': true,
    'Financeiro': true,
    'Faturamento Hospitalar': true
  });

  const toggleGroup = (name: string) => {
    setOpenGroups(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const adminGroups: NavGroup[] = [
    {
      name: 'Visão Geral',
      links: [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { name: 'Relatórios de IA', path: '/admin/relatorios', icon: FileText },
      ]
    },
    {
      name: 'Cadastros Base',
      links: [
        { name: 'Unidades de Saúde', path: '/admin/unidades', icon: Hospital },
        { name: 'Profissionais', path: '/admin/profissionais', icon: Users },
        // O ícone Package foi removido pois não é mais usado aqui, mas pode ser adicionado se necessário em outro lugar.
        { name: 'Fornecedores', path: '/admin/cadastros/fornecedores', icon: Box },
        { name: 'Convênios', path: '/admin/cadastros/convenios', icon: Building },
      ]
    },
    {
      name: 'Recepção & Atendimentos',
      links: [
        { name: 'Fluxo de Atendimento', path: '/clinical/atendimentos', icon: ClipboardList },
        { name: 'Novo Internamento', path: '/clinical/atendimentos/internamento/novo', icon: Hospital },
        { name: 'Nova Urgência', path: '/clinical/atendimentos/urgencia/novo', icon: AlertTriangle },
        { name: 'Consulta Eletiva', path: '/clinical/atendimentos/consulta/novo', icon: Stethoscope },
      ]
    },
    {
      name: 'Atendimento Clínico',
      links: [
        { name: 'Triagem (Enfermagem)', path: '/clinical/triagem', icon: Activity },
        { name: 'Fila Médica', path: '/clinical/fila-medica', icon: Users },
        { name: 'Consultório (Atendimento)', path: '/clinical/atendimento', icon: Stethoscope },
      ]
    },
    {
      name: 'Estoque & Farmácia',
      links: [
        { name: 'Gestão de Insumos', path: '/admin/estoque/insumos', icon: Box },
        { name: 'Movimentação de Farmácia', path: '/admin/estoque/movimentacao', icon: ArrowRightLeft },
      ]
    },
    {
      name: 'Financeiro',
      links: [
        { name: 'Contas a Pagar/Receber', path: '/admin/financeiro/contas', icon: Wallet },
        { name: 'Gestão de Custos', path: '/admin/financeiro/custos', icon: Calculator },
        { name: 'Integração Bancária', path: '/admin/financeiro/banco', icon: Landmark },
        { name: 'DRE de Unidade', path: '/admin/financeiro/dre', icon: PieChart },
      ]
    },
    {
      name: 'Faturamento Hospitalar',
      links: [
        { name: 'Tabelas de Preços', path: '/admin/faturamento/tabelas', icon: FileSpreadsheet },
        { name: 'Guias de Atendimento', path: '/admin/faturamento/guias', icon: Stethoscope },
        { name: 'Lançamentos da Conta', path: '/admin/faturamento/lancamentos', icon: FileText },
        { name: 'Remessas TISS', path: '/admin/faturamento/remessas', icon: FileCode2 },
        { name: 'Fechamento de Lote', path: '/admin/faturamento/lotes', icon: PackageOpen },
        { name: 'Gestão de Glosas', path: '/admin/faturamento/glosas', icon: AlertTriangle },
      ]
    }
  ];

  const clinicGroups: NavGroup[] = [
    {
      name: 'Recepção & Atendimentos',
      links: [
        { name: 'Fluxo de Atendimento', path: '/clinical/atendimentos', icon: ClipboardList },
        { name: 'Novo Internamento', path: '/clinical/atendimentos/internamento/novo', icon: Hospital },
        { name: 'Nova Urgência', path: '/clinical/atendimentos/urgencia/novo', icon: AlertTriangle },
        { name: 'Consulta Eletiva', path: '/clinical/atendimentos/consulta/novo', icon: Stethoscope },
      ]
    },
    {
      name: 'Atendimento Clínico',
      links: [
        { name: 'Gestão de Pacientes', path: '/clinical/pacientes', icon: Users },
        { name: 'Triagem (Enfermagem)', path: '/clinical/triagem', icon: Activity },
        { name: 'Fila Médica', path: '/clinical/fila-medica', icon: Users },
        { name: 'Consultório (Atendimento)', path: '/clinical/atendimento', icon: Stethoscope },
        { name: 'IA Assistiva', path: '/clinical/ia', icon: Brain },
      ]
    }
  ];

  const groups = user?.role === 'ADMIN' ? adminGroups : clinicGroups;

  // Filter links based on role for RBAC
  const filteredGroups = groups.map(group => ({
    ...group,
    links: group.links.filter(link => {
      if (user?.role === 'ENFERMEIRO' && link.path === '/clinical/ia') return false;
      return true;
    })
  })).filter(group => group.links.length > 0);

  const NavLinks = () => (
    <div className="space-y-4">
      {filteredGroups.map((group) => (
        <div key={group.name} className="space-y-1">
          <button
            onClick={() => toggleGroup(group.name)}
            className="w-full flex items-center justify-between px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {group.name}
            {openGroups[group.name] ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {openGroups[group.name] && (
            <div className="space-y-1">
              {group.links.map((link) => {
                const isActive = location.pathname === link.path || location.pathname.startsWith(`${link.path}/`);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 glass border-r flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:shrink-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-20 flex items-center px-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
              <Activity className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="font-semibold text-xl tracking-tight text-foreground">
              Medi<span className="text-primary">Core</span>
            </h1>
          </div>
          <button
            className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <NavLinks />
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-secondary/50 border border-border/50">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary font-semibold">
              {user?.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair do sistema</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 glass border-b sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between lg:justify-end">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-secondary text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground">Bem-vindo de volta</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
