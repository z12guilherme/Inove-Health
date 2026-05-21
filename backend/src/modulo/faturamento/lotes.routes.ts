import { Router, Request, Response } from 'express';

const router = Router();

// Gera um lote TISS (Mock XML) e faz o download
router.post('/gerar-xml', (req: Request, res: Response) => {
    const { convenio, mesAno } = req.body;

    const xmlMock = `<?xml version="1.0" encoding="ISO-8859-1"?>
<ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas">
    <ans:cabecalho>
        <ans:identificacaoTransacao>
            <ans:tipoTransacao>ENVIO_LOTE_GUIAS</ans:tipoTransacao>
            <ans:sequencialTransacao>${Math.floor(Math.random() * 100000)}</ans:sequencialTransacao>
            <ans:dataRegistroTransacao>${new Date().toISOString().split('T')[0]}</ans:dataRegistroTransacao>
            <ans:horaRegistroTransacao>${new Date().toISOString().split('T')[1].substring(0,8)}</ans:horaRegistroTransacao>
        </ans:identificacaoTransacao>
        <ans:origem>
            <ans:identificacaoPrestador>
                <ans:CNPJ>12345678000199</ans:CNPJ>
            </ans:identificacaoPrestador>
        </ans:origem>
        <ans:destino>
            <ans:registroANS>123456</ans:registroANS>
        </ans:destino>
        <ans:VersaoPadrao>3.05.00</ans:VersaoPadrao>
    </ans:cabecalho>
    <ans:prestadorParaOperadora>
        <ans:loteGuias>
            <ans:numeroLote>2026${Math.floor(Math.random() * 1000)}</ans:numeroLote>
            <ans:guiasTISS>
                <!-- Omitido as guias detalhadas no mock -->
                <ans:guiaConsulta>...</ans:guiaConsulta>
            </ans:guiasTISS>
        </ans:loteGuias>
    </ans:prestadorParaOperadora>
    <ans:epilogo>
        <ans:hash>A1B2C3D4E5F6G7H8</ans:hash>
    </ans:epilogo>
</ans:mensagemTISS>`;

    res.json({
        sucesso: true,
        nomeArquivo: `LOTE_TISS_${convenio?.replace(/ /g, '_')}_${mesAno}.xml`,
        conteudoXmlBase64: Buffer.from(xmlMock).toString('base64'),
        totalGuias: Math.floor(Math.random() * 50) + 10,
        valorTotalLote: (Math.random() * 10000).toFixed(2)
    });
});

export default router;
