import { describe, it, expect } from 'vitest';
import { tissValidator } from '../services/tissValidator';

describe('Validador TISS (Regras de Negócio e Estrutura)', () => {

    it('deve aprovar um XML TISS válido', () => {
        const xmlValido = `<?xml version="1.0" encoding="ISO-8859-1"?>
        <ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas">
            <ans:cabecalho>
                <ans:origem>
                    <ans:identificacaoPrestador>
                        <ans:codigoPrestadorNaOperadora>04232442000114</ans:codigoPrestadorNaOperadora>
                    </ans:identificacaoPrestador>
                </ans:origem>
            </ans:cabecalho>
            <ans:prestadorParaOperadora>
                <ans:loteGuias>
                    <ans:guiasTISS>
                        <ans:guiaSP-SADT>
                            <ans:cabecalhoGuia>
                                <ans:registroANS>368253</ans:registroANS>
                            </ans:cabecalhoGuia>
                            <ans:dadosBeneficiario>
                                <ans:numeroCarteira>0DVNF000203009</ans:numeroCarteira>
                            </ans:dadosBeneficiario>
                            <ans:dadosSolicitante>
                                <ans:profissionalSolicitante>
                                    <ans:numeroConselhoProfissional>40609</ans:numeroConselhoProfissional>
                                    <ans:UF>SP</ans:UF>
                                </ans:profissionalSolicitante>
                            </ans:dadosSolicitante>
                            <ans:valorTotal>
                                <ans:valorProcedimentos>150.00</ans:valorProcedimentos>
                                <ans:valorTotalGeral>150.00</ans:valorTotalGeral>
                            </ans:valorTotal>
                        </ans:guiaSP-SADT>
                    </ans:guiasTISS>
                </ans:loteGuias>
            </ans:prestadorParaOperadora>
        </ans:mensagemTISS>`;

        const result = tissValidator.validateXML(xmlValido);
        expect(result.valido).toBe(true);
        expect(result.erros.length).toBe(0);
    });

    it('deve rejeitar um XML com erro matemático na soma dos valores (valorTotalGeral vs valorProcedimentos)', () => {
        // Simulando que procedimentos foi 100.00 mas o total geral foi 150.00
        const xmlInvalido = `<?xml version="1.0" encoding="ISO-8859-1"?>
        <ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas">
            <ans:cabecalho>
                <ans:origem>
                    <ans:identificacaoPrestador>
                        <ans:codigoPrestadorNaOperadora>04232442000114</ans:codigoPrestadorNaOperadora>
                    </ans:identificacaoPrestador>
                </ans:origem>
            </ans:cabecalho>
            <ans:prestadorParaOperadora>
                <ans:loteGuias>
                    <ans:guiasTISS>
                        <ans:guiaSP-SADT>
                            <ans:cabecalhoGuia>
                                <ans:registroANS>368253</ans:registroANS>
                                <ans:numeroGuiaPrestador>9999</ans:numeroGuiaPrestador>
                            </ans:cabecalhoGuia>
                            <ans:dadosBeneficiario>
                                <ans:numeroCarteira>0DVNF000203009</ans:numeroCarteira>
                            </ans:dadosBeneficiario>
                            <ans:dadosSolicitante>
                                <ans:profissionalSolicitante>
                                    <ans:numeroConselhoProfissional>40609</ans:numeroConselhoProfissional>
                                    <ans:UF>SP</ans:UF>
                                </ans:profissionalSolicitante>
                            </ans:dadosSolicitante>
                            <ans:valorTotal>
                                <ans:valorProcedimentos>100.00</ans:valorProcedimentos>
                                <ans:valorTotalGeral>150.00</ans:valorTotalGeral>
                            </ans:valorTotal>
                        </ans:guiaSP-SADT>
                    </ans:guiasTISS>
                </ans:loteGuias>
            </ans:prestadorParaOperadora>
        </ans:mensagemTISS>`;

        const result = tissValidator.validateXML(xmlInvalido);
        expect(result.valido).toBe(false);
        expect(result.erros[0]).toContain('Erro Matemático na Guia 9999');
        expect(result.erros[0]).toContain('não bate com o Valor Total Geral');
    });

    it('deve rejeitar CNPJ do prestador ou Registro ANS com tamanhos incorretos', () => {
        const xmlInvalido = `<?xml version="1.0" encoding="ISO-8859-1"?>
        <ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas">
            <ans:cabecalho>
                <ans:origem>
                    <ans:identificacaoPrestador>
                        <ans:codigoPrestadorNaOperadora>123</ans:codigoPrestadorNaOperadora> <!-- Invalido (não tem 14) -->
                    </ans:identificacaoPrestador>
                </ans:origem>
            </ans:cabecalho>
            <ans:prestadorParaOperadora>
                <ans:loteGuias>
                    <ans:guiasTISS>
                        <ans:guiaSP-SADT>
                            <ans:cabecalhoGuia>
                                <ans:registroANS>123</ans:registroANS> <!-- Invalido (não tem 6) -->
                            </ans:cabecalhoGuia>
                            <ans:dadosBeneficiario>
                                <ans:numeroCarteira>0DVNF000203009</ans:numeroCarteira>
                            </ans:dadosBeneficiario>
                            <ans:dadosSolicitante>
                                <ans:profissionalSolicitante>
                                    <ans:numeroConselhoProfissional>40609</ans:numeroConselhoProfissional>
                                    <ans:UF>SP</ans:UF>
                                </ans:profissionalSolicitante>
                            </ans:dadosSolicitante>
                            <ans:valorTotal>
                                <ans:valorProcedimentos>150.00</ans:valorProcedimentos>
                                <ans:valorTotalGeral>150.00</ans:valorTotalGeral>
                            </ans:valorTotal>
                        </ans:guiaSP-SADT>
                    </ans:guiasTISS>
                </ans:loteGuias>
            </ans:prestadorParaOperadora>
        </ans:mensagemTISS>`;

        const result = tissValidator.validateXML(xmlInvalido);
        expect(result.valido).toBe(false);
        expect(result.erros.some(e => e.includes('Registro ANS'))).toBe(true);
        expect(result.erros.some(e => e.includes('CNPJ do prestador'))).toBe(true);
    });

    it('deve rejeitar guias sem carteira de beneficiário ou conselho profissional', () => {
        const xmlInvalido = `<?xml version="1.0" encoding="ISO-8859-1"?>
        <ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas">
            <ans:cabecalho>
                <ans:origem>
                    <ans:identificacaoPrestador>
                        <ans:codigoPrestadorNaOperadora>04232442000114</ans:codigoPrestadorNaOperadora>
                    </ans:identificacaoPrestador>
                </ans:origem>
            </ans:cabecalho>
            <ans:prestadorParaOperadora>
                <ans:loteGuias>
                    <ans:guiasTISS>
                        <ans:guiaSP-SADT>
                            <ans:cabecalhoGuia>
                                <ans:registroANS>368253</ans:registroANS>
                            </ans:cabecalhoGuia>
                            <ans:dadosBeneficiario>
                                <ans:numeroCarteira></ans:numeroCarteira> <!-- Vazio -->
                            </ans:dadosBeneficiario>
                            <ans:dadosSolicitante>
                                <ans:profissionalSolicitante>
                                    <ans:numeroConselhoProfissional></ans:numeroConselhoProfissional> <!-- Vazio -->
                                    <ans:UF>S</ans:UF> <!-- 1 char só -->
                                </ans:profissionalSolicitante>
                            </ans:dadosSolicitante>
                            <ans:valorTotal>
                                <ans:valorProcedimentos>150.00</ans:valorProcedimentos>
                                <ans:valorTotalGeral>150.00</ans:valorTotalGeral>
                            </ans:valorTotal>
                        </ans:guiaSP-SADT>
                    </ans:guiasTISS>
                </ans:loteGuias>
            </ans:prestadorParaOperadora>
        </ans:mensagemTISS>`;

        const result = tissValidator.validateXML(xmlInvalido);
        expect(result.valido).toBe(false);
        expect(result.erros.some(e => e.includes('Número do Conselho do Profissional'))).toBe(true);
        expect(result.erros.some(e => e.includes('Número da Carteira'))).toBe(true);
        expect(result.erros.some(e => e.includes('UF do Conselho'))).toBe(true);
    });
});
