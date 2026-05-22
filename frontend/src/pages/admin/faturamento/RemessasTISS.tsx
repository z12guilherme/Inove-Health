import React, { useState, useEffect } from 'react';
import { Download, Plus, CheckCircle, FileText, Search, Loader2, Trash2 } from 'lucide-react';
import localStorageService from '../../../services/localStorageService';
import type { LoteTiss } from '../../../services/localStorageService';
import { generateTissXml } from '../../../services/tissXmlGenerator';
import { tissValidator } from '../../../services/tissValidator';
import toast from 'react-hot-toast';

export function RemessasTiss() {
    const [lotes, setLotes] = useState<LoteTiss[]>([]);
    const [atendimentos, setAtendimentos] = useState<any[]>([]);
    const [convenios, setConvenios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'nova' | 'enviados'>('nova');
    const [errosValidacao, setErrosValidacao] = useState<string[]>([]);

    // Filtros Nova Remessa
    const [filtroConvenio, setFiltroConvenio] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await new Promise(r => setTimeout(r, 400));
            setLotes(localStorageService.getLotesTiss());
            setAtendimentos(localStorageService.getAtendimentos());
            setConvenios(localStorageService.getConvenios());
            setLoading(false);
        };
        loadData();
    }, []);

    // Identifica quais atendimentos já estão em algum lote
    const atendimentosEmLotes = new Set(lotes.flatMap(l => l.atendimentos_ids));

    // Filtra atendimentos disponíveis para faturar
    const atendimentosDisponiveis = atendimentos.filter(a => {
        // Precisa ter convênio, não ser particular e não estar em lote
        if (!a.convenio_id || a.convenio_nome === 'PARTICULAR' || atendimentosEmLotes.has(a.id)) return false;
        // Status deve ser finalizado ou autorizada
        if (a.status !== 'FINALIZADO' && (a as any).status_guia !== 'Autorizada') return false;

        if (filtroConvenio && a.convenio_id !== filtroConvenio) return false;

        const tipoMapeado = a.tipo === 'CONSULTA' ? 'CONSULTA' : 'SADT';
        if (filtroTipo && tipoMapeado !== filtroTipo) return false;

        return true;
    });

    const handleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === atendimentosDisponiveis.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(atendimentosDisponiveis.map(a => a.id)));
        }
    };

    const handleGerarLote = () => {
        if (selectedIds.size === 0) return toast.error('Selecione ao menos um atendimento.');
        if (!filtroConvenio || !filtroTipo) return toast.error('Selecione Convênio e Tipo de Guia primeiro.');

        const selectedAtendimentos = atendimentos.filter(a => selectedIds.has(a.id));
        const convenioNome = convenios.find(c => c.id === filtroConvenio)?.nome || '';

        const newLote: LoteTiss = {
            id: `LOTE-${Date.now()}`,
            numero_lote: `${Math.floor(1000 + Math.random() * 9000)}`,
            convenio_id: filtroConvenio,
            convenio_nome: convenioNome,
            tipo_guia: filtroTipo,
            data_criacao: new Date().toISOString(),
            atendimentos_ids: Array.from(selectedIds),
            status: 'GERADO',
        };

        const xmlString = generateTissXml(newLote, selectedAtendimentos);

        // --- Validação Estrutural e de Regras de Negócio TISS ---
        const validation = tissValidator.validateXML(xmlString);
        if (!validation.valido) {
            setErrosValidacao(validation.erros);
            toast.error('O Lote falhou na validação TISS. Verifique os erros no painel.', { duration: 5000 });
            return;
        }

        setErrosValidacao([]);
        newLote.xml_gerado = xmlString;

        localStorageService.updateLoteTiss(newLote);
        setLotes([...lotes, newLote]);
        setSelectedIds(new Set());
        toast.success('Lote validado e XML gerado com sucesso!');
        setActiveTab('enviados');
    };

    const handleDownloadXml = (lote: LoteTiss) => {
        if (!lote.xml_gerado) return toast.error('XML não encontrado.');
        const blob = new Blob([lote.xml_gerado], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LOTE_TISS_${lote.numero_lote}_${lote.convenio_nome}.xml`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleFecharLote = (lote: LoteTiss) => {
        const protocolo = prompt('Digite o número do protocolo de recebimento da operadora:');
        if (!protocolo) return;

        const updatedLote = { ...lote, status: 'LOTE_FECHADO' as const, protocolo_operadora: protocolo };
        localStorageService.updateLoteTiss(updatedLote);
        setLotes(lotes.map(l => l.id === lote.id ? updatedLote : l));

        // Atualiza status_guia dos atendimentos
        const atendimentosAtualizados = localStorageService.getAtendimentos().map(a => {
            if (lote.atendimentos_ids.includes(a.id)) {
                return { ...a, status_guia: 'LOTE_FECHADO' };
            }
            return a;
        });
        localStorageService.setAtendimentos(atendimentosAtualizados);

        toast.success('Lote fechado com sucesso!');
    };

    const handleGerarGuiasMock = () => {
        const atds = localStorageService.getAtendimentos();
        const convs = localStorageService.getConvenios();
        if (convs.length === 0) return toast.error('Crie um convênio primeiro.');
        
        const unimed = convs.find(c => c.nome.toUpperCase().includes('UNIMED')) || convs[0];
        
        const mock1 = {
            id: `ATD-MOCK-${Date.now()}-1`,
            data: new Date().toISOString(),
            paciente_nome: 'PACIENTE MOCK CONSULTA',
            convenio_id: unimed.id,
            convenio_nome: unimed.nome,
            tipo: 'CONSULTA',
            status: 'FINALIZADO',
            status_guia: 'Autorizada',
            senha_autorizacao: '123456',
            numero_guia: `G-${Math.floor(Math.random() * 999999)}`,
            valor_total: 100.00,
            procedimentos: [{ codigo: '10101012', nome: 'CONSULTA EM CONSULTORIO', valor: 100.00, qtd: 1 }]
        };

        const mock2 = {
            id: `ATD-MOCK-${Date.now()}-2`,
            data: new Date().toISOString(),
            paciente_nome: 'PACIENTE MOCK EXAME',
            convenio_id: unimed.id,
            convenio_nome: unimed.nome,
            tipo: 'SADT',
            status: 'FINALIZADO',
            status_guia: 'Autorizada',
            senha_autorizacao: '654321',
            numero_guia: `G-${Math.floor(Math.random() * 999999)}`,
            valor_total: 250.00,
            procedimentos: [{ codigo: '40805018', nome: 'RAIO X DE TORAX', valor: 250.00, qtd: 1 }]
        };

        localStorageService.setAtendimentos([...atds, mock1 as any, mock2 as any]);
        setAtendimentos(localStorageService.getAtendimentos());
        toast.success('Foram criadas 2 Guias Autorizadas (Consulta e SADT)! Agora você pode gerar o lote.');
    };

    const handleLimparLotes = () => {
        if (confirm('Tem certeza que deseja excluir todos os lotes gerados? Isso não pode ser desfeito.')) {
            localStorageService.setLotesTiss([]);
            setLotes([]);
            toast.success('Todos os lotes foram excluídos.');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Remessas e XML TISS</h1>
                    <p className="text-muted-foreground mt-2">Agrupamento de guias e geração de lotes padrão TISS 4.01.00.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleLimparLotes}
                        className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-600 transition-colors"
                    >
                        <Trash2 size={16} /> Excluir Lotes
                    </button>
                    <button 
                        onClick={handleGerarGuiasMock}
                        className="bg-secondary text-secondary-foreground px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-secondary/80"
                    >
                        <Plus size={16} /> Forçar Guias Autorizadas (Teste)
                    </button>
                </div>
            </div>

            <div className="flex border-b border-border">
                <button
                    className={`px-6 py-3 font-semibold text-sm transition-colors ${activeTab === 'nova' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setActiveTab('nova')}
                >
                    Nova Remessa
                </button>
                <button
                    className={`px-6 py-3 font-semibold text-sm transition-colors ${activeTab === 'enviados' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setActiveTab('enviados')}
                >
                    Lotes Enviados
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : activeTab === 'nova' ? (
                <div className="space-y-6">
                    <div className="glass p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Convênio</label>
                            <select className="input-field py-3" value={filtroConvenio} onChange={(e) => setFiltroConvenio(e.target.value)}>
                                <option value="">Selecione o convênio...</option>
                                {convenios.map(c => (
                                    <option key={c.id} value={c.id}>{c.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">Tipo de Guia (Filtro Obrigatório)</label>
                            <select className="input-field py-3" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                                <option value="">Selecione o tipo...</option>
                                <option value="CONSULTA">Guias de Consulta</option>
                                <option value="SADT">Guias de SP/SADT (Exames/Procedimentos)</option>
                            </select>
                        </div>
                    </div>

                    {!filtroConvenio || !filtroTipo ? (
                        <div className="text-center py-20 text-muted-foreground bg-secondary/10 rounded-2xl border border-dashed border-border">
                            <Search className="w-10 h-10 mx-auto mb-4 opacity-30" />
                            <p className="font-semibold">Selecione Convênio e Tipo de Guia para listar as guias pendentes.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {errosValidacao.length > 0 && (
                                <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl">
                                    <h4 className="text-red-500 font-bold flex items-center gap-2 mb-3">
                                        <FileText className="w-5 h-5" />
                                        Erros de Validação do Esquema TISS
                                    </h4>
                                    <ul className="list-disc pl-5 space-y-1 text-sm text-red-500/90 font-medium">
                                        {errosValidacao.map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div className="glass rounded-2xl p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-lg">Guias Elegíveis ({atendimentosDisponiveis.length})</h3>
                                    <button
                                        onClick={handleGerarLote}
                                        disabled={selectedIds.size === 0}
                                        className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                                    >
                                        <Plus size={18} /> Gerar Lote e XML
                                    </button>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-border/50">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-secondary/50">
                                            <tr>
                                                <th className="p-4 w-12">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded text-primary focus:ring-primary"
                                                        checked={selectedIds.size > 0 && selectedIds.size === atendimentosDisponiveis.length}
                                                        onChange={handleSelectAll}
                                                    />
                                                </th>
                                                <th className="p-4 font-semibold text-muted-foreground">Nº Guia</th>
                                                <th className="p-4 font-semibold text-muted-foreground">Data</th>
                                                <th className="p-4 font-semibold text-muted-foreground">Paciente</th>
                                                <th className="p-4 font-semibold text-muted-foreground">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50 bg-background/50">
                                            {atendimentosDisponiveis.map(atd => (
                                                <tr key={atd.id} className="hover:bg-secondary/20 transition-colors">
                                                    <td className="p-4">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded text-primary focus:ring-primary"
                                                            checked={selectedIds.has(atd.id)}
                                                            onChange={() => handleSelect(atd.id)}
                                                        />
                                                    </td>
                                                    <td className="p-4 font-mono font-medium text-primary">{atd.numero_guia || atd.id}</td>
                                                    <td className="p-4">{new Date(atd.data).toLocaleDateString()}</td>
                                                    <td className="p-4 font-semibold">{atd.paciente_nome}</td>
                                                    <td className="p-4">
                                                        <span className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full text-[10px] font-bold uppercase">
                                                            {(atd as any).status_guia || 'FINALIZADO'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {atendimentosDisponiveis.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhuma guia pronta para faturamento neste filtro.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div> // Fim da lista de guias elegíveis
                    )}
                </div>
            ) : ( // Aba de Lotes Enviados
                <div className="glass rounded-2xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {lotes.slice().reverse().map(lote => (
                            <div key={lote.id} className="p-5 rounded-2xl border border-border bg-background/50 flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-black text-lg">Lote #{lote.numero_lote}</h4>
                                        <p className="text-xs font-semibold text-muted-foreground">{lote.convenio_nome}</p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${lote.status === 'LOTE_FECHADO' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                        {lote.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="text-sm">
                                    <p><span className="text-muted-foreground">Tipo:</span> <strong>{lote.tipo_guia}</strong></p>
                                    <p><span className="text-muted-foreground">Guias:</span> <strong>{lote.atendimentos_ids.length} atendimentos</strong></p>
                                    <p><span className="text-muted-foreground">Gerado em:</span> <strong>{new Date(lote.data_criacao).toLocaleDateString()}</strong></p>
                                </div>

                                {lote.protocolo_operadora && (
                                    <div className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                                        <p className="text-[10px] font-bold uppercase text-primary mb-1 tracking-widest">Protocolo Recebimento</p>
                                        <p className="font-mono text-sm font-black">{lote.protocolo_operadora}</p>
                                    </div>
                                )}

                                <div className="mt-auto flex gap-2 pt-4">
                                    <button
                                        onClick={() => handleDownloadXml(lote)}
                                        className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs py-2 rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Download size={14} /> XML TISS
                                    </button>
                                    {lote.status === 'GERADO' && (
                                        <button
                                            onClick={() => handleFecharLote(lote)}
                                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs py-2 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                                        >
                                            <CheckCircle size={14} /> Fechar Lote
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {lotes.length === 0 && (
                            <div className="col-span-full py-20 text-center text-muted-foreground">
                                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p className="font-medium">Nenhum lote enviado ainda.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
