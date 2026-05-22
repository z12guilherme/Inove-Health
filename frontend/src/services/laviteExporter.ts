import axios from 'axios';

interface LaviteExportParams {
    remessaId: string;
    authenticityToken: string; // Extraído do <meta content="..." name="csrf-token" />
    sessionId: string;
    versaoTiss?: string;
    codigoHospital?: string;
}

/**
 * Serviço para buscar o XML gerado diretamente do sistema Lavite.
 * Nota: Esta chamada geralmente precisa passar por um proxy devido ao CORS.
 */
export const fetchXmlFromLavite = async ({
    remessaId,
    authenticityToken,
    sessionId,
    versaoTiss = '4.01.00',
    codigoHospital = '110000334'
}: LaviteExportParams): Promise<string> => {
    const url = `https://hsf.lavitesaude.com/faturamento/remessas/${remessaId}/exportador`;

    const formData = new URLSearchParams();
    // Parâmetros obrigatórios conforme o HTML do formulário capturado
    formData.append('utf8', '✓');
    formData.append('authenticity_token', authenticityToken);
    formData.append('tiss_exportacao[remessa_id]', remessaId);
    formData.append('remessa_id', remessaId);
    formData.append('tiss_exportacao[versao_tiss]', versaoTiss);
    formData.append('tiss_exportacao[tipo_transacao]', 'envio_lotes');
    formData.append('tiss_exportacao[codigo_hospital]', codigoHospital);
    formData.append('tiss_exportacao[como_cnpj]', '0');

    // Prestador para (0 = Hospital, 1 = Profissional)
    formData.append('tiss_exportacao[prestador_para_profissional]', '0');
    formData.append('prestador_profissional_nome', '');
    formData.append('tiss_exportacao[prestador_profissional_id]', '');

    // Contratado Executante para (0 = Hospital, 1 = Profissional)
    formData.append('tiss_exportacao[contratado_executante_para_profissional]', '0');
    formData.append('contratado_executante_profissional_nome', '');
    formData.append('tiss_exportacao[contratado_executante_profissional_id]', '');

    formData.append('tiss_exportacao[outro_estabelecimento_id]', '');

    // No HTML existe um segundo input de tipo_transacao que é hidden e vazio
    formData.append('tiss_exportacao[tipo_transacao]', '');

    try {
        const response = await axios.post(url, formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': `_session_id=${sessionId}`,
                // Alguns servidores Rails verificam o Referer e o User-Agent
                'Referer': `https://hsf.lavitesaude.com/faturamento/remessas/${remessaId}/exportador/novo`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
            },
            responseType: 'text'
        });

        // O Lavite pode retornar um redirecionamento ou o XML direto. 
        // Se retornar o XML, ele estará no response.data
        return response.data;
    } catch (error) {
        console.error('Erro ao exportar XML do Lavite:', error);
        throw new Error('Falha na comunicação com o gerador externo.');
    }
};