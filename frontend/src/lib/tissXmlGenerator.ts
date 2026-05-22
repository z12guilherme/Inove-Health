// ============================================================
// tissXmlGenerator.ts
// Gerador de XML TISS 4.01.00 — Padrão ANS
// ============================================================

// ── Interfaces ───────────────────────────────────────────────

export interface DadosPrestador {
  cnpj: string;
  cnes: string;
  nomeContratado: string;
}

export interface DadosConvenio {
  registroANS: string;
  nome: string;
  tissVersao: string;
}

export interface ProcedimentoXml {
  sequencialItem: number;
  dataExecucao: string;
  horaInicial?: string;
  horaFinal?: string;
  codigoTabela: string;
  codigoProcedimento: string;
  descricaoProcedimento: string;
  quantidadeExecutada: number;
  viaAcesso?: string;
  tecnicaUtilizada?: string;
  reducaoAcrescimo: string;
  valorUnitario: string;
  valorTotal: string;
}

export interface DespesaXml {
  sequencialItem: number;
  codigoDespesa: string; // 01=gases, 02=medicamentos, 03=materiais, 05=diarias, 07=taxas, 08=OPME
  dataExecucao: string;
  horaInicial: string;
  horaFinal: string;
  codigoTabela: string;
  codigoProcedimento: string;
  quantidadeExecutada: string;
  unidadeMedida: string;
  reducaoAcrescimo: string;
  valorUnitario: string;
  valorTotal: string;
  descricaoProcedimento: string;
}

export interface EquipeXml {
  grauPart: string;
  cpfContratado: string;
  nomeProf: string;
  conselho: string;
  numeroConselhoProfissional: string;
  uf: string;
  cbos: string;
}

export interface ValoresTotaisXml {
  valorProcedimentos: string;
  valorDiarias: string;
  valorTaxasAlugueis: string;
  valorMateriais: string;
  valorMedicamentos: string;
  valorOPME: string;
  valorGasesMedicinais: string;
  valorTotalGeral: string;
}

export interface GuiaConsultaXml {
  registroANS: string;
  numeroGuiaPrestador: string;
  numeroGuiaOperadora: string;
  numeroCarteira: string;
  atendimentoRN: string;
  codigoPrestadorNaOperadora: string;
  cnes: string;
  nomeProfissional: string;
  conselhoProfissional: string;
  numeroConselhoProfissional: string;
  uf: string;
  cbos: string;
  indicacaoAcidente: string;
  regimeAtendimento: string;
  dataAtendimento: string;
  tipoConsulta: string;
  codigoTabela: string;
  codigoProcedimento: string;
  valorProcedimento: string;
  observacao: string;
}

export interface GuiaSPSADTXml {
  registroANS: string;
  numeroGuiaPrestador: string;
  numeroGuiaOperadora: string;
  dataAutorizacao: string;
  senha?: string;
  numeroCarteira: string;
  atendimentoRN: string;
  cnpjContratadoSolicitante: string;
  nomeContratadoSolicitante: string;
  nomeProfissionalSolicitante: string;
  conselhoProfissionalSolicitante: string;
  numeroConselhoProfissionalSolicitante: string;
  ufSolicitante: string;
  cbosSolicitante: string;
  dataSolicitacao: string;
  caraterAtendimento: string;
  codigoPrestadorExecutante: string;
  cnes: string;
  tipoAtendimento: string;
  indicacaoAcidente: string;
  tipoConsulta?: string;
  regimeAtendimento: string;
  procedimentos: ProcedimentoXml[];
  despesas: DespesaXml[];
  valoresTotais: ValoresTotaisXml;
}

