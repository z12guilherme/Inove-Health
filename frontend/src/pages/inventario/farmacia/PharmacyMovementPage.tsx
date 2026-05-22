import React, { useState, useEffect } from 'react';
import { Search, Trash2, Save, ArrowRightLeft, User, PackagePlus, PackageMinus, Building, Truck, FileText, ArrowLeft } from 'lucide-react';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const PharmacyMovementPage: React.FC = () => {
    const navigate = useNavigate();
    const [operacao, setOperacao] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');
    const [tipoSaida, setTipoSaida] = useState<'CONSUMO' | 'TRANSFERENCIA'>('CONSUMO');

    const [tiposMovimento, setTiposMovimento] = useState<any[]>([]);
    const [setores, setSetores] = useState<any[]>([]);
    const [insumos, setInsumos] = useState<any[]>([]);
    const [atendimentos, setAtendimentos] = useState<any[]>([]);
    const [convenios, setConvenios] = useState<any[]>([]);
    const [tabelas, setTabelas] = useState<any[]>([]);
    const [fornecedores, setFornecedores] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [carrinho, setCarrinho] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        data: new Date().toISOString().split('T')[0],
        tipo_movimento_id: '',
        setor_id: '',
        setor_origem_id: '',
        setor_destino_id: '',
        fornecedor_id: '',
        atendimento_id: '',
        documento: '',
        icms: 0,
        icms_st: 0,
        ipi: 0,
        observacao: ''
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [resTipos, resSetores, resInsumos, resAtend, resConv, resTabs, resFornecedores] = await Promise.all([
                    api.get('/estoque/tipos-movimento'),
                    api.get('/estoque/setores'),
                    api.get('/estoque/insumos'),
                    api.get('/atendimentos').catch(() => ({ data: { atendimentos: [] } })),
                    api.get('/cadastros/convenios').catch(() => ({ data: { convenios: [] } })),
                    api.get('/faturamento/tabelas').catch(() => ({ data: { tabelas: [] } })),
                    api.get('/cadastros/fornecedores').catch(() => ({ data: { fornecedores: [] } }))
                ]);
                setTiposMovimento(resTipos.data.tipos);
                setSetores(resSetores.data.setores);
                setInsumos(resInsumos.data.insumos);
                setAtendimentos(resAtend.data.atendimentos);
                setConvenios(resConv.data.convenios || resConv.data);
                setTabelas(resTabs.data.tabelas || resTabs.data);
                setFornecedores(resFornecedores.data.fornecedores || resFornecedores.data);
            } catch (error) {
                toast.error('Erro ao carregar dados auxiliares de estoque');
            }
        };
        loadData();
    }, []);

    const resolvePrecoFaturamento = (insumoId: string) => {
        if (!formData.atendimento_id) return 0;
        const atendimento = atendimentos.find(a => a.id === formData.atendimento_id);
        const convenio = convenios.find(c => c.id === atendimento?.convenio_id);
        if (!convenio || !convenio.tabelas_vinculadas) return 0;

        for (const vinculo of convenio.tabelas_vinculadas) {
            const tabela = tabelas.find(t => t.id === vinculo.tabela_id);
            const itemFaturamento = tabela?.itens?.find((i: any) => i.insumo_id === insumoId);
            if (itemFaturamento) return itemFaturamento.valor;
        }
        return insumos.find(i => i.id === insumoId)?.preco_unitario || 0;
    };

    const handleAdicionarAoCarrinho = (insumoId: string) => {
        const insumo = insumos.find(i => i.id === insumoId);
        if (!insumo || carrinho.find(c => c.insumo_id === insumoId)) return;

        const precoResolvido = resolvePrecoFaturamento(insumoId);
        setCarrinho([...carrinho, {
            insumo_id: insumo.id,
            nome: insumo.nome,
            quantidade: 1,
            lote: insumo.lote,
            valor_unitario: precoResolvido,
            total: precoResolvido
        }]);
    };

    const handleSalvarMovimentacao = async () => {
        if (!formData.tipo_movimento_id || carrinho.length === 0) {
            toast.error('Preencha o tipo de movimento e adicione itens');
            return;
        }
        setLoading(true);
        try {
            await api.post('/estoque/movimentacoes', {
                ...formData,
                operacao,
                tipo_saida: operacao === 'SAIDA' ? tipoSaida : null,
                itens: carrinho
            });
            toast.success('Movimentação realizada com sucesso!');
            setCarrinho([]);
            setFormData({
                data: new Date().toISOString().split('T')[0],
                tipo_movimento_id: '',
                setor_id: '',
                setor_origem_id: '',
                setor_destino_id: '',
                fornecedor_id: '',
                atendimento_id: '',
                documento: '',
                icms: 0,
                icms_st: 0,
                ipi: 0,
                observacao: ''
            });
        } catch (error) {
            toast.error('Erro ao processar movimentação');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-6 bg-gray-50 min-h-screen">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2 tracking-tighter">
                        <ArrowRightLeft className="text-blue-600" /> MOVIMENTAÇÃO DE ESTOQUE
                    </h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Controle de entrada e saída de insumos</p>
                </div>

                <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-200">
                    <button
                        onClick={() => setOperacao('ENTRADA')}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${operacao === 'ENTRADA' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <PackagePlus size={16} /> Nova Entrada
                    </button>
                    <button
                        onClick={() => setOperacao('SAIDA')}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${operacao === 'SAIDA' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <PackageMinus size={16} /> Nova Saída
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 space-y-5">
                        <h2 className="text-lg font-black text-gray-800 uppercase tracking-tighter flex items-center gap-2 border-b border-gray-50 pb-3">
                            {operacao === 'ENTRADA' ? <PackagePlus className="text-emerald-500" /> : <PackageMinus className="text-blue-500" />}
                            {operacao === 'ENTRADA' ? 'Nova Entrada' : 'Nova Saída'}
                        </h2>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{operacao === 'ENTRADA' ? 'Data de Entrada' : 'Data de Saída'}</label>
                                <input type="date" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl mt-1 font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all" value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} />
                            </div>

                            {operacao === 'SAIDA' && (
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo da saída</label>
                                    <div className="flex gap-2 mt-1">
                                        <button onClick={() => setTipoSaida('CONSUMO')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg border transition-all ${tipoSaida === 'CONSUMO' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-100 text-gray-400'}`}>Consumo</button>
                                        <button onClick={() => setTipoSaida('TRANSFERENCIA')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg border transition-all ${tipoSaida === 'TRANSFERENCIA' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-100 text-gray-400'}`}>Transferência</button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo de Movimento</label>
                                <select className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl mt-1 font-bold text-gray-700 outline-none" value={formData.tipo_movimento_id} onChange={e => setFormData({ ...formData, tipo_movimento_id: e.target.value })}>
                                    <option value="">Selecione...</option>
                                    {tiposMovimento.filter(t => t.tipo === operacao).map(t => <option key={t.id} value={t.id}>{t.descricao}</option>)}
                                </select>
                            </div>

                            {operacao === 'ENTRADA' ? (
                                <>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Setor</label>
                                        <select className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl mt-1 font-bold text-gray-700 outline-none" value={formData.setor_id} onChange={e => setFormData({ ...formData, setor_id: e.target.value })}>
                                            <option value="">Selecione o Setor...</option>
                                            {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fornecedor</label>
                                        <select className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl mt-1 font-bold text-gray-700 outline-none" value={formData.fornecedor_id} onChange={e => setFormData({ ...formData, fornecedor_id: e.target.value })}>
                                            <option value="">Selecione o Fornecedor...</option>
                                            {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome_fantasia}</option>)}
                                        </select>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><FileText size={12} /> Documento/Nota Fiscal</p>
                                        <input type="text" placeholder="Número da Nota" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm font-bold" value={formData.documento} onChange={e => setFormData({ ...formData, documento: e.target.value })} />
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="text-[8px] font-black text-gray-400 uppercase">ICMS(R$)</label>
                                                <input type="number" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-mono" value={formData.icms} onChange={e => setFormData({ ...formData, icms: Number(e.target.value) })} />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black text-gray-400 uppercase">ICMS Subst.</label>
                                                <input type="number" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-mono" value={formData.icms_st} onChange={e => setFormData({ ...formData, icms_st: Number(e.target.value) })} />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black text-gray-400 uppercase">IPI (R$)</label>
                                                <input type="number" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-mono" value={formData.ipi} onChange={e => setFormData({ ...formData, ipi: Number(e.target.value) })} />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Setor de origem</label>
                                        <select className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl mt-1 font-bold text-gray-700 outline-none" value={formData.setor_origem_id} onChange={e => setFormData({ ...formData, setor_origem_id: e.target.value })}>
                                            <option value="">Selecione...</option>
                                            {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Setor de destino</label>
                                        <select className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl mt-1 font-bold text-gray-700 outline-none" value={formData.setor_destino_id} onChange={e => setFormData({ ...formData, setor_destino_id: e.target.value })}>
                                            <option value="">Selecione...</option>
                                            {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                                        </select>
                                    </div>
                                    {tipoSaida === 'CONSUMO' && (
                                        <div>
                                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Atendimento/Paciente</label>
                                            <select className="w-full p-3 bg-blue-50/50 border border-blue-100 rounded-xl mt-1 font-bold text-blue-800 outline-none" value={formData.atendimento_id} onChange={e => setFormData({ ...formData, atendimento_id: e.target.value })}>
                                                <option value="">Selecionar Paciente...</option>
                                                {atendimentos.filter(a => a.status === 'ATIVO').map(a => <option key={a.id} value={a.id}>{a.paciente_nome}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </>
                            )}

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Observações</label>
                                <textarea rows={2} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl mt-1 text-sm font-medium outline-none" placeholder="Informações adicionais..." value={formData.observacao} onChange={e => setFormData({ ...formData, observacao: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button onClick={handleSalvarMovimentacao} disabled={loading} className={`w-full py-4 rounded-2xl font-black uppercase text-sm shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 ${operacao === 'ENTRADA' ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-blue-600 text-white shadow-blue-200'}`}>
                            {loading ? 'Processando...' : <><Save size={20} /> Criar {operacao === 'ENTRADA' ? 'Entrada' : 'Saída'}</>}
                        </button>
                        <button onClick={() => navigate('/admin/estoque/insumos')} className="w-full py-3 text-[10px] font-black uppercase text-gray-400 hover:text-gray-600 flex items-center justify-center gap-2">
                            <ArrowLeft size={14} /> Cancelar e voltar para listagem
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 sm:p-8 rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pb-4 border-b border-gray-50">
                            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter">Itens da Movimentação</h2>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <select className="pl-10 pr-4 py-3 border border-gray-200 rounded-2xl text-xs font-bold w-full appearance-none bg-gray-50 focus:bg-white transition-all outline-none" onChange={(e) => handleAdicionarAoCarrinho(e.target.value)} value="">
                                    <option value="">Buscar Insumo...</option>
                                    {insumos.map(i => <option key={i.id} value={i.id}>{i.nome} ({i.quantidade_atual} un)</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {carrinho.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-5 bg-gray-50/50 rounded-3xl border border-gray-100 hover:border-blue-200 transition-all group">
                                    <div className="flex-1">
                                        <p className="text-sm font-black text-gray-800">{item.nome}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lote: {item.lote}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase">V. Unitário</p>
                                        <p className="font-mono font-bold text-gray-700">{item.valor_unitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
                                        <label className="text-[10px] font-black text-gray-400">QTD</label>
                                        <input type="number" className="w-12 p-1 border-none bg-transparent rounded text-center font-black text-blue-600 focus:ring-0" value={item.quantidade} onChange={(e) => {
                                            const newCarrinho = [...carrinho];
                                            const val = Number(e.target.value);
                                            newCarrinho[idx].quantidade = val;
                                            newCarrinho[idx].total = val * newCarrinho[idx].valor_unitario;
                                            setCarrinho(newCarrinho);
                                        }} />
                                    </div>
                                    <button onClick={() => setCarrinho(carrinho.filter((_, i) => i !== idx))} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={18} /></button>
                                </div>
                            ))}
                            {carrinho.length === 0 && (
                                <div className="py-32 text-center text-gray-300 border-2 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center gap-3">
                                    <ArrowRightLeft size={40} className="opacity-20" />
                                    <p className="text-sm font-bold uppercase tracking-widest opacity-50">Selecione insumos para iniciar a operação</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PharmacyMovementPage;