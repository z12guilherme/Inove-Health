import { useState, useEffect, useCallback, useRef } from 'react';
import { Activity, Loader2, Search, ThermometerSun, Heart, Wind, Printer } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { generateDigitalSignature } from '../../lib/crypto';

interface TriagemForm {
  atendimento_id: string;
  paciente_id: string;
  temperatura: string;
  pressao_arterial: string;
  freq_cardiaca: string;
  freq_respiratoria: string;
  saturacao_o2: string;
  peso: string;
  glicose: string;
  alergias: string;
  sintomas: string;
  dor: string;
  classificacao_risco: string;
  procedimentos_complementares: string;
}
const empty: TriagemForm = {
  atendimento_id: '', paciente_id: '', temperatura: '', pressao_arterial: '',
  freq_cardiaca: '', freq_respiratoria: '', saturacao_o2: '', peso: '',
  glicose: '', alergias: 'NEGA ALERGIA MEDICAMENTOSA', sintomas: '', dor: '',
  classificacao_risco: 'verde', procedimentos_complementares: ''
};

const cores = [
  { value: 'vermelho', label: 'Emergência', color: 'bg-red-500' },
  { value: 'laranja', label: 'Muito Urgente', color: 'bg-orange-500' },
  { value: 'amarelo', label: 'Urgente', color: 'bg-yellow-500' },
  { value: 'verde', label: 'Pouco Urgente', color: 'bg-green-500' },
  { value: 'azul', label: 'Não Urgente', color: 'bg-blue-500' },
];

export function Triagem() {
  const [form, setForm] = useState<TriagemForm>(empty);
  const [busy, setBusy] = useState(false);
  const [atendimentos, setAtendimentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Impressão
  const printRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/atendimentos');
      const atds = Array.isArray(data) ? data : data.atendimentos || [];
      // Só mostrar quem aguarda triagem ou quem não tem status (compatibilidade)
      setAtendimentos(atds.filter((a: any) => (a.status_fila === 'AGUARDANDO_TRIAGEM' || !a.status_fila) && a.status === 'ATIVO'));
    } catch {
      toast.error('Erro ao buscar atendimentos');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.atendimento_id) { toast.error('Selecione um paciente aguardando triagem.'); return; }
    setBusy(true);
    try {
      const triageData = {
        ...form,
        temperatura: parseFloat(form.temperatura),
        freq_cardiaca: parseInt(form.freq_cardiaca),
        freq_respiratoria: parseInt(form.freq_respiratoria),
        saturacao_o2: parseFloat(form.saturacao_o2),
        peso: parseFloat(form.peso || '0'),
        glicose: parseFloat(form.glicose || '0')
      };

      // Gerar Assinatura Digital do Enfermeiro
      const signaturePayload = {
        ...triageData,
        timestamp: new Date().toISOString(),
        profissional: {
          nome: 'Enfermeira Chefe Mock', // Pegaria do Auth
          conselho: 'COREN 54321-PE'
        }
      };
      
      const hash = await generateDigitalSignature(signaturePayload);
      const assinatura = `Assinado digitalmente por ${signaturePayload.profissional.nome} | ${signaturePayload.profissional.conselho} | SHA256: ${hash} | Data: ${new Date(signaturePayload.timestamp).toLocaleString('pt-BR')}`;

      await api.post('/triagens', {
        ...triageData,
        assinatura_enfermagem: assinatura
      });

      // Atualizar o Atendimento com a assinatura da triagem para espelhar no prontuário
      await api.patch(`/atendimentos/${form.atendimento_id}`, {
        assinatura_enfermagem: assinatura
      });

      toast.success('Triagem registrada com sucesso!');
      
      // Imprimir automaticamente
      handlePrint();

      setForm(empty);
      load(); // Atualiza a lista (vai remover o paciente que foi pra médico)
    } catch {
      toast.error('Erro ao salvar triagem');
    } finally {
      setBusy(false);
    }
  };

  const selectAtendimento = (atd: any) => {
    setForm(p => ({
      ...empty,
      atendimento_id: atd.id,
      paciente_id: atd.paciente_id
    }));
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const windowPrint = window.open('', '', 'width=800,height=600');
    if (!windowPrint) return;

    windowPrint.document.write(`
      <html>
        <head>
          <title>Impressão de Triagem</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 14px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .row { display: flex; margin-bottom: 10px; }
            .col { flex: 1; }
            .box { border: 1px solid #ccc; padding: 10px; margin-bottom: 15px; border-radius: 5px; }
            .label { font-weight: bold; font-size: 12px; color: #555; }
            .value { font-size: 14px; margin-top: 4px; }
            .title { font-weight: bold; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .risco { font-weight: bold; padding: 5px; border: 1px solid #000; display: inline-block; text-transform: uppercase; }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            setTimeout(function() { window.print(); window.close(); }, 500);
          </script>
        </body>
      </html>
    `);
    windowPrint.document.close();
    windowPrint.focus();
  };

  const filtered = atendimentos.filter(a =>
    a.paciente_nome?.toLowerCase().includes(search.toLowerCase()) ||
    a.id.toLowerCase().includes(search.toLowerCase())
  );
  
  const selectedAtd = atendimentos.find(a => a.id === form.atendimento_id);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Triagem de Enfermagem</h1>
        <p className="text-muted-foreground mt-2">Classificação de risco, sinais vitais e anamnese inicial.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Patient selector */}
        <div className="glass rounded-2xl p-4 sm:p-6 xl:col-span-1 flex flex-col justify-between min-h-[480px]">
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Search className="w-5 h-5 text-primary" /> Fila de Triagem</h3>
            <input type="text" placeholder="Buscar por paciente ou prontuário..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-11 px-4 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm mb-4" />
            
            {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {filtered.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Nenhum paciente aguardando triagem.</p>
                ) : filtered.map(a => (
                  <button key={a.id} onClick={() => selectAtendimento(a)} className={cn(
                    "w-full text-left px-4 py-3 rounded-xl transition-all border",
                    form.atendimento_id === a.id ? 'bg-primary/5 border-primary shadow-sm' : 'bg-background hover:bg-secondary/50 border-border/50'
                  )}>
                    <div className="font-bold text-sm truncate text-foreground">{a.paciente_nome}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                      <span>{a.id}</span>
                      <span>{a.hora}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Triage form */}
        <div className="glass rounded-2xl p-4 sm:p-6 xl:col-span-2 relative">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold flex items-center gap-2 text-xl"><ThermometerSun className="w-5 h-5 text-primary" /> Dados da Triagem</h3>
            {selectedAtd && <span className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">{selectedAtd.paciente_nome}</span>}
          </div>

          {!selectedAtd ? (
             <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
               <Activity className="w-16 h-16 opacity-20 mb-4" />
               <p className="font-medium">Selecione um paciente na fila para iniciar</p>
             </div>
          ) : (
            <form onSubmit={submit} className="space-y-6">
              
              {/* Sinais Vitais */}
              <div className="bg-secondary/30 p-5 rounded-2xl border border-border/50">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Sinais Vitais</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><label className="block text-xs font-semibold mb-1.5 text-foreground/80">Temperatura (°C)</label><input type="number" step="0.1" required value={form.temperatura} onChange={e => setForm(p => ({...p, temperatura: e.target.value}))} className="w-full h-11 px-3 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all" placeholder="36.5" /></div>
                  <div><label className="block text-xs font-semibold mb-1.5 text-foreground/80">Pressão Arterial</label><input type="text" required value={form.pressao_arterial} onChange={e => setForm(p => ({...p, pressao_arterial: e.target.value}))} className="w-full h-11 px-3 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all" placeholder="120/80" /></div>
                  <div><label className="block text-xs font-semibold mb-1.5 text-foreground/80 flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-500" /> FC (bpm)</label><input type="number" required value={form.freq_cardiaca} onChange={e => setForm(p => ({...p, freq_cardiaca: e.target.value}))} className="w-full h-11 px-3 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all" placeholder="80" /></div>
                  <div><label className="block text-xs font-semibold mb-1.5 text-foreground/80 flex items-center gap-1"><Wind className="w-3.5 h-3.5 text-blue-500" /> FR (irpm)</label><input type="number" required value={form.freq_respiratoria} onChange={e => setForm(p => ({...p, freq_respiratoria: e.target.value}))} className="w-full h-11 px-3 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all" placeholder="16" /></div>
                  <div><label className="block text-xs font-semibold mb-1.5 text-foreground/80">SpO2 (%)</label><input type="number" step="0.1" required value={form.saturacao_o2} onChange={e => setForm(p => ({...p, saturacao_o2: e.target.value}))} className="w-full h-11 px-3 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all" placeholder="98" /></div>
                  <div><label className="block text-xs font-semibold mb-1.5 text-foreground/80">Peso (Kg)</label><input type="number" step="0.1" value={form.peso} onChange={e => setForm(p => ({...p, peso: e.target.value}))} className="w-full h-11 px-3 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all" placeholder="70" /></div>
                  <div><label className="block text-xs font-semibold mb-1.5 text-foreground/80">Glicose (mg/dL)</label><input type="number" value={form.glicose} onChange={e => setForm(p => ({...p, glicose: e.target.value}))} className="w-full h-11 px-3 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all" placeholder="90" /></div>
                </div>
              </div>

              {/* Anamnese e Sintomas */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-foreground/80">Sintomas / Anamnese de Triagem</label>
                  <textarea required value={form.sintomas} onChange={e => setForm(p => ({...p, sintomas: e.target.value}))} rows={3} className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all resize-none" placeholder="Paciente refere sintomas gripais, tosse produtiva..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-foreground/80">Alergias</label>
                    <input type="text" value={form.alergias} onChange={e => setForm(p => ({...p, alergias: e.target.value}))} className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-foreground/80">Dor (1 a 10)</label>
                    <input type="text" value={form.dor} onChange={e => setForm(p => ({...p, dor: e.target.value}))} className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all" placeholder="Ex: Dor abdominal 7/10" />
                  </div>
                </div>
              </div>

              {/* Procedimentos da Triagem */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-foreground/80">Procedimento Complementar da Triagem</label>
                <input type="text" value={form.procedimentos_complementares} onChange={e => setForm(p => ({...p, procedimentos_complementares: e.target.value}))} className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all" placeholder="Ex: Eletrocardiograma (ECG)" />
              </div>

              {/* Classificação de Risco */}
              <div className="bg-secondary/20 p-5 rounded-2xl border border-border/50">
                <label className="block text-xs font-bold uppercase tracking-wider mb-3 text-foreground/80">Classificação de Risco</label>
                <div className="flex flex-wrap gap-2">
                  {cores.map(c => (
                    <button key={c.value} type="button" onClick={() => setForm(p => ({...p, classificacao_risco: c.value}))} className={cn("px-4 py-2.5 rounded-xl text-sm font-bold transition-all border-2 flex items-center gap-2", form.classificacao_risco === c.value ? 'border-foreground shadow-md scale-105 bg-background text-foreground' : 'border-transparent opacity-60 hover:opacity-100 bg-background/50')}>
                      <span className={cn("inline-block w-3.5 h-3.5 rounded-full shadow-inner", c.color)} />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={handlePrint} className="h-14 px-6 rounded-xl border-2 border-border font-bold hover:bg-secondary flex items-center justify-center gap-2 transition-all">
                  <Printer className="w-5 h-5" /> Imprimir
                </button>
                <button type="submit" disabled={busy} className="flex-1 h-14 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/25 transition-all text-lg">
                  {busy ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Activity className="w-6 h-6" /> Salvar Triagem e Enviar ao Médico</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Template oculto para impressão */}
      <div className="hidden">
        <div ref={printRef} className="print-content">
          <div className="header">
            <h2>INOVE HEALTH - HOSPITAL E MATERNIDADE</h2>
            <h3>FICHA DE TRIAGEM DE ENFERMAGEM</h3>
            <p>Data: {new Date().toLocaleString('pt-BR')}</p>
          </div>
          
          <div className="box">
            <div className="title">DADOS DO PACIENTE</div>
            <div className="row">
              <div className="col"><div className="label">Nome</div><div className="value">{selectedAtd?.paciente_nome}</div></div>
              <div className="col"><div className="label">Atendimento</div><div className="value">{selectedAtd?.id}</div></div>
            </div>
          </div>

          <div className="box">
            <div className="title">SINAIS VITAIS</div>
            <div className="row">
              <div className="col"><div className="label">Temperatura</div><div className="value">{form.temperatura || '--'} ºC</div></div>
              <div className="col"><div className="label">P. Arterial</div><div className="value">{form.pressao_arterial || '--'} mmHg</div></div>
              <div className="col"><div className="label">F. Cardíaca</div><div className="value">{form.freq_cardiaca || '--'} bpm</div></div>
              <div className="col"><div className="label">F. Respiratória</div><div className="value">{form.freq_respiratoria || '--'} irpm</div></div>
            </div>
            <div className="row" style={{ marginTop: '10px' }}>
              <div className="col"><div className="label">SpO2</div><div className="value">{form.saturacao_o2 || '--'} %</div></div>
              <div className="col"><div className="label">Peso</div><div className="value">{form.peso || '--'} Kg</div></div>
              <div className="col"><div className="label">Glicose</div><div className="value">{form.glicose || '--'} mg/dL</div></div>
              <div className="col"></div>
            </div>
          </div>

          <div className="box">
            <div className="title">AVALIAÇÃO E SINTOMAS</div>
            <div style={{ marginBottom: '10px' }}><div className="label">Sintomas / Motivo</div><div className="value">{form.sintomas || '--'}</div></div>
            <div className="row">
              <div className="col"><div className="label">Alergias</div><div className="value">{form.alergias || '--'}</div></div>
              <div className="col"><div className="label">Dor</div><div className="value">{form.dor || '--'}</div></div>
            </div>
            <div style={{ marginTop: '10px' }}><div className="label">Procedimentos Complementares</div><div className="value">{form.procedimentos_complementares || '--'}</div></div>
          </div>

          <div className="box" style={{ textAlign: 'center' }}>
            <div className="label" style={{ marginBottom: '5px' }}>CLASSIFICAÇÃO DE RISCO</div>
            <div className="risco" style={{ backgroundColor: cores.find(c => c.value === form.classificacao_risco)?.color.replace('bg-', '').replace('-500', '') === 'red' ? '#ef4444' : cores.find(c => c.value === form.classificacao_risco)?.color.replace('bg-', '').replace('-500', '') === 'orange' ? '#f97316' : cores.find(c => c.value === form.classificacao_risco)?.color.replace('bg-', '').replace('-500', '') === 'yellow' ? '#eab308' : cores.find(c => c.value === form.classificacao_risco)?.color.replace('bg-', '').replace('-500', '') === 'green' ? '#22c55e' : '#3b82f6', color: '#fff', padding: '10px 20px', borderRadius: '5px' }}>
              {cores.find(c => c.value === form.classificacao_risco)?.label}
            </div>
          </div>
          
          <div style={{ marginTop: '50px', textAlign: 'center' }}>
            _________________________________________________<br/>
            Carimbo e Assinatura do Profissional (Enfermagem)
          </div>
        </div>
      </div>
    </div>
  );
}