export interface GuiaInternacaoXml {
  registroANS: string;
  numeroGuiaPrestador: string;
  numeroGuiaSolicitacaoInternacao: string;
  numeroGuiaOperadora: string;
  dataAutorizacao: string;
  senha?: string;
  numeroCarteira: string;
  atendimentoRN: string;
  codigoPrestadorExecutante: string;
  cnes: string;
  caraterAtendimento: string;
  tipoFaturamento: string;
  dataInicioFaturamento: string;
  horaInicioFaturamento: string;
  dataFinalFaturamento: string;
  horaFinalFaturamento: string;
  tipoInternacao: string;
  regimeInternacao: string;
  diagnostico: string;
  indicadorAcidente: string;
  motivoEncerramento: string;
  procedimentos: ProcedimentoXml[];
  equipes: EquipeXml[];
  despesas: DespesaXml[];
  valoresTotais: ValoresTotaisXml;
}

export type TipoGuia = 'CONSULTA' | 'URGENCIA' | 'SADT' | 'INTERNAMENTO';

export interface RemessaConfig {
  prestador: DadosPrestador;
  convenio: DadosConvenio;
  tipoGuia: TipoGuia;
  numeroLote: number;
  guiasConsulta?: GuiaConsultaXml[];
  guiasSPSADT?: GuiaSPSADTXml[];
  guiasInternacao?: GuiaInternacaoXml[];
}

// ── Helpers ──────────────────────────────────────────────────

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getSequencial(): string {
  const KEY = 'inove_tiss_sequencial';
  let seq = parseInt(localStorage.getItem(KEY) || '13148', 10);
  seq++;
  localStorage.setItem(KEY, seq.toString());
  return seq.toString().padStart(12, '0');
}

function getNumeroLote(): number {
  const KEY = 'inove_tiss_lote_seq';
  let seq = parseInt(localStorage.getItem(KEY) || '7430', 10);
  seq++;
  localStorage.setItem(KEY, seq.toString());
  return seq;
}

function agora(): { data: string; hora: string } {
  const now = new Date();
  const data = now.toISOString().split('T')[0];
  const hora = now.toLocaleTimeString('pt-BR', { hour12: false });
  return { data, hora };
}

// ── MD5 Hash (simple implementation) ─────────────────────────

function md5(input: string): string {
  // Simplified MD5 for browser — generates a hex hash
  function safeAdd(x: number, y: number) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  function bitRotateLeft(num: number, cnt: number) {
    return (num << cnt) | (num >>> (32 - cnt));
  }
  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }
  function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  function binlMD5(x: number[], len: number): number[] {
    x[len >> 5] |= 0x80 << (len % 32);
    x[(((len + 64) >>> 9) << 4) + 14] = len;
    let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
    for (let i = 0; i < x.length; i += 16) {
      const olda = a, oldb = b, oldc = c, oldd = d;
      a = md5ff(a, b, c, d, x[i], 7, -680876936); d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
      c = md5ff(c, d, a, b, x[i + 2], 17, 606105819); b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
      a = md5ff(a, b, c, d, x[i + 4], 7, -176418897); d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
      c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341); b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
      a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416); d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
      c = md5ff(c, d, a, b, x[i + 10], 17, -42063); b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
      a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682); d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
      c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290); b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
      a = md5gg(a, b, c, d, x[i + 1], 5, -165796510); d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
      c = md5gg(c, d, a, b, x[i + 11], 14, 643717713); b = md5gg(b, c, d, a, x[i], 20, -373897302);
      a = md5gg(a, b, c, d, x[i + 5], 5, -701558691); d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
      c = md5gg(c, d, a, b, x[i + 15], 14, -660478335); b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
      a = md5gg(a, b, c, d, x[i + 9], 5, 568446438); d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
      c = md5gg(c, d, a, b, x[i + 3], 14, -187363961); b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
      a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467); d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
      c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473); b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
      a = md5hh(a, b, c, d, x[i + 5], 4, -378558); d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
      c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562); b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
      a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060); d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
      c = md5hh(c, d, a, b, x[i + 7], 16, -155497632); b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
      a = md5hh(a, b, c, d, x[i + 13], 4, 681279174); d = md5hh(d, a, b, c, x[i], 11, -358537222);
      c = md5hh(c, d, a, b, x[i + 3], 16, -722521979); b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
      a = md5hh(a, b, c, d, x[i + 9], 4, -640364487); d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
      c = md5hh(c, d, a, b, x[i + 15], 16, 530742520); b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
      a = md5ii(a, b, c, d, x[i], 6, -198630844); d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
      c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905); b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
      a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571); d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
      c = md5ii(c, d, a, b, x[i + 10], 15, -1051523); b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
      a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359); d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
      c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380); b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
      a = md5ii(a, b, c, d, x[i + 4], 6, -145523070); d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
      c = md5ii(c, d, a, b, x[i + 2], 15, 718787259); b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
      a = safeAdd(a, olda); b = safeAdd(b, oldb); c = safeAdd(c, oldc); d = safeAdd(d, oldd);
    }
    return [a, b, c, d];
  }
  function rstrMD5(s: string): string {
    const bin = binlMD5(rstr2binl(s), s.length * 8);
    let o = '';
    for (let i = 0; i < bin.length * 32; i += 8) {
      o += String.fromCharCode((bin[i >> 5] >>> (i % 32)) & 0xff);
    }
    return o;
  }
  function rstr2binl(input: string): number[] {
    const output: number[] = [];
    for (let i = 0; i < input.length * 8; i += 8) {
      output[i >> 5] |= (input.charCodeAt(i / 8) & 0xff) << (i % 32);
    }
    return output;
  }
  function rstr2hex(input: string): string {
    const hexTab = '0123456789abcdef';
    let o = '';
    for (let i = 0; i < input.length; i++) {
      const x = input.charCodeAt(i);
      o += hexTab.charAt((x >>> 4) & 0x0f) + hexTab.charAt(x & 0x0f);
    }
    return o;
  }
  return rstr2hex(rstrMD5(input));
}

