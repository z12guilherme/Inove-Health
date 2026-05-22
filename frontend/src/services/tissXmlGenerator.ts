import type { LoteTiss } from "./localStorageService";
import md5 from "md5";

interface AtendimentoData {
  id: string;
  data: string;
  numero_guia?: string;
  senha_autorizacao?: string;
  valor_total?: number;
  tipo?: string;
  procedimentos?: any[];
}

export function generateTissXml(lote: LoteTiss, atendimentos: AtendimentoData[]): string {
  const dataRegistro = new Date().toISOString().split('T')[0];
  const horaRegistro = new Date().toTimeString().split(' ')[0];

  const isUrgencia = lote.tipo_guia === 'URGENCIA';
  const isInternamento = lote.tipo_guia === 'INTERNAMENTO';
  const isSadt = lote.tipo_guia === 'SADT';

  const getCodigoDespesa = (tabela: string) => {
    const t = tabela.split(' - ')[0];
    switch (t) {
      case '19': case '95': return '03'; // Materiais
      case '20': case '96': return '02'; // Medicamentos
      case '18': case '97': return '07'; // Taxas
      case '45': return '05'; // Diárias
      case '99': return '01'; // Gases
      default: return '08';
    }
  };

  const isDespesa = (tabela: string) => {
    const t = tabela.split(' - ')[0];
    return ['18', '19', '20', '45', '95', '96', '97', '98', '99'].includes(t);
  };

  const processItems = (atd: AtendimentoData) => {
    const procs: any[] = [];
    const desps: any[] = [];

    let sumProcedimentos = 0;
    let sumDiarias = 0;
    let sumTaxas = 0;
    let sumMateriais = 0;
    let sumMedicamentos = 0;
    let sumGases = 0;

    let seq = 1;

    (atd.procedimentos || []).forEach(p => {
      const tab = p.codigo_tabela || '22';
      const valorTotal = p.valor * (p.qtd || 1);

      if (isDespesa(tab)) {
        desps.push({ ...p, seq: seq++ });
        const codDesp = getCodigoDespesa(tab);
        if (codDesp === '05') sumDiarias += valorTotal;
        else if (codDesp === '07' || codDesp === '04') sumTaxas += valorTotal;
        else if (codDesp === '03') sumMateriais += valorTotal;
        else if (codDesp === '02') sumMedicamentos += valorTotal;
        else if (codDesp === '01') sumGases += valorTotal;
      } else {
        procs.push({ ...p, seq: seq++ });
        sumProcedimentos += valorTotal;
      }
    });

    const sumTotalGeral = sumProcedimentos + sumDiarias + sumTaxas + sumMateriais + sumMedicamentos + sumGases;

    return { procs, desps, sumProcedimentos, sumDiarias, sumTaxas, sumMateriais, sumMedicamentos, sumGases, sumTotalGeral };
  };

  const buildProcedimentosXml = (procs: any[], atd: AtendimentoData, isInternacao: boolean) => {
    if (procs.length === 0) return '';
    const xml = procs.map(p => `<ans:procedimentoExecutado><ans:sequencialItem>${p.seq}</ans:sequencialItem><ans:dataExecucao>${atd.data.split('T')[0]}</ans:dataExecucao><ans:procedimento><ans:codigoTabela>${(p.codigo_tabela || '22').split(' - ')[0]}</ans:codigoTabela><ans:codigoProcedimento>${p.codigo}</ans:codigoProcedimento><ans:descricaoProcedimento>${p.nome.trim()}</ans:descricaoProcedimento></ans:procedimento><ans:quantidadeExecutada>${p.qtd || 1}</ans:quantidadeExecutada><ans:viaAcesso>1</ans:viaAcesso>${isInternacao ? '<ans:tecnicaUtilizada>1</ans:tecnicaUtilizada>' : ''}<ans:reducaoAcrescimo>1.00</ans:reducaoAcrescimo><ans:valorUnitario>${p.valor.toFixed(2)}</ans:valorUnitario><ans:valorTotal>${(p.valor * (p.qtd || 1)).toFixed(2)}</ans:valorTotal>${isInternacao ? `<ans:identEquipe><ans:identificacaoEquipe><ans:grauPart>00</ans:grauPart><ans:codProfissional><ans:cpfContratado>83365982272</ans:cpfContratado></ans:codProfissional><ans:nomeProf>VALDEMILSON ALVES</ans:nomeProf><ans:conselho>06</ans:conselho><ans:numeroConselhoProfissional>8696</ans:numeroConselhoProfissional><ans:UF>26</ans:UF><ans:CBOS>225250</ans:CBOS></ans:identificacaoEquipe></ans:identEquipe>` : ''}</ans:procedimentoExecutado>`).join('');
    return `<ans:procedimentosExecutados>${xml}</ans:procedimentosExecutados>`;
  };

  const buildDespesasXml = (desps: any[], atd: AtendimentoData) => {
    if (desps.length === 0) return '';
    const xml = desps.map(p => `<ans:despesa><ans:sequencialItem>${p.seq}</ans:sequencialItem><ans:codigoDespesa>${getCodigoDespesa(p.codigo_tabela || '19')}</ans:codigoDespesa><ans:servicosExecutados><ans:dataExecucao>${atd.data.split('T')[0]}</ans:dataExecucao><ans:horaInicial>08:00:00</ans:horaInicial><ans:horaFinal>08:00:00</ans:horaFinal><ans:codigoTabela>${(p.codigo_tabela || '19').split(' - ')[0]}</ans:codigoTabela><ans:codigoProcedimento>${p.codigo}</ans:codigoProcedimento><ans:quantidadeExecutada>${(p.qtd || 1).toFixed(1)}</ans:quantidadeExecutada><ans:unidadeMedida>001</ans:unidadeMedida><ans:reducaoAcrescimo>1.00</ans:reducaoAcrescimo><ans:valorUnitario>${p.valor.toFixed(2)}</ans:valorUnitario><ans:valorTotal>${(p.valor * (p.qtd || 1)).toFixed(2)}</ans:valorTotal><ans:descricaoProcedimento>${p.nome.trim()}</ans:descricaoProcedimento></ans:servicosExecutados></ans:despesa>`).join('');
    return `<ans:outrasDespesas>${xml}</ans:outrasDespesas>`;
  };

  const buildGuiaConsulta = (atd: AtendimentoData) => {
    const procCodigo = atd.procedimentos?.[0]?.codigo || '10101012';
    const procValor = atd.procedimentos?.[0]?.valor || 150.00;
    const procTabela = atd.procedimentos?.[0]?.codigo_tabela || '22';
    return `<ans:guiaConsulta><ans:cabecalhoConsulta><ans:registroANS>368253</ans:registroANS><ans:numeroGuiaPrestador>${atd.numero_guia || atd.id}</ans:numeroGuiaPrestador></ans:cabecalhoConsulta><ans:numeroGuiaOperadora>${atd.numero_guia || atd.id}</ans:numeroGuiaOperadora><ans:dadosBeneficiario><ans:numeroCarteira>0DVNF000203009</ans:numeroCarteira><ans:atendimentoRN>N</ans:atendimentoRN></ans:dadosBeneficiario><ans:contratadoExecutante><ans:codigoPrestadorNaOperadora>04232442000114</ans:codigoPrestadorNaOperadora><ans:CNES>6931561</ans:CNES></ans:contratadoExecutante><ans:profissionalExecutante><ans:nomeProfissional>DR JOAO SILVA</ans:nomeProfissional><ans:conselhoProfissional>06</ans:conselhoProfissional><ans:numeroConselhoProfissional>12345</ans:numeroConselhoProfissional><ans:UF>35</ans:UF><ans:CBOS>225125</ans:CBOS></ans:profissionalExecutante><ans:indicacaoAcidente>9</ans:indicacaoAcidente><ans:dadosAtendimento><ans:regimeAtendimento>01</ans:regimeAtendimento><ans:dataAtendimento>${atd.data.split('T')[0]}</ans:dataAtendimento><ans:tipoConsulta>1</ans:tipoConsulta><ans:procedimento><ans:codigoTabela>${procTabela.split(' - ')[0]}</ans:codigoTabela><ans:codigoProcedimento>${procCodigo}</ans:codigoProcedimento><ans:valorProcedimento>${procValor.toFixed(2)}</ans:valorProcedimento></ans:procedimento></ans:dadosAtendimento><ans:observacao>Nenhuma Observacao</ans:observacao></ans:guiaConsulta>`;
  };

  const buildGuiaSadt = (atd: AtendimentoData, urgencia: boolean = false) => {
    const { procs, desps, sumProcedimentos, sumDiarias, sumTaxas, sumMateriais, sumMedicamentos, sumGases, sumTotalGeral } = processItems(atd);

    const tipoAtendimento = urgencia ? '04' : '23';
    const caraterAtendimento = urgencia ? '2' : '1';

    return `<ans:guiaSP-SADT><ans:cabecalhoGuia><ans:registroANS>368253</ans:registroANS><ans:numeroGuiaPrestador>${atd.numero_guia || atd.id}</ans:numeroGuiaPrestador></ans:cabecalhoGuia><ans:dadosAutorizacao><ans:numeroGuiaOperadora>${atd.numero_guia || atd.id}</ans:numeroGuiaOperadora><ans:dataAutorizacao>${atd.data.split('T')[0]}</ans:dataAutorizacao><ans:senha>${atd.senha_autorizacao || 'AB6865672'}</ans:senha></ans:dadosAutorizacao><ans:dadosBeneficiario><ans:numeroCarteira>0DVNF000203009</ans:numeroCarteira><ans:atendimentoRN>N</ans:atendimentoRN></ans:dadosBeneficiario><ans:dadosSolicitante><ans:contratadoSolicitante><ans:cnpjContratado>04232442000114</ans:cnpjContratado></ans:contratadoSolicitante><ans:nomeContratadoSolicitante>HOSPITAL CONSULT IMAGEM E DIAGNOSTICO LTDA</ans:nomeContratadoSolicitante><ans:profissionalSolicitante><ans:nomeProfissional>ANDRÉ DE BARROS ARAÚJO</ans:nomeProfissional><ans:conselhoProfissional>06</ans:conselhoProfissional><ans:numeroConselhoProfissional>40609</ans:numeroConselhoProfissional><ans:UF>26</ans:UF><ans:CBOS>225125</ans:CBOS></ans:profissionalSolicitante></ans:dadosSolicitante><ans:dadosSolicitacao><ans:dataSolicitacao>${atd.data.split('T')[0]}</ans:dataSolicitacao><ans:caraterAtendimento>${caraterAtendimento}</ans:caraterAtendimento></ans:dadosSolicitacao><ans:dadosExecutante><ans:contratadoExecutante><ans:codigoPrestadorNaOperadora>04232442000114</ans:codigoPrestadorNaOperadora></ans:contratadoExecutante><ans:CNES>6931561</ans:CNES></ans:dadosExecutante><ans:dadosAtendimento><ans:tipoAtendimento>${tipoAtendimento}</ans:tipoAtendimento><ans:indicacaoAcidente>9</ans:indicacaoAcidente>${urgencia ? '<ans:tipoConsulta>1</ans:tipoConsulta><ans:regimeAtendimento>04</ans:regimeAtendimento>' : '<ans:regimeAtendimento>01</ans:regimeAtendimento>'}</ans:dadosAtendimento>${buildProcedimentosXml(procs, atd, false)}${buildDespesasXml(desps, atd)}<ans:valorTotal><ans:valorProcedimentos>${sumProcedimentos.toFixed(2)}</ans:valorProcedimentos><ans:valorDiarias>${sumDiarias.toFixed(2)}</ans:valorDiarias><ans:valorTaxasAlugueis>${sumTaxas.toFixed(2)}</ans:valorTaxasAlugueis><ans:valorMateriais>${sumMateriais.toFixed(2)}</ans:valorMateriais><ans:valorMedicamentos>${sumMedicamentos.toFixed(2)}</ans:valorMedicamentos><ans:valorOPME>0.00</ans:valorOPME><ans:valorGasesMedicinais>${sumGases.toFixed(2)}</ans:valorGasesMedicinais><ans:valorTotalGeral>${sumTotalGeral.toFixed(2)}</ans:valorTotalGeral></ans:valorTotal></ans:guiaSP-SADT>`;
  };

  const buildGuiaInternacao = (atd: AtendimentoData) => {
    const { procs, desps, sumProcedimentos, sumDiarias, sumTaxas, sumMateriais, sumMedicamentos, sumGases, sumTotalGeral } = processItems(atd);

    return `<ans:guiaResumoInternacao><ans:cabecalhoGuia><ans:registroANS>368253</ans:registroANS><ans:numeroGuiaPrestador>${atd.numero_guia || atd.id}</ans:numeroGuiaPrestador></ans:cabecalhoGuia><ans:numeroGuiaSolicitacaoInternacao>${atd.numero_guia || atd.id}</ans:numeroGuiaSolicitacaoInternacao><ans:dadosAutorizacao><ans:numeroGuiaOperadora>${atd.numero_guia || atd.id}</ans:numeroGuiaOperadora><ans:dataAutorizacao>${atd.data.split('T')[0]}</ans:dataAutorizacao><ans:senha>${atd.senha_autorizacao || 'Y67593612'}</ans:senha></ans:dadosAutorizacao><ans:dadosBeneficiario><ans:numeroCarteira>B4177003737004</ans:numeroCarteira><ans:atendimentoRN>N</ans:atendimentoRN></ans:dadosBeneficiario><ans:dadosExecutante><ans:contratadoExecutante><ans:codigoPrestadorNaOperadora>04232442000114</ans:codigoPrestadorNaOperadora></ans:contratadoExecutante><ans:CNES>6931561</ans:CNES></ans:dadosExecutante><ans:dadosInternacao><ans:caraterAtendimento>1</ans:caraterAtendimento><ans:tipoFaturamento>4</ans:tipoFaturamento><ans:dataInicioFaturamento>${atd.data.split('T')[0]}</ans:dataInicioFaturamento><ans:horaInicioFaturamento>08:28:00</ans:horaInicioFaturamento><ans:dataFinalFaturamento>${atd.data.split('T')[0]}</ans:dataFinalFaturamento><ans:horaFinalFaturamento>14:00:00</ans:horaFinalFaturamento><ans:tipoInternacao>2</ans:tipoInternacao><ans:regimeInternacao>1</ans:regimeInternacao></ans:dadosInternacao><ans:dadosSaidaInternacao><ans:diagnostico>W999</ans:diagnostico><ans:indicadorAcidente>2</ans:indicadorAcidente><ans:motivoEncerramento>11</ans:motivoEncerramento></ans:dadosSaidaInternacao>${buildProcedimentosXml(procs, atd, true)}${buildDespesasXml(desps, atd)}<ans:valorTotal><ans:valorProcedimentos>${sumProcedimentos.toFixed(2)}</ans:valorProcedimentos><ans:valorDiarias>${sumDiarias.toFixed(2)}</ans:valorDiarias><ans:valorTaxasAlugueis>${sumTaxas.toFixed(2)}</ans:valorTaxasAlugueis><ans:valorMateriais>${sumMateriais.toFixed(2)}</ans:valorMateriais><ans:valorMedicamentos>${sumMedicamentos.toFixed(2)}</ans:valorMedicamentos><ans:valorOPME>0.00</ans:valorOPME><ans:valorGasesMedicinais>${sumGases.toFixed(2)}</ans:valorGasesMedicinais><ans:valorTotalGeral>${sumTotalGeral.toFixed(2)}</ans:valorTotalGeral></ans:valorTotal></ans:guiaResumoInternacao>`;
  };

  const guiasXml = atendimentos.map(atd => {
    if (isInternamento || atd.tipo === 'INTERNAMENTO') return buildGuiaInternacao(atd);
    if (isUrgencia || atd.tipo === 'URGENCIA') return buildGuiaSadt(atd, true);
    if (isSadt || atd.tipo === 'SADT' || atd.tipo === 'EXAME') return buildGuiaSadt(atd, false);
    return buildGuiaConsulta(atd);
  }).join('');
  
  let prestadorParaOperadora = `
    <ans:loteGuias>
      <ans:numeroLote>${lote.numero_lote}</ans:numeroLote>
      <ans:guiasTISS>
${guiasXml}
      </ans:guiasTISS>
    </ans:loteGuias>`;

  let xmlString = `<?xml version="1.0" encoding="ISO-8859-1"?>
<ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas">
  <ans:cabecalho>
    <ans:identificacaoTransacao>
      <ans:tipoTransacao>ENVIO_LOTE_GUIAS</ans:tipoTransacao>
      <ans:sequencialTransacao>${lote.numero_lote.padStart(12, '0')}</ans:sequencialTransacao>
      <ans:dataRegistroTransacao>${dataRegistro}</ans:dataRegistroTransacao>
      <ans:horaRegistroTransacao>${horaRegistro}</ans:horaRegistroTransacao>
    </ans:identificacaoTransacao>
    <ans:origem>
      <ans:identificacaoPrestador>
        <ans:codigoPrestadorNaOperadora>04232442000114</ans:codigoPrestadorNaOperadora>
      </ans:identificacaoPrestador>
    </ans:origem>
    <ans:destino>
      <ans:registroANS>368253</ans:registroANS>
    </ans:destino>
    <ans:Padrao>4.01.00</ans:Padrao>
  </ans:cabecalho>
  <ans:prestadorParaOperadora>${prestadorParaOperadora}
  </ans:prestadorParaOperadora>
  <ans:epilogo>
    <ans:hash>PLACEHOLDER_HASH</ans:hash>
  </ans:epilogo>
</ans:mensagemTISS>`;

  // 1. A ANS exige que as quebras de linha sejam CRLF antes do hash
  xmlString = xmlString.replace(/\r?\n/g, '\r\n');

  // 2. Extrair EXATAMENTE o conteúdo original entre as tags (método infalível)
  const startTag = '<ans:prestadorParaOperadora>';
  const endTag = '</ans:prestadorParaOperadora>';
  const startIndex = xmlString.indexOf(startTag) + startTag.length;
  const endIndex = xmlString.indexOf(endTag);
  const hashContent = xmlString.substring(startIndex, endIndex);

  // 3. Calcula o MD5 exato sobre a string CRLF isolada
  const hashVal = md5(hashContent);

  // 4. Substitui o placeholder e retorna
  return xmlString.replace('PLACEHOLDER_HASH', hashVal).trim();
}
