import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Search,
  Plus,
  Trash2,
  UserPlus,
  Check,
  Stethoscope,
  Loader2,
  Building,
  Bed,
  FileText
} from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { PacienteModalInline } from '../../components/PacienteModalInline';

// Seed data para autocompletes e seleções locais
const SEED_CIDS = [
  { codigo: 'I10', descricao: 'Hipertensão essencial (primária)' },
  { codigo: 'E11', descricao: 'Diabetes mellitus não-insulino-dependente' },
  { codigo: 'J06', descricao: 'Infecções agudas das vias aéreas superiores' },
  { codigo: 'K29', descricao: 'Gastrite e duodenite' },
  { codigo: 'M54', descricao: 'Dorsalgia' },
  { codigo: 'R07', descricao: 'Dor na garganta e no peito' },
  { codigo: 'U07.1', descricao: 'COVID-19, vírus identificado' },
  { codigo: 'J00', descricao: 'Nasofaringite aguda (resfriado comum)' },
  { codigo: 'N39.0', descricao: 'Infecção do trato urinário de localização não especificada' },
  { codigo: 'J18.9', descricao: 'Pneumonia não especificada' }
];

const SEED_PROCEDIMENTOS = [
  { codigo: '50000011', nome: 'Diária de UTI Adulto Geral', valor: 1500.00 },
  { codigo: '50000022', nome: 'Diária de enfermaria geral', valor: 250.00 },
  { codigo: '50000033', nome: 'Diária de apartamento standart', valor: 450.00 },
  { codigo: '31001001', nome: 'Apendicectomia via laparoscópica', valor: 3200.00 },
  { codigo: '31002002', nome: 'Colecistectomia por videolaparoscopia', valor: 4500.00 },
  { codigo: '30101234', nome: 'Raio-X de tórax (PA e Perfil)', valor: 90.00 },
  { codigo: '40301123', nome: 'Hemograma completo', valor: 25.00 }
];

const TIPO_INTERNACAO = ['Clínica', 'Cirúrgica', 'Obstétrica', 'Pediátrica', 'Psiquiátrica'];
const REGIME_INTERNACAO = ['Hospitalar', 'Hospital-dia', 'Domiciliar'];
const CLINICAS = ['Clínica Médica', 'Cirurgia Geral', 'Cardiologia', 'Pediatria', 'Ortopedia', 'Obstetrícia'];
const ACOMODACAO = ['Enfermaria', 'Apartamento', 'UTI'];

interface Paciente {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  sexo: string;
}

interface Medico {
  id: string;
  nome: string;
  crm: string;
  especialidade: string;
}

interface ProcedimentoAdicionado {
  data: string;
  codigo: string;
  nome: string;
  bilateral: boolean;
  qtd: number;
  valor: number;
}

export function NovoInternamento() {
  const navigate = useNavigate();

  // Modals e Loadings
  const pacienteRef = useRef<HTMLDivElement>(null);
  const medicoRef = useRef<HTMLDivElement>(null);
  const cidRef = useRef<HTMLDivElement>(null);
  const procRef = useRef<HTMLDivElement>(null);
  const [pacienteModal, setPacienteModal] = useState(false);

  const [loading, setLoading] = useState(false);

  // Beneficiário State
  const [pacientesList, setPacientesList] = useState<Paciente[]>([]);
  const [pacienteSearch, setPacienteSearch] = useState('');
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [showPacienteDropdown, setShowPacienteDropdown] = useState(false);

  // Médicos State
  const [medicosList, setMedicosList] = useState<Medico[]>([]);
  const [medicoSearch, setMedicoSearch] = useState('');
  const [selectedMedico, setSelectedMedico] = useState<Medico | null>(null);
  const [showMedicoDropdown, setShowMedicoDropdown] = useState(false);

  // Form Geral State
  const [dataAtendimento, setDataAtendimento] = useState(new Date().toLocaleDateString('en-CA'));
  const [horaAtendimento, setHoraAtendimento] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  const [categoria, setCategoria] = useState<'SUS' | 'Particular' | 'Convênio'>('Particular');

  // Dados de Internação Específicos
  const [carater, setCarater] = useState<'Eletiva' | 'Urgência/Emergência'>('Eletiva');
  const [tipoInternacao, setTipoInternacao] = useState(TIPO_INTERNACAO[0]);
  const [regimeInternacao, setRegimeInternacao] = useState(REGIME_INTERNACAO[0]);
  const [clinica, setClinica] = useState(CLINICAS[0]);
  const [acomodacao, setAcomodacao] = useState(ACOMODACAO[0]);
  const [leito, setLeito] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // CID-10 State
  const [cidSearch, setCidSearch] = useState('');
  const [selectedCid, setSelectedCid] = useState<{ codigo: string; descricao: string } | null>(null);
  const [showCidDropdown, setShowCidDropdown] = useState(false);

  // Procedimentos State
  const [procSearch, setProcSearch] = useState('');
  const [selectedProc, setSelectedProc] = useState<typeof SEED_PROCEDIMENTOS[0] | null>(null);
  const [showProcDropdown, setShowProcDropdown] = useState(false);
  const [procQtd, setProcQtd] = useState(1);
  const [procedimentosAdicionados, setProcedimentosAdicionados] = useState<ProcedimentoAdicionado[]>([]);

  // Dados da Solicitação State
  const [solicitacaoData, setSolicitacaoData] = useState(new Date().toLocaleDateString('en-CA'));
  const [solicitacaoHora, setSolicitacaoHora] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  const [contratadoSolicitante, setContratadoSolicitante] = useState<'Hospital' | 'Pessoa Jurídica' | 'Pessoa Física'>('Hospital');
  const [profissionalSolicitante, setProfissionalSolicitante] = useState('');
  const [especialidadeSolicitante, setEspecialidadeSolicitante] = useState('');
  const [indicacaoClinica, setIndicacaoClinica] = useState('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pacienteRef.current && !pacienteRef.current.contains(event.target as Node)) {
        setShowPacienteDropdown(false);
      }
      if (medicoRef.current && !medicoRef.current.contains(event.target as Node)) {
        setShowMedicoDropdown(false);
      }
      if (cidRef.current && !cidRef.current.contains(event.target as Node)) {
        setShowCidDropdown(false);
      }
      if (procRef.current && !procRef.current.contains(event.target as Node)) {
        setShowProcDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  // Fetch Lists
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resPac = await api.get('/pacientes');
        setPacientesList(resPac.data.pacientes || resPac.data || []);

        const resMed = await api.get('/medicos');
        setMedicosList(resMed.data.medicos || resMed.data || []);
      } catch (err) {
        console.error('Erro ao buscar dados.', err);
      }
    };
    fetchData();
  }, []);

  // Seletores
  const filteredPacientes = pacientesList.filter(p =>
    p.nome.toLowerCase().includes(pacienteSearch.toLowerCase()) ||
    p.cpf.includes(pacienteSearch) ||
    p.id.toLowerCase().includes(pacienteSearch.toLowerCase())
  );

  const filteredMedicos = medicosList.filter(m =>
    m.nome.toLowerCase().includes(medicoSearch.toLowerCase()) ||
    m.especialidade.toLowerCase().includes(medicoSearch.toLowerCase())
  );

  const filteredCids = SEED_CIDS.filter(c =>
    c.codigo.toLowerCase().includes(cidSearch.toLowerCase()) ||
    c.descricao.toLowerCase().includes(cidSearch.toLowerCase())
  );

  const filteredProcs = SEED_PROCEDIMENTOS.filter(p =>
    p.codigo.includes(procSearch) ||
    p.nome.toLowerCase().includes(procSearch.toLowerCase())
  );

  // Inserção Procedimentos
  const handleAddProcedimento = () => {
    if (!selectedProc) {
      toast.error('Selecione um procedimento para inserir.');
      return;
    }
    const novo: ProcedimentoAdicionado = {
      data: dataAtendimento,
      codigo: selectedProc.codigo,
      nome: selectedProc.nome,
      bilateral: false,
      qtd: procQtd,
      valor: selectedProc.valor
    };
    setProcedimentosAdicionados([...procedimentosAdicionados, novo]);
    setSelectedProc(null);
    setProcSearch('');
    setProcQtd(1);
    toast.success('Procedimento adicionado!');
  };

  const handleRemoveProcedimento = (index: number) => {
    setProcedimentosAdicionados(procedimentosAdicionados.filter((_, i) => i !== index));
    toast.success('Procedimento removido.');
  };

  const totalValue = procedimentosAdicionados.reduce((acc, curr) => acc + (curr.valor * curr.qtd), 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaciente) {
      toast.error('Por favor, selecione ou crie um paciente.');
      return;
    }
    if (!selectedMedico) {
      toast.error('Por favor, selecione o médico executante.');
      return;
    }
    if (!leito.trim()) {
      toast.error('Por favor, insira o leito de acomodação.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        tipo: 'INTERNAMENTO',
        data: dataAtendimento,
        hora: horaAtendimento,
        paciente_id: selectedPaciente.id,
        paciente_nome: selectedPaciente.nome,
        paciente_cpf: selectedPaciente.cpf,
        paciente_prontuario: selectedPaciente.id,
        categoria,
        dados_atendimento: {
          carater,
          tipo_internacao: tipoInternacao,
          regime: regimeInternacao,
          clinica,
          acomodacao,
          leito,
          cid10: selectedCid ? `${selectedCid.codigo} - ${selectedCid.descricao}` : '',
          profissional_executante: selectedMedico.nome
        },
        procedimentos: procedimentosAdicionados,
        dados_solicitacao: {
          data: solicitacaoData,
          hora: solicitacaoHora,
          contratado: contratadoSolicitante,
          profissional: profissionalSolicitante,
          especialidade: especialidadeSolicitante,
          indicacao: indicacaoClinica,
          observacoes
        }
      };

      await api.post('/atendimentos', payload);
      toast.success('Internamento registrado com sucesso!');
      navigate('/clinical/atendimentos');
    } catch (err) {
      toast.error('Falha ao registrar Internamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/clinical/atendimentos')}
          className="p-2.5 rounded-xl border border-border hover:bg-secondary hover:text-foreground text-muted-foreground transition-all duration-300"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cadastro de Atendimento de Internação</h1>
          <p className="text-muted-foreground mt-1">Hospitalização e gestão de leitos/clínicas.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Bloco 1: Data, Hora, Categoria */}
        <div className="glass rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" /> Data do Atendimento
            </label>
            <input
              type="date"
              required
              value={dataAtendimento}
              onChange={e => setDataAtendimento(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" /> Hora do Atendimento
            </label>
            <input
              type="text"
              required
              value={horaAtendimento}
              onChange={e => setHoraAtendimento(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Regime / Categoria</label>
            <div className="flex bg-secondary/50 p-1 rounded-xl border border-border">
              {(['SUS', 'Particular', 'Convênio'] as const).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoria(cat)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${categoria === cat
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bloco 2: Dados do Beneficiário */}
        <div className="glass rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-border/50 pb-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" /> Dados do Beneficiário
            </h2>
            <button
              type="button"
              onClick={() => {
                setSelectedPaciente(null);
                setPacienteModal(true);
              }}
              className="h-10 px-4 rounded-xl border border-primary/30 text-primary hover:bg-primary/5 transition-all text-sm font-medium flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" /> Criar/editar paciente
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" ref={pacienteRef}>
            <div className="relative md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-foreground">
                Pesquise pelo Nome, CPF ou Prontuário do Paciente
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Digite para buscar..."
                  value={pacienteSearch}
                  onChange={e => {
                    setPacienteSearch(e.target.value);
                    if (selectedPaciente) setSelectedPaciente(null);
                    setShowPacienteDropdown(true);
                  }}
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                />
              </div>
              {showPacienteDropdown && pacienteSearch.length > 0 && filteredPacientes.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto">
                  {filteredPacientes.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPaciente(p);
                        setPacienteSearch(p.nome);
                        setShowPacienteDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-secondary/50 flex flex-col border-b border-border/30 last:border-0"
                    >
                      <span className="font-medium text-foreground">{p.nome}</span>
                      <span className="text-xs text-muted-foreground mt-0.5">Prontuário: {p.id} • CPF: {p.cpf}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Prontuário</label>
              <input
                type="text"
                disabled
                value={selectedPaciente ? selectedPaciente.id : '—'}
                className="w-full h-12 px-4 rounded-xl bg-secondary/30 border border-border text-muted-foreground outline-none cursor-not-allowed font-semibold"
              />
            </div>
          </div>

          {selectedPaciente && (
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm animate-in fade-in duration-300">
              <div>
                <p className="text-muted-foreground">Nome completo</p>
                <p className="font-semibold text-foreground mt-0.5">{selectedPaciente.nome}</p>
              </div>
              <div>
                <p className="text-muted-foreground">CPF do Paciente</p>
                <p className="font-semibold text-foreground mt-0.5">{selectedPaciente.cpf}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Sexo</p>
                <p className="font-semibold text-foreground mt-0.5">{selectedPaciente.sexo === 'M' ? 'Masculino' : 'Feminino'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Nascimento</p>
                <p className="font-semibold text-foreground mt-0.5">{selectedPaciente.data_nascimento}</p>
              </div>
            </div>
          )}
        </div>

        {/* Bloco 3: Dados do Atendimento */}
        <div className="glass rounded-2xl p-6 space-y-6">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 border-b border-border/50 pb-4">
            <Bed className="w-5 h-5 text-primary" /> Dados do Atendimento
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Caráter da Internação</label>
              <div className="flex bg-secondary/50 p-1 rounded-xl border border-border">
                {(['Eletiva', 'Urgência/Emergência'] as const).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCarater(c)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${carater === c
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Tipo de Internação</label>
              <select
                value={tipoInternacao}
                onChange={e => setTipoInternacao(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
              >
                {TIPO_INTERNACAO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Regime de Internação</label>
              <select
                value={regimeInternacao}
                onChange={e => setRegimeInternacao(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
              >
                {REGIME_INTERNACAO.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Clínica</label>
              <select
                value={clinica}
                onChange={e => setClinica(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
              >
                {CLINICAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Acomodação</label>
              <select
                value={acomodacao}
                onChange={e => setAcomodacao(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
              >
                {ACOMODACAO.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Leito *</label>
              <input
                type="text"
                required
                placeholder="Ex: Leito 305-B"
                value={leito}
                onChange={e => setLeito(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
              />
            </div>

            <div className="relative" ref={cidRef}>
              <label className="block text-sm font-medium mb-2 text-foreground">Hipótese Diagnóstica (CID-10)</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Pesquise por CID..."
                  value={cidSearch}
                  onChange={e => {
                    const val = e.target.value;
                    setCidSearch(val);
                    if (selectedCid && val !== `${selectedCid.codigo} - ${selectedCid.descricao}`) setSelectedCid(null);
                    setShowCidDropdown(true);
                  }}
                  onFocus={() => setShowCidDropdown(cidSearch.length > 0)}
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground text-sm"
                />
              </div>
              {showCidDropdown && cidSearch.length > 0 && filteredCids.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                  {filteredCids.map(c => (
                    <button
                      key={c.codigo}
                      type="button"
                      onClick={() => {
                        setSelectedCid(c);
                        setCidSearch(`${c.codigo} - ${c.descricao}`);
                        setShowCidDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-secondary/50 flex flex-col border-b border-border/30 last:border-0 text-sm"
                    >
                      <span className="font-semibold text-foreground">{c.codigo}</span>
                      <span className="text-xs text-muted-foreground">{c.descricao}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative" ref={medicoRef}>
              <label className="block text-sm font-medium mb-2 text-foreground">Profissional Executante</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Pesquise o médico..."
                  value={medicoSearch}
                  onChange={e => {
                    const val = e.target.value;
                    setMedicoSearch(val);
                    if (selectedMedico && val !== selectedMedico.nome) setSelectedMedico(null);
                    setShowMedicoDropdown(true);
                  }}
                  onFocus={() => setShowMedicoDropdown(medicoSearch.length > 0)}
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground text-sm"
                />
              </div>
              {showMedicoDropdown && medicoSearch.length > 0 && filteredMedicos.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                  {filteredMedicos.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedMedico(m);
                        setMedicoSearch(m.nome);
                        setShowMedicoDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-secondary/50 flex flex-col border-b border-border/30 last:border-0 text-sm"
                    >
                      <span className="font-medium text-foreground">{m.nome}</span>
                      <span className="text-xs text-muted-foreground mt-0.5">{m.especialidade} • {m.crm}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bloco 4: Procedimento Solicitado */}
        <div className="glass rounded-2xl p-6 space-y-6">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 border-b border-border/50 pb-4">
            <Stethoscope className="w-5 h-5 text-primary" /> Procedimento Solicitado
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-foreground">Data</label>
              <input
                type="date"
                disabled
                value={dataAtendimento}
                className="w-full h-12 px-4 rounded-xl bg-secondary/30 border border-border text-muted-foreground outline-none cursor-not-allowed text-sm"
              />
            </div>

            <div className="md:col-span-6 relative" ref={procRef}>
              <label className="block text-sm font-medium mb-2 text-foreground">Procedimento</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Pesquise por código ou nome..."
                  value={procSearch}
                  onChange={e => {
                    const val = e.target.value;
                    setProcSearch(val);
                    if (selectedProc && val !== `${selectedProc.codigo} - ${selectedProc.nome}`) setSelectedProc(null);
                    setShowProcDropdown(true);
                  }}
                  onFocus={() => setShowProcDropdown(procSearch.length > 0)}
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground text-sm"
                />
              </div>
              {showProcDropdown && procSearch.length > 0 && filteredProcs.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                  {filteredProcs.map(p => (
                    <button
                      key={p.codigo}
                      type="button"
                      onClick={() => {
                        setSelectedProc(p);
                        setProcSearch(`${p.codigo} - ${p.nome}`);
                        setShowProcDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-secondary/50 flex flex-col border-b border-border/30 last:border-0 text-sm"
                    >
                      <span className="font-semibold text-foreground text-xs">{p.codigo}</span>
                      <span className="text-xs text-muted-foreground">{p.nome}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-foreground">Qtd.</label>
              <input
                type="number"
                min="1"
                value={procQtd}
                onChange={e => setProcQtd(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="button"
                onClick={handleAddProcedimento}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5 text-sm"
              >
                <Plus className="w-5 h-5" /> Inserir
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-border/50 rounded-xl">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-secondary/30 text-muted-foreground border-b border-border/50">
                  <th className="py-3 px-4 font-medium">Data</th>
                  <th className="py-3 px-4 font-medium">Código</th>
                  <th className="py-3 px-4 font-medium">Procedimento/exame</th>
                  <th className="py-3 px-4 font-medium">Qtd.</th>
                  <th className="py-3 px-4 font-medium">Valor Unitário</th>
                  <th className="py-3 px-4 font-medium">Subtotal</th>
                  <th className="py-3 px-4 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {procedimentosAdicionados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground font-medium bg-background/50">
                      Nenhum procedimento inserido.
                    </td>
                  </tr>
                ) : (
                  procedimentosAdicionados.map((item, index) => (
                    <tr key={index} className="border-b border-border/30 hover:bg-secondary/20 transition-all">
                      <td className="py-3 px-4 text-muted-foreground">{item.data}</td>
                      <td className="py-3 px-4 font-mono text-xs">{item.codigo}</td>
                      <td className="py-3 px-4 text-foreground font-medium">{item.nome}</td>
                      <td className="py-3 px-4 text-foreground">{item.qtd}</td>
                      <td className="py-3 px-4 text-muted-foreground">R$ {item.valor.toFixed(2)}</td>
                      <td className="py-3 px-4 text-foreground font-semibold">R$ {(item.valor * item.qtd).toFixed(2)}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveProcedimento(index)}
                          className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pr-4 text-lg font-bold text-foreground">
            Valor total: R$ {totalValue.toFixed(2)}
          </div>
        </div>

        {/* Bloco 5: Dados da Solicitação */}
        <div className="glass rounded-2xl p-6 space-y-6">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 border-b border-border/50 pb-4">
            <FileText className="w-5 h-5 text-primary" /> Dados da Solicitação
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Data da Solicitação</label>
              <input
                type="date"
                value={solicitacaoData}
                onChange={e => setSolicitacaoData(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Hora da Solicitação</label>
              <input
                type="text"
                value={solicitacaoHora}
                onChange={e => setSolicitacaoHora(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Contratado Solicitante</label>
              <div className="flex bg-secondary/50 p-1 rounded-xl border border-border">
                {(['Hospital', 'Pessoa Jurídica', 'Pessoa Física'] as const).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setContratadoSolicitante(c)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${contratadoSolicitante === c
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Profissional Solicitante</label>
              <input
                type="text"
                placeholder="Ex: Dr. Roberto Alves Neto"
                value={profissionalSolicitante}
                onChange={e => setProfissionalSolicitante(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Especialidade do Solicitante</label>
              <input
                type="text"
                placeholder="Ex: Clínica Geral"
                value={especialidadeSolicitante}
                onChange={e => setEspecialidadeSolicitante(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Indicação Clínica</label>
              <input
                type="text"
                placeholder="Ex: Paciente com sintomas agudos..."
                value={indicacaoClinica}
                onChange={e => setIndicacaoClinica(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Observações</label>
            <textarea
              rows={3}
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="Notas clínicas ou observações gerais..."
              className="w-full p-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground text-sm"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/clinical/atendimentos')}
            className="h-12 px-6 rounded-xl border border-border font-medium hover:bg-secondary transition-colors text-foreground"
          >
            Cancelar e voltar para listagem
          </button>
          <button
            type="submit"
            disabled={loading}
            className="h-12 px-8 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar Atendimento'}
          </button>
        </div>
      </form>

      {/* Paciente Modal Inline */}
      <PacienteModalInline
        isOpen={pacienteModal}
        onClose={() => setPacienteModal(false)}
        onSuccess={(p) => {
          setSelectedPaciente(p);
          setPacienteSearch(p.nome);
        }}
      />
    </div>
  );
}
