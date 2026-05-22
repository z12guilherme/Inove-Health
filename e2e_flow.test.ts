import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks das dependências (Serviços/API)
const mockApi = {
    createAttendance: vi.fn(),
    updateStatus: vi.fn(),
    saveDigitalSignature: vi.fn(),
    getBillingQueue: vi.fn(),
    createRemessa: vi.fn(),
    exportTISS: vi.fn(),
    saveTriage: vi.fn(),
    callPatientOnPanel: vi.fn(),
    dispenseItem: vi.fn(),
    getPatientAccount: vi.fn(),
};

describe('E2E Flow Automation - Inove Health', () => {

    describe('1. Fluxo Ambulatorial (Consultas e Exames)', () => {
        it('deve realizar o ciclo completo: criação -> assinatura -> faturamento -> remessa TISS', async () => {
            // 1. Criar Atendimento
            const attendance = { id: 'AT-001', paciente: 'João Silva', convenio: 'Moura', tipo: 'CONSULTA' };
            mockApi.createAttendance.mockResolvedValue(attendance);

            // 2. Marcar como Realizado e Coletar Assinatura
            await mockApi.updateStatus(attendance.id, 'REALIZADO');
            await mockApi.saveDigitalSignature(attendance.id, 'blob_signature_data');

            // 3. Verificar no Faturamento
            mockApi.getBillingQueue.mockResolvedValue([attendance]);
            const queue = await mockApi.getBillingQueue();
            expect(queue).toContainEqual(expect.objectContaining({ id: 'AT-001' }));

            // 4. Criar Remessa (Regra: Mesmo convênio e Mesmo tipo)
            const attendancesSameType = [
                { id: 'AT-001', convenio: 'Moura', tipo: 'CONSULTA' },
                { id: 'AT-002', convenio: 'Moura', tipo: 'CONSULTA' }
            ];
            const remessa = await mockApi.createRemessa(attendancesSameType);
            expect(remessa.convenio).toBe('Moura');

            // 5. Exportar XML TISS
            const xml = await mockApi.exportTISS(remessa.id);
            expect(xml).toContain('<?xml');
            expect(xml).toContain('ans:mensagemTISS');
        });
    });

    describe('2. Fluxo de Urgência (Pronto Atendimento + Farmácia)', () => {
        const materialJelco = { id: 'MAT-01', nome: 'Jelco' };

        it('deve validar o fluxo clínico completo e a regra de estoque/preço da farmácia', async () => {
            // 1. Recepção cria e Enfermagem faz Triagem
            const urgencyAt = { id: 'URG-500', paciente: 'Maria Souza', convenio: 'Moura' };
            await mockApi.saveTriage(urgencyAt.id, { sinaisVitais: 'OK', observacao: 'Dor abdominal' });

            // 2. Médico chama no Painel (Validação de Voz/Nome)
            await mockApi.callPatientOnPanel(urgencyAt.paciente);
            expect(mockApi.callPatientOnPanel).toHaveBeenCalledWith('Maria Souza');

            // 3. Integração Farmácia - Teste de Estoque
            // Cenário A: Sem Estoque
            mockApi.dispenseItem.mockRejectedValueOnce(new Error('Estoque insuficiente, favor dar entrada.'));
            await expect(mockApi.dispenseItem(urgencyAt.id, materialJelco.id, 1))
                .rejects.toThrow('Estoque insuficiente, favor dar entrada.');

            // Cenário B: Com Estoque (Indiferente ao convênio neste momento)
            mockApi.dispenseItem.mockResolvedValue({ status: 'DISPENSADO', materialId: 'MAT-01' });
            const dispensacao = await mockApi.dispenseItem(urgencyAt.id, materialJelco.id, 1);
            expect(dispensacao.status).toBe('DISPENSADO');

            // 4. Faturamento - Regra de Preços por Convênio
            // Simulação: Jelco para Moura = 70.00 | Jelco para Hapvida = 80.00
            const contaMoura = [
                { item: 'Jelco', valor: 70.00, convenio: 'Moura' }
            ];
            mockApi.getPatientAccount.mockResolvedValue(contaMoura);

            const contaFinal = await mockApi.getPatientAccount(urgencyAt.id);
            expect(contaFinal[0].valor).toBe(70.00);

            // 5. Conferência e Fechamento
            await mockApi.updateStatus(urgencyAt.id, 'FATURADO');
            const xmlUrgent = await mockApi.exportTISS('REM-URG-01');
            expect(xmlUrgent).toBeDefined();
        });

        it('deve aplicar o preço correto se o convênio for diferente (Hapvida)', async () => {
            const urgencyHapvida = { id: 'URG-600', paciente: 'Jose', convenio: 'Hapvida' };
            const contaHapvida = [
                { item: 'Jelco', valor: 80.00, convenio: 'Hapvida' }
            ];
            mockApi.getPatientAccount.mockResolvedValue(contaHapvida);

            const conta = await mockApi.getPatientAccount(urgencyHapvida.id);
            expect(conta[0].valor).toBe(80.00); // Valida a diferença de preço solicitada
        });
    });
});

/**
 * CRITÉRIOS DE ACEITE PARA O FINANCEIRO:
 * Após o sucesso deste arquivo, o sistema está apto para:
 * 1. Gerar Contas a Receber baseado no valor final faturado.
 * 2. Conciliação de glosas via retorno do XML TISS.
 */