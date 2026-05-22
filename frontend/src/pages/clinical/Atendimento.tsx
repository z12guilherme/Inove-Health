import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Stethoscope, Loader2, Save, FileText, Pill, Activity, Syringe, CheckCircle2, Search, X } from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { generateDigitalSignature } from '../../lib/crypto';

const coresRisco: any = { vermelho: 'bg-red-500', laranja: 'bg-orange-500', amarelo: 'bg-yellow-500', verde: 'bg-green-500', azul: 'bg-blue-500' };

export function Atendimento() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const atdId = searchParams.get('atendimentoId');

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  
  // Dados Base
  const [atendimento, setAtendimento] = useState<any>(null);
  const [paciente, setPaciente] = useState<any>(null);
  const [triagem, setTriagem] = useState<any>(null);
  
  // Abas
  const [activeTab, setActiveTab] = useState<'consulta' | 'exames' | 'prescricoes' | 'atestado'>('consulta');
  
  // Formulário Aba Consulta
  const [formConsulta, setFormConsulta] = useState({
    queixa_principal: '',
    cid_10: '',
    observacoes: ''
  });

  // Formulário Aba Exames (Vinculados aos procedimentos do Atendimento)
  const [searchExame, setSearchExame] = useState('');
  const [examesDisponiveis] = useState([
    { codigo: '40304361', nome: 'HEMOGRAMA COMPLETO', valor: 25.00 },
    { codigo: '40301635', nome: 'COLESTEROL TOTAL', valor: 15.00 },
    { codigo: '40805018', nome: 'RADIOGRAFIA DE TÓRAX', valor: 85.00 },
    { codigo: '41101034', nome: 'ELETROCARDIOGRAMA', valor: 65.00 },
    { codigo: '40302585', nome: 'PROTEINA C REATIVA', valor: 22.00 },
    { codigo: '40301619', nome: 'CREATININA', valor: 18.00 }
  ]);
  const [examesSolicitados, setExamesSolicitados] = useState<any[]>([]);

  // Carregamento Inicial
  useEffect(() => {
    const fetchData = async () => {
      if (!atdId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Trazendo do banco de atendimentos
        const { data: dataAtd } = await api.get('/atendimentos');
        const atds = Array.isArray(dataAtd) ? dataAtd : dataAtd.atendimentos || [];
        const atd = atds.find((a: any) => a.id === atdId);
        
        if (!atd) {
          toast.error('Atendimento não encontrado.');
          navigate('/clinical/fila-medica');
          return;
        }
        
        setAtendimento(atd);
        setExamesSolicitados(atd.procedimentos || []);

        // Busca paciente e triagem
        const [{ data: dataPac }, { data: dataTri }] = await Promise.all([
          api.get(`/pacientes/${atd.paciente_id}`),
          api.get(`/atendimentos/${atd.id}/triagens`).catch(() => ({ data: { triagens: [] } }))
        ]);

        // API de mock retorna objeto { paciente: ... }
        setPaciente(dataPac.paciente || dataPac);
        
        const trs = Array.isArray(dataTri) ? dataTri : dataTri.triagens || [];
        setTriagem(trs.length > 0 ? trs[0] : null);

        // Atualiza status_fila para EM_CONSULTA se estava AGUARDANDO
        if (atd.status_fila === 'AGUARDANDO_MEDICO') {
          await api.patch(`/atendimentos/${atd.id}`, { status_fila: 'EM_CONSULTA' });
        }
      } catch {
        toast.error('Erro ao carregar dados do atendimento.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [atdId, navigate]);

  const handleAddExame = async (exame: any) => {
    const novoExame = {
      id: Date.now().toString(),
      data: new Date().toISOString().split('T')[0],
      codigo: exame.codigo,
      nome: exame.nome,
      qtd: 1,
      valor: exame.valor,
      especialidade: 'Médico',
      profissional: 'Dr. Executante' // ideal pegar do auth
    };
    
    const novosExames = [...examesSolicitados, novoExame];
    setExamesSolicitados(novosExames);
    
    // Auto-salva no atendimento para ir pro Faturamento
    try {
      await api.patch(`/atendimentos/${atdId}`, { procedimentos: novosExames });
      toast.success(`${exame.nome} adicionado com sucesso!`);
    } catch {
      toast.error('Erro ao adicionar exame.');
    }
  };

  const handleRemoveExame = async (id: string) => {
    const novosExames = examesSolicitados.filter(e => e.id !== id);
    setExamesSolicitados(novosExames);
    try {
      await api.patch(`/atendimentos/${atdId}`, { procedimentos: novosExames });
    } catch {}
  };

  const handleFinalizar = async () => {
    if (!formConsulta.queixa_principal || !formConsulta.cid_10) {
      toast.error('Preencha a Anamnese e o CID-10 para finalizar.');
      return;
    }
    setBusy(true);
    try {
      // Gerar Assinatura Digital
      const signaturePayload = {
        paciente_id: paciente.id,
        atendimento_id: atdId,
        diagnostico: formConsulta.queixa_principal,
        cid_10: formConsulta.cid_10,
        observacoes: formConsulta.observacoes,
        timestamp: new Date().toISOString(),
        profissional: {
          nome: 'Dr. Executante Mock', // Pegaria do Auth real
          conselho: '12345-PE'
        }
      };
      
      const hash = await generateDigitalSignature(signaturePayload);
      const assinatura = `Assinado digitalmente por ${signaturePayload.profissional.nome} | CRM: ${signaturePayload.profissional.conselho} | SHA256: ${hash} | Data: ${new Date(signaturePayload.timestamp).toLocaleString('pt-BR')}`;

      // Salva a consulta no histórico com a assinatura
      await api.post('/consultas', {
        paciente_id: paciente.id,
        atendimento_id: atdId,
        diagnostico: formConsulta.queixa_principal,
        cid_10: formConsulta.cid_10,
        observacoes: formConsulta.observacoes,
        assinatura_digital: assinatura
      });

      // Atualiza o Atendimento com a Assinatura
      await api.patch(`/atendimentos/${atdId}`, {
        status_fila: 'FINALIZADO',
        assinatura_medico: assinatura,
        dados_atendimento: {
          ...atendimento.dados_atendimento,
          cid10: formConsulta.cid_10
        }
      });
      
      toast.success('Atendimento finalizado com sucesso!');
      navigate('/clinical/fila-medica');
    } catch {
      toast.error('Erro ao finalizar atendimento.');
    } finally {
      setBusy(false);
    }
  };

  if (!atdId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Stethoscope className="w-16 h-16 opacity-30 mb-4" />
        <p className="text-lg">Nenhum atendimento selecionado.</p>
        <button onClick={() => navigate('/clinical/fila-medica')} className="mt-4 px-6 py-2 bg-primary text-white rounded-xl">Voltar para Fila</button>
      </div>
    );
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!paciente) return null;

  const riscoCor = coresRisco[triagem?.classificacao_risco || paciente.risco || 'verde'];
  const riscoLabel = (triagem?.classificacao_risco || paciente.risco || 'Verde').toUpperCase();

  return (
    <div className="space-y-6 pb-12">
      {/* Header Fixo - Paciente e Triagem */}
      <div className="glass rounded-2xl border-l-8 overflow-hidden shadow-sm" style={{ borderLeftColor: riscoCor.replace('bg-', 'var(--').replace('-500', '') }}>
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/50 pb-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold uppercase text-foreground">{paciente.nome}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground font-medium">
                <span>Idade: {paciente.data_nascimento ? new Date().getFullYear() - new Date(paciente.data_nascimento).getFullYear() : '--'}</span>
                <span>•</span>
                <span>Sexo: {paciente.sexo === 'M' ? 'Masculino' : 'Feminino'}</span>
                <span>•</span>
                <span>Convênio: {atendimento.categoria}</span>
              </div>
            </div>
            <div className={cn("px-4 py-1.5 rounded-lg text-white font-bold text-xs shadow-sm", riscoCor)}>
              Risco: {riscoLabel}
            </div>
          </div>

          {/* Resumo da Triagem */}
          {triagem ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-secondary/30 p-3 rounded-xl border border-border/50">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Motivo / Sintomas</p>
                <p className="font-medium text-foreground line-clamp-2">{triagem.sintomas || '--'}</p>
              </div>
              <div className="bg-secondary/30 p-3 rounded-xl border border-border/50">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Alergias</p>
                <p className="font-medium text-destructive">{triagem.alergias || '--'}</p>
              </div>
              <div className="bg-secondary/30 p-3 rounded-xl border border-border/50 col-span-2 md:col-span-2">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">Sinais Vitais</p>
                <div className="flex gap-4">
                  <div><span className="text-xs text-muted-foreground mr-1">PA:</span><span className="font-bold">{triagem.pressao_arterial || '--'}</span></div>
                  <div><span className="text-xs text-muted-foreground mr-1">Temp:</span><span className="font-bold">{triagem.temperatura || '--'}°</span></div>
                  <div><span className="text-xs text-muted-foreground mr-1">FC:</span><span className="font-bold">{triagem.freq_cardiaca || '--'}</span></div>
                  <div><span className="text-xs text-muted-foreground mr-1">SpO2:</span><span className="font-bold">{triagem.saturacao_o2 || '--'}%</span></div>
                  <div><span className="text-xs text-muted-foreground mr-1">Peso:</span><span className="font-bold">{triagem.peso || '--'}Kg</span></div>
                </div>
              </div>
            </div>
          ) : (
             <div className="text-sm text-muted-foreground italic px-2">Nenhuma triagem vinculada a este atendimento.</div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-secondary/50 p-1.5 rounded-2xl w-fit border border-border/50">
        <button onClick={() => setActiveTab('consulta')} className={cn("px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all", activeTab === 'consulta' ? 'bg-background text-primary shadow-sm border border-primary/10' : 'text-muted-foreground hover:text-foreground')}>
          <Stethoscope className="w-4 h-4" /> Consulta
        </button>
        <button onClick={() => setActiveTab('exames')} className={cn("px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all", activeTab === 'exames' ? 'bg-background text-primary shadow-sm border border-primary/10' : 'text-muted-foreground hover:text-foreground')}>
          <Activity className="w-4 h-4" /> Exames / Procedimentos
        </button>
        <button onClick={() => setActiveTab('prescricoes')} className={cn("px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all", activeTab === 'prescricoes' ? 'bg-background text-primary shadow-sm border border-primary/10' : 'text-muted-foreground hover:text-foreground')}>
          <Pill className="w-4 h-4" /> Prescrições
        </button>
        <button onClick={() => setActiveTab('atestado')} className={cn("px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all", activeTab === 'atestado' ? 'bg-background text-primary shadow-sm border border-primary/10' : 'text-muted-foreground hover:text-foreground')}>
          <FileText className="w-4 h-4" /> Atestado
        </button>
      </div>

      {/* Conteúdo das Abas */}
      <div className="glass rounded-2xl p-6 min-h-[400px]">
        {activeTab === 'consulta' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-foreground/80">Queixa Principal / Anamnese</label>
              <textarea 
                value={formConsulta.queixa_principal} 
                onChange={e => setFormConsulta(p => ({...p, queixa_principal: e.target.value}))} 
                rows={6} 
                className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all resize-none text-base" 
                placeholder="Descreva a evolução do paciente..." 
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-foreground/80">Hipótese Diagnóstica (CID-10)</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input 
                    type="text" 
                    value={formConsulta.cid_10} 
                    onChange={e => setFormConsulta(p => ({...p, cid_10: e.target.value}))} 
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all font-mono text-base uppercase" 
                    placeholder="Ex: J18.9" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-foreground/80">Observações Extras</label>
                <input 
                  type="text" 
                  value={formConsulta.observacoes} 
                  onChange={e => setFormConsulta(p => ({...p, observacoes: e.target.value}))} 
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all text-base" 
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'exames' && (
          <div className="animate-in fade-in grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Search className="w-5 h-5 text-primary" /> Pesquisar Exame/Procedimento</h3>
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input 
                  type="text" 
                  value={searchExame} 
                  onChange={e => setSearchExame(e.target.value)} 
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all" 
                  placeholder="Digite o nome ou código..." 
                />
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {examesDisponiveis.filter(e => e.nome.toLowerCase().includes(searchExame.toLowerCase()) || e.codigo.includes(searchExame)).map(e => (
                  <button 
                    key={e.codigo} 
                    onClick={() => handleAddExame(e)}
                    className="w-full text-left p-3 rounded-xl border border-border/50 hover:border-primary/50 bg-background hover:bg-secondary/50 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-bold text-sm text-foreground">{e.nome}</div>
                      <div className="text-xs text-muted-foreground font-mono">{e.codigo}</div>
                    </div>
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      +
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-secondary/20 p-6 rounded-2xl border border-border/50">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Syringe className="w-5 h-5 text-primary" /> Exames Solicitados</h3>
              {examesSolicitados.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhum exame solicitado.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {examesSolicitados.map(e => (
                    <div key={e.id || e.codigo} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                      <div>
                        <div className="font-bold text-sm text-foreground">{e.nome}</div>
                        <div className="text-xs text-muted-foreground font-mono">{e.codigo}</div>
                      </div>
                      <button onClick={() => handleRemoveExame(e.id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="pt-4 mt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Os exames solicitados já são vinculados à conta do paciente e ao laboratório.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'prescricoes' && (
          <div className="animate-in fade-in flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Pill className="w-16 h-16 opacity-20 mb-4" />
            <p className="font-medium text-lg">Módulo de Prescrição</p>
            <p className="text-sm mt-1">Integração com farmácia e estoque pendente.</p>
          </div>
        )}

        {activeTab === 'atestado' && (
          <div className="animate-in fade-in flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FileText className="w-16 h-16 opacity-20 mb-4" />
            <p className="font-medium text-lg">Emissão de Atestados</p>
            <p className="text-sm mt-1">Módulo em desenvolvimento.</p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between items-center bg-background p-4 rounded-2xl border border-border shadow-sm">
        <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
          <button className="px-6 py-2.5 rounded-xl border border-border font-bold text-sm hover:bg-secondary transition-all">Salvar Rascunho</button>
          <button onClick={handleFinalizar} disabled={busy} className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/25 disabled:opacity-50 flex items-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Assinar e Fechar Atendimento</>}
          </button>
        </div>
      </div>

    </div>
  );
}
