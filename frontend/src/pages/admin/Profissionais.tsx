import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Pencil, Trash2, X, Loader2, Search, Stethoscope, HeartPulse, Shield, MapPin, Phone, Briefcase, Building, Settings, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import localStorageService from '../../services/localStorageService';

type Tab = 'medicos' | 'enfermeiros';
interface Profissional {
  id: string; nome: string; email: string; ativo: boolean;
  cpf?: string; data_nascimento?: string; sexo?: string;
  telefone_fixo?: string; telefone_celular?: string; telefone_consultorio?: string;
  autonomo?: boolean; cns?: string;
  conselho_profissional?: string; numero_conselho?: string; uf_conselho?: string;
  cbo1?: string; cbo2?: string; cbo3?: string;
  plantonista?: boolean; atende_ambulatorio?: boolean; honorario_individual?: boolean; nova_tela_atendimento?: boolean;
  crm?: string; coren?: string; especialidade?: string;
  endereco?: any;
  convenios_vinculados?: any[];
}

interface PForm {
  nome: string; email: string; senha: string; especialidade: string;
  cpf: string; data_nascimento: string; sexo: string;
  telefone_fixo: string; telefone_celular: string; telefone_consultorio: string;
  autonomo: boolean; cns: string;
  conselho_profissional: string; numero_conselho: string; uf_conselho: string;
  cbo1: string; cbo2: string; cbo3: string;
  plantonista: boolean; atende_ambulatorio: boolean; honorario_individual: boolean; nova_tela_atendimento: boolean;
  cep: string; logradouro: string; numero: string; municipio: string; estado: string; bairro: string; complemento: string;
}

const empty: PForm = {
  nome: '', email: '', senha: '', especialidade: '',
  cpf: '', data_nascimento: '', sexo: 'M', telefone_fixo: '', telefone_celular: '', telefone_consultorio: '',
  autonomo: false, cns: '', conselho_profissional: 'Conselho Regional de Medicina', numero_conselho: '', uf_conselho: 'PE',
  cbo1: '225125', cbo2: '', cbo3: '',
  plantonista: true, atende_ambulatorio: true, honorario_individual: false, nova_tela_atendimento: true,
  cep: '', logradouro: '', numero: '', municipio: '', estado: '', bairro: '', complemento: ''
};

