import { createClient } from '@supabase/supabase-js';

// ============================================================
// Configuração do Supabase
// Para ativar: defina USE_MOCK = false em api.ts e preencha
// as variáveis abaixo no arquivo .env do frontend.
//
// VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
// VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
// ============================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidos. ' +
    'O sistema está rodando em modo mock (localStorage).'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// ── Helpers genéricos ────────────────────────────────────────

/** Lista todos os registros de uma tabela, com filtros opcionais */
export async function sbList<T>(
  table: string,
  filters?: Record<string, any>
): Promise<T[]> {
  let query = supabase.from(table).select('*');
  if (filters) {
    Object.entries(filters).forEach(([col, val]) => {
      query = query.eq(col, val);
    });
  }
  const { data, error } = await query.order('criado_em', { ascending: false });
  if (error) throw error;
  return (data ?? []) as T[];
}

/** Busca um registro pelo ID */
export async function sbGetById<T>(table: string, id: string): Promise<T | null> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as T;
}

/** Cria um novo registro */
export async function sbCreate<T>(table: string, payload: Partial<T>): Promise<T> {
  const { data, error } = await supabase
    .from(table)
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as T;
}

/** Atualiza um registro pelo ID */
export async function sbUpdate<T>(
  table: string,
  id: string,
  payload: Partial<T>
): Promise<T> {
  const { data, error } = await supabase
    .from(table)
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as T;
}

/** Remove (soft-delete: seta ativo=false) ou deleta fisicamente */
export async function sbDelete(
  table: string,
  id: string,
  softDelete = true
): Promise<void> {
  if (softDelete) {
    const { error } = await supabase
      .from(table)
      .update({ ativo: false })
      .eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
  }
}
