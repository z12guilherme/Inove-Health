import React, { useState, useEffect, useCallback } from 'react';
import {
    ArrowLeft,
    Save,
    Search,
    Plus,
    Trash2,
    FileText,
    ShieldCheck,
    User,
    Microscope,
    Clock,
    Calendar,
    ExternalLink,
    History,
    Loader2,
    MoreHorizontal
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import localStorageService from '../../services/localStorageService';
import toast from 'react-hot-toast';

export function ExamesProcedimentos() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<any>({
        data_cadastro: '',
        hora_cadastro: '',
        categoria: 'Particular',
        convenio_nome: '',
        guia_principal: '',
        numero_autorizacao: '',
        guia_operadora: '',
        data_emissao: '',
        data_vencimento: '',
        autorizador: '',
        senha: '',
        prontuario: '',
        paciente_nome: '',
        carteira: '',
        validade_carteira: '',
        tipo_atendimento: 'Exames',
        setor: 'LABORATÓRIO',
        acomodacao: '',
        leito: '',
        profissional_executante: '',
        data_solicitacao: '',
        hora_solicitacao: '',
        contratado_solicitante: 'Hospital',
        profissional_solicitante: '',
        especialidade_solicitante: '',
        indicacao_clinica: '',
        observacoes: '',
        motivo_encerramento: ''
    });

    const [itens, setItens] = useState<any[]>([]);

    const loadData = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const atendimentos = localStorageService.getAtendimentos();
            const atd = atendimentos.find((a: any) => a.id === id);

            if (atd) {
                setFormData({
                    data_cadastro: atd.data || '',
                    hora_cadastro: atd.hora || '',
                    categoria: atd.categoria || 'Particular',
                    convenio_nome: atd.categoria === 'Convênio' ? (atd.convenio_nome || 'CONVÊNIO') : atd.categoria,
                    guia_principal: atd.dados_autorizacao?.guia_principal || '',
                    numero_autorizacao: atd.dados_autorizacao?.autorizacao || '',
                    guia_operadora: atd.dados_autorizacao?.guia_operadora || '',
                    data_emissao: atd.dados_autorizacao?.data_emissao || atd.data || '',
                    data_vencimento: atd.dados_autorizacao?.data_vencimento || '',
                    autorizador: atd.dados_autorizacao?.autorizador || '',
                    senha: atd.dados_autorizacao?.senha || '',
                    prontuario: atd.paciente_prontuario || '',
                    paciente_nome: atd.paciente_nome || '',
                    carteira: atd.dados_autorizacao?.carteira || '',
                    validade_carteira: atd.dados_autorizacao?.validade_carteira || '',
                    tipo_atendimento: atd.tipo || 'Exames',
                    setor: atd.dados_atendimento?.setor || 'LABORATÓRIO',
                    acomodacao: atd.dados_atendimento?.acomodacao || '',
                    leito: atd.dados_atendimento?.leito || '',
                    profissional_executante: atd.dados_atendimento?.profissional_executante || '',
                    data_solicitacao: atd.dados_solicitacao?.data || '',
                    hora_solicitacao: atd.dados_solicitacao?.hora || '',
                    contratado_solicitante: atd.dados_solicitacao?.contratado || 'Hospital',
                    profissional_solicitante: atd.dados_solicitacao?.profissional || '',
                    especialidade_solicitante: atd.dados_solicitacao?.especialidade || '',
                    indicacao_clinica: atd.dados_solicitacao?.indicacao || '',
                    observacoes: atd.observacoes || '',
                    motivo_encerramento: ''
                });
                setItens(atd.procedimentos || []);
            }
        } catch (error) {
            toast.error('Erro ao carregar dados da guia.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSave = async () => {
        setLoading(true);
        try {
            // Update attendance via service
            const updatedAtd = { id, ...formData, procedimentos: itens };
            localStorageService.updateAtendimento(updatedAtd);
            toast.success('Guia salva com sucesso!');
        } catch (error) {
            toast.error('Erro ao persistir dados localmente.');
        } finally {
            setLoading(false);
        }
    };

    const totalGeral = itens.reduce((acc, item) => acc + (item.valor * item.qtd), 0);

    return (
        <div className="space-y-6 pb-24 animate-in fade-in duration-500">
            {/* Top Header Barra */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-blue-600 transition-all">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-gray-800 uppercase tracking-tighter">Editar Exames/Procedimentos</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">{formData.convenio_nome}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Guia: {formData.numero_autorizacao}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="px-6 py-2.5 rounded-xl border border-gray-100 text-gray-400 font-bold text-xs uppercase hover:bg-gray-50">Histórico</button>
                    <button onClick={handleSave} disabled={loading} className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase shadow-lg shadow-blue-100 flex items-center gap-2 disabled:opacity-50">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar Alterações
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Coluna da Esquerda: Dados Principais */}
                <div className="xl:col-span-2 space-y-6">

                    {/* Bloco 1: Identificação e Cabeçalho */}
                    <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                        <div className="flex justify-between items-center">
                            <div className="flex gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Data</label>
                                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-transparent focus-within:bg-white focus-within:border-blue-100 transition-all">
                                        <Calendar size={14} className="text-blue-500" />
                                        <input type="date" value={formData.data_cadastro} onChange={e => setFormData({ ...formData, data_cadastro: e.target.value })} className="bg-transparent font-bold text-gray-700 outline-none text-sm" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Hora</label>
                                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-transparent">
                                        <Clock size={14} className="text-blue-500" />
                                        <input type="text" value={formData.hora_cadastro} onChange={e => setFormData({ ...formData, hora_cadastro: e.target.value })} className="bg-transparent font-bold text-gray-700 outline-none text-sm w-16" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <label className="text-[10px] font-black text-gray-400 uppercase mr-1 mb-1">Categoria</label>
                                <div className="flex bg-gray-100 p-1 rounded-xl">
                                    {['SUS', 'Particular', 'Convênio'].map(c => (
                                        <button key={c} onClick={() => setFormData({ ...formData, categoria: c })} className={cn("px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all", formData.categoria === c ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{c}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Bloco 2: Autorização e Senha (TISS DadosAutorizacao) */}
                    <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <ShieldCheck size={16} className="text-emerald-500" /> Dados da Autorização
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nº Autorização</label>
                                <input type="text" value={formData.numero_autorizacao} onChange={e => setFormData({ ...formData, numero_autorizacao: e.target.value })} className="w-full p-3 bg-gray-50 border-none rounded-2xl font-bold text-gray-700" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Guia Operadora</label>
                                <input type="text" value={formData.guia_operadora} onChange={e => setFormData({ ...formData, guia_operadora: e.target.value })} className="w-full p-3 bg-gray-50 border-none rounded-2xl font-bold text-gray-700" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Senha</label>
                                <div className="relative">
                                    <input type="text" value={formData.senha} onChange={e => setFormData({ ...formData, senha: e.target.value })} className="w-full p-3 bg-blue-50/50 border-2 border-blue-100 rounded-2xl font-black text-blue-600 text-center uppercase tracking-widest" />
                                    <ExternalLink size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Bloco 3: Procedimentos e Exames (TISS procedimentosExecutados) */}
                    <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Microscope size={16} className="text-purple-500" /> Procedimentos e Exames
                            </h3>
                            <button className="p-2 bg-gray-50 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors">
                                <Plus size={20} />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-50">
                                        <th className="pb-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">Procedimento</th>
                                        <th className="pb-4 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Qtd.</th>
                                        <th className="pb-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">Executante</th>
                                        <th className="pb-4 text-[10px] font-black text-gray-300 uppercase tracking-widest text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {itens.map((item, i) => (
                                        <tr key={i} className="group hover:bg-gray-50/50 transition-all">
                                            <td className="py-4">
                                                <p className="text-[11px] font-black text-gray-400 font-mono">{item.codigo}</p>
                                                <p className="text-xs font-bold text-gray-700 uppercase leading-tight max-w-xs">{item.nome}</p>
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className="text-xs font-black text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">{item.qtd.toFixed(2)}</span>
                                            </td>
                                            <td className="py-4">
                                                <p className="text-[10px] font-bold text-gray-500">{item.profissional}</p>
                                                <p className="text-[9px] text-gray-400 uppercase">{item.especialidade}</p>
                                            </td>
                                            <td className="py-4 text-right">
                                                <p className="text-sm font-black text-gray-800">R$ {item.valor.toFixed(2)}</p>
                                                <button className="opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} className="text-red-300 hover:text-red-500" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Total da Guia SADT</p>
                            <p className="text-2xl font-black text-blue-600 tracking-tighter">R$ {totalGeral.toFixed(2)}</p>
                        </div>
                    </section>
                </div>

                {/* Coluna da Direita: Beneficiário e Solicitação */}
                <div className="space-y-6">

                    {/* Beneficiário */}
                    <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <User size={16} className="text-blue-500" /> Beneficiário
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Paciente</p>
                                <p className="text-sm font-black text-gray-800 leading-tight">{formData.paciente_nome}</p>
                                <p className="text-[10px] font-bold text-blue-500 mt-1 uppercase">Prontuário: {formData.prontuario}</p>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nº Carteira</label>
                                    <input type="text" value={formData.carteira} onChange={e => setFormData({ ...formData, carteira: e.target.value })} className="w-full p-3 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Validade</label>
                                    <input type="date" value={formData.validade_carteira} onChange={e => setFormData({ ...formData, validade_carteira: e.target.value })} className="w-full p-3 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 text-sm" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Atendimento Detalhes */}
                    <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <FileText size={16} className="text-orange-500" /> Atendimento
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Setor</label>
                                <select value={formData.setor} onChange={e => setFormData({ ...formData, setor: e.target.value })} className="w-full p-3 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 text-sm appearance-none outline-none">
                                    <option>LABORATÓRIO</option>
                                    <option>IMAGEM</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Profissional Executante</label>
                                <input type="text" value={formData.profissional_executante} onChange={e => setFormData({ ...formData, profissional_executante: e.target.value })} className="w-full p-3 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 text-sm" />
                            </div>
                        </div>
                    </section>

                    {/* Solicitação (TISS dadosSolicitante) */}
                    <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <History size={16} className="text-indigo-500" /> Dados da Solicitação
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Data Solic.</label>
                                    <input type="date" value={formData.data_solicitacao} onChange={e => setFormData({ ...formData, data_solicitacao: e.target.value })} className="w-full p-2 bg-gray-50 border-none rounded-xl font-bold text-gray-700 text-xs" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Hora Solic.</label>
                                    <input type="text" value={formData.hora_solicitacao} onChange={e => setFormData({ ...formData, hora_solicitacao: e.target.value })} className="w-full p-2 bg-gray-50 border-none rounded-xl font-bold text-gray-700 text-xs" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Médico Solicitante</label>
                                <input type="text" value={formData.profissional_solicitante} onChange={e => setFormData({ ...formData, profissional_solicitante: e.target.value })} className="w-full p-3 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 text-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Observações</label>
                                <textarea rows={3} value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} className="w-full p-3 bg-gray-50 border-none rounded-2xl text-xs text-gray-500 outline-none" placeholder="Notas clínicas..." />
                            </div>
                        </div>
                    </section>

                    {/* Footer Info Mocks */}
                    <div className="p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                            <Plus size={10} /> Criado por Sára Morais em 02/10/2025
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                            <History size={10} /> Editado por Juliete Santos em 03/10/2025
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Action Bar */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white p-2 rounded-3xl shadow-2xl flex items-center gap-2 border border-white/10 backdrop-blur-xl">
                <button onClick={() => navigate(-1)} className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-white/10 transition-all flex items-center gap-2">
                    <ArrowLeft size={16} /> Voltar para listagem
                </button>
                <div className="w-[1px] h-6 bg-white/10 mx-2" />
                <button onClick={() => toast.success('Gerando XML TISS 4.01.00...')} className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-white/10 transition-all flex items-center gap-2 text-blue-400">
                    <FileText size={16} /> Exportar XML
                </button>
                <button onClick={handleSave} disabled={loading} className="px-8 py-3 bg-blue-600 rounded-2xl text-[10px] font-black uppercase hover:bg-blue-500 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50">
                    <Save size={16} /> Salvar Tudo
                </button>
            </div>
        </div>
    );
}