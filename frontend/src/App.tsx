import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/admin/Dashboard';
import { UnidadesSaude } from './pages/admin/UnidadesSaude';
import { Profissionais } from './pages/admin/Profissionais';
import { RelatoriosIA } from './pages/admin/RelatoriosIA';
import { Pacientes } from './pages/clinical/Pacientes';
import { PerfilPaciente } from './pages/clinical/PerfilPaciente';
import { Triagem } from './pages/clinical/Triagem';
import { Atendimento } from './pages/clinical/Atendimento';
import { Prescricoes } from './pages/clinical/Prescricoes';
import { IAAssistiva } from './pages/clinical/IAAssistiva';

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
            </Route>
            
            {/* Clinical Routes */}
            <Route element={<ProtectedRoute allowedRoles={['MEDICO', 'ENFERMEIRO']} />}>
              <Route path="/clinical/pacientes" element={<Pacientes />} />
              <Route path="/clinical/pacientes/:id" element={<PerfilPaciente />} />
              <Route path="/clinical/triagem" element={<Triagem />} />
              <Route path="/clinical/atendimento" element={<Atendimento />} />
              <Route path="/clinical/prescricoes" element={<Prescricoes />} />
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
