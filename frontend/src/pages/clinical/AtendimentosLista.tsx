import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Hospital, 
  AlertTriangle, 
  Stethoscope, 
  Activity, 
  Loader2, 
  Trash2, 
  FileText, 
  User, 
  Calendar 
} from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface Atendimento {
  id: string;
  tipo: 'INTERNAMENTO' | 'URGENCIA' | 'CONSULTA';
  data: string;
  hora: string;
  paciente_nome: string;
  paciente_prontuario: string;
  categoria: string;
  status: 'ATIVO' | 'INATIVO';
  dados_atendimento?: {
    carater?: string;
    acomodacao?: string;
    leito?: string;
    clinica?: string;
    consultorio?: string;
    profissional_executante?: string;
  };
}

export function AtendimentosLista() {
  const navigate = useNavigate();
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'TODOS' | 'INTERNAMENTO' | 'URGENCIA' | 'CONSULTA'>('TODOS');

  const fetchAtendimentos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/atendimentos');
      setAtendimentos(res.data.atendimentos || res.data || []);
    } catch (err) {
      toast.error('Erro ao carregar atendimentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAtendimentos();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente inativar/cancelar este atendimento?')) {
      try {
        await api.delete(`/atendimentos/${id}`);
        toast.success('Atendimento cancelado com sucesso!');
        fetchAtendimentos();
      } catch {
        toast.error('Erro ao cancelar atendimento.');
      }
    }
  };

  // Filtros
  const filtered = atendimentos.filter(a => {
    const matchesSearch = 
      a.paciente_nome.toLowerCase().includes(search.toLowerCase()) ||
      a.paciente_prontuario.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.dados_atendimento?.profissional_executante?.toLowerCase().includes(search.toLowerCase());

    const matchesTab = activeTab === 'TODOS' || a.tipo === activeTab;
    const matchesStatus = a.status === 'ATIVO';

    return matchesSearch && matchesTab && matchesStatus;
  });

  // Métricas do Dashboard
  const countInternamentos = atendimentos.filter(a => a.tipo === 'INTERNAMENTO' && a.status === 'ATIVO').length;
  const countUrgencias = atendimentos.filter(a => a.tipo === 'URGENCIA' && a.status === 'ATIVO').length;
  const countConsultas = atendimentos.filter(a => a.tipo === 'CONSULTA' && a.status === 'ATIVO').length;
  const totalAtendimentos = countInternamentos + countUrgencias + countConsultas;

  const getTipoBadge = (tipo: 'INTERNAMENTO' | 'URGENCIA' | 'CONSULTA') => {
    switch (tipo) {
      case 'INTERNAMENTO':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 px-2.5 py-1 rounded-full text-xs font-semibold border border-blue-500/10">
            <Hospital className="w-3.5 h-3.5" /> Internação
          </span>
        );
      case 'URGENCIA':
        return (
          <span className="inline-flex items-center gap-1 bg-destructive/10 text-destructive px-2.5 py-1 rounded-full text-xs font-semibold border border-destructive/10">
            <AlertTriangle className="w-3.5 h-3.5" /> Urgência
          </span>
        );
      case 'CONSULTA':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-500/10">
            <Stethoscope className="w-3.5 h-3.5" /> Consulta Eletiva
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Fluxo de Atendimento</h1>
          <p className="text-muted-foreground mt-1">Gerenciamento completo da recepção, triagem rápida, urgências e hospitalização.</p>
        </div>
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          <button
            onClick={() => navigate('/clinical/atendimentos/consulta/novo')}
            className="flex-1 sm:flex-initial h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/15 hover:-translate-y-0.5 text-sm"
          >
            <Plus className="w-4.5 h-4.5" /> Eletiva
          </button>
          <button
            onClick={() => navigate('/clinical/atendimentos/urgencia/novo')}
            className="flex-1 sm:flex-initial h-11 px-4 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-medium flex items-center justify-center gap-1.5 transition-all shadow-md shadow-destructive/15 hover:-translate-y-0.5 text-sm"
          >
            <Plus className="w-4.5 h-4.5" /> Urgência
          </button>
          <button
            onClick={() => navigate('/clinical/atendimentos/internamento/novo')}
            className="flex-1 sm:flex-initial h-11 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium flex items-center justify-center gap-1.5 transition-all shadow-md shadow-primary/15 hover:-translate-y-0.5 text-sm"
          >
            <Plus className="w-4.5 h-4.5" /> Internamento
          </button>
        </div>
      </div>

      {/* Mini-Cards / KPI Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="glass rounded-2xl p-5 flex items-center gap-4 hover:scale-[1.02] transition-transform duration-300">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Ativos Hoje</span>
            <span className="text-2xl font-black text-foreground mt-0.5 block">{totalAtendimentos}</span>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 flex items-center gap-4 hover:scale-[1.02] transition-transform duration-300">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
            <Hospital className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Internados</span>
            <span className="text-2xl font-black text-foreground mt-0.5 block">{countInternamentos}</span>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 flex items-center gap-4 hover:scale-[1.02] transition-transform duration-300">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive shadow-inner">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Pronto-Socorro</span>
            <span className="text-2xl font-black text-foreground mt-0.5 block">{countUrgencias}</span>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 flex items-center gap-4 hover:scale-[1.02] transition-transform duration-300">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Consultas</span>
            <span className="text-2xl font-black text-foreground mt-0.5 block">{countConsultas}</span>
          </div>
        </div>
      </div>

      {/* Main List Box */}
      <div className="glass rounded-2xl p-6 space-y-6">
        {/* Search & Tabs */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          {/* Tabs */}
          <div className="flex bg-secondary/50 p-1 rounded-xl border border-border overflow-x-auto self-start">
            <button
              onClick={() => setActiveTab('TODOS')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'TODOS' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Todos Atendimentos
            </button>
            <button
              onClick={() => setActiveTab('INTERNAMENTO')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'INTERNAMENTO' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Hospital className="w-3.5 h-3.5" /> Internações
            </button>
            <button
              onClick={() => setActiveTab('URGENCIA')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'URGENCIA' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Urgências
            </button>
            <button
              onClick={() => setActiveTab('CONSULTA')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'CONSULTA' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" /> Consultas
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md lg:ml-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por paciente, prontuário ou profissional..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm text-foreground"
            />
          </div>
        </div>

        {/* Loading Indicator */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-xl bg-secondary/10">
            <User className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="font-semibold text-lg">Nenhum atendimento ativo</p>
            <p className="text-sm text-muted-foreground mt-1">Crie um novo atendimento no cabeçalho acima para iniciar.</p>
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto border border-border/50 rounded-xl">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-secondary/40 text-muted-foreground border-b border-border/50">
                  <th className="py-3 px-4 font-semibold">Atendimento</th>
                  <th className="py-3 px-4 font-semibold">Data / Hora</th>
                  <th className="py-3 px-4 font-semibold">Paciente</th>
                  <th className="py-3 px-4 font-semibold">Prontuário</th>
                  <th className="py-3 px-4 font-semibold">Categoria</th>
                  <th className="py-3 px-4 font-semibold">Tipo</th>
                  <th className="py-3 px-4 font-semibold">Sinalização / Acomodação</th>
                  <th className="py-3 px-4 font-semibold">Médico Executante</th>
                  <th className="py-3 px-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} className="border-b border-border/30 hover:bg-secondary/20 transition-all duration-200">
                    <td className="py-4 px-4 font-mono font-bold text-primary">{a.id}</td>
                    <td className="py-4 px-4 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {a.data} {a.hora}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-medium text-foreground">{a.paciente_nome}</td>
                    <td className="py-4 px-4 text-muted-foreground font-mono text-xs">{a.paciente_prontuario}</td>
                    <td className="py-4 px-4 text-muted-foreground font-medium">{a.categoria}</td>
                    <td className="py-4 px-4">{getTipoBadge(a.tipo)}</td>
                    <td className="py-4 px-4">
                      {a.tipo === 'INTERNAMENTO' && (
                        <span className="text-xs text-muted-foreground">
                          {a.dados_atendimento?.acomodacao} • <strong className="text-foreground">{a.dados_atendimento?.leito}</strong>
                        </span>
                      )}
                      {a.tipo === 'URGENCIA' && (
                        <span className="text-xs text-muted-foreground">
                          Setor: <strong className="text-foreground">{a.dados_atendimento?.acomodacao || 'PS'}</strong>
                        </span>
                      )}
                      {a.tipo === 'CONSULTA' && (
                        <span className="text-xs text-muted-foreground">
                          Sala: <strong className="text-foreground">{a.dados_atendimento?.consultorio || 'Consultório'}</strong>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-medium text-foreground/80">
                      {a.dados_atendimento?.profissional_executante || 'Dr. Plantonista'}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                          title="Cancelar Atendimento"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
