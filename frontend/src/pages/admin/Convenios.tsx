import { useState, useEffect, useCallback } from 'react';
import { Building, Plus, Pencil, Trash2, X, Loader2, Search, Shield, Phone, Mail, Hash } from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface Convenio {
  id: string;
  nome: string;
  registro_ans: string;
  tipo: string;
  email: string;
  telefone: string;
  cobertura: string;
  tabela_preco: string;
  ativo: boolean;
  criado_em: string;
}

interface ConvenioForm {
  nome: string;
  registro_ans: string;
  tipo: string;
  email: string;
  telefone: string;
  cobertura: string;
  tabela_preco: string;
}

const emptyForm: ConvenioForm = {
  nome: '', registro_ans: '', tipo: 'PLANO_SAUDE', email: '', telefone: '', cobertura: 'AMBULATORIAL', tabela_preco: 'TISS'
};

const tipos = [
  { value: 'PLANO_SAUDE', label: 'Plano de Saúde' },
  { value: 'SEGURO_SAUDE', label: 'Seguro Saúde' },
  { value: 'COOPERATIVA', label: 'Cooperativa Médica' },
  { value: 'SUS', label: 'SUS' },
  { value: 'PARTICULAR', label: 'Particular' },
];

const coberturas = [
  { value: 'AMBULATORIAL', label: 'Ambulatorial' },
  { value: 'HOSPITALAR', label: 'Hospitalar' },
  { value: 'OBSTETRICO', label: 'Obstétrico' },
  { value: 'AMBULATORIAL_HOSPITALAR', label: 'Ambulatorial + Hospitalar' },
  { value: 'COMPLETO', label: 'Completo (Amb + Hosp + Odonto)' },
];

export function Convenios() {
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ConvenioForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const fetchConvenios = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/cadastros/convenios');
      setConvenios(Array.isArray(data) ? data : data.convenios || []);
    } catch {
      // Toast handled by interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConvenios(); }, [fetchConvenios]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/cadastros/convenios/${editing}`, form);
        toast.success('Convênio atualizado com sucesso!');
      } else {
        await api.post('/cadastros/convenios', form);
        toast.success('Convênio cadastrado com sucesso!');
      }
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      fetchConvenios();
    } catch {
      // handled by interceptor
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja inativar este convênio?')) return;
    try {
      await api.delete(`/cadastros/convenios/${id}`);
      toast.success('Convênio inativado com sucesso!');
      fetchConvenios();
    } catch { /* interceptor */ }
  };

  const openEdit = (c: Convenio) => {
    setEditing(c.id);
    setForm({
      nome: c.nome, registro_ans: c.registro_ans, tipo: c.tipo,
      email: c.email, telefone: c.telefone, cobertura: c.cobertura, tabela_preco: c.tabela_preco
    });
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const filtered = convenios.filter(c =>
    c.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.registro_ans?.includes(search) ||
    c.tipo?.toLowerCase().includes(search.toLowerCase())
  );

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      'PLANO_SAUDE': 'bg-blue-500/10 text-blue-500',
      'SEGURO_SAUDE': 'bg-violet-500/10 text-violet-500',
      'COOPERATIVA': 'bg-emerald-500/10 text-emerald-500',
      'SUS': 'bg-amber-500/10 text-amber-500',
      'PARTICULAR': 'bg-rose-500/10 text-rose-500',
    };
    return colors[tipo] || 'bg-gray-500/10 text-gray-500';
  };

  const getTipoLabel = (tipo: string) => tipos.find(t => t.value === tipo)?.label || tipo;
  const getCoberturaLabel = (cob: string) => coberturas.find(c => c.value === cob)?.label || cob;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Operadoras e Convênios</h1>
          <p className="text-muted-foreground mt-2">Configure regras de negócio e tabelas de preço por plano de saúde.</p>
        </div>
        <button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/25">
          <Plus className="w-5 h-5" /> Novo Convênio
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: convenios.length, color: 'text-primary' },
          { label: 'Planos de Saúde', value: convenios.filter(c => c.tipo === 'PLANO_SAUDE').length, color: 'text-blue-500' },
          { label: 'Cooperativas', value: convenios.filter(c => c.tipo === 'COOPERATIVA').length, color: 'text-emerald-500' },
          { label: 'SUS', value: convenios.filter(c => c.tipo === 'SUS').length, color: 'text-amber-500' },
          { label: 'Particular', value: convenios.filter(c => c.tipo === 'PARTICULAR').length, color: 'text-rose-500' },
        ].map(stat => (
          <div key={stat.label} className="glass rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-4 sm:p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input type="text" placeholder="Buscar por nome, registro ANS ou tipo..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-12 pl-10 pr-4 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Nenhum convênio encontrado</p>
            <p className="text-sm mt-1">Clique em "Novo Convênio" para cadastrar o primeiro.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
            {filtered.map(c => (
              <div key={c.id} className="animate-fade-in-up border border-border/50 rounded-xl p-5 hover:shadow-lg transition-all hover:-translate-y-0.5 bg-background/50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{c.nome}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTipoColor(c.tipo)}`}>
                        {getTipoLabel(c.tipo)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(c)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Editar">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors" title="Inativar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><Hash className="w-4 h-4 flex-shrink-0" /> ANS: {c.registro_ans || 'Não informado'}</p>
                  <p className="flex items-center gap-2"><Shield className="w-4 h-4 flex-shrink-0" /> {getCoberturaLabel(c.cobertura)}</p>
                  <p className="flex items-center gap-2"><Mail className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{c.email || 'N/A'}</span></p>
                  <p className="flex items-center gap-2"><Phone className="w-4 h-4 flex-shrink-0" /> {c.telefone || 'N/A'}</p>
                </div>
                <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Tabela: <span className="font-medium text-foreground">{c.tabela_preco}</span></span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.ativo !== false ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {c.ativo !== false ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
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
              <h2 className="text-xl font-semibold">{editing ? 'Editar Convênio' : 'Novo Convênio'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-secondary rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nome da Operadora *</label>
                <input type="text" required value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Ex: Unimed, Amil, SulAmérica..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Registro ANS</label>
                  <input type="text" value={form.registro_ans} onChange={e => setForm(p => ({ ...p, registro_ans: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Nº ANS" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tipo *</label>
                  <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                    {tipos.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Cobertura *</label>
                  <select value={form.cobertura} onChange={e => setForm(p => ({ ...p, cobertura: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                    {coberturas.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tabela de Preço</label>
                  <select value={form.tabela_preco} onChange={e => setForm(p => ({ ...p, tabela_preco: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                    <option value="TISS">TISS</option>
                    <option value="TUSS">TUSS</option>
                    <option value="SUS">Tabela SUS</option>
                    <option value="PROPRIA">Tabela Própria</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">E-mail</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="contato@operadora.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Telefone</label>
                  <input type="text" value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="0800 XXX XXXX" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 h-12 rounded-xl border border-border font-medium hover:bg-secondary transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/25">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editing ? 'Salvar Alterações' : 'Cadastrar Convênio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
