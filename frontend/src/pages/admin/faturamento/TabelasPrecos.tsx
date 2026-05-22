import { useState, useEffect, useCallback } from 'react';
import { FileSpreadsheet, Loader2, Search, Plus, X, Building2, Tag, Table as TableIcon, ChevronDown, ChevronRight, Info, TrendingUp, Hash, Edit } from 'lucide-react';
import { cn } from '../../../lib/utils';
import toast from 'react-hot-toast';
import localStorageService from '../../../services/localStorageService';

interface TabelaPreco {
  id: string;
  nome?: string;
  convenio_id?: string;
  tipo: string;
  vigencia_inicio?: string;
  vigencia_fim?: string;
  ativo?: boolean;
  itens: number | Array<{ codigo: string; descricao: string; valor: number }>;
}

const TIPO_COLORS: Record<string, string> = {
  '14': 'bg-teal-50 text-teal-600 border-teal-100',
  '15': 'bg-indigo-50 text-indigo-600 border-indigo-100',
  '16': 'bg-blue-50 text-blue-600 border-blue-100',
  '17': 'bg-cyan-50 text-cyan-600 border-cyan-100',
  '18': 'bg-amber-50 text-amber-600 border-amber-100',
  '19': 'bg-orange-50 text-orange-600 border-orange-100',
  '20': 'bg-emerald-50 text-emerald-600 border-emerald-100',
  '22': 'bg-blue-50 text-blue-600 border-blue-100',
  '94': 'bg-purple-50 text-purple-600 border-purple-100',
  '95': 'bg-purple-50 text-purple-600 border-purple-100',
  '96': 'bg-purple-50 text-purple-600 border-purple-100',
};

