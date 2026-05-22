import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, CheckCircle, Search, Activity, Stethoscope } from 'lucide-react';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const cores = {
  vermelho: 'bg-red-500',
  laranja: 'bg-orange-500',
  amarelo: 'bg-yellow-500',
  verde: 'bg-green-500',
  azul: 'bg-blue-500',
};

export function FilaMedica() {
  const navigate = useNavigate();
  const [atendimentos, setAtendimentos] = useState<any[]>([]);
  const [pacientesMap, setPacientesMap] = useState<Record<string, any>>({});
  const [triagensMap, setTriagensMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroTab, setFiltroTab] = useState<'Aguardando' | 'Em consulta' | 'Atendidos' | 'Retorno'>('Aguardando');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resA, resP, resT] = await Promise.all([
          api.get('/atendimentos'),
          api.get('/pacientes'),
          api.get('/triagens')
        ]);
        
        const atds = Array.isArray(resA.data) ? resA.data : resA.data.atendimentos || [];
        const pacs = Array.isArray(resP.data) ? resP.data : resP.data.pacientes || [];
        const trs = Array.isArray(resT.data) ? resT.data : resT.data.triagens || [];

        const pMap = pacs.reduce((acc: any, p: any) => ({ ...acc, [p.id]: p }), {});
        const tMap = trs.reduce((acc: any, t: any) => ({ ...acc, [t.atendimento_id]: t }), {});
        
        setAtendimentos(atds.filter((a: any) => a.status === 'ATIVO'));
        setPacientesMap(pMap);
        setTriagensMap(tMap);
      } catch {
        toast.error('Erro ao carregar fila.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter based on status_fila
  const filtered = atendimentos.filter(a => {
    if (search && !a.paciente_nome.toLowerCase().includes(search.toLowerCase())) return false;
    
    if (filtroTab === 'Aguardando') return a.status_fila === 'AGUARDANDO_MEDICO';
    if (filtroTab === 'Em consulta') return a.status_fila === 'EM_CONSULTA';
    if (filtroTab === 'Atendidos') return a.status_fila === 'FINALIZADO';
    if (filtroTab === 'Retorno') return a.status_fila === 'RETORNO';
    return false;
  }).sort((a, b) => {
    // Sort by priority logic (simplified)
    const riscoA = triagensMap[a.id]?.classificacao_risco || pacientesMap[a.paciente_id]?.risco || 'verde';
    const riscoB = triagensMap[b.id]?.classificacao_risco || pacientesMap[b.paciente_id]?.risco || 'verde';
    const pesos: any = { vermelho: 5, laranja: 4, amarelo: 3, verde: 2, azul: 1 };
    return (pesos[riscoB] || 0) - (pesos[riscoA] || 0);
  });

  const countAguardando = atendimentos.filter(a => a.status_fila === 'AGUARDANDO_MEDICO').length;
  const countEmConsulta = atendimentos.filter(a => a.status_fila === 'EM_CONSULTA').length;
  const countAtendidos = atendimentos.filter(a => a.status_fila === 'FINALIZADO').length;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Atendimento Médico</h1>
        <p className="text-muted-foreground mt-2">Pacientes aguardando das últimas 24 horas.</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <button onClick={() => setFiltroTab('Aguardando')} className={cn("px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all", filtroTab === 'Aguardando' ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary')}>
          <Users className="w-5 h-5" /> Aguardando <span className="ml-2 bg-background/20 px-2 py-0.5 rounded-full text-xs">{countAguardando}</span>
        </button>
        <button onClick={() => setFiltroTab('Em consulta')} className={cn("px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all", filtroTab === 'Em consulta' ? 'bg-blue-500 text-white shadow-lg' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary')}>
          <Activity className="w-5 h-5" /> Em consulta <span className="ml-2 bg-background/20 px-2 py-0.5 rounded-full text-xs">{countEmConsulta}</span>
        </button>
        <button onClick={() => setFiltroTab('Atendidos')} className={cn("px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all", filtroTab === 'Atendidos' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary')}>
          <CheckCircle className="w-5 h-5" /> Atendidos <span className="ml-2 bg-background/20 px-2 py-0.5 rounded-full text-xs">{countAtendidos}</span>
        </button>
        <button onClick={() => setFiltroTab('Retorno')} className={cn("px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all", filtroTab === 'Retorno' ? 'bg-amber-500 text-white shadow-lg' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary')}>
          <Clock className="w-5 h-5" /> Retorno de consulta
        </button>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Pesquise pelo Nro Prontuário e/ou Nome do Paciente" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all"
            />
          </div>
          <button className="h-12 px-8 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            Pesquisar
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
            <p className="font-medium">Nenhum paciente nesta lista.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(a => {
              const pac = pacientesMap[a.paciente_id] || {};
              const triagem = triagensMap[a.id] || {};
              const risco = triagem.classificacao_risco || pac.risco || 'verde';
              const riscoLabel = risco.charAt(0).toUpperCase() + risco.slice(1);
              const colorClass = (cores as any)[risco] || cores.verde;

              return (
                <div key={a.id} className="flex flex-col md:flex-row items-center gap-4 p-4 rounded-xl bg-background border border-border hover:border-primary/50 transition-all">
                  <div className={cn("px-4 py-1.5 rounded-lg text-white font-bold text-xs uppercase text-center w-32 shadow-sm", colorClass)}>
                    {riscoLabel}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-foreground uppercase">{a.paciente_nome}</h3>
                    <div className="text-xs text-muted-foreground flex items-center gap-4 mt-1">
                      <span>Motivo Atendimento: {triagem.sintomas || a.dados_solicitacao?.indicacao || 'Não informado'}</span>
                      <span className="font-mono">Prontuário: {a.paciente_prontuario}</span>
                      <span>Idade: {pac.data_nascimento ? new Date().getFullYear() - new Date(pac.data_nascimento).getFullYear() : '--'} anos</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => navigate(`/clinical/atendimento-consulta?atendimentoId=${a.id}`)}
                      className="h-10 px-6 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold transition-all flex items-center gap-2"
                    >
                      <Stethoscope className="w-4 h-4" />
                      {filtroTab === 'Aguardando' ? 'Chamar / Atender' : 'Abrir Prontuário'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
