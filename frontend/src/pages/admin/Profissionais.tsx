import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Pencil, Trash2, X, Loader2, Search, Stethoscope, HeartPulse } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

type Tab = 'medicos' | 'enfermeiros';
interface Profissional { id: string; nome: string; email: string; crm?: string; coren?: string; especialidade?: string; ativo: boolean; }
interface PForm { nome: string; email: string; senha: string; crm: string; coren: string; especialidade: string; }
const empty: PForm = { nome: '', email: '', senha: '', crm: '', coren: '', especialidade: '' };

export function Profissionais() {
  const [tab, setTab] = useState<Tab>('medicos');
  const [list, setList] = useState<Profissional[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PForm>(empty);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const ep = tab === 'medicos' ? '/medicos' : '/enfermeiros';

  const load = useCallback(async () => {
    try { setLoading(true); const { data } = await api.get(ep); setList(Array.isArray(data) ? data : data[tab] || []); } catch {} finally { setLoading(false); }
  }, [ep, tab]);
  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const p: Record<string, any> = { nome: form.nome, email: form.email, especialidade: form.especialidade };
      if (!editId) p.senha = form.senha;
      if (tab === 'medicos') p.crm = form.crm; else p.coren = form.coren;
      if (editId) { await api.put(`${ep}/${editId}`, p); toast.success('Atualizado!'); }
      else { await api.post(ep, p); toast.success('Registrado!'); }
      setModal(false); setEditId(null); setForm(empty); load();
    } catch {} finally { setBusy(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Inativar este profissional?')) return;
    try { await api.delete(`${ep}/${id}`); toast.success('Inativado!'); load(); } catch {}
  };

  const edit = (p: Profissional) => { setEditId(p.id); setForm({ nome: p.nome, email: p.email, senha: '', crm: p.crm||'', coren: p.coren||'', especialidade: p.especialidade||'' }); setModal(true); };
  const create = () => { setEditId(null); setForm(empty); setModal(true); };
  const filtered = list.filter(p => p.nome?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Profissionais</h1>
          <p className="text-muted-foreground mt-2">Registre e gerencie médicos e enfermeiros.</p>
        </div>
        <button onClick={create} className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/25">
          <Plus className="w-5 h-5" /> Novo Profissional
        </button>
      </div>
      <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl w-fit">
        <button onClick={() => setTab('medicos')} className={cn("px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-all", tab === 'medicos' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}><Stethoscope className="w-4 h-4" /> Médicos</button>
        <button onClick={() => setTab('enfermeiros')} className={cn("px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-all", tab === 'enfermeiros' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}><HeartPulse className="w-4 h-4" /> Enfermeiros</button>
      </div>
      <div className="glass rounded-2xl p-4 sm:p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-12 pl-10 pr-4 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
        </div>
        {loading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        : filtered.length === 0 ? <div className="text-center py-20 text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nenhum profissional encontrado</p></div>
        : (
          <div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="border-b border-border/50 text-muted-foreground text-sm">
            <th className="pb-3 font-medium px-4">Nome</th><th className="pb-3 font-medium px-4">Email</th><th className="pb-3 font-medium px-4">{tab === 'medicos' ? 'CRM' : 'COREN'}</th><th className="pb-3 font-medium px-4">Especialidade</th><th className="pb-3 font-medium px-4 text-right">Ações</th>
          </tr></thead><tbody>{filtered.map(p => (
            <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
              <td className="py-4 px-4"><div className="flex items-center gap-3"><div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold", tab === 'medicos' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500')}>{p.nome?.charAt(0)}</div><span className="font-medium">{p.nome}</span></div></td>
              <td className="py-4 px-4 text-muted-foreground text-sm">{p.email}</td>
              <td className="py-4 px-4 text-sm font-mono">{tab === 'medicos' ? p.crm : p.coren}</td>
              <td className="py-4 px-4 text-sm">{p.especialidade || '—'}</td>
              <td className="py-4 px-4 text-right"><div className="flex justify-end gap-1">
                <button onClick={() => edit(p)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => del(p.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div></td>
            </tr>
          ))}</tbody></table></div>
        )}
      </div>
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}><div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 border-b border-border/50"><h2 className="text-xl font-semibold">{editId ? 'Editar' : 'Registrar'} {tab === 'medicos' ? 'Médico' : 'Enfermeiro'}</h2><button onClick={() => setModal(false)} className="p-2 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button></div>
          <form onSubmit={submit} className="p-6 space-y-4">
            <div><label className="block text-sm font-medium mb-1.5">Nome *</label><input type="text" required value={form.nome} onChange={e => setForm(p => ({...p, nome: e.target.value}))} className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" /></div>
            <div><label className="block text-sm font-medium mb-1.5">Email *</label><input type="email" required value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" /></div>
            {!editId && <div><label className="block text-sm font-medium mb-1.5">Senha *</label><input type="password" required value={form.senha} onChange={e => setForm(p => ({...p, senha: e.target.value}))} className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" /></div>}
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1.5">{tab === 'medicos' ? 'CRM' : 'COREN'} *</label><input type="text" required value={tab === 'medicos' ? form.crm : form.coren} onChange={e => setForm(p => tab === 'medicos' ? {...p, crm: e.target.value} : {...p, coren: e.target.value})} className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Especialidade</label><input type="text" value={form.especialidade} onChange={e => setForm(p => ({...p, especialidade: e.target.value}))} className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" /></div>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setModal(false)} className="flex-1 h-12 rounded-xl border border-border font-medium hover:bg-secondary transition-colors">Cancelar</button>
              <button type="submit" disabled={busy} className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/25">{busy ? <Loader2 className="w-5 h-5 animate-spin" /> : editId ? 'Salvar' : 'Registrar'}</button>
            </div>
          </form>
        </div></div>
      )}
    </div>
  );
}