export function TabelasPrecos() {
  const [tabelas, setTabelas] = useState<TabelaPreco[]>([]);
  const [convenios, setConvenios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTabela, setSelectedTabela] = useState<TabelaPreco | null>(null);
  const [searchItem, setSearchItem] = useState('');
  
  const [modalItemOpen, setModalItemOpen] = useState(false);
  const [modalTabelaOpen, setModalTabelaOpen] = useState(false);
  const [tabelaEmEdicao, setTabelaEmEdicao] = useState<TabelaPreco | null>(null);
  
  const [expandedConvenios, setExpandedConvenios] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let convs = localStorageService.getConvenios();
      
      if (convs.length === 0) {
          convs = [
              { id: 'conv-unimed', nome: 'UNIMED', tabelas_vinculadas: [] },
              { id: 'conv-bradesco', nome: 'BRADESCO SAÚDE', tabelas_vinculadas: [] },
              { id: 'conv-sula', nome: 'SULAMÉRICA', tabelas_vinculadas: [] },
          ];
          localStorageService.setConvenios(convs);
      }

      let lista = localStorageService.getTabelas();

      if (lista.length === 0) {
          const unimed = convs[0];
          const mockTabelas: TabelaPreco[] = [
              { id: 't1', nome: 'PROCEDIMENTOS UNIMED', convenio_id: unimed.id, tipo: '22 - TUSS - Procedimentos e eventos em saúde', itens: [{codigo: '10101012', descricao: 'CONSULTA EM CONSULTORIO', valor: 150}] },
              { id: 't2', nome: 'DIÁRIAS UNIMED', convenio_id: unimed.id, tipo: '45 - Tabela Própria de Diárias', itens: [] },
              { id: 't3', nome: 'TAXAS UNIMED', convenio_id: unimed.id, tipo: '97 - Tabela Própria de Taxas Hospitalares', itens: [] },
              { id: 't4', nome: 'GASES UNIMED', convenio_id: unimed.id, tipo: '99 - Tabela Própria de Gases Medicinais', itens: [] },
              { id: 't5', nome: 'MEDICAMENTOS UNIMED TNUMM', convenio_id: unimed.id, tipo: '20 - TUSS - Medicamentos', itens: [] },
              { id: 't6', nome: 'MATERIAIS UNIMED (TABELA 00)', convenio_id: unimed.id, tipo: '19 - TUSS - Materiais', itens: [] },
              { id: 't7', nome: 'MATERIAIS UNIMED (TABELA 19)', convenio_id: unimed.id, tipo: '95 - Tabela Própria Materiais', itens: [] },
              { id: 't8', nome: 'PACOTE UNIMED', convenio_id: unimed.id, tipo: '98 - Tabela Própria de Pacotes', itens: [] },
          ];
          localStorageService.setTabelas(mockTabelas as any);
          lista = mockTabelas as any;
      }
      
      setConvenios(convs);
      setTabelas(lista);
      if (lista.length > 0 && !selectedTabela) setSelectedTabela(lista[0]);
    } catch {
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleConvenio = (id: string) => {
    setExpandedConvenios(prev => ({
      ...prev,
      [id]: prev[id] === false ? true : false
    }));
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      codigo: formData.get('codigo') as string,
      descricao: formData.get('descricao') as string,
      valor: parseFloat(formData.get('valor') as string)
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const allTabelas = localStorageService.getTabelas();
      const tIndex = allTabelas.findIndex(t => t.id === selectedTabela.id);
      
      if (tIndex >= 0) {
          const currentItens = Array.isArray(allTabelas[tIndex].itens) ? allTabelas[tIndex].itens : [];
          allTabelas[tIndex].itens = [...currentItens, newItem];
          localStorageService.setTabelas(allTabelas);
          
          setTabelas(allTabelas as any);
          setSelectedTabela(allTabelas[tIndex] as any);
      }

      toast.success("Item adicionado com sucesso!");
      setModalItemOpen(false);
    } catch {
      toast.error("Erro ao adicionar item.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveTabela = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const allTabelas = localStorageService.getTabelas();

      let newTabela: TabelaPreco;

      if (tabelaEmEdicao) {
        // Edit mode
        const tIndex = allTabelas.findIndex(t => t.id === tabelaEmEdicao.id);
        if (tIndex >= 0) {
            allTabelas[tIndex].nome = formData.get('nome') as string;
            allTabelas[tIndex].tipo = formData.get('tipo') as string;
            (allTabelas[tIndex] as any).convenio_id = formData.get('convenio_id') as string;
            localStorageService.setTabelas(allTabelas);
            newTabela = allTabelas[tIndex] as any;
            toast.success("Tabela atualizada com sucesso!");
        } else {
            throw new Error("Tabela não encontrada");
        }
      } else {
        // Create mode
        newTabela = {
            id: `TAB-${Date.now()}`,
            nome: formData.get('nome') as string,
            tipo: formData.get('tipo') as string,
            convenio_id: formData.get('convenio_id') as string,
            ativo: true,
            itens: []
        };
        allTabelas.push(newTabela as any);
        localStorageService.setTabelas(allTabelas);
        toast.success("Tabela criada com sucesso!");
      }

      setTabelas(allTabelas as any);
      setSelectedTabela(newTabela!);
      setModalTabelaOpen(false);
    } catch {
      toast.error("Erro ao salvar tabela.");
    } finally {
      setSubmitting(false);
    }
  };

  const openNewTabelaModal = () => {
      setTabelaEmEdicao(null);
      setModalTabelaOpen(true);
  };

  const openEditTabelaModal = () => {
      if (!selectedTabela) return;
      setTabelaEmEdicao(selectedTabela);
      setModalTabelaOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tabelas de Preços</h1>
          <p className="text-muted-foreground mt-2">Gestão de honorários e taxas separadas por Convênio (Padrão TISS/TUSS/SIGTAP).</p>
        </div>
        <button
          onClick={openNewTabelaModal}
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
          <div className="lg:w-1/3 space-y-4">
            <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-4 ml-2">Convênios e Tabelas</h3>
            
            {convenios.map(conv => {
              const isExpanded = expandedConvenios[conv.id] !== false;
              const tabelasDoConvenio = tabelas.filter(t => t.convenio_id === conv.id);

              return (
                <div key={conv.id} className="bg-white/50 rounded-2xl p-2 border border-gray-100 mb-4">
                  <button
                    onClick={() => toggleConvenio(conv.id)}
                    className="flex items-center justify-between w-full px-3 py-2 hover:bg-white rounded-xl transition-all group text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-black uppercase tracking-tight text-gray-700">{conv.nome}</span>
                      <span className="ml-2 text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{tabelasDoConvenio.length}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    )}
                  </button>

                  {isExpanded && tabelasDoConvenio.length > 0 && (
                    <div className="space-y-1 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      {tabelasDoConvenio.map(t => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTabela(t)}
                          className={cn(
                            "p-3 rounded-xl cursor-pointer border transition-all flex items-center justify-between group",
                            selectedTabela?.id === t.id
                              ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-100'
                              : 'bg-white hover:border-blue-200 border-transparent shadow-sm'
                          )}
                        >
                          <p className={cn(
                            "text-xs font-bold transition-colors truncate pr-2",
                            selectedTabela?.id === t.id ? "text-white" : "text-gray-600"
                          )}>
                            {t.nome}
                          </p>
                          <span className={cn(
                            "text-[8px] px-1.5 py-0.5 rounded-md font-black border transition-colors",
                            selectedTabela?.id === t.id
                              ? "bg-white/20 text-white border-white/30"
                              : (TIPO_COLORS[t.tipo.split(' - ')[0]] || "bg-gray-100 text-gray-500 border-gray-200")
                          )}>
                            {t.tipo.split(' - ')[0]}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {isExpanded && tabelasDoConvenio.length === 0 && (
                      <div className="p-4 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest border border-dashed rounded-xl mt-2 border-gray-200">
                          Nenhuma tabela para este convênio
                      </div>
                  )}
                </div>
              );
            })}

            {/* Tabelas antigas sem convênio (Migração) */}
            {tabelas.filter(t => !t.convenio_id).length > 0 && (
                <div className="bg-red-50/50 rounded-2xl p-2 border border-red-100 mb-4">
                  <div className="px-3 py-2 text-left">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-red-500" />
                      <span className="text-[10px] font-black uppercase tracking-tight text-red-700">Sem Convênio Vinculado</span>
                    </div>
                  </div>
                  <div className="space-y-1 mt-2">
                    {tabelas.filter(t => !t.convenio_id).map(t => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTabela(t)}
                          className={cn(
                            "p-3 rounded-xl cursor-pointer border transition-all flex items-center justify-between group",
                            selectedTabela?.id === t.id
                              ? 'bg-red-600 border-red-600 shadow-lg shadow-red-100'
                              : 'bg-white hover:border-red-200 border-transparent shadow-sm'
                          )}
                        >
                          <p className={cn(
                            "text-xs font-bold transition-colors truncate pr-2",
                            selectedTabela?.id === t.id ? "text-white" : "text-gray-600"
                          )}>
                            {t.nome}
                          </p>
                          <span className={cn(
                            "text-[8px] px-1.5 py-0.5 rounded-md font-black border transition-colors",
                            selectedTabela?.id === t.id
                              ? "bg-white/20 text-white border-white/30"
                              : (TIPO_COLORS[t.tipo.split(' - ')[0]] || "bg-gray-100 text-gray-500 border-gray-200")
                          )}>
                            {t.tipo.split(' - ')[0]}
                          </span>
                        </div>
                    ))}
                  </div>
                </div>
            )}
          </div>

          {/* Área de Itens da Tabela */}
          <div className="lg:w-2/3 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            {selectedTabela ? (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pb-6 border-b border-gray-50">
                  <div>
                    <h2 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tighter text-gray-800">
                      <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                      Itens da Tabela
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{selectedTabela.nome}</p>
                      <button onClick={openEditTabelaModal} className="text-[10px] font-black text-emerald-600 uppercase hover:text-emerald-700 transition-colors flex items-center gap-1 ml-2 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        <Edit className="w-3 h-3" /> Editar Tabela
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64 group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <input type="text" placeholder="Buscar código ou ref..." value={searchItem} onChange={e => setSearchItem(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white outline-none text-sm transition-all" />
                    </div>
                    <button
                      onClick={() => setModalItemOpen(true)}
                      className="h-11 px-6 bg-gray-900 text-white rounded-xl flex items-center gap-2 text-[10px] font-black uppercase hover:bg-black transition-all shadow-lg shadow-gray-200 active:scale-95"
                    >
                      <Plus className="w-4 h-4" /> Item
                    </button>
                  </div>
                </div>

                {/* Stats Summary Area */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Hash size={18} /></div>
                    <div>
                      <p className="text-[10px] font-black text-blue-400 uppercase leading-none">Total Itens</p>
                      <p className="text-lg font-black text-blue-700">{filteredItens.length}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><TrendingUp size={18} /></div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-400 uppercase leading-none">Média Valor</p>
                      <p className="text-lg font-black text-emerald-700">
                        {formatCurrency(filteredItens.reduce((acc, i) => acc + i.valor, 0) / (filteredItens.length || 1))}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border/50">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/80">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Código</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Procedimento</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Valor Negociado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredItens.length > 0 ? (
                        filteredItens.map(item => (
                          <tr key={item.codigo} className="hover:bg-blue-50/30 transition-colors group">
                            <td className="px-6 py-4 font-mono text-xs font-bold text-gray-400 group-hover:text-blue-500">{item.codigo}</td>
                            <td className="px-6 py-4 text-sm font-bold text-gray-700">{item.descricao}</td>
                            <td className="px-6 py-4 text-right font-black text-gray-900">{formatCurrency(item.valor)}</td>
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
              <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                  <Info size={40} />
                </div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Selecione uma tabela para visualizar os itens</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Adicionar Item */}
      {modalItemOpen && (
        <div className="modal-overlay" onClick={() => setModalItemOpen(false)}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" /> Novo Item na Tabela
              </h2>
              <button onClick={() => setModalItemOpen(false)} className="p-2 hover:bg-secondary rounded-lg transition-colors"><X className="w-5 h-5" /></button>
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
                <button type="button" onClick={() => setModalItemOpen(false)} className="flex-1 h-12 rounded-xl border border-border font-black uppercase text-xs hover:bg-secondary transition-colors">
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

      {/* Modal Nova/Editar Tabela */}
      {modalTabelaOpen && (
        <div className="modal-overlay" onClick={() => setModalTabelaOpen(false)}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2 text-primary">
                {tabelaEmEdicao ? <Edit className="w-5 h-5" /> : <TableIcon className="w-5 h-5" />} 
                {tabelaEmEdicao ? 'Editar Tabela' : 'Cadastrar Nova Tabela'}
              </h2>
              <button onClick={() => setModalTabelaOpen(false)} className="p-2 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveTabela} className="p-6 space-y-4">
              
              <div>
                <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1.5 tracking-widest">Convênio</label>
                <select name="convenio_id" required className="input-field py-2" defaultValue={tabelaEmEdicao?.convenio_id || ''}>
                    <option value="" disabled>Selecione a qual convênio pertence</option>
                    {convenios.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1.5 tracking-widest">Descrição da Tabela</label>
                <input type="text" name="nome" required className="input-field py-2" placeholder="Ex: Diárias e Taxas Moura" defaultValue={tabelaEmEdicao?.nome || ''} />
              </div>
              
              <div>
                <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1.5 tracking-widest">Tipo de Tabela (Padrão TISS)</label>
                <select name="tipo" className="input-field py-2" defaultValue={tabelaEmEdicao?.tipo || '22 - TUSS - Procedimentos e eventos em saúde'}>
                  <option value="14 - Tabela VRPO">14 - Tabela VRPO</option>
                  <option value="15 - Tabela de Intercâmbio Sistema Uniodonto">15 - Tabela de Intercâmbio Sistema Uniodonto</option>
                  <option value="16 - TUSS - Procedimentos Médicos">16 - TUSS - Procedimentos Médicos</option>
                  <option value="17 - TUSS - Procedimentos Odontológicos">17 - TUSS - Procedimentos Odontológicos</option>
                  <option value="18 - TUSS - Taxas hospitalares, diárias e gases medicinais">18 - TUSS - Taxas hospitalares, diárias e gases medicinais</option>
                  <option value="19 - TUSS - Materiais">19 - TUSS - Materiais</option>
                  <option value="20 - TUSS - Medicamentos">20 - TUSS - Medicamentos</option>
                  <option value="21 - TUSS - Outras áreas da saúde">21 - TUSS - Outras áreas da saúde</option>
                  <option value="22 - TUSS - Procedimentos e eventos em saúde">22 - TUSS - Procedimentos e eventos em saúde</option>
                  <option value="45 - Tabela Própria de Diárias">45 - Tabela Própria de Diárias</option>
                  <option value="91 - Tabela provisória TUSS">91 - Tabela provisória TUSS</option>
                  <option value="92 - Tabela provisória TUSS - Procedimentos Odontológicos">92 - Tabela provisória TUSS - Procedimentos Odontológicos</option>
                  <option value="93 - Tabela provisória TUSS - Procedimentos Médicos">93 - Tabela provisória TUSS - Procedimentos Médicos</option>
                  <option value="94 - Tabela Própria Procedimentos">94 - Tabela Própria Procedimentos</option>
                  <option value="95 - Tabela Própria Materiais">95 - Tabela Própria Materiais</option>
                  <option value="96 - Tabela Própria Medicamentos">96 - Tabela Própria Medicamentos</option>
                  <option value="97 - Tabela Própria de Taxas Hospitalares">97 - Tabela Própria de Taxas Hospitalares</option>
                  <option value="98 - Tabela Própria de Pacotes">98 - Tabela Própria de Pacotes</option>
                  <option value="99 - Tabela Própria de Gases Medicinais">99 - Tabela Própria de Gases Medicinais</option>
                </select>
              </div>
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setModalTabelaOpen(false)} className="flex-1 btn-secondary h-12 text-xs font-black uppercase">Cancelar</button>
                <button type="submit" disabled={submitting} className="flex-1 btn-primary h-12 text-xs font-black uppercase">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (tabelaEmEdicao ? 'Salvar Alterações' : 'Criar Tabela')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
