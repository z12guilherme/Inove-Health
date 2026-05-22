import React, { useState, useEffect } from 'react';
import { PackagePlus, PackageMinus, Search, Plus, Trash2, Save, ArrowRightLeft, Building2, User } from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

const PharmacyMovementPage: React.FC = () => {
    const [movimentos, setMovimentos] = useState<any[]>([]);
    const [tiposMovimento, setTiposMovimento] = useState<any[]>([]);
    const [setores, setSetores] = useState<any[]>([]);
    const [insumos, setInsumos] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [carrinho, setCarrinho] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        tipo_movimento_id: '',
        setor_id: '',
        documento: '', // NF ou Prontuário
        observacao: ''
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [resTipos, resSetores, resInsumos] = await Promise.all([
                    api.get('/estoque/tipos-movimento'),
                    api.get('/estoque/setores'),
                    api.get('/estoque/insumos')
                ]);
                setTiposMovimento(resTipos.data.tipos);
                setSetores(resSetores.data.setores);
                setInsumos(resInsumos.data.insumos);
            } catch (error) {
                toast.error('Erro ao carregar dados auxiliares de estoque');
            }
        };
        loadData();
    }, []);

    const handleAdicionarAoCarrinho = (insumoId: string) => {
        const insumo = insumos.find(i => i.id === insumoId);
        if (!insumo) return;

        if (carrinho.find(c => c.insumo_id === insumoId)) {
            toast.error('Item já adicionado');
            return;
        }

        setCarrinho([...carrinho, {
            insumo_id: insumo.id,
            nome: insumo.nome,
            quantidade: 1,
            lote: insumo.lote
        }]);
    };

    const handleSalvarMovimentacao = async () => {
        if (!formData.tipo_movimento_id || carrinho.length === 0) {
            toast.error('Preencha o tipo de movimento e adicione itens');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                itens: carrinho
            };
            await api.post('/estoque/movimentacoes', payload);
            toast.success('Movimentação realizada com sucesso e estoque atualizado!');
            setCarrinho([]);
            setFormData({ tipo_movimento_id: '', setor_id: '', documento: '', observacao: '' });
        } catch (error) {
            toast.error('Erro ao processar movimentação');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <header>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <ArrowRightLeft className="text-blue-600" /> Movimentação de Farmácia
                </h1>
                <p className="text-gray-500 text-sm">Entradas por NF, saídas para pacientes e transferências entre setores.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Painel de Configuração da Operação */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <h2 className="font-bold text-gray-700 border-b pb-2">Dados da Operação</h2>

                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Tipo de Movimento</label>
                            <select
                                className="w-full p-2 border border-gray-200 rounded-lg mt-1"
                                value={formData.tipo_movimento_id}
                                onChange={e => setFormData({ ...formData, tipo_movimento_id: e.target.value })}
                            >
                                <option value="">Selecione...</option>
                                {tiposMovimento.map(t => (
                                    <option key={t.id} value={t.id}>{t.descricao}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Setor / Origem-Destino</label>
                            <select
                                className="w-full p-2 border border-gray-200 rounded-lg mt-1"
                                value={formData.setor_id}
                                onChange={e => setFormData({ ...formData, setor_id: e.target.value })}
                            >
                                <option value="">Selecione o Setor...</option>
                                {setores.map(s => (
                                    <option key={s.id} value={s.id}>{s.nome}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Documento (NF / Prontuário)</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-200 rounded-lg mt-1"
                                placeholder="Ex: NF 12345 ou PAC-789"
                                value={formData.documento}
                                onChange={e => setFormData({ ...formData, documento: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSalvarMovimentacao}
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? 'Processando...' : <><Save size={20} /> Finalizar Movimentação</>}
                    </button>
                </div>

                {/* Painel de Itens */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-bold text-gray-700">Itens da Movimentação</h2>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <select
                                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full appearance-none bg-gray-50"
                                    onChange={(e) => handleAdicionarAoCarrinho(e.target.value)}
                                    value=""
                                >
                                    <option value="">Buscar Medicamento...</option>
                                    {insumos.map(i => (
                                        <option key={i.id} value={i.id}>{i.nome} ({i.quantidade_atual} un)</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {carrinho.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 group">
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-700">{item.nome}</p>
                                        <p className="text-[10px] text-gray-400 uppercase">Lote: {item.lote}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-bold text-gray-400">QTD:</label>
                                        <input
                                            type="number"
                                            className="w-20 p-1 border border-gray-200 rounded text-center font-mono"
                                            value={item.quantidade}
                                            onChange={(e) => {
                                                const newCarrinho = [...carrinho];
                                                newCarrinho[idx].quantidade = Number(e.target.value);
                                                setCarrinho(newCarrinho);
                                            }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => setCarrinho(carrinho.filter((_, i) => i !== idx))}
                                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            {carrinho.length === 0 && (
                                <div className="py-20 text-center text-gray-300 border-2 border-dashed border-gray-100 rounded-2xl">
                                    Selecione os medicamentos para iniciar a movimentação.
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