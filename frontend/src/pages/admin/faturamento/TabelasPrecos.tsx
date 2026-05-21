import { useState, useEffect, useCallback } from 'react';
import { FileSpreadsheet, Loader2, Search, Plus, X, Building2, Tag, Pencil, Link as LinkIcon, Table as TableIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '../../../lib/api';
import { cn } from '../../../lib/utils';
import toast from 'react-hot-toast';

interface TabelaPreco {
  id: string;
  nome?: string;
  convenio: string;
  tipo: string;
  vigencia_inicio?: string;
  vigencia_fim?: string;
  vigenciaInicio?: string;
  vigenciaFim?: string;
  ativo?: boolean;
  itens: number | Array<{ codigo: string; descricao: string; valor: number }>;
}

export function TabelasPrecos() {
  const [tabelas, setTabelas] = useState<TabelaPreco[]>([]);
  const [convenios, setConvenios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTabela, setSelectedTabela] = useState<TabelaPreco | null>(null);
  const [searchItem, setSearchItem] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTabelaOpen, setModalTabelaOpen] = useState(false);
  const [modalVinculoOpen, setModalVinculoOpen] = useState(false);
  const [expandedConvenios, setExpandedConvenios] = useState<Record<string, boolean>>({});
  const [expandedGerais, setExpandedGerais] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resTabs, resConv] = await Promise.all([
        api.get('/faturamento/tabelas'),
        api.get('/cadastros/convenios')
      ]);

      const data = resTabs.data;
      const convs = Array.isArray(resConv.data) ? resConv.data : (resConv.data.convenios || []);
      setConvenios(convs);

      const lista: TabelaPreco[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.tabelas)
          ? data.tabelas
          : Array.isArray(data?.data)
            ? data.data
            : [];

      setTabelas(lista);
      if (lista.length > 0 && !selectedTabela) setSelectedTabela(lista[0]);
    } catch {
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, []); // Removido selectedTabela da lista de dependências para evitar re-execuções desnecessárias

  const toggleConvenio = (id: string) => {
    setExpandedConvenios(prev => ({
      ...prev,
      [id]: prev[id] === false ? true : false // Inicia como true (undefined/true)
    }));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const filteredItens = Array.isArray(selectedTabela?.itens)
    ? (selectedTabela!.itens as Array<{ codigo: string; descricao: string; valor: number }>).filter(i =>
      i.codigo.includes(searchItem) || i.descricao.toLowerCase().includes(searchItem.toLowerCase())
    )
    : [];

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTabela) return;

    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const newItem = {
      codigo: formData.get('codigo'),
      tuss: formData.get('codigo'),
      descricao: formData.get('descricao'),
      valor: Number(formData.get('valor'))
    };

    try {
      await api.post(`/faturamento/tabelas/${selectedTabela.id}/itens`, newItem);
      toast.success("Item adicionado com sucesso!");
      setModalOpen(false);
      // Atualiza a tabela selecionada localmente para refletir na UI sem recarregar tudo
      setSelectedTabela({
        ...selectedTabela,
        itens: [...(Array.isArray(selectedTabela.itens) ? selectedTabela.itens : []), newItem as any]
      });
    } catch {
      toast.error("Erro ao adicionar item.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTabela = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const newTabela = {
      nome: formData.get('nome'),
      tipo: formData.get('tipo'),
      ativo: true,
      itens: []
    };

    try {
      const { data } = await api.post('/faturamento/tabelas', newTabela);
      toast.success("Tabela criada com sucesso!");
      setTabelas(prev => [...prev, data]);
      setSelectedTabela(data);
      setModalTabelaOpen(false);
    } catch {
      toast.error("Erro ao criar tabela.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateVinculos = async (conveniosIds: string[]) => {
    if (!selectedTabela) return;
    setSubmitting(true);
    try {
      await Promise.all(convenios.map(conv => {
        const isLinked = conveniosIds.includes(conv.id);
        const otherTables = conv.tabelas_vinculadas?.filter((v: any) => v.tabela_id !== selectedTabela.id) || [];
        const newLinks = isLinked ? [...otherTables, { tabela_id: selectedTabela.id, nome: selectedTabela.nome || selectedTabela.convenio }] : otherTables;
        return api.put(`/cadastros/convenios/${conv.id}`, { ...conv, tabelas_vinculadas: newLinks });
      }));
      toast.success("Vínculos atualizados!");
      fetchData();
      setModalVinculoOpen(false);
    } catch {
      toast.error("Erro ao atualizar vínculos.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tabelas de Preços</h1>
          <p className="text-muted-foreground mt-2">Gestão de honorários e taxas (Padrão TISS/TUSS/SIGTAP).</p>
        </div>
        <button
          onClick={() => setModalTabelaOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-primary/25"
        >
          <Plus className="w-5 h-5" /> Nova Tabela
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Seleção de Tabelas */}
          <div className="lg:w-1/3 space-y-6">
            <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground mb-4">Convênios e Tabelas</h3>
            {convenios.map(conv => {
              const isExpanded = expandedConvenios[conv.id] !== false;
              return (
                <div key={conv.id} className="space-y-2">
                  <button
                    onClick={() => toggleConvenio(conv.id)}
                    className="flex items-center justify-between w-full px-2 py-1 hover:bg-secondary/30 rounded-lg transition-colors group text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      <span className="text-sm font-black uppercase text-foreground">{conv.nome}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="space-y-2 ml-4 animate-in fade-in slide-in-from-top-1 duration-200">
                      {tabelas.filter(t => conv.tabelas_vinculadas?.some((v: any) => v.tabela_id === t.id)).map(t => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTabela(t)}
                          className={cn(
                            "p-4 rounded-xl cursor-pointer border transition-all shadow-sm",
                            selectedTabela?.id === t.id ? 'bg-primary/10 border-primary shadow-md' : 'glass hover:bg-secondary/50 border-border/50'
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary font-black uppercase tracking-tighter">{t.tipo}</span>
                          </div>
                          <p className={cn("text-xs font-bold leading-tight", selectedTabela?.id === t.id ? "text-primary" : "text-muted-foreground")}>
                            {t.nome || t.convenio}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Seção de Fallback para tabelas não vinculadas explicitamente */}
            {tabelas.filter(t => !convenios.some(c => c.tabelas_vinculadas?.some((v: any) => v.tabela_id === t.id))).length > 0 && (
              <div className="space-y-2 pt-6 border-t border-border/30">
                <button
                  onClick={() => setExpandedGerais(!expandedGerais)}
                  className="flex items-center justify-between w-full px-2 py-1 hover:bg-secondary/30 rounded-lg transition-colors group text-left"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Tabelas Gerais / Avulsas</span>
                  </div>
                  {expandedGerais ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </button>

                {expandedGerais && (
                  <div className="space-y-2 ml-4 animate-in fade-in slide-in-from-top-1 duration-200">
                    {tabelas.filter(t => !convenios.some(c => c.tabelas_vinculadas?.some((v: any) => v.tabela_id === t.id))).map(t => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTabela(t)}
                        className={cn(
                          "p-4 rounded-xl cursor-pointer border transition-all",
                          selectedTabela?.id === t.id ? 'bg-primary/10 border-primary shadow-md' : 'glass hover:bg-secondary/50 border-border/50'
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary font-black uppercase tracking-tighter">{t.tipo}</span>
                        </div>
                        <p className={cn("text-xs font-bold leading-tight", selectedTabela?.id === t.id ? "text-primary" : "text-muted-foreground")}>
                          {t.nome}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Área de Itens da Tabela */}
          <div className="lg:w-2/3 glass rounded-2xl p-6">
            {selectedTabela ? (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <div>
                    <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-tighter text-primary">
                      <FileSpreadsheet className="w-5 h-5" />
                      Itens da Tabela
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{selectedTabela.nome}</p>
                      <button onClick={() => setModalVinculoOpen(true)} className="text-[10px] font-black text-primary uppercase hover:underline flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" /> Configurar Vínculos
                      </button>
                    </div>
                  </div>
                  <div className="relative w-full sm:w-64 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input type="text" placeholder="Buscar código ou ref..." value={searchItem} onChange={e => setSearchItem(e.target.value)}
                      className="w-full h-10 pl-9 pr-4 rounded-lg bg-background border border-border focus:border-primary outline-none text-sm transition-all" />
                  </div>
                </div>

                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setModalOpen(true)}
                    className="btn-primary py-2 px-6 flex items-center gap-2 text-xs font-black uppercase"
                  >
                    <Plus className="w-4 h-4" /> Adicionar Item
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border/50">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-secondary/50">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Código</th>
                        <th className="px-4 py-3 font-semibold">Descrição do Procedimento</th>
                        <th className="px-4 py-3 font-semibold text-right">Valor Negociado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 bg-background/50">
                      {filteredItens.length > 0 ? (
                        filteredItens.map(item => (
                          <tr key={item.codigo} className="hover:bg-secondary/20 transition-colors">
                            <td className="px-4 py-3 font-mono text-muted-foreground">{item.codigo}</td>
                            <td className="px-4 py-3 font-medium">{item.descricao}</td>
                            <td className="px-4 py-3 text-right font-bold text-primary">{formatCurrency(item.valor)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Nenhum item encontrado.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">Selecione uma tabela ao lado.</div>
            )}
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" /> Novo Item na Tabela
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-secondary rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mb-4">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Tabela Destino</p>
                <p className="font-bold text-primary">{selectedTabela?.nome}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1.5">Código (TUSS)</label>
                  <input type="text" name="codigo" required className="input-field py-2 font-mono" placeholder="Ex: 10101012" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1.5">Valor Negociado (R$)</label>
                  <input type="number" name="valor" step="0.01" required className="input-field py-2 text-right font-mono" placeholder="0,00" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1.5">Descrição do Procedimento</label>
                <input type="text" name="descricao" required className="input-field py-2" placeholder="Ex: Consulta Médica em Consultório" />
              </div>

              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 h-12 rounded-xl border border-border font-black uppercase text-xs hover:bg-secondary transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-black uppercase text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/25">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-4 h-4" /> Salvar Item</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Tabela */}
      {modalTabelaOpen && (
        <div className="modal-overlay" onClick={() => setModalTabelaOpen(false)}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2 text-primary">
                <TableIcon className="w-5 h-5" /> Cadastrar Nova Tabela
              </h2>
              <button onClick={() => setModalTabelaOpen(false)} className="p-2 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateTabela} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1.5 tracking-widest">Descrição da Tabela</label>
                <input type="text" name="nome" required className="input-field py-2" placeholder="Ex: Diárias e Taxas Moura" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1.5 tracking-widest">Tipo de Tabela</label>
                <select name="tipo" className="input-field py-2">
                  <option value="22 - TUSS">22 - TUSS</option>
                  <option value="PROPRIO">PRÓPRIO</option>
                  <option value="CBHPM">CBHPM</option>
                  <option value="PRECO_FABRICA">PREÇO DE FÁBRICA</option>
                  <option value="SIMPRO">SIMPRO</option>
                </select>
              </div>
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setModalTabelaOpen(false)} className="flex-1 btn-secondary h-12 text-xs font-black uppercase">Cancelar</button>
                <button type="submit" disabled={submitting} className="flex-1 btn-primary h-12 text-xs font-black uppercase">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar Tabela'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Configurar Vínculos */}
      {modalVinculoOpen && (
        <div className="modal-overlay" onClick={() => setModalVinculoOpen(false)}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2 text-primary">
                <LinkIcon className="w-5 h-5" /> Vincular a Convênios
              </h2>
              <button onClick={() => setModalVinculoOpen(false)} className="p-2 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Tabela Selecionada</p>
                <p className="font-bold text-primary">{selectedTabela?.nome}</p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Selecione os convênios que utilizam esta tabela:</p>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2">
                  {convenios.map(conv => (
                    <label key={conv.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-secondary/30 cursor-pointer transition-all group">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-sm font-bold">{conv.nome}</span>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded-lg border-border text-primary focus:ring-primary"
                        defaultChecked={conv.tabelas_vinculadas?.some((v: any) => v.tabela_id === selectedTabela?.id)}
                        id={`check-${conv.id}`}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setModalVinculoOpen(false)} className="flex-1 btn-secondary h-12 text-xs font-black uppercase tracking-tighter">Cancelar</button>
                <button
                  onClick={() => {
                    const selectedIds = convenios.filter(c => (document.getElementById(`check-${c.id}`) as HTMLInputElement).checked).map(c => c.id);
                    handleUpdateVinculos(selectedIds);
                  }}
                  disabled={submitting}
                  className="flex-1 btn-primary h-12 text-xs font-black uppercase tracking-tighter"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Vínculos'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
