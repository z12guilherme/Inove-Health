export interface ValidationResult {
    valido: boolean;
    erros: string[];
}

export const tissValidator = {
    validateXML(xmlString: string): ValidationResult {
        const erros: string[] = [];
        
        // 1. Parsing the XML
        let xmlDoc: Document;
        try {
            const parser = new DOMParser();
            xmlDoc = parser.parseFromString(xmlString, "text/xml");
            const parseError = xmlDoc.getElementsByTagName("parsererror");
            if (parseError.length > 0) {
                return { valido: false, erros: ['XML Malformado: ' + parseError[0].textContent] };
            }
        } catch (err: any) {
            return { valido: false, erros: ['Falha ao parsear XML: ' + err.message] };
        }

        // Helper para extrair valores
        const getText = (tagName: string, index: number = 0) => {
            const nodes = xmlDoc.getElementsByTagName(tagName);
            return nodes.length > index ? nodes[index].textContent || '' : null;
        };

        const getAllTexts = (tagName: string) => {
            const nodes = xmlDoc.getElementsByTagName(tagName);
            return Array.from(nodes).map(n => n.textContent || '');
        };

        // 2. Regras de Cabeçalho e Operadora
        const registroANS = getText("ans:registroANS");
        if (registroANS && registroANS.length !== 6) {
            erros.push(`O Registro ANS da operadora deve conter exatamente 6 dígitos (Atual: ${registroANS.length}).`);
        }

        const cnpjPrestador = getText("ans:codigoPrestadorNaOperadora");
        if (cnpjPrestador && cnpjPrestador.length !== 14) {
            erros.push(`O CNPJ do prestador (codigoPrestadorNaOperadora) deve conter exatamente 14 dígitos.`);
        }

        // 3. Regras de Valores (Soma de guias)
        // Procurar por guias SADT e Internacao que possuem ans:valorTotal
        const valorTotalGeralNodes = xmlDoc.getElementsByTagName("ans:valorTotalGeral");
        
        // A tag ans:valorTotalGeral pode aparecer em SADT ou Internação
        Array.from(valorTotalGeralNodes).forEach((node, index) => {
            const parent = node.parentElement; // ans:valorTotal
            if (parent) {
                const proc = parseFloat(parent.getElementsByTagName("ans:valorProcedimentos")[0]?.textContent || '0');
                const diarias = parseFloat(parent.getElementsByTagName("ans:valorDiarias")[0]?.textContent || '0');
                const taxas = parseFloat(parent.getElementsByTagName("ans:valorTaxasAlugueis")[0]?.textContent || '0');
                const mats = parseFloat(parent.getElementsByTagName("ans:valorMateriais")[0]?.textContent || '0');
                const meds = parseFloat(parent.getElementsByTagName("ans:valorMedicamentos")[0]?.textContent || '0');
                const opme = parseFloat(parent.getElementsByTagName("ans:valorOPME")[0]?.textContent || '0');
                const gases = parseFloat(parent.getElementsByTagName("ans:valorGasesMedicinais")[0]?.textContent || '0');

                const totalGeralInformado = parseFloat(node.textContent || '0');
                
                // Soma matemática exigida pela ANS
                const somaCalculada = parseFloat((proc + diarias + taxas + mats + meds + opme + gases).toFixed(2));

                if (Math.abs(totalGeralInformado - somaCalculada) > 0.01) {
                    const numeroGuia = getText("ans:numeroGuiaPrestador", index) || "Desconhecida";
                    erros.push(`Erro Matemático na Guia ${numeroGuia}: A soma dos itens (${somaCalculada}) não bate com o Valor Total Geral informado (${totalGeralInformado}).`);
                }
            }
        });

        // 4. Regras do Profissional Executante / Solicitante
        const conselhos = getAllTexts("ans:numeroConselhoProfissional");
        conselhos.forEach(c => {
            if (!c || c.trim() === '') {
                erros.push('Número do Conselho do Profissional não pode estar em branco.');
            }
        });

        const ufs = getAllTexts("ans:UF");
        ufs.forEach(uf => {
            if (uf && uf.length !== 2) {
                erros.push('A UF do Conselho Profissional deve ter 2 caracteres.');
            }
        });

        // 5. Regras de Identificação do Beneficiário
        const carteiras = getAllTexts("ans:numeroCarteira");
        carteiras.forEach((c, i) => {
            if (!c || c.trim() === '') {
                erros.push(`A Guia (índice ${i}) possui o campo Número da Carteira em branco.`);
            }
        });

        return {
            valido: erros.length === 0,
            erros
        };
    }
};
