import { useState, useEffect, useCallback } from 'react';
import { Box, Plus, Pencil, Trash2, X, Loader2, Search, AlertTriangle, Package, Calendar, Hash, TrendingDown, TrendingUp, BarChart3 } from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface Insumo {
  id: string;
  nome: string;
  codigo: string;
  categoria: string;
  unidade_medida: string;
  quantidade_atual: number;
  quantidade_minima: number;
  lote: string;
  validade: string;
  fornecedor_id: string;
  fornecedor_nome: string;
  preco_unitario: number;
  localizacao: string;
  ativo: boolean;
  criado_em: string;
}

interface InsumoForm {
  nome: string;
  codigo: string;
  categoria: string;
  unidade_medida: string;
  quantidade_atual: number;
  quantidade_minima: number;
  lote: string;
  validade: string;
  fornecedor_nome: string;
  preco_unitario: number;
  localizacao: string;
}

const emptyForm: InsumoForm = {
  nome: '', codigo: '', categoria: 'MEDICAMENTO', unidade_medida: 'UN',
  quantidade_atual: 0, quantidade_minima: 10, lote: '', validade: '',
  fornecedor_nome: '', preco_unitario: 0, localizacao: ''
};

const categoriasList = [
  { value: 'MEDICAMENTO', label: 'Medicamento' },
  { value: 'MATERIAL_HOSPITALAR', label: 'Material Hospitalar' },
  { value: 'EPI', label: 'EPI' },
  { value: 'MATERIAL_LABORATORIO', label: 'Material de Laboratório' },
  { value: 'DESCARTAVEL', label: 'Descartável' },
  { value: 'EQUIPAMENTO', label: 'Equipamento' },
];

const unidadesList = [
  { value: 'UN', label: 'Unidade' },
  { value: 'CX', label: 'Caixa' },
  { value: 'PCT', label: 'Pacote' },
  { value: 'FR', label: 'Frasco' },
  { value: 'AMP', label: 'Ampola' },
  { value: 'CP', label: 'Comprimido' },
  { value: 'ML', label: 'mL' },
  { value: 'L', label: 'Litro' },
  { value: 'KG', label: 'Kg' },
  { value: 'M', label: 'Metro' },
  { value: 'RL', label: 'Rolo' },
];

export function Insumos() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<InsumoForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');

  const fetchInsumos = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/estoque/insumos');
      setInsumos(Array.isArray(data) ? data : data.insumos || []);
    } catch {
      // Toast handled by interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInsumos(); }, [fetchInsumos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/estoque/insumos/${editing}`, form);
        toast.success('Insumo atualizado com sucesso!');
      } else {
        await api.post('/estoque/insumos', form);
        toast.success('Insumo cadastrado com sucesso!');
      }
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      fetchInsumos();
    } catch {
      // handled by interceptor
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja inativar este insumo?')) return;
    try {
      await api.delete(`/estoque/insumos/${id}`);
      toast.success('Insumo inativado com sucesso!');
      fetchInsumos();
    } catch { /* interceptor */ }
  };

  const openEdit = (i: Insumo) => {
    setEditing(i.id);
    setForm({
      nome: i.nome, codigo: i.codigo, categoria: i.categoria, unidade_medida: i.unidade_medida,
      quantidade_atual: i.quantidade_atual, quantidade_minima: i.quantidade_minima, lote: i.lote,
      validade: i.validade, fornecedor_nome: i.fornecedor_nome, preco_unitario: i.preco_unitario,
      localizacao: i.localizacao
    });
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const isExpiringSoon = (validade: string) => {
    if (!validade) return false;
    const diff = new Date(validade).getTime() - Date.now();
    return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000; // 90 days
  };

  const isExpired = (validade: string) => {
    if (!validade) return false;
    return new Date(validade).getTime() < Date.now();
  };

  const isLowStock = (i: Insumo) => i.quantidade_atual <= i.quantidade_minima;

  const filtered = insumos.filter(i => {
    const matchSearch = i.nome?.toLowerCase().includes(search.toLowerCase()) ||
      i.codigo?.toLowerCase().includes(search.toLowerCase()) ||
      i.lote?.toLowerCase().includes(search.toLowerCase());
    const matchCategoria = !filterCategoria || i.categoria === filterCategoria;
    return matchSearch && matchCategoria;
  });

  const lowStockCount = insumos.filter(isLowStock).length;
  const expiringCount = insumos.filter(i => isExpiringSoon(i.validade)).length;
  const expiredCount = insumos.filter(i => isExpired(i.validade)).length;
  const totalValue = insumos.reduce((sum, i) => sum + (i.preco_unitario * i.quantidade_atual), 0);

  const getCategoriaColor = (cat: string) => {
    const colors: Record<string, string> = {
      'MEDICAMENTO': 'bg-emerald-500/10 text-emerald-500',
      'MATERIAL_HOSPITALAR': 'bg-blue-500/10 text-blue-500',
      'EPI': 'bg-amber-500/10 text-amber-500',
      'MATERIAL_LABORATORIO': 'bg-cyan-500/10 text-cyan-500',
      'DESCARTAVEL': 'bg-gray-500/10 text-gray-400',
      'EQUIPAMENTO': 'bg-violet-500/10 text-violet-500',
    };
    return colors[cat] || 'bg-gray-500/10 text-gray-500';
  };

  const getCategoriaLabel = (cat: string) => categoriasList.find(c => c.value === cat)?.label || cat;

  const getStockColor = (i: Insumo) => {
    if (i.quantidade_atual === 0) return 'text-red-500';
    if (isLowStock(i)) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getStockBg = (i: Insumo) => {
    if (i.quantidade_atual === 0) return 'bg-red-500';
    if (isLowStock(i)) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getStockPercent = (i: Insumo) => {
    if (i.quantidade_minima === 0) return 100;
    const ratio = (i.quantidade_atual / (i.quantidade_minima * 3)) * 100;
    return Math.min(100, Math.max(0, ratio));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Insumos</h1>
          <p className="text-muted-foreground mt-2">Controle de estoque, lotes, validade e movimentações.</p>
        </div>
        <button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/25">
          <Plus className="w-5 h-5" /> Novo Insumo
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{insumos.length}</p>
              <p className="text-xs text-muted-foreground">Itens Cadastrados</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-500">{lowStockCount}</p>
              <p className="text-xs text-muted-foreground">Estoque Baixo</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-500">{expiringCount}</p>
              <p className="text-xs text-muted-foreground">Vencendo em 90d</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-500">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground">Valor Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(expiredCount > 0 || lowStockCount > 0) && (
        <div className="space-y-3">
          {expiredCount > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{expiredCount} insumo(s) com validade <strong>expirada</strong>. Ação imediata necessária!</p>
            </div>
          )}
          {lowStockCount > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{lowStockCount} insumo(s) com estoque <strong>abaixo do mínimo</strong>. Considere reabastecer.</p>
            </div>
          )}
        </div>
      )}

      <div className="glass rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input type="text" placeholder="Buscar por nome, código ou lote..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
          </div>
          <select value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)}
            className="h-12 px-4 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all min-w-[180px]">
            <option value="">Todas as categorias</option>
            {categoriasList.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Box className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Nenhum insumo encontrado</p>
            <p className="text-sm mt-1">Clique em "Novo Insumo" para cadastrar o primeiro.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
            {filtered.map(i => (
              <div key={i.id} className={`animate-fade-in-up border rounded-xl p-5 hover:shadow-lg transition-all hover:-translate-y-0.5 bg-background/50 ${isExpired(i.validade) ? 'border-red-500/50' : isExpiringSoon(i.validade) ? 'border-amber-500/50' : 'border-border/50'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getCategoriaColor(i.categoria)}`}>
                      <Package className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{i.nome}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoriaColor(i.categoria)}`}>
                          {getCategoriaLabel(i.categoria)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(i)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Editar">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(i.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors" title="Inativar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Stock Level Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className={`font-semibold ${getStockColor(i)}`}>{i.quantidade_atual} {i.unidade_medida}</span>
                    <span className="text-xs text-muted-foreground">Mín: {i.quantidade_minima}</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${getStockBg(i)}`} style={{ width: `${getStockPercent(i)}%` }} />
                  </div>
                </div>

                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><Hash className="w-4 h-4 flex-shrink-0" /> Cód: {i.codigo || 'N/A'} • Lote: {i.lote || 'N/A'}</p>
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className={isExpired(i.validade) ? 'text-red-500 font-medium' : isExpiringSoon(i.validade) ? 'text-amber-500 font-medium' : ''}>
                      Validade: {i.validade ? new Date(i.validade).toLocaleDateString('pt-BR') : 'N/A'}
                      {isExpired(i.validade) && ' ⚠️ VENCIDO'}
                      {isExpiringSoon(i.validade) && !isExpired(i.validade) && ' ⚠️ Próximo'}
                    </span>
                  </p>
                  <p className="flex items-center gap-2"><Package className="w-4 h-4 flex-shrink-0" /> {i.fornecedor_nome || 'Sem fornecedor'}</p>
                </div>

                <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{i.localizacao || 'Sem localização'}</span>
                  <span className="text-sm font-semibold text-foreground">R$ {(i.preco_unitario || 0).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <h2 className="text-xl font-semibold">{editing ? 'Editar Insumo' : 'Novo Insumo'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-secondary rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Nome do Insumo *</label>
                  <input type="text" required value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Ex: Dipirona 500mg, Luva Nitrílica M..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Código Interno</label>
                  <input type="text" value={form.codigo} onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="MED-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Categoria *</label>
                  <select value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                    {categoriasList.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Unidade de Medida *</label>
                  <select value={form.unidade_medida} onChange={e => setForm(p => ({ ...p, unidade_medida: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                    {unidadesList.map(u => <option key={u.value} value={u.value}>{u.label} ({u.value})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Quantidade Atual *</label>
                  <input type="number" min={0} required value={form.quantidade_atual} onChange={e => setForm(p => ({ ...p, quantidade_atual: Number(e.target.value) }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Quantidade Mínima *</label>
                  <input type="number" min={0} required value={form.quantidade_minima} onChange={e => setForm(p => ({ ...p, quantidade_minima: Number(e.target.value) }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Preço Unitário (R$)</label>
                  <input type="number" min={0} step="0.01" value={form.preco_unitario} onChange={e => setForm(p => ({ ...p, preco_unitario: Number(e.target.value) }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Lote</label>
                  <input type="text" value={form.lote} onChange={e => setForm(p => ({ ...p, lote: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="LOT-2026-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Data de Validade</label>
                  <input type="date" value={form.validade} onChange={e => setForm(p => ({ ...p, validade: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Fornecedor</label>
                  <input type="text" value={form.fornecedor_nome} onChange={e => setForm(p => ({ ...p, fornecedor_nome: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Nome do fornecedor" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Localização no Estoque</label>
                  <input type="text" value={form.localizacao} onChange={e => setForm(p => ({ ...p, localizacao: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Ex: Prateleira A3, Gaveta 12" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 h-12 rounded-xl border border-border font-medium hover:bg-secondary transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/25">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editing ? 'Salvar Alterações' : 'Cadastrar Insumo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