// ── XML Builders ─────────────────────────────────────────────

function buildCabecalho(prestador: DadosPrestador, convenio: DadosConvenio): string {
  const { data, hora } = agora();
  const seq = getSequencial();
  return `  <ans:cabecalho>
    <ans:identificacaoTransacao>
  <ans:tipoTransacao>ENVIO_LOTE_GUIAS</ans:tipoTransacao>
  <ans:sequencialTransacao>${seq}</ans:sequencialTransacao>
  <ans:dataRegistroTransacao>${data}</ans:dataRegistroTransacao>
  <ans:horaRegistroTransacao>${hora}</ans:horaRegistroTransacao>
</ans:identificacaoTransacao>
    <ans:origem>
  <ans:identificacaoPrestador>
    <ans:codigoPrestadorNaOperadora>${esc(prestador.cnpj)}</ans:codigoPrestadorNaOperadora>
  </ans:identificacaoPrestador>
</ans:origem>
    <ans:destino>
      <ans:registroANS>${esc(convenio.registroANS)}</ans:registroANS>
    </ans:destino>
    <ans:Padrao>${esc(convenio.tissVersao)}</ans:Padrao>
  </ans:cabecalho>`;
}

function buildProcedimentoExecutado(proc: ProcedimentoXml): string {
  let xml = `  <ans:procedimentoExecutado>
  <ans:sequencialItem>${proc.sequencialItem}</ans:sequencialItem>
  <ans:dataExecucao>${proc.dataExecucao}</ans:dataExecucao>`;
  if (proc.horaInicial) xml += `\n  <ans:horaInicial>${proc.horaInicial}</ans:horaInicial>`;
  if (proc.horaFinal) xml += `\n  <ans:horaFinal>${proc.horaFinal}</ans:horaFinal>`;
  xml += `
  <ans:procedimento>
    <ans:codigoTabela>${proc.codigoTabela}</ans:codigoTabela>
    <ans:codigoProcedimento>${proc.codigoProcedimento}</ans:codigoProcedimento>
    <ans:descricaoProcedimento>${esc(proc.descricaoProcedimento)}</ans:descricaoProcedimento>
  </ans:procedimento>
  <ans:quantidadeExecutada>${proc.quantidadeExecutada}</ans:quantidadeExecutada>`;
  if (proc.viaAcesso) xml += `\n  <ans:viaAcesso>${proc.viaAcesso}</ans:viaAcesso>`;
  if (proc.tecnicaUtilizada) xml += `\n  <ans:tecnicaUtilizada>${proc.tecnicaUtilizada}</ans:tecnicaUtilizada>`;
  xml += `
  <ans:reducaoAcrescimo>${proc.reducaoAcrescimo}</ans:reducaoAcrescimo>
  <ans:valorUnitario>${proc.valorUnitario}</ans:valorUnitario>
  <ans:valorTotal>${proc.valorTotal}</ans:valorTotal>
</ans:procedimentoExecutado>`;
  return xml;
}

