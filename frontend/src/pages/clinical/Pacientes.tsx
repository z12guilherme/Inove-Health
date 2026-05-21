import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, FileText, Activity, X, Loader2, Shield } from 'lucide-react';

import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Paciente { id: string; nome: string; cpf: string; data_nascimento: string; sexo: string; telefone: string; endereco: string; ativo: boolean; }
interface PForm { nome: string; cpf: string; data_nascimento: string; sexo: string; telefone: string; endereco: string; consentimento_lgpd: boolean; }
const empty: PForm = { nome: '', cpf: '', data_nascimento: '', sexo: 'M', telefone: '', endereco: '', consentimento_lgpd: false };



export function Pacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<PForm>(empty);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try { setLoading(true); const { data } = await api.get('/pacientes'); setPacientes(Array.isArray(data) ? data : data.pacientes || []); } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.consentimento_lgpd) { toast.error('O consentimento LGPD é obrigatório.'); return; }
    setBusy(true);
    try {
      await api.post('/pacientes', form);
      toast.success('Paciente cadastrado com sucesso!');
      setModal(false); setForm(empty); load();
    } catch {} finally { setBusy(false); }
  };

  const filtered = pacientes.filter(p => p.nome?.toLowerCase().includes(search.toLowerCase()) || p.cpf?.includes(search));

  const calcAge = (dob: string) => { if (!dob) return '—'; const d = new Date(dob); const age = new Date().getFullYear() - d.getFullYear(); return `${age} anos`; };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Pacientes</h1>
          <p className="text-muted-foreground mt-2">Listagem e cadastro de pacientes em atendimento.</p>
        </div>
        <button onClick={() => { setForm(empty); setModal(true); }} className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/25">
          <Plus className="w-5 h-5" /> Novo Paciente
        </button>
      </div>
      <div className="glass rounded-2xl p-4 sm:p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input type="text" placeholder="Buscar por nome ou CPF..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-12 pl-10 pr-4 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
        </div>
        {loading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        : filtered.length === 0 ? <div className="text-center py-20 text-muted-foreground"><p className="font-medium">Nenhum paciente encontrado</p></div>
        : (
          <div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="border-b border-border/50 text-muted-foreground text-sm">
            <th className="pb-3 font-medium px-4">Paciente</th><th className="pb-3 font-medium px-4">CPF</th><th className="pb-3 font-medium px-4">Idade</th><th className="pb-3 font-medium px-4">Sexo</th><th className="pb-3 font-medium px-4 text-right">Ações</th>
          </tr></thead><tbody>{filtered.map(p => (
            <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
              <td className="py-4 px-4 font-medium">{p.nome}</td>
              <td className="py-4 px-4 text-muted-foreground text-sm font-mono">{p.cpf}</td>
              <td className="py-4 px-4 text-muted-foreground text-sm">{calcAge(p.data_nascimento)}</td>
              <td className="py-4 px-4 text-sm">{p.sexo === 'M' ? 'Masculino' : 'Feminino'}</td>
              <td className="py-4 px-4 text-right"><div className="flex justify-end gap-2">
                <button onClick={() => navigate(`/clinical/pacientes/${p.id}`)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Ver Perfil"><FileText className="w-5 h-5" /></button>
                <button onClick={() => navigate(`/clinical/atendimento?pacienteId=${p.id}`)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Iniciar Atendimento"><Activity className="w-5 h-5" /></button>
              </div></td>
            </tr>
          ))}</tbody></table></div>
        )}
      </div>
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}><div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 border-b border-border/50"><h2 className="text-xl font-semibold">Novo Paciente</h2><button onClick={() => setModal(false)} className="p-2 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button></div>
          <form onSubmit={submit} className="p-6 space-y-4">
            <div><label className="block text-sm font-medium mb-1.5">Nome Completo *</label><input type="text" required value={form.nome} onChange={e => setForm(p => ({...p, nome: e.target.value}))} className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1.5">CPF *</label><input type="text" required value={form.cpf} onChange={e => setForm(p => ({...p, cpf: e.target.value}))} className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="000.000.000-00" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Data de Nascimento *</label><input type="date" required value={form.data_nascimento} onChange={e => setForm(p => ({...p, data_nascimento: e.target.value}))} className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1.5">Sexo *</label><select value={form.sexo} onChange={e => setForm(p => ({...p, sexo: e.target.value}))} className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"><option value="M">Masculino</option><option value="F">Feminino</option></select></div>
              <div><label className="block text-sm font-medium mb-1.5">Telefone</label><input type="text" value={form.telefone} onChange={e => setForm(p => ({...p, telefone: e.target.value}))} className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" /></div>
            </div>
            <div><label className="block text-sm font-medium mb-1.5">Endereço</label><input type="text" value={form.endereco} onChange={e => setForm(p => ({...p, endereco: e.target.value}))} className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" /></div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.consentimento_lgpd} onChange={e => setForm(p => ({...p, consentimento_lgpd: e.target.checked}))} className="mt-1 w-4 h-4 rounded" />
                <div><div className="flex items-center gap-2 font-medium text-sm text-blue-700"><Shield className="w-4 h-4" /> Consentimento LGPD</div><p className="text-xs text-blue-600 mt-1">Declaro que obtive o consentimento explícito do paciente para a coleta e tratamento dos dados pessoais, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p></div>
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(false)} className="flex-1 h-12 rounded-xl border border-border font-medium hover:bg-secondary transition-colors">Cancelar</button>
              <button type="submit" disabled={busy} className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/25">{busy ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Cadastrar Paciente'}</button>
            </div>
          </form>
        </div></div>
      )}
    </div>
  );
}
