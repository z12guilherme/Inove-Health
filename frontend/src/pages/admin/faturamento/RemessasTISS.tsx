import { useState, useEffect, useCallback } from 'react';
import {
  FileCode2,
  Search,
  Filter,
  Download,
  Loader2,
  CheckCircle2,
  Package,
  Calendar,
  Building,
  Users,
  Activity,
  Stethoscope,
  Bed,
  AlertTriangle,
  Eye,
  X,
  ChevronDown,
  Clock,
  CreditCard,
  Syringe,
  CheckSquare,
  Square
} from 'lucide-react';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';
import { cn } from '../../../lib/utils';
import {
  gerarXmlTiss,
  calcularValoresTotais,
  gerarNumeroGuia,
  type RemessaConfig,
  type GuiaConsultaXml,
  type GuiaSPSADTXml,
  type GuiaInternacaoXml,
  type ProcedimentoXml,
  type DespesaXml,
  type TipoGuia,
} from '../../../lib/tissXmlGenerator';

const TIPO_GUIA_OPTIONS: { value: TipoGuia; label: string; icon: any; color: string }[] = [
  { value: 'CONSULTA', label: 'Consulta Eletiva', icon: Users, color: 'text-blue-500 bg-blue-50' },
  { value: 'URGENCIA', label: 'Urgência (SP-SADT)', icon: AlertTriangle, color: 'text-amber-500 bg-amber-50' },
  { value: 'SADT', label: 'SADT / Exames', icon: Activity, color: 'text-emerald-500 bg-emerald-50' },
  { value: 'INTERNAMENTO', label: 'Internação', icon: Bed, color: 'text-purple-500 bg-purple-50' },
];

// Dados do prestador (constantes do hospital)
const PRESTADOR = {
  cnpj: '04232442000114',
  cnes: '6931561',
  nomeContratado: 'HOSPITAL CONSULT IMAGEM E DIAGNOSTICO LTDA',
};

interface Convenio {
  id: string;
  nome: string;
  registro_ans: string;
  tiss_versao: string;
  cnpj: string;
  [key: string]: any;
}

export function RemessasTISS() {
  // State: Config
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [selectedConvenio, setSelectedConvenio] = useState<Convenio | null>(null);
  const [tipoGuia, setTipoGuia] = useState<TipoGuia>('CONSULTA');
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().split('T')[0]);

  // State: Atendimentos
  const [atendimentos, setAtendimentos] = useState<any[]>([]);
  const [lancamentosMap, setLancamentosMap] = useState<Record<string, any[]>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // State: Resultado
  const [resultado, setResultado] = useState<any>(null);
  const [previewXml, setPreviewXml] = useState<string | null>(null);

  // State: Histórico
  const [historico, setHistorico] = useState<any[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<'nova' | 'historico'>('nova');
  const [protocoloModal, setProtocoloModal] = useState<{ id: string; num: string } | null>(null);

  const handleSaveProtocolo = () => {
    if (!protocoloModal?.num.trim()) {
      toast.error('Informe o número do protocolo.');
      return;
    }
    const novos = historico.map(h => 
      h.id === protocoloModal.id ? { ...h, protocolo: protocoloModal.num, status: 'FECHADO' } : h
    );
    setHistorico(novos);
    localStorage.setItem('inove_remessas_historico', JSON.stringify(novos));
    setProtocoloModal(null);
    toast.success('Protocolo informado com sucesso. Lote marcado como Fechado.');
  };

  // Fetch convênios
  useEffect(() => {
    const fetchConvenios = async () => {
      try {
        const res = await api.get('/cadastros/convenios');
        const convs = res.data.convenios || [];
        setConvenios(convs);
      } catch {
        toast.error('Erro ao carregar convênios');
      }
    };
    fetchConvenios();

    // Fetch histórico
    const hist = JSON.parse(localStorage.getItem('inove_remessas_historico') || '[]');
    setHistorico(hist);
  }, []);

  // Fetch atendimentos
  const buscarAtendimentos = useCallback(async () => {
    if (!selectedConvenio) return;
    setLoading(true);
    setSelectedIds(new Set());
    try {
      const res = await api.get('/atendimentos');
      const todos: any[] = res.data.atendimentos || [];

      // Mapear tipo do sistema para tipo da guia
      const tipoMap: Record<string, string> = {
        'CONSULTA': 'CONSULTA',
        'URGENCIA': 'URGENCIA',
        'SADT': 'SADT',
        'INTERNAMENTO': 'INTERNAMENTO',
      };

      const filtered = todos.filter((a: any) => {
        const tipoAtend = a.tipo?.toUpperCase();
        const matchTipo = tipoAtend === tipoMap[tipoGuia];
        const matchConvenio = a.convenio_id === selectedConvenio.id;
        const matchData = a.data >= dataInicio && a.data <= dataFim;
        const matchStatus = a.status === 'ATIVO' || a.status === 'FINALIZADO';
        return matchTipo && matchConvenio && matchData && matchStatus;
      });

      setAtendimentos(filtered);

      // Buscar lançamentos para cada atendimento
      const lanMap: Record<string, any[]> = {};
      for (const atend of filtered) {
        try {
          const resLan = await api.get(`/faturamento/lancamentos?atendimento_id=${atend.id}`);
          lanMap[atend.id] = resLan.data.lancamentos || [];
        } catch {
          lanMap[atend.id] = [];
        }
      }
      setLancamentosMap(lanMap);
    } catch {
      toast.error('Erro ao buscar atendimentos');
    } finally {
      setLoading(false);
    }
  }, [selectedConvenio, tipoGuia, dataInicio, dataFim]);

  useEffect(() => {
    if (selectedConvenio) {
      buscarAtendimentos();
    }
  }, [selectedConvenio, tipoGuia, dataInicio, dataFim, buscarAtendimentos]);

  // Seleção
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === atendimentos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(atendimentos.map(a => a.id)));
    }
  };

  // Cálculos
  const selectedAtendimentos = atendimentos.filter(a => selectedIds.has(a.id));
  const valorTotalSelecionado = selectedAtendimentos.reduce((sum, a) => {
    const procValor = (a.procedimentos || []).reduce((s: number, p: any) => s + (p.valor || 0) * (p.qtd || 1), 0);
    const lanValor = (lancamentosMap[a.id] || []).reduce((s: number, l: any) => s + (l.valor_total || 0), 0);
    return sum + procValor + lanValor;
  }, 0);

  // ── Geração XML ────────────────────────────────────────────
  const handleGerarRemessa = () => {
    if (!selectedConvenio) {
      toast.error('Selecione um convênio');
      return;
    }
    if (selectedIds.size === 0) {
      toast.error('Selecione ao menos um atendimento');
      return;
    }

    try {
      const config: RemessaConfig = {
        prestador: PRESTADOR,
        convenio: {
          registroANS: selectedConvenio.registro_ans,
          nome: selectedConvenio.nome,
          tissVersao: selectedConvenio.tiss_versao || '4.01.00',
        },
        tipoGuia,
        numeroLote: 0, // auto-increment
      };

      if (tipoGuia === 'CONSULTA') {
        config.guiasConsulta = selectedAtendimentos.map(a => buildGuiaConsultaFromAtend(a));
      } else if (tipoGuia === 'URGENCIA' || tipoGuia === 'SADT') {
        config.guiasSPSADT = selectedAtendimentos.map(a => buildGuiaSPSADTFromAtend(a, lancamentosMap[a.id] || [], tipoGuia));
      } else if (tipoGuia === 'INTERNAMENTO') {
        config.guiasInternacao = selectedAtendimentos.map(a => buildGuiaInternacaoFromAtend(a, lancamentosMap[a.id] || []));
      }

      const { xml, hash, numeroLote } = gerarXmlTiss(config);

      const result = {
        xml,
        hash,
        numeroLote,
        totalGuias: selectedIds.size,
        valorTotalLote: valorTotalSelecionado.toFixed(2),
        nomeArquivo: `TISS_${selectedConvenio.nome.replace(/\s+/g, '_')}_LOTE_${numeroLote}_${tipoGuia}.xml`,
        convenio: selectedConvenio.nome,
        tipo: tipoGuia,
        data: new Date().toISOString(),
        status: 'AGUARDANDO',
      };

      setResultado(result);

      // Salvar no histórico
      const hist = JSON.parse(localStorage.getItem('inove_remessas_historico') || '[]');
      hist.unshift({
        id: `rem-${Date.now()}`,
        ...result,
        xml: undefined, // Não salvar o XML gigante no histórico
        xmlBase64: btoa(unescape(encodeURIComponent(xml))),
      });
      localStorage.setItem('inove_remessas_historico', JSON.stringify(hist));
      setHistorico(hist);

      toast.success(`Remessa TISS gerada com sucesso! Lote #${numeroLote}`);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar XML TISS');
    }
  };

  // ── Build Guias from Atendimentos ──────────────────────────

  function buildGuiaConsultaFromAtend(a: any): GuiaConsultaXml {
    const numGuia = gerarNumeroGuia();
    const proc = a.procedimentos?.[0] || {};
    return {
      registroANS: selectedConvenio!.registro_ans,
      numeroGuiaPrestador: numGuia,
      numeroGuiaOperadora: numGuia,
      numeroCarteira: a.paciente_cpf?.replace(/\D/g, '') || '0000000000000',
      atendimentoRN: 'N',
      codigoPrestadorNaOperadora: PRESTADOR.cnpj,
      cnes: PRESTADOR.cnes,
      nomeProfissional: a.dados_atendimento?.profissional_executante || 'PROFISSIONAL',
      conselhoProfissional: '06',
      numeroConselhoProfissional: '00000',
      uf: '26',
      cbos: '225125',
      indicacaoAcidente: '9',
      regimeAtendimento: '01',
      dataAtendimento: a.data,
      tipoConsulta: '1',
      codigoTabela: '22',
      codigoProcedimento: proc.codigo || '10101012',
      valorProcedimento: (proc.valor || 120).toFixed(1),
      observacao: a.observacoes || 'Nenhuma Observacao',
    };
  }

  function buildGuiaSPSADTFromAtend(a: any, lans: any[], tipo: TipoGuia): GuiaSPSADTXml {
    const numGuia = gerarNumeroGuia();
    const isUrgencia = tipo === 'URGENCIA';

    // Build procedimentos
    const procs: ProcedimentoXml[] = (a.procedimentos || []).map((p: any, i: number) => ({
      sequencialItem: i + 1,
      dataExecucao: p.data || a.data,
      horaInicial: p.horaInicial,
      horaFinal: p.horaFinal,
      codigoTabela: '22',
      codigoProcedimento: p.codigo || '10101012',
      descricaoProcedimento: p.nome || 'Procedimento',
      quantidadeExecutada: p.qtd || 1,
      viaAcesso: '1',
      reducaoAcrescimo: '1.00',
      valorUnitario: (p.valor || 0).toFixed(2),
      valorTotal: ((p.valor || 0) * (p.qtd || 1)).toFixed(2),
    }));

    // Build despesas from lançamentos
    const despesas: DespesaXml[] = lans.map((l: any, i: number) => {
      let codigoDespesa = '07'; // default: taxas
      if (l.tipo === 'MEDICAMENTO') codigoDespesa = '02';
      else if (l.tipo === 'MATERIAL') codigoDespesa = '03';

      return {
        sequencialItem: procs.length + i + 1,
        codigoDespesa,
        dataExecucao: l.realizacao?.split('T')[0] || a.data,
        horaInicial: '07:00:00',
        horaFinal: '07:00:00',
        codigoTabela: codigoDespesa === '02' ? '20' : codigoDespesa === '03' ? '19' : '18',
        codigoProcedimento: l.item?.match(/\d+/)?.[0] || '60000000',
        quantidadeExecutada: (l.quantidade || 1).toFixed(1),
        unidadeMedida: '036',
        reducaoAcrescimo: '1.0',
        valorUnitario: (l.valor_unitario || 0).toFixed(2),
        valorTotal: (l.valor_total || 0).toFixed(2),
        descricaoProcedimento: l.item || 'Item lançado',
      };
    });

    const valoresTotais = calcularValoresTotais(procs, despesas);

    return {
      registroANS: selectedConvenio!.registro_ans,
      numeroGuiaPrestador: numGuia,
      numeroGuiaOperadora: numGuia,
      dataAutorizacao: a.dados_autorizacao?.data_emissao || a.data,
      senha: a.dados_autorizacao?.senha || undefined,
      numeroCarteira: a.paciente_cpf?.replace(/\D/g, '') || '0000000000000',
      atendimentoRN: 'N',
      cnpjContratadoSolicitante: PRESTADOR.cnpj,
      nomeContratadoSolicitante: PRESTADOR.nomeContratado,
      nomeProfissionalSolicitante: a.dados_atendimento?.profissional_executante || a.dados_solicitacao?.profissional || 'PROFISSIONAL',
      conselhoProfissionalSolicitante: '06',
      numeroConselhoProfissionalSolicitante: '00000',
      ufSolicitante: '26',
      cbosSolicitante: '225125',
      dataSolicitacao: a.dados_solicitacao?.data || a.data,
      caraterAtendimento: isUrgencia ? '2' : '1',
      codigoPrestadorExecutante: PRESTADOR.cnpj,
      cnes: PRESTADOR.cnes,
      tipoAtendimento: isUrgencia ? '04' : '23',
      indicacaoAcidente: '9',
      tipoConsulta: isUrgencia ? '1' : undefined,
      regimeAtendimento: isUrgencia ? '04' : '01',
      procedimentos: procs,
      despesas,
      valoresTotais,
    };
  }

  function buildGuiaInternacaoFromAtend(a: any, lans: any[]): GuiaInternacaoXml {
    const numGuia = gerarNumeroGuia();

    const procs: ProcedimentoXml[] = (a.procedimentos || []).map((p: any, i: number) => ({
      sequencialItem: i + 1,
      dataExecucao: p.data || a.data,
      codigoTabela: '22',
      codigoProcedimento: p.codigo || '31001001',
      descricaoProcedimento: p.nome || 'Procedimento',
      quantidadeExecutada: p.qtd || 1,
      viaAcesso: '1',
      tecnicaUtilizada: '1',
      reducaoAcrescimo: '1.00',
      valorUnitario: (p.valor || 0).toFixed(2),
      valorTotal: ((p.valor || 0) * (p.qtd || 1)).toFixed(2),
    }));

    const despesas: DespesaXml[] = lans.map((l: any, i: number) => {
      let codigoDespesa = '07';
      if (l.tipo === 'MEDICAMENTO') codigoDespesa = '02';
      else if (l.tipo === 'MATERIAL') codigoDespesa = '03';

      return {
        sequencialItem: procs.length + i + 1,
        codigoDespesa,
        dataExecucao: l.realizacao?.split('T')[0] || a.data,
        horaInicial: '14:00:00',
        horaFinal: '14:00:00',
        codigoTabela: codigoDespesa === '02' ? '20' : codigoDespesa === '03' ? '19' : '18',
        codigoProcedimento: l.item?.match(/\d+/)?.[0] || '60000000',
        quantidadeExecutada: (l.quantidade || 1).toFixed(1),
        unidadeMedida: '036',
        reducaoAcrescimo: '1.0',
        valorUnitario: (l.valor_unitario || 0).toFixed(2),
        valorTotal: (l.valor_total || 0).toFixed(2),
        descricaoProcedimento: l.item || 'Item lançado',
      };
    });

    const valoresTotais = calcularValoresTotais(procs, despesas);
    const dadosAtend = a.dados_atendimento || {};
    const cid = dadosAtend.cid10?.split(' - ')[0]?.replace(/\s/g, '') || 'W999';

    return {
      registroANS: selectedConvenio!.registro_ans,
      numeroGuiaPrestador: numGuia,
      numeroGuiaSolicitacaoInternacao: numGuia,
      numeroGuiaOperadora: numGuia,
      dataAutorizacao: a.dados_autorizacao?.data_emissao || a.data,
      senha: a.dados_autorizacao?.senha || undefined,
      numeroCarteira: a.paciente_cpf?.replace(/\D/g, '') || '0000000000000',
      atendimentoRN: 'N',
      codigoPrestadorExecutante: PRESTADOR.cnpj,
      cnes: PRESTADOR.cnes,
      caraterAtendimento: dadosAtend.carater === 'Eletiva' ? '1' : '2',
      tipoFaturamento: '4',
      dataInicioFaturamento: a.data,
      horaInicioFaturamento: a.hora ? `${a.hora}:00` : '08:00:00',
      dataFinalFaturamento: a.data,
      horaFinalFaturamento: '14:00:00',
      tipoInternacao: '2',
      regimeInternacao: '1',
      diagnostico: cid,
      indicadorAcidente: '2',
      motivoEncerramento: '11',
      procedimentos: procs,
      equipes: [{
        grauPart: '00',
        cpfContratado: '00000000000',
        nomeProf: dadosAtend.profissional_executante || 'PROFISSIONAL',
        conselho: '06',
        numeroConselhoProfissional: '00000',
        uf: '26',
        cbos: '225125',
      }],
      despesas,
      valoresTotais,
    };
  }

  // ── Download ───────────────────────────────────────────────
  const handleDownload = (xmlContent: string, nomeArquivo: string) => {
    const blob = new Blob([xmlContent], { type: 'text/xml; charset=ISO-8859-1' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadHistorico = (item: any) => {
    try {
      const xmlContent = decodeURIComponent(escape(atob(item.xmlBase64)));
      handleDownload(xmlContent, item.nomeArquivo);
    } catch {
      toast.error('Erro ao recuperar XML');
    }
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Remessas TISS</h1>
        <p className="text-muted-foreground mt-2">Crie remessas XML no padrão TISS 4.01.00 para envio às operadoras.</p>
      </div>

      {/* Abas */}
      <div className="flex gap-2 p-1.5 bg-secondary/20 rounded-2xl w-fit border border-border/50">
        {(['nova', 'historico'] as const).map(aba => (
          <button
            key={aba}
            onClick={() => setAbaAtiva(aba)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-semibold transition-all",
              abaAtiva === aba
                ? "bg-background text-primary shadow-md border border-primary/10"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {aba === 'nova' ? '✨ Nova Remessa' : '📋 Histórico'}
          </button>
        ))}
      </div>

      {abaAtiva === 'nova' ? (
        <>
          {/* Configuração */}
          <div className="glass rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" /> Configuração da Remessa
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Convênio */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium mb-1.5">Convênio / Operadora *</label>
                <select
                  value={selectedConvenio?.id || ''}
                  onChange={e => {
                    const c = convenios.find(c => c.id === e.target.value) || null;
                    setSelectedConvenio(c);
                  }}
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                  <option value="">Selecione o convênio...</option>
                  {convenios.map(c => (
                    <option key={c.id} value={c.id}>{c.nome} — ANS: {c.registro_ans}</option>
                  ))}
                </select>
                {selectedConvenio && (
                  <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                      TISS {selectedConvenio.tiss_versao || '4.01.00'}
                    </span>
                    <span>ANS: {selectedConvenio.registro_ans}</span>
                  </div>
                )}
              </div>

              {/* Período */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Data Início</label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={e => setDataInicio(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Data Fim</label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={e => setDataFim(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* Tipo de Guia */}
            <div>
              <label className="block text-sm font-medium mb-3">Tipo de Guia *</label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {TIPO_GUIA_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setTipoGuia(opt.value)}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 text-center",
                        tipoGuia === opt.value
                          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                          : "border-border/50 hover:border-primary/30 bg-background"
                      )}
                    >
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", opt.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={cn("text-sm font-semibold", tipoGuia === opt.value ? "text-primary" : "text-muted-foreground")}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Lista de Atendimentos */}
          {selectedConvenio && (
            <div className="glass rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-primary" />
                  Atendimentos Disponíveis
                  <span className="text-sm font-normal text-muted-foreground">({atendimentos.length} encontrados)</span>
                </h2>
                <div className="flex items-center gap-3">
                  {atendimentos.length > 0 && (
                    <button
                      onClick={selectAll}
                      className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors"
                    >
                      {selectedIds.size === atendimentos.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      {selectedIds.size === atendimentos.length ? 'Limpar Seleção' : 'Selecionar Todos'}
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : atendimentos.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">Nenhum atendimento encontrado</p>
                  <p className="text-sm mt-1">Verifique o convênio, tipo e período selecionados.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border/50">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-secondary/50">
                      <tr>
                        <th className="px-4 py-3 font-semibold w-12"></th>
                        <th className="px-4 py-3 font-semibold">Atendimento</th>
                        <th className="px-4 py-3 font-semibold">Data</th>
                        <th className="px-4 py-3 font-semibold">Paciente</th>
                        <th className="px-4 py-3 font-semibold">Profissional</th>
                        <th className="px-4 py-3 font-semibold text-center">Procedimentos</th>
                        <th className="px-4 py-3 font-semibold text-center">Lançamentos</th>
                        <th className="px-4 py-3 font-semibold text-right">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 bg-background/50">
                      {atendimentos.map(a => {
                        const isSelected = selectedIds.has(a.id);
                        const lans = lancamentosMap[a.id] || [];
                        const procValor = (a.procedimentos || []).reduce((s: number, p: any) => s + (p.valor || 0) * (p.qtd || 1), 0);
                        const lanValor = lans.reduce((s: number, l: any) => s + (l.valor_total || 0), 0);
                        const total = procValor + lanValor;

                        return (
                          <tr
                            key={a.id}
                            onClick={() => toggleSelect(a.id)}
                            className={cn(
                              "cursor-pointer transition-colors",
                              isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-secondary/20"
                            )}
                          >
                            <td className="px-4 py-3">
                              <div className={cn(
                                "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                isSelected ? "bg-primary border-primary" : "border-border"
                              )}>
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{a.id}</td>
                            <td className="px-4 py-3 text-muted-foreground">{new Date(a.data).toLocaleDateString('pt-BR')}</td>
                            <td className="px-4 py-3 font-semibold">{a.paciente_nome}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{a.dados_atendimento?.profissional_executante || '—'}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full text-xs font-semibold">
                                {(a.procedimentos || []).length}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-xs font-semibold",
                                lans.length > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-secondary text-muted-foreground"
                              )}>
                                {lans.length}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-semibold">
                              R$ {total.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Resumo e Gerar */}
          {selectedIds.size > 0 && (
            <div className="glass rounded-2xl p-6 border-2 border-primary/20 bg-primary/5 animate-in fade-in zoom-in-95">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                <div className="flex gap-8">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Guias Selecionadas</p>
                    <p className="text-3xl font-bold text-foreground">{selectedIds.size}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Tipo de Guia</p>
                    <p className="text-lg font-bold text-primary">{TIPO_GUIA_OPTIONS.find(o => o.value === tipoGuia)?.label}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Valor Total do Lote</p>
                    <p className="text-3xl font-bold text-primary font-mono">R$ {valorTotalSelecionado.toFixed(2)}</p>
                  </div>
                </div>
                <button
                  onClick={handleGerarRemessa}
                  className="h-14 px-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-primary/25 hover:-translate-y-0.5 text-base"
                >
                  <FileCode2 className="w-6 h-6" /> Gerar Remessa XML TISS
                </button>
              </div>
            </div>
          )}

          {/* Resultado */}
          {resultado && (
            <div className="glass rounded-2xl p-6 animate-in fade-in zoom-in-95 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-500">Remessa Gerada com Sucesso!</h3>
                  <p className="text-sm text-muted-foreground">Lote #{resultado.numeroLote} • Hash: {resultado.hash}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-background p-4 rounded-xl border border-border">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Total de Guias</p>
                  <p className="font-mono text-lg font-bold">{resultado.totalGuias}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Valor Total</p>
                  <p className="font-mono text-lg font-bold text-primary">R$ {resultado.valorTotalLote}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Convênio</p>
                  <p className="text-sm font-bold">{resultado.convenio}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Tipo</p>
                  <p className="text-sm font-bold">{resultado.tipo}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleDownload(resultado.xml, resultado.nomeArquivo)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white h-12 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <Download className="w-5 h-5" /> Download XML
                </button>
                <button
                  onClick={() => setPreviewXml(resultado.xml)}
                  className="h-12 px-6 rounded-xl border border-border font-medium hover:bg-secondary transition-colors flex items-center gap-2"
                >
                  <Eye className="w-5 h-5" /> Visualizar
                </button>
              </div>
              <p className="text-xs text-muted-foreground font-mono truncate">{resultado.nomeArquivo}</p>
            </div>
          )}

          {/* Modal Preview */}
          {previewXml && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-background rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-border">
                  <h3 className="font-bold text-lg">Preview XML TISS</h3>
                  <button onClick={() => setPreviewXml(null)} className="p-2 hover:bg-secondary rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <pre className="flex-1 overflow-auto p-4 text-xs font-mono text-muted-foreground whitespace-pre-wrap bg-secondary/20">
                  {previewXml}
                </pre>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Histórico */
        <div className="glass rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> Histórico de Remessas
          </h2>

          {historico.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Nenhuma remessa gerada ainda</p>
              <p className="text-sm mt-1">Crie sua primeira remessa na aba "Nova Remessa".</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/50">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nº Lote</th>
                    <th className="px-4 py-3 font-semibold">Data</th>
                    <th className="px-4 py-3 font-semibold">Convênio</th>
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold text-center">Guias</th>
                    <th className="px-4 py-3 font-semibold text-right">Valor</th>
                    <th className="px-4 py-3 font-semibold">Status/Protocolo</th>
                    <th className="px-4 py-3 font-semibold text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 bg-background/50">
                  {historico.map((item: any) => (
                    <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-primary">{item.numeroLote}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(item.data).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 font-semibold">{item.convenio}</td>
                      <td className="px-4 py-3">
                        <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-semibold">
                          {item.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">{item.totalGuias}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">R$ {item.valorTotalLote}</td>
                      <td className="px-4 py-3">
                        {item.protocolo ? (
                          <span className="text-emerald-500 font-bold text-xs bg-emerald-500/10 px-2 py-1.5 rounded-full flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {item.protocolo}
                          </span>
                        ) : (
                          <button
                            onClick={() => setProtocoloModal({ id: item.id, num: '' })}
                            className="text-[11px] bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white px-2.5 py-1 rounded-lg font-bold transition-colors"
                          >
                            Informar Protocolo
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDownloadHistorico(item)}
                          className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1 mx-auto"
                        >
                          <Download className="w-3.5 h-3.5" /> XML
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal Protocolo */}
          {protocoloModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-background rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-emerald-500" /> Fechar Lote
                </h3>
                <p className="text-sm text-muted-foreground">Informe o número do protocolo de recebimento fornecido pela operadora.</p>
                <div>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Ex: 123456789"
                    value={protocoloModal.num}
                    onChange={e => setProtocoloModal(prev => prev ? { ...prev, num: e.target.value } : null)}
                    className="w-full h-12 px-4 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none transition-all font-mono"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setProtocoloModal(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border hover:bg-secondary font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveProtocolo}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