function buildProcedimentoExecutadoInternacao(proc: ProcedimentoXml, equipes: EquipeXml[]): string {
  let xml = `  <ans:procedimentoExecutado>
  <ans:sequencialItem>${proc.sequencialItem}</ans:sequencialItem>
  <ans:dataExecucao>${proc.dataExecucao}</ans:dataExecucao>
  <ans:procedimento>
    <ans:codigoTabela>${proc.codigoTabela}</ans:codigoTabela>
    <ans:codigoProcedimento>${proc.codigoProcedimento}</ans:codigoProcedimento>
    <ans:descricaoProcedimento>${esc(proc.descricaoProcedimento)}</ans:descricaoProcedimento>
  </ans:procedimento>
  <ans:quantidadeExecutada>${proc.quantidadeExecutada}</ans:quantidadeExecutada>`;
  if (proc.viaAcesso) xml += `\n  <ans:viaAcesso>${proc.viaAcesso}</ans:viaAcesso>`;
  if (proc.tecnicaUtilizada) xml += `\n  <ans:tecnicaUtilizada>${proc.tecnicaUtilizada}</ans:tecnicaUtilizada>`;
  xml += `
  <ans:reducaoAcrescimo>${proc.reducaoAcrescimo}</ans:reducaoAcrescimo>
  <ans:valorUnitario>${proc.valorUnitario}</ans:valorUnitario>
  <ans:valorTotal>${proc.valorTotal}</ans:valorTotal>`;
  // Equipe
  if (equipes.length > 0) {
    xml += `\n  <ans:identEquipe>`;
    for (const eq of equipes) {
      xml += `
    <ans:identificacaoEquipe>
      <ans:grauPart>${eq.grauPart}</ans:grauPart>
      <ans:codProfissional>
        <ans:cpfContratado>${eq.cpfContratado}</ans:cpfContratado>
      </ans:codProfissional>
      <ans:nomeProf>${esc(eq.nomeProf)}</ans:nomeProf>
      <ans:conselho>${eq.conselho}</ans:conselho>
      <ans:numeroConselhoProfissional>${eq.numeroConselhoProfissional}</ans:numeroConselhoProfissional>
      <ans:UF>${eq.uf}</ans:UF>
      <ans:CBOS>${eq.cbos}</ans:CBOS>
    </ans:identificacaoEquipe>`;
    }
    xml += `\n  </ans:identEquipe>`;
  }
  xml += `\n</ans:procedimentoExecutado>`;
  return xml;
}

function buildDespesa(d: DespesaXml): string {
  return `  <ans:despesa>
    <ans:sequencialItem>${d.sequencialItem}</ans:sequencialItem>
    <ans:codigoDespesa>${d.codigoDespesa}</ans:codigoDespesa>
    <ans:servicosExecutados>
      <ans:dataExecucao>${d.dataExecucao}</ans:dataExecucao>
      <ans:horaInicial>${d.horaInicial}</ans:horaInicial>
      <ans:horaFinal>${d.horaFinal}</ans:horaFinal>
      <ans:codigoTabela>${d.codigoTabela}</ans:codigoTabela>
      <ans:codigoProcedimento>${d.codigoProcedimento}</ans:codigoProcedimento>
      <ans:quantidadeExecutada>${d.quantidadeExecutada}</ans:quantidadeExecutada>
      <ans:unidadeMedida>${d.unidadeMedida}</ans:unidadeMedida>
      <ans:reducaoAcrescimo>${d.reducaoAcrescimo}</ans:reducaoAcrescimo>
      <ans:valorUnitario>${d.valorUnitario}</ans:valorUnitario>
      <ans:valorTotal>${d.valorTotal}</ans:valorTotal>
      <ans:descricaoProcedimento>${esc(d.descricaoProcedimento)}</ans:descricaoProcedimento>
    </ans:servicosExecutados>
  </ans:despesa>`;
}

function buildValorTotal(vt: ValoresTotaisXml): string {
  return `  <ans:valorProcedimentos>${vt.valorProcedimentos}</ans:valorProcedimentos>
  <ans:valorDiarias>${vt.valorDiarias}</ans:valorDiarias>
  <ans:valorTaxasAlugueis>${vt.valorTaxasAlugueis}</ans:valorTaxasAlugueis>
  <ans:valorMateriais>${vt.valorMateriais}</ans:valorMateriais>
  <ans:valorMedicamentos>${vt.valorMedicamentos}</ans:valorMedicamentos>
  <ans:valorOPME>${vt.valorOPME}</ans:valorOPME>
  <ans:valorGasesMedicinais>${vt.valorGasesMedicinais}</ans:valorGasesMedicinais>
  <ans:valorTotalGeral>${vt.valorTotalGeral}</ans:valorTotalGeral>`;
}

// ── Guia Consulta ────────────────────────────────────────────

function buildGuiaConsulta(g: GuiaConsultaXml): string {
  return `        <ans:guiaConsulta>
          <ans:cabecalhoConsulta>
            <ans:registroANS>${g.registroANS}</ans:registroANS>
            <ans:numeroGuiaPrestador>${g.numeroGuiaPrestador}</ans:numeroGuiaPrestador>
          </ans:cabecalhoConsulta>
          <ans:numeroGuiaOperadora>${g.numeroGuiaOperadora}</ans:numeroGuiaOperadora>
          <ans:dadosBeneficiario>
  <ans:numeroCarteira>${g.numeroCarteira}</ans:numeroCarteira>
  <ans:atendimentoRN>${g.atendimentoRN}</ans:atendimentoRN>
</ans:dadosBeneficiario>
          <ans:contratadoExecutante>
  <ans:codigoPrestadorNaOperadora>${g.codigoPrestadorNaOperadora}</ans:codigoPrestadorNaOperadora>
  <ans:CNES>${g.cnes}</ans:CNES>
</ans:contratadoExecutante>
          <ans:profissionalExecutante>
  <ans:nomeProfissional>${esc(g.nomeProfissional)}</ans:nomeProfissional>
  <ans:conselhoProfissional>${g.conselhoProfissional}</ans:conselhoProfissional>
  <ans:numeroConselhoProfissional>${g.numeroConselhoProfissional}</ans:numeroConselhoProfissional>
  <ans:UF>${g.uf}</ans:UF>
  <ans:CBOS>${g.cbos}</ans:CBOS>
</ans:profissionalExecutante>
          <ans:indicacaoAcidente>${g.indicacaoAcidente}</ans:indicacaoAcidente>
          <ans:dadosAtendimento>
            <ans:regimeAtendimento>${g.regimeAtendimento}</ans:regimeAtendimento>
            <ans:dataAtendimento>${g.dataAtendimento}</ans:dataAtendimento>
            <ans:tipoConsulta>${g.tipoConsulta}</ans:tipoConsulta>
            <ans:procedimento>
              <ans:codigoTabela>${g.codigoTabela}</ans:codigoTabela>
              <ans:codigoProcedimento>${g.codigoProcedimento}</ans:codigoProcedimento>
              <ans:valorProcedimento>${g.valorProcedimento}</ans:valorProcedimento>
            </ans:procedimento>
          </ans:dadosAtendimento>
          <ans:observacao>${esc(g.observacao)}</ans:observacao>
        </ans:guiaConsulta>`;
}

