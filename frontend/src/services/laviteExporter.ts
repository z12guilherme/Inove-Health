import axios from 'axios';

interface LaviteExportParams {
    remessaId: string;
    authenticityToken: string;
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
    formData.append('utf8', '✓');
    formData.append('authenticity_token', authenticityToken);
    formData.append('tiss_exportacao[remessa_id]', remessaId);
    formData.append('remessa_id', remessaId);
    formData.append('tiss_exportacao[versao_tiss]', versaoTiss);
    formData.append('tiss_exportacao[tipo_transacao]', 'envio_lotes');
    formData.append('tiss_exportacao[codigo_hospital]', codigoHospital);
    formData.append('tiss_exportacao[como_cnpj]', '0');
    formData.append('tiss_exportacao[prestador_para_profissional]', '0');
    formData.append('tiss_exportacao[contratado_executante_para_profissional]', '0');

    // Campos adicionais mapeados do request original para garantir fidelidade total
    formData.append('prestador_profissional_nome', '');
    formData.append('tiss_exportacao[prestador_profissional_id]', '');
    formData.append('contratado_executante_profissional_nome', '');
    formData.append('tiss_exportacao[contratado_executante_profissional_id]', '');
    formData.append('tiss_exportacao[outro_estabelecimento_id]', '');
    formData.append('tiss_exportacao[tipo_transacao]', ''); // Segundo parâmetro de transação vazio conforme o log

    try {
        const response = await axios.post(url, formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': `_session_id=${sessionId}`
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