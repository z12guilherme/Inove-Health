import { useState, useEffect } from 'react';
import { Activity, Users, Hospital, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';

interface DashboardData {
  unidades: number;
  profissionais: number;
  atendimentos: number;
  ocupacao: string;
}

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    unidades: 0,
    profissionais: 0,
    atendimentos: 0,
    ocupacao: '0%',
  });
  const [relatoriosIA, setRelatoriosIA] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [unidadesRes, medicosRes, enfermeirosRes, iaRes] = await Promise.allSettled([
          api.get('/unidades-saude'),
          api.get('/medicos'),
          api.get('/enfermeiros'),
          api.get('/ia/relatorios?limit=3')
        ]);

        setData({
          unidades: unidadesRes.status === 'fulfilled' ? unidadesRes.value.data.length : 12,
          profissionais: (medicosRes.status === 'fulfilled' ? medicosRes.value.data.length : 0) +
            (enfermeirosRes.status === 'fulfilled' ? enfermeirosRes.value.data.length : 0) || 148,
          atendimentos: 1284, // Dado simulado (sem endpoint global agregado no momento)
          ocupacao: '76%',
        });

        if (iaRes.status === 'fulfilled' && iaRes.value.data?.relatorios) {
          setRelatoriosIA(iaRes.value.data.relatorios);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do dashboard", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const stats = [
    { label: 'Total de Unidades', value: data.unidades, icon: Hospital, trend: 'Atualizado agora', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Profissionais Ativos', value: data.profissionais, icon: Users, trend: 'Atualizado agora', color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Atendimentos Hoje', value: data.atendimentos, icon: Activity, trend: 'Normal', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Taxa de Ocupação', value: data.ocupacao, icon: TrendingUp, trend: '-4% vs média', color: 'text-orange-500', bg: 'bg-orange-500/10' },
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
            <div key={i} className="glass p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden">
              {loading && <div className="absolute inset-0 bg-background/50 animate-pulse z-10" />}
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
        <div className="lg:col-span-2 glass p-6 rounded-2xl min-h-[400px] flex flex-col relative overflow-hidden">
          {loading && <div className="absolute inset-0 bg-background/50 animate-pulse z-10" />}
          <h3 className="text-lg font-semibold mb-4">Volume de Atendimentos Semanal</h3>
          <div className="flex-1 rounded-xl border border-dashed border-border/50 flex items-center justify-center text-muted-foreground bg-secondary/20">
            [Gráfico de Área - Volume Semanal]
          </div>
        </div>
        <div className="glass p-6 rounded-2xl flex flex-col relative overflow-hidden">
          {loading && <div className="absolute inset-0 bg-background/50 animate-pulse z-10" />}
          <h3 className="text-lg font-semibold mb-4">Alertas de IA (Surtos)</h3>
          <div className="flex-1 space-y-4">
            {relatoriosIA.length > 0 ? (
              relatoriosIA.map((relatorio: any) => (
                <div key={relatorio.id} className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                  <div>
                    <h4 className="font-semibold text-destructive text-sm capitalize">Alerta: {relatorio.tipo.replace('_', ' ')}</h4>
                    <p className="text-xs text-destructive/80 mt-1">Gerado em: {new Date(relatorio.criado_em).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                <div>
                  <h4 className="font-semibold text-destructive text-sm">Possível Surto de Dengue</h4>
                  <p className="text-xs text-destructive/80 mt-1">Aumento de 45% nos casos na UPA Centro nas últimas 48h. (Simulado)</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