// ── Guia SP-SADT ─────────────────────────────────────────────

function buildGuiaSPSADT(g: GuiaSPSADTXml): string {
  let procsXml = '';
  for (const p of g.procedimentos) {
    procsXml += '\n' + buildProcedimentoExecutado(p);
  }

  let despesasXml = '';
  if (g.despesas.length > 0) {
    despesasXml = `\n          <ans:outrasDespesas>\n`;
    for (const d of g.despesas) {
      despesasXml += buildDespesa(d) + '\n';
    }
    despesasXml += `</ans:outrasDespesas>`;
  }

  let senhaXml = '';
  if (g.senha) {
    senhaXml = `\n  <ans:senha>${g.senha}</ans:senha>`;
  }

  let tipoConsultaXml = '';
  if (g.tipoConsulta) {
    tipoConsultaXml = `\n            <ans:tipoConsulta>${g.tipoConsulta}</ans:tipoConsulta>`;
  }

  return `        <ans:guiaSP-SADT>
          <ans:cabecalhoGuia>
            <ans:registroANS>${g.registroANS}</ans:registroANS>
            <ans:numeroGuiaPrestador>${g.numeroGuiaPrestador}</ans:numeroGuiaPrestador>
          </ans:cabecalhoGuia>
          <ans:dadosAutorizacao>
  <ans:numeroGuiaOperadora>${g.numeroGuiaOperadora}</ans:numeroGuiaOperadora>
  <ans:dataAutorizacao>${g.dataAutorizacao}</ans:dataAutorizacao>${senhaXml}
</ans:dadosAutorizacao>
          <ans:dadosBeneficiario>
  <ans:numeroCarteira>${g.numeroCarteira}</ans:numeroCarteira>
  <ans:atendimentoRN>${g.atendimentoRN}</ans:atendimentoRN>
</ans:dadosBeneficiario>
          <ans:dadosSolicitante>
  <ans:contratadoSolicitante>
  <ans:cnpjContratado>${g.cnpjContratadoSolicitante}</ans:cnpjContratado>
</ans:contratadoSolicitante>
  <ans:nomeContratadoSolicitante>${esc(g.nomeContratadoSolicitante)}</ans:nomeContratadoSolicitante>
  <ans:profissionalSolicitante>
  <ans:nomeProfissional>${esc(g.nomeProfissionalSolicitante)}</ans:nomeProfissional>
  <ans:conselhoProfissional>${g.conselhoProfissionalSolicitante}</ans:conselhoProfissional>
  <ans:numeroConselhoProfissional>${g.numeroConselhoProfissionalSolicitante}</ans:numeroConselhoProfissional>
  <ans:UF>${g.ufSolicitante}</ans:UF>
  <ans:CBOS>${g.cbosSolicitante}</ans:CBOS>
</ans:profissionalSolicitante>
</ans:dadosSolicitante>
          <ans:dadosSolicitacao>
            <ans:dataSolicitacao>${g.dataSolicitacao}</ans:dataSolicitacao>
            <ans:caraterAtendimento>${g.caraterAtendimento}</ans:caraterAtendimento>
          </ans:dadosSolicitacao>
          <ans:dadosExecutante>
            <ans:contratadoExecutante>
  <ans:codigoPrestadorNaOperadora>${g.codigoPrestadorExecutante}</ans:codigoPrestadorNaOperadora>
</ans:contratadoExecutante>
            <ans:CNES>${g.cnes}</ans:CNES>
          </ans:dadosExecutante>
          <ans:dadosAtendimento>
            <ans:tipoAtendimento>${g.tipoAtendimento}</ans:tipoAtendimento>
            <ans:indicacaoAcidente>${g.indicacaoAcidente}</ans:indicacaoAcidente>${tipoConsultaXml}
            <ans:regimeAtendimento>${g.regimeAtendimento}</ans:regimeAtendimento>
          </ans:dadosAtendimento>
          <ans:procedimentosExecutados>${procsXml}
</ans:procedimentosExecutados>${despesasXml}
          <ans:valorTotal>
${buildValorTotal(g.valoresTotais)}
</ans:valorTotal>
        </ans:guiaSP-SADT>`;
}

// ── Guia Resumo Internação ───────────────────────────────────

function buildGuiaResumoInternacao(g: GuiaInternacaoXml): string {
  let procsXml = '';
  for (const p of g.procedimentos) {
    procsXml += '\n' + buildProcedimentoExecutadoInternacao(p, g.equipes);
  }

  let despesasXml = '';
  if (g.despesas.length > 0) {
    despesasXml = `\n          <ans:outrasDespesas>\n`;
    for (const d of g.despesas) {
      despesasXml += buildDespesa(d) + '\n';
    }
    despesasXml += `</ans:outrasDespesas>`;
  }

  let senhaXml = '';
  if (g.senha) {
    senhaXml = `\n  <ans:senha>${g.senha}</ans:senha>`;
  }

  return `        <ans:guiaResumoInternacao>
          <ans:cabecalhoGuia>
            <ans:registroANS>${g.registroANS}</ans:registroANS>
            <ans:numeroGuiaPrestador>${g.numeroGuiaPrestador}</ans:numeroGuiaPrestador>
          </ans:cabecalhoGuia>
          <ans:numeroGuiaSolicitacaoInternacao>${g.numeroGuiaSolicitacaoInternacao}</ans:numeroGuiaSolicitacaoInternacao>
          <ans:dadosAutorizacao>
  <ans:numeroGuiaOperadora>${g.numeroGuiaOperadora}</ans:numeroGuiaOperadora>
  <ans:dataAutorizacao>${g.dataAutorizacao}</ans:dataAutorizacao>${senhaXml}
</ans:dadosAutorizacao>
          <ans:dadosBeneficiario>
  <ans:numeroCarteira>${g.numeroCarteira}</ans:numeroCarteira>
  <ans:atendimentoRN>${g.atendimentoRN}</ans:atendimentoRN>
</ans:dadosBeneficiario>
          <ans:dadosExecutante>
            <ans:contratadoExecutante>
  <ans:codigoPrestadorNaOperadora>${g.codigoPrestadorExecutante}</ans:codigoPrestadorNaOperadora>
</ans:contratadoExecutante>
            <ans:CNES>${g.cnes}</ans:CNES>
          </ans:dadosExecutante>
          <ans:dadosInternacao>
            <ans:caraterAtendimento>${g.caraterAtendimento}</ans:caraterAtendimento>
            <ans:tipoFaturamento>${g.tipoFaturamento}</ans:tipoFaturamento>
            <ans:dataInicioFaturamento>${g.dataInicioFaturamento}</ans:dataInicioFaturamento>
            <ans:horaInicioFaturamento>${g.horaInicioFaturamento}</ans:horaInicioFaturamento>
            <ans:dataFinalFaturamento>${g.dataFinalFaturamento}</ans:dataFinalFaturamento>
            <ans:horaFinalFaturamento>${g.horaFinalFaturamento}</ans:horaFinalFaturamento>
            <ans:tipoInternacao>${g.tipoInternacao}</ans:tipoInternacao>
            <ans:regimeInternacao>${g.regimeInternacao}</ans:regimeInternacao>
          </ans:dadosInternacao>
          <ans:dadosSaidaInternacao>
            <ans:diagnostico>${g.diagnostico}</ans:diagnostico>
            <ans:indicadorAcidente>${g.indicadorAcidente}</ans:indicadorAcidente>
            <ans:motivoEncerramento>${g.motivoEncerramento}</ans:motivoEncerramento>
          </ans:dadosSaidaInternacao>
          <ans:procedimentosExecutados>${procsXml}
</ans:procedimentosExecutados>
          <ans:valorTotal>
${buildValorTotal(g.valoresTotais)}
</ans:valorTotal>${despesasXml}
        </ans:guiaResumoInternacao>`;
}

// ── Função Principal ─────────────────────────────────────────

export function gerarXmlTiss(config: RemessaConfig): { xml: string; hash: string; numeroLote: number } {
  const numeroLote = config.numeroLote || getNumeroLote();

  // Monta as guias
  let guiasXml = '';
  if (config.tipoGuia === 'CONSULTA' && config.guiasConsulta) {
    for (const g of config.guiasConsulta) {
      guiasXml += '\n' + buildGuiaConsulta(g);
    }
  } else if ((config.tipoGuia === 'URGENCIA' || config.tipoGuia === 'SADT') && config.guiasSPSADT) {
    for (const g of config.guiasSPSADT) {
      guiasXml += '\n' + buildGuiaSPSADT(g);
    }
  } else if (config.tipoGuia === 'INTERNAMENTO' && config.guiasInternacao) {
    for (const g of config.guiasInternacao) {
      guiasXml += '\n' + buildGuiaResumoInternacao(g);
    }
  }

  const cabecalho = buildCabecalho(config.prestador, config.convenio);

  const corpo = `${cabecalho}
  <ans:prestadorParaOperadora>
    <ans:loteGuias>
      <ans:numeroLote>${numeroLote}</ans:numeroLote>
      <ans:guiasTISS>${guiasXml}
      </ans:guiasTISS>
    </ans:loteGuias>
  </ans:prestadorParaOperadora>`;

  const hash = md5(corpo);

  const xml = `<?xml version="1.0" encoding="ISO-8859-1"?>
<ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas">
${corpo}
  <ans:epilogo>
    <ans:hash>${hash}</ans:hash>
  </ans:epilogo>
</ans:mensagemTISS>`;

  return { xml, hash, numeroLote };
}

// ── Helpers para montar dados a partir dos atendimentos ──────

export function calcularValoresTotais(
  procedimentos: ProcedimentoXml[],
  despesas: DespesaXml[]
): ValoresTotaisXml {
  const valorProcedimentos = procedimentos.reduce((s, p) => s + parseFloat(p.valorTotal), 0);
  let valorDiarias = 0, valorTaxas = 0, valorMateriais = 0, valorMedicamentos = 0, valorOPME = 0, valorGases = 0;

  for (const d of despesas) {
    const v = parseFloat(d.valorTotal);
    switch (d.codigoDespesa) {
      case '01': valorGases += v; break;
      case '02': valorMedicamentos += v; break;
      case '03': valorMateriais += v; break;
      case '05': valorDiarias += v; break;
      case '07': valorTaxas += v; break;
      case '08': valorOPME += v; break;
    }
  }

  const total = valorProcedimentos + valorDiarias + valorTaxas + valorMateriais + valorMedicamentos + valorOPME + valorGases;

  return {
    valorProcedimentos: valorProcedimentos.toFixed(2),
    valorDiarias: valorDiarias.toFixed(2),
    valorTaxasAlugueis: valorTaxas.toFixed(2),
    valorMateriais: valorMateriais.toFixed(2),
    valorMedicamentos: valorMedicamentos.toFixed(2),
    valorOPME: valorOPME.toFixed(2),
    valorGasesMedicinais: valorGases.toFixed(2),
    valorTotalGeral: total.toFixed(2),
  };
}

export function gerarNumeroGuia(): string {
  const KEY = 'inove_guia_seq';
  let seq = parseInt(localStorage.getItem(KEY) || '283000000', 10);
  seq++;
  localStorage.setItem(KEY, seq.toString());
  return seq.toString();
}
