import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
// import { api } from '../lib/api';
import { Activity, Lock, Mail, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Mocking login for the visual prototype if API is not available
      // In production, uncomment the API call
      /*
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.user, data.token);
      */
      
      // MOCK LOGIN FOR PROTOTYPE
      setTimeout(() => {
        if (email.includes('admin')) {
          setAuth({ id: '1', name: 'Administrador', email, role: 'ADMIN' }, 'mock-token-admin');
          navigate('/admin');
        } else {
          setAuth({ id: '2', name: 'Dr. Roberto', email, role: 'MEDICO' }, 'mock-token-medico');
          navigate('/clinical/pacientes');
        }
      }, 1000);

    } catch (err) {
      setError('Credenciais inválidas. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500 relative z-10">
        <div className="glass rounded-3xl p-8 sm:p-10 shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary-foreground flex items-center justify-center shadow-lg shadow-primary/20 mb-6">
              <Activity className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground text-center">
              Bem-vindo ao Medi<span className="text-primary">Core</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-2 text-center">
              Acesse o sistema hospitalar integrado
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 animate-in shake">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  required
                  placeholder="Seu e-mail profissional"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  required
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full h-14 rounded-xl font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all flex items-center justify-center",
                isLoading 
                  ? "bg-primary/70 cursor-not-allowed" 
                  : "bg-primary hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Entrar no Sistema'
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Dica: Digite "admin" no email para entrar como Administrador ou qualquer outro para Médico.
          </div>
        </div>
      </div>
    </div>
  );
}
