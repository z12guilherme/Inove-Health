import React, { useState, useEffect, useCallback } from 'react';
import {
  Building,
  Save,
  ArrowLeft,
  Globe,
  Phone,
  User,
  CreditCard,
  Settings,
  ShieldCheck,
  Table as TableIcon,
  Percent,
  Plus,
  Trash2,
  Image as ImageIcon,
  FileText,
  MapPin,
  Search,
  Loader2,
  ChevronRight,
  LayoutGrid,
  List as ListIcon,
  Activity
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

interface Convenio {
  id: string;
  nome: string;
  registro_ans: string;
  cnpj: string;
  situacao: string;
  razao_social?: string;
}

export function Convenios() {
  const navigate = useNavigate();
  const [view, setView] = useState<'LIST' | 'FORM'>('LIST');
  const [loading, setLoading] = useState(false);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [search, setSearch] = useState('');
  const [tabelasDisponiveis, setTabelasDisponiveis] = useState<any[]>([]);

  const [formData, setFormData] = useState<any>({
    nome: '',
    registro_ans: '',
    cnpj: '',
    razao_social: '',
    grupo: 'Portal do convênio',
    situacao: 'Ativo',
    // Endereço
    cep: '60150-160',
    tipo_logradouro: 'AVENIDA',
    logradouro: 'Avenida Santos Dumont',
    numero: '782',
    municipio: 'Fortaleza',
    estado: 'Ceará',
    bairro: 'Centro',
    complemento: 'até 978/979',
    // Contato
    telefone: '(85) 4004-2323',
    pessoa_contato: '',
    telefone_contato: '',
    // Faturamento
    numero_guia_inicial: '',
    ultimo_numero_guia: '36',
    tiss_versao: '4.01.00',
    codigo_ciha: 'Convênio Plano Privado',
    dias_retorno: 30,
    digitos_matricula: 16,
    acrescimo_apartamento: 100,
    valor_filme: 0,
    deflator_porte: 0,
    valor_ch: 0,
    valor_uco: 0,
    deflator_uco: 0,
    ajuste_simpro: -30,
    // Checkboxes Config
    utiliza_abramge: false,
    utiliza_planserv: false,
    lote_como_nome_arquivo: true,
    gerar_consulta_sadt: true,
    // Obrigatórios
    req_guia_principal: true,
    req_guia_autorizacao: true,
    req_guia_operadora: true,
    req_senha: true,
    req_setor: true,
    req_hipotese: true,
    req_cns: false,
    req_cep: false,
  });

  const [viasAcesso, setViasAcesso] = useState([
    { descricao: 'Única', percentual: 100 },
    { descricao: 'Mesma via', percentual: 50 },
    { descricao: 'Diferentes vias', percentual: 30 },
  ]);

  const [tabelasVinculadas, setTabelasVinculadas] = useState([
    { id: '1', nome: 'DIÁRIAS, TAXAS E GASES', faixas: '' },
    { id: '2', nome: 'PROCEDIMENTOS AMBULATORIAIS', faixas: '' },
    { id: '3', nome: 'PROCEDIMENTOS GERAIS', faixas: '' },
    { id: '4', nome: 'MEDICAMENTOS RESTRITO HOSPITALAR', faixas: '' },
  ]);

  const fetchConvenios = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/cadastros/convenios');
      setConvenios(res.data.convenios || []);
      const resTabs = await api.get('/faturamento/tabelas');
      setTabelasDisponiveis(resTabs.data.tabelas || []);
    } catch (err) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConvenios();
  }, [fetchConvenios]);

  const handleEdit = (c: any) => {
    setFormData({
      ...c,
      // Se os dados vierem aninhados do mock/banco, espalhamos aqui
      ...(c.financeiro || { ajuste_simpro: -30 }),
      ...(c.obrigatorios_atendimento || {}),
      ajuste_simpro: c.financeiro?.ajuste_simpro ?? -30
    });
    setTabelasVinculadas(c.tabelas_vinculadas || []);
    setViasAcesso(c.vias_acesso || []);
    setView('FORM');
  };

  const handleNew = () => {
    setFormData({
      id: null,
      nome: '', registro_ans: '', cnpj: '', razao_social: '',
      grupo: 'Portal do convênio', situacao: 'Ativo',
      cep: '60150-160', tipo_logradouro: 'AVENIDA', logradouro: '', numero: '', municipio: '', estado: '', bairro: '', complemento: '',
      telefone: '', pessoa_contato: '', telefone_contato: '',
      tiss_versao: '4.01.00', dias_retorno: 30, digitos_matricula: 16, acrescimo_apartamento: 100,
      valor_ch: 0, valor_uco: 0, deflator_porte: 0,
      req_guia_principal: true, req_guia_autorizacao: true, req_guia_operadora: true, req_senha: true, req_setor: true, req_hipotese: true,
      ajuste_simpro: 0,
    });
    setTabelasVinculadas([]);
    setViasAcesso([
      { descricao: 'Única', percentual: 100 },
      { descricao: 'Mesma via', percentual: 50 },
      { descricao: 'Diferentes vias', percentual: 30 },
    ]);
    setView('FORM');
  };

  const filteredConvenios = convenios.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.cnpj.includes(search) ||
    c.registro_ans.includes(search)
  );

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        vias_acesso: viasAcesso,
        tabelas_vinculadas: tabelasVinculadas
      };
      await api.post('/cadastros/convenios', payload);
      toast.success(formData.id ? 'Alterações salvas!' : 'Convênio cadastrado!');
      setView('LIST');
      fetchConvenios();
    } catch (error) {
      toast.error('Erro ao salvar convênio');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTabelaVinculo = (tabelaId: string) => {
    const tabelaObj = tabelasDisponiveis.find(t => t.id === tabelaId);
    if (!tabelaObj) return;
    if (tabelasVinculadas.find(t => t.id === tabelaId)) {
      return toast.error('Esta tabela já está vinculada.');
    }
    setTabelasVinculadas(prev => [...prev, { id: tabelaObj.id, nome: tabelaObj.nome, faixas: '' }]);
  };

  const handleRemoveTabelaVinculo = (id: string) => {
    setTabelasVinculadas(prev => prev.filter(t => t.id !== id));
  };

  if (view === 'LIST') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900">Operadoras e Convênios</h1>
            <p className="text-slate-500 mt-2 font-medium">Gestão de credenciamento, regras de faturamento e tabelas TISS/TUSS.</p>
          </div>
          <button onClick={handleNew} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-200">
            <Plus className="w-6 h-6 stroke-[3]" /> Novo Convênio
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Building size={24} /></div>
            <div><p className="text-2xl font-black text-gray-800">{convenios.length}</p><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total de Operadoras</p></div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><ShieldCheck size={24} /></div>
            <div><p className="text-2xl font-black text-gray-800">{convenios.filter(c => c.situacao !== 'Inativo').length}</p><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Convênios Ativos</p></div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl"><Activity size={24} /></div>
            <div><p className="text-2xl font-black text-gray-800">12.4k</p><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Atendimentos/Mês</p></div>
          </div>
        </div>

        <div className="bg-white/40 backdrop-blur-xl border border-white rounded-[40px] p-8 shadow-2xl shadow-slate-200/50">
          <div className="relative mb-8">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300" />
            <input
              type="text"
              placeholder="Buscar por nome, ANS ou CNPJ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-16 pl-14 pr-6 rounded-[24px] bg-white border-none focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-inner text-lg font-medium placeholder:text-slate-300"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredConvenios.map(c => (
                <div
                  key={c.id}
                  onClick={() => handleEdit(c)}
                  className="group bg-white border border-gray-100 rounded-[32px] p-6 hover:shadow-2xl hover:border-blue-200 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                      <Building size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-gray-800 uppercase tracking-tight group-hover:text-blue-700 transition-colors">{c.nome}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ANS: {c.registro_ans}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                    <span className={cn("text-[10px] font-black uppercase px-3 py-1 rounded-full", c.situacao === 'Inativo' ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600")}>{c.situacao || 'Ativo'}</span>
                    <ChevronRight className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" size={20} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header Profissional */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
            <Building size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">{formData.id ? 'Editar' : 'Novo'} Convênio</h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{formData.nome || 'Novo Cadastro'} {formData.registro_ans && `• ANS: ${formData.registro_ans}`}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setView('LIST')} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold text-xs uppercase hover:bg-gray-50 transition-all">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={loading} className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2">
            {loading ? 'Salvando...' : <><Save size={16} /> Salvar Convênio</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Dados Gerais */}
        <div className="space-y-6">
          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Globe size={16} className="text-blue-500" /> Informações Básicas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nome Fantasia</label>
                <input type="text" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} className="w-full p-3 bg-gray-50 border border-transparent rounded-2xl font-bold text-gray-700 focus:bg-white focus:border-blue-200 outline-none transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Registro ANS</label>
                <input type="text" value={formData.registro_ans} onChange={e => setFormData({ ...formData, registro_ans: e.target.value })} className="w-full p-3 bg-gray-50 border border-transparent rounded-2xl font-bold text-gray-700" />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Razão Social</label>
                <input type="text" value={formData.razao_social} onChange={e => setFormData({ ...formData, razao_social: e.target.value })} className="w-full p-3 bg-gray-50 border border-transparent rounded-2xl font-bold text-gray-700" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">CNPJ</label>
                <input type="text" value={formData.cnpj} onChange={e => setFormData({ ...formData, cnpj: e.target.value })} className="w-full p-3 bg-gray-50 border border-transparent rounded-2xl font-bold text-gray-700" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Situação</label>
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                  {['Ativo', 'Inativo'].map(s => (
                    <button key={s} onClick={() => setFormData({ ...formData, situacao: s })} className={cn("flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all", formData.situacao === s ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>{s}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center gap-3 bg-gray-50/50">
              <ImageIcon className="text-gray-300" size={32} />
              <p className="text-[10px] font-black text-gray-400 uppercase">Logomarca (jpeg, jpg, png)</p>
              <button className="text-[10px] font-black text-blue-600 uppercase underline">Selecionar arquivo</button>
            </div>
          </section>

          {/* Endereço e Contato */}
          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <MapPin size={16} className="text-emerald-500" /> Localização e Contato
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">CEP</label>
                <input type="text" value={formData.cep} onChange={e => setFormData({ ...formData, cep: e.target.value })} className="w-full p-3 bg-gray-50 border border-transparent rounded-2xl font-bold text-gray-700" />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Logradouro</label>
                <input type="text" value={formData.logradouro} onChange={e => setFormData({ ...formData, logradouro: e.target.value })} className="w-full p-3 bg-gray-50 border border-transparent rounded-2xl font-bold text-gray-700" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Município</label>
                <input type="text" value={formData.municipio} onChange={e => setFormData({ ...formData, municipio: e.target.value })} className="w-full p-3 bg-gray-50 border border-transparent rounded-2xl font-bold text-gray-700" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Estado</label>
                <input type="text" value={formData.estado} onChange={e => setFormData({ ...formData, estado: e.target.value })} className="w-full p-3 bg-gray-50 border border-transparent rounded-2xl font-bold text-gray-700" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Telefone Principal</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                  <input type="text" value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: e.target.value })} className="w-full p-3 pl-10 bg-gray-50 border border-transparent rounded-2xl font-bold text-gray-700" />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Dados para Faturamento e TISS */}
        <div className="space-y-6">
          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <CreditCard size={16} className="text-purple-500" /> Dados para Faturamento
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Versão TISS</label>
                <select value={formData.tiss_versao} onChange={e => setFormData({ ...formData, tiss_versao: e.target.value })} className="w-full p-3 bg-gray-50 border border-transparent rounded-2xl font-bold text-gray-700 outline-none">
                  <option>4.01.00</option>
                  <option>3.05.00</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Dias Retorno</label>
                <input type="number" value={formData.dias_retorno} onChange={e => setFormData({ ...formData, dias_retorno: Number(e.target.value) })} className="w-full p-3 bg-gray-50 border border-transparent rounded-2xl font-bold text-gray-700 text-center" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">% Acrésc. Apto</label>
                <input type="number" value={formData.acrescimo_apartamento} onChange={e => setFormData({ ...formData, acrescimo_apartamento: Number(e.target.value) })} className="w-full p-3 bg-gray-50 border border-transparent rounded-2xl font-bold text-gray-700 text-center" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Valor CH</label>
                <input type="number" step="0.01" value={formData.valor_ch} onChange={e => setFormData({ ...formData, valor_ch: Number(e.target.value) })} className="w-full p-3 bg-gray-50 border border-transparent rounded-2xl font-bold text-gray-700 text-right" placeholder="0,00" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Valor UCO</label>
                <input type="number" step="0.01" value={formData.valor_uco} onChange={e => setFormData({ ...formData, valor_uco: Number(e.target.value) })} className="w-full p-3 bg-gray-50 border border-transparent rounded-2xl font-bold text-gray-700 text-right" placeholder="0,00" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Deflator Porte (%)</label>
                <input type="number" value={formData.deflator_porte} onChange={e => setFormData({ ...formData, deflator_porte: Number(e.target.value) })} className="w-full p-3 bg-gray-50 border border-transparent rounded-2xl font-bold text-gray-700 text-center" placeholder="0" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Matrícula (Dígitos)</label>
                <input type="number" value={formData.digitos_matricula} onChange={e => setFormData({ ...formData, digitos_matricula: Number(e.target.value) })} className="w-full p-3 bg-gray-50 border border-transparent rounded-2xl font-bold text-gray-700 text-center" />
              </div>
            </div>

            {/* Regras de Atendimento Checkboxes */}
            <div className="pt-4 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: 'req_guia_principal', label: 'Número Guia Principal' },
                { id: 'req_guia_autorizacao', label: 'Número Guia Autorização' },
                { id: 'req_guia_operadora', label: 'Número Guia Operadora' },
                { id: 'req_senha', label: 'Senha' },
                { id: 'req_setor', label: 'Setor' },
                { id: 'req_hipotese', label: 'Hipótese Diagnóstica' },
              ].map(item => (
                <label key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={(formData as any)[item.id]}
                    onChange={e => setFormData({ ...formData, [item.id]: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[11px] font-black text-gray-600 uppercase">{item.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Vias de Acesso */}
          <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Percent size={16} className="text-rose-500" /> Percentuais de Vias de Acesso
              </h3>
              <button
                type="button"
                onClick={() => setViasAcesso(prev => [...prev, { descricao: 'Nova Via', percentual: 0 }])}
                className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1">
                <Plus size={12} /> Adicionar
              </button>
            </div>

            <div className="space-y-2">
              {viasAcesso.map((via, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl">
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Via de Acesso</p>
                    <input type="text" value={via.descricao} onChange={e => {
                      const newVias = [...viasAcesso];
                      newVias[idx].descricao = e.target.value;
                      setViasAcesso(newVias);
                    }} className="w-full p-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold" />
                  </div>
                  <div className="w-24">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Percentual</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={via.percentual}
                        onChange={e => {
                          const newVias = [...viasAcesso];
                          newVias[idx].percentual = Number(e.target.value);
                          setViasAcesso(newVias);
                        }}
                        className="w-full p-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-center"
                      />
                      <span className="text-xs font-bold text-gray-400">%</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViasAcesso(prev => prev.filter((_, i) => i !== idx))}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Tabelas de Preço Vinculadas */}
      <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
        <div className="flex justify-between items-center border-b border-gray-50 pb-4">
          <div className="flex items-center gap-3">
            <TableIcon className="text-blue-600" size={24} />
            <div>
              <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter">Vínculos de Tabelas</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Defina as faixas de procedimentos e tabelas base</p>
            </div>
          </div>
          <div className="flex gap-2">
            <select
              className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:border-blue-200 transition-all"
              onChange={(e) => {
                if (e.target.value) handleAddTabelaVinculo(e.target.value);
                e.target.value = "";
              }}
            >
              <option value="">Selecionar Tabela para Vínculo...</option>
              {tabelasDisponiveis.map(t => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tabelasVinculadas.map((tab, idx) => (
            <div key={tab.id} className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-4 group hover:border-blue-200 transition-all">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest px-2 py-0.5 bg-blue-50 rounded">Tabela Ativa</span>
                  <p className="text-sm font-black text-gray-700 uppercase leading-tight">{tab.nome}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="text-[10px] font-black text-gray-400 uppercase hover:text-blue-600">Exportar</button>
                  <button
                    type="button"
                    onClick={() => handleRemoveTabelaVinculo(tab.id)}
                    className="text-[10px] font-black text-gray-400 uppercase hover:text-red-500 transition-colors"
                  >
                    Remover
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Faixas de Procedimentos</label>
                <input
                  type="text"
                  placeholder="Separar por vírgula (ex: 10101012, 10101039...)"
                  value={tab.faixas}
                  onChange={(e) => {
                    const newTabs = [...tabelasVinculadas];
                    newTabs[idx].faixas = e.target.value;
                    setTabelasVinculadas(newTabs);
                  }}
                  className="w-full p-3 bg-white border border-gray-100 rounded-2xl text-xs font-bold text-gray-600 mt-1"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Regras Gerais e Ajustes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Settings size={16} className="text-orange-500" /> Regras Gerais
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Ajuste de Tabela SIMPRO</p>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-gray-600">Ajuste (%):</span>
                <input
                  type="number"
                  value={formData.ajuste_simpro}
                  onChange={e => setFormData({ ...formData, ajuste_simpro: Number(e.target.value) })}
                  className={cn(
                    "w-24 p-2 rounded-lg border text-right font-black text-sm outline-none transition-all",
                    formData.ajuste_simpro < 0 ? "text-red-500 border-red-100 focus:border-red-300" : "text-emerald-500 border-emerald-100 focus:border-emerald-300"
                  )}
                />
              </div>
              <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase italic">
                {formData.ajuste_simpro < 0 ? 'Deflator aplicado' : 'Inflator aplicado'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Brasíndice</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded text-blue-600" />
                <span className="text-[10px] font-black text-gray-500 uppercase">Pagar apenas genéricos</span>
              </label>
            </div>
          </div>
        </section>

        <section className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <FileText size={16} className="text-blue-500" /> Itens de Referência (De-Para)
            </h3>
            <button type="button" className="text-[10px] font-black text-blue-600 uppercase">Adicionar Regra</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Item Original</th>
                  <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Novo Código</th>
                  <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { nome: 'CATETER NASAL OXIGENIO', cod: '0002340147' },
                  { nome: 'ELETRODO ECG ADULTO', cod: '0000330296' },
                ].map((item, i) => (
                  <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-3">
                      <p className="text-[11px] font-bold text-gray-700">{item.nome}</p>
                      <p className="text-[9px] text-gray-400 font-mono">SIMPRO</p>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 bg-gray-100 rounded font-mono text-xs font-bold text-gray-500">{item.cod}</span>
                    </td>
                    <td className="py-3 text-right">
                      <button type="button" className="p-1.5 text-gray-300 hover:text-blue-500 transition-colors"><Settings size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Botões de Ação Inferiores */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 sm:left-auto sm:right-8 sm:translate-x-0 z-40 bg-gray-900 text-white p-2 rounded-3xl shadow-2xl flex items-center gap-2">
        <button onClick={() => setView('LIST')} className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-white/10 transition-all flex items-center gap-2">
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="w-[1px] h-6 bg-white/10" />
        <button onClick={handleSave} className="px-8 py-3 bg-blue-600 rounded-2xl text-[10px] font-black uppercase hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
          <Save size={16} /> Salvar Tudo
        </button>
      </div>
    </div>
  );
}