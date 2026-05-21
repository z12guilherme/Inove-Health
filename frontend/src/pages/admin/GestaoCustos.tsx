import { useState, useEffect, useCallback } from 'react';
import { Calculator, Loader2, Search, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../../lib/api';

interface CustosDetalhes {
  insumos: number;
  honorarios: number;
  infraestrutura: number;
}

interface AtendimentoCusto {
  id: string;
  paciente: string;
  data: string;
  medico: string;
  custos: CustosDetalhes;
  custoTotal: number;
  statusFaturamento: 'PENDENTE' | 'FATURADO' | 'GLOSADO';
}

export function GestaoCustos() {
  const [atendimentos, setAtendimentos] = useState<AtendimentoCusto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchCustos = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/financeiro/custos');
      setAtendimentos(Array.isArray(data) ? data : data.custos || []);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustos(); }, [fetchCustos]);

  const filtered = atendimentos.filter(a =>
    a.paciente?.toLowerCase().includes(search.toLowerCase()) ||
    a.medico?.toLowerCase().includes(search.toLowerCase()) ||
    a.id?.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FATURADO': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'GLOSADO': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Custos</h1>
          <p className="text-muted-foreground mt-2">Cálculo de custos por atendimento e margem de faturamento.</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 sm:p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input type="text" placeholder="Buscar por paciente, médico ou ID do atendimento..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-12 pl-10 pr-4 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Nenhum registro de custo encontrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(a => (
              <div key={a.id} className="border border-border/50 rounded-xl overflow-hidden bg-background/50 hover:shadow-md transition-all">
                <div 
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 cursor-pointer hover:bg-secondary/50"
                  onClick={() => toggleExpand(a.id)}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">{a.paciente}</h3>
                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{a.id}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">{a.medico}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 mt-4 sm:mt-0 w-full sm:w-auto">
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-muted-foreground uppercase font-medium">Custo Total</p>
                      <p className="font-bold text-lg">{formatCurrency(a.custoTotal)}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${getStatusColor(a.statusFaturamento)}`}>
                      {a.statusFaturamento}
                    </span>
                    <button className="p-2 hover:bg-secondary rounded-lg transition-colors hidden sm:block">
                      {expandedId === a.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Breakdown details */}
                {expandedId === a.id && (
                  <div className="bg-secondary/30 p-5 border-t border-border/50 animate-in slide-in-from-top-2">
                    <h4 className="text-sm font-semibold mb-3">Detalhamento dos Custos</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-background rounded-lg p-3 border border-border/50 shadow-sm">
                        <p className="text-xs text-muted-foreground mb-1">Insumos e Medicamentos</p>
                        <p className="font-medium text-blue-500">{formatCurrency(a.custos.insumos)}</p>
                      </div>
                      <div className="bg-background rounded-lg p-3 border border-border/50 shadow-sm">
                        <p className="text-xs text-muted-foreground mb-1">Honorários Médicos</p>
                        <p className="font-medium text-emerald-500">{formatCurrency(a.custos.honorarios)}</p>
                      </div>
                      <div className="bg-background rounded-lg p-3 border border-border/50 shadow-sm">
                        <p className="text-xs text-muted-foreground mb-1">Infraestrutura (Sala/Equip.)</p>
                        <p className="font-medium text-amber-500">{formatCurrency(a.custos.infraestrutura)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
