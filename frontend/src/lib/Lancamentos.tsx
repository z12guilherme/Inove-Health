import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, FileText, CreditCard, Package, Syringe, Activity, ChevronRight } from 'lucide-react';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

export function LancamentosFaturamento() {
    const [atendimento, setAtendimento] = useState<any>(null);
    const [lancamentos, setLancamentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Mock de busca inicial (ID que você enviou)
    useEffect(() => {
        const fetchDados = async () => {
            setLoading(true);
            try {
                // Em um cenário real, o ID viria da URL ou de uma busca
                const resAtend = await api.get('/atendimentos');
                const atendAtivo = resAtend.data.atendimentos[0]; // Pegando o primeiro para exemplo
                setAtendimento(atendAtivo);

                const resLan = await api.get(`/faturamento/lancamentos?atendimento_id=${atendAtivo.id}`);
                setLancamentos(resLan.data.lancamentos);
            } catch (error) {
                toast.error('Erro ao carregar dados do faturamento');
            } finally {
                setLoading(false);
            }
        };
        fetchDados();
    }, []);

    const totais = lancamentos.reduce((acc, curr) => {
        const valor = Number(curr.valor_total) || 0;
        if (curr.tipo === 'PROCEDIMENTO') acc.procedimentos += valor;
        else if (curr.tipo === 'MATERIAL') acc.materiais += valor;
        else if (curr.tipo === 'MEDICAMENTO') acc.medicamentos += valor;
        acc.total += valor;
        return acc;
    }, { procedimentos: 0, diarias: 0, taxas: 0, gases: 0, materiais: 0, medicamentos: 0, total: 0 });

    const handleInserirItem = async (e: any) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const novoItem = {
            atendimento_id: atendimento.id,
            realizacao: formData.get('data'),
            item: formData.get('item_nome'),
            tipo: 'PROCEDIMENTO', // Simplificado para o exemplo
            valor_unitario: Number(formData.get('valor_unit')),
            quantidade: Number(formData.get('qtd')),
            valor_total: Number(formData.get('valor_unit')) * Number(formData.get('qtd')),
        };

        try {
            const res = await api.post('/faturamento/lancamentos', novoItem);
            setLancamentos([...lancamentos, res.data]);
            toast.success('Item lançado com sucesso');
            e.target.reset();
        } catch (error) {
            toast.error('Falha ao lançar item');
        }
    };

    if (!atendimento) return <div className="p-8">Carregando atendimento...</div>;

    return (
        <div className="space-y-6">
            {/* Cabeçalho do Atendimento */}
            <div className="glass p-6 rounded-2xl flex flex-wrap gap-8 items-center border-l-4 border-l-primary">
                <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Atendimento</p>
                    <p className="text-lg font-bold">{atendimento.id}</p>
                </div>
                <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Prontuário</p>
                    <p className="text-lg font-bold">{atendimento.paciente_prontuario || '000006952'}</p>
                </div>
                <div className="flex-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Nome do Paciente</p>
                    <p className="text-lg font-bold text-primary">{atendimento.paciente_nome}</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn-secondary py-2">Resumo Atendimento</button>
                    <button className="btn-primary py-2 px-6">Fechar Fatura</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Resumo da Fatura (Lado Esquerdo) */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="glass p-6 rounded-2xl shadow-sm border border-primary/10">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-primary" /> Resumo da Fatura
                        </h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Procedimentos', value: totais.procedimentos, icon: Activity },
                                { label: 'Diárias', value: totais.diarias, icon: FileText },
                                { label: 'Taxas', value: totais.taxas, icon: CreditCard },
                                { label: 'Materiais', value: totais.materiais, icon: Package },
                                { label: 'Medicamentos', value: totais.medicamentos, icon: Syringe },
                            ].map((item) => (
                                <div key={item.label} className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <item.icon className="w-4 h-4 opacity-50" /> {item.label}
                                    </span>
                                    <span className="font-mono font-medium">R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            ))}
                            <div className="pt-4 mt-4 border-t border-border flex justify-between items-center">
                                <span className="font-bold text-primary">Valor Total</span>
                                <span className="text-xl font-black text-primary font-mono">
                                    R$ {totais.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Área de Lançamentos (Lado Direito) */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Abas */}
                    <div className="flex gap-1 p-1 bg-secondary/30 rounded-xl w-fit">
                        <button className="px-4 py-2 rounded-lg bg-background text-primary shadow-sm text-sm font-bold">Serviços</button>
                        <button className="px-4 py-2 rounded-lg text-muted-foreground text-sm hover:text-foreground">Materiais e Medicamentos</button>
                        <button className="px-4 py-2 rounded-lg text-muted-foreground text-sm hover:text-foreground">Faturas</button>
                    </div>

                    {/* Formulário de Inserção */}
                    <div className="glass p-6 rounded-2xl">
                        <form onSubmit={handleInserirItem} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-foreground">Data Cobrança</label>
                                <input type="date" name="data" className="input-field py-2" defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-xs font-bold text-muted-foreground">Procedimento</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input type="text" name="item_nome" className="input-field py-2 pl-10" placeholder="Pesquise pelo código ou nome..." required />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-foreground">Setor</label>
                                <select className="input-field py-2">
                                    <option>CONSULTÓRIO MÉDICO</option>
                                    <option>PRONTO SOCORRO</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-3 gap-2 md:col-span-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-foreground">Quantidade</label>
                                    <input type="number" name="qtd" step="1" className="input-field py-2 text-center" defaultValue="1" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-foreground">Valor Unitário</label>
                                    <input type="number" name="valor_unit" step="0.01" className="input-field py-2 text-right font-mono" placeholder="0,00" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-foreground">Profissional</label>
                                    <select className="input-field py-2 text-sm">
                                        <option>Selecione...</option>
                                        <option>Dr. Carlos Eduardo</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-end">
                                <button type="submit" className="btn-primary w-full py-2 flex items-center justify-center gap-2">
                                    <Plus className="w-4 h-4" /> Inserir
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Tabela de Lançamentos Realizados */}
                    <div className="glass rounded-2xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-secondary/50 border-b border-border">
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Realização</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Item</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase text-right">Valor</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase text-center">Qtd.</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase text-right">Total</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Faturado por</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase text-center">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {lancamentos.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <FileText className="w-8 h-8 opacity-20" />
                                                <p>Nenhum serviço inserido neste atendimento.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    lancamentos.map((item) => (
                                        <tr key={item.id} className="hover:bg-secondary/20 transition-colors group">
                                            <td className="p-4 text-sm font-medium">
                                                {new Date(item.realizacao).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-foreground">{item.item}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.tipo}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm font-mono text-right">
                                                {item.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-4 text-sm font-bold text-center">{item.quantidade}</td>
                                            <td className="p-4 text-sm font-mono font-bold text-right text-primary">
                                                {item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">{item.faturado_por}</td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={async () => {
                                                        await api.delete(`/faturamento/lancamentos/${item.id}`);
                                                        setLancamentos(lancamentos.filter(l => l.id !== item.id));
                                                        toast.success('Lançamento removido');
                                                    }}
                                                    className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}