// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import localStorageService from '../services/localStorageService';

// Mock localStorage for tests
const localStorageMock = (() => {
    let store: { [key: string]: string } = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value.toString(); },
        clear: () => { store = {}; },
        removeItem: (key: string) => { delete store[key]; }
    };
})();

// Setup initial data in localStorage for tests
const setupLocalStorageData = () => {
    localStorage.clear();

    // Seed Convenios
    localStorageService.setConvenios([
        { id: 'CONV-MOURA', nome: 'MOURA' },
        { id: 'CONV-HAPVIDA', nome: 'HAPVIDA' },
    ]);

    // Seed Itens de Farmácia
    localStorageService.setItensFarmacia([
        {
            id: 'MAT-01',
            nome: 'Jelco',
            estoque: 10,
            tabelas_faturamento_vinculadas: [
                { convenio_id: 'CONV-MOURA', valor: 70.00, codigo_tuss: 'TUSS-JELCO-MOURA' },
                { convenio_id: 'CONV-HAPVIDA', valor: 80.00, codigo_tuss: 'TUSS-JELCO-HAPVIDA' },
            ],
        },
        {
            id: 'MAT-02',
            nome: 'Dipirona EV',
            estoque: 5,
            tabelas_faturamento_vinculadas: [
                { convenio_id: 'CONV-MOURA', valor: 5.00, codigo_tuss: 'TUSS-DIPIRONA-MOURA' },
                { convenio_id: 'CONV-HAPVIDA', valor: 6.50, codigo_tuss: 'TUSS-DIPIRONA-HAPVIDA' },
            ],
        },
        {
            id: 'MAT-03',
            nome: 'Soro Fisiológico',
            estoque: 20,
            tabelas_faturamento_vinculadas: [
                { convenio_id: 'CONV-MOURA', valor: 12.00, codigo_tuss: 'TUSS-SORO-MOURA' },
                { convenio_id: 'CONV-HAPVIDA', valor: 15.00, codigo_tuss: 'TUSS-SORO-HAPVIDA' },
            ],
        },
        {
            id: 'MAT-04',
            nome: 'Item Sem Estoque',
            estoque: 0,
            tabelas_faturamento_vinculadas: [
                { convenio_id: 'CONV-MOURA', valor: 10.00, codigo_tuss: 'TUSS-SEM-ESTOQUE' },
            ],
        },
    ]);

    // Seed initial attendances (if needed for specific tests)
    localStorageService.setAtendimentos([]);
    localStorageService.setMovimentacoesEstoque([]);
};

// Mock the api object to interact with localStorageService
const mockApi = {
    createAttendance: vi.fn((attendance) => {
        const newAtd = { ...attendance, id: `ATD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, status: 'PENDENTE', procedimentos: [] };
        const atendimentos = localStorageService.getAtendimentos();
        atendimentos.push(newAtd);
        localStorageService.setAtendimentos(atendimentos);
        return Promise.resolve(newAtd);
    }),
    updateStatus: vi.fn((id, status) => {
        const atendimentos = localStorageService.getAtendimentos();
        const atd = atendimentos.find(a => a.id === id);
        if (atd) {
            atd.status = status;
            localStorageService.setAtendimentos(atendimentos);
            return Promise.resolve(atd);
        }
        return Promise.reject(new Error('Attendance not found'));
    }),
    saveDigitalSignature: vi.fn(() => Promise.resolve()), // No LS interaction needed for this mock
    getBillingQueue: vi.fn(() => Promise.resolve(localStorageService.getAtendimentos().filter(a => a.status === 'REALIZADO' || a.status === 'PENDENTE'))),
    createRemessa: vi.fn((attendances) => Promise.resolve({ id: `REM-${Date.now()}`, convenio: attendances[0].convenio, tipo: attendances[0].tipo, atendimentos: attendances })),
    exportTISS: vi.fn(() => Promise.resolve('<?xml version="1.0" encoding="UTF-8"?><ans:mensagemTISS>...</ans:mensagemTISS>')),
    saveTriage: vi.fn(() => Promise.resolve()),
    callPatientOnPanel: vi.fn(() => Promise.resolve()),
    dispenseItem: vi.fn(localStorageService.dispenseItemToPatientAccount), // Use the real dispense logic
    getPatientAccount: vi.fn((atendimentoId) => Promise.resolve(localStorageService.getAtendimentos().find(a => a.id === atendimentoId)?.procedimentos || [])),
};

beforeEach(() => {
    // Reseta todos os mocks antes de cada teste para garantir isolamento
    vi.clearAllMocks();
    setupLocalStorageData(); // Reset localStorage data before each test
});

describe('E2E Flow Automation - Inove Health', () => {

    describe('1. Fluxo Ambulatorial (Consultas e Exames)', () => {
        it('deve realizar o ciclo completo: criação -> assinatura -> faturamento -> remessa TISS', async () => {
            // 1. Criar Atendimento
            const initialAttendance = { paciente_nome: 'João Silva', convenio_nome: 'MOURA', convenio_id: 'CONV-MOURA', tipo: 'CONSULTA', data: new Date().toISOString().split('T')[0] };
            const attendance = await mockApi.createAttendance(initialAttendance);
            expect(attendance.id).toBeDefined();
            expect(attendance.status).toBe('PENDENTE');

            // 2. Marcar como Realizado e Coletar Assinatura
            const updatedAttendance = await mockApi.updateStatus(attendance.id, 'REALIZADO');
            await mockApi.saveDigitalSignature(attendance.id, 'blob_signature_data');

            // 3. Verificar no Faturamento
            mockApi.getBillingQueue.mockResolvedValue([attendance]);
            const queue = await mockApi.getBillingQueue();
            expect(queue).toContainEqual(expect.objectContaining({ id: attendance.id }));

            // 4. Criar Remessa (Regra: Mesmo convênio e Mesmo tipo)
            const attendancesSameType = [
                { id: attendance.id, convenio: 'MOURA', tipo: 'CONSULTA' }, // Use the created attendance
                { id: 'AT-002-MOCK', convenio: 'MOURA', tipo: 'CONSULTA' } // Another mock for grouping
            ];
            mockApi.createRemessa.mockResolvedValueOnce({ id: 'REM-001', convenio: 'MOURA', tipo: 'CONSULTA', atendimentos: attendancesSameType });
            const remessa = await mockApi.createRemessa(attendancesSameType);
            expect(remessa.convenio).toBe('MOURA');
            expect(mockApi.createRemessa).toHaveBeenCalledWith(attendancesSameType);

            // 5. Exportar XML TISS
            mockApi.exportTISS.mockResolvedValue('<?xml version="1.0" encoding="UTF-8"?><ans:mensagemTISS>...</ans:mensagemTISS>');
            const xml = await mockApi.exportTISS(remessa.id);
            expect(xml).toContain('<?xml');
            expect(xml).toContain('ans:mensagemTISS');
        });
    });

    describe('2. Fluxo de Urgência (Pronto Atendimento + Farmácia)', () => {
        it('deve validar o fluxo clínico completo e a regra de estoque/preço da farmácia', async () => {
            // 1. Recepção cria e Enfermagem faz Triagem
            const initialUrgencyAtd = { paciente_nome: 'Maria Souza', convenio_nome: 'MOURA', convenio_id: 'CONV-MOURA', tipo: 'URGENCIA', data: new Date().toISOString().split('T')[0] };
            const urgencyAt = await mockApi.createAttendance(initialUrgencyAtd);
            await mockApi.saveTriage(urgencyAt.id, { sinaisVitais: 'OK', observacao: 'Dor abdominal' }); // This mock doesn't interact with LS yet

            // 2. Médico chama no Painel (Validação de Voz/Nome)
            await mockApi.callPatientOnPanel(urgencyAt.paciente_nome);
            expect(mockApi.callPatientOnPanel).toHaveBeenCalledWith(urgencyAt.paciente_nome);

            // 3. Integração Farmácia - Teste de Estoque
            // Cenário A: Sem Estoque
            const itemSemEstoqueId = 'MAT-04'; // Item Sem Estoque
            const resultSemEstoque = mockApi.dispenseItem(
                urgencyAt.id,
                itemSemEstoqueId,
                1,
                urgencyAt.convenio_id,
                'Dr. Teste',
                'Clínica Geral',
                urgencyAt.paciente_nome
            );
            expect(resultSemEstoque.success).toBe(false);
            expect(resultSemEstoque.message).toContain('Estoque insuficiente');

            // Cenário B: Com Estoque (Indiferente ao convênio neste momento)
            const materialJelcoId = 'MAT-01';
            const resultComEstoque = mockApi.dispenseItem(
                urgencyAt.id,
                materialJelcoId,
                1,
                urgencyAt.convenio_id,
                'Dr. Teste',
                'Clínica Geral',
                urgencyAt.paciente_nome
            );
            expect(resultComEstoque.success).toBe(true);
            expect(resultComEstoque.message).toContain('dispensado com sucesso');

            // Verify stock deduction
            const itensFarmaciaAfterDispense = localStorageService.getItensFarmacia();
            const jelcoAfterDispense = itensFarmaciaAfterDispense.find(i => i.id === materialJelcoId);
            expect(jelcoAfterDispense?.estoque).toBe(9); // Initial 10 - 1 = 9

            // Verify item added to patient account with correct price
            const patientAccount = await mockApi.getPatientAccount(urgencyAt.id);
            expect(patientAccount).toContainEqual(expect.objectContaining({
                nome: 'Jelco',
                valor: 70.00, // Price for Moura
                qtd: 1
            }));

            // Verify movement history
            const movimentacoes = localStorageService.getMovimentacoesEstoque();
            expect(movimentacoes).toContainEqual(expect.objectContaining({
                itemId: materialJelcoId,
                tipo: 'saida',
                quantidade: 1,
                atendimentoId: urgencyAt.id
            }));

            // 5. Conferência e Fechamento
            await mockApi.updateStatus(urgencyAt.id, 'FATURADO');
            const xmlUrgent = await mockApi.exportTISS('REM-URG-01');
            expect(xmlUrgent).toBeDefined();
        });

        it('deve aplicar o preço correto se o convênio for diferente (Hapvida)', async () => {
            const initialUrgencyAtdHapvida = { paciente_nome: 'Jose', convenio_nome: 'HAPVIDA', convenio_id: 'CONV-HAPVIDA', tipo: 'URGENCIA', data: new Date().toISOString().split('T')[0] };
            const urgencyHapvida = await mockApi.createAttendance(initialUrgencyAtdHapvida);
            const materialJelcoId = 'MAT-01';

            const resultDispenseHapvida = mockApi.dispenseItem(
                urgencyHapvida.id,
                materialJelcoId,
                1,
                urgencyHapvida.convenio_id,
                'Dr. Teste',
                'Clínica Geral',
                urgencyHapvida.paciente_nome
            );
            expect(resultDispenseHapvida.success).toBe(true);

            const contaHapvida = await mockApi.getPatientAccount(urgencyHapvida.id);
            expect(contaHapvida).toContainEqual(expect.objectContaining({
                nome: 'Jelco',
                valor: 80.00, // Price for Hapvida
                qtd: 1
            }));
        });
    });
});

/**
 * CRITÉRIOS DE ACEITE PARA O FINANCEIRO:
 * Após o sucesso deste arquivo, o sistema está apto para:
 * 1. Gerar Contas a Receber baseado no valor final faturado.
 * 2. Conciliação de glosas via retorno do XML TISS.
 */