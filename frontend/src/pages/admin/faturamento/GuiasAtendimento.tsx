import { useState, useEffect, useCallback } from 'react';
import { Stethoscope, Loader2, Search, CheckCircle, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import localStorageService from '../../../services/localStorageService';

interface Guia {
  id: string;
  numero?: string;
  tipo: string;
  paciente: string;
  convenio: string;
  data_emissao?: string;
  dataEmissao?: string;
  status: string;
  valor?: number;
  valorTotal?: number;
  senhaAutorizacao?: string | null;
}

export function GuiasAtendimento() {
  const [guias, setGuias] = useState<Guia[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchGuias = useCallback(async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const atendimentos = localStorageService.getAtendimentos();
      
      const mappedGuias: Guia[] = atendimentos
        .filter(a => a.convenio_nome && a.convenio_nome.toUpperCase() !== 'PARTICULAR' && a.status !== 'CANCELADO' && a.status !== 'INATIVO')
        .map(a => ({
          id: a.id,
          numero: a.numero_guia || `GUI-${a.id.replace('ATD-', '')}`,
          tipo: a.tipo,
          paciente: a.paciente_nome,
          convenio: a.convenio_nome,
          data_emissao: a.data,
          status: (a as any).status_guia || 'PENDENTE',
          valor: a.valor_total || a.procedimentos?.reduce((acc, p) => acc + (p.valor || 0) * (p.qtd || 1), 0) || 0,
          senhaAutorizacao: (a as any).senha_autorizacao || null
        }));

      setGuias(mappedGuias);
    } catch {
      toast.error('Erro ao carregar guias');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGuias(); }, [fetchGuias]);

  const handleAutorizar = async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const atendimentos = localStorageService.getAtendimentos();
      const aIndex = atendimentos.findIndex(a => a.id === id);
      if (aIndex !== -1) {
          (atendimentos[aIndex] as any).status_guia = 'AUTORIZADA';
          (atendimentos[aIndex] as any).senha_autorizacao = Math.floor(100000 + Math.random() * 900000).toString();
          localStorageService.setAtendimentos(atendimentos);
      }
      
      toast.success('Guia autorizada com sucesso!');
      fetchGuias();
    } catch {
      toast.error('Erro ao autorizar guia');
    }
  };

  const filtered = guias.filter(g =>
    g.paciente?.toLowerCase().includes(search.toLowerCase()) ||
    (g.numero || g.id)?.toLowerCase().includes(search.toLowerCase()) ||
    g.convenio?.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AUTORIZADA': return <span className="bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max"><CheckCircle className="w-3 h-3" /> Autorizada</span>;
      case 'FATURADA': return <span className="bg-blue-500/10 text-blue-500 px-2.5 py-1 rounded-full text-xs font-semibold w-max">Faturada</span>;
      default: return <span className="bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max"><ShieldAlert className="w-3 h-3" /> Pendente</span>;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Guias de Atendimento</h1>
        <p className="text-muted-foreground mt-2">Controle de emissão e autorização de guias TISS (Consulta e SADT).</p>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input type="text" placeholder="Buscar por paciente, guia ou convênio..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-12 pl-10 pr-4 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/50">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-4 py-4 font-semibold">Nº Guia</th>
                  <th className="px-4 py-4 font-semibold">Data</th>
                  <th className="px-4 py-4 font-semibold">Paciente</th>
                  <th className="px-4 py-4 font-semibold">Convênio / Tipo</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 font-semibold text-right">Valor</th>
                  <th className="px-4 py-4 font-semibold text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 bg-background/50">
                {filtered.map(g => (
                  <tr key={g.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-4 font-mono font-medium text-primary">{g.numero || g.id}</td>
                    <td className="px-4 py-4 text-muted-foreground">{new Date(g.data_emissao || g.dataEmissao || new Date()).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-4 font-semibold">{g.paciente}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span>{g.convenio}</span>
                        <span className="text-xs text-muted-foreground">{g.tipo}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(g.status)}
                        {g.senhaAutorizacao && <span className="text-[10px] text-muted-foreground font-mono">Senha: {g.senhaAutorizacao}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-medium">{formatCurrency(g.valor ?? g.valorTotal ?? 0)}</td>
                    <td className="px-4 py-4 text-center">
                      {g.status === 'PENDENTE' ? (
                        <button onClick={() => handleAutorizar(g.id)} className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold">
                          Solicitar Autorização
                        </button>
                      ) : (
                        <span className="text-muted-foreground text-xs opacity-50">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nenhuma guia encontrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
