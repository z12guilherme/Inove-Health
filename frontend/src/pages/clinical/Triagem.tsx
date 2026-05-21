import { useState, useEffect, useCallback } from 'react';
import { Activity, Loader2, Search, ThermometerSun, Heart, Wind } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface TriagemForm { paciente_id: string; temperatura: string; pressao_arterial: string; freq_cardiaca: string; freq_respiratoria: string; saturacao_o2: string; queixa_principal: string; classificacao_risco: string; }
const empty: TriagemForm = { paciente_id: '', temperatura: '', pressao_arterial: '', freq_cardiaca: '', freq_respiratoria: '', saturacao_o2: '', queixa_principal: '', classificacao_risco: 'verde' };
const cores = [
  { value: 'vermelho', label: 'Vermelho — Emergência', color: 'bg-red-500' },
  { value: 'laranja', label: 'Laranja — Muito Urgente', color: 'bg-orange-500' },
  { value: 'amarelo', label: 'Amarelo — Urgente', color: 'bg-yellow-500' },
  { value: 'verde', label: 'Verde — Pouco Urgente', color: 'bg-green-500' },
  { value: 'azul', label: 'Azul — Não Urgente', color: 'bg-blue-500' },
];

export function Triagem() {
  const [form, setForm] = useState<TriagemForm>(empty);
  const [busy, setBusy] = useState(false);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [triagens, setTriagens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try { setLoading(true); const { data } = await api.get('/pacientes'); setPacientes(Array.isArray(data) ? data : data.pacientes || []); } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const loadTriagens = async (pacId: string) => {
    try { const { data } = await api.get(`/triagens/pacientes/${pacId}`); setTriagens(Array.isArray(data) ? data : data.triagens || []); } catch {}
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.paciente_id) { toast.error('Selecione um paciente.'); return; }
    setBusy(true);
    try {
      await api.post('/triagens', { ...form, temperatura: parseFloat(form.temperatura), freq_cardiaca: parseInt(form.freq_cardiaca), freq_respiratoria: parseInt(form.freq_respiratoria), saturacao_o2: parseFloat(form.saturacao_o2) });
      toast.success('Triagem registrada com sucesso!');
      setForm(empty); loadTriagens(form.paciente_id);
    } catch {} finally { setBusy(false); }
  };

  const selectPaciente = (id: string) => { setForm(p => ({...p, paciente_id: id})); loadTriagens(id); };
  
  const chamarNoPainel = (sala: string) => {
    const pac = pacientes.find(p => p.id === form.paciente_id);
    if (!pac) return;

    // Prioriza o risco selecionado no formulário atual ou o risco cadastrado do paciente
    const risco = form.classificacao_risco || pac.risco || 'verde';

    const chamado = {
      id: Date.now().toString(),
      pacienteNome: pac.nome,
      destino: sala,
      risco: risco,
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    localStorage.setItem('inove_chamado_atual', JSON.stringify(chamado));

    // Atualizar histórico do painel
    const histRaw = localStorage.getItem('inove_chamados_historico') || '[]';
    const hist = JSON.parse(histRaw);
    localStorage.setItem('inove_chamados_historico', JSON.stringify([chamado, ...hist].slice(0, 10)));

    toast.success(`📢 Chamado de ${pac.nome} enviado ao painel!`);
  };

  const filteredPac = pacientes.filter(p => p.nome?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold tracking-tight">Triagem de Pacientes</h1><p className="text-muted-foreground mt-2">Registro rápido de sinais vitais e classificação de risco Manchester.</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient selector */}
        <div className="glass rounded-2xl p-4 sm:p-6 lg:col-span-1 flex flex-col justify-between min-h-[480px]">
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Search className="w-5 h-5" /> Selecionar Paciente</h3>
            <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-10 px-4 rounded-lg bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm mb-3" />
            {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {filteredPac.map(p => (
                  <button key={p.id} onClick={() => selectPaciente(p.id)} className={cn("w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm", form.paciente_id === p.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-secondary text-foreground')}>
                    {p.nome}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chamador de Painel */}
          {form.paciente_id && (
            <div className="mt-6 pt-4 border-t border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">📢 Chamada por Voz</span>
                <span className="inline-flex w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Sincronizado" />
              </div>
              <p className="text-[11px] text-muted-foreground">Chame o paciente para a sala de triagem no telão com narração por voz.</p>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => chamarNoPainel('Sala de Triagem A')}
                  className="flex-1 h-9 rounded-lg bg-primary hover:bg-primary/95 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-all shadow-md shadow-primary/15 hover:-translate-y-0.5"
                >
                  Triagem A
                </button>
                <button
                  type="button"
                  onClick={() => chamarNoPainel('Sala de Triagem B')}
                  className="flex-1 h-9 rounded-lg bg-secondary hover:bg-secondary-foreground/10 text-foreground text-xs font-semibold flex items-center justify-center gap-1 transition-all border border-border hover:-translate-y-0.5"
                >
                  Triagem B
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Triage form */}
        <div className="glass rounded-2xl p-4 sm:p-6 lg:col-span-2">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><ThermometerSun className="w-5 h-5" /> Sinais Vitais</h3>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium mb-1 text-muted-foreground">Temperatura (°C)</label><input type="number" step="0.1" required value={form.temperatura} onChange={e => setForm(p => ({...p, temperatura: e.target.value}))} className="w-full h-11 px-3 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" placeholder="36.5" /></div>
              <div><label className="block text-xs font-medium mb-1 text-muted-foreground">Pressão Arterial</label><input type="text" required value={form.pressao_arterial} onChange={e => setForm(p => ({...p, pressao_arterial: e.target.value}))} className="w-full h-11 px-3 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" placeholder="120/80" /></div>
              <div><label className="block text-xs font-medium mb-1 text-muted-foreground flex items-center gap-1"><Heart className="w-3 h-3" /> FC (bpm)</label><input type="number" required value={form.freq_cardiaca} onChange={e => setForm(p => ({...p, freq_cardiaca: e.target.value}))} className="w-full h-11 px-3 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" placeholder="80" /></div>
              <div><label className="block text-xs font-medium mb-1 text-muted-foreground flex items-center gap-1"><Wind className="w-3 h-3" /> FR (irpm)</label><input type="number" required value={form.freq_respiratoria} onChange={e => setForm(p => ({...p, freq_respiratoria: e.target.value}))} className="w-full h-11 px-3 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" placeholder="16" /></div>
              <div><label className="block text-xs font-medium mb-1 text-muted-foreground">SpO2 (%)</label><input type="number" step="0.1" required value={form.saturacao_o2} onChange={e => setForm(p => ({...p, saturacao_o2: e.target.value}))} className="w-full h-11 px-3 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" placeholder="98" /></div>
            </div>
            <div><label className="block text-xs font-medium mb-1 text-muted-foreground">Queixa Principal</label><textarea required value={form.queixa_principal} onChange={e => setForm(p => ({...p, queixa_principal: e.target.value}))} rows={2} className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm resize-none" placeholder="Descreva a queixa..." /></div>
            <div><label className="block text-xs font-medium mb-2 text-muted-foreground">Classificação de Risco</label>
              <div className="flex flex-wrap gap-2">{cores.map(c => (
                <button key={c.value} type="button" onClick={() => setForm(p => ({...p, classificacao_risco: c.value}))} className={cn("px-3 py-2 rounded-lg text-sm font-medium transition-all border-2", form.classificacao_risco === c.value ? 'border-foreground shadow-md scale-105' : 'border-transparent opacity-70 hover:opacity-100')}>
                  <span className={cn("inline-block w-3 h-3 rounded-full mr-2", c.color)} />{c.label.split('—')[0].trim()}
                </button>
              ))}</div>
            </div>
            <button type="submit" disabled={busy || !form.paciente_id} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/25 transition-all">
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Activity className="w-5 h-5" /> Registrar Triagem</>}
            </button>
          </form>

          {triagens.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border/50">
              <h4 className="text-sm font-semibold mb-3">Triagens Anteriores</h4>
              <div className="space-y-2">{triagens.slice(0, 5).map((t: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 text-sm">
                  <div className={cn("w-3 h-3 rounded-full", cores.find(c => c.value === t.classificacao_risco)?.color || 'bg-gray-400')} />
                  <span className="capitalize font-medium">{t.classificacao_risco}</span>
                  <span className="text-muted-foreground">PA: {t.pressao_arterial} • Temp: {t.temperatura}°C</span>
                  <span className="ml-auto text-xs text-muted-foreground">{t.criado_em ? new Date(t.criado_em).toLocaleDateString('pt-BR') : ''}</span>
                </div>
              ))}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
