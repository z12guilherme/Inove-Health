import { Search, Plus, FileText, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Pacientes() {
  const pacientes = [
    { id: '1', nome: 'Maria Silva Costa', idade: 45, status: 'Em Atendimento', risco: 'amarelo' },
    { id: '2', nome: 'João Pedro Alves', idade: 28, status: 'Aguardando Triagem', risco: 'verde' },
    { id: '3', nome: 'Ana Lúcia Ferreira', idade: 62, status: 'Emergência', risco: 'vermelho' },
  ];

  const getRiscoColor = (risco: string) => {
    switch (risco) {
      case 'vermelho': return 'bg-red-500 text-white';
      case 'amarelo': return 'bg-yellow-500 text-yellow-950';
      case 'verde': return 'bg-green-500 text-white';
      case 'azul': return 'bg-blue-500 text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Pacientes</h1>
          <p className="text-muted-foreground mt-2">Listagem e cadastro de pacientes em atendimento.</p>
        </div>
        <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all">
          <Plus className="w-5 h-5" />
          Novo Paciente
        </button>
      </div>

      <div className="glass rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar paciente por nome, CPF ou prontuário..." 
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground text-sm">
                <th className="pb-3 font-medium px-4">Nome do Paciente</th>
                <th className="pb-3 font-medium px-4">Idade</th>
                <th className="pb-3 font-medium px-4">Classificação</th>
                <th className="pb-3 font-medium px-4">Status</th>
                <th className="pb-3 font-medium px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pacientes.map((paciente) => (
                <tr key={paciente.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="py-4 px-4 font-medium">{paciente.nome}</td>
                  <td className="py-4 px-4 text-muted-foreground">{paciente.idade} anos</td>
                  <td className="py-4 px-4">
                    <span className={cn("px-3 py-1 rounded-full text-xs font-semibold capitalize", getRiscoColor(paciente.risco))}>
                      {paciente.risco}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm">{paciente.status}</td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Ver Prontuário">
                        <FileText className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Iniciar Atendimento">
                        <Activity className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
