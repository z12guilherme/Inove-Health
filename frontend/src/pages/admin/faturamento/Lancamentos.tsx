import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, FileText, Activity, Box, Tag, UserCheck, AlertTriangle } from 'lucide-react';
import localStorageService from '../../../services/localStorageService';
import toast from 'react-hot-toast';

export function LancamentosFaturamento() {
    const [atendimentos, setAtendimentos] = useState<any[]>([]);
    const [tabelas, setTabelas] = useState<any[]>([]);
    const [insumos, setInsumos] = useState<any[]>([]); // Para itens da farmacia/almoxarifado

    const [atendimentoAtivo, setAtendimentoAtivo] = useState<any>(null);
    const [convenioAtivo, setConvenioAtivo] = useState<any>(null);

    const [abaAtiva, setAbaAtiva] = useState<'servicos' | 'materiais' | 'faturas'>('servicos');

    const [formItem, setFormItem] = useState({
        data_cobranca: new Date().toISOString().split('T')[0],
        item_id: '',
        quantidade: 1,
        ajuste: 0,
        setor: 'CONSULTÓRIO MÉDICO',
        is_material: false
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setAtendimentos(localStorageService.getAtendimentos().filter(a => a.status !== 'CANCELADO'));
        setTabelas(localStorageService.getTabelasPrecos());
        setInsumos(localStorageService.getItensFarmacia());
    };

    const handleSelectAtendimento = (id: string) => {
        const atd = atendimentos.find(a => a.id === id);
        setAtendimentoAtivo(atd);
        if (atd) {
            const convenios = localStorageService.getConvenios();
            setConvenioAtivo(convenios.find(c => c.id === atd.convenio_id));
        }
    };

    // Calcular os totais a partir do array de procedimentos do atendimento
    const procedimentosAgregados = (atendimentoAtivo?.procedimentos || []).map((p: any) => ({
        ...p,
        total_item: (Number(p.valor) || 0) * (Number(p.qtd) || 1)
    }));

    const totaisFatura = procedimentosAgregados.reduce((acc: any, curr: any) => {
        // Lógica simples: se o código do procedimento começa com 03 ou tem nome de insumo, é material.
        // Opcionalmente podemos usar uma flag no objeto.
        const isMaterial = curr.is_material || curr.codigo.startsWith('03') || curr.codigo.startsWith('04') || curr.codigo === 'MEDICAMENTO';

        if (isMaterial) {
            acc.materiais += curr.total_item;
        } else {
            acc.procedimentos += curr.total_item;
        }
        acc.total += curr.total_item;
        return acc;
    }, { procedimentos: 0, diarias: 0, taxas: 0, gases: 0, materiais: 0, medicamentos: 0, total: 0 });

    const handleInserirItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!atendimentoAtivo) return toast.error('Selecione um paciente primeiro.');
        if (!formItem.item_id) return toast.error('Selecione um item para lançar.');

        let itemBase: any = null;
        let codigoBase = '';
        let isMaterial = formItem.is_material;

        if (isMaterial) {
            itemBase = insumos.find((i: any) => i.id === formItem.item_id);
            codigoBase = 'MAT/MED';
        } else {
            // Procura nos itens de todas as tabelas
            for (const tab of tabelas) {
                const found = tab.itens?.find((i: any) => i.id === formItem.item_id);
                if (found) {
                    itemBase = found;
                    codigoBase = found.codigo;
                    break;
                }
            }
        }

        if (!itemBase) return toast.error('Item base não encontrado.');

        // Se for tabela de preço, pega o valor_padrao. Se for insumo, pega da tabela vinculada ou fixa.
        let valorUnitario = 0;
        if (isMaterial) {
            // Tenta achar tabela vinculada
            const vinculo = itemBase.tabelas_faturamento_vinculadas?.find((v: any) => v.convenio_id === atendimentoAtivo.convenio_id);
            valorUnitario = vinculo ? vinculo.valor : (itemBase.valor_padrao || 10.0);
        } else {
            valorUnitario = Number(itemBase?.valor_padrao || itemBase?.valor) || 0;
        }

        const ajusteMultiplier = 1 + (formItem.ajuste / 100);
        const valorFinal = valorUnitario * ajusteMultiplier;

        let codigoTabelaFinal = '22';
        if (isMaterial) {
            codigoTabelaFinal = (itemBase?.nome || '').toLowerCase().includes('medicamento') || (itemBase?.nome || '').toLowerCase().includes('dipirona') ? '20' : '19';
        } else {
            // Find the table that owns this item to get its tipo
            const tabelaPai = tabelas.find(t => t.itens?.some((i: any) => i.id === formItem.item_id));
            if (tabelaPai && tabelaPai.tipo) {
                codigoTabelaFinal = tabelaPai.tipo.split(' - ')[0];
            }
        }

        const novoProcedimento = {
            data: formItem.data_cobranca,
            codigo: codigoBase,
            nome: itemBase?.nome || 'Item sem nome',
            valor: valorFinal,
            qtd: formItem.quantidade,
            is_material: isMaterial,
            faturado_por: formItem.setor,
            codigo_tabela: codigoTabelaFinal,
            id_lancamento: Date.now().toString()
        };

        // Atualizar atendimento no localStorage
        const atdAtualizado = {
            ...atendimentoAtivo,
            valor_total: (atendimentoAtivo.valor_total || 0) + (valorFinal * formItem.quantidade),
            procedimentos: [...(atendimentoAtivo.procedimentos || []), novoProcedimento]
        };

        localStorageService.updateAtendimento(atdAtualizado);
        setAtendimentoAtivo(atdAtualizado); // Força re-render

        // Atualizar também a lista mestre
        setAtendimentos(atendimentos.map(a => a.id === atdAtualizado.id ? atdAtualizado : a));

        toast.success(`Lançamento de ${itemBase.nome} realizado com sucesso!`);
    };

    const handleRemoverLancamento = (id_lancamento: string) => {
        if (!atendimentoAtivo) return;

        const novaLista = (atendimentoAtivo.procedimentos || []).filter((p: any) => p.id_lancamento !== id_lancamento);
        const atdAtualizado = {
            ...atendimentoAtivo,
            procedimentos: novaLista
        };

        // Recalcula total global
        atdAtualizado.valor_total = novaLista.reduce((sum: number, p: any) => sum + (p.valor * (p.qtd || 1)), 0);

        localStorageService.updateAtendimento(atdAtualizado);
        setAtendimentoAtivo(atdAtualizado);
        setAtendimentos(atendimentos.map(a => a.id === atdAtualizado.id ? atdAtualizado : a));
        toast.success('Item removido da conta do paciente.');
    };

    // Agregar todos os itens disponíveis para seleção
    const optionsProcedimentos = tabelas.flatMap(t => t.itens?.map((i: any) => ({ ...i, nomeTabela: t.nome })) || []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Lançamentos na Conta</h1>
                    <p className="text-muted-foreground mt-2">Auditoria, lançamentos manuais e fechamento de conta do paciente.</p>
                </div>
            </div>

            <div className="glass p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Selecione o Paciente/Atendimento</label>
                    <select
                        className="input-field py-3 w-full"
                        value={atendimentoAtivo?.id || ''}
                        onChange={(e) => handleSelectAtendimento(e.target.value)}
                    >
                        <option value="">Buscar por paciente, prontuário...</option>
                        {atendimentos.map(atd => (
                            <option key={atd.id} value={atd.id}>
                                {atd.paciente_nome} - {atd.tipo} - {new Date(atd.data).toLocaleDateString()}
                            </option>
                        ))}
                    </select>
                </div>
                {atendimentoAtivo && (
                    <div className="bg-emerald-500/10 text-emerald-500 px-6 py-3 rounded-xl border border-emerald-500/20 font-bold flex items-center gap-2">
                        <UserCheck size={18} /> Conta Aberta
                    </div>
                )}
            </div>

            {atendimentoAtivo && (
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {/* Lateral Esquerda - Resumo da Fatura */}
                    <div className="xl:col-span-1 space-y-6">
                        <div className="glass rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 z-0"></div>

                            <h3 className="font-bold text-lg border-b border-border pb-4 mb-4 relative z-10 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" /> Resumo da Fatura
                            </h3>

                            <div className="space-y-4 relative z-10">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Procedimentos</span>
                                    <span className="font-semibold text-primary">R$ {(Number(totaisFatura.procedimentos) || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Diárias</span>
                                    <span className="font-semibold text-primary">R$ {(Number(totaisFatura.diarias) || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Taxas e Gases</span>
                                    <span className="font-semibold text-primary">R$ {(Number(totaisFatura.taxas + totaisFatura.gases) || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Materiais / Meds</span>
                                    <span className="font-semibold text-primary">R$ {(Number(totaisFatura.materiais + totaisFatura.medicamentos) || 0).toFixed(2)}</span>
                                </div>

                                <div className="pt-4 border-t border-border/50">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-foreground">Valor Total</span>
                                        <span className="text-2xl font-black text-primary">R$ {(Number(totaisFatura.total) || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass rounded-2xl p-6 bg-secondary/10">
                            <h3 className="font-bold mb-4 text-sm uppercase text-muted-foreground tracking-wider">Dados do Paciente</h3>
                            <div className="space-y-3 text-sm">
                                <p><strong className="text-foreground">Nome:</strong> {atendimentoAtivo.paciente_nome}</p>
                                <p><strong className="text-foreground">Atendimento:</strong> {atendimentoAtivo.id}</p>
                                <p><strong className="text-foreground">Convênio:</strong> {convenioAtivo?.nome || 'PARTICULAR'}</p>
                                <p><strong className="text-foreground">Status:</strong> {atendimentoAtivo.status}</p>
                            </div>
                        </div>
                    </div>

                    {/* Area Central - Lançamentos */}
                    <div className="xl:col-span-3 space-y-6">
                        {/* Abas */}
                        <div className="flex border-b border-border glass rounded-t-2xl px-2 pt-2">
                            <button
                                className={`px-6 py-4 font-bold text-sm transition-all relative ${abaAtiva === 'servicos' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                onClick={() => setAbaAtiva('servicos')}
                            >
                                <div className="flex items-center gap-2">
                                    <Activity size={18} /> Serviços (Procedimentos)
                                </div>
                                {abaAtiva === 'servicos' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>}
                            </button>
                            <button
                                className={`px-6 py-4 font-bold text-sm transition-all relative ${abaAtiva === 'materiais' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                onClick={() => setAbaAtiva('materiais')}
                            >
                                <div className="flex items-center gap-2">
                                    <Box size={18} /> Materiais e Medicamentos
                                </div>
                                {abaAtiva === 'materiais' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>}
                            </button>
                        </div>

                        {/* Formulário de Inserção */}
                        <div className="glass p-6 rounded-b-2xl rounded-tr-2xl shadow-sm border border-border/50">
                            <h3 className="font-bold text-sm uppercase text-muted-foreground mb-4">Dados do Item a Lançar</h3>

                            <form onSubmit={handleInserirItem} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
                                <div className="md:col-span-2 lg:col-span-2">
                                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
                                        Item Tabela (SIMPRO/AMB/TUSS)
                                    </label>
                                    <select
                                        className="input-field"
                                        value={formItem.item_id}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const isMat = val.startsWith('insumo_');
                                            setFormItem({ ...formItem, item_id: val.replace('insumo_', ''), is_material: isMat });
                                        }}
                                        required
                                    >
                                        <option value="">Pesquise pelo item...</option>

                                        {/* Agrupamento Procedimentos */}
                                        <optgroup label="Serviços / Procedimentos (TUSS/AMB)">
                                            {optionsProcedimentos.map((p: any) => (
                                                <option key={p.id} value={p.id}>{p.codigo} - {p.nome} (R$ {(Number(p.valor_padrao || p.valor) || 0).toFixed(2)})</option>
                                            ))}
                                        </optgroup>

                                        {/* Agrupamento Materiais SIMPRO/BRASINDICE/Farmácia */}
                                        <optgroup label="Materiais / Medicamentos (SIMPRO/Farmácia)">
                                            {insumos.map((i: any) => (
                                                <option key={`insumo_${i.id}`} value={`insumo_${i.id}`}>
                                                    {i.codigo_tuss || 'MAT'} - {i.nome} (Estoque: {i.estoque})
                                                </option>
                                            ))}
                                        </optgroup>
                                    </select>
                                </div>


                                <div className="md:col-span-1 lg:col-span-1">
                                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Qtd.</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        className="input-field"
                                        value={formItem.quantidade}
                                        onChange={(e) => setFormItem({ ...formItem, quantidade: parseFloat(e.target.value) || 1 })}
                                        required
                                    />
                                </div>

                                <div className="md:col-span-1 lg:col-span-1">
                                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Ajuste (%)</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={formItem.ajuste}
                                        onChange={(e) => setFormItem({ ...formItem, ajuste: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>

                                <div className="md:col-span-1 lg:col-span-1">
                                    <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-bold hover:bg-primary/90 flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                                        <Plus size={18} /> Inserir
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Listagem da Fatura (Conta do Paciente) */}
                        <div className="glass rounded-2xl overflow-hidden border border-border/50">
                            <div className="bg-secondary/30 p-4 border-b border-border flex justify-between items-center">
                                <h3 className="font-bold flex items-center gap-2"><Tag className="w-5 h-5 text-primary" /> Itens Lançados na Conta</h3>
                                <div className="text-xs font-medium text-muted-foreground">Exibindo {procedimentosAgregados.length} itens</div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-secondary/10">
                                        <tr>
                                            <th className="p-4 font-bold text-muted-foreground uppercase text-xs">Data/Setor</th>
                                            <th className="p-4 font-bold text-muted-foreground uppercase text-xs">Código - Descrição</th>
                                            <th className="p-4 font-bold text-muted-foreground uppercase text-xs">Tipo</th>
                                            <th className="p-4 font-bold text-muted-foreground uppercase text-xs">Qtd</th>
                                            <th className="p-4 font-bold text-muted-foreground uppercase text-xs">Valor Total</th>
                                            <th className="p-4 font-bold text-muted-foreground uppercase text-xs w-16">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {procedimentosAgregados.length > 0 ? (
                                            procedimentosAgregados.map((p: any, idx: number) => (
                                                <tr key={p.id_lancamento || idx} className="hover:bg-secondary/5 transition-colors">
                                                    <td className="p-4">
                                                        <div className="font-mono text-xs">{new Date(p.data || new Date()).toLocaleDateString()}</div>
                                                        <div className="text-[10px] text-muted-foreground uppercase mt-1">{p.faturado_por || 'CLINICA_MEDICA'}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="font-mono font-bold text-primary mr-2">{p.codigo || 'S/N'}</span>
                                                        <span className="font-medium">{p.nome}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        {p.is_material ? (
                                                            <span className="bg-orange-500/10 text-orange-600 px-2 py-1 rounded text-[10px] font-bold">MATERIAL</span>
                                                        ) : (
                                                            <span className="bg-blue-500/10 text-blue-600 px-2 py-1 rounded text-[10px] font-bold">SERVIÇO</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 font-mono">{p.qtd || 1}</td>
                                                    <td className="p-4 font-bold">R$ {(Number(p.total_item) || 0).toFixed(2)}</td>
                                                    <td className="p-4">
                                                        <button
                                                            onClick={() => handleRemoverLancamento(p.id_lancamento)}
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                                                            title="Remover Item"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="p-12 text-center text-muted-foreground">
                                                    <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                                    Nenhum material ou procedimento inserido na conta deste paciente.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}