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
      const role = parsedData.email?.includes('admin') ? 'ADMINISTRADOR_PRINCIPAL' : 'MEDICO';
      return ok({
        user: { id: 'mock-1', nome: role === 'MEDICO' ? 'Dr. Roberto' : 'Administrador', email: parsedData.email, papel: role },
        token: 'mock-jwt-token-123'
      });
    }

    // 2. Mock Dashboard Admin (Devolve Arrays vazios apenas para popular os contadores)
    if (url.includes('/unidades-saude')) return ok(Array(12).fill({}));
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

    return Promise.reject({ response: { status: 404, data: { message: `Rota Mock não encontrada: ${method.toUpperCase()} ${url}` } } });
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