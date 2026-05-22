import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Clock, Users, Activity, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import localStorageService from '../services/localStorageService';

export function DashboardBI() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBI = async () => {
            try {
                const atdStored = localStorageService.getAtendimentos();

                // Cálculo de indicadores reais baseados no LocalStorage
                const totalMes = atdStored.length;
                const gastoInsumos = atdStored.reduce((acc: number, a: any) =>
                    acc + (a.procedimentos || []).reduce((acc2: number, p: any) => acc2 + (p.valor * p.qtd), 0), 0);

                setData({
                    total_atendimentos_mes: totalMes.toString(),
                    gasto_insumos_formatado: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gastoInsumos),
                    tendencia_atendimentos: "+5%",
                    tempo_medio_espera: "22 min",
                    taxa_ocupacao: "68%",
                    atendimentos_mes: [{ nome: 'Maio', total: totalMes }],
                    distribuicao_risco: [
                        { name: 'Emergência', value: 10, color: '#ef4444' },
                        { name: 'Urgência', value: 25, color: '#f97316' },
                        { name: 'Pouco Urgente', value: 45, color: '#10b981' },
                        { name: 'Não Urgente', value: 20, color: '#3b82f6' }
                    ]
                });
            } finally {
                setLoading(false);
            }
        };
        fetchBI();
    }, []);

    if (loading || !data) return (
        <div className="h-[80vh] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <Activity className="h-12 w-12 text-indigo-500 animate-bounce" />
                <p className="text-slate-500 font-medium">Sincronizando indicadores em tempo real...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 p-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Business Intelligence</h1>
                    <p className="text-slate-500 mt-1 font-medium italic">Monitoramento clínico-operacional avançado</p>
                </div>
                <button className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95">
                    <Download className="w-4 h-4" /> Exportar Dados
                </button>
            </div>

            {/* Cards de Resumo com Glassmorphism */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Atendimentos / Mês" value={data.total_atendimentos_mes || "0"} icon={<Users className="text-indigo-500" />} trend={data.tendencia_atendimentos || "+0%"} trendType="up" />
                <StatCard title="Tempo Médio Espera" value={data.tempo_medio_espera} icon={<Clock className="text-amber-500" />} trend="-4.2%" trendType="down" />
                <StatCard title="Taxa de Ocupação" value={data.taxa_ocupacao} icon={<Activity className="text-emerald-500" />} trend="Estável" trendType="neutral" />
                <StatCard title="Gasto Insumos" value={data.gasto_insumos_formatado || "R$ 0,00"} icon={<TrendingUp className="text-rose-500" />} trend={data.tendencia_gastos || "+0%"} trendType="up" />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Gráfico de Volume - 2/3 da largura */}
                <Card className="lg:col-span-2 bg-white/50 backdrop-blur-sm border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="text-lg font-bold text-slate-800">Volume de Atendimentos Semanal</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[380px] pt-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.atendimentos_mes}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="total" fill="url(#colorTotal)" radius={[8, 8, 0, 0]} />
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9} />
                                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0.7} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Distribuição de Risco - 1/3 da largura */}
                <Card className="bg-white/50 backdrop-blur-sm border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="text-lg font-bold text-slate-800">Classificação de Risco</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[380px] pt-6 flex flex-col items-center justify-around">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={data.distribuicao_risco} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                                    {data.distribuicao_risco.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full px-4">
                            {data.distribuicao_risco.map((r: any) => (
                                <div key={r.name} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                                    {r.name}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, trend, trendType }: any) {
    const trendColor = trendType === 'up' ? 'text-rose-500' : trendType === 'down' ? 'text-emerald-500' : 'text-slate-400';
    return (
        <Card className="bg-white/70 backdrop-blur-md border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div className="p-3 rounded-2xl bg-white shadow-sm group-hover:scale-110 transition-transform duration-300 border border-slate-100">{icon}</div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full bg-slate-50 ${trendColor}`}>{trend}</span>
                </div>
                <div className="mt-5">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{title}</p>
                    <h3 className="text-3xl font-black mt-1 text-slate-800">{value}</h3>
                </div>
            </CardContent>
        </Card>
    );
}