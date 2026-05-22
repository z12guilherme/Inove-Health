// frontend/src/services/localStorageService.ts

export interface LoteTiss {
    id: string;
    numero_lote: string;
    convenio_id: string;
    convenio_nome: string;
    tipo_guia: string; // 'CONSULTA' | 'SADT' | 'INTERNAMENTO'
    data_criacao: string;
    atendimentos_ids: string[];
    status: 'GERADO' | 'LOTE_FECHADO';
    protocolo_operadora?: string;
    xml_gerado?: string;
}

interface Atendimento {
    id: string;
    data: string;
    paciente_nome: string;
    convenio_nome: string;
    tipo: string;
    status: string;
    valor_total?: number; // Optional, as it's calculated
    numero_guia?: string;
    procedimentos?: {
        data: string;
        codigo: string;
        nome: string;
        bilateral: boolean;
        qtd: number;
        especialidade: string;
        profissional: string;
        valor: number;
    }[];
    // ... other attendance properties
}

interface ItemFarmacia {
    id: string;
    nome: string;
    estoque: number;
    tabelas_faturamento_vinculadas: {
        convenio_id: string;
        valor: number;
        codigo_tuss?: string;
    }[];
    // ... other item properties
}

interface Convenio {
    id: string;
    nome: string;
    tabelas_vinculadas?: { tabela_id: string; nome: string }[];
    // ... other convenio properties
}

interface TabelaPreco {
    id: string;
    nome?: string;
    convenio?: string;
    tipo: string;
    vigencia_inicio?: string;
    vigencia_fim?: string;
    ativo?: boolean;
    itens: { codigo: string; descricao: string; valor: number }[];
}

interface MovimentacaoEstoque {
    id: string;
    timestamp: string;
    tipo: 'entrada' | 'saida' | 'ajuste';
    itemId: string;
    itemName: string;
    quantidade: number;
    atendimentoId?: string;
    pacienteNome?: string;
    observacao?: string;
}

const LS_KEYS = {
    ATENDIMENTOS: 'atendimentos',
    ITENS_FARMACIA: 'itens_farmacia',
    CONVENIOS: 'convenios',
    MOVIMENTACOES_ESTOQUE: 'movimentacoes_estoque',
    PROFISSIONAIS: 'profissionais', // Assuming professionals are also in LS
    UNIDADES_SAUDE: 'unidades_saude', // Assuming units are also in LS
    TABELAS: 'tabelas_precos',
    LOTES_TISS: 'lotes_tiss',
};