export function Profissionais() {
  const [tab, setTab] = useState<Tab>('medicos');
  const [list, setList] = useState<Profissional[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PForm>(empty);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [conveniosList, setConveniosList] = useState<any[]>([]);
  const [conveniosVinculos, setConveniosVinculos] = useState<Record<string, any>>({});

  const ep = tab === 'medicos' ? '/medicos' : '/enfermeiros';

  const load = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch from localStorageService
      const profissionais = localStorageService.getProfissionais();
      const convenios = localStorageService.getConvenios();

      // Filter by tab (medicos/enfermeiros) and set list
      setList(profissionais.filter((p: any) => (tab === 'medicos' && p.crm) || (tab === 'enfermeiros' && p.coren)));
      setConveniosList(convenios);
    } catch { } finally { setLoading(false); }
  }, [ep, tab]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const p: Record<string, any> = {
        ...form,
        endereco: {
          cep: form.cep, logradouro: form.logradouro, numero: form.numero,
          municipio: form.municipio, estado: form.estado, bairro: form.bairro, complemento: form.complemento
        },
        convenios_vinculados: Object.entries(conveniosVinculos).map(([id, v]) => ({
          convenio_id: id, ...v
        }))
      };

      if (!editId) p.senha = form.senha;
      if (tab === 'medicos') p.crm = form.numero_conselho; else p.coren = form.numero_conselho;

      if (editId) { await api.put(`${ep}/${editId}`, p); toast.success('Atualizado!'); }
      else { await api.post(ep, p); toast.success('Registrado!'); }
      setModal(false); setEditId(null); setForm(empty); setConveniosVinculos({}); load();
    } catch { } finally { setBusy(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Inativar este profissional?')) return;
    try { await api.delete(`${ep}/${id}`); toast.success('Inativado!'); load(); } catch { }
  };

  const edit = (p: Profissional) => {
    setEditId(p.id);
    setForm({
      nome: p.nome, email: p.email, senha: '', especialidade: p.especialidade || '',
      cpf: p.cpf || '', data_nascimento: p.data_nascimento || '', sexo: p.sexo || 'M',
      telefone_fixo: p.telefone_fixo || '', telefone_celular: p.telefone_celular || '', telefone_consultorio: p.telefone_consultorio || '',
      autonomo: p.autonomo || false, cns: p.cns || '',
      conselho_profissional: p.conselho_profissional || (tab === 'medicos' ? 'Conselho Regional de Medicina' : 'Conselho Regional de Enfermagem'),
      numero_conselho: p.numero_conselho || p.crm || p.coren || '',
      uf_conselho: p.uf_conselho || 'PE',
      cbo1: p.cbo1 || '225125', cbo2: p.cbo2 || '', cbo3: p.cbo3 || '',
      plantonista: p.plantonista ?? true, atende_ambulatorio: p.atende_ambulatorio ?? true,
      honorario_individual: p.honorario_individual ?? false, nova_tela_atendimento: p.nova_tela_atendimento ?? true,
      cep: p.endereco?.cep || '', logradouro: p.endereco?.logradouro || '', numero: p.endereco?.numero || '',
      municipio: p.endereco?.municipio || '', estado: p.endereco?.estado || '', bairro: p.endereco?.bairro || '', complemento: p.endereco?.complemento || ''
    });

    const vMap: any = {};
    p.convenios_vinculados?.forEach(v => {
      vMap[v.convenio_id] = { codigo: v.codigo, pagamentoVia: v.pagamentoVia, cooperativa: v.cooperativa };
    });
    setConveniosVinculos(vMap);
    setModal(true);
  };

  const create = () => { setEditId(null); setForm(empty); setConveniosVinculos({}); setModal(true); };

  const filtered = list.filter(p => {
    const matchesSearch =
      p.nome?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase());

    // Filtrar apenas profissionais ativos
    return matchesSearch && p.ativo !== false;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Profissionais</h1>
          <p className="text-muted-foreground mt-2">Registre e gerencie médicos e enfermeiros.</p>
        </div>
        <button onClick={create} className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/25">
          <Plus className="w-5 h-5" /> Novo Profissional
        </button>
      </div>
      <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl w-fit">
        <button onClick={() => setTab('medicos')} className={cn("px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-all", tab === 'medicos' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}><Stethoscope className="w-4 h-4" /> Médicos</button>
        <button onClick={() => setTab('enfermeiros')} className={cn("px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-all", tab === 'enfermeiros' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}><HeartPulse className="w-4 h-4" /> Enfermeiros</button>
      </div>
      <div className="glass rounded-2xl p-4 sm:p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input type="text" placeholder="Buscar por nome, email ou registro..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/50 border border-slate-200/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm" />
        </div>
        {loading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          : filtered.length === 0 ? <div className="text-center py-20 text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nenhum profissional encontrado</p></div>
            : (
              <div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="border-b border-border/50 text-muted-foreground text-sm">
                <th className="pb-3 font-medium px-4">Nome</th><th className="pb-3 font-medium px-4">Email</th><th className="pb-3 font-medium px-4">Registro</th><th className="pb-3 font-medium px-4">CBO</th><th className="pb-3 font-medium px-4 text-right">Ações</th>
              </tr></thead><tbody>{filtered.map(p => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="py-4 px-4"><div className="flex items-center gap-3"><div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold", tab === 'medicos' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500')}>{p.nome?.charAt(0)}</div><span className="font-medium">{p.nome}</span></div></td>
                  <td className="py-4 px-4 text-muted-foreground text-sm">{p.email}</td>
                  <td className="py-4 px-4 text-sm font-mono">{p.numero_conselho || p.crm || p.coren}</td>
                  <td className="py-4 px-4 text-sm">{p.cbo1 || p.especialidade || '—'}</td>
                  <td className="py-4 px-4 text-right"><div className="flex justify-end gap-1">
                    <button onClick={() => edit(p)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => del(p.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div></td>
                </tr>
              ))}</tbody></table></div>
            )}
      </div>
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}><div className="modal-content max-w-5xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 border-b border-border/50"><h2 className="text-xl font-semibold">{editId ? 'Editar' : 'Registrar'} {tab === 'medicos' ? 'Médico' : 'Enfermeiro'}</h2><button onClick={() => setModal(false)} className="p-2 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button></div>
          <form onSubmit={submit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase text-primary flex items-center gap-2 border-b pb-2"><Users className="w-4 h-4" /> Identificação</h3>
                <div><label className="block text-sm font-medium mb-1.5">Nome Completo *</label><input type="text" required value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary outline-none" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium mb-1.5">CPF *</label><input type="text" required value={form.cpf} onChange={e => setForm(p => ({ ...p, cpf: e.target.value }))} className="w-full h-11 px-4 rounded-xl bg-background border border-border" /></div>
                  <div><label className="block text-sm font-medium mb-1.5">Nascimento</label><input type="date" value={form.data_nascimento} onChange={e => setForm(p => ({ ...p, data_nascimento: e.target.value }))} className="w-full h-11 px-4 rounded-xl bg-background border border-border" /></div>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium"><input type="checkbox" checked={form.autonomo} onChange={e => setForm(p => ({ ...p, autonomo: e.target.checked }))} /> Autônomo</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-sm"><input type="radio" name="sexo" checked={form.sexo === 'M'} onChange={() => setForm(p => ({ ...p, sexo: 'M' }))} /> Masculino</label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-sm"><input type="radio" name="sexo" checked={form.sexo === 'F'} onChange={() => setForm(p => ({ ...p, sexo: 'F' }))} /> Feminino</label>
                  </div>
                </div>
                <div><label className="block text-sm font-medium mb-1.5">Email *</label><input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full h-11 px-4 rounded-xl bg-background border border-border" /></div>
                {!editId && <div><label className="block text-sm font-medium mb-1.5">Senha *</label><input type="password" required value={form.senha} onChange={e => setForm(p => ({ ...p, senha: e.target.value }))} className="w-full h-11 px-4 rounded-xl bg-background border border-border" /></div>}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1"><label className="block text-sm font-medium mb-1.5">Fixo</label><input type="text" value={form.telefone_fixo} onChange={e => setForm(p => ({ ...p, telefone_fixo: e.target.value }))} className="w-full h-11 px-3 rounded-xl bg-background border border-border" /></div>
                  <div className="col-span-1"><label className="block text-sm font-medium mb-1.5">Celular</label><input type="text" value={form.telefone_celular} onChange={e => setForm(p => ({ ...p, telefone_celular: e.target.value }))} className="w-full h-11 px-3 rounded-xl bg-background border border-border" /></div>
                  <div className="col-span-1"><label className="block text-sm font-medium mb-1.5">Consultório</label><input type="text" value={form.telefone_consultorio} onChange={e => setForm(p => ({ ...p, telefone_consultorio: e.target.value }))} className="w-full h-11 px-3 rounded-xl bg-background border border-border" /></div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase text-primary flex items-center gap-2 border-b pb-2"><MapPin className="w-4 h-4" /> Endereço</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1"><label className="block text-sm font-medium mb-1.5">CEP</label><input type="text" value={form.cep} onChange={e => setForm(p => ({ ...p, cep: e.target.value }))} className="w-full h-11 px-4 rounded-xl bg-background border border-border" /></div>
                  <div className="col-span-2"><label className="block text-sm font-medium mb-1.5">Logradouro</label><input type="text" value={form.logradouro} onChange={e => setForm(p => ({ ...p, logradouro: e.target.value }))} className="w-full h-11 px-4 rounded-xl bg-background border border-border" /></div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-1"><label className="block text-sm font-medium mb-1.5">Número</label><input type="text" value={form.numero} onChange={e => setForm(p => ({ ...p, numero: e.target.value }))} className="w-full h-11 px-4 rounded-xl bg-background border border-border" /></div>
                  <div className="col-span-3"><label className="block text-sm font-medium mb-1.5">Bairro</label><input type="text" value={form.bairro} onChange={e => setForm(p => ({ ...p, bairro: e.target.value }))} className="w-full h-11 px-4 rounded-xl bg-background border border-border" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium mb-1.5">Município</label><input type="text" value={form.municipio} onChange={e => setForm(p => ({ ...p, municipio: e.target.value }))} className="w-full h-11 px-4 rounded-xl bg-background border border-border" /></div>
                  <div><label className="block text-sm font-medium mb-1.5">Estado</label><input type="text" value={form.estado} onChange={e => setForm(p => ({ ...p, estado: e.target.value }))} className="w-full h-11 px-4 rounded-xl bg-background border border-border" /></div>
                </div>
                <div><label className="block text-sm font-medium mb-1.5">Complemento / Obs.</label><input type="text" value={form.complemento} onChange={e => setForm(p => ({ ...p, complemento: e.target.value }))} className="w-full h-11 px-4 rounded-xl bg-background border border-border" /></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase text-primary flex items-center gap-2 border-b pb-2"><Briefcase className="w-4 h-4" /> Registro Profissional (TISS)</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2"><label className="block text-sm font-medium mb-1.5">Conselho Profissional</label><select value={form.conselho_profissional} onChange={e => setForm(p => ({ ...p, conselho_profissional: e.target.value }))} className="w-full h-11 px-3 rounded-xl bg-background border border-border"><option>Conselho Regional de Medicina</option><option>Conselho Regional de Enfermagem</option></select></div>
                  <div className="col-span-1"><label className="block text-sm font-medium mb-1.5">UF</label><input type="text" value={form.uf_conselho} onChange={e => setForm(p => ({ ...p, uf_conselho: e.target.value }))} className="w-full h-11 px-4 rounded-xl bg-background border border-border" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium mb-1.5">Número Conselho *</label><input type="text" required value={form.numero_conselho} onChange={e => setForm(p => ({ ...p, numero_conselho: e.target.value }))} className="w-full h-11 px-4 rounded-xl bg-background border border-border" /></div>
                  <div><label className="block text-sm font-medium mb-1.5">CNS (Nro Saúde)</label><input type="text" value={form.cns} onChange={e => setForm(p => ({ ...p, cns: e.target.value }))} className="w-full h-11 px-4 rounded-xl bg-background border border-border" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-sm font-medium mb-1.5">Cbo 1 *</label><input type="text" required value={form.cbo1} onChange={e => setForm(p => ({ ...p, cbo1: e.target.value }))} className="w-full h-11 px-4 rounded-xl bg-background border border-border font-mono text-xs" /></div>
                  <div><label className="block text-sm font-medium mb-1.5">Cbo 2</label><input type="text" value={form.cbo2} onChange={e => setForm(p => ({ ...p, cbo2: e.target.value }))} className="w-full h-11 px-4 rounded-xl bg-background border border-border font-mono text-xs" /></div>
                  <div><label className="block text-sm font-medium mb-1.5">Cbo 3</label><input type="text" value={form.cbo3} onChange={e => setForm(p => ({ ...p, cbo3: e.target.value }))} className="w-full h-11 px-4 rounded-xl bg-background border border-border font-mono text-xs" /></div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase text-primary flex items-center gap-2 border-b pb-2"><Settings className="w-4 h-4" /> Configurações / Situação</h3>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-emerald-600"><input type="radio" checked={form.ativo} onChange={() => setForm(p => ({ ...p, ativo: true }))} /> Ativo</label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-rose-600"><input type="radio" checked={!form.ativo} onChange={() => setForm(p => ({ ...p, ativo: false }))} /> Inativo</label>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-2 bg-secondary/30 rounded-lg cursor-pointer text-sm"><input type="checkbox" checked={form.plantonista} onChange={e => setForm(p => ({ ...p, plantonista: e.target.checked }))} /> Plantonista</label>
                  <label className="flex items-center gap-3 p-2 bg-secondary/30 rounded-lg cursor-pointer text-sm"><input type="checkbox" checked={form.atende_ambulatorio} onChange={e => setForm(p => ({ ...p, atende_ambulatorio: e.target.checked }))} /> Atende em ambulatório</label>
                  <label className="flex items-center gap-3 p-2 bg-secondary/30 rounded-lg cursor-pointer text-sm"><input type="checkbox" checked={form.honorario_individual} onChange={e => setForm(p => ({ ...p, honorario_individual: e.target.checked }))} /> Executa procedimento para Honorário Individual</label>
                  <label className="flex items-center gap-3 p-2 bg-secondary/30 rounded-lg cursor-pointer text-sm"><input type="checkbox" checked={form.nova_tela_atendimento} onChange={e => setForm(p => ({ ...p, nova_tela_atendimento: e.target.checked }))} /> Utiliza nova tela de atendimento médico</label>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <h3 className="font-bold text-sm uppercase text-primary flex items-center gap-2 border-b pb-2 mb-4"><Building className="w-4 h-4" /> Vínculo com Convênios</h3>
              <p className="text-[10px] text-muted-foreground font-bold mb-3 flex items-center gap-1"><Shield className="w-3 h-3" /> AO MARCAR COOPERATIVA TODOS OS VALORES PARA HONORÁRIOS NO XML SAIRÃO ZERADOS, EXCETO INTERNAÇÕES</p>
              <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/50 text-muted-foreground uppercase font-bold">
                    <tr>
                      <th className="px-4 py-3">Convênio</th>
                      <th className="px-4 py-3">Cód no Convênio</th>
                      <th className="px-4 py-3">Pagamento via</th>
                      <th className="px-4 py-3 text-center">Cooperativa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {conveniosList.map(c => {
                      const v = conveniosVinculos[c.id] || { codigo: '', pagamentoVia: 'Estabelecimento', cooperativa: false };
                      return (
                        <tr key={c.id} className="hover:bg-secondary/20">
                          <td className="px-4 py-3 font-semibold text-foreground">{c.nome}</td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={v.codigo}
                              onChange={e => setConveniosVinculos(prev => ({ ...prev, [c.id]: { ...v, codigo: e.target.value } }))}
                              className="w-full h-8 px-2 rounded-lg bg-background border border-border"
                              placeholder="000000000"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={v.pagamentoVia}
                              onChange={e => setConveniosVinculos(prev => ({ ...prev, [c.id]: { ...v, pagamentoVia: e.target.value } }))}
                              className="w-full h-8 px-2 rounded-lg bg-background border border-border"
                            >
                              <option>Estabelecimento</option>
                              <option>Profissional</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={v.cooperativa}
                              onChange={e => setConveniosVinculos(prev => ({ ...prev, [c.id]: { ...v, cooperativa: e.target.checked } }))}
                              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button type="button" onClick={() => setModal(false)} className="flex-1 h-12 rounded-xl border border-border font-bold hover:bg-secondary transition-colors">Cancelar e voltar</button>
              <button type="submit" disabled={busy} className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/25">
                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> {editId ? 'Salvar Alterações' : 'Registrar Profissional'}</>}
              </button>
            </div>
          </form>
        </div></div>
      )}
    </div>
  );
}
