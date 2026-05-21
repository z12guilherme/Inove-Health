import { useState, useEffect } from 'react';
import { FileSpreadsheet, Loader2, Search } from 'lucide-react';
import { api } from '../../../lib/api';

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
  const [loading, setLoading] = useState(true);
  const [selectedTabela, setSelectedTabela] = useState<TabelaPreco | null>(null);
  const [searchItem, setSearchItem] = useState('');

  useEffect(() => {
    const fetchTabelas = async () => {
      try {
        const { data } = await api.get('/faturamento/tabelas');
        const lista: TabelaPreco[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.tabelas)
            ? data.tabelas
            : Array.isArray(data?.data)
              ? data.data
              : [];
        setTabelas(lista);
        if (lista.length > 0) setSelectedTabela(lista[0]);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchTabelas();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const filteredItens = Array.isArray(selectedTabela?.itens)
    ? (selectedTabela!.itens as Array<{codigo: string; descricao: string; valor: number}>).filter(i =>
        i.codigo.includes(searchItem) || i.descricao.toLowerCase().includes(searchItem.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tabelas de Preços</h1>
        <p className="text-muted-foreground mt-2">Gestão de honorários e taxas (Padrão TISS/TUSS/SIGTAP).</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Seleção de Tabelas */}
          <div className="lg:w-1/3 space-y-4">
            <h3 className="font-semibold text-lg mb-2">Convênios e Tabelas</h3>
            {tabelas.map(t => (
              <div
                key={t.id}
                onClick={() => setSelectedTabela(t)}
                className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedTabela?.id === t.id ? 'bg-primary/10 border-primary shadow-md' : 'glass hover:bg-secondary/50 border-border/50'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-bold ${selectedTabela?.id === t.id ? 'text-primary' : ''}`}>{t.convenio}</h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary font-mono">{t.tipo}</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{t.nome || t.convenio}</p>
                  {(t.vigencia_inicio || t.vigenciaInicio) && (
                    <p>Vig.: {new Date(t.vigencia_inicio || t.vigenciaInicio!).toLocaleDateString('pt-BR')} até {new Date(t.vigencia_fim || t.vigenciaFim!).toLocaleDateString('pt-BR')}</p>
                  )}
                  {typeof t.itens === 'number' && <p className="font-medium">{t.itens.toLocaleString('pt-BR')} itens</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Área de Itens da Tabela */}
          <div className="lg:w-2/3 glass rounded-2xl p-6">
            {selectedTabela ? (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-primary" />
                    Itens da Tabela ({selectedTabela.convenio})
                  </h2>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="text" placeholder="Buscar código ou ref..." value={searchItem} onChange={e => setSearchItem(e.target.value)}
                      className="w-full h-10 pl-9 pr-4 rounded-lg bg-background border border-border focus:border-primary outline-none text-sm" />
                  </div>
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
    </div>
  );
}
