import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Stethoscope, Loader2, Pill } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';

export function PerfilPaciente() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState<any>(null);
  const [historico, setHistorico] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'triagens' | 'consultas' | 'prescricoes'>('triagens');

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const [pRes, hRes] = await Promise.allSettled([api.get(`/pacientes/${id}`), api.get(`/pacientes/${id}/historico`)]);
        if (pRes.status === 'fulfilled') setPaciente(pRes.value.data?.paciente || pRes.value.data);
        if (hRes.status === 'fulfilled') setHistorico(hRes.value.data);
      } catch {} finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!paciente) return <div className="text-center py-20 text-muted-foreground">Paciente não encontrado.</div>;

  const triagens = historico?.triagens || [];
  const consultas = historico?.consultas || [];
  const prescricoes = historico?.prescricoes || [];
  const riskColor = (c: string) => ({ vermelho: 'bg-red-500', laranja: 'bg-orange-500', amarelo: 'bg-yellow-500', verde: 'bg-green-500', azul: 'bg-blue-500' }[c] || 'bg-gray-500');

  return (
    <div className="space-y-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-5 h-5" /> Voltar</button>
      <div className="glass rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">{paciente.nome?.charAt(0)}</div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{paciente.nome}</h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><User className="w-4 h-4" /> {paciente.sexo === 'M' ? 'Masculino' : 'Feminino'}</span>
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {paciente.data_nascimento ? new Date(paciente.data_nascimento).toLocaleDateString('pt-BR') : '—'}</span>
            <span>📞 {paciente.telefone || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl w-fit">
        {(['triagens', 'consultas', 'prescricoes'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-2 rounded-lg font-medium text-sm capitalize transition-all", tab === t ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>{t}</button>
        ))}
      </div>

      <div className="glass rounded-2xl p-4 sm:p-6">
        {tab === 'triagens' && (triagens.length === 0 ? <p className="text-center py-12 text-muted-foreground">Nenhuma triagem registrada.</p> : (
          <div className="space-y-3">{triagens.map((t: any, i: number) => (
            <div key={i} className="p-4 rounded-xl border border-border/50 flex items-center gap-4 animate-fade-in">
              <div className={cn("w-3 h-3 rounded-full", riskColor(t.classificacao_risco))} />
              <div className="flex-1">
                <p className="font-medium text-sm">Classificação: <span className="capitalize">{t.classificacao_risco}</span></p>
                <p className="text-xs text-muted-foreground mt-1">PA: {t.pressao_arterial} • FC: {t.freq_cardiaca} • Temp: {t.temperatura}°C • SpO2: {t.saturacao_o2}%</p>
              </div>
              <span className="text-xs text-muted-foreground">{t.criado_em ? new Date(t.criado_em).toLocaleDateString('pt-BR') : ''}</span>
            </div>
          ))}</div>
        ))}
        {tab === 'consultas' && (consultas.length === 0 ? <p className="text-center py-12 text-muted-foreground">Nenhuma consulta registrada.</p> : (
          <div className="space-y-3">{consultas.map((c: any, i: number) => (
            <div key={i} className="p-4 rounded-xl border border-border/50 animate-fade-in">
              <div className="flex items-center gap-2 mb-2"><Stethoscope className="w-4 h-4 text-blue-500" /><span className="font-medium text-sm">Diagnóstico: {c.diagnostico || 'Não informado'}</span></div>
              <p className="text-sm text-muted-foreground">{c.evolucao || c.observacoes || '—'}</p>
              <span className="text-xs text-muted-foreground">{c.criado_em ? new Date(c.criado_em).toLocaleDateString('pt-BR') : ''}</span>
            </div>
          ))}</div>
        ))}
        {tab === 'prescricoes' && (prescricoes.length === 0 ? <p className="text-center py-12 text-muted-foreground">Nenhuma prescrição registrada.</p> : (
          <div className="space-y-3">{prescricoes.map((p: any, i: number) => (
            <div key={i} className="p-4 rounded-xl border border-border/50 animate-fade-in">
              <div className="flex items-center gap-2 mb-2"><Pill className="w-4 h-4 text-green-500" /><span className="font-medium text-sm">{p.medicamento || 'Prescrição'}</span></div>
              <p className="text-sm text-muted-foreground">{p.dosagem} — {p.via} — {p.frequencia}</p>
            </div>
          ))}</div>
        ))}
      </div>
    </div>
  );
}
