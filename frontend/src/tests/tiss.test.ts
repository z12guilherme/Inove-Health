import { describe, it, expect } from 'vitest';
import { generateTissXml } from '../services/tissXmlGenerator';
import md5 from 'md5';

describe('Gerador TISS XML e Validação de Hash', () => {
    it('Deve gerar um XML válido e o Hash MD5 deve bater exato com o conteúdo da tag prestadorParaOperadora', () => {
        const mockLote = {
            id: 'lote-123',
            numero_lote: '1234',
            convenio_id: 'conv-1',
            convenio_nome: 'UNIMED',
            tipo_guia: 'CONSULTA' as const,
            atendimentos_ids: ['atd-1'],
            data_criacao: new Date().toISOString(),
            status: 'GERADO' as const
        };

        const mockAtendimento = {
            id: 'atd-1',
            data: '2026-05-22T10:00:00.000Z',
            numero_guia: 'G-12345',
            tipo: 'CONSULTA',
            procedimentos: [
                { codigo: '10101012', nome: 'CONSULTA EM CONSULTORIO', valor: 150.00, qtd: 1, codigo_tabela: '22' }
            ]
        };

        // Gerar o XML
        const xml = generateTissXml(mockLote, [mockAtendimento]);

        // O hash gerado deve estar na tag <ans:hash>
        const hashMatch = xml.match(/<ans:hash>(.*?)<\/ans:hash>/);
        expect(hashMatch).not.toBeNull();
        const hashInjected = hashMatch![1];

        // Extrair o bloco que a ANS vai ler usando RegExp estrito
        const startTag = '<ans:prestadorParaOperadora>';
        const endTag = '</ans:prestadorParaOperadora>';
        const startIndex = xml.indexOf(startTag) + startTag.length;
        const endIndex = xml.indexOf(endTag);
        
        const extractedContent = xml.substring(startIndex, endIndex);

        // Calcular o MD5 esperado usando a mesma rotina de um validador puro (sem converter ou mudar CRLF)
        // Pois assumimos que a string gerada JÁ está em CRLF devido ao tissXmlGenerator.ts
        const expectedHash = md5(extractedContent);

        // O hash injetado TEM que ser igual ao hash da string exata entre as tags
        expect(hashInjected).toBe(expectedHash);

        // O XML não deve conter datas com formato T00:00
        expect(xml).not.toContain('T10:00:00.000Z');
        expect(xml).toContain('2026-05-22');

        // A tag nomeContratado não deve existir na guiaConsulta
        expect(xml).not.toContain('<ans:nomeContratado>');
        expect(xml).toContain('<ans:CNES>');
    });
});
