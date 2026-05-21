-- ============================================================
-- Inove-Health — Schema SQL para Supabase (PostgreSQL)
-- Execute este script no painel do Supabase:
--   https://app.supabase.com → SQL Editor → New Query
-- ============================================================

-- Habilita UUID automático
create extension if not exists "pgcrypto";

-- ── Tipos ENUM ───────────────────────────────────────────────
create type tipo_unidade   as enum ('UPA', 'HOSPITAL', 'UBS', 'CLINICA');
create type role_usuario   as enum ('ADMIN', 'MEDICO', 'ENFERMEIRO');
create type sexo_paciente  as enum ('M', 'F', 'OUTRO');
create type risco_cores    as enum ('vermelho', 'laranja', 'amarelo', 'verde', 'azul');
create type status_conta   as enum ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO');
create type tipo_conta     as enum ('PAGAR', 'RECEBER');
create type status_fatur   as enum ('PENDENTE', 'FATURADO', 'GLOSADO');
create type status_guia    as enum ('PENDENTE', 'AUTORIZADA', 'NEGADA', 'RECURSO');
create type status_exame   as enum ('SOLICITADO', 'COLETADO', 'LAUDADO', 'CANCELADO');
create type categoria_ins  as enum ('MEDICAMENTO','EPI','MATERIAL_HOSPITALAR','MATERIAL_LABORATORIO','DESCARTAVEL','OUTROS');

-- ── Unidades de Saúde ────────────────────────────────────────
create table unidades_saude (
  id               uuid primary key default gen_random_uuid(),
  nome             text not null,
  tipo             tipo_unidade not null default 'UPA',
  endereco         text,
  telefone         text,
  capacidade_leitos int not null default 0,
  ativo            boolean not null default true,
  criado_em        timestamptz not null default now()
);

-- ── Médicos ──────────────────────────────────────────────────
create table medicos (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  email         text not null unique,
  senha_hash    text,
  crm           text not null unique,
  especialidade text,
  unidade_id    uuid references unidades_saude(id) on delete set null,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now()
);

-- ── Enfermeiros ──────────────────────────────────────────────
create table enfermeiros (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  email         text not null unique,
  senha_hash    text,
  coren         text not null unique,
  especialidade text,
  unidade_id    uuid references unidades_saude(id) on delete set null,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now()
);

-- ── Pacientes ────────────────────────────────────────────────
create table pacientes (
  id               uuid primary key default gen_random_uuid(),
  nome             text not null,
  data_nascimento  date,
  sexo             sexo_paciente,
  cpf              text unique,
  telefone         text,
  email            text,
  endereco         text,
  convenio_id      uuid,
  status           text not null default 'Aguardando Triagem',
  risco            risco_cores,
  aceite_lgpd      boolean not null default false,
  criado_em        timestamptz not null default now()
);

-- ── Triagens ─────────────────────────────────────────────────
create table triagens (
  id                   uuid primary key default gen_random_uuid(),
  paciente_id          uuid not null references pacientes(id) on delete cascade,
  enfermeiro_id        uuid references enfermeiros(id) on delete set null,
  classificacao_risco  risco_cores not null,
  pressao_arterial     text,
  temperatura          numeric(4,1),
  frequencia_cardiaca  int,
  saturacao_o2         int,
  queixa_principal     text,
  observacoes          text,
  criado_em            timestamptz not null default now()
);

-- ── Consultas ────────────────────────────────────────────────
create table consultas (
  id            uuid primary key default gen_random_uuid(),
  paciente_id   uuid not null references pacientes(id) on delete cascade,
  medico_id     uuid references medicos(id) on delete set null,
  diagnostico   text,
  cid10         text,
  evolucao      text,
  plano         text,
  criado_em     timestamptz not null default now()
);

-- ── Prescrições ──────────────────────────────────────────────
create table prescricoes (
  id            uuid primary key default gen_random_uuid(),
  paciente_id   uuid not null references pacientes(id) on delete cascade,
  consulta_id   uuid references consultas(id) on delete set null,
  medico_id     uuid references medicos(id) on delete set null,
  medicamentos  jsonb not null default '[]',
  orientacoes   text,
  criado_em     timestamptz not null default now()
);

-- ── Fornecedores ─────────────────────────────────────────────
create table fornecedores (
  id            uuid primary key default gen_random_uuid(),
  razao_social  text not null,
  nome_fantasia text,
  cnpj          text unique,
  email         text,
  telefone      text,
  endereco      text,
  categoria     text,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now()
);

-- ── Convênios / Operadoras ───────────────────────────────────
create table convenios (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  registro_ans  text,
  tipo          text,
  email         text,
  telefone      text,
  cobertura     text,
  tabela_preco  text,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now()
);

-- ── Insumos / Estoque ────────────────────────────────────────
create table insumos (
  id                uuid primary key default gen_random_uuid(),
  nome              text not null,
  codigo            text unique,
  categoria         categoria_ins not null default 'OUTROS',
  unidade_medida    text not null default 'UN',
  quantidade_atual  numeric(12,2) not null default 0,
  quantidade_minima numeric(12,2) not null default 0,
  lote              text,
  validade          date,
  fornecedor_id     uuid references fornecedores(id) on delete set null,
  fornecedor_nome   text,
  preco_unitario    numeric(12,2) not null default 0,
  localizacao       text,
  ativo             boolean not null default true,
  criado_em         timestamptz not null default now()
);

