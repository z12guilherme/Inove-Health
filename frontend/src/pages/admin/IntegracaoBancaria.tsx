import { useState } from 'react';
import { Landmark, FileCheck, FileCode2, Copy, Check, Loader2, ArrowRightLeft } from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

export function IntegracaoBancaria() {
  const [activeTab, setActiveTab] = useState<'CONCILIACAO' | 'COBRANCA'>('COBRANCA');
  const [valor, setValor] = useState('');
  const [pacienteDescricao, setPacienteDescricao] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [boletoData, setBoletoData] = useState<any>(null);
  const [copiado, setCopiado] = useState(false);

  const handleGerarPix = async () => {
    if (!valor || !pacienteDescricao) return toast.error('Preencha os campos.');
    setLoading(true);
    setPixData(null);
    setBoletoData(null);
    try {
      const { data } = await api.post('/financeiro/banco/gerar-pix', { valor: Number(valor), descricao: pacienteDescricao });
      setPixData(data);
      toast.success('PIX gerado com sucesso!');
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  const handleGerarBoleto = async () => {
    if (!valor || !pacienteDescricao) return toast.error('Preencha os campos.');
    setLoading(true);
    setPixData(null);
    setBoletoData(null);
    try {
      const { data } = await api.post('/financeiro/banco/gerar-boleto', { valor: Number(valor), paciente: pacienteDescricao });
      setBoletoData(data);
      toast.success('Boleto gerado com sucesso!');
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  const handleConciliar = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/financeiro/banco/conciliar');
      toast.success(`Conciliação concluída: ${data.transacoesConciliadas} encontradas.`);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const copiarTexto = (texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
    toast.success('Copiado para a área de transferência!');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integração Bancária</h1>
        <p className="text-muted-foreground mt-2">Geração de cobranças (PIX/Boleto) e conciliação de pagamentos.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/50">
        <button
          className={`pb-4 px-6 font-medium text-sm transition-colors border-b-2 ${activeTab === 'COBRANCA' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('COBRANCA')}
        >
          Cobranças (PIX / Boleto)
        </button>
        <button
          className={`pb-4 px-6 font-medium text-sm transition-colors border-b-2 ${activeTab === 'CONCILIACAO' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('CONCILIACAO')}
        >
          Conciliação OFX
        </button>
      </div>

      {/* COBRANCA TAB */}
      {activeTab === 'COBRANCA' && (
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-6">Nova Cobrança</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Valor (R$)</label>
                <input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Paciente / Descrição</label>
                <input type="text" value={pacienteDescricao} onChange={e => setPacienteDescricao(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Ex: Consulta Particular Dr. João" />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button onClick={handleGerarPix} disabled={loading} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white h-12 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Landmark className="w-5 h-5" /> Gerar PIX</>}
                </button>
                <button onClick={handleGerarBoleto} disabled={loading} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white h-12 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><FileCode2 className="w-5 h-5" /> Gerar Boleto</>}
                </button>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px]">
            {!pixData && !boletoData && (
              <div className="text-center text-muted-foreground opacity-50">
                <Landmark className="w-16 h-16 mx-auto mb-4" />
                <p>Preencha os dados e gere a cobrança para visualizar.</p>
              </div>
            )}
            
            {pixData && (
              <div className="w-full animate-in fade-in zoom-in-95">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center space-y-4">
                  <h3 className="text-emerald-500 font-bold text-lg">PIX Gerado com Sucesso</h3>
                  <div className="bg-white p-4 rounded-xl inline-block">
                    <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code PIX" className="w-40 h-40 opacity-20" title="Simulação" />
                  </div>
                  <p className="text-sm font-medium">PIX Copia e Cola:</p>
                  <div className="flex items-center gap-2 bg-background p-3 rounded-lg border border-border">
                    <p className="text-xs truncate flex-1 font-mono">{pixData.pixCopiaCola}</p>
                    <button onClick={() => copiarTexto(pixData.pixCopiaCola)} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                      {copiado ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {boletoData && (
              <div className="w-full animate-in fade-in zoom-in-95">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 text-center space-y-4">
                  <h3 className="text-blue-500 font-bold text-lg">Boleto Gerado com Sucesso</h3>
                  <p className="text-sm font-medium">Linha Digitável:</p>
                  <div className="flex items-center gap-2 bg-background p-3 rounded-lg border border-border">
                    <p className="text-xs truncate flex-1 font-mono">{boletoData.linhaDigitavel}</p>
                    <button onClick={() => copiarTexto(boletoData.linhaDigitavel)} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                      {copiado ? <Check className="w-4 h-4 text-blue-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <a href={boletoData.linkPdf} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-500 hover:underline mt-4">
                    <FileCheck className="w-4 h-4" /> Visualizar PDF (Mock)
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONCILIACAO TAB */}
      {activeTab === 'CONCILIACAO' && (
        <div className="glass rounded-2xl p-8 text-center max-w-2xl mx-auto space-y-6">
           <ArrowRightLeft className="w-16 h-16 mx-auto text-primary" />
           <h2 className="text-2xl font-bold">Importação de Arquivo OFX</h2>
           <p className="text-muted-foreground">O sistema fará o cruzamento automático dos pagamentos recebidos no banco com as contas e cobranças em aberto.</p>
           
           <div className="border-2 border-dashed border-border/50 rounded-2xl p-8 bg-background/30">
              <input type="file" accept=".ofx" className="hidden" id="ofx-upload" />
              <label htmlFor="ofx-upload" className="cursor-pointer bg-secondary hover:bg-secondary/80 text-foreground px-6 py-3 rounded-xl font-medium inline-block transition-colors">
                 Selecionar Arquivo .OFX
              </label>
           </div>
           
           <button onClick={handleConciliar} disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/25">
             {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Processar Conciliação (Mock)'}
           </button>
        </div>
      )}

    </div>
  );
}
