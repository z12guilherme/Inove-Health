import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Tv, Clock, User, MapPin } from 'lucide-react';

interface Chamado {
  id: string;
  pacienteNome: string;
  destino: string;
  risco: 'vermelho' | 'laranja' | 'amarelo' | 'verde' | 'azul';
  hora: string;
}

const coresRisco = {
  vermelho: { bg: 'bg-red-500/20 border-red-500 text-red-400', color: 'bg-red-500 shadow-red-500/50' },
  laranja: { bg: 'bg-orange-500/20 border-orange-500 text-orange-400', color: 'bg-orange-500 shadow-orange-500/50' },
  amarelo: { bg: 'bg-yellow-500/20 border-yellow-500 text-yellow-400', color: 'bg-yellow-500 shadow-yellow-500/50' },
  verde: { bg: 'bg-green-500/20 border-green-500 text-green-400', color: 'bg-green-500 shadow-green-500/50' },
  azul: { bg: 'bg-blue-500/20 border-blue-500 text-blue-400', color: 'bg-blue-500 shadow-blue-500/50' },
};

export function PainelTV() {
  const [chamadoAtual, setChamadoAtual] = useState<Chamado | null>(null);
  const [historico, setHistorico] = useState<Chamado[]>([]);
  const [audioAtivo, setAudioAtivo] = useState(false);
  const [vozesDisponiveis, setVozesDisponiveis] = useState<SpeechSynthesisVoice[]>([]);
  
  const lastCalledId = useRef<string | null>(null);

  // Carregar vozes do navegador
  useEffect(() => {
    const carregarVozes = () => {
      const voices = window.speechSynthesis.getVoices();
      setVozesDisponiveis(voices);
    };

    carregarVozes();
    window.speechSynthesis.onvoiceschanged = carregarVozes;
  }, []);

  // Inicializar com o que está no localStorage
  useEffect(() => {
    const chamadoRaw = localStorage.getItem('inove_chamado_atual');
    const historicoRaw = localStorage.getItem('inove_chamados_historico');

    if (chamadoRaw) {
      const chamado = JSON.parse(chamadoRaw);
      setChamadoAtual(chamado);
      lastCalledId.current = chamado.id;
    }
    
    if (historicoRaw) {
      setHistorico(JSON.parse(historicoRaw).slice(1)); // Remove o atual para não duplicar visualmente
    }
  }, []);

  // Escutar eventos de novos chamados
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'inove_chamado_atual' && e.newValue) {
        const chamado: Chamado = JSON.parse(e.newValue);
        
        // Evita chamadas duplicadas para o mesmo ID
        if (chamado.id !== lastCalledId.current) {
          lastCalledId.current = chamado.id;
          
          // Atualiza estado do painel
          setChamadoAtual(chamado);
          
          // Atualiza histórico
          const histRaw = localStorage.getItem('inove_chamados_historico') || '[]';
          const hist: Chamado[] = JSON.parse(histRaw);
          setHistorico(hist.filter(h => h.id !== chamado.id).slice(0, 5));

          // Executa alertas sonoros e de fala
          if (audioAtivo) {
            executarChamadaPorVoz(chamado.pacienteNome, chamado.destino);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [audioAtivo]);

  // Sintetizar e reproduzir o sinal sonoro clássico de hospital (Chime)
  const tocarChime = (): Promise<void> => {
    return new Promise((resolve) => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const context = new AudioContextClass();
        
        // Primeiro tom (Mi5 - 659.25 Hz)
        const osc1 = context.createOscillator();
        const gain1 = context.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, context.currentTime);
        gain1.gain.setValueAtTime(0.12, context.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.6);
        osc1.connect(gain1);
        gain1.connect(context.destination);
        osc1.start(context.currentTime);
        osc1.stop(context.currentTime + 0.6);

        // Segundo tom (Sol5 - 783.99 Hz) após 180ms
        const osc2 = context.createOscillator();
        const gain2 = context.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(783.99, context.currentTime + 0.18);
        gain2.gain.setValueAtTime(0.12, context.currentTime + 0.18);
        gain2.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.78);
        osc2.connect(gain2);
        gain2.connect(context.destination);
        osc2.start(context.currentTime + 0.18);
        osc2.stop(context.currentTime + 0.78);

        setTimeout(() => {
          resolve();
        }, 800);
      } catch (err) {
        console.error('Erro ao tocar som:', err);
        resolve(); // resolve mesmo com erro para não travar a fala
      }
    });
  };

  // Executa o alerta completo (Som + Voz)
  const executarChamadaPorVoz = async (paciente: string, destino: string) => {
    // Para qualquer voz em execução antes de começar a nova
    window.speechSynthesis.cancel();

    // 1. Toca o som de alerta (chime)
    await tocarChime();

    // 2. Pronuncia o texto
    const texto = `${paciente}. Comparecer ao ${destino}.`;
    const utterance = new SpeechSynthesisUtterance(texto);
    
    utterance.lang = 'pt-BR';
    utterance.rate = 0.85; // Velocidade natural e calma
    utterance.pitch = 1.0;

    // Tenta encontrar uma voz padrão em português do Brasil
    const vozPt = vozesDisponiveis.find(
      v => v.lang.toLowerCase().includes('pt-br') || v.lang.toLowerCase().startsWith('pt')
    );
    if (vozPt) {
      utterance.voice = vozPt;
    }

    window.speechSynthesis.speak(utterance);
  };

  // Ativar áudio e testar chamada de demonstração
  const handleAtivarAudio = () => {
    setAudioAtivo(true);
    // Tocar um áudio inicial silencioso para destravar permissão
    const utterance = new SpeechSynthesisUtterance('');
    window.speechSynthesis.speak(utterance);
    
    tocarChime();
  };

  // Simular chamada de teste
  const handleChamadaTeste = () => {
    const nomes = ['João Marcos', 'Maria Eduarda Costa', 'Carlos Alberto Lima', 'Ana Carolina Souza'];
    const destinos = ['Consultório 1 - Dr. Carlos', 'Sala de Triagem B', 'Consultório 3 - Dra. Juliana', 'Sala de Coleta'];
    const riscos: Chamado['risco'][] = ['vermelho', 'laranja', 'amarelo', 'verde', 'azul'];

    const randomNome = nomes[Math.floor(Math.random() * nomes.length)];
    const randomDestino = destinos[Math.floor(Math.random() * destinos.length)];
    const randomRisco = riscos[Math.floor(Math.random() * riscos.length)];

    const testeChamado: Chamado = {
      id: Date.now().toString(),
      pacienteNome: randomNome,
      destino: randomDestino,
      risco: randomRisco,
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    localStorage.setItem('inove_chamado_atual', JSON.stringify(testeChamado));
    
    // Atualizar no próprio painel
    setChamadoAtual(testeChamado);
    setHistorico(prev => [testeChamado, ...prev].slice(1, 5));

    if (audioAtivo) {
      executarChamadaPorVoz(testeChamado.pacienteNome, testeChamado.destino);
    } else {
      setAudioAtivo(true);
      executarChamadaPorVoz(testeChamado.pacienteNome, testeChamado.destino);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-hidden flex flex-col justify-between p-6 sm:p-10 relative">
      {/* Background decoration elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(30,41,59,0.3)_0%,rgba(2,6,23,0.8)_100%)] pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      {/* Header do Painel */}
      <header className="relative flex items-center justify-between border-b border-white/5 pb-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Tv className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
              MediCore <span className="text-blue-500 text-xs px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 uppercase tracking-widest font-semibold">Painel de Recepção</span>
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">Sistemas de Chamadas de Pacientes</p>
          </div>
        </div>

        {/* Controles do Telão */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleChamadaTeste}
            className="hidden md:block px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition-all border border-white/5 text-slate-300"
          >
            Emitir Chamada de Teste
          </button>

          {!audioAtivo ? (
            <button 
              onClick={handleAtivarAudio}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-lg shadow-amber-500/20 animate-pulse text-xs"
            >
              <VolumeX className="w-4.5 h-4.5" />
              Ativar Som
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <Volume2 className="w-4.5 h-4.5 animate-bounce" />
              Áudio Ativo
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 my-8 grid grid-cols-1 lg:grid-cols-4 gap-8 z-10 items-stretch">
        
        {/* Bloco de Chamada Principal (Paciente em Destaque) */}
        <div className="lg:col-span-3 flex flex-col justify-center">
          {chamadoAtual ? (
            <div className="glass bg-slate-900/60 border border-white/10 rounded-[32px] p-8 md:p-12 text-center shadow-2xl relative overflow-hidden flex flex-col justify-center items-center min-h-[450px]">
              {/* Risco indicator circle background glow */}
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-[100px] opacity-20 pointer-events-none ${coresRisco[chamadoAtual.risco || 'verde'].color}`} />

              <div className="space-y-6 max-w-4xl relative z-10">
                {/* Badge de Risco / Prioridade */}
                <div className="flex justify-center">
                  <span className={`px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border shadow-inner ${coresRisco[chamadoAtual.risco || 'verde'].bg}`}>
                    <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2.5 animate-ping ${coresRisco[chamadoAtual.risco || 'verde'].color}`} />
                    Classificação Risco: {chamadoAtual.risco}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-slate-400 text-sm uppercase tracking-widest font-bold flex items-center justify-center gap-2">
                    <User className="w-4 h-4 text-blue-500" /> Paciente Chamado
                  </p>
                  <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-tight py-4 break-words drop-shadow-md">
                    {chamadoAtual.pacienteNome}
                  </h2>
                </div>

                <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-6 bg-slate-950/80 border border-white/5 px-8 py-4 rounded-2xl shadow-inner mt-4">
                  <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-xs sm:text-sm">
                    <MapPin className="w-5 h-5 text-indigo-400" /> Dirija-se para:
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-blue-400 tracking-tight">
                    {chamadoAtual.destino}
                  </div>
                </div>

                <div className="text-slate-500 text-xs flex items-center justify-center gap-1.5 pt-4">
                  <Clock className="w-3.5 h-3.5" /> Chamado às {chamadoAtual.hora}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass bg-slate-900/60 border border-white/10 rounded-[32px] p-12 text-center shadow-2xl flex flex-col justify-center items-center min-h-[450px]">
              <Tv className="w-16 h-16 text-slate-600 mb-4 animate-pulse" />
              <h3 className="text-2xl font-bold text-slate-300">Aguardando chamada de paciente...</h3>
              <p className="text-slate-500 max-w-sm text-sm mt-2">Nenhum chamado foi enviado ainda. O painel está pronto para receber atualizações da triagem ou consultório médico.</p>
              <button 
                onClick={handleChamadaTeste}
                className="mt-6 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold transition-all text-white shadow-lg shadow-blue-500/20"
              >
                Simular Primeiro Paciente
              </button>
            </div>
          )}
        </div>

        {/* Chamadas Anteriores (Histórico Lateral) */}
        <div className="lg:col-span-1 flex flex-col">
          <div className="glass bg-slate-900/40 border border-white/5 rounded-[32px] p-6 flex flex-col justify-between flex-1 min-h-[300px]">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 pb-2 border-b border-white/5">
                <Clock className="w-4 h-4 text-blue-500" /> Chamadas Anteriores
              </h3>
              
              <div className="space-y-3">
                {historico.length > 0 ? (
                  historico.map((h, index) => (
                    <div 
                      key={h.id || index}
                      className="p-3.5 rounded-2xl bg-slate-950/50 border border-white/5 flex flex-col gap-1 transition-all duration-300 hover:border-white/10"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-slate-200 truncate max-w-[150px]">
                          {h.pacienteNome}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {h.hora}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-end mt-1">
                        <span className="text-[11px] font-bold text-blue-500/90 truncate max-w-[140px]">
                          {h.destino}
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${coresRisco[h.risco || 'verde'].bg}`}>
                          {h.risco}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-600 text-xs">
                    Nenhuma chamada anterior registrada.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-950/40 rounded-xl p-3 border border-white/5 text-[10px] text-slate-500 leading-relaxed mt-4">
              <strong>Nota:</strong> Mantenha esta janela aberta em sua TV ou telão. O som deve estar ativado para reproduzir a chamada por áudio.
            </div>
          </div>
        </div>
      </main>

      {/* Footer do Painel */}
      <footer className="relative flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-white/5 pt-4 text-xs text-slate-500 z-10">
        <p>© 2026 Inove-Health MediCore. Todos os direitos reservados.</p>
        <p className="flex items-center gap-1.5 font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Conexão Local Ativa (Multi-Abas `localStorage`)
        </p>
      </footer>
    </div>
  );
}
