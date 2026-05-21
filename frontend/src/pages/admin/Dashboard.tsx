import { Activity, Users, Hospital, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';

export function AdminDashboard() {
  const stats = [
    { label: 'Total de Unidades', value: '12', icon: Hospital, trend: '+2 esse mês', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Profissionais Ativos', value: '148', icon: Users, trend: '+12% vs mês anterior', color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Atendimentos Hoje', value: '1.284', icon: Activity, trend: 'Normal', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Taxa de Ocupação', value: '76%', icon: TrendingUp, trend: '-4% vs média', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
        <p className="text-muted-foreground mt-2">Visão geral e indicadores do sistema hospitalar municipal.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass p-6 rounded-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bg)}>
                  <Icon className={cn("w-6 h-6", stat.color)} />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <div className="mt-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                  {stat.trend}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass p-6 rounded-2xl min-h-[400px] flex flex-col">
          <h3 className="text-lg font-semibold mb-4">Volume de Atendimentos Semanal</h3>
          <div className="flex-1 rounded-xl border border-dashed border-border/50 flex items-center justify-center text-muted-foreground bg-secondary/20">
            [Gráfico de Área - Volume Semanal]
          </div>
        </div>
        <div className="glass p-6 rounded-2xl flex flex-col">
          <h3 className="text-lg font-semibold mb-4">Alertas de IA (Surtos)</h3>
          <div className="flex-1 space-y-4">
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex gap-3">
              <Activity className="w-5 h-5 text-destructive shrink-0" />
              <div>
                <h4 className="font-semibold text-destructive text-sm">Possível Surto de Dengue</h4>
                <p className="text-xs text-destructive/80 mt-1">Aumento de 45% nos casos na UPA Centro nas últimas 48h.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