const localStorageService = {
    // --- Atendimentos ---
    getAtendimentos: (): Atendimento[] => {
        const stored = localStorage.getItem(LS_KEYS.ATENDIMENTOS);
        return stored ? JSON.parse(stored) : [];
    },
    setAtendimentos: (atendimentos: Atendimento[]) => {
        localStorage.setItem(LS_KEYS.ATENDIMENTOS, JSON.stringify(atendimentos));
    },
    updateAtendimento: (updatedAtd: Atendimento) => {
        const atendimentos = localStorageService.getAtendimentos();
        const index = atendimentos.findIndex(a => a.id === updatedAtd.id);
        if (index !== -1) {
            atendimentos[index] = updatedAtd;
            localStorageService.setAtendimentos(atendimentos);
        } else {
            // If not found, add it (e.g., for new attendances)
            atendimentos.push(updatedAtd);
            localStorageService.setAtendimentos(atendimentos);
        }
    },

    // --- Itens de Farmácia ---
    getItensFarmacia: (): ItemFarmacia[] => {
        const stored = localStorage.getItem(LS_KEYS.ITENS_FARMACIA);
        return stored ? JSON.parse(stored) : [];
    },
    setItensFarmacia: (itens: ItemFarmacia[]) => {
        localStorage.setItem(LS_KEYS.ITENS_FARMACIA, JSON.stringify(itens));
    },

    // --- Convênios ---
    getConvenios: (): Convenio[] => {
        const stored = localStorage.getItem(LS_KEYS.CONVENIOS);
        return stored ? JSON.parse(stored) : [];
    },
    setConvenios: (convenios: Convenio[]) => {
        localStorage.setItem(LS_KEYS.CONVENIOS, JSON.stringify(convenios));
    },

    // --- Movimentações de Estoque ---
    getMovimentacoesEstoque: (): MovimentacaoEstoque[] => {
        const stored = localStorage.getItem(LS_KEYS.MOVIMENTACOES_ESTOQUE);
        return stored ? JSON.parse(stored) : [];
    },
    setMovimentacoesEstoque: (movimentacoes: MovimentacaoEstoque[]) => {
        localStorage.setItem(LS_KEYS.MOVIMENTACOES_ESTOQUE, JSON.stringify(movimentacoes));
    },
    addMovimentacaoEstoque: (mov: Omit<MovimentacaoEstoque, 'id' | 'timestamp'>) => {
        const movimentacoes = localStorageService.getMovimentacoesEstoque();
        const newMov: MovimentacaoEstoque = {
            id: `MOV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            ...mov,
        };
        movimentacoes.push(newMov);
        localStorage.setItem(LS_KEYS.MOVIMENTACOES_ESTOQUE, JSON.stringify(movimentacoes));
    },

    // --- Profissionais ---
    getProfissionais: (): any[] => { // Using 'any' for now, can define Profissional interface later
        const stored = localStorage.getItem(LS_KEYS.PROFISSIONAIS);
        return stored ? JSON.parse(stored) : [];
    },
    setProfissionais: (profissionais: any[]) => {
        localStorage.setItem(LS_KEYS.PROFISSIONAIS, JSON.stringify(profissionais));
    },

    // --- Unidades de Saúde ---
    getUnidadesSaude: (): any[] => { // Using 'any' for now, can define Unidade interface later
        const stored = localStorage.getItem(LS_KEYS.UNIDADES_SAUDE);
        return stored ? JSON.parse(stored) : [];
    },
    setUnidadesSaude: (unidades: any[]) => {
        localStorage.setItem(LS_KEYS.UNIDADES_SAUDE, JSON.stringify(unidades));
    },

    // --- Tabelas de Preços ---
    getTabelas: (): TabelaPreco[] => {
        const stored = localStorage.getItem(LS_KEYS.TABELAS);
        return stored ? JSON.parse(stored) : [];
    },
    setTabelas: (tabelas: TabelaPreco[]) => {
        localStorage.setItem(LS_KEYS.TABELAS, JSON.stringify(tabelas));
    },

    // --- Lotes TISS ---
    getLotesTiss: (): LoteTiss[] => {
        const stored = localStorage.getItem(LS_KEYS.LOTES_TISS);
        return stored ? JSON.parse(stored) : [];
    },
    setLotesTiss: (lotes: LoteTiss[]) => {
        localStorage.setItem(LS_KEYS.LOTES_TISS, JSON.stringify(lotes));
    },
    updateLoteTiss: (updatedLote: LoteTiss) => {
        const lotes = localStorageService.getLotesTiss();
        const index = lotes.findIndex(l => l.id === updatedLote.id);
        if (index !== -1) {
            lotes[index] = updatedLote;
            localStorageService.setLotesTiss(lotes);
        } else {
            lotes.push(updatedLote);
            localStorageService.setLotesTiss(lotes);
        }
    },

    // --- SIMULAÇÃO DE DISPENSA DA FARMÁCIA ---
    dispenseItemToPatientAccount: (
        atendimentoId: string,
        itemId: string,
        quantidade: number,
        convenioId: string,
        profissionalExecutante: string,
        especialidadeExecutante: string,
        pacienteNome: string
    ): { success: boolean; message: string } => {
        const itensFarmacia = localStorageService.getItensFarmacia();
        const atendimentos = localStorageService.getAtendimentos();

        const item = itensFarmacia.find(i => i.id === itemId);
        if (!item) {
            return { success: false, message: 'Item de farmácia não encontrado.' };
        }
        if (item.estoque < quantidade) {
            return { success: false, message: `Estoque insuficiente para ${item.nome}. Disponível: ${item.estoque}` };
        }

        const atendimentoIndex = atendimentos.findIndex(a => a.id === atendimentoId);
        if (atendimentoIndex === -1) {
            return { success: false, message: 'Atendimento não encontrado.' };
        }

        const convenioPrice = item.tabelas_faturamento_vinculadas.find(
            tf => tf.convenio_id === convenioId
        );

        const valorUnitario = convenioPrice ? convenioPrice.valor : 0; // Default to 0 if no specific price table found

        // Deduct from stock
        item.estoque -= quantidade;
        localStorageService.setItensFarmacia(itensFarmacia);

        // Add to patient's procedures
        const currentAtendimento = atendimentos[atendimentoIndex];
        if (!currentAtendimento.procedimentos) {
            currentAtendimento.procedimentos = [];
        }
        currentAtendimento.procedimentos.push({
            data: new Date().toISOString().split('T')[0], // Current date
            codigo: convenioPrice?.codigo_tuss || item.id, // Use TUSS code if available, else item ID
            nome: item.nome,
            bilateral: false, // Assuming false for dispensed items unless specified
            qtd: quantidade,
            especialidade: especialidadeExecutante,
            profissional: profissionalExecutante,
            valor: valorUnitario,
        });
        localStorageService.setAtendimentos(atendimentos);

        // Record movement history
        localStorageService.addMovimentacaoEstoque({
            tipo: 'saida',
            itemId: item.id,
            itemName: item.nome,
            quantidade: quantidade,
            atendimentoId: atendimentoId,
            pacienteNome: pacienteNome,
            observacao: `Dispensado para atendimento ${atendimentoId} (${pacienteNome})`,
        });

        return { success: true, message: `${item.nome} dispensado com sucesso para ${pacienteNome}.` };
    },
};

export default localStorageService;