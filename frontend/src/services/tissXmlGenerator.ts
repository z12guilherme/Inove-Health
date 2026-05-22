import type { LoteTiss } from './localStorageService';

// Interfaces for generating TISS 4.01.00 XML
interface AtendimentoData {
  id: string;
  numero_guia?: string;
  data: string;
  paciente_nome: string;
  tipo?: string; // CONSULTA, SADT, INTERNAMENTO, URGENCIA
  procedimentos?: Array<{
    codigo: string;
    nome: string;
    valor: number;
    qtd: number;
  }>;
  valor_total?: number;
  senha_autorizacao?: string;
}

export function generateTissXml(lote: LoteTiss, atendimentos: AtendimentoData[]): string {
  const dataRegistro = new Date().toISOString().split('T')[0];
  const horaRegistro = new Date().toISOString().split('T')[1].substring(0, 8);

  const isSadt = lote.tipo_guia === 'SADT' || lote.tipo_guia === 'EXAME';
  const isInternamento = lote.tipo_guia === 'INTERNAMENTO';
  const isUrgencia = lote.tipo_guia === 'URGENCIA';

  const buildGuiaConsulta = (atd: AtendimentoData) => {
    const procValor = atd.valor_total || (atd.procedimentos?.[0]?.valor || 120.0);
    const procCodigo = atd.procedimentos?.[0]?.codigo || '10101012';

    return `
        <ans:guiaConsulta>
          <ans:cabecalhoConsulta>
            <ans:registroANS>368253</ans:registroANS>
            <ans:numeroGuiaPrestador>${atd.numero_guia || atd.id}</ans:numeroGuiaPrestador>
          </ans:cabecalhoConsulta>
          <ans:numeroGuiaOperadora>${atd.numero_guia || atd.id}</ans:numeroGuiaOperadora>
          <ans:dadosBeneficiario>
            <ans:numeroCarteira>04HFC000666009</ans:numeroCarteira>
            <ans:atendimentoRN>N</ans:atendimentoRN>
          </ans:dadosBeneficiario>
          <ans:contratadoExecutante>
            <ans:codigoPrestadorNaOperadora>04232442000114</ans:codigoPrestadorNaOperadora>
            <ans:CNES>6931561</ans:CNES>
          </ans:contratadoExecutante>
          <ans:profissionalExecutante>
            <ans:nomeProfissional>VALDEMILSON ALVES</ans:nomeProfissional>
            <ans:conselhoProfissional>06</ans:conselhoProfissional>
            <ans:numeroConselhoProfissional>8696</ans:numeroConselhoProfissional>
            <ans:UF>26</ans:UF>
            <ans:CBOS>225250</ans:CBOS>
          </ans:profissionalExecutante>
          <ans:indicacaoAcidente>9</ans:indicacaoAcidente>
          <ans:dadosAtendimento>
            <ans:regimeAtendimento>01</ans:regimeAtendimento>
            <ans:dataAtendimento>${atd.data}</ans:dataAtendimento>
            <ans:tipoConsulta>1</ans:tipoConsulta>
            <ans:procedimento>
              <ans:codigoTabela>${atd.procedimentos?.[0]?.codigo_tabela || '22'}</ans:codigoTabela>
              <ans:codigoProcedimento>${procCodigo}</ans:codigoProcedimento>
              <ans:valorProcedimento>${procValor.toFixed(2)}</ans:valorProcedimento>
            </ans:procedimento>
          </ans:dadosAtendimento>
          <ans:observacao>Nenhuma Observacao</ans:observacao>
        </ans:guiaConsulta>`;
  };

  const buildGuiaSadt = (atd: AtendimentoData, urgencia: boolean = false) => {
    let procedimentosXml = '';
    if (atd.procedimentos && atd.procedimentos.length > 0) {
      procedimentosXml = atd.procedimentos.map((p, i) => `
              <ans:procedimentoExecutado>
                <ans:sequencialItem>${i + 1}</ans:sequencialItem>
                <ans:dataExecucao>${atd.data}</ans:dataExecucao>
                <ans:procedimento>
                  <ans:codigoTabela>${p.codigo_tabela || '22'}</ans:codigoTabela>
                  <ans:codigoProcedimento>${p.codigo}</ans:codigoProcedimento>
                  <ans:descricaoProcedimento>${p.nome}</ans:descricaoProcedimento>
                </ans:procedimento>
                <ans:quantidadeExecutada>${p.qtd || 1}</ans:quantidadeExecutada>
                <ans:viaAcesso>1</ans:viaAcesso>
                <ans:reducaoAcrescimo>1.00</ans:reducaoAcrescimo>
                <ans:valorUnitario>${p.valor.toFixed(2)}</ans:valorUnitario>
                <ans:valorTotal>${(p.valor * (p.qtd || 1)).toFixed(2)}</ans:valorTotal>
              </ans:procedimentoExecutado>`).join('');
    }

    const tipoAtendimento = urgencia ? '04' : '23';
    const caraterAtendimento = urgencia ? '2' : '1';

    return `
        <ans:guiaSP-SADT>
          <ans:cabecalhoGuia>
            <ans:registroANS>368253</ans:registroANS>
            <ans:numeroGuiaPrestador>${atd.numero_guia || atd.id}</ans:numeroGuiaPrestador>
          </ans:cabecalhoGuia>
          <ans:dadosAutorizacao>
            <ans:numeroGuiaOperadora>${atd.numero_guia || atd.id}</ans:numeroGuiaOperadora>
            <ans:dataAutorizacao>${atd.data}</ans:dataAutorizacao>
            <ans:senha>${atd.senha_autorizacao || 'AB6865672'}</ans:senha>
          </ans:dadosAutorizacao>
          <ans:dadosBeneficiario>
            <ans:numeroCarteira>0DVNF000203009</ans:numeroCarteira>
            <ans:atendimentoRN>N</ans:atendimentoRN>
          </ans:dadosBeneficiario>
          <ans:dadosSolicitante>
            <ans:contratadoSolicitante>
              <ans:cnpjContratado>04232442000114</ans:cnpjContratado>
            </ans:contratadoSolicitante>
            <ans:nomeContratadoSolicitante>HOSPITAL CONSULT IMAGEM E DIAGNOSTICO LTDA</ans:nomeContratadoSolicitante>
            <ans:profissionalSolicitante>
              <ans:nomeProfissional>ANDRÉ DE BARROS ARAÚJO</ans:nomeProfissional>
              <ans:conselhoProfissional>06</ans:conselhoProfissional>
              <ans:numeroConselhoProfissional>40609</ans:numeroConselhoProfissional>
              <ans:UF>26</ans:UF>
              <ans:CBOS>225125</ans:CBOS>
            </ans:profissionalSolicitante>
          </ans:dadosSolicitante>
          <ans:dadosSolicitacao>
            <ans:dataSolicitacao>${atd.data}</ans:dataSolicitacao>
            <ans:caraterAtendimento>${caraterAtendimento}</ans:caraterAtendimento>
          </ans:dadosSolicitacao>
          <ans:dadosExecutante>
            <ans:contratadoExecutante>
              <ans:codigoPrestadorNaOperadora>04232442000114</ans:codigoPrestadorNaOperadora>
            </ans:contratadoExecutante>
            <ans:CNES>6931561</ans:CNES>
          </ans:dadosExecutante>
          <ans:dadosAtendimento>
            <ans:tipoAtendimento>${tipoAtendimento}</ans:tipoAtendimento>
            <ans:indicacaoAcidente>9</ans:indicacaoAcidente>
            ${urgencia ? '<ans:tipoConsulta>1</ans:tipoConsulta>\n            <ans:regimeAtendimento>04</ans:regimeAtendimento>' : '<ans:regimeAtendimento>01</ans:regimeAtendimento>'}
          </ans:dadosAtendimento>
          <ans:procedimentosExecutados>${procedimentosXml}
          </ans:procedimentosExecutados>
          <ans:valorTotal>
            <ans:valorProcedimentos>${(atd.valor_total || 0).toFixed(2)}</ans:valorProcedimentos>
            <ans:valorDiarias>0.00</ans:valorDiarias>
            <ans:valorTaxasAlugueis>0.00</ans:valorTaxasAlugueis>
            <ans:valorMateriais>0.00</ans:valorMateriais>
            <ans:valorMedicamentos>0.00</ans:valorMedicamentos>
            <ans:valorOPME>0.00</ans:valorOPME>
            <ans:valorGasesMedicinais>0.00</ans:valorGasesMedicinais>
            <ans:valorTotalGeral>${(atd.valor_total || 0).toFixed(2)}</ans:valorTotalGeral>
          </ans:valorTotal>
        </ans:guiaSP-SADT>`;
  };

  const buildGuiaInternacao = (atd: AtendimentoData) => {
    let procedimentosXml = '';
    if (atd.procedimentos && atd.procedimentos.length > 0) {
      procedimentosXml = atd.procedimentos.map((p, i) => `
              <ans:procedimentoExecutado>
                <ans:sequencialItem>${i + 1}</ans:sequencialItem>
                <ans:dataExecucao>${atd.data}</ans:dataExecucao>
                <ans:procedimento>
                  <ans:codigoTabela>${p.codigo_tabela || '22'}</ans:codigoTabela>
                  <ans:codigoProcedimento>${p.codigo}</ans:codigoProcedimento>
                  <ans:descricaoProcedimento>${p.nome}</ans:descricaoProcedimento>
                </ans:procedimento>
                <ans:quantidadeExecutada>${p.qtd || 1}</ans:quantidadeExecutada>
                <ans:viaAcesso>1</ans:viaAcesso>
                <ans:tecnicaUtilizada>1</ans:tecnicaUtilizada>
                <ans:reducaoAcrescimo>1.00</ans:reducaoAcrescimo>
                <ans:valorUnitario>${p.valor.toFixed(2)}</ans:valorUnitario>
                <ans:valorTotal>${(p.valor * (p.qtd || 1)).toFixed(2)}</ans:valorTotal>
                <ans:identEquipe>
                  <ans:identificacaoEquipe>
                    <ans:grauPart>00</ans:grauPart>
                    <ans:codProfissional>
                      <ans:cpfContratado>83365982272</ans:cpfContratado>
                    </ans:codProfissional>
                    <ans:nomeProf>VALDEMILSON ALVES</ans:nomeProf>
                    <ans:conselho>06</ans:conselho>
                    <ans:numeroConselhoProfissional>8696</ans:numeroConselhoProfissional>
                    <ans:UF>26</ans:UF>
                    <ans:CBOS>225250</ans:CBOS>
                  </ans:identificacaoEquipe>
                </ans:identEquipe>
              </ans:procedimentoExecutado>`).join('');
    }

    return `
        <ans:guiaResumoInternacao>
          <ans:cabecalhoGuia>
            <ans:registroANS>368253</ans:registroANS>
            <ans:numeroGuiaPrestador>${atd.numero_guia || atd.id}</ans:numeroGuiaPrestador>
          </ans:cabecalhoGuia>
          <ans:numeroGuiaSolicitacaoInternacao>${atd.numero_guia || atd.id}</ans:numeroGuiaSolicitacaoInternacao>
          <ans:dadosAutorizacao>
            <ans:numeroGuiaOperadora>${atd.numero_guia || atd.id}</ans:numeroGuiaOperadora>
            <ans:dataAutorizacao>${atd.data}</ans:dataAutorizacao>
            <ans:senha>${atd.senha_autorizacao || 'Y67593612'}</ans:senha>
          </ans:dadosAutorizacao>
          <ans:dadosBeneficiario>
            <ans:numeroCarteira>B4177003737004</ans:numeroCarteira>
            <ans:atendimentoRN>N</ans:atendimentoRN>
          </ans:dadosBeneficiario>
          <ans:dadosExecutante>
            <ans:contratadoExecutante>
              <ans:codigoPrestadorNaOperadora>04232442000114</ans:codigoPrestadorNaOperadora>
            </ans:contratadoExecutante>
            <ans:CNES>6931561</ans:CNES>
          </ans:dadosExecutante>
          <ans:dadosInternacao>
            <ans:caraterAtendimento>1</ans:caraterAtendimento>
            <ans:tipoFaturamento>4</ans:tipoFaturamento>
            <ans:dataInicioFaturamento>${atd.data}</ans:dataInicioFaturamento>
            <ans:horaInicioFaturamento>08:28:00</ans:horaInicioFaturamento>
            <ans:dataFinalFaturamento>${atd.data}</ans:dataFinalFaturamento>
            <ans:horaFinalFaturamento>14:00:00</ans:horaFinalFaturamento>
            <ans:tipoInternacao>2</ans:tipoInternacao>
            <ans:regimeInternacao>1</ans:regimeInternacao>
          </ans:dadosInternacao>
          <ans:dadosSaidaInternacao>
            <ans:diagnostico>W999</ans:diagnostico>
            <ans:indicadorAcidente>2</ans:indicadorAcidente>
            <ans:motivoEncerramento>11</ans:motivoEncerramento>
          </ans:dadosSaidaInternacao>
          <ans:procedimentosExecutados>${procedimentosXml}
          </ans:procedimentosExecutados>
          <ans:valorTotal>
            <ans:valorProcedimentos>${(atd.valor_total || 0).toFixed(2)}</ans:valorProcedimentos>
            <ans:valorDiarias>0.00</ans:valorDiarias>
            <ans:valorTaxasAlugueis>0.00</ans:valorTaxasAlugueis>
            <ans:valorMateriais>0.00</ans:valorMateriais>
            <ans:valorMedicamentos>0.00</ans:valorMedicamentos>
            <ans:valorOPME>0.00</ans:valorOPME>
            <ans:valorGasesMedicinais>0.00</ans:valorGasesMedicinais>
            <ans:valorTotalGeral>${(atd.valor_total || 0).toFixed(2)}</ans:valorTotalGeral>
          </ans:valorTotal>
        </ans:guiaResumoInternacao>`;
  };

  const guiasXml = atendimentos.map(atd => {
    if (isInternamento || atd.tipo === 'INTERNAMENTO') return buildGuiaInternacao(atd);
    if (isUrgencia || atd.tipo === 'URGENCIA') return buildGuiaSadt(atd, true);
    if (isSadt || atd.tipo === 'SADT' || atd.tipo === 'EXAME') return buildGuiaSadt(atd, false);
    return buildGuiaConsulta(atd);
  }).join('\n');

  const xmlString = `<?xml version="1.0" encoding="ISO-8859-1"?>
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
  <ans:prestadorParaOperadora>
    <ans:loteGuias>
      <ans:numeroLote>${lote.numero_lote}</ans:numeroLote>
      <ans:guiasTISS>${guiasXml}
      </ans:guiasTISS>
    </ans:loteGuias>
  </ans:prestadorParaOperadora>
  <ans:epilogo>
    <ans:hash>A34B2299C988D</ans:hash>
  </ans:epilogo>
</ans:mensagemTISS>`;

  return xmlString.trim();
}
