import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Loader2, RefreshCcw, Search, X } from 'lucide-react';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';

interface Glosa {
  id: string;
  guia?: string;
  guiaId?: string;
  paciente?: string;
  convenio: string;
  data?: string;
  dataRetorno?: string;
  motivo: string;
  valor_glosado?: number;
  valorGlosado?: number;
  status: string;
}

export function GestaoGlosas() {
  const [glosas, setGlosas] = useState<Glosa[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [glosaSelecionada, setGlosaSelecionada] = useState<Glosa | null>(null);
  const [justificativa, setJustificativa] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchGlosas = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/faturamento/glosas');
      setGlosas(Array.isArray(data) ? data : data?.glosas || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGlosas(); }, [fetchGlosas]);

  const handleEnviarRecurso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!glosaSelecionada || !justificativa) return;

    setSubmitting(true);
    try {
      await api.post(`/faturamento/glosas/${glosaSelecionada.id}/recurso`, { justificativa });
      toast.success('Recurso interposto com sucesso!');
      setModalOpen(false);
      setJustificativa('');
      fetchGlosas();
    } catch {
      toast.error('Erro ao enviar recurso.');
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = (g: Glosa) => {
    setGlosaSelecionada(g);
    setJustificativa('');
    setModalOpen(true);
  };

  const filtered = glosas.filter(g =>
    (g.guia || g.guiaId || '')?.toLowerCase().includes(search.toLowerCase()) ||
    (g.paciente || g.convenio || '')?.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Glosas</h1>
        <p className="text-muted-foreground mt-2">Acompanhe faturamentos recusados pelos convênios e envie recursos.</p>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input type="text" placeholder="Buscar por guia ou paciente..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-12 pl-10 pr-4 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Nenhuma glosa pendente no momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(g => (
              <div key={g.id} className="border border-destructive/20 bg-destructive/5 rounded-xl p-5 hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                    <h3 className="font-bold text-foreground">Guia: {g.guia || g.guiaId} {g.paciente ? `- ${g.paciente}` : ''}</h3>
                    <p className="text-sm text-muted-foreground mt-1">Convênio: {g.convenio} | Data: {new Date(g.data || g.dataRetorno || new Date()).toLocaleDateString('pt-BR')}</p>
                  </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Valor Glosado</p>
                    <p className="font-bold text-lg text-destructive">{formatCurrency(g.valor_glosado ?? g.valorGlosado ?? 0)}</p>
                  </div>
                </div>

                <div className="bg-background rounded-lg p-3 border border-destructive/20 text-sm mb-4">
                  <span className="font-bold text-destructive">Motivo ANS:</span> {g.motivo}
                </div>

                <div className="flex justify-end">
                  {(g.status === 'PENDENTE' || g.status === 'PENDENTE_RECURSO') ? (
                    <button onClick={() => openModal(g)} className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                      <RefreshCcw className="w-4 h-4" /> Interpor Recurso
                    </button>
                  ) : (
                    <span className="bg-secondary text-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" /> Recurso já enviado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && glosaSelecionada && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <h2 className="text-xl font-semibold flex items-center gap-2"><RefreshCcw className="w-5 h-5" /> Enviar Recurso de Glosa</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-secondary rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEnviarRecurso} className="p-6 space-y-4">
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm mb-4 border border-destructive/20">
                <strong>Glosa:</strong> {glosaSelecionada.id} - {glosaSelecionada.motivo}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Justificativa Técnica / Administrativa *</label>
                <textarea required rows={5} value={justificativa} onChange={e => setJustificativa(e.target.value)}
                  className="w-full p-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                  placeholder="Descreva a justificativa para o convênio aceitar o pagamento..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 h-12 rounded-xl border border-border font-medium hover:bg-secondary transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar ao Convênio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// CheckCircle mock for Glosas
function CheckCircle(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}
