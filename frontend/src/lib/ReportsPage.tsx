import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Package, Filter, Calendar } from 'lucide-react';
import { api } from '../../../lib/api';
import ExportButton from '../../../../ExportButton';

const ReportsPage: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/relatorios/bi');
                setData(response.data);
            } catch (error) {
                console.error("Erro ao carregar dados de BI:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8 animate-pulse text-gray-400">Carregando relatórios gerenciais...</div>;

    return (
        <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Relatórios Gerenciais e BI</h1>
                    <p className="text-gray-500 text-sm">Análise de produtividade e consumo de recursos.</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 shadow-sm">
                        <Calendar size={16} />
                        <span>Últimos 30 dias</span>
                    </div>
                    <button className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 shadow-sm">
                        <Filter size={18} />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Relatório de Produtividade */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Users size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-gray-800">Produtividade por Profissional</h2>
                        </div>
                        <ExportButton data={data?.produtividade_equipe || []} filename="produtividade_equipe" />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-xs uppercase tracking-wider text-gray-400 border-b border-gray-50">
                                    <th className="pb-3 font-semibold">Profissional</th>
                                    <th className="pb-3 font-semibold text-center">Atendimentos</th>
                                    <th className="pb-3 font-semibold text-center">T. Médio</th>
                                    <th className="pb-3 font-semibold text-right">Satisfação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data?.produtividade_equipe?.map((p: any, i: number) => (
                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 font-medium text-gray-700">{p.profissional}</td>
                                        <td className="py-4 text-center text-gray-600">{p.atendimentos}</td>
                                        <td className="py-4 text-center text-gray-500">{p.tempo_medio}</td>
                                        <td className="py-4 text-right">
                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                                                {p.satisfacao} ★
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Relatório Curva ABC de Consumo */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <Package size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-gray-800">Curva ABC de Consumo (Insumos)</h2>
                        </div>
                        <ExportButton data={data?.consumo_insumos_abc || []} filename="curva_abc_insumos" />
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                                <span className="block text-[10px] font-bold text-red-400 uppercase">Classe A (70% Custo)</span>
                                <span className="text-xl font-bold text-red-700">Crítico</span>
                            </div>
                            <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                                <span className="block text-[10px] font-bold text-yellow-600 uppercase">Classe B (20% Custo)</span>
                                <span className="text-xl font-bold text-yellow-700">Médio</span>
                            </div>
                            <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                                <span className="block text-[10px] font-bold text-green-600 uppercase">Classe C (10% Custo)</span>
                                <span className="text-xl font-bold text-green-700">Baixo</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {data?.consumo_insumos_abc?.map((item: any) => (
                                <div key={item.id} className="group">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${item.categoria === 'A' ? 'bg-red-500' :
                                                    item.categoria === 'B' ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}></span>
                                            <span className="text-sm font-semibold text-gray-700">{item.nome}</span>
                                        </div>
                                        <span className="text-xs font-mono text-gray-500">
                                            R$ {item.custo_total.toLocaleString('pt-BR')}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ${item.categoria === 'A' ? 'bg-red-500' :
                                                    item.categoria === 'B' ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}
                                            style={{ width: `${item.percentual}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ReportsPage;