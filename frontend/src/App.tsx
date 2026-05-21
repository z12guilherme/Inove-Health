import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/admin/Dashboard';
import { UnidadesSaude } from './pages/admin/UnidadesSaude';
import { Profissionais } from './pages/admin/Profissionais';
import { RelatoriosIA } from './pages/admin/RelatoriosIA';
import { Fornecedores } from './pages/admin/Fornecedores';
import { Convenios } from './pages/admin/Convenios';
import { Insumos } from './pages/admin/Insumos';
import { Contas } from './pages/admin/Contas';
import { GestaoCustos } from './pages/admin/GestaoCustos';
import { IntegracaoBancaria } from './pages/admin/IntegracaoBancaria';
import { DRE } from './pages/admin/DRE';
import { TabelasPrecos } from './pages/admin/faturamento/TabelasPrecos';
import { GuiasAtendimento } from './pages/admin/faturamento/GuiasAtendimento';
import { FechamentoLote } from './pages/admin/faturamento/FechamentoLote';
import { GestaoGlosas } from './pages/admin/faturamento/GestaoGlosas';
import { LancamentosFaturamento } from './pages/admin/faturamento/Lancamentos';
import { Pacientes } from './pages/clinical/Pacientes';
import { PerfilPaciente } from './pages/clinical/PerfilPaciente';
import { Triagem } from './pages/clinical/Triagem';
import { Atendimento } from './pages/clinical/Atendimento';
import { Prescricoes } from './pages/clinical/Prescricoes';
import { IAAssistiva } from './pages/clinical/IAAssistiva';
import { AtendimentosLista } from './pages/clinical/AtendimentosLista';
import { NovoInternamento } from './pages/clinical/NovoInternamento';
import { NovaUrgencia } from './pages/clinical/NovaUrgencia';
import { NovaConsultaEletiva } from './pages/clinical/NovaConsultaEletiva';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/admin" replace />} />

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/unidades" element={<UnidadesSaude />} />
              <Route path="/admin/profissionais" element={<Profissionais />} />
              <Route path="/admin/relatorios" element={<RelatoriosIA />} />
              {/* Cadastros Expandidos */}
              <Route path="/admin/cadastros/fornecedores" element={<Fornecedores />} />
              <Route path="/admin/cadastros/convenios" element={<Convenios />} />
              {/* Estoque & Farmácia */}
              <Route path="/admin/estoque/insumos" element={<Insumos />} />
              {/* Financeiro */}
              <Route path="/admin/financeiro/contas" element={<Contas />} />
              <Route path="/admin/financeiro/custos" element={<GestaoCustos />} />
              <Route path="/admin/financeiro/banco" element={<IntegracaoBancaria />} />
              <Route path="/admin/financeiro/dre" element={<DRE />} />
              {/* Faturamento Hospitalar */}
              <Route path="/admin/faturamento/tabelas" element={<TabelasPrecos />} />
              <Route path="/admin/faturamento/guias" element={<GuiasAtendimento />} />
              <Route path="/admin/faturamento/lotes" element={<FechamentoLote />} />
              <Route path="/admin/faturamento/glosas" element={<GestaoGlosas />} />
              <Route path="/admin/faturamento/lancamentos" element={<LancamentosFaturamento />} />
            </Route>

            {/* Clinical Routes */}
            <Route element={<ProtectedRoute allowedRoles={['MEDICO', 'ENFERMEIRO']} />}>
              <Route path="/clinical/pacientes" element={<Pacientes />} />
              <Route path="/clinical/pacientes/:id" element={<PerfilPaciente />} />
              <Route path="/clinical/triagem" element={<Triagem />} />
              <Route path="/clinical/atendimento" element={<Atendimento />} />
              <Route path="/clinical/prescricoes" element={<Prescricoes />} />
            </Route>

            {/* Atendimento Flow Routes */}
            <Route element={<ProtectedRoute allowedRoles={['MEDICO', 'ENFERMEIRO', 'ADMIN']} />}>
              <Route path="/clinical/atendimentos" element={<AtendimentosLista />} />
              <Route path="/clinical/atendimentos/internamento/novo" element={<NovoInternamento />} />
              <Route path="/clinical/atendimentos/urgencia/novo" element={<NovaUrgencia />} />
              <Route path="/clinical/atendimentos/consulta/novo" element={<NovaConsultaEletiva />} />
            </Route>

            {/* Doctor-only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['MEDICO']} />}>
              <Route path="/clinical/ia" element={<IAAssistiva />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
