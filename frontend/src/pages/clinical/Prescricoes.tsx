import { useState, useEffect, useCallback } from 'react';
import { Pill, FileText, Loader2, Plus, X, Download } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface PrescForm { paciente_id: string; medicamento: string; dosagem: string; via: string; frequencia: string; duracao: string; observacoes: string; }
const emptyP: PrescForm = { paciente_id: '', medicamento: '', dosagem: '', via: 'oral', frequencia: '', duracao: '', observacoes: '' };

export function Prescricoes() {
  const [tab, setTab] = useState<'prescricoes' | 'prontuarios'>('prescricoes');
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<PrescForm>(emptyP);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [selPaciente, setSelPaciente] = useState('');

  const loadPacientes = useCallback(async () => {
    try { setLoading(true); const { data } = await api.get('/pacientes'); setPacientes(Array.isArray(data) ? data : data.pacientes || []); } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { loadPacientes(); }, [loadPacientes]);

  const loadItems = useCallback(async () => {
    if (!selPaciente) { setItems([]); return; }
    try {
      const ep = tab === 'prescricoes' ? `/prescricoes/pacientes/${selPaciente}` : `/prontuarios/pacientes/${selPaciente}`;
      const { data } = await api.get(ep);
      setItems(Array.isArray(data) ? data : data[tab] || []);
    } catch { setItems([]); }
  }, [selPaciente, tab]);
  useEffect(() => { loadItems(); }, [loadItems]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.paciente_id) { toast.error('Selecione um paciente.'); return; }
    setBusy(true);
    try {
      await api.post('/prescricoes', form);
      toast.success('Prescrição criada com sucesso!');
      setModal(false); setForm(emptyP); loadItems();
    } catch {} finally { setBusy(false); }
  };

  const downloadPdf = async (id: string, type: 'prescricoes' | 'prontuarios') => {
    try {
      const { data } = await api.get(`/${type}/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a'); a.href = url; a.download = `${type}-${id}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF baixado!');
    } catch { toast.error('Erro ao gerar PDF.'); }
  };

  const filteredPac = pacientes.filter(p => p.nome?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h1 className="text-3xl font-bold tracking-tight">Prescrições e Prontuários</h1><p className="text-muted-foreground mt-2">Gerencie prescrições médicas e prontuários dos pacientes.</p></div>
        <button onClick={() => { setForm({...emptyP, paciente_id: selPaciente}); setModal(true); }} className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/25">
          <Plus className="w-5 h-5" /> Nova Prescrição
        </button>
      </div>
      <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl w-fit">
        <button onClick={() => setTab('prescricoes')} className={cn("px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-all", tab === 'prescricoes' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground')}><Pill className="w-4 h-4" /> Prescrições</button>
        <button onClick={() => setTab('prontuarios')} className={cn("px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-all", tab === 'prontuarios' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground')}><FileText className="w-4 h-4" /> Prontuários</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-4 sm:p-6 lg:col-span-1">
          <h3 className="font-semibold mb-4">Selecionar Paciente</h3>
          <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-10 px-4 rounded-lg bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm mb-3" />
          {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
            <div className="space-y-1 max-h-[400px] overflow-y-auto">{filteredPac.map(p => (
              <button key={p.id} onClick={() => setSelPaciente(p.id)} className={cn("w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm", selPaciente === p.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-secondary')}>{p.nome}</button>
            ))}</div>
          )}
        </div>
        <div className="glass rounded-2xl p-4 sm:p-6 lg:col-span-2">
          <h3 className="font-semibold mb-4 capitalize">{tab}</h3>
          {!selPaciente ? <p className="text-center py-12 text-muted-foreground">Selecione um paciente para ver os registros.</p>
          : items.length === 0 ? <p className="text-center py-12 text-muted-foreground">Nenhum registro encontrado.</p>
          : (
            <div className="space-y-3">{items.map((item: any, i: number) => (
              <div key={i} className="p-4 rounded-xl border border-border/50 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {tab === 'prescricoes' ? <Pill className="w-4 h-4 text-green-500" /> : <FileText className="w-4 h-4 text-blue-500" />}
                    <span className="font-medium text-sm">{item.medicamento || item.titulo || 'Registro'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{item.criado_em ? new Date(item.criado_em).toLocaleDateString('pt-BR') : ''}</span>
                    <button onClick={() => downloadPdf(item.id, tab)} className="p-1.5 hover:bg-secondary rounded-lg transition-colors" title="Baixar PDF"><Download className="w-4 h-4 text-muted-foreground" /></button>
                  </div>
                </div>
                {tab === 'prescricoes' && <p className="text-sm text-muted-foreground">{item.dosagem} — {item.via} — {item.frequencia} — {item.duracao}</p>}
                {item.observacoes && <p className="text-xs text-muted-foreground mt-1">{item.observacoes}</p>}
              </div>
            ))}</div>
          )}
        </div>
      </div>
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}><div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 border-b border-border/50"><h2 className="text-xl font-semibold">Nova Prescrição</h2><button onClick={() => setModal(false)} className="p-2 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button></div>
          <form onSubmit={submit} className="p-6 space-y-4">
            <div><label className="block text-sm font-medium mb-1.5">Medicamento *</label><input type="text" required value={form.medicamento} onChange={e => setForm(p => ({...p, medicamento: e.target.value}))} className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Ex: Amoxicilina" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1.5">Dosagem *</label><input type="text" required value={form.dosagem} onChange={e => setForm(p => ({...p, dosagem: e.target.value}))} className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="500mg" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Via *</label><select value={form.via} onChange={e => setForm(p => ({...p, via: e.target.value}))} className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"><option value="oral">Oral</option><option value="intravenosa">Intravenosa</option><option value="intramuscular">Intramuscular</option><option value="subcutanea">Subcutânea</option><option value="topica">Tópica</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1.5">Frequência *</label><input type="text" required value={form.frequencia} onChange={e => setForm(p => ({...p, frequencia: e.target.value}))} className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="8/8h" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Duração</label><input type="text" value={form.duracao} onChange={e => setForm(p => ({...p, duracao: e.target.value}))} className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="7 dias" /></div>
            </div>
            <div><label className="block text-sm font-medium mb-1.5">Observações</label><textarea value={form.observacoes} onChange={e => setForm(p => ({...p, observacoes: e.target.value}))} rows={2} className="w-full px-4 py-2 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" /></div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(false)} className="flex-1 h-12 rounded-xl border border-border font-medium hover:bg-secondary transition-colors">Cancelar</button>
              <button type="submit" disabled={busy} className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/25">{busy ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar Prescrição'}</button>
            </div>
          </form>
        </div></div>
      )}
    </div>
  );
}
