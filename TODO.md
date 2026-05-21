# Planejamento da Interface (Frontend) - Sistema Hospitalar

## 1. Configuração e Arquitetura Inicial
- [x] Inicializar o projeto frontend (Vite + React + TypeScript).
- [x] Configurar biblioteca de roteamento (React Router).
- [x] Configurar cliente HTTP (ex: Axios) com *interceptors* para injetar o token JWT.
- [x] Definir a biblioteca de UI/Componentes (Tailwind CSS + shadcn/ui).

## 2. Autenticação e Estado Global
- [x] Criar a página de Login (`/login`).
- [x] Implementar store global (Zustand) para armazenar os dados do usuário e o Token.
- [x] Configurar proteção de rotas (Redirecionar para `/login` quem não tiver token).
- [x] Criar lógica de controle de acesso Baseado em Papel (RBAC) para ocultar menus que o usuário não tem permissão.

## 3. Visão do Administrador
- [x] **Dashboard Principal**: Conectar a UI existente aos endpoints da API para exibir indicadores dinâmicos.
- [x] **Gestão de Unidades de Saúde**: CRUD (Criar, Listar, Editar e Inativar) de UPAs/Hospitais.
- [x] **Gestão de Profissionais**: Formulário para registrar novos Médicos e Enfermeiros.
- [x] **Relatórios de IA**: Visualização do painel de Inteligência Artificial e geração de relatórios epidemiológicos/surtos.

## 4. Visão do Corpo Clínico (Médicos e Enfermeiros)
- [x] **Gestão de Pacientes**: Cadastro com aceite dos termos (LGPD) e listagem.
- [x] **Perfil do Paciente**: Histórico clínico consolidado.
- [x] **Triagem (Enfermeiros)**: Tela rápida para registro de sinais vitais e classificação de risco (cores).
- [x] **Atendimento (Médicos)**: Tela de Consulta, diagnósticos (CID-10) e evolução.
- [x] **Prescrições e Prontuários**: Formulário para prescrição e botão para gerar PDF do prontuário.
- [x] **IA Assistiva**: Visualização de análise de pacientes recorrentes (exclusivo médicos).

## 5. Polimentos Finais
- [x] Tratamento global de erros (exibir *toasts*/notificações quando a API retornar erro).
- [x] Responsividade (O sistema deve ser usável em tablets/celulares, essencial para ambiente hospitalar).

## 6. Gestão de Estoque e Farmácia (Novo)
- [x] **Cadastros de Insumos**: Interface e Mocks concluídos.
- [x] **Controle de Lote e Validade**: Lógica de alertas de vencimento e estoque baixo implementada.
- [x] **Movimentação de Estoque**: Implementado endpoint de entrada de NF e lógica de baixa automática via prescrição.
- [x] **Inventário**: Implementado endpoint para ajuste manual e conferência de estoque.

## 7. Financeiro e Custos (Novo)
- [x] **Contas a Pagar e Receber**: Fluxo de caixa operacional da unidade de saúde. (Back-end local implementado)
- [x] **Gestão de Custos**: Cálculo de custo por atendimento (insumos + honorários + infraestrutura). (Back-end local implementado)
- [x] **Integração Bancária**: Conciliação e geração de boletos/PIX para atendimentos particulares. (Back-end local implementado)
- [x] **DRE de Unidade**: Painel financeiro consolidado por hospital ou clínica. (Back-end local implementado)

## 8. Faturamento Hospitalar (Novo)
- [x] **Tabelas de Preços**: Configuração de tabelas TISS/TUSS para convênios e tabela SUS.
- [x] **Guias de Atendimento**: Geração automática de guias de consulta e SP/SADT.
- [x] **Fechamento de Lote**: Exportação de arquivos XML para envio às operadoras de saúde.
- [x] **Gestão de Glosas**: Painel para acompanhamento e recurso de faturamentos negados.

## 9. Módulo de Laboratório (Novo)
- [x] **Solicitação de Exames**: Interface, Backend e Mock implementados.
- [x] **Coleta e Triagem**: Backend e Mock implementados.
- [x] **Interface de Laudos**: Backend e Mock implementados.
- [x] **Integração LIS**: Endpoint de Webhook criado para integração externa.

## 10. Cadastros Expandidos (Novo)
- [x] **Fornecedores**: Interface e Mocks concluídos.
- [x] **Operadoras e Convênios**: Interface e Mocks concluídos.
- [ ] **Agenda Centralizada**: Gestão de horários e marcação de consultas/exames.

## 11. Relatórios Gerenciais e BI
- [x] **Dashboard Operacional**: Gráficos de volume de atendimentos e tempo de espera. (Interface e Mock concluídos)
- [ ] **Relatório de Consumo**: Curva ABC de medicamentos.
- [ ] **Relatórios de Produtividade**: Desempenho por profissional e por unidade de saúde.
- [ ] **Exportação de Dados**: Possibilidade de baixar relatórios em Excel e CSV para auditorias.

## 12. Infraestrutura e Banco de Dados (Expansão)
- [x] **Refatoração de Estrutura**: Backend isolado na pasta `/backend`.
- [x] **Back-end Local (Express)**: Rotas e importações sincronizadas em `app.ts`.
- [x] **Correção de Tipagem**: Erros TS2345 resolvidos em todos os Controllers.
- [x] **Arquitetura InoveHealth**: Fornecedores, Convênios e Unidades agrupados.
- [x] **Arquitetura Atendimento**: Pacientes, Triagem e Prescrições unificados.
- [x] **Persistência Temporária**: Implementar armazenamento em memória para Unidades de Saúde.
- [x] **Persistência Temporária**: Implementar armazenamento para Fornecedores, Convênios e Insumos (Estoque).
- [x] **Persistência Temporária**: Implementar armazenamento para Contas, Custos, Banco e DRE (Financeiro).
- [x] **Persistência Temporária**: Implementar armazenamento para Exames e BI.
- [ ] **Migração Supabase**: (Pendente) Criar Schemas SQL conforme as novas funcionalidades.

## 13. Melhorias de UX/UI
- [x] **Menu Lateral**: Implementar categorias expansíveis (Accordions) para organizar o grande volume de módulos.
- [x] **Feedback Visual**: Glassmorphism e animações aplicadas no Dashboard de BI e Unidades de Saúde.
- [/] **Navegação**: Páginas de BI e Unidades prontas para integração na Sidebar.
- [ ] **Exportação**: Adicionar botão "Exportar PDF/Excel" nas listagens de estoque e fornecedores.
