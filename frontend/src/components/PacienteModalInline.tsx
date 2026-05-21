import { useState, useEffect } from 'react';
import { X, Loader2, Shield } from 'lucide-react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface Paciente {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  sexo: string;
  telefone?: string;
  endereco?: string;
  ativo?: boolean;
}

interface PacienteModalInlineProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paciente: Paciente) => void;
  pacienteIdToEdit?: string | null;
}

interface PForm {
  nome: string;
  cpf: string;
  data_nascimento: string;
  sexo: string;
  telefone: string;
  endereco: string;
  consentimento_lgpd: boolean;
}

const emptyForm: PForm = {
  nome: '',
  cpf: '',
  data_nascimento: '',
  sexo: 'M',
  telefone: '',
  endereco: '',
  consentimento_lgpd: false,
};

export function PacienteModalInline({
  isOpen,
  onClose,
  onSuccess,
  pacienteIdToEdit,
}: PacienteModalInlineProps) {
  const [form, setForm] = useState<PForm>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (pacienteIdToEdit) {
        // Mode: Edit patient
        const loadPaciente = async () => {
          try {
            setLoading(true);
            const { data } = await api.get(`/pacientes/${pacienteIdToEdit}`);
            const p = data.paciente || data;
            setForm({
              nome: p.nome || '',
              cpf: p.cpf || '',
              data_nascimento: p.data_nascimento || '',
              sexo: p.sexo || 'M',
              telefone: p.telefone || '',
              endereco: p.endereco || '',
              consentimento_lgpd: true, // already consented if editing
            });
          } catch (error) {
            toast.error('Erro ao carregar dados do paciente.');
            onClose();
          } finally {
            setLoading(false);
          }
        };
        loadPaciente();
      } else {
        // Mode: Create patient
        setForm(emptyForm);
      }
    }
  }, [isOpen, pacienteIdToEdit, onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.consentimento_lgpd) {
      toast.error('O consentimento LGPD é obrigatório.');
      return;
    }
    setBusy(true);
    try {
      if (pacienteIdToEdit) {
        // Update patient (Note: in mock or SB we update the patient)
        const { data } = await api.put(`/pacientes/${pacienteIdToEdit}`, form);
        toast.success('Paciente atualizado com sucesso!');
        onSuccess(data.paciente || data);
      } else {
        // Create new patient
        const { data } = await api.post('/pacientes', form);
        toast.success('Paciente cadastrado com sucesso!');
        onSuccess(data);
      }
      onClose();
    } catch (error) {
      toast.error('Ocorreu um erro ao salvar o paciente.');
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <h2 className="text-xl font-semibold">
            {pacienteIdToEdit ? 'Editar Paciente' : 'Criar Novo Paciente'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={form.nome}
                onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                placeholder="Ex: Marcos Guilherme Oliveira Lima"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">CPF *</label>
                <input
                  type="text"
                  required
                  value={form.cpf}
                  onChange={(e) => setForm((p) => ({ ...p, cpf: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  Data de Nascimento *
                </label>
                <input
                  type="date"
                  required
                  value={form.data_nascimento}
                  onChange={(e) => setForm((p) => ({ ...p, data_nascimento: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">Sexo *</label>
                <select
                  value={form.sexo}
                  onChange={(e) => setForm((p) => ({ ...p, sexo: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  Telefone
                </label>
                <input
                  type="text"
                  value={form.telefone}
                  onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                  placeholder="(81) 98888-7777"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground">Endereço</label>
              <input
                type="text"
                value={form.endereco}
                onChange={(e) => setForm((p) => ({ ...p, endereco: e.target.value }))}
                className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                placeholder="Rua, Número, Bairro - Cidade/UF"
              />
            </div>

            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/50">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.consentimento_lgpd}
                  onChange={(e) => setForm((p) => ({ ...p, consentimento_lgpd: e.target.checked }))}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div>
                  <div className="flex items-center gap-2 font-medium text-sm text-blue-700">
                    <Shield className="w-4 h-4" /> Consentimento LGPD
                  </div>
                  <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                    Declaro que obtive o consentimento explícito do paciente para a coleta e
                    tratamento dos dados pessoais, conforme a Lei Geral de Proteção de Dados (Lei nº
                    13.709/2018).
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-12 rounded-xl border border-border font-medium hover:bg-secondary transition-colors text-foreground"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5"
              >
                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Paciente'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
