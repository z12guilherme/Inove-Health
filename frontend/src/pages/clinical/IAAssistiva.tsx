import { useState, useEffect, useCallback } from 'react';
import { Brain, Loader2, Search, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

export function IAAssistiva() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selPaciente, setSelPaciente] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try { setLoading(true); const { data } = await api.get('/pacientes'); setPacientes(Array.isArray(data) ? data : data.pacientes || []); } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const analyze = async () => {
    if (!selPaciente) { toast.error('Selecione um paciente.'); return; }
    setAnalyzing(true); setResult(null);
    try {
      const { data } = await api.get(`/ia/paciente/${selPaciente}/recorrente`);
      setResult(data);
      toast.success('Análise concluída!');
    } catch {} finally { setAnalyzing(false); }
  };

  const filteredPac = pacientes.filter(p => p.nome?.toLowerCase().includes(search.toLowerCase()));
  const renderContent = (c: any) => { if (typeof c === 'string') return c; if (c?.analise) return c.analise; if (c?.relatorio) return c.relatorio; return JSON.stringify(c, null, 2); };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-purple-500" /> IA Assistiva
        </h1>
        <p className="text-muted-foreground mt-2">Análise inteligente de padrões de recorrência de pacientes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-4 sm:p-6 lg:col-span-1">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Search className="w-5 h-5" /> Selecionar Paciente</h3>
          <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-10 px-4 rounded-lg bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm mb-3" />
          {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
            <div className="space-y-1 max-h-[400px] overflow-y-auto">{filteredPac.map(p => (
              <button key={p.id} onClick={() => { setSelPaciente(p.id); setResult(null); }} className={cn("w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm", selPaciente === p.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-secondary')}>{p.nome}</button>
            ))}</div>
          )}
        </div>

        <div className="glass rounded-2xl p-4 sm:p-6 lg:col-span-2 flex flex-col">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Brain className="w-5 h-5 text-purple-500" /> Análise de Recorrência</h3>

          <button onClick={analyze} disabled={analyzing || !selPaciente}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl mb-6">
            {analyzing ? <><Loader2 className="w-5 h-5 animate-spin" /> Analisando com IA...</> : <><Brain className="w-5 h-5" /> Analisar Paciente</>}
          </button>

          {result ? (
            <div className="flex-1 animate-fade-in-up">
              <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200">
                <div className="flex items-center gap-2 mb-3"><Sparkles className="w-5 h-5 text-purple-500" /><h4 className="font-semibold text-purple-700">Resultado da Análise</h4></div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{renderContent(result)}</div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Brain className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="font-medium">Selecione um paciente e clique em "Analisar"</p>
                <p className="text-sm mt-1">A IA identificará padrões de recorrência nos atendimentos.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
