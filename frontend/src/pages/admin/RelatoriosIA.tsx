import { useState, useEffect, useCallback } from 'react';
import { Brain, FileText, Loader2, AlertTriangle, RefreshCw, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface Relatorio { id: string; tipo: string; conteudo: any; unidade_saude_id?: string; criado_em: string; }

export function RelatoriosIA() {
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [surtoResult, setSurtoResult] = useState<any>(null);
  const [triagemResult, setTriagemResult] = useState<any>(null);
  const [unidadeId, setUnidadeId] = useState('');

  const loadRelatorios = useCallback(async () => {
    try { setLoading(true); const { data } = await api.get('/ia/relatorios?limit=20'); setRelatorios(data?.relatorios || []); } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { loadRelatorios(); }, [loadRelatorios]);

  const gerarSurto = async () => {
    setGenerating('surto');
    try {
      const url = unidadeId ? `/ia/surto?unidade_saude_id=${unidadeId}` : '/ia/surto';
      const { data } = await api.get(url);
      setSurtoResult(data); toast.success('Relatório de surto gerado!'); loadRelatorios();
    } catch {} finally { setGenerating(null); }
  };

  const gerarTriagem = async () => {
    if (!unidadeId) { toast.error('Informe o ID da unidade de saúde.'); return; }
    setGenerating('triagem');
    try {
      const { data } = await api.get(`/ia/triagens/${unidadeId}`);
      setTriagemResult(data); toast.success('Análise de triagens gerada!'); loadRelatorios();
    } catch {} finally { setGenerating(null); }
  };

  const renderContent = (content: any) => {
    if (typeof content === 'string') return content;
    if (content?.analise) return content.analise;
    if (content?.relatorio) return content.relatorio;
    return JSON.stringify(content, null, 2);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios de Inteligência Artificial</h1>
        <p className="text-muted-foreground mt-2">Geração de relatórios epidemiológicos e análise de dados com IA.</p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-red-500" /></div>
            <div><h3 className="font-semibold text-lg">Relatório de Surto</h3><p className="text-sm text-muted-foreground">Análise de risco epidemiológico</p></div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">ID da Unidade (opcional)</label>
            <input type="text" value={unidadeId} onChange={e => setUnidadeId(e.target.value)} placeholder="UUID da unidade ou vazio p/ global"
              className="w-full h-10 px-4 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" />
          </div>
          <button onClick={gerarSurto} disabled={generating === 'surto'}
            className="w-full h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-red-500/25">
            {generating === 'surto' ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Brain className="w-5 h-5" /> Gerar Relatório de Surto</>}
          </button>
          {surtoResult && (
            <div className="mt-3 p-4 rounded-xl bg-red-50 border border-red-200 text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
              {renderContent(surtoResult)}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center"><Activity className="w-6 h-6 text-purple-500" /></div>
            <div><h3 className="font-semibold text-lg">Análise de Triagens</h3><p className="text-sm text-muted-foreground">Sobrecarga e distribuição por gravidade</p></div>
          </div>
          <button onClick={gerarTriagem} disabled={generating === 'triagem' || !unidadeId}
            className="w-full h-11 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/25">
            {generating === 'triagem' ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Brain className="w-5 h-5" /> Analisar Triagens</>}
          </button>
          {triagemResult && (
            <div className="mt-3 p-4 rounded-xl bg-purple-50 border border-purple-200 text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
              {renderContent(triagemResult)}
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <div className="glass rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2"><FileText className="w-5 h-5" /> Histórico de Relatórios</h3>
          <button onClick={loadRelatorios} className="p-2 hover:bg-secondary rounded-lg transition-colors"><RefreshCw className={cn("w-5 h-5", loading && 'animate-spin')} /></button>
        </div>
        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        : relatorios.length === 0 ? <div className="text-center py-12 text-muted-foreground"><Brain className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nenhum relatório gerado ainda.</p></div>
        : (
          <div className="space-y-3">
            {relatorios.map(r => (
              <div key={r.id} className="p-4 rounded-xl border border-border/50 hover:bg-secondary/30 transition-colors animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("px-3 py-1 rounded-full text-xs font-semibold capitalize",
                    r.tipo?.includes('surto') ? 'bg-red-500/10 text-red-500' : r.tipo?.includes('triagem') ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'
                  )}>{r.tipo?.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-muted-foreground">{new Date(r.criado_em).toLocaleString('pt-BR')}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{renderContent(r.conteudo)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
