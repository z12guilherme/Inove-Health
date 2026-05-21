import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL?.startsWith('http') ? process.env.SUPABASE_URL : 'https://mock.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'mock-anon-key';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'mock-service-key';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY || !process.env.SUPABASE_SERVICE_KEY) {
    console.warn('AVISO: Variáveis do Supabase não encontradas. Utilizando valores mockados para testes locais.');
}

export const supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

export const supabaseServiceClient = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY
);