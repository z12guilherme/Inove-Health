import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, FileText, CreditCard, Package, Syringe, Activity, Clock, UserCheck } from 'lucide-react';
import { api } from '../../../lib/api';
import { cn } from '../../../lib/utils';
import toast from 'react-hot-toast';

export function LancamentosFaturamento() {
    const [convenio, setConvenio] = useState<any>(null);
    const [tabelas, setTabelas] = useState<any[]>([]);
    const [tabelaSelecionada, setTabelaSelecionada] = useState<string>('');
    const [atendimento, setAtendimento] = useState<any>(null);
    const [lancamentos, setLancamentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [abaAtiva, setAbaAtiva] = useState<'servicos' | 'materiais' | 'faturas'>('servicos');

    useEffect(() => {
        const fetchDados = async () => {
            setLoading(true);
            try {
                const resAtend = await api.get('/atendimentos');
                const atendAtivo = resAtend.data.atendimentos[0]; // Maria Silva Costa (ATD-1001)
                setAtendimento(atendAtivo);

                // Busca dados do convênio do paciente (agora dinâmico pelo atendimento)
                const resConv = await api.get('/cadastros/convenios');
                const convenioDoAtendimento = resConv.data.convenios.find((c: any) => c.id === atendAtivo.convenio_id);
                setConvenio(convenioDoAtendimento);

                const resTabs = await api.get('/faturamento/tabelas');
                setTabelas(resTabs.data.tabelas);

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
        const vUnit = Number(formData.get('valor_unit'));
        const qtd = Number(formData.get('qtd'));
        const ajuste = Number(formData.get('ajuste')) || 0;

        const totalComAjuste = (vUnit * qtd) * (1 + ajuste / 100);

        const novoItem = {
            atendimento_id: atendimento.id,
            realizacao: formData.get('data'),
            item: formData.get('item_nome'),
            tipo: abaAtiva === 'servicos' ? 'PROCEDIMENTO' : 'MATERIAL',
            valor_unitario: vUnit,
            quantidade: qtd,
            ajuste: ajuste,
            valor_total: totalComAjuste,
            tecnica: formData.get('tecnica'),
            profissional: formData.get('profissional')
        };

        try {
            const res = await api.post('/faturamento/lancamentos', novoItem);
            setLancamentos([...lancamentos, res.data]);
            toast.success('Lançamento inserido com sucesso');
            e.target.reset();
        } catch (error) {
            toast.error('Falha ao processar lançamento');
        }
    };

    if (!atendimento) return <div className="p-8 animate-pulse text-muted-foreground">Buscando prontuário...</div>;

    return (
        <div className="space-y-6">
            {/* Cabeçalho do Paciente - Conforme seu Layout */}
            <div className="glass p-6 rounded-2xl flex flex-wrap gap-8 items-center border-l-4 border-l-primary shadow-lg">
                <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Atendimento</p>
                    <p className="text-xl font-black text-foreground">{atendimento.id}</p>
                </div>
                <div className="h-10 w-[1px] bg-border/50 hidden md:block" />
                <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Prontuário</p>
                    <p className="text-xl font-bold">{atendimento.paciente_prontuario || '000006952'}</p>
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nome do Paciente</p>
                    <p className="text-xl font-black text-primary uppercase">{atendimento.paciente_nome}</p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-secondary flex items-center gap-2"><FileText className="w-4 h-4" /> Resumo</button>
                    <button className="btn-primary px-8">Fechar Fatura</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Resumo da Fatura (Lateral) */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="glass p-6 rounded-2xl shadow-xl border border-primary/5 bg-gradient-to-b from-background to-secondary/10">
                        <h3 className="font-black text-sm uppercase tracking-tighter mb-6 flex items-center gap-2 text-primary">
                            <CreditCard className="w-4 h-4" /> Resumo da Fatura
                        </h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Procedimentos', value: totais.procedimentos, icon: Activity, color: 'text-blue-500' },
                                { label: 'Diárias', value: totais.diarias, icon: Clock, color: 'text-purple-500' },
                                { label: 'Taxas', value: totais.taxas, icon: CreditCard, color: 'text-orange-500' },
                                { label: 'Materiais', value: totais.materiais, icon: Package, color: 'text-emerald-500' },
                                { label: 'Medicamentos', value: totais.medicamentos, icon: Syringe, color: 'text-rose-500' },
                            ].map((item) => (
                                <div key={item.label} className="flex justify-between items-center group">
                                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                                        <item.icon className={cn("w-3 h-3 opacity-70", item.color)} /> {item.label}
                                    </span>
                                    <span className="font-mono text-sm font-bold">R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            ))}
                            <div className="pt-6 mt-2 border-t border-dashed border-border flex justify-between items-end">
                                <span className="font-black text-xs uppercase text-primary">Valor Total</span>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-primary font-mono leading-none">
                                        R$ {totais.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lançamentos e Formulário */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex gap-2 p-1.5 bg-secondary/20 rounded-2xl w-fit border border-border/50">
                        {(['servicos', 'materiais', 'faturas'] as const).map((aba) => (
                            <button
                                key={aba}
                                onClick={() => setAbaAtiva(aba)}
                                className={cn(
                                    "px-6 py-2 rounded-xl text-xs font-black uppercase transition-all",
                                    abaAtiva === aba ? "bg-background text-primary shadow-md border border-primary/10" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {aba === 'servicos' ? 'Serviços' : aba === 'materiais' ? 'Materiais e Medicamentos' : 'Faturas'}
                            </button>
                        ))}
                    </div>

                    {/* Formulário de Inserção */}
                    <div className="glass p-6 rounded-2xl border-t-2 border-t-primary/20">
                        <form onSubmit={handleInserirItem} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground">Data Cobrança</label>
                                    <input type="date" name="data" className="input-field py-2" defaultValue={new Date().toISOString().split('T')[0]} />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground">Procedimento / Item</label>
                                    <div className="relative group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input type="text" name="item_nome" className="input-field py-2 pl-10" placeholder="Pesquise pelo código TUSS ou nome..." required />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground">Setor</label>
                                    <select className="input-field py-2 text-xs font-bold">
                                        <option>CONSULTÓRIO MÉDICO</option>
                                        <option>CENTRO CIRÚRGICO</option>
                                        <option>UTI ADULTO</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground">Técnica</label>
                                    <select name="tecnica" className="input-field py-2 text-xs">
                                        <option value="">Nenhuma</option>
                                        <option value="LAP">Laparoscopia</option>
                                        <option value="CONV">Convencional</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground">Qtd</label>
                                    <input type="number" name="qtd" step="1" className="input-field py-2 text-center font-bold" defaultValue="1" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground">Valor Unit.</label>
                                    <input type="number" name="valor_unit" step="0.01" className="input-field py-2 text-right font-mono" placeholder="0,00" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground">Ajuste (%)</label>
                                    <input type="number" name="ajuste" className="input-field py-2 text-center" placeholder="0" />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground">Profissional Executante</label>
                                    <div className="relative">
                                        <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <select name="profissional" className="input-field py-2 pl-10 text-xs font-bold">
                                            <option value="">Selecione o profissional...</option>
                                            <option>Dr. Carlos Eduardo Mendes</option>
                                            <option>Dra. Ana Paula Rodrigues</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-border/50">
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                                        <span className="text-[10px] font-black uppercase text-muted-foreground group-hover:text-foreground">Realizado em apartamento</span>
                                    </label>
                                </div>
                                <button type="submit" className="btn-primary py-3 px-10 flex items-center gap-2 shadow-lg shadow-primary/20">
                                    <Plus className="w-5 h-5" /> Inserir Lançamento
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Lista de Itens */}
                    <div className="glass rounded-2xl overflow-hidden shadow-xl border border-border/40">
                        <div className="max-h-[400px] overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 z-10">
                                    <tr className="bg-secondary/80 backdrop-blur-md border-b border-border">
                                        <th className="p-4 text-[10px] font-black text-muted-foreground uppercase">Realização</th>
                                        <th className="p-4 text-[10px] font-black text-muted-foreground uppercase">Item / Descrição</th>
                                        <th className="p-4 text-[10px] font-black text-muted-foreground uppercase text-right">Unitário</th>
                                        <th className="p-4 text-[10px] font-black text-muted-foreground uppercase text-center">Qtd</th>
                                        <th className="p-4 text-[10px] font-black text-muted-foreground uppercase text-right">Total</th>
                                        <th className="p-4 text-[10px] font-black text-muted-foreground uppercase text-center">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {lancamentos.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-20 text-center">
                                                <div className="flex flex-col items-center gap-3 opacity-20">
                                                    <Activity className="w-12 h-12" />
                                                    <p className="text-sm font-black uppercase tracking-widest">Nenhum serviço lançado</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        lancamentos.map((item) => (
                                            <tr key={item.id} className="hover:bg-secondary/30 transition-colors group">
                                                <td className="p-4 text-xs font-bold text-muted-foreground">
                                                    {new Date(item.realizacao).toLocaleDateString()}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-foreground">{item.item}</span>
                                                        <span className="text-[9px] font-bold text-primary uppercase tracking-tighter">
                                                            {item.profissional || 'Sem profissional vinculado'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-xs font-mono text-right font-bold">
                                                    {item.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-4 text-sm font-black text-center">{item.quantidade}</td>
                                                <td className="p-4 text-sm font-mono font-black text-right text-primary">
                                                    {item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={async () => {
                                                            await api.delete(`/faturamento/lancamentos/${item.id}`);
                                                            setLancamentos(lancamentos.filter(l => l.id !== item.id));
                                                            toast.success('Lançamento removido');
                                                        }}
                                                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
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
        </div>
    );
}