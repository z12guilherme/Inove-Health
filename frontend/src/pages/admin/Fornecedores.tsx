import { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Pencil, Trash2, X, Loader2, Search, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface Fornecedor {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  categoria: string;
  ativo: boolean;
  criado_em: string;
}

interface FornecedorForm {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  categoria: string;
}

const emptyForm: FornecedorForm = {
  razao_social: '', nome_fantasia: '', cnpj: '', email: '', telefone: '', endereco: '', categoria: 'MEDICAMENTOS'
};

const categorias = [
  { value: 'MEDICAMENTOS', label: 'Medicamentos' },
  { value: 'MATERIAIS_HOSPITALARES', label: 'Materiais Hospitalares' },
  { value: 'EQUIPAMENTOS', label: 'Equipamentos Médicos' },
  { value: 'EPI', label: 'EPIs' },
  { value: 'LABORATORIO', label: 'Insumos de Laboratório' },
  { value: 'OUTROS', label: 'Outros' },
];

export function Fornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FornecedorForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const fetchFornecedores = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/cadastros/fornecedores');
      setFornecedores(Array.isArray(data) ? data : data.fornecedores || []);
    } catch {
      // Toast handled by interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFornecedores(); }, [fetchFornecedores]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/cadastros/fornecedores/${editing}`, form);
        toast.success('Fornecedor atualizado com sucesso!');
      } else {
        await api.post('/cadastros/fornecedores', form);
        toast.success('Fornecedor cadastrado com sucesso!');
      }
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      fetchFornecedores();
    } catch {
      // handled by interceptor
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja inativar este fornecedor?')) return;
    try {
      await api.delete(`/cadastros/fornecedores/${id}`);
      toast.success('Fornecedor inativado com sucesso!');
      fetchFornecedores();
    } catch { /* interceptor */ }
  };

  const openEdit = (f: Fornecedor) => {
    setEditing(f.id);
    setForm({
      razao_social: f.razao_social, nome_fantasia: f.nome_fantasia, cnpj: f.cnpj,
      email: f.email, telefone: f.telefone, endereco: f.endereco, categoria: f.categoria
    });
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const filtered = fornecedores.filter(f =>
    f.razao_social?.toLowerCase().includes(search.toLowerCase()) ||
    f.nome_fantasia?.toLowerCase().includes(search.toLowerCase()) ||
    f.cnpj?.includes(search) ||
    f.categoria?.toLowerCase().includes(search.toLowerCase())
  );

  const getCategoriaColor = (cat: string) => {
    const colors: Record<string, string> = {
      'MEDICAMENTOS': 'bg-emerald-500/10 text-emerald-500',
      'MATERIAIS_HOSPITALARES': 'bg-blue-500/10 text-blue-500',
      'EQUIPAMENTOS': 'bg-violet-500/10 text-violet-500',
      'EPI': 'bg-amber-500/10 text-amber-500',
      'LABORATORIO': 'bg-cyan-500/10 text-cyan-500',
      'OUTROS': 'bg-gray-500/10 text-gray-500',
    };
    return colors[cat] || colors['OUTROS'];
  };

  const getCategoriaLabel = (cat: string) => categorias.find(c => c.value === cat)?.label || cat;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cadastro de Fornecedores</h1>
          <p className="text-muted-foreground mt-2">Gerencie parceiros e distribuidores de medicamentos e materiais.</p>
        </div>
        <button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/25">
          <Plus className="w-5 h-5" /> Novo Fornecedor
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: fornecedores.length, color: 'text-primary' },
          { label: 'Medicamentos', value: fornecedores.filter(f => f.categoria === 'MEDICAMENTOS').length, color: 'text-emerald-500' },
          { label: 'Materiais', value: fornecedores.filter(f => f.categoria === 'MATERIAIS_HOSPITALARES').length, color: 'text-blue-500' },
          { label: 'EPIs', value: fornecedores.filter(f => f.categoria === 'EPI').length, color: 'text-amber-500' },
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
          <input type="text" placeholder="Buscar por nome, CNPJ ou categoria..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-12 pl-10 pr-4 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Nenhum fornecedor encontrado</p>
            <p className="text-sm mt-1">Clique em "Novo Fornecedor" para cadastrar o primeiro.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
            {filtered.map(f => (
              <div key={f.id} className="animate-fade-in-up border border-border/50 rounded-xl p-5 hover:shadow-lg transition-all hover:-translate-y-0.5 bg-background/50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{f.nome_fantasia || f.razao_social}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoriaColor(f.categoria)}`}>
                        {getCategoriaLabel(f.categoria)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(f)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Editar">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(f.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors" title="Inativar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><FileText className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{f.cnpj || 'CNPJ não informado'}</span></p>
                  <p className="flex items-center gap-2"><Mail className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{f.email || 'E-mail não informado'}</span></p>
                  <p className="flex items-center gap-2"><Phone className="w-4 h-4 flex-shrink-0" /> {f.telefone || 'N/A'}</p>
                  <p className="flex items-center gap-2"><MapPin className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{f.endereco || 'Endereço não informado'}</span></p>
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
              <h2 className="text-xl font-semibold">{editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-secondary rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Razão Social *</label>
                <input type="text" required value={form.razao_social} onChange={e => setForm(p => ({ ...p, razao_social: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Razão social completa" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nome Fantasia</label>
                  <input type="text" value={form.nome_fantasia} onChange={e => setForm(p => ({ ...p, nome_fantasia: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Nome fantasia" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">CNPJ *</label>
                  <input type="text" required value={form.cnpj} onChange={e => setForm(p => ({ ...p, cnpj: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="XX.XXX.XXX/XXXX-XX" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Categoria *</label>
                <select value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                  {categorias.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">E-mail</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="contato@empresa.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Telefone</label>
                  <input type="text" value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="(XX) XXXXX-XXXX" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Endereço</label>
                <input type="text" value={form.endereco} onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Rua, número, bairro, cidade..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 h-12 rounded-xl border border-border font-medium hover:bg-secondary transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/25">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editing ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
