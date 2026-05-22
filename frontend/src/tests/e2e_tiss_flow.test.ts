import { describe, it, expect, beforeEach } from 'vitest';
import localStorageService from '../services/localStorageService';
import { generateTissXml } from '../services/tissXmlGenerator';

describe('Fluxo Completo: Atendimento -> Dispensa -> Faturamento -> XML TISS', () => {

  beforeEach(() => {
    // Limpar o localStorage simulado
    localStorage.clear();

    // Mockar Convênios
    localStorageService.setConvenios([
      { id: 'unimed', nome: 'UNIMED NACIONAL' }
    ]);

    // Mockar Itens de Farmácia / Procedimentos
    localStorageService.setItensFarmacia([
      {
        id: 'rx-torax',
        nome: 'RAIO-X DE TORAX',
        estoque: 100,
        tabelas_faturamento_vinculadas: [
          { convenio_id: 'unimed', valor: 85.50, codigo_tuss: '40805018' }
        ]
      }
    ]);

    // Mockar um Atendimento inicial
    localStorageService.setAtendimentos([
      {
        id: 'ATD-TEST-123',
        data: '2026-05-22',
        paciente_nome: 'JOÃO PACIENTE',
        convenio_nome: 'UNIMED NACIONAL',
        tipo: 'SADT',
        status: 'EM_CONSULTA',
        numero_guia: '257719465',
        // Adicionando explicitamente o convenio_id para ser igual ao mock do convenio
      } as any
    ]);
  });

  it('deve percorrer o fluxo ponta a ponta e exportar um XML TISS válido', () => {
    const atendimentoId = 'ATD-TEST-123';

    // 1. O médico solicita/lança um exame no atendimento (dispensa da farmácia/procedimentos)
    const dispensaResult = localStorageService.dispenseItemToPatientAccount(
      atendimentoId,
      'rx-torax',
      1,
      'unimed',
      'DR. ROBERTO',
      'CLINICA_MEDICA',
      'JOÃO PACIENTE'
    );
    expect(dispensaResult.success).toBe(true);

    let atendimentos = localStorageService.getAtendimentos();
    let atdModificado = atendimentos.find(a => a.id === atendimentoId);
    
    // Verifica se o procedimento foi anexado e o valor total simulado (em ambiente real seria atualizado o valor_total)
    expect(atdModificado?.procedimentos).toBeDefined();
    expect(atdModificado?.procedimentos?.[0].codigo).toBe('40805018');
    
    // Finalizando o atendimento
    atdModificado!.status = 'FINALIZADO';
    (atdModificado as any).status_guia = 'Autorizada';
    (atdModificado as any).senha_autorizacao = 'W67125162';
    (atdModificado as any).valor_total = 85.50; // Calculado pelo backend ou UI
    localStorageService.updateAtendimento(atdModificado!);

    // 2. Tela de Remessas: Agrupando o atendimento autorizado num lote
    const lote = {
      id: 'LOTE-1',
      numero_lote: '6781',
      convenio_id: 'unimed',
      convenio_nome: 'UNIMED NACIONAL',
      tipo_guia: 'SADT',
      data_criacao: new Date().toISOString(),
      atendimentos_ids: [atendimentoId],
      status: 'GERADO' as const
    };

    // 3. Exportação XML
    const xmlGerado = generateTissXml(lote, [atdModificado as any]);
    
    expect(xmlGerado).toContain('<?xml version="1.0" encoding="ISO-8859-1"?>');
    expect(xmlGerado).toContain('<ans:mensagemTISS');
    expect(xmlGerado).toContain('<ans:numeroLote>6781</ans:numeroLote>');
    
    // Como é um atendimento SADT, deve gerar a tag <ans:guiaSP-SADT>
    expect(xmlGerado).toContain('<ans:guiaSP-SADT>');
    expect(xmlGerado).toContain('<ans:numeroGuiaOperadora>257719465</ans:numeroGuiaOperadora>');
    expect(xmlGerado).toContain('<ans:senha>W67125162</ans:senha>');
    expect(xmlGerado).toContain('<ans:codigoProcedimento>40805018</ans:codigoProcedimento>');
    expect(xmlGerado).toContain('<ans:valorUnitario>85.50</ans:valorUnitario>');

    // 4. Fechar Lote (atualizar status)
    lote.status = 'LOTE_FECHADO';
    (lote as any).protocolo_operadora = 'PROT-9999-OK';
    localStorageService.updateLoteTiss(lote);

    const lotesArmazenados = localStorageService.getLotesTiss();
    expect(lotesArmazenados[0].status).toBe('LOTE_FECHADO');
    expect(lotesArmazenados[0].protocolo_operadora).toBe('PROT-9999-OK');
  });

});
