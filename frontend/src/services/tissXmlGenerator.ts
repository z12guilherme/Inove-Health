import { LoteTiss } from './localStorageService';

// Interfaces for generating TISS 4.01.00 XML
interface AtendimentoData {
    id: string;
    numero_guia?: string;
    data: string;
    paciente_nome: string;
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

    const buildGuiaConsulta = (atd: AtendimentoData) => {
        const procValor = atd.valor_total || (atd.procedimentos?.[0]?.valor || 0);
        const procNome = atd.procedimentos?.[0]?.nome || 'CONSULTA MEDICA';
        const procCodigo = atd.procedimentos?.[0]?.codigo || '10101012';

        return `
        <ans:guiaConsulta>
          <ans:cabecalhoConsulta>
            <ans:registroANS>368253</ans:registroANS>
            <ans:numeroGuiaPrestador>${atd.numero_guia || atd.id}</ans:numeroGuiaPrestador>
          </ans:cabecalhoConsulta>
          <ans:numeroGuiaOperadora>${atd.numero_guia || atd.id}</ans:numeroGuiaOperadora>
          <ans:dadosBeneficiario>
            <ans:numeroCarteira>04HFC000000000</ans:numeroCarteira>
            <ans:atendimentoRN>N</ans:atendimentoRN>
            <ans:nomeBeneficiario>${atd.paciente_nome}</ans:nomeBeneficiario>
          </ans:dadosBeneficiario>
          <ans:dadosAtendimento>
            <ans:tipoConsulta>1</ans:tipoConsulta>
            <ans:procedimento>
              <ans:codigoTabela>22</ans:codigoTabela>
              <ans:codigoProcedimento>${procCodigo}</ans:codigoProcedimento>
              <ans:descricaoProcedimento>${procNome}</ans:descricaoProcedimento>
              <ans:valorProcedimento>${procValor.toFixed(2)}</ans:valorProcedimento>
            </ans:procedimento>
          </ans:dadosAtendimento>
        </ans:guiaConsulta>
`;
    };

    const buildGuiaSadt = (atd: AtendimentoData) => {
        let procedimentosXml = '';
        if (atd.procedimentos && atd.procedimentos.length > 0) {
            procedimentosXml = atd.procedimentos.map((p, i) => `
              <ans:procedimentoExecutado>
                <ans:sequencialItem>${i + 1}</ans:sequencialItem>
                <ans:dataExecucao>${atd.data}</ans:dataExecucao>
                <ans:procedimento>
                  <ans:codigoTabela>22</ans:codigoTabela>
                  <ans:codigoProcedimento>${p.codigo}</ans:codigoProcedimento>
                  <ans:descricaoProcedimento>${p.nome}</ans:descricaoProcedimento>
                </ans:procedimento>
                <ans:quantidadeExecutada>${p.qtd || 1}</ans:quantidadeExecutada>
                <ans:valorUnitario>${p.valor.toFixed(2)}</ans:valorUnitario>
                <ans:valorTotal>${(p.valor * (p.qtd || 1)).toFixed(2)}</ans:valorTotal>
              </ans:procedimentoExecutado>
            `).join('');
        }

        return `
        <ans:guiaSP-SADT>
          <ans:cabecalhoGuia>
            <ans:registroANS>368253</ans:registroANS>
            <ans:numeroGuiaPrestador>${atd.numero_guia || atd.id}</ans:numeroGuiaPrestador>
          </ans:cabecalhoGuia>
          <ans:dadosAutorizacao>
            <ans:numeroGuiaOperadora>${atd.numero_guia || atd.id}</ans:numeroGuiaOperadora>
            <ans:senha>${atd.senha_autorizacao || ''}</ans:senha>
          </ans:dadosAutorizacao>
          <ans:dadosBeneficiario>
            <ans:numeroCarteira>04HFC000000000</ans:numeroCarteira>
            <ans:atendimentoRN>N</ans:atendimentoRN>
            <ans:nomeBeneficiario>${atd.paciente_nome}</ans:nomeBeneficiario>
          </ans:dadosBeneficiario>
          <ans:procedimentosRealizados>
            ${procedimentosXml}
          </ans:procedimentosRealizados>
          <ans:valorTotal>
             <ans:valorProcedimentos>${(atd.valor_total || 0).toFixed(2)}</ans:valorProcedimentos>
             <ans:valorTotalGeral>${(atd.valor_total || 0).toFixed(2)}</ans:valorTotalGeral>
          </ans:valorTotal>
        </ans:guiaSP-SADT>
`;
    };

    const guiasXml = atendimentos.map(atd => {
        if (isSadt) return buildGuiaSadt(atd);
        if (isInternamento) return buildGuiaSadt(atd); // Fallback to SADT format for simplicity in this mock unless internamento is specifically implemented
        return buildGuiaConsulta(atd);
    }).join('\n');

    const xmlString = `<?xml version="1.0" encoding="ISO-8859-1"?>
<ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas">
  <ans:cabecalho>
    <ans:identificacaoTransacao>
      <ans:tipoTransacao>ENVIO_LOTE_GUIAS</ans:tipoTransacao>
      <ans:sequencialTransacao>${lote.numero_lote}</ans:sequencialTransacao>
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
      <ans:guiasTISS>
        ${guiasXml}
      </ans:guiasTISS>
    </ans:loteGuias>
  </ans:prestadorParaOperadora>
  <ans:epilogo>
    <ans:hash>A34B2299C988D</ans:hash>
  </ans:epilogo>
</ans:mensagemTISS>
`;

    return xmlString.trim();
}
