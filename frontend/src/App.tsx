import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/admin/Dashboard';
import { Pacientes } from './pages/clinical/Pacientes';

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
              <Route path="/admin/unidades" element={<div className="p-8">Gestão de Unidades</div>} />
              <Route path="/admin/profissionais" element={<div className="p-8">Gestão de Profissionais</div>} />
              <Route path="/admin/relatorios" element={<div className="p-8">Relatórios de IA</div>} />
            </Route>
            
            {/* Clinical Routes */}
            <Route element={<ProtectedRoute allowedRoles={['MEDICO', 'ENFERMEIRO']} />}>
              <Route path="/clinical/pacientes" element={<Pacientes />} />
              <Route path="/clinical/triagem" element={<div className="p-8">Triagem de Pacientes</div>} />
              <Route path="/clinical/atendimento" element={<div className="p-8">Atendimento Médico</div>} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
