import axios from 'axios';
import toast from 'react-hot-toast';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://sistema-hospitalar.onrender.com/api',
});

// MODO MOCK LOCAL: Ative (true) para rodar o sistema salvando tudo no LocalStorage, sem precisar do backend/Supabase.
const USE_MOCK = true;

if (USE_MOCK) {
  api.defaults.adapter = async (config) => {
    const url = config.url || '';
    const method = config.method?.toLowerCase();

    let parsedData: any = {};
    try { parsedData = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {}); } catch { }

    // Simula delay de rede (500ms) para as telas apresentarem os Loadings
    await new Promise(resolve => setTimeout(resolve, 500));

    const ok = (responseData: any) => ({
      data: responseData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      request: {}
    });

    // 1. Mock Login (Aceita qualquer coisa, admin loga como Admin)
    if (url.includes('/auth/login') && method === 'post') {
      // LÓGICA DE MOCK ATUALIZADA:
      // Se o e-mail não tiver 'medico' ou 'enfermeiro', o sistema te loga como ADMIN.
      let role: 'ADMIN' | 'MEDICO' | 'ENFERMEIRO' = 'ADMIN';

      if (parsedData.email?.toLowerCase().includes('medico')) {
        role = 'MEDICO';
      } else if (parsedData.email?.toLowerCase().includes('enfermeiro')) {
        role = 'ENFERMEIRO';
      }

      const nomeExibicao = role === 'ADMIN' ? 'Dr. Roberto (Admin)' : role === 'ENFERMEIRO' ? 'Enf. Clarice' : 'Dr. Roberto';

      return ok({
        user: { 
          id: 'mock-1', 
          name: nomeExibicao, 
          nome: nomeExibicao, 
          email: parsedData.email, 
          role: role, 
          papel: role 
        },
        token: 'mock-jwt-token-123'
      });
    }

    // 2. Mock Dashboard Admin (Devolve Arrays vazios apenas para popular os contadores)
    //if (url.includes('/unidades-saude')) return ok(Array(12).fill({}));
    if (url.includes('/medicos')) return ok(Array(80).fill({}));
    if (url.includes('/enfermeiros')) return ok(Array(68).fill({}));
    if (url.includes('/ia/relatorios')) return ok({ relatorios: [] });

    // 3. Mock CRUD de Pacientes (Salvando no LocalStorage)
    if (url.includes('/pacientes')) {
      const stored = localStorage.getItem('inove_pacientes_mock');
      let pacientes = stored ? JSON.parse(stored) : [
        { id: '1', nome: 'Maria Silva Costa', data_nascimento: '1979-05-12', sexo: 'F', cpf: '111.222.333-44', status: 'Em Atendimento', risco: 'amarelo' },
        { id: '2', nome: 'João Pedro Alves', data_nascimento: '1995-10-23', sexo: 'M', cpf: '555.666.777-88', status: 'Aguardando Triagem', risco: 'verde' }
      ];

      // Sub-rota: Histórico Clínico do Paciente
      if (url.match(/\/pacientes\/([a-zA-Z0-9_-]+)\/historico/)) {
        const id = url.split('/')[2];
        const triagens = JSON.parse(localStorage.getItem('inove_triagens_mock') || '[]');
        const consultas = JSON.parse(localStorage.getItem('inove_consultas_mock') || '[]');
        const prescricoes = JSON.parse(localStorage.getItem('inove_prescricoes_mock') || '[]');
        return ok({
          triagens: triagens.filter((t: any) => t.paciente_id === id),
          consultas: consultas.filter((c: any) => c.paciente_id === id),
          prescricoes: prescricoes.filter((p: any) => p.paciente_id === id)
        });
      }

      // Sub-rota: Perfil do Paciente by ID
      if (url.match(/\/pacientes\/([a-zA-Z0-9_-]+)$/) && method === 'get') {
        const id = url.split('/')[2];
        return ok({ paciente: pacientes.find((p: any) => p.id === id) || {} });
      }

      if (method === 'get') return ok({ pacientes });

      if (method === 'post') {
        const novo = { id: Date.now().toString(), status: 'Aguardando Triagem', criado_em: new Date().toISOString(), ...parsedData };
        pacientes.push(novo);
        localStorage.setItem('inove_pacientes_mock', JSON.stringify(pacientes));
        return ok(novo);
      }
    }

    // 4. Mock Triagens
    if (url.includes('/triagens')) {
      const stored = localStorage.getItem('inove_triagens_mock');
      let triagens = stored ? JSON.parse(stored) : [];

      if (method === 'get' && url.includes('/pacientes/')) {
        const id = url.split('/').pop();
        return ok({ triagens: triagens.filter((t: any) => t.paciente_id === id) });
      }
      if (method === 'post') {
        const nova = { id: Date.now().toString(), criado_em: new Date().toISOString(), ...parsedData };
        triagens.push(nova);
        localStorage.setItem('inove_triagens_mock', JSON.stringify(triagens));

        // Atualiza risco e status do paciente globalmente
        const storedPac = localStorage.getItem('inove_pacientes_mock');
        if (storedPac) {
          let pacs = JSON.parse(storedPac);
          let pIndex = pacs.findIndex((p: any) => p.id === parsedData.paciente_id);
          if (pIndex !== -1) {
            pacs[pIndex].risco = parsedData.classificacao_risco;
            pacs[pIndex].status = 'Aguardando Atendimento';
            localStorage.setItem('inove_pacientes_mock', JSON.stringify(pacs));
          }
        }
        return ok(nova);
      }
    }

    // 5. Mock Consultas
    if (url.includes('/consultas')) {
      const stored = localStorage.getItem('inove_consultas_mock');
      let consultas = stored ? JSON.parse(stored) : [];

      if (method === 'get' && url.includes('/pacientes/')) {
        const id = url.split('/').pop();
        return ok({ consultas: consultas.filter((c: any) => c.paciente_id === id) });
      }
      if (method === 'post') {
        const nova = { id: Date.now().toString(), criado_em: new Date().toISOString(), ...parsedData };
        consultas.push(nova);
        localStorage.setItem('inove_consultas_mock', JSON.stringify(consultas));

        // Atualiza status do paciente para Atendido
        const storedPac = localStorage.getItem('inove_pacientes_mock');
        if (storedPac) {
          let pacs = JSON.parse(storedPac);
          let pIndex = pacs.findIndex((p: any) => p.id === parsedData.paciente_id);
          if (pIndex !== -1) {
            pacs[pIndex].status = 'Atendido';
            localStorage.setItem('inove_pacientes_mock', JSON.stringify(pacs));
          }
        }
        return ok(nova);
      }
    }

    // 6. Mock Prescrições e Prontuários
    if (url.includes('/prescricoes') || url.includes('/prontuarios')) {
      const isProntuario = url.includes('/prontuarios');
      const storeKey = isProntuario ? 'inove_prontuarios_mock' : 'inove_prescricoes_mock';
      const stored = localStorage.getItem(storeKey);
      let items = stored ? JSON.parse(stored) : [];

      if (url.endsWith('/pdf')) {
        return ok(new Blob(["PDF Simulado - Inove Health"], { type: 'application/pdf' }));
      }

      if (method === 'get' && url.includes('/pacientes/')) {
        const id = url.split('/')[3];
        return ok({ [isProntuario ? 'prontuarios' : 'prescricoes']: items.filter((i: any) => i.paciente_id === id) });
      }
      if (method === 'post') {
        const nova = { id: Date.now().toString(), criado_em: new Date().toISOString(), ...parsedData };
        items.push(nova);

        // Lógica de Baixa Automática no Mock
        if (!isProntuario && parsedData.medicamentos) {
          const storedInsumos = localStorage.getItem('inove_insumos_mock');
          if (storedInsumos) {
            let insumos = JSON.parse(storedInsumos);
            parsedData.medicamentos.forEach((m: any) => {
              const idx = insumos.findIndex((i: any) => i.nome === m.nome);
              if (idx !== -1) insumos[idx].quantidade_atual = Math.max(0, insumos[idx].quantidade_atual - (m.quantidade || 1));
            });
            localStorage.setItem('inove_insumos_mock', JSON.stringify(insumos));
          }
        }

        localStorage.setItem(storeKey, JSON.stringify(items));
        return ok(nova);
      }
    }

    // 7. Mock IA
    if (url.includes('/ia/paciente/')) {
      return ok({
        analise: "A IA analisou os registros deste paciente e identificou um padrão de recorrência relacionado a picos hipertensivos nas últimas 3 semanas.\n\nRecomendações:\n- Acompanhamento ambulatorial rigoroso.\n- Revisão da dosagem de anti-hipertensivos.\n- Solicitação de exames cardiológicos complementares."
      });
    }

    // 8. Mock Fornecedores
    if (url.includes('/cadastros/fornecedores')) {
      const storeKey = 'inove_fornecedores_mock';
      const stored = localStorage.getItem(storeKey);
      let fornecedores = stored ? JSON.parse(stored) : [
        { id: '1', razao_social: 'MedPharma Distribuidora Ltda', nome_fantasia: 'MedPharma', cnpj: '12.345.678/0001-90', email: 'vendas@medpharma.com.br', telefone: '(11) 3456-7890', endereco: 'Av. Paulista, 1500 - São Paulo/SP', categoria: 'MEDICAMENTOS', ativo: true, criado_em: '2025-01-15' },
        { id: '2', razao_social: 'HospMat Materiais Hospitalares S.A.', nome_fantasia: 'HospMat', cnpj: '98.765.432/0001-10', email: 'contato@hospmat.com.br', telefone: '(21) 2345-6789', endereco: 'Rua da Saúde, 200 - Rio de Janeiro/RJ', categoria: 'MATERIAIS_HOSPITALARES', ativo: true, criado_em: '2025-02-20' },
        { id: '3', razao_social: 'ProteVida EPIs e Segurança Ltda', nome_fantasia: 'ProteVida', cnpj: '11.222.333/0001-44', email: 'comercial@protevida.com', telefone: '(31) 9876-5432', endereco: 'Rod. BR-040, Km 12 - Belo Horizonte/MG', categoria: 'EPI', ativo: true, criado_em: '2025-03-10' },
        { id: '4', razao_social: 'LabSupply Insumos Laboratoriais', nome_fantasia: 'LabSupply', cnpj: '44.555.666/0001-77', email: 'lab@labsupply.com.br', telefone: '(41) 3333-4444', endereco: 'Rua dos Cientistas, 88 - Curitiba/PR', categoria: 'LABORATORIO', ativo: true, criado_em: '2025-04-05' },
      ];

      // Handle specific ID routes (PUT/DELETE)
      const idMatch = url.match(/\/cadastros\/fornecedores\/([a-zA-Z0-9_-]+)$/);
      if (idMatch && method === 'put') {
        const idx = fornecedores.findIndex((f: any) => f.id === idMatch[1]);
        if (idx !== -1) { fornecedores[idx] = { ...fornecedores[idx], ...parsedData }; localStorage.setItem(storeKey, JSON.stringify(fornecedores)); }
        return ok(fornecedores[idx]);
      }
      if (idMatch && method === 'delete') {
        fornecedores = fornecedores.filter((f: any) => f.id !== idMatch[1]);
        localStorage.setItem(storeKey, JSON.stringify(fornecedores));
        return ok({ success: true });
      }

      if (method === 'get') return ok({ fornecedores });
      if (method === 'post') {
        const novo = { id: Date.now().toString(), ativo: true, criado_em: new Date().toISOString(), ...parsedData };
        fornecedores.push(novo);
        localStorage.setItem(storeKey, JSON.stringify(fornecedores));
        return ok(novo);
      }
    }

    // 9. Mock Convênios
    if (url.includes('/cadastros/convenios')) {
      const storeKey = 'inove_convenios_mock';
      const stored = localStorage.getItem(storeKey);
      let convenios = stored ? JSON.parse(stored) : [
        { id: '1', nome: 'Unimed Nacional', registro_ans: '354801', tipo: 'COOPERATIVA', email: 'credenciamento@unimed.com.br', telefone: '0800 722 0022', cobertura: 'COMPLETO', tabela_preco: 'TISS', ativo: true, criado_em: '2025-01-10' },
        { id: '2', nome: 'Amil Saúde', registro_ans: '326305', tipo: 'PLANO_SAUDE', email: 'redes@amil.com.br', telefone: '0800 202 6001', cobertura: 'AMBULATORIAL_HOSPITALAR', tabela_preco: 'TUSS', ativo: true, criado_em: '2025-01-15' },
        { id: '3', nome: 'SulAmérica Seguros', registro_ans: '006246', tipo: 'SEGURO_SAUDE', email: 'saude@sulamerica.com.br', telefone: '0800 970 0500', cobertura: 'HOSPITALAR', tabela_preco: 'TISS', ativo: true, criado_em: '2025-02-20' },
        { id: '4', nome: 'SUS - Sistema Único de Saúde', registro_ans: 'N/A', tipo: 'SUS', email: 'sas@saude.gov.br', telefone: '136', cobertura: 'COMPLETO', tabela_preco: 'SUS', ativo: true, criado_em: '2025-01-01' },
        { id: '5', nome: 'Bradesco Saúde', registro_ans: '005711', tipo: 'SEGURO_SAUDE', email: 'saude@bradesco.com.br', telefone: '0800 727 9966', cobertura: 'COMPLETO', tabela_preco: 'TUSS', ativo: true, criado_em: '2025-03-05' },
      ];

      const idMatch = url.match(/\/cadastros\/convenios\/([a-zA-Z0-9_-]+)$/);
      if (idMatch && method === 'put') {
        const idx = convenios.findIndex((c: any) => c.id === idMatch[1]);
        if (idx !== -1) { convenios[idx] = { ...convenios[idx], ...parsedData }; localStorage.setItem(storeKey, JSON.stringify(convenios)); }
        return ok(convenios[idx]);
      }
      if (idMatch && method === 'delete') {
        convenios = convenios.filter((c: any) => c.id !== idMatch[1]);
        localStorage.setItem(storeKey, JSON.stringify(convenios));
        return ok({ success: true });
      }

      if (method === 'get') return ok({ convenios });
      if (method === 'post') {
        const novo = { id: Date.now().toString(), ativo: true, criado_em: new Date().toISOString(), ...parsedData };
        convenios.push(novo);
        localStorage.setItem(storeKey, JSON.stringify(convenios));
        return ok(novo);
      }
    }

    // 10. Mock Estoque/Insumos
    if (url.includes('/estoque/insumos')) {
      const storeKey = 'inove_insumos_mock';
      const stored = localStorage.getItem(storeKey);
      let insumos = stored ? JSON.parse(stored) : [
        { id: '1', nome: 'Dipirona Sódica 500mg', codigo: 'MED-001', categoria: 'MEDICAMENTO', unidade_medida: 'CP', quantidade_atual: 2500, quantidade_minima: 500, lote: 'LOT-2026-A01', validade: '2027-06-15', fornecedor_nome: 'MedPharma', preco_unitario: 0.35, localizacao: 'Farmácia Central - Prat. A1', ativo: true, criado_em: '2025-01-10' },
        { id: '2', nome: 'Amoxicilina 875mg', codigo: 'MED-002', categoria: 'MEDICAMENTO', unidade_medida: 'CP', quantidade_atual: 180, quantidade_minima: 200, lote: 'LOT-2026-A02', validade: '2026-12-30', fornecedor_nome: 'MedPharma', preco_unitario: 1.20, localizacao: 'Farmácia Central - Prat. A2', ativo: true, criado_em: '2025-01-10' },
        { id: '3', nome: 'Luva Nitrílica M (cx 100un)', codigo: 'EPI-001', categoria: 'EPI', unidade_medida: 'CX', quantidade_atual: 45, quantidade_minima: 30, lote: 'LOT-2026-E01', validade: '2028-01-01', fornecedor_nome: 'ProteVida', preco_unitario: 32.50, localizacao: 'Almoxarifado - Est. B3', ativo: true, criado_em: '2025-02-15' },
        { id: '4', nome: 'Soro Fisiológico 0.9% 500ml', codigo: 'MAT-001', categoria: 'MATERIAL_HOSPITALAR', unidade_medida: 'FR', quantidade_atual: 8, quantidade_minima: 50, lote: 'LOT-2025-M01', validade: '2026-08-20', fornecedor_nome: 'HospMat', preco_unitario: 4.80, localizacao: 'Farmácia Central - Prat. C1', ativo: true, criado_em: '2025-03-01' },
        { id: '5', nome: 'Seringa Descartável 10ml', codigo: 'DESC-001', categoria: 'DESCARTAVEL', unidade_medida: 'UN', quantidade_atual: 3200, quantidade_minima: 500, lote: 'LOT-2026-D01', validade: '2029-12-31', fornecedor_nome: 'HospMat', preco_unitario: 0.45, localizacao: 'Almoxarifado - Est. A1', ativo: true, criado_em: '2025-03-10' },
        { id: '6', nome: 'Reagente Hemograma Completo', codigo: 'LAB-001', categoria: 'MATERIAL_LABORATORIO', unidade_medida: 'FR', quantidade_atual: 12, quantidade_minima: 10, lote: 'LOT-2026-L01', validade: '2026-07-10', fornecedor_nome: 'LabSupply', preco_unitario: 185.00, localizacao: 'Laboratório - Refrigerador 2', ativo: true, criado_em: '2025-04-05' },
      ];

      // Sub-rota: Alertas de Estoque
      if (url.endsWith('/alertas')) {
        const hoje = new Date();
        const em30Dias = new Date();
        em30Dias.setDate(hoje.getDate() + 30);

        const alertas = insumos.map((i: any) => {
          const dataValidade = new Date(i.validade);
          const critico_estoque = i.quantidade_atual <= i.quantidade_minima;
          const vencido = dataValidade < hoje;
          const vence_proximo = dataValidade >= hoje && dataValidade <= em30Dias;

          if (critico_estoque || vencido || vence_proximo) {
            return {
              ...i,
              status_alerta: {
                estoque_baixo: critico_estoque,
                vencido: vencido,
                vence_proximo: vence_proximo
              }
            };
          }
          return null;
        }).filter((item: any) => item !== null);
        return ok({ alerts: alertas });
      }

      // Sub-rota: Entrada de NF
      if (url.endsWith('/entrada-nf') && method === 'post') {
        if (parsedData.itens) {
          parsedData.itens.forEach((entrada: any) => {
            const idx = insumos.findIndex((i: any) => i.id === entrada.id);
            if (idx !== -1) insumos[idx].quantidade_atual += entrada.quantidade;
          });
          localStorage.setItem(storeKey, JSON.stringify(insumos));
        }
        return ok({ message: 'Entrada processada', insumos });
      }

      // Sub-rota: Inventário
      if (url.endsWith('/inventario') && method === 'post') {
        const idx = insumos.findIndex((i: any) => i.id === parsedData.id);
        if (idx !== -1) {
          insumos[idx].quantidade_atual = parsedData.nova_quantidade;
          localStorage.setItem(storeKey, JSON.stringify(insumos));
        }
        return ok({ message: 'Ajuste concluído', item: insumos[idx] });
      }

      const idMatch = url.match(/\/estoque\/insumos\/([a-zA-Z0-9_-]+)$/);
      if (idMatch && method === 'put') {
        const idx = insumos.findIndex((i: any) => i.id === idMatch[1]);
        if (idx !== -1) { insumos[idx] = { ...insumos[idx], ...parsedData }; localStorage.setItem(storeKey, JSON.stringify(insumos)); }
        return ok(insumos[idx]);
      }
      if (idMatch && method === 'delete') {
        insumos = insumos.filter((i: any) => i.id !== idMatch[1]);
        localStorage.setItem(storeKey, JSON.stringify(insumos));
        return ok({ success: true });
      }

      if (method === 'get') return ok({ insumos });
      if (method === 'post') {
        const novo = { id: Date.now().toString(), ativo: true, criado_em: new Date().toISOString(), ...parsedData };
        insumos.push(novo);
        localStorage.setItem(storeKey, JSON.stringify(insumos));
        return ok(novo);
      }
    }

    // 11. Mock Financeiro
    if (url.includes('/financeiro')) {
      // Contas a Pagar e Receber
      if (url.includes('/contas')) {
        const storeKey = 'inove_contas_mock';
        const stored = localStorage.getItem(storeKey);
        let contas = stored ? JSON.parse(stored) : [
          { id: '1', descricao: 'Aluguel Unidade Central', tipo: 'PAGAR', valor: 5000, data_vencimento: '2026-05-25', status: 'PENDENTE', criado_em: '2026-05-01' },
          { id: '2', descricao: 'Consulta Particular Maria', tipo: 'RECEBER', valor: 300, data_vencimento: '2026-05-20', data_pagamento: '2026-05-19', status: 'PAGO', criado_em: '2026-05-15' },
          { id: '3', descricao: 'Salários Equipe Médica', tipo: 'PAGAR', valor: 25000, data_vencimento: '2026-05-30', status: 'PENDENTE', criado_em: '2026-05-01' },
          { id: '4', descricao: 'Convênio Unimed - Abril', tipo: 'RECEBER', valor: 15000, data_vencimento: '2026-05-10', status: 'ATRASADO', criado_em: '2026-04-20' },
        ];

        const idMatch = url.match(/\/financeiro\/contas\/([a-zA-Z0-9_-]+)$/);
        if (idMatch && method === 'put') {
          const idx = contas.findIndex((c: any) => c.id === idMatch[1]);
          if (idx !== -1) { contas[idx] = { ...contas[idx], ...parsedData }; localStorage.setItem(storeKey, JSON.stringify(contas)); }
          return ok(contas[idx]);
        }
        if (idMatch && method === 'delete') {
          contas = contas.filter((c: any) => c.id !== idMatch[1]);
          localStorage.setItem(storeKey, JSON.stringify(contas));
          return ok({ success: true });
        }

        if (method === 'get') return ok({ contas });
        if (method === 'post') {
          const nova = { id: Date.now().toString(), status: 'PENDENTE', criado_em: new Date().toISOString(), ...parsedData };
          contas.push(nova);
          localStorage.setItem(storeKey, JSON.stringify(contas));
          return ok(nova);
        }
      }

      // Gestão de Custos
      if (url.includes('/custos')) {
        const custos = [
          { id: '1', descricao: 'Custo por Atendimento Médico', valor: 150.75, tipo: 'FIXO', referencia: 'Consulta', criado_em: '2026-01-01' },
          { id: '2', descricao: 'Custo por Exame Laboratorial', valor: 45.20, tipo: 'VARIAVEL', referencia: 'Hemograma', criado_em: '2026-01-01' },
          { id: '3', descricao: 'Custo por Leito/Dia', valor: 320.00, tipo: 'FIXO', referencia: 'Internação', criado_em: '2026-01-01' },
        ];
        if (url.includes('/calculo-atendimento')) {
          const custoTotal = (Math.random() * 200 + 100).toFixed(2);
          return ok({ atendimentoId: url.split('/').pop(), custo_total: parseFloat(custoTotal), detalhes: custos });
        }
        if (method === 'get') return ok({ custos });
      }

      // Integração Bancária
      if (url.includes('/banco')) {
        if (url.endsWith('/conciliacao') && method === 'get') {
          return ok({
            status: 'OK',
            data: 'Conciliação bancária simulada para o período de 01/05 a 20/05.',
            transacoes_pendentes: 5,
            transacoes_conciliadas: 25,
          });
        }
        if (url.endsWith('/gerar-boleto') && method === 'post') {
          const { valor, pagador } = parsedData;
          return ok({
            message: `Boleto de R$ ${valor} gerado com sucesso para ${pagador}.`,
            codigo_barras: `34191.00000 00000.000000 00000.000000 9 00000000000000`,
            link_pagamento: `https://banco.com/boleto/${Date.now()}`,
          });
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
          receitas: {
            consultas_particulares: 15000,
            convenios: 45000,
            outras_receitas: 2000,
            total: 62000,
          },
          despesas: {
            salarios: 25000,
            aluguel: 5000,
            insumos: 8000,
            outras_despesas: 3000,
            total: 41000,
          },
          lucro_liquido: 21000,
        });
      }
    }

    // 12. Mock Faturamento Hospitalar
    if (url.includes('/faturamento')) {
      // Tabelas de Preços
      if (url.includes('/tabelas')) {
        return ok({ tabelas: [] }); // Mock vazio por enquanto
      }
      // Guias de Atendimento
      if (url.includes('/guias')) {
        return ok({ guias: [] }); // Mock vazio por enquanto
      }
      // Fechamento de Lote
      if (url.includes('/lotes')) {
        return ok({ lotes: [] }); // Mock vazio por enquanto
      }
      // Gestão de Glosas
      if (url.includes('/glosas')) {
        return ok({ glosas: [] }); // Mock vazio por enquanto
      }
    }

    // 13. Mock Laboratório
    if (url.includes('/laboratorio/exames')) {
      const storeKey = 'inove_exames_mock';
      const stored = localStorage.getItem(storeKey);
      let exames = stored ? JSON.parse(stored) : [
        { id: '1', paciente_id: '1', medico_id: 'mock-1', procedimentos: ['Hemograma Completo'], status: 'SOLICITADO', data_solicitacao: new Date().toISOString() }
      ];

      if (url.endsWith('/pendentes')) return ok({ exames: exames.filter((e: any) => e.status === 'SOLICITADO') });

      if (url.endsWith('/solicitar') && method === 'post') {
        const novo = { id: Date.now().toString(), status: 'SOLICITADO', data_solicitacao: new Date().toISOString(), ...parsedData };
        exames.push(novo);
        localStorage.setItem(storeKey, JSON.stringify(exames));
        return ok(novo);
      }

      const idMatch = url.match(/\/exames\/([a-zA-Z0-9_-]+)\/(coletar|laudo)$/);
      if (idMatch) {
        const action = idMatch[2];
        const idx = exames.findIndex((e: any) => e.id === idMatch[1]);
        if (idx !== -1) {
          exames[idx].status = action === 'coletar' ? 'COLETADO' : 'LAUDADO';
          if (action === 'laudo') exames[idx].laudo = parsedData.laudo;
          localStorage.setItem(storeKey, JSON.stringify(exames));
          return ok(exames[idx]);
        }
      }
    }

    // 14. Mock BI e Relatórios
    if (url.includes('/relatorios/bi')) {
      return ok({
        atendimentos_mes: [450, 520, 610, 480],
        tempo_medio_espera: '18 min',
        produtividade_equipe: [],
        consumo_insumos_abc: [
          { nome: 'Luva Nitrílica', consumo: 1500, custo: 480.00 },
          { nome: 'Soro Fisiológico', consumo: 800, custo: 320.00 }
        ]
      });
    }

    return Promise.reject({ response: { status: 404, data: { message: `Rota Mock não encontrada: ${method?.toUpperCase() || ''} ${url}` } } });
  };
}

// Interceptor de Requisição: Adiciona o Token JWT
api.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem('hospital-auth-storage');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const token = parsed?.state?.token;
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch { /* ignore parse errors */ }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Resposta: Tratamento global de erros com toasts
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