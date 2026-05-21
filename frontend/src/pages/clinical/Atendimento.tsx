import { useState, useEffect, useCallback } from 'react';
import { Stethoscope, Loader2, Search, ClipboardList, Save } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

interface ConsultaForm { paciente_id: string; diagnostico: string; cid_10: string; evolucao: string; observacoes: string; }
const empty: ConsultaForm = { paciente_id: '', diagnostico: '', cid_10: '', evolucao: '', observacoes: '' };

export function Atendimento() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState<ConsultaForm>({ ...empty, paciente_id: searchParams.get('pacienteId') || '' });
  const [busy, setBusy] = useState(false);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [consultas, setConsultas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try { setLoading(true); const { data } = await api.get('/pacientes'); setPacientes(Array.isArray(data) ? data : data.pacientes || []); } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (form.paciente_id) {
      api.get(`/consultas/pacientes/${form.paciente_id}`).then(r => setConsultas(Array.isArray(r.data) ? r.data : r.data.consultas || [])).catch(() => {});
    }
  }, [form.paciente_id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.paciente_id) { toast.error('Selecione um paciente.'); return; }
    setBusy(true);
    try {
      await api.post('/consultas', form);
      toast.success('Consulta registrada com sucesso!');
      setForm(f => ({ ...empty, paciente_id: f.paciente_id }));
      const r = await api.get(`/consultas/pacientes/${form.paciente_id}`);
      setConsultas(Array.isArray(r.data) ? r.data : r.data.consultas || []);
    } catch {} finally { setBusy(false); }
  };

  const filteredPac = pacientes.filter(p => p.nome?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold tracking-tight">Atendimento Médico</h1><p className="text-muted-foreground mt-2">Registro de consultas, diagnósticos e evolução clínica.</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-4 sm:p-6 lg:col-span-1">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Search className="w-5 h-5" /> Paciente</h3>
          <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-10 px-4 rounded-lg bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm mb-3" />
          {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
            <div className="space-y-1 max-h-[400px] overflow-y-auto">{filteredPac.map(p => (
              <button key={p.id} onClick={() => setForm(f => ({...f, paciente_id: p.id}))} className={cn("w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm", form.paciente_id === p.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-secondary text-foreground')}>{p.nome}</button>
            ))}</div>
          )}
        </div>
        <div className="glass rounded-2xl p-4 sm:p-6 lg:col-span-2">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Stethoscope className="w-5 h-5" /> Registro de Consulta</h3>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium mb-1 text-muted-foreground">Diagnóstico</label><input type="text" required value={form.diagnostico} onChange={e => setForm(p => ({...p, diagnostico: e.target.value}))} className="w-full h-11 px-3 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" placeholder="Ex: Pneumonia adquirida" /></div>
              <div><label className="block text-xs font-medium mb-1 text-muted-foreground">CID-10</label><input type="text" value={form.cid_10} onChange={e => setForm(p => ({...p, cid_10: e.target.value}))} className="w-full h-11 px-3 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-mono" placeholder="Ex: J18.9" /></div>
            </div>
            <div><label className="block text-xs font-medium mb-1 text-muted-foreground">Evolução Clínica</label><textarea required value={form.evolucao} onChange={e => setForm(p => ({...p, evolucao: e.target.value}))} rows={4} className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm resize-none" placeholder="Descreva a evolução do paciente..." /></div>
            <div><label className="block text-xs font-medium mb-1 text-muted-foreground">Observações</label><textarea value={form.observacoes} onChange={e => setForm(p => ({...p, observacoes: e.target.value}))} rows={2} className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm resize-none" /></div>
            <button type="submit" disabled={busy || !form.paciente_id} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/25 transition-all">
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar Consulta</>}
            </button>
          </form>
          {consultas.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border/50">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Consultas Anteriores</h4>
              <div className="space-y-2">{consultas.slice(0, 5).map((c: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/30 text-sm animate-fade-in">
                  <div className="flex items-center justify-between"><span className="font-medium">{c.diagnostico}</span><span className="text-xs text-muted-foreground font-mono">{c.cid_10}</span></div>
                  <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{c.evolucao}</p>
                </div>
              ))}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
