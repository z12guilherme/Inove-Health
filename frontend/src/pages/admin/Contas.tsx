import { useState, useEffect, useCallback } from 'react';
import { Wallet, Plus, Pencil, Trash2, X, Loader2, Search, ArrowUpCircle, ArrowDownCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface Fornecedor {
  id: string;
  razao_social: string;
  nome_fantasia: string;
}

interface Conta {
  id: string;
  tipo: 'PAGAR' | 'RECEBER';
  descricao: string;
  valor: number;
  dataVencimento: string;
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO';
  fornecedorId?: string;
  dataPagamento?: string;
  observacao?: string;
}

interface ContaForm {
  tipo: 'PAGAR' | 'RECEBER';
  descricao: string;
  valor: number | '';
  dataVencimento: string;
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO';
  fornecedorId: string;
  observacao: string;
}

interface Resumo {
  saldoReceber: number;
  saldoPagar: number;
  totalAtrasado: number;
  vencemHoje: number;
}

const emptyForm: ContaForm = {
  tipo: 'PAGAR', descricao: '', valor: '', dataVencimento: new Date().toISOString().split('T')[0], status: 'PENDENTE', fornecedorId: '', observacao: ''
};

export function Contas() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ContaForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'TODAS' | 'PAGAR' | 'RECEBER'>('TODAS');

  const fetchDados = useCallback(async () => {
    try {
      setLoading(true);
      const [contasRes, fornecedoresRes, resumoRes] = await Promise.all([
        api.get('/financeiro/contas'),
        api.get('/cadastros/fornecedores'),
        api.get('/financeiro/contas/resumo')
      ]);
      setContas(Array.isArray(contasRes.data) ? contasRes.data : []);
      setFornecedores(Array.isArray(fornecedoresRes.data) ? fornecedoresRes.data : fornecedoresRes.data.fornecedores || []);
      setResumo(resumoRes.data);
    } catch {
      // toast handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDados(); }, [fetchDados]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, valor: Number(form.valor) };
      if (editing) {
        await api.put(`/financeiro/contas/${editing}`, payload);
        toast.success('Conta atualizada com sucesso!');
      } else {
        await api.post('/financeiro/contas', payload);
        toast.success('Conta cadastrada com sucesso!');
      }
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      fetchDados();
    } catch {
      // interceptor
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;
    try {
      await api.delete(`/financeiro/contas/${id}`);
      toast.success('Conta excluída com sucesso!');
      fetchDados();
    } catch { /* interceptor */ }
  };

  const handleMarcarPago = async (id: string) => {
    try {
      await api.patch(`/financeiro/contas/${id}/pagar`);
      toast.success('Status atualizado para PAGO!');
      fetchDados();
    } catch { /* interceptor */ }
  };

  const openEdit = (c: Conta) => {
    setEditing(c.id);
    setForm({
      tipo: c.tipo, descricao: c.descricao, valor: c.valor, dataVencimento: c.dataVencimento,
      status: c.status, fornecedorId: c.fornecedorId || '', observacao: c.observacao || ''
    });
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const filtered = contas.filter(c => {
    const matchSearch = c.descricao.toLowerCase().includes(search.toLowerCase());
    const matchTipo = filtroTipo === 'TODAS' || c.tipo === filtroTipo;
    return matchSearch && matchTipo;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAGO': return 'bg-emerald-500/10 text-emerald-500';
      case 'ATRASADO': return 'bg-destructive/10 text-destructive';
      default: return 'bg-amber-500/10 text-amber-500';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground mt-2">Controle de contas a pagar e a receber.</p>
        </div>
        <button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/25">
          <Plus className="w-5 h-5" /> Nova Conta
        </button>
      </div>

      {/* Stats Bar */}
      {resumo && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass rounded-xl p-4 text-center border-b-4 border-emerald-500">
            <p className="text-2xl font-bold text-emerald-500">{formatCurrency(resumo.saldoReceber)}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><ArrowUpCircle className="w-4 h-4" /> A Receber</p>
          </div>
          <div className="glass rounded-xl p-4 text-center border-b-4 border-amber-500">
            <p className="text-2xl font-bold text-amber-500">{formatCurrency(resumo.saldoPagar)}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><ArrowDownCircle className="w-4 h-4" /> A Pagar</p>
          </div>
          <div className="glass rounded-xl p-4 text-center border-b-4 border-destructive">
            <p className="text-2xl font-bold text-destructive">{formatCurrency(resumo.totalAtrasado)}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><AlertCircle className="w-4 h-4" /> Atrasado</p>
          </div>
          <div className="glass rounded-xl p-4 text-center border-b-4 border-blue-500">
            <p className="text-2xl font-bold text-blue-500">{formatCurrency(resumo.vencemHoje)}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><AlertCircle className="w-4 h-4" /> Vencem Hoje</p>
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input type="text" placeholder="Buscar por descrição..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
          </div>
          <div className="flex gap-2">
            {(['TODAS', 'PAGAR', 'RECEBER'] as const).map(tipo => (
              <button key={tipo} onClick={() => setFiltroTipo(tipo)}
                className={`px-4 h-12 rounded-xl text-sm font-medium transition-colors ${filtroTipo === tipo ? 'bg-primary text-primary-foreground' : 'bg-background/50 border border-border hover:bg-secondary text-muted-foreground'}`}>
                {tipo === 'TODAS' ? 'Todas' : tipo === 'PAGAR' ? 'A Pagar' : 'A Receber'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Nenhuma conta encontrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
            {filtered.map(c => (
              <div key={c.id} className={`animate-fade-in-up border ${c.tipo === 'PAGAR' ? 'border-amber-500/20' : 'border-emerald-500/20'} rounded-xl p-5 hover:shadow-lg transition-all hover:-translate-y-0.5 bg-background/50`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl ${c.tipo === 'PAGAR' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'} flex items-center justify-center flex-shrink-0`}>
                      {c.tipo === 'PAGAR' ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{c.descricao}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {c.status !== 'PAGO' && (
                       <button onClick={() => handleMarcarPago(c.id)} className="p-2 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Marcar como Pago">
                         <CheckCircle className="w-4 h-4" />
                       </button>
                    )}
                    <button onClick={() => openEdit(c)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Editar">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors" title="Excluir">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm">
                  <p className="text-xl font-bold">{formatCurrency(c.valor)}</p>
                  <p className="text-muted-foreground text-xs">Vencimento: {new Date(c.dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                  {c.fornecedorId && (
                     <p className="text-muted-foreground text-xs truncate">Fornecedor: {fornecedores.find(f => f.id === c.fornecedorId)?.nome_fantasia || 'Desconhecido'}</p>
                  )}
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
              <h2 className="text-xl font-semibold">{editing ? 'Editar Conta' : 'Nova Conta'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-secondary rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tipo *</label>
                  <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value as 'PAGAR' | 'RECEBER' }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                    <option value="PAGAR">A Pagar (Saída)</option>
                    <option value="RECEBER">A Receber (Entrada)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Valor (R$) *</label>
                  <input type="number" step="0.01" required value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value ? Number(e.target.value) : '' }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Descrição *</label>
                <input type="text" required value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Ex: Aluguel, Equipamentos..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Vencimento *</label>
                  <input type="date" required value={form.dataVencimento} onChange={e => setForm(p => ({ ...p, dataVencimento: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Status *</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                    <option value="PENDENTE">Pendente</option>
                    <option value="PAGO">Pago / Recebido</option>
                  </select>
                </div>
              </div>
              {form.tipo === 'PAGAR' && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Fornecedor (Opcional)</label>
                  <select value={form.fornecedorId} onChange={e => setForm(p => ({ ...p, fornecedorId: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                    <option value="">Nenhum</option>
                    {fornecedores.map(f => (
                      <option key={f.id} value={f.id}>{f.nome_fantasia || f.razao_social}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 h-12 rounded-xl border border-border font-medium hover:bg-secondary transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/25">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editing ? 'Salvar' : 'Adicionar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