-- ── Contas Financeiras ───────────────────────────────────────
create table contas_financeiro (
  id               uuid primary key default gen_random_uuid(),
  descricao        text not null,
  tipo             tipo_conta not null,
  valor            numeric(12,2) not null,
  data_vencimento  date not null,
  data_pagamento   date,
  status           status_conta not null default 'PENDENTE',
  criado_em        timestamptz not null default now()
);

-- ── Custos por Atendimento ───────────────────────────────────
create table custos_atendimento (
  id                uuid primary key default gen_random_uuid(),
  paciente          text not null,
  data              date not null,
  medico            text not null,
  custo_insumos     numeric(12,2) not null default 0,
  custo_honorarios  numeric(12,2) not null default 0,
  custo_infra       numeric(12,2) not null default 0,
  custo_total       numeric(12,2) generated always as (custo_insumos + custo_honorarios + custo_infra) stored,
  status_faturamento status_fatur not null default 'PENDENTE',
  criado_em         timestamptz not null default now()
);

-- ── Tabelas de Preços (Faturamento) ─────────────────────────
create table tabelas_precos (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,
  convenio        text,
  tipo            text,
  vigencia_inicio date,
  vigencia_fim    date,
  itens           int not null default 0,
  ativo           boolean not null default true,
  criado_em       timestamptz not null default now()
);

-- ── Guias de Atendimento ─────────────────────────────────────
create table guias_atendimento (
  id            uuid primary key default gen_random_uuid(),
  numero        text not null unique,
  tipo          text not null,
  paciente      text not null,
  convenio      text,
  valor         numeric(12,2) not null default 0,
  status        status_guia not null default 'PENDENTE',
  data_emissao  date not null default current_date,
  criado_em     timestamptz not null default now()
);

-- ── Lotes de Faturamento ─────────────────────────────────────
create table lotes_faturamento (
  id           uuid primary key default gen_random_uuid(),
  numero       text not null unique,
  convenio     text not null,
  competencia  text not null,
  qtd_guias    int not null default 0,
  valor_total  numeric(12,2) not null default 0,
  status       text not null default 'CRIADO',
  data_envio   date,
  criado_em    timestamptz not null default now()
);

-- ── Glosas ──────────────────────────────────────────────────
create table glosas (
  id            uuid primary key default gen_random_uuid(),
  guia          text not null,
  convenio      text not null,
  motivo        text not null,
  valor_glosado numeric(12,2) not null default 0,
  status        text not null default 'PENDENTE',
  data          date not null default current_date,
  criado_em     timestamptz not null default now()
);

-- ── Exames Laboratoriais ─────────────────────────────────────
create table exames_laboratorio (
  id                uuid primary key default gen_random_uuid(),
  paciente_id       uuid references pacientes(id) on delete cascade,
  medico_id         uuid references medicos(id) on delete set null,
  procedimentos     text[] not null default '{}',
  status            status_exame not null default 'SOLICITADO',
  laudo             text,
  data_solicitacao  timestamptz not null default now(),
  data_coleta       timestamptz,
  data_laudo        timestamptz,
  criado_em         timestamptz not null default now()
);

-- ============================================================
-- Row Level Security (RLS)
-- Habilite conforme sua estratégia de autenticação.
-- Por enquanto desabilitado para facilitar testes com anon key.
-- ============================================================
alter table unidades_saude     enable row level security;
alter table medicos             enable row level security;
alter table enfermeiros         enable row level security;
alter table pacientes           enable row level security;
alter table triagens            enable row level security;
alter table consultas           enable row level security;
alter table prescricoes         enable row level security;
alter table fornecedores        enable row level security;
alter table convenios           enable row level security;
alter table insumos             enable row level security;
alter table contas_financeiro   enable row level security;
alter table custos_atendimento  enable row level security;
alter table tabelas_precos      enable row level security;
alter table guias_atendimento   enable row level security;
alter table lotes_faturamento   enable row level security;
alter table glosas              enable row level security;
alter table exames_laboratorio  enable row level security;

-- Política temporária: acesso total para anon (remova em produção!)
create policy "allow_all_anon" on unidades_saude    for all using (true) with check (true);
create policy "allow_all_anon" on medicos           for all using (true) with check (true);
create policy "allow_all_anon" on enfermeiros       for all using (true) with check (true);
create policy "allow_all_anon" on pacientes         for all using (true) with check (true);
create policy "allow_all_anon" on triagens          for all using (true) with check (true);
create policy "allow_all_anon" on consultas         for all using (true) with check (true);
create policy "allow_all_anon" on prescricoes       for all using (true) with check (true);
create policy "allow_all_anon" on fornecedores      for all using (true) with check (true);
create policy "allow_all_anon" on convenios         for all using (true) with check (true);
create policy "allow_all_anon" on insumos           for all using (true) with check (true);
create policy "allow_all_anon" on contas_financeiro for all using (true) with check (true);
create policy "allow_all_anon" on custos_atendimento for all using (true) with check (true);
create policy "allow_all_anon" on tabelas_precos    for all using (true) with check (true);
create policy "allow_all_anon" on guias_atendimento for all using (true) with check (true);
create policy "allow_all_anon" on lotes_faturamento for all using (true) with check (true);
create policy "allow_all_anon" on glosas            for all using (true) with check (true);
create policy "allow_all_anon" on exames_laboratorio for all using (true) with check (true);
