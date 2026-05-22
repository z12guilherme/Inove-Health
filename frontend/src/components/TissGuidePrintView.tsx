import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export function TissGuidePrintView({ atendimento, onClose }: { atendimento: any, onClose: () => void }) {
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    // Add print class to body when mounted to hide other elements
    document.body.classList.add('printing-tiss');
    
    const timeout = setTimeout(() => {
      setPrinting(true);
      window.print();
      // setTimeout(() => onClose(), 1000); // Opcional fechar após imprimir
    }, 800);

    return () => {
      clearTimeout(timeout);
      document.body.classList.remove('printing-tiss');
    };
  }, []);

  if (!atendimento) return null;

  // Process procedures and expenses
  const procs: any[] = [];
  const desps: any[] = [];
  let sumProcs = 0;
  let sumDesps = 0;
  
  (atendimento.procedimentos || []).forEach((p: any) => {
    const isDesp = ['18', '19', '20', '45', '95', '96', '97', '98', '99'].includes((p.codigo_tabela || '22').split(' - ')[0]);
    if (isDesp) {
      desps.push(p);
      sumDesps += (p.valor * (p.qtd || 1));
    } else {
      procs.push(p);
      sumProcs += (p.valor * (p.qtd || 1));
    }
  });

  return (
    <div className="fixed inset-0 bg-white z-[9999] overflow-y-auto tiss-print-container text-black text-[10px] leading-tight font-sans pb-20">
      
      {/* Botões ocultos na impressão */}
      <div className="fixed top-4 right-4 flex gap-2 print:hidden z-50">
        <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded font-bold shadow-lg">Imprimir Novamente</button>
        <button onClick={onClose} className="bg-red-600 text-white p-2 rounded shadow-lg"><X size={20} /></button>
      </div>

      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            .tiss-print-container, .tiss-print-container * { visibility: visible; }
            .tiss-print-container { position: absolute; left: 0; top: 0; width: 100%; }
            @page { size: A4 portrait; margin: 5mm; }
            .page-break { page-break-before: always; }
          }
          .tiss-table { width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 5px; }
          .tiss-table th, .tiss-table td { border: 1px solid #000; padding: 2px 4px; text-align: left; vertical-align: top; }
          .tiss-bg-gray { background-color: #e5e7eb !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .tiss-title { font-size: 14px; font-weight: bold; text-align: center; text-transform: uppercase; background-color: #e5e7eb; -webkit-print-color-adjust: exact; padding: 4px; border: 1px solid #000; margin-bottom: 5px; margin-top: 10px; }
          .tiss-field-label { font-size: 8px; color: #333; display: block; line-height: 1; margin-bottom: 2px; }
          .tiss-field-value { font-size: 10px; font-weight: bold; text-transform: uppercase; display: block; min-height: 12px; }
        `}
      </style>

      {/* PAGE 1: GUIA SP/SADT */}
      <div className="max-w-[210mm] mx-auto bg-white p-4">
        
        {/* Cabecalho */}
        <table className="tiss-table">
          <tbody>
            <tr>
              <td colSpan={2} rowSpan={2} className="w-[15%] text-center align-middle">
                <img src="https://www.gov.br/ans/pt-br/assuntos/prestadores/padrao-para-troca-de-informacao-de-saude-suplementar-2013-tiss/logo-ans.png" alt="ANS" className="h-8 mx-auto grayscale" />
              </td>
              <td colSpan={4} className="tiss-bg-gray text-center font-bold text-[12px] py-2">
                GUIA DE SERVIÇO PROFISSIONAL / SERVIÇO AUXILIAR DE DIAGNÓSTICO E TERAPIA - SP/SADT
              </td>
            </tr>
            <tr>
              <td><span className="tiss-field-label">1 - Registro ANS</span><span className="tiss-field-value">368253</span></td>
              <td><span className="tiss-field-label">2- Nº Guia no Prestador</span><span className="tiss-field-value">{atendimento.numero_guia || atendimento.id.substring(0,8)}</span></td>
              <td colSpan={2}><span className="tiss-field-label">3 - Número da Guia Principal</span><span className="tiss-field-value"></span></td>
            </tr>
            <tr>
              <td><span className="tiss-field-label">4 - Data da Autorização</span><span className="tiss-field-value">{new Date(atendimento.data).toLocaleDateString('pt-BR')}</span></td>
              <td><span className="tiss-field-label">5-Senha</span><span className="tiss-field-value">{atendimento.senha_autorizacao || 'ISENTO'}</span></td>
              <td><span className="tiss-field-label">6 - Data de Validade da Senha</span><span className="tiss-field-value"></span></td>
              <td colSpan={3}><span className="tiss-field-label">7 - Número da Guia Atribuído pela Operadora</span><span className="tiss-field-value">{atendimento.numero_guia}</span></td>
            </tr>
          </tbody>
        </table>

        {/* Beneficiário */}
        <div className="tiss-title">Dados do Beneficiário</div>
        <table className="tiss-table">
          <tbody>
            <tr>
              <td className="w-1/4"><span className="tiss-field-label">8 - Número da Carteira</span><span className="tiss-field-value">0DVNF000203009</span></td>
              <td className="w-1/6"><span className="tiss-field-label">9 - Validade da Carteira</span><span className="tiss-field-value">31/12/2026</span></td>
              <td className="w-1/2"><span className="tiss-field-label">10 - Nome</span><span className="tiss-field-value">{atendimento.paciente_nome}</span></td>
              <td><span className="tiss-field-label">11 - Cartão Nacional Saúde</span><span className="tiss-field-value"></span></td>
              <td><span className="tiss-field-label">12 - Atendimento a RN</span><span className="tiss-field-value">N</span></td>
            </tr>
          </tbody>
        </table>

        {/* Solicitante */}
        <div className="tiss-title">Dados do Solicitante</div>
        <table className="tiss-table">
          <tbody>
            <tr>
              <td className="w-1/4"><span className="tiss-field-label">13 - Código na Operadora</span><span className="tiss-field-value">04232442000114</span></td>
              <td colSpan={4}><span className="tiss-field-label">14 - Nome do Contratado</span><span className="tiss-field-value">HOSPITAL CONSULT IMAGEM E DIAGNOSTICO LTDA</span></td>
            </tr>
            <tr>
              <td colSpan={2}><span className="tiss-field-label">15 - Nome do Profissional Solicitante</span><span className="tiss-field-value">DR. EXECUTANTE</span></td>
              <td><span className="tiss-field-label">16 - Conselho Profissional</span><span className="tiss-field-value">CRM</span></td>
              <td><span className="tiss-field-label">17 - Número no Conselho</span><span className="tiss-field-value">12345</span></td>
              <td><span className="tiss-field-label">18 - UF</span><span className="tiss-field-value">PE</span></td>
              <td><span className="tiss-field-label">19 - Código CBO</span><span className="tiss-field-value">225125</span></td>
            </tr>
          </tbody>
        </table>

        {/* Procedimentos */}
        <div className="tiss-title">Dados da Execução / Procedimentos e Exames Realizados</div>
        <table className="tiss-table">
          <thead>
            <tr className="tiss-bg-gray">
              <th><span className="tiss-field-label">Data</span></th>
              <th><span className="tiss-field-label">Tabela</span></th>
              <th><span className="tiss-field-label">Código</span></th>
              <th className="w-1/2"><span className="tiss-field-label">Descrição</span></th>
              <th><span className="tiss-field-label">Qtde.</span></th>
              <th><span className="tiss-field-label">V. Unitário (R$)</span></th>
              <th><span className="tiss-field-label">V. Total (R$)</span></th>
            </tr>
          </thead>
          <tbody>
            {procs.map((p, i) => (
              <tr key={i}>
                <td><span className="tiss-field-value">{new Date(atendimento.data).toLocaleDateString('pt-BR')}</span></td>
                <td><span className="tiss-field-value">{(p.codigo_tabela || '22').split(' - ')[0]}</span></td>
                <td><span className="tiss-field-value">{p.codigo}</span></td>
                <td><span className="tiss-field-value truncate max-w-[200px]">{p.nome}</span></td>
                <td className="text-right"><span className="tiss-field-value">{p.qtd || 1}</span></td>
                <td className="text-right"><span className="tiss-field-value">{p.valor.toFixed(2)}</span></td>
                <td className="text-right"><span className="tiss-field-value">{(p.valor * (p.qtd || 1)).toFixed(2)}</span></td>
              </tr>
            ))}
            {/* Linhas vazias pra preencher o papel */}
            {Array.from({ length: Math.max(0, 5 - procs.length) }).map((_, i) => (
              <tr key={`empty-proc-${i}`}>
                <td><span className="tiss-field-value">&nbsp;</span></td>
                <td><span className="tiss-field-value">&nbsp;</span></td>
                <td><span className="tiss-field-value">&nbsp;</span></td>
                <td><span className="tiss-field-value">&nbsp;</span></td>
                <td><span className="tiss-field-value">&nbsp;</span></td>
                <td><span className="tiss-field-value">&nbsp;</span></td>
                <td><span className="tiss-field-value">&nbsp;</span></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Rodapé Totais e Assinaturas */}
        <table className="tiss-table mt-4">
          <tbody>
            <tr>
              <td><span className="tiss-field-label">Total de Procedimentos (R$)</span><span className="tiss-field-value text-right">{sumProcs.toFixed(2)}</span></td>
              <td><span className="tiss-field-label">Total Taxas e Aluguéis (R$)</span><span className="tiss-field-value text-right">0.00</span></td>
              <td><span className="tiss-field-label">Total Materiais (R$)</span><span className="tiss-field-value text-right">0.00</span></td>
              <td><span className="tiss-field-label">Total Medicamentos (R$)</span><span className="tiss-field-value text-right">0.00</span></td>
              <td><span className="tiss-field-label">Total Diárias (R$)</span><span className="tiss-field-value text-right">0.00</span></td>
              <td><span className="tiss-field-label">Total Geral (R$)</span><span className="tiss-field-value text-right font-black">{(sumProcs).toFixed(2)}</span></td>
            </tr>
          </tbody>
        </table>

        <table className="tiss-table mt-4 h-24">
          <tbody>
            <tr>
              <td className="w-1/3 text-center align-bottom pb-2">
                <span className="tiss-field-label border-t border-black pt-1 inline-block w-3/4">Assinatura do Profissional Executante</span>
                {atendimento.assinatura_medico && (
                   <div className="text-[6px] text-gray-500 mt-2 break-all">{atendimento.assinatura_medico}</div>
                )}
              </td>
              <td className="w-1/3 text-center align-bottom pb-2">
                <span className="tiss-field-label border-t border-black pt-1 inline-block w-3/4">Assinatura do Beneficiário ou Responsável</span>
              </td>
              <td className="w-1/3 text-center align-bottom pb-2">
                <span className="tiss-field-label border-t border-black pt-1 inline-block w-3/4">Assinatura do Contratado</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* PAGE 2: ANEXO OUTRAS DESPESAS (Se houver despesas) */}
      {desps.length > 0 && (
        <div className="max-w-[210mm] mx-auto bg-white p-4 page-break mt-10">
          
          <table className="tiss-table">
            <tbody>
              <tr>
                <td colSpan={2} rowSpan={2} className="w-[15%] text-center align-middle">
                  <img src="https://www.gov.br/ans/pt-br/assuntos/prestadores/padrao-para-troca-de-informacao-de-saude-suplementar-2013-tiss/logo-ans.png" alt="ANS" className="h-8 mx-auto grayscale" />
                </td>
                <td colSpan={4} className="tiss-bg-gray text-center font-bold text-[12px] py-2">
                  ANEXO DE OUTRAS DESPESAS
                  <div className="text-[10px] font-normal">(para Guia de SP/SADT e Resumo de Internação)</div>
                </td>
              </tr>
              <tr>
                <td><span className="tiss-field-label">1 - Registro ANS</span><span className="tiss-field-value">368253</span></td>
                <td colSpan={3}><span className="tiss-field-label">2- Número da Guia Referenciada</span><span className="tiss-field-value">{atendimento.numero_guia || atendimento.id.substring(0,8)}</span></td>
              </tr>
            </tbody>
          </table>

          <div className="tiss-title mt-4">Despesas Realizadas</div>
          <table className="tiss-table">
            <thead>
              <tr className="tiss-bg-gray">
                <th><span className="tiss-field-label">CD</span></th>
                <th><span className="tiss-field-label">Data</span></th>
                <th><span className="tiss-field-label">Tabela</span></th>
                <th><span className="tiss-field-label">Código Item</span></th>
                <th className="w-1/3"><span className="tiss-field-label">Descrição</span></th>
                <th><span className="tiss-field-label">Qtde.</span></th>
                <th><span className="tiss-field-label">V. Unitário (R$)</span></th>
                <th><span className="tiss-field-label">V. Total (R$)</span></th>
              </tr>
            </thead>
            <tbody>
              {desps.map((p, i) => {
                const isMed = ['20', '96'].includes((p.codigo_tabela || '').split(' - ')[0]);
                const isMat = ['19', '95'].includes((p.codigo_tabela || '').split(' - ')[0]);
                const cd = isMed ? '02' : (isMat ? '03' : '07');
                
                return (
                <tr key={i}>
                  <td className="text-center"><span className="tiss-field-value">{cd}</span></td>
                  <td><span className="tiss-field-value">{new Date(atendimento.data).toLocaleDateString('pt-BR')}</span></td>
                  <td><span className="tiss-field-value">{(p.codigo_tabela || '19').split(' - ')[0]}</span></td>
                  <td><span className="tiss-field-value">{p.codigo}</span></td>
                  <td><span className="tiss-field-value truncate max-w-[200px]">{p.nome}</span></td>
                  <td className="text-right"><span className="tiss-field-value">{p.qtd || 1}</span></td>
                  <td className="text-right"><span className="tiss-field-value">{p.valor.toFixed(2)}</span></td>
                  <td className="text-right"><span className="tiss-field-value">{(p.valor * (p.qtd || 1)).toFixed(2)}</span></td>
                </tr>
              )})}
              {/* Linhas vazias pra preencher o papel */}
              {Array.from({ length: Math.max(0, 10 - desps.length) }).map((_, i) => (
                <tr key={`empty-desp-${i}`}>
                  <td><span className="tiss-field-value">&nbsp;</span></td>
                  <td><span className="tiss-field-value">&nbsp;</span></td>
                  <td><span className="tiss-field-value">&nbsp;</span></td>
                  <td><span className="tiss-field-value">&nbsp;</span></td>
                  <td><span className="tiss-field-value">&nbsp;</span></td>
                  <td><span className="tiss-field-value">&nbsp;</span></td>
                  <td><span className="tiss-field-value">&nbsp;</span></td>
                  <td><span className="tiss-field-value">&nbsp;</span></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Rodapé Totais Despesas */}
          <table className="tiss-table mt-4">
            <tbody>
              <tr>
                <td><span className="tiss-field-label">Total Outras Despesas (R$)</span><span className="tiss-field-value text-right font-black">{sumDesps.toFixed(2)}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
