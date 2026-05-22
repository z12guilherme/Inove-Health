import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, Loader2, Edit, CheckCircle, Clock, AlertTriangle, Printer } from 'lucide-react';
import { cn } from '../../lib/utils';
import localStorageService from '../../services/localStorageService';
import { TissGuidePrintView } from '../../components/TissGuidePrintView';

interface Atendimento {
    id: string;
    data: string;
    paciente_nome: string;
    convenio_nome: string;
    tipo: string; // CONSULTA, SP_SADT, INTERNAMENTO, URGENCIA
    status: string; // Autorizada, Pendente, Realizado, Faturado, Inativo
    valor_total: number;
    numero_guia?: string;
}

export function GuiasDeAtendimento() {
    const navigate = useNavigate();
    const [guias, setGuias] = useState<Atendimento[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [printingAtd, setPrintingAtd] = useState<any | null>(null);

    const fetchGuias = useCallback(async () => {
        try {
            setLoading(true);
            const atendimentosRaw = localStorageService.getAtendimentos();

            // Mapeia os dados para garantir que o valor total venha da soma dos itens (Dipirona, etc)
            const atendimentosProcessados = atendimentosRaw.map((a: any) => ({
                ...a,
                valor_total: (a.procedimentos || []).reduce((acc: number, p: any) => acc + (p.valor * p.qtd), 0),
                status: a.status_guia || 'Pendente',
                senhaAutorizacao: a.senha_autorizacao
            }));

            setGuias(atendimentosProcessados);
        } catch (error) {
            console.error('Erro ao buscar guias de atendimento:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGuias();
    }, [fetchGuias]);

    const handleAutorizar = async (id: string) => {
        try {
            await new Promise(resolve => setTimeout(resolve, 300));
            const atendimentos = localStorageService.getAtendimentos();
            const aIndex = atendimentos.findIndex(a => a.id === id);
            if (aIndex !== -1) {
                (atendimentos[aIndex] as any).status_guia = 'Autorizada';
                (atendimentos[aIndex] as any).senha_autorizacao = Math.floor(100000 + Math.random() * 900000).toString();
                localStorageService.setAtendimentos(atendimentos);
            }
            fetchGuias();
        } catch (error) {
            console.error('Erro ao autorizar guia', error);
        }
    };

    const filteredGuias = guias.filter(guia =>
        guia.paciente_nome?.toLowerCase().includes(search.toLowerCase()) ||
        guia.convenio_nome?.toLowerCase().includes(search.toLowerCase()) ||
        guia.numero_guia?.toLowerCase().includes(search.toLowerCase()) ||
        guia.id?.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Autorizada': return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 flex items-center gap-1"><CheckCircle size={12} /> Autorizada</span>;
            case 'Pendente': return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 flex items-center gap-1"><Clock size={12} /> Pendente</span>;
            case 'Faturado': return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 flex items-center gap-1"><FileText size={12} /> Faturado</span>;
            default: return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{status}</span>;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Guias de Atendimento</h1>
                    <p className="text-muted-foreground mt-2">Controle de emissão e autorização de guias TISS (Consulta e SADT).</p>
                </div>
                <button onClick={() => navigate('/clinical/exames-procedimentos/new')} className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/25">
                    <Plus className="w-5 h-5" /> Nova Guia
                </button>
            </div>

            <div className="glass rounded-2xl p-4 sm:p-6">
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input type="text" placeholder="Buscar por paciente, guia ou convênio..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/50 border border-slate-200/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm" />
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : filteredGuias.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">Nenhuma guia encontrada</p>
                        <p className="text-sm mt-1">Crie uma nova guia para começar.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border/50 text-muted-foreground text-sm">
                                    <th className="pb-3 font-medium px-4">Nº Guia</th>
                                    <th className="pb-3 font-medium px-4">Data</th>
                                    <th className="pb-3 font-medium px-4">Paciente</th>
                                    <th className="pb-3 font-medium px-4">Convênio / Tipo</th>
                                    <th className="pb-3 font-medium px-4">Status</th>
                                    <th className="pb-3 font-medium px-4 text-right">Valor</th>
                                    <th className="pb-3 font-medium px-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredGuias.map(guia => (
                                    <tr key={guia.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                                        <td className="py-4 px-4 text-sm font-mono">{guia.numero_guia || guia.id}</td>
                                        <td className="py-4 px-4 text-sm">{new Date(guia.data).toLocaleDateString()}</td>
                                        <td className="py-4 px-4 font-medium">{guia.paciente_nome}</td>
                                        <td className="py-4 px-4 text-sm">
                                            <p className="font-semibold">{guia.convenio_nome}</p>
                                            <span className="text-[10px] uppercase text-muted-foreground">{guia.tipo}</span>
                                        </td>
                                        <td className="py-4 px-4">{getStatusBadge(guia.status)}</td>
                                        <td className="py-4 px-4 text-right font-bold">R$ {guia.valor_total.toFixed(2)}</td>
                                        <td className="py-4 px-4 text-right">
                                            {guia.status === 'Pendente' ? (
                                                <button onClick={() => handleAutorizar(guia.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1 ml-auto">
                                                    <AlertTriangle size={12} /> Solicitar Autorização
                                                </button>
                                            ) : (
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => setPrintingAtd(guia)} 
                                                        className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                                        title="Imprimir Guia TISS"
                                                    >
                                                        <Printer className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => navigate(`/clinical/exames-procedimentos/${guia.id}`)} className="p-1 text-muted-foreground hover:text-primary transition-colors">
                                                        <Edit className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {printingAtd && (
                <TissGuidePrintView atendimento={printingAtd} onClose={() => setPrintingAtd(null)} />
            )}
        </div>
    );
}