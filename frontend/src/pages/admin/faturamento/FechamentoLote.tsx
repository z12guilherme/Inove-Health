import { useState } from 'react';
import { PackageOpen, Loader2, Download, FileCode2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';

export function FechamentoLote() {
  const navigate = useNavigate();
  const [convenio, setConvenio] = useState('Unimed');
  const [mesAno, setMesAno] = useState('05-2026');
  const [loading, setLoading] = useState(false);
  const [resultadoLote, setResultadoLote] = useState<any>(null);

  const handleGerarLote = async () => {
    setLoading(true);
    setResultadoLote(null);
    try {
      const { data } = await api.post('/faturamento/lotes/gerar-xml', { convenio, mesAno });
      setResultadoLote(data);
      toast.success('Lote XML TISS gerado com sucesso!');
    } catch {
      toast.error('Erro ao gerar o lote.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadXML = () => {
    if (!resultadoLote) return;

    // Converte de base64 de volta pra texto (simplificado pro browser mock)
    const xmlContent = atob(resultadoLote.conteudoXmlBase64);

    const blob = new Blob([xmlContent], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultadoLote.nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fechamento de Lote (Legado)</h1>
        <p className="text-muted-foreground mt-2">Esta funcionalidade foi descontinuada. Por favor, utilize o novo módulo de Remessas TISS.</p>
      </div>

      <div className="glass rounded-2xl p-8 text-center space-y-6 bg-primary/5 border-2 border-primary/20">
        <div className="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto shadow-inner">
          <FileCode2 className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Novo Gerador de Remessas TISS</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            O gerador de XML foi atualizado para suportar o padrão TISS 4.01.00 com regras rígidas de separação por tipo de guia, seleção manual de guias, e vínculo de insumos.
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/faturamento/remessas')}
          className="h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold inline-flex items-center gap-3 transition-all shadow-lg shadow-primary/25 hover:-translate-y-0.5"
        >
          Acessar Módulo Remessas TISS <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="glass rounded-2xl p-6 h-max">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2"><PackageOpen className="w-5 h-5 text-primary" /> Parâmetros do Lote</h2>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">Convênio *</label>
              <select value={convenio} onChange={e => setConvenio(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                <option value="Unimed">Unimed</option>
                <option value="Bradesco Saúde">Bradesco Saúde</option>
                <option value="Amil">Amil</option>
                <option value="SulAmérica">SulAmérica</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Mês de Competência *</label>
              <input type="month" value={mesAno === '05-2026' ? '2026-05' : '2026-04'} onChange={e => setMesAno(e.target.value.split('-').reverse().join('-'))}
                className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
            </div>

            <button onClick={handleGerarLote} disabled={loading}
              className="w-full h-12 mt-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/25 disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><FileCode2 className="w-5 h-5" /> Processar e Gerar XML TISS</>}
            </button>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-primary/20 bg-primary/5">
          {!resultadoLote ? (
            <div className="text-center text-muted-foreground">
              <FileCode2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Configure os parâmetros e clique em Gerar para produzir o XML do Lote.</p>
            </div>
          ) : (
            <div className="w-full animate-in fade-in zoom-in-95 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-emerald-500 mb-2">Lote Processado com Sucesso!</h3>

              <div className="grid grid-cols-2 gap-4 text-left bg-background p-4 rounded-xl border border-border">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Total de Guias</p>
                  <p className="font-mono text-lg">{resultadoLote.totalGuias}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Valor Total do Lote</p>
                  <p className="font-mono text-lg font-bold text-primary">R$ {resultadoLote.valorTotalLote}</p>
                </div>
              </div>

              <button onClick={handleDownloadXML} className="w-full bg-slate-800 hover:bg-slate-700 text-white h-12 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 mt-4 shadow-lg">
                <Download className="w-5 h-5" /> Download Arquivo XML
              </button>
              <p className="text-xs text-muted-foreground font-mono truncate">{resultadoLote.nomeArquivo}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Temporary CheckCircle icon component for FechamentoLote
function CheckCircle(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}
