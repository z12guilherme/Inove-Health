import axios from 'axios';
import toast from 'react-hot-toast';

// Configurações do Supabase extraídas do ambiente
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const api = axios.create({
  // Se houver URL do Supabase, aponta para a API REST dele, caso contrário usa a URL padrão
  baseURL: SUPABASE_URL ? `${SUPABASE_URL}/rest/v1` : (import.meta.env.VITE_API_URL || 'https://sistema-hospitalar.onrender.com/api'),
  headers: {
    'Content-Type': 'application/json',
    // O Supabase exige a anon key em todas as requisições via REST
    ...(SUPABASE_ANON_KEY ? { 'apikey': SUPABASE_ANON_KEY } : {})
  }
});

// ============================================================
// MODO MOCK LOCAL
// ============================================================
const USE_MOCK = import.meta.env.DEV && !SUPABASE_URL; // Desativa mock se houver Supabase configurado

// ── Helpers ─────────────────────────────────────────────────
function lsGet<T>(key: string, defaults: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaults;
  } catch { return defaults; }
}
function lsSet(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Seed Data ────────────────────────────────────────────────
const SEED_UNIDADES = [
  { id: 'u1', nome: 'UPA Centro', tipo: 'UPA', endereco: 'Av. Brasil, 1000 - Centro', telefone: '(11) 3200-1000', capacidade_leitos: 80, ativo: true, criado_em: '2025-01-10T08:00:00Z' },
  { id: 'u2', nome: 'Hospital Municipal São Lucas', tipo: 'HOSPITAL', endereco: 'Rua das Flores, 500 - Jardim América', telefone: '(11) 3200-2000', capacidade_leitos: 350, ativo: true, criado_em: '2025-01-15T08:00:00Z' },
  { id: 'u3', nome: 'UBS Vila Nova', tipo: 'UBS', endereco: 'Rua Independência, 220 - Vila Nova', telefone: '(11) 3200-3000', capacidade_leitos: 20, ativo: true, criado_em: '2025-02-05T08:00:00Z' },
  { id: 'u4', nome: 'Clínica InoveHealth Premium', tipo: 'CLINICA', endereco: 'Av. Paulista, 2000 - Bela Vista', telefone: '(11) 4002-8922', capacidade_leitos: 50, ativo: true, criado_em: '2025-03-01T08:00:00Z' },
];

const SEED_MEDICOS = [
  { id: 'm1', nome: 'Dr. Carlos Eduardo Mendes', email: 'carlos.mendes@inove.com', crm: 'CRM/SP-123456', especialidade: 'Clínica Geral', ativo: true, criado_em: '2025-01-10T08:00:00Z' },
  { id: 'm2', nome: 'Dra. Ana Paula Rodrigues', email: 'ana.rodrigues@inove.com', crm: 'CRM/SP-234567', especialidade: 'Pediatria', ativo: true, criado_em: '2025-01-12T08:00:00Z' },
  { id: 'm3', nome: 'Dr. Marcos Vinícius Lima', email: 'marcos.lima@inove.com', crm: 'CRM/SP-345678', especialidade: 'Cardiologia', ativo: true, criado_em: '2025-02-01T08:00:00Z' },
  { id: 'm4', nome: 'Dra. Juliana Ferreira Costa', email: 'juliana.costa@inove.com', crm: 'CRM/RJ-456789', especialidade: 'Ortopedia', ativo: true, criado_em: '2025-02-15T08:00:00Z' },
  { id: 'm5', nome: 'Dr. Roberto Alves Neto', email: 'roberto.neto@inove.com', crm: 'CRM/SP-567890', especialidade: 'Neurologia', ativo: true, criado_em: '2025-03-10T08:00:00Z' },
];

const SEED_ENFERMEIROS = [
  { id: 'e1', nome: 'Enf. Clarice Santos Oliveira', email: 'clarice.oliveira@inove.com', coren: 'COREN/SP-100001', especialidade: 'UTI', ativo: true, criado_em: '2025-01-10T08:00:00Z' },
  { id: 'e2', nome: 'Enf. Pedro Henrique Souza', email: 'pedro.souza@inove.com', coren: 'COREN/SP-100002', especialidade: 'Pronto-Socorro', ativo: true, criado_em: '2025-01-20T08:00:00Z' },
  { id: 'e3', nome: 'Enf. Fernanda Gomes Reis', email: 'fernanda.reis@inove.com', coren: 'COREN/MG-200033', especialidade: 'Pediatria', ativo: true, criado_em: '2025-02-10T08:00:00Z' },
  { id: 'e4', nome: 'Enf. Lucas Martins Pereira', email: 'lucas.pereira@inove.com', coren: 'COREN/SP-100044', especialidade: 'Cirurgia', ativo: true, criado_em: '2025-03-05T08:00:00Z' },
];

const SEED_CUSTOS_ATEND = [
  { id: 'ATD-001', paciente: 'Maria Silva Costa', data: '2026-05-10', medico: 'Dr. Carlos Eduardo Mendes', custos: { insumos: 45.80, honorarios: 120.00, infraestrutura: 35.00 }, custoTotal: 200.80, statusFaturamento: 'FATURADO' },
  { id: 'ATD-002', paciente: 'João Pedro Alves', data: '2026-05-12', medico: 'Dra. Ana Paula Rodrigues', custos: { insumos: 128.50, honorarios: 200.00, infraestrutura: 60.00 }, custoTotal: 388.50, statusFaturamento: 'PENDENTE' },
  { id: 'ATD-003', paciente: 'Roberto Carlos Freitas', data: '2026-05-14', medico: 'Dr. Marcos Vinícius Lima', custos: { insumos: 312.00, honorarios: 450.00, infraestrutura: 150.00 }, custoTotal: 912.00, statusFaturamento: 'GLOSADO' },
  { id: 'ATD-004', paciente: 'Luciana Fernandes', data: '2026-05-15', medico: 'Dr. Roberto Alves Neto', custos: { insumos: 89.20, honorarios: 180.00, infraestrutura: 45.00 }, custoTotal: 314.20, statusFaturamento: 'FATURADO' },
  { id: 'ATD-005', paciente: 'Antônio Souza Neto', data: '2026-05-17', medico: 'Dra. Juliana Ferreira Costa', custos: { insumos: 560.00, honorarios: 800.00, infraestrutura: 200.00 }, custoTotal: 1560.00, statusFaturamento: 'PENDENTE' },
];

const SEED_TABELAS = [
  {
    id: 't-urg-moura',
    nome: 'CONSULTA URGÊNCIA MOURA',
    tipo: '22 - TUSS',
    tipo_despesa: 'Procedimentos',
    ativo: true,
    horarios_especiais: [
      { dia: 'Segunda a Sexta', inicio: '19:00', fim: '07:00', acrescimo: 42 },
      { dia: 'Sábado e Domingo', inicio: '00:00', fim: '23:59', acrescimo: 42 }
    ],
    itens: [
      { id: 'i1', insumo_id: '1', codigo: '10101038', tuss: '10101039', descricao: 'CONSULTA DE URGÊNCIA COM VASCULAR', valor: 100.00 },
      { id: 'i2', insumo_id: '2', codigo: '10101039', tuss: '10101039', descricao: 'Consulta em pronto socorro', valor: 81.00 }
    ]
  },
  { id: 't-proc-unimed', nome: 'PROCEDIMENTOS UNIMED', tipo: '22 - TUSS', ativo: true, itens: [{ id: 'up1', insumo_id: '1', codigo: '10101012', descricao: 'DIPIRONA (PREÇO UNIMED)', valor: 0.85 }] },
  { id: 't-dia-unimed', nome: 'DIÁRIAS UNIMED', tipo: 'PROPRIO', ativo: true, itens: [{ id: 'up2', codigo: '50000011', descricao: 'DIÁRIA APARTAMENTO', valor: 450.00 }] },
  { id: 't-tax-unimed', nome: 'TAXAS UNIMED', tipo: 'PROPRIO', ativo: true, itens: [] },
  { id: 't-gas-unimed', nome: 'GASES UNIMED', tipo: 'PROPRIO', ativo: true, itens: [] },
  { id: 't-med-unimed', nome: 'MEDICAMENTOS UNIMED TNUMM', tipo: 'TNUMM', ativo: true, itens: [{ id: 'up3', insumo_id: '1', codigo: '9000123', descricao: 'DIPIRONA TNUMM', valor: 0.95 }] },
  { id: 't-mat-unimed-00', nome: 'MATERIAIS UNIMED (TABELA 00)', tipo: 'PROPRIO', ativo: true, itens: [] },
  { id: 't-mat-unimed-19', nome: 'MATERIAIS UNIMED (TABELA 19)', tipo: 'PROPRIO', ativo: true, itens: [] },
  { id: 't-pacote-unimed', nome: 'PACOTE UNIMED', tipo: 'PROPRIO', ativo: true, itens: [] },
  { id: 't-proc-amb-unimed', nome: 'PROCEDIMENTOS AMBULATORIAIS UNIMED', tipo: '22 - TUSS', ativo: true, itens: [] },
  { id: 't-brasindice', nome: 'MEDICAMENTOS BRASINDICE', tipo: 'PRECO_FABRICA', ativo: true, itens: [] },
  { id: 't-simpro', nome: 'MATERIAIS DESCARTÁVEIS SIMPRO', tipo: 'SIMPRO', ativo: true, itens: [] },
  { id: 't-diarias-moura', nome: 'DIÁRIAS MOURA', tipo: 'PROPRIO', ativo: true, itens: [] },
  { id: 't-taxas-moura', nome: 'TAXAS MOURA', tipo: 'PROPRIO', ativo: true, itens: [] },
  { id: 't-gases-moura', nome: 'GASES MOURA', tipo: 'PROPRIO', ativo: true, itens: [] },
  { id: 't-cbhpm-2010', nome: 'CBHPM 2010', tipo: 'CBHPM', ativo: true, itens: [] },
  { id: 't-opme-nf-moura', nome: 'OPME MOURA - NOTA FISCAL', tipo: 'PROPRIO', ativo: true, itens: [] },
  { id: 't-opme-simpro-moura', nome: 'OPME MOURA - SIMPRO VIGENTE', tipo: 'SIMPRO', ativo: true, itens: [] },
  { id: 't-proc-moura', nome: 'TABELA PROCEDIMENTOS MOURA', tipo: '22 - TUSS', ativo: true, itens: [] },
];

const SEED_CONVENIOS = [
  {
    id: 'c-unimed',
    nome: 'UNIMED',
    registro_ans: '340952',
    cnpj: '24.449.225/0001-98',
    tiss_versao: '4.01.00',
    financeiro: {
      valor_filme: 19.40,
      valor_uco: 0.00,
      valor_ch: 0.28,
      deflator_porte: 20.00,
      acrescimo_apartamento: 100.00, // 100%
      dias_retorno: 30,
      digitos_matricula: 16
    },
    vias_acesso: [
      { descricao: 'Única', percentual: 100 },
      { descricao: 'Mesma via', percentual: 50 },
      { descricao: 'Diferentes vias', percentual: 30 }
    ],
    tabelas_vinculadas: [
      { tabela_id: 't-proc-unimed', nome: 'PROCEDIMENTOS UNIMED' },
      { tabela_id: 't-dia-unimed', nome: 'DIÁRIAS UNIMED' },
      { tabela_id: 't-tax-unimed', nome: 'TAXAS UNIMED' },
      { tabela_id: 't-gas-unimed', nome: 'GASES UNIMED' },
      { tabela_id: 't-med-unimed', nome: 'MEDICAMENTOS UNIMED TNUMM' },
      { tabela_id: 't-mat-unimed-00', nome: 'MATERIAIS UNIMED (TABELA 00)' },
      { tabela_id: 't-mat-unimed-19', nome: 'MATERIAIS UNIMED (TABELA 19)' },
      { tabela_id: 't-pacote-unimed', nome: 'PACOTE UNIMED' },
      { tabela_id: 't-proc-amb-unimed', nome: 'PROCEDIMENTOS AMBULATORIAIS UNIMED' },
    ],
    categorias: [
      { descricao: 'Consulta 174', valor_ch: 0, valor_uco: 0 },
      { descricao: 'Consulta Intercâmbio', valor_ch: 0, valor_uco: 0 },
      { descricao: '174 Internação', valor_ch: 0, valor_uco: 0 }
    ],
    obrigatorios_atendimento: {
      guia_principal: true,
      autorizacao: true,
      senha: true,
      setor: true,
      cid10: true
    }
  },
  {
    id: 'c-moura',
    nome: 'MOURA',
    cnpj: '09.811.654/0001-70',
    tiss_versao: '3.05.00',
    financeiro: {
      valor_filme: 21.70,
      valor_uco: 12.67,
      valor_ch: 0.00,
      acrescimo_apartamento: 0
    },
    tabelas_vinculadas: [
      { tabela_id: 't-urg-moura', nome: 'CONSULTA URGÊNCIA MOURA' },
      { tabela_id: 't-proc-moura', nome: 'TABELA PROCEDIMENTOS MOURA' }
    ]
  }
];

const SEED_GUIAS = [
  { id: 'g1', numero: 'GUI-2026-0001', tipo: 'CONSULTA', paciente: 'Maria Silva Costa', convenio: 'Unimed Nacional', valor: 150.00, status: 'AUTORIZADA', data_emissao: '2026-05-10' },
  { id: 'g2', numero: 'GUI-2026-0002', tipo: 'SP_SADT', paciente: 'João Pedro Alves', convenio: 'Amil Saúde', valor: 380.00, status: 'PENDENTE', data_emissao: '2026-05-12' },
  { id: 'g3', numero: 'GUI-2026-0003', tipo: 'CONSULTA', paciente: 'Luciana Fernandes', convenio: 'SUS', valor: 35.00, status: 'AUTORIZADA', data_emissao: '2026-05-15' },
];

const SEED_LOTES = [
  { id: 'l1', numero: 'LOTE-2026-05-A', convenio: 'Unimed Nacional', competencia: '05/2026', qtd_guias: 42, valor_total: 18500.00, status: 'ENVIADO', data_envio: '2026-05-20' },
  { id: 'l2', numero: 'LOTE-2026-04-A', convenio: 'Amil Saúde', competencia: '04/2026', qtd_guias: 28, valor_total: 11200.00, status: 'PAGO', data_envio: '2026-04-22' },
];

const SEED_TIPOS_MOVIMENTO = [
  { id: 1, descricao: 'Entrada por Nota Fiscal', tipo: 'ENTRADA', ativo: true },
  { id: 2, descricao: 'Entrada por Empréstimo', tipo: 'ENTRADA', ativo: true },
  { id: 3, descricao: 'Entrada por Consignação', tipo: 'ENTRADA', ativo: true },
  { id: 4, descricao: 'Entrada Parcial (Recibo/Cupom)', tipo: 'ENTRADA', ativo: true },
  { id: 5, descricao: 'Entrada Inventário', tipo: 'ENTRADA', ativo: true },
  { id: 6, descricao: 'Inicialização do Estoque', tipo: 'ENTRADA', ativo: true },
  { id: 7, descricao: 'Estorno de Saída', tipo: 'ENTRADA', ativo: true },
  { id: 9, descricao: 'Saída para Centro de Custo', tipo: 'SAIDA', ativo: true },
  { id: 10, descricao: 'Saída para Paciente', tipo: 'SAIDA', ativo: true },
  { id: 11, descricao: 'Saída por Empréstimo', tipo: 'SAIDA', ativo: true },
  { id: 12, descricao: 'Saída por Consignação', tipo: 'SAIDA', ativo: true },
  { id: 13, descricao: 'Saída Inventário', tipo: 'SAIDA', ativo: true },
  { id: 14, descricao: 'Estorno de Entrada', tipo: 'SAIDA', ativo: true },
  { id: 16, descricao: 'Saída por itens vencidos', tipo: 'SAIDA', ativo: true },
];

const SEED_SETORES = [
  { id: 's1', nome: 'Almoxarifado Central', tipo: 'ESTOQUE', ativo: true },
  { id: 's2', nome: 'Farmácia Satélite - UTI', tipo: 'FARMACIA', ativo: true },
  { id: 's3', nome: 'Farmácia Satélite - Pronto Socorro', tipo: 'FARMACIA', ativo: true },
  { id: 's4', nome: 'Centro Cirúrgico', tipo: 'SETOR_ASSISTENCIAL', ativo: true },
];

const SEED_KITS = [
  { id: 'k1', nome: 'Kit Intubação Padrão', itens: [{ insumo_id: '1', qtd: 2 }, { insumo_id: '5', qtd: 2 }], ativo: true },
  { id: 'k2', nome: 'Kit Curativo Simples', itens: [{ insumo_id: '3', qtd: 1 }, { insumo_id: '4', qtd: 1 }], ativo: true },
];

const SEED_GLOSAS = [
  { id: 'gl1', guia: 'GUI-2026-0001', convenio: 'Unimed Nacional', motivo: 'Código do procedimento não compatível com CID', valor_glosado: 150.00, status: 'RECURSO_ENVIADO', data: '2026-05-15' },
  { id: 'gl2', guia: 'GUI-2026-0002', convenio: 'Amil Saúde', motivo: 'Documentação incompleta — laudo médico ausente', valor_glosado: 380.00, status: 'PENDENTE', data: '2026-05-18' },
];

const SEED_ATENDIMENTOS = [
  {
    id: 'ATD-1001',
    tipo: 'INTERNAMENTO',
    data: '2026-05-21',
    hora: '10:30',
    paciente_id: '1',
    paciente_nome: 'Maria Silva Costa',
    paciente_cpf: '111.222.333-44',
    paciente_prontuario: '1',
    categoria: 'Particular',
    convenio_id: 'c-unimed', // Adicionado para vincular ao convênio UNIMED
    status: 'ATIVO',
    status_fila: 'EM_CONSULTA',
    dados_atendimento: {
      carater: 'Eletiva',
      tipo_internacao: 'Clínica',
      regime: 'Hospitalar',
      clinica: 'Clínica Médica',
      acomodacao: 'Apartamento',
      leito: 'Apto 204',
      cid10: 'I10 - Hipertensão essencial',
      profissional_executante: 'Dr. Carlos Eduardo Mendes'
    },
    procedimentos: [
      { data: '2026-05-21', codigo: '50000022', nome: 'Diária de enfermaria', qtd: 1, valor: 250.00 }
    ],
    dados_solicitacao: {
      data: '2026-05-21',
      hora: '10:00',
      contratado: 'Hospital',
      profissional: 'Dr. Carlos Eduardo Mendes',
      especialidade: 'Clínica Geral',
      indicacao: 'Paciente necessita de monitoramento pressórico constante',
      observacoes: 'Internação planejada'
    }
  },
  {
    id: 'ATD-1002',
    tipo: 'URGENCIA',
    data: '2026-05-21',
    hora: '11:15',
    paciente_id: '2',
    paciente_nome: 'João Pedro Alves',
    paciente_cpf: '555.666.777-88',
    paciente_prontuario: '2',
    categoria: 'SUS',
    convenio_id: 'c-moura', // Adicionado para vincular ao convênio MOURA
    status: 'ATIVO',
    status_fila: 'AGUARDANDO_TRIAGEM',
    senha_chamada: 'U-005 às 11:00',
    dados_autorizacao: {
      guia_principal: '1234567',
      autorizacao: '987654',
      guia_operadora: '333444',
      data_emissao: '2026-05-21',
      data_vencimento: '2026-06-21',
      autorizador: 'Maria de Souza',
      senha: 'XYZ-998'
    },
    dados_atendimento: {
      tipo_atendimento: 'Urgência',
      setor: 'Pronto-socorro',
      acomodacao: 'Leito de Observação',
      leito: 'OBS-03',
      cid10: 'J06 - Infecções agudas das vias aéreas superiores',
      profissional_executante: 'Dra. Ana Paula Rodrigues',
      tipo_consulta: 'Primeira Consulta',
      indicador_acidente: 'Não Acidente',
      regime: 'Pronto-socorro',
      etiquetas: 'Sintomas gripais'
    },
    procedimentos: [
      { data: '2026-05-21', codigo: '10101012', nome: 'Consulta de Pronto-Socorro', qtd: 1, valor: 80.00, especialidade: 'Pediatria', profissional: 'Dra. Ana Paula Rodrigues' }
    ],
    dados_solicitacao: {
      data: '2026-05-21',
      hora: '11:15',
      contratado: 'Hospital',
      profissional: 'Dra. Ana Paula Rodrigues',
      especialidade: 'Pediatria',
      indicacao: 'Febre alta persistente',
      observacoes: 'Observação temporária'
    }
  },
  {
    id: 'ATD-1003',
    tipo: 'CONSULTA',
    data: '2026-05-21',
    hora: '13:00',
    paciente_id: '3',
    paciente_nome: 'Roberto Carlos Freitas',
    paciente_cpf: '999.888.777-66',
    paciente_prontuario: '3',
    categoria: 'Convênio',
    convenio_id: 'c-unimed', // Adicionado para vincular ao convênio UNIMED
    status: 'ATIVO',
    status_fila: 'AGUARDANDO_MEDICO',
    dados_atendimento: {
      consultorio: 'Consultório B',
      cid10: 'E11 - Diabetes mellitus não-insulino-dependente',
      profissional_executante: 'Dr. Marcos Vinícius Lima'
    },
    procedimentos: [
      { data: '2026-05-21', codigo: '40302240', nome: 'Glicemia de jejum', qtd: 1, valor: 15.00, especialidade: 'Cardiologia', profissional: 'Dr. Marcos Vinícius Lima' }
    ],
    observacoes: 'Consulta eletiva de retorno para controle glicêmico'
  }
];


// ============================================================
if (USE_MOCK) {
  api.defaults.adapter = async (config) => {
    const url = config.url || '';
    const method = config.method?.toLowerCase();

    let parsedData: any = {};
    try { parsedData = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {}); } catch { }

    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));

    const ok = (responseData: any) => ({
      data: responseData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      request: {}
    });

    // ── 1. Auth ────────────────────────────────────────────
    if (url.includes('/auth/login') && method === 'post') {
      let role: 'ADMIN' | 'MEDICO' | 'ENFERMEIRO' = 'ADMIN';
      if (parsedData.email?.toLowerCase().includes('medico')) role = 'MEDICO';
      else if (parsedData.email?.toLowerCase().includes('enfermeiro')) role = 'ENFERMEIRO';

      const nomeExibicao = role === 'ADMIN' ? 'Dr. Roberto (Admin)' : role === 'ENFERMEIRO' ? 'Enf. Clarice' : 'Dr. Roberto';
      return ok({
        user: { id: 'mock-1', name: nomeExibicao, nome: nomeExibicao, email: parsedData.email, role, papel: role },
        token: 'mock-jwt-token-123'
      });
    }

    // ── 2. Unidades de Saúde ───────────────────────────────
    if (url.includes('/unidades-saude')) {
      const KEY = 'inove_unidades_mock';
      let unidades: any[] = lsGet(KEY, SEED_UNIDADES);

      // GET /unidades-saude/:id/funcionarios
      const funcMatch = url.match(/\/unidades-saude\/([a-zA-Z0-9_-]+)\/funcionarios/);
      if (funcMatch) {
        const medicos = lsGet<any[]>('inove_medicos_mock', SEED_MEDICOS);
        const enfermeiros = lsGet<any[]>('inove_enfermeiros_mock', SEED_ENFERMEIROS);
        const todos = [...medicos, ...enfermeiros];
        // Retorna um subconjunto aleatório simulando vínculo
        const vinculados = todos.slice(0, Math.ceil(todos.length / 2));
        return ok({ funcionarios: vinculados });
      }

      const idMatch = url.match(/\/unidades-saude\/([a-zA-Z0-9_-]+)$/);

      if (idMatch && method === 'get') {
        const item = unidades.find(u => u.id === idMatch[1]);
        return ok({ unidade: item || {} });
      }
      if (idMatch && method === 'put') {
        const idx = unidades.findIndex(u => u.id === idMatch[1]);
        if (idx !== -1) { unidades[idx] = { ...unidades[idx], ...parsedData }; lsSet(KEY, unidades); }
        return ok(unidades[idx]);
      }
      if (idMatch && method === 'delete') {
        const idx = unidades.findIndex(u => u.id === idMatch[1]);
        if (idx !== -1) { unidades[idx].ativo = false; lsSet(KEY, unidades); }
        return ok({ success: true });
      }
      if (method === 'get') return ok(unidades);
      if (method === 'post') {
        const novo = { id: `u${Date.now()}`, ativo: true, criado_em: new Date().toISOString(), ...parsedData };
        unidades.push(novo);
        lsSet(KEY, unidades);
        return ok(novo);
      }
    }

    // ── 3. Médicos ─────────────────────────────────────────
    if (url.includes('/medicos')) {
      const KEY = 'inove_medicos_mock';
      let medicos: any[] = lsGet(KEY, SEED_MEDICOS);

      const idMatch = url.match(/\/medicos\/([a-zA-Z0-9_-]+)$/);
      if (idMatch && method === 'put') {
        const idx = medicos.findIndex(m => m.id === idMatch[1]);
        if (idx !== -1) { medicos[idx] = { ...medicos[idx], ...parsedData }; lsSet(KEY, medicos); }
        return ok(medicos[idx]);
      }
      if (idMatch && method === 'delete') {
        const idx = medicos.findIndex(m => m.id === idMatch[1]);
        if (idx !== -1) { medicos[idx].ativo = false; lsSet(KEY, medicos); }
        return ok({ success: true });
      }
      if (method === 'get') return ok({ medicos });
      if (method === 'post') {
        const novo = { id: `m${Date.now()}`, ativo: true, criado_em: new Date().toISOString(), ...parsedData };
        medicos.push(novo);
        lsSet(KEY, medicos);
        return ok(novo);
      }
    }

    // ── 4. Enfermeiros ─────────────────────────────────────
    if (url.includes('/enfermeiros')) {
      const KEY = 'inove_enfermeiros_mock';
      let enfermeiros: any[] = lsGet(KEY, SEED_ENFERMEIROS);

      const idMatch = url.match(/\/enfermeiros\/([a-zA-Z0-9_-]+)$/);
      if (idMatch && method === 'put') {
        const idx = enfermeiros.findIndex(e => e.id === idMatch[1]);
        if (idx !== -1) { enfermeiros[idx] = { ...enfermeiros[idx], ...parsedData }; lsSet(KEY, enfermeiros); }
        return ok(enfermeiros[idx]);
      }
      if (idMatch && method === 'delete') {
        const idx = enfermeiros.findIndex(e => e.id === idMatch[1]);
        if (idx !== -1) { enfermeiros[idx].ativo = false; lsSet(KEY, enfermeiros); }
        return ok({ success: true });
      }
      if (method === 'get') return ok({ enfermeiros });
      if (method === 'post') {
        const novo = { id: `e${Date.now()}`, ativo: true, criado_em: new Date().toISOString(), ...parsedData };
        enfermeiros.push(novo);
        lsSet(KEY, enfermeiros);
        return ok(novo);
      }
    }

    // ── 5. IA Relatórios ───────────────────────────────────
    if (url.includes('/ia/relatorios')) return ok({ relatorios: [] });

    // ── 6. Pacientes ───────────────────────────────────────
    if (url.includes('/pacientes')) {
      const KEY = 'inove_pacientes_mock';
      let pacientes: any[] = lsGet(KEY, [
        { id: '1', nome: 'Maria Silva Costa', data_nascimento: '1979-05-12', sexo: 'F', cpf: '111.222.333-44', status: 'Em Atendimento', risco: 'amarelo' },
        { id: '2', nome: 'João Pedro Alves', data_nascimento: '1995-10-23', sexo: 'M', cpf: '555.666.777-88', status: 'Aguardando Triagem', risco: 'verde' },
        { id: '3', nome: 'Roberto Carlos Freitas', data_nascimento: '1965-03-30', sexo: 'M', cpf: '999.888.777-66', status: 'Aguardando Triagem', risco: 'verde' },
      ]);

      if (url.match(/\/pacientes\/([a-zA-Z0-9_-]+)\/historico/)) {
        const id = url.split('/')[2];
        const triagens = lsGet<any[]>('inove_triagens_mock', []);
        const consultas = lsGet<any[]>('inove_consultas_mock', []);
        const prescricoes = lsGet<any[]>('inove_prescricoes_mock', []);
        return ok({
          triagens: triagens.filter((t: any) => t.paciente_id === id),
          consultas: consultas.filter((c: any) => c.paciente_id === id),
          prescricoes: prescricoes.filter((p: any) => p.paciente_id === id)
        });
      }

      if (url.match(/\/pacientes\/([a-zA-Z0-9_-]+)$/) && method === 'get') {
        const id = url.split('/')[2];
        return ok({ paciente: pacientes.find((p: any) => p.id === id) || {} });
      }
      if (method === 'get') return ok({ pacientes });
      if (method === 'post') {
        const novo = { id: `PRO-2026-${Math.floor(100000 + Math.random() * 900000)}`, status: 'Aguardando Triagem', criado_em: new Date().toISOString(), ...parsedData };
        pacientes.push(novo);
        lsSet(KEY, pacientes);
        return ok(novo);
      }
    }

    // ── 6.1 Atendimentos ────────────────────────────────────
    if (url.includes('/atendimentos')) {
      const KEY = 'inove_atendimentos_mock';
      let atendimentos: any[] = lsGet(KEY, SEED_ATENDIMENTOS);

      if (url.includes('/chamar-senha') && method === 'post') {
        const type = parsedData.tipo || 'N'; // N for Normal, P for Prioridade
        const seqKey = `inove_senha_seq_${type}`;
        let seq = lsGet<number>(seqKey, 0) + 1;
        lsSet(seqKey, seq);
        const formatSeq = String(seq).padStart(3, '0');
        const senha = `${type}-${formatSeq}`;
        const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return ok({ senha, hora });
      }

      const idMatch = url.match(/\/atendimentos\/([a-zA-Z0-9_-]+)$/);
      if (idMatch && (method === 'put' || method === 'patch')) {
        const idx = atendimentos.findIndex(a => a.id === idMatch[1]);
        if (idx !== -1) {
          atendimentos[idx] = { ...atendimentos[idx], ...parsedData };
          lsSet(KEY, atendimentos);
        }
        return ok(atendimentos[idx]);
      }

      if (idMatch && method === 'delete') {
        const idx = atendimentos.findIndex(a => a.id === idMatch[1]);
        if (idx !== -1) {
          atendimentos[idx].status = 'INATIVO';
          lsSet(KEY, atendimentos);
        }
        return ok({ success: true });
      }

      if (method === 'get') {
        return ok({ atendimentos });
      }

      if (method === 'post') {
        const novo = {
          id: `ATD-${Date.now().toString().slice(-6)}`,
          status: 'ATIVO',
          status_fila: 'AGUARDANDO_TRIAGEM',
          data: parsedData.data || new Date().toISOString().split('T')[0],
          hora: parsedData.hora || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          ...parsedData
        };
        atendimentos.push(novo);
        lsSet(KEY, atendimentos);

        // Também atualizar o status do paciente
        const pacs: any[] = lsGet('inove_pacientes_mock', []);
        const pIdx = pacs.findIndex((p: any) => p.id === parsedData.paciente_id);
        if (pIdx !== -1) {
          pacs[pIdx].status = parsedData.tipo === 'INTERNAMENTO' ? 'Internado' : 'Em Atendimento';
          lsSet('inove_pacientes_mock', pacs);
        }

        return ok(novo);
      }
    }

    // ── 7. Triagens ────────────────────────────────────────
    if (url.includes('/triagens')) {
      const KEY = 'inove_triagens_mock';
      let triagens: any[] = lsGet(KEY, []);

      if (method === 'get' && url.includes('/pacientes/')) {
        const id = url.split('/').pop();
        return ok({ triagens: triagens.filter((t: any) => t.paciente_id === id) });
      }
      if (method === 'get' && url.includes('/atendimentos/')) {
        const id = url.split('/').pop();
        return ok({ triagens: triagens.filter((t: any) => t.atendimento_id === id) });
      }
      if (method === 'post') {
        const nova = { id: Date.now().toString(), criado_em: new Date().toISOString(), ...parsedData };
        triagens.push(nova);
        lsSet(KEY, triagens);
        const pacs: any[] = lsGet('inove_pacientes_mock', []);
        const pIdx = pacs.findIndex((p: any) => p.id === parsedData.paciente_id);
        if (pIdx !== -1) { pacs[pIdx].risco = parsedData.classificacao_risco; pacs[pIdx].status = 'Aguardando Atendimento'; lsSet('inove_pacientes_mock', pacs); }
        
        if (parsedData.atendimento_id) {
          const atds: any[] = lsGet('inove_atendimentos_mock', SEED_ATENDIMENTOS);
          const aIdx = atds.findIndex((a: any) => a.id === parsedData.atendimento_id);
          if (aIdx !== -1) {
            atds[aIdx].status_fila = 'AGUARDANDO_MEDICO';
            lsSet('inove_atendimentos_mock', atds);
          }
        }
        
        return ok(nova);
      }
    }

    // ── 8. Consultas ───────────────────────────────────────
    if (url.includes('/consultas')) {
      const KEY = 'inove_consultas_mock';
      let consultas: any[] = lsGet(KEY, []);

      if (method === 'get' && url.includes('/pacientes/')) {
        const id = url.split('/').pop();
        return ok({ consultas: consultas.filter((c: any) => c.paciente_id === id) });
      }
      if (method === 'post') {
        const nova = { id: Date.now().toString(), criado_em: new Date().toISOString(), ...parsedData };
        consultas.push(nova);
        lsSet(KEY, consultas);
        const pacs: any[] = lsGet('inove_pacientes_mock', []);
        const pIdx = pacs.findIndex((p: any) => p.id === parsedData.paciente_id);
        if (pIdx !== -1) { pacs[pIdx].status = 'Atendido'; lsSet('inove_pacientes_mock', pacs); }
        return ok(nova);
      }
    }

    // ── 9. Prescrições e Prontuários ───────────────────────
    if (url.includes('/prescricoes') || url.includes('/prontuarios')) {
      const isProntuario = url.includes('/prontuarios');
      const KEY = isProntuario ? 'inove_prontuarios_mock' : 'inove_prescricoes_mock';
      let items: any[] = lsGet(KEY, []);

      if (url.endsWith('/pdf')) return ok(new Blob(['PDF Simulado - Inove Health'], { type: 'application/pdf' }));

      if (method === 'get' && url.includes('/pacientes/')) {
        const id = url.split('/')[3];
        return ok({ [isProntuario ? 'prontuarios' : 'prescricoes']: items.filter((i: any) => i.paciente_id === id) });
      }
      if (method === 'post') {
        const nova = { id: Date.now().toString(), criado_em: new Date().toISOString(), ...parsedData };
        items.push(nova);
        if (!isProntuario && parsedData.medicamentos) {
          const insumos: any[] = lsGet('inove_insumos_mock', []);
          parsedData.medicamentos.forEach((m: any) => {
            const idx = insumos.findIndex((i: any) => i.nome === m.nome);
            if (idx !== -1) insumos[idx].quantidade_atual = Math.max(0, insumos[idx].quantidade_atual - (m.quantidade || 1));
          });
          lsSet('inove_insumos_mock', insumos);
        }
        lsSet(KEY, items);
        return ok(nova);
      }
    }

    // ── 10. IA Assistiva ───────────────────────────────────
    if (url.includes('/ia/paciente/')) {
      return ok({
        analise: 'A IA analisou os registros deste paciente e identificou um padrão de recorrência relacionado a picos hipertensivos nas últimas 3 semanas.\n\nRecomendações:\n- Acompanhamento ambulatorial rigoroso.\n- Revisão da dosagem de anti-hipertensivos.\n- Solicitação de exames cardiológicos complementares.'
      });
    }

    // ── 11. Fornecedores ───────────────────────────────────
    if (url.includes('/cadastros/fornecedores')) {
      const KEY = 'inove_fornecedores_mock';
      const SEED = [
        { id: '1', razao_social: 'MedPharma Distribuidora Ltda', nome_fantasia: 'MedPharma', cnpj: '12.345.678/0001-90', email: 'vendas@medpharma.com.br', telefone: '(11) 3456-7890', endereco: 'Av. Paulista, 1500 - São Paulo/SP', categoria: 'MEDICAMENTOS', ativo: true, criado_em: '2025-01-15' },
        { id: '2', razao_social: 'HospMat Materiais Hospitalares S.A.', nome_fantasia: 'HospMat', cnpj: '98.765.432/0001-10', email: 'contato@hospmat.com.br', telefone: '(21) 2345-6789', endereco: 'Rua da Saúde, 200 - Rio de Janeiro/RJ', categoria: 'MATERIAIS_HOSPITALARES', ativo: true, criado_em: '2025-02-20' },
        { id: '3', razao_social: 'ProteVida EPIs e Segurança Ltda', nome_fantasia: 'ProteVida', cnpj: '11.222.333/0001-44', email: 'comercial@protevida.com', telefone: '(31) 9876-5432', endereco: 'Rod. BR-040, Km 12 - Belo Horizonte/MG', categoria: 'EPI', ativo: true, criado_em: '2025-03-10' },
        { id: '4', razao_social: 'LabSupply Insumos Laboratoriais', nome_fantasia: 'LabSupply', cnpj: '44.555.666/0001-77', email: 'lab@labsupply.com.br', telefone: '(41) 3333-4444', endereco: 'Rua dos Cientistas, 88 - Curitiba/PR', categoria: 'LABORATORIO', ativo: true, criado_em: '2025-04-05' },
      ];
      let fornecedores: any[] = lsGet(KEY, SEED);

      const idMatch = url.match(/\/cadastros\/fornecedores\/([a-zA-Z0-9_-]+)$/);
      if (idMatch && method === 'put') {
        const idx = fornecedores.findIndex(f => f.id === idMatch[1]);
        if (idx !== -1) { fornecedores[idx] = { ...fornecedores[idx], ...parsedData }; lsSet(KEY, fornecedores); }
        return ok(fornecedores[idx]);
      }
      if (idMatch && method === 'delete') {
        fornecedores = fornecedores.filter(f => f.id !== idMatch[1]);
        lsSet(KEY, fornecedores);
        return ok({ success: true });
      }
      if (method === 'get') return ok({ fornecedores });
      if (method === 'post') {
        const novo = { id: Date.now().toString(), ativo: true, criado_em: new Date().toISOString(), ...parsedData };
        fornecedores.push(novo);
        lsSet(KEY, fornecedores);
        return ok(novo);
      }
    }

    // ── 12. Convênios ──────────────────────────────────────
    if (url.includes('/cadastros/convenios')) {
      const KEY = 'inove_convenios_mock';
      const SEED = [
        {
          id: '1', nome: 'Unimed Nacional', registro_ans: '354801', tipo: 'COOPERATIVA', email: 'credenciamento@unimed.com.br', telefone: '0800 722 0022', cobertura: 'COMPLETO', tabela_preco: 'TISS', ativo: true, criado_em: '2025-01-10',
          tabelas_vinculadas: [{ tabela_id: 't-proc-unimed', nome: 'PROCEDIMENTOS UNIMED' }, { tabela_id: 't-dia-unimed', nome: 'DIÁRIAS UNIMED' }, { tabela_id: 't-tax-unimed', nome: 'TAXAS UNIMED' }, { tabela_id: 't-gas-unimed', nome: 'GASES UNIMED' }, { tabela_id: 't-med-unimed', nome: 'MEDICAMENTOS UNIMED TNUMM' }, { tabela_id: 't-mat-unimed-00', nome: 'MATERIAIS UNIMED (TABELA 00)' }, { tabela_id: 't-mat-unimed-19', nome: 'MATERIAIS UNIMED (TABELA 19)' }, { tabela_id: 't-pacote-unimed', nome: 'PACOTE UNIMED' }, { tabela_id: 't-proc-amb-unimed', nome: 'PROCEDIMENTOS AMBULATORIAIS UNIMED' }]
        },
        {
          id: '2', nome: 'Amil Saúde', registro_ans: '326305', tipo: 'PLANO_SAUDE', email: 'redes@amil.com.br', telefone: '0800 202 6001', cobertura: 'AMBULATORIAL_HOSPITALAR', tabela_preco: 'TUSS', ativo: true, criado_em: '2025-01-15',
          tabelas_vinculadas: [{ tabela_id: 't-proc-unimed', nome: 'PROCEDIMENTOS UNIMED' }, { tabela_id: 't-brasindice', nome: 'MEDICAMENTOS BRASINDICE' }]
        },
        {
          id: '3', nome: 'SulAmérica Seguros', registro_ans: '006246', tipo: 'SEGURO_SAUDE', email: 'saude@sulamerica.com.br', telefone: '0800 970 0500', cobertura: 'HOSPITALAR', tabela_preco: 'TISS', ativo: true, criado_em: '2025-02-20',
          tabelas_vinculadas: [{ tabela_id: 't-brasindice', nome: 'MEDICAMENTOS BRASINDICE' }, { tabela_id: 't-simpro', nome: 'MATERIAIS DESCARTÁVEIS SIMPRO' }]
        },
        {
          id: '4', nome: 'SUS - Sistema Único de Saúde', registro_ans: 'N/A', tipo: 'SUS', email: 'sas@saude.gov.br', telefone: '136', cobertura: 'COMPLETO', tabela_preco: 'SUS', ativo: true, criado_em: '2025-01-01',
          tabelas_vinculadas: []
        },
        {
          id: '5', nome: 'Bradesco Saúde', registro_ans: '005711', tipo: 'SEGURO_SAUDE', email: 'saude@bradesco.com.br', telefone: '0800 727 9966', cobertura: 'COMPLETO', tabela_preco: 'TUSS', ativo: true, criado_em: '2025-03-05',
          tabelas_vinculadas: [{ tabela_id: 't-urg-moura', nome: 'CONSULTA URGÊNCIA MOURA' }]
        },
      ];
      let convenios: any[] = lsGet(KEY, SEED);

      const idMatch = url.match(/\/cadastros\/convenios\/([a-zA-Z0-9_-]+)$/);
      if (idMatch && method === 'put') {
        const idx = convenios.findIndex(c => c.id === idMatch[1]);
        if (idx !== -1) { convenios[idx] = { ...convenios[idx], ...parsedData }; lsSet(KEY, convenios); }
        return ok(convenios[idx]);
      }
      if (idMatch && method === 'delete') {
        convenios = convenios.filter(c => c.id !== idMatch[1]);
        lsSet(KEY, convenios);
        return ok({ success: true });
      }
      if (method === 'get') return ok({ convenios });
      if (method === 'post') {
        const novo = { id: Date.now().toString(), ativo: true, criado_em: new Date().toISOString(), ...parsedData };
        convenios.push(novo);
        lsSet(KEY, convenios);
        return ok(novo);
      }
    }

    // ── 13. Estoque/Insumos ────────────────────────────────
    if (url.includes('/estoque/insumos')) {
      const KEY = 'inove_insumos_mock';
      const SEED = [
        { id: '1', nome: 'Dipirona Sódica 500mg', codigo: 'MED-001', categoria: 'MEDICAMENTO', unidade_medida: 'CP', quantidade_atual: 2500, quantidade_minima: 500, lote: 'LOT-2026-A01', validade: '2027-06-15', fornecedor_nome: 'MedPharma', preco_unitario: 0.35, localizacao: 'Farmácia Central - Prat. A1', ativo: true, criado_em: '2025-01-10' },
        { id: '2', nome: 'Amoxicilina 875mg', codigo: 'MED-002', categoria: 'MEDICAMENTO', unidade_medida: 'CP', quantidade_atual: 180, quantidade_minima: 200, lote: 'LOT-2026-A02', validade: '2026-12-30', fornecedor_nome: 'MedPharma', preco_unitario: 1.20, localizacao: 'Farmácia Central - Prat. A2', ativo: true, criado_em: '2025-01-10' },
        { id: '3', nome: 'Luva Nitrílica M (cx 100un)', codigo: 'EPI-001', categoria: 'EPI', unidade_medida: 'CX', quantidade_atual: 45, quantidade_minima: 30, lote: 'LOT-2026-E01', validade: '2028-01-01', fornecedor_nome: 'ProteVida', preco_unitario: 32.50, localizacao: 'Almoxarifado - Est. B3', ativo: true, criado_em: '2025-02-15' },
        { id: '4', nome: 'Soro Fisiológico 0.9% 500ml', codigo: 'MAT-001', categoria: 'MATERIAL_HOSPITALAR', unidade_medida: 'FR', quantidade_atual: 8, quantidade_minima: 50, lote: 'LOT-2025-M01', validade: '2026-08-20', fornecedor_nome: 'HospMat', preco_unitario: 4.80, localizacao: 'Farmácia Central - Prat. C1', ativo: true, criado_em: '2025-03-01' },
        { id: '5', nome: 'Seringa Descartável 10ml', codigo: 'DESC-001', categoria: 'DESCARTAVEL', unidade_medida: 'UN', quantidade_atual: 3200, quantidade_minima: 500, lote: 'LOT-2026-D01', validade: '2029-12-31', fornecedor_nome: 'HospMat', preco_unitario: 0.45, localizacao: 'Almoxarifado - Est. A1', ativo: true, criado_em: '2025-03-10' },
        { id: '6', nome: 'Reagente Hemograma Completo', codigo: 'LAB-001', categoria: 'MATERIAL_LABORATORIO', unidade_medida: 'FR', quantidade_atual: 12, quantidade_minima: 10, lote: 'LOT-2026-L01', validade: '2026-07-10', fornecedor_nome: 'LabSupply', preco_unitario: 185.00, localizacao: 'Laboratório - Refrigerador 2', ativo: true, criado_em: '2025-04-05' },
      ];
      let insumos: any[] = lsGet(KEY, SEED);

      if (url.endsWith('/alertas')) {
        const hoje = new Date();
        const em30Dias = new Date(); em30Dias.setDate(hoje.getDate() + 30);
        const alertas = insumos.map((i: any) => {
          const dataValidade = new Date(i.validade);
          const critico_estoque = i.quantidade_atual <= i.quantidade_minima;
          const vencido = dataValidade < hoje;
          const vence_proximo = dataValidade >= hoje && dataValidade <= em30Dias;
          if (critico_estoque || vencido || vence_proximo) return { ...i, status_alerta: { estoque_baixo: critico_estoque, vencido, vence_proximo } };
          return null;
        }).filter(Boolean);
        return ok({ alerts: alertas });
      }

      const idMatch = url.match(/\/estoque\/insumos\/([a-zA-Z0-9_-]+)$/);
      if (idMatch && method === 'put') {
        const idx = insumos.findIndex((i: any) => i.id === idMatch[1]);
        if (idx !== -1) { insumos[idx] = { ...insumos[idx], ...parsedData }; lsSet(KEY, insumos); }
        return ok(insumos[idx]);
      }

      if (idMatch && method === 'delete') {
        insumos = insumos.filter((i: any) => i.id !== idMatch[1]);
        lsSet(KEY, insumos);
        return ok({ success: true });
      }

      if (method === 'get') return ok({ insumos });

      if (method === 'post') {
        const novo = { id: Date.now().toString(), ativo: true, criado_em: new Date().toISOString(), ...parsedData };
        insumos.push(novo);
        lsSet(KEY, insumos);
        return ok(novo);
      }
    }

    // ── 13.1 Movimentações de Estoque (Entradas/Saídas) ──────
    if (url.includes('/estoque/movimentacoes')) {
      const KEY_MOV = 'inove_movimentacoes_mock';
      const KEY_INSUMOS = 'inove_insumos_mock';
      let movimentacoes = lsGet<any[]>(KEY_MOV, []);
      let insumos = lsGet<any[]>(KEY_INSUMOS, []);

      if (method === 'get') return ok({ movimentacoes });

      if (method === 'post') {
        const { tipo_movimento_id, itens, setor_id, fornecedor_id } = parsedData;
        const tipoMov = SEED_TIPOS_MOVIMENTO.find(t => t.id === Number(tipo_movimento_id));

        if (!tipoMov) return Promise.reject({ response: { status: 400, data: { message: 'Tipo de movimento inválido' } } });

        // Processa cada item e atualiza o estoque
        itens.forEach((movItem: any) => {
          const idx = insumos.findIndex(i => i.id === movItem.insumo_id);
          if (idx !== -1) {
            if (tipoMov.tipo === 'ENTRADA') {
              insumos[idx].quantidade_atual += Number(movItem.quantidade);
            } else {
              insumos[idx].quantidade_atual = Math.max(0, insumos[idx].quantidade_atual - Number(movItem.quantidade));
            }
          }
        });

        const novaMov = {
          id: `mov-${Date.now()}`,
          data: new Date().toISOString(),
          tipo: tipoMov.tipo,
          descricao: tipoMov.descricao,
          setor_id,
          fornecedor_id,
          itens,
          usuario: 'Admin'
        };

        movimentacoes.push(novaMov);
        lsSet(KEY_MOV, movimentacoes);
        lsSet(KEY_INSUMOS, insumos);

        return ok(novaMov);
      }
    }

    // ── 13.2 Auxiliares de Estoque (Tipos, Setores, Kits) ──
    if (url.includes('/estoque/tipos-movimento')) {
      return ok({ tipos: SEED_TIPOS_MOVIMENTO });
    }

    if (url.includes('/estoque/setores')) {
      const KEY = 'inove_setores_mock';
      let setores = lsGet(KEY, SEED_SETORES);
      if (method === 'get') return ok({ setores });
      if (method === 'post') {
        const novo = { id: `s${Date.now()}`, ativo: true, ...parsedData };
        setores.push(novo);
        lsSet(KEY, setores);
        return ok(novo);
      }
    }

    if (url.includes('/estoque/kits')) {
      const KEY = 'inove_kits_mock';
      let kits = lsGet(KEY, SEED_KITS);
      if (method === 'get') return ok({ kits });
      if (method === 'post') {
        const novo = { id: `k${Date.now()}`, ativo: true, ...parsedData };
        kits.push(novo);
        lsSet(KEY, kits);
        return ok(novo);
      }
    }

    // ── 14. Financeiro ─────────────────────────────────────
    if (url.includes('/financeiro')) {
      // Contas a Pagar e Receber
      if (url.includes('/contas')) {
        const KEY = 'inove_contas_mock';
        const SEED = [
          { id: '1', descricao: 'Aluguel Unidade Central', tipo: 'PAGAR', valor: 5000, data_vencimento: '2026-05-25', status: 'PENDENTE', criado_em: '2026-05-01' },
          { id: '2', descricao: 'Consulta Particular Maria', tipo: 'RECEBER', valor: 300, data_vencimento: '2026-05-20', data_pagamento: '2026-05-19', status: 'PAGO', criado_em: '2026-05-15' },
          { id: '3', descricao: 'Salários Equipe Médica', tipo: 'PAGAR', valor: 25000, data_vencimento: '2026-05-30', status: 'PENDENTE', criado_em: '2026-05-01' },
          { id: '4', descricao: 'Convênio Unimed — Abril', tipo: 'RECEBER', valor: 15000, data_vencimento: '2026-05-10', status: 'ATRASADO', criado_em: '2026-04-20' },
        ];
        let contas: any[] = lsGet(KEY, SEED);

        const idMatch = url.match(/\/financeiro\/contas\/([a-zA-Z0-9_-]+)$/);
        if (idMatch && method === 'put') {
          const idx = contas.findIndex(c => c.id === idMatch[1]);
          if (idx !== -1) { contas[idx] = { ...contas[idx], ...parsedData }; lsSet(KEY, contas); }
          return ok(contas[idx]);
        }
        if (idMatch && method === 'delete') {
          contas = contas.filter(c => c.id !== idMatch[1]);
          lsSet(KEY, contas);
          return ok({ success: true });
        }
        if (method === 'get') return ok({ contas });
        if (method === 'post') {
          const nova = { id: Date.now().toString(), status: 'PENDENTE', criado_em: new Date().toISOString(), ...parsedData };
          contas.push(nova);
          lsSet(KEY, contas);
          return ok(nova);
        }
      }

      // Gestão de Custos — formato correto: AtendimentoCusto[]
      if (url.includes('/custos')) {
        if (url.includes('/calculo-atendimento')) {
          const atendimentos: any[] = lsGet('inove_custos_atend_mock', SEED_CUSTOS_ATEND);
          const id = url.split('/').pop();
          const found = atendimentos.find(a => a.id === id);
          const custo = found ? found.custoTotal : parseFloat((Math.random() * 200 + 100).toFixed(2));
          return ok({ atendimentoId: id, custo_total: custo, detalhes: found?.custos });
        }
        if (method === 'get') {
          const atendimentos: any[] = lsGet('inove_custos_atend_mock', SEED_CUSTOS_ATEND);
          return ok(atendimentos);
        }
      }

      // Integração Bancária
      if (url.includes('/banco')) {
        if (url.endsWith('/conciliacao') && method === 'get') {
          return ok({ status: 'OK', data: 'Conciliação bancária simulada para o período de 01/05 a 20/05.', transacoes_pendentes: 5, transacoes_conciliadas: 25 });
        }
        if (url.endsWith('/gerar-boleto') && method === 'post') {
          const { valor, pagador } = parsedData;
          return ok({ message: `Boleto de R$ ${valor} gerado com sucesso para ${pagador}.`, codigo_barras: `34191.00000 00000.000000 00000.000000 9 00000000000000`, link_pagamento: `https://banco.com/boleto/${Date.now()}` });
        }
        if (url.endsWith('/gerar-pix') && method === 'post') {
          const { valor, pagador } = parsedData;
          return ok({ message: `PIX de R$ ${valor} gerado com sucesso para ${pagador}.`, qr_code: 'base64_image_data_mock', chave_copia_cola: '00020126330014BR.GOV.BCB.PIX011112345678901' });
        }
      }

      // DRE de Unidade
      if (url.includes('/dre') && method === 'get') {
        return ok({
          periodo: 'Maio/2026',
          receitas: { consultas_particulares: 15000, convenios: 45000, outras_receitas: 2000, total: 62000 },
          despesas: { salarios: 25000, aluguel: 5000, insumos: 8000, outras_despesas: 3000, total: 41000 },
          lucro_liquido: 21000
        });
      }
    }

    // ── 15. Faturamento Hospitalar ─────────────────────────
    if (url.includes('/faturamento')) {
      if (url.includes('/tabelas')) {
        const KEY = 'inove_tabelas_mock';
        let tabelas: any[] = lsGet(KEY, SEED_TABELAS);
        const idMatch = url.match(/\/tabelas\/([a-zA-Z0-9_-]+)$/);

        // POST /faturamento/tabelas/:id/itens
        const itemMatch = url.match(/\/tabelas\/([a-zA-Z0-9_-]+)\/itens$/);
        if (itemMatch && method === 'post') {
          const idx = tabelas.findIndex(t => t.id === itemMatch[1]);
          if (idx !== -1) {
            const novoItem = { id: `i${Date.now()}`, ...parsedData };
            if (!Array.isArray(tabelas[idx].itens)) tabelas[idx].itens = [];
            tabelas[idx].itens.push(novoItem);
            lsSet(KEY, tabelas);
            return ok(novoItem);
          }
        }

        if (idMatch && method === 'put') {
          const idx = tabelas.findIndex(t => t.id === idMatch[1]);
          if (idx !== -1) { tabelas[idx] = { ...tabelas[idx], ...parsedData }; lsSet(KEY, tabelas); }
          return ok(tabelas[idx]);
        }
        if (idMatch && method === 'delete') { tabelas = tabelas.filter(t => t.id !== idMatch[1]); lsSet(KEY, tabelas); return ok({ success: true }); }
        if (method === 'get') return ok({ tabelas });
        if (method === 'post') { const n = { id: `t${Date.now()}`, ativo: true, ...parsedData }; tabelas.push(n); lsSet(KEY, tabelas); return ok(n); }
      }
      if (url.includes('/guias')) {
        const KEY = 'inove_guias_mock';
        let guias: any[] = lsGet(KEY, SEED_GUIAS);
        const idMatch = url.match(/\/guias\/([a-zA-Z0-9_-]+)$/);
        if (idMatch && method === 'put') {
          const idx = guias.findIndex(g => g.id === idMatch[1]);
          if (idx !== -1) { guias[idx] = { ...guias[idx], ...parsedData }; lsSet(KEY, guias); }
          return ok(guias[idx]);
        }
        if (idMatch && method === 'delete') { guias = guias.filter(g => g.id !== idMatch[1]); lsSet(KEY, guias); return ok({ success: true }); }
        if (method === 'get') return ok({ guias });
        if (method === 'post') { const n = { id: `g${Date.now()}`, status: 'PENDENTE', data_emissao: new Date().toISOString().split('T')[0], ...parsedData }; guias.push(n); lsSet(KEY, guias); return ok(n); }
      }
      if (url.includes('/lotes')) {
        const KEY = 'inove_lotes_mock';
        let lotes: any[] = lsGet(KEY, SEED_LOTES);
        if (method === 'get') return ok({ lotes });
        if (method === 'post') { const n = { id: `l${Date.now()}`, status: 'CRIADO', ...parsedData }; lotes.push(n); lsSet(KEY, lotes); return ok(n); }
      }
      if (url.includes('/glosas')) {
        const KEY = 'inove_glosas_mock';
        let glosas: any[] = lsGet(KEY, SEED_GLOSAS);
        const idMatch = url.match(/\/glosas\/([a-zA-Z0-9_-]+)$/);
        if (idMatch && method === 'put') {
          const idx = glosas.findIndex(g => g.id === idMatch[1]);
          if (idx !== -1) { glosas[idx] = { ...glosas[idx], ...parsedData }; lsSet(KEY, glosas); }
          return ok(glosas[idx]);
        }
        if (method === 'get') return ok({ glosas });
        if (method === 'post') { const n = { id: `gl${Date.now()}`, status: 'PENDENTE', data: new Date().toISOString().split('T')[0], ...parsedData }; glosas.push(n); lsSet(KEY, glosas); return ok(n); }
      }

      // --- Lançamentos de Consumo (Procedimentos/Materiais) ---
      if (url.includes('/faturamento/lancamentos')) {
        const KEY = 'inove_faturamento_lancamentos_mock';
        let lancamentos = lsGet<any[]>(KEY, []);

        // GET /faturamento/lancamentos?atendimento_id=...
        if (method === 'get') {
          const params = new URLSearchParams(url.split('?')[1]);
          const atendimentoId = params.get('atendimento_id');
          if (atendimentoId) {
            return ok({ lancamentos: lancamentos.filter(l => l.atendimento_id === atendimentoId) });
          }
          return ok({ lancamentos });
        }

        // POST /faturamento/lancamentos
        if (method === 'post') {
          const novo = {
            id: `lan-${Date.now()}`,
            faturado_por: 'Admin',
            criado_em: new Date().toISOString(),
            ...parsedData
          };
          lancamentos.push(novo);
          lsSet(KEY, lancamentos);
          return ok(novo);
        }

        // DELETE /faturamento/lancamentos/:id
        const idMatch = url.match(/\/faturamento\/lancamentos\/([a-zA-Z0-9_-]+)$/);
        if (idMatch && method === 'delete') {
          lancamentos = lancamentos.filter(l => l.id !== idMatch[1]);
          lsSet(KEY, lancamentos);
          return ok({ success: true });
        }
      }
    }

    // ── 16. Laboratório ────────────────────────────────────
    if (url.includes('/laboratorio/exames')) {
      const KEY = 'inove_exames_mock';
      let exames: any[] = lsGet(KEY, [
        { id: '1', paciente_id: '1', medico_id: 'mock-1', procedimentos: ['Hemograma Completo'], status: 'SOLICITADO', data_solicitacao: new Date().toISOString() }
      ]);

      if (url.endsWith('/pendentes')) return ok({ exames: exames.filter((e: any) => e.status === 'SOLICITADO') });
      if (url.endsWith('/solicitar') && method === 'post') {
        const novo = { id: Date.now().toString(), status: 'SOLICITADO', data_solicitacao: new Date().toISOString(), ...parsedData };
        exames.push(novo);
        lsSet(KEY, exames);
        return ok(novo);
      }
      const idMatch = url.match(/\/exames\/([a-zA-Z0-9_-]+)\/(coletar|laudo)$/);
      if (idMatch) {
        const action = idMatch[2];
        const idx = exames.findIndex((e: any) => e.id === idMatch[1]);
        if (idx !== -1) {
          exames[idx].status = action === 'coletar' ? 'COLETADO' : 'LAUDADO';
          if (action === 'laudo') exames[idx].laudo = parsedData.laudo;
          lsSet(KEY, exames);
          return ok(exames[idx]);
        }
      }
    }

    // ── 17. BI e Relatórios ────────────────────────────────
    if (url.includes('/relatorios/bi')) {
      const medicos = lsGet('inove_medicos_mock', SEED_MEDICOS);
      const enfermeiros = lsGet('inove_enfermeiros_mock', SEED_ENFERMEIROS);
      const totalAtivos = medicos.filter((m: any) => m.ativo).length + enfermeiros.filter((e: any) => e.ativo).length;

      return ok({
        total_profissionais_ativos: totalAtivos,
        atendimentos_mes: [450, 520, 610, 480], // Pode ser dinamizado futuramente
        tempo_medio_espera: '18 min',
        produtividade_equipe: [
          { profissional: 'Dr. Carlos Eduardo', atendimentos: 145, tempo_medio: '15min', satisfacao: 4.8 },
          { profissional: 'Dra. Ana Paula', atendimentos: 132, tempo_medio: '18min', satisfacao: 4.9 },
          { profissional: 'Dr. Marcos Vinícius', atendimentos: 98, tempo_medio: '22min', satisfacao: 4.7 },
          { profissional: 'Enf. Clarice Santos', atendimentos: 210, tempo_medio: '10min', satisfacao: 4.6 },
        ],
        consumo_insumos_abc: [
          { id: '1', nome: 'Luva Nitrílica M', categoria: 'A', consumo: 1500, custo_total: 4800.00, percentual: 70 },
          { id: '2', nome: 'Dipirona Sódica', categoria: 'A', consumo: 3000, custo_total: 1050.00, percentual: 15 },
          { id: '3', nome: 'Soro Fisiológico', categoria: 'B', consumo: 800, custo_total: 3840.00, percentual: 10 },
          { id: '4', nome: 'Seringa 10ml', categoria: 'C', consumo: 5000, custo_total: 2250.00, percentual: 4 },
          { id: '5', nome: 'Gaze Estéril', categoria: 'C', consumo: 10000, custo_total: 500.00, percentual: 1 },
        ]
      });
    }

    // ── 404 ────────────────────────────────────────────────
    return Promise.reject({
      response: {
        status: 404,
        data: { message: `Rota Mock não encontrada: ${method?.toUpperCase() || ''} ${url}` }
      }
    });
  };
}

// ============================================================
// Interceptor de Requisição — Adiciona Token JWT
// ============================================================
api.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem('hospital-auth-storage');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const token = parsed?.state?.token;

        // No Supabase, o token de autenticação deve ser enviado no Header Authorization
        // e a apikey (anon key) também deve estar presente (já configurada no create)
        if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
      } catch { /* ignore */ }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// Interceptor de Resposta — Tratamento global de erros
// ============================================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.response?.data?.error;

    if (status === 401) {
      localStorage.removeItem('hospital-auth-storage');
      toast.error('Sessão expirada. Faça login novamente.');
      window.location.href = '/login';
    } else if (status === 403) {
      toast.error('Acesso negado. Você não tem permissão para esta ação.');
    } else if (status === 404) {
      toast.error(message || 'Recurso não encontrado.');
    } else if (status === 422 || status === 400) {
      toast.error(message || 'Dados inválidos. Verifique os campos e tente novamente.');
    } else if (status && status >= 500) {
      toast.error('Erro interno do servidor. Tente novamente mais tarde.');
    } else if (!error.response) {
      toast.error('Sem conexão com o servidor. Verifique sua internet.');
    }

    return Promise.reject(error);
  }
);