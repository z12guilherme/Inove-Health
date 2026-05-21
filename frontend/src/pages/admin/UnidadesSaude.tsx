import { useState, useEffect, useCallback } from 'react';
import { Hospital, Plus, Pencil, Trash2, Users, X, Loader2, Search, MapPin, Building2, Phone, Bed } from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface Unidade {
  id: string;
  nome: string;
  tipo: string;
  endereco: string;
  telefone: string;
  capacidade_leitos: number;
  ativo: boolean;
  criado_em: string;
}

interface UnidadeForm {
  nome: string;
  tipo: string;
  endereco: string;
  telefone: string;
  capacidade_leitos: number;
}

const emptyForm: UnidadeForm = { nome: '', tipo: 'UPA', endereco: '', telefone: '', capacidade_leitos: 0 };

export function UnidadesSaude() {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<UnidadeForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [funcionarios, setFuncionarios] = useState<Record<string, any[]>>({});

  const fetchUnidades = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/unidades-saude');
      setUnidades(Array.isArray(data) ? data : data.unidades || []);
    } catch {
      // Toast handled by interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUnidades(); }, [fetchUnidades]);

  const fetchFuncionarios = async (unidadeId: string) => {
    try {
      const { data } = await api.get(`/unidades-saude/${unidadeId}/funcionarios`);
      setFuncionarios(prev => ({ ...prev, [unidadeId]: Array.isArray(data) ? data : data.funcionarios || [] }));
    } catch { /* silent */ }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/unidades-saude/${editing}`, form);
        toast.success('Unidade atualizada com sucesso!');
      } else {
        await api.post('/unidades-saude', form);
        toast.success('Unidade criada com sucesso!');
      }
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      fetchUnidades();
    } catch {
      // handled by interceptor
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja inativar esta unidade?')) return;
    try {
      await api.delete(`/unidades-saude/${id}`);
      toast.success('Unidade inativada com sucesso!');
      fetchUnidades();
    } catch { /* interceptor */ }
  };

  const openEdit = (u: Unidade) => {
    setEditing(u.id);
    setForm({ nome: u.nome, tipo: u.tipo, endereco: u.endereco, telefone: u.telefone, capacidade_leitos: u.capacidade_leitos });
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const filtered = unidades.filter(u =>
    u.nome?.toLowerCase().includes(search.toLowerCase()) ||
    u.tipo?.toLowerCase().includes(search.toLowerCase()) ||
    u.endereco?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Gestão Hospitalar</h1>
          <p className="text-slate-500 mt-2 font-medium">Controle centralizado de UPAs, Hospitais e Clínicas parceiras.</p>
        </div>
        <button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-200">
          <Plus className="w-5 h-5" /> Nova Unidade
        </button>
      </div>

      <div className="bg-white/40 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl shadow-slate-200/50">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Buscar por nome, tipo ou endereço..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/50 border-none focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-inner text-slate-700 font-medium placeholder:text-slate-400" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Hospital className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Nenhuma unidade encontrada</p>
            <p className="text-sm mt-1">Clique em "Nova Unidade" para criar a primeira.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
            {filtered.map(u => (
              <div key={u.id} className="group animate-in slide-in-from-bottom-4 duration-500 border border-white bg-white/60 backdrop-blur-md rounded-2xl p-6 hover:shadow-2xl transition-all hover:-translate-y-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Building2 className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg leading-tight">{u.nome}</h3>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-lg bg-indigo-100 text-indigo-700 font-black">{u.tipo}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(u)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors" title="Editar">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors" title="Inativar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-3 mt-4 text-sm text-slate-500 font-medium">
                  <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> {u.endereco || 'Endereço não informado'}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100/50">
                    <p className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-slate-400" /> {u.telefone || 'N/A'}</p>
                    <p className="flex items-center gap-1.5 font-bold text-slate-700"><Bed className="w-4 h-4 text-indigo-500" /> {u.capacidade_leitos} leitos</p>
                  </div>
                </div>
                <button onClick={() => fetchFuncionarios(u.id)} className="mt-4 w-full py-2 text-xs text-indigo-600 font-bold bg-indigo-50/50 hover:bg-indigo-100 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Users className="w-3.5 h-3.5" /> Colaboradores
                </button>
                {funcionarios[u.id] && (
                  <div className="mt-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg p-2">
                    {funcionarios[u.id].length > 0 ? `${funcionarios[u.id].length} funcionário(s) associado(s)` : 'Nenhum funcionário associado'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <h2 className="text-xl font-semibold">{editing ? 'Editar Unidade' : 'Nova Unidade de Saúde'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-secondary rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nome da Unidade *</label>
                <input type="text" required value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Ex: UPA Centro" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Tipo *</label>
                <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                  <option value="UPA">UPA</option>
                  <option value="HOSPITAL">Hospital</option>
                  <option value="UBS">UBS</option>
                  <option value="CLINICA">Clínica</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Endereço *</label>
                <input type="text" required value={form.endereco} onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Rua, número, bairro..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Telefone</label>
                  <input type="text" value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="(XX) XXXXX-XXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Capacidade (Leitos)</label>
                  <input type="number" min={0} value={form.capacidade_leitos} onChange={e => setForm(p => ({ ...p, capacidade_leitos: Number(e.target.value) }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 h-12 rounded-xl border border-border font-medium hover:bg-secondary transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/25">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editing ? 'Salvar Alterações' : 'Criar Unidade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
