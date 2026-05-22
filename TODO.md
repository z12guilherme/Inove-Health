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
- [ ] **Fluxo de Triagem e Anamnese**: Opção para a Enfermagem iniciar a triagem e posteriormente o Médico visualizar a triagem e realizar a Anamnese Médica, mantendo tudo salvo no prontuário.
- [ ] **Assinatura Digital**: Opção de carimbo digital para médicos e enfermeiros nos registros e prontuários.
- [x] **Atendimento (Médicos)**: Tela de Consulta, diagnósticos (CID-10) e evolução.
- [x] **Prescrições e Prontuários**: Formulário para prescrição e botão para gerar PDF do prontuário.
- [x] **IA Assistiva**: Visualização de análise de pacientes recorrentes (exclusivo médicos).

## 5. Polimentos Finais
- [x] Tratamento global de erros (exibir *toasts*/notificações quando a API retornar erro).
- [x] Responsividade (O sistema deve ser usável em tablets/celulares, essencial para ambiente hospitalar).

## 6. Gestão de Estoque e Farmácia
- [x] **Cadastros de Insumos**: Interface e Mocks concluídos.
- [x] **Controle de Lote e Validade**: Lógica de alertas de vencimento e estoque baixo implementada.
- [x] **Movimentação de Estoque**: Implementado endpoint de entrada de NF e lógica de baixa automática via prescrição.
- [x] **Inventário**: Implementado endpoint para ajuste manual e conferência de estoque.

## 7. Financeiro e Custos
- [x] **Contas a Pagar e Receber**: Fluxo de caixa operacional da unidade de saúde.
- [x] **Gestão de Custos**: Cálculo de custo por atendimento (insumos + honorários + infraestrutura).
- [x] **Integração Bancária**: Conciliação e geração de boletos/PIX para atendimentos particulares.
- [x] **DRE de Unidade**: Painel financeiro consolidado por hospital ou clínica.

## 8. Faturamento Hospitalar
- [x] **Tabelas de Preços**: Configuração de tabelas TISS/TUSS, completamente refatorada para serem agrupadas por Convênio específico, suportando edição e exclusão.
- [x] **Lançamentos**: Lançamento automático de faturamento baseando-se no vínculo com tabelas criadas, tabelas SIMPRO e BRASÍNDICE.
- [x] **Mapeamento TISS XML (v4.01.00)**: Mapeamento de tags de cabeçalho, guias, separação estrita de `procedimentosExecutados` (16, 17, 22, 94) e `outrasDespesas` (18, 19, 20, 45, 95-99).
- [x] **Somatórios TISS**: O cálculo total agora desmembra fielmente o valorProcedimentos, valorDiarias, valorMateriais, etc., no rodapé da guia.
- [x] **Gerador de Lotes e Remessas**: Agrupamento de guias e geração de lote XML (Mensagem TISS) em `RemessasTiss.tsx`.
- [ ] **Gestão de Glosas**: Painel para acompanhamento e recurso de faturamentos negados.
- [ ] **Repasses Médicos**: Controle de comissionamento e repasse de honorários médicos após pagamento de convênios.

## 9. Módulo de Laboratório
- [x] **Solicitação de Exames**: Interface, Backend e Mock implementados.
- [x] **Coleta e Triagem**: Backend e Mock implementados.
- [x] **Interface de Laudos**: Backend e Mock implementados.
- [x] **Integração LIS**: Endpoint de Webhook criado para integração externa.

## 10. Cadastros e Agendamento
- [x] **Fornecedores**: Interface e Mocks concluídos.
- [x] **Operadoras e Convênios**: Interface e Mocks concluídos.
- [x] **Agenda Centralizada**: Gestão de horários e marcação de consultas/exames.

## 11. Relatórios Gerenciais e BI
- [x] **Dashboard Operacional**: Gráficos de volume de atendimentos e tempo de espera.
- [x] **Relatório de Consumo**: Curva ABC de medicamentos.
- [x] **Relatórios de Produtividade**: Desempenho por profissional e por unidade de saúde.
- [x] **Exportação de Dados**: Possibilidade de baixar relatórios em Excel e PDF.

## 12. Infraestrutura e Persistência
- [x] **Refatoração de Estrutura**: Backend isolado na pasta `/backend`.
- [x] **Persistência (Local Storage Service)**: Dados persistindo localmente de ponta a ponta (Tabelas, Faturamento, Lotes, Itens de Farmácia, Convênios, Movimentações, etc.).
- [x] **Arquitetura Atendimento**: Pacientes, Triagem e Prescrições unificados.
- [ ] **Migração Supabase (BaaS)**: Criar Schemas SQL conforme as novas funcionalidades e abandonar Local Storage definitivo.

## 13. Melhorias de UX/UI
- [x] **Menu Lateral**: Implementar categorias expansíveis (Accordions) para organizar o grande volume de módulos.
- [x] **Feedback Visual**: Glassmorphism e animações aplicadas nas telas de Unidades, Faturamento e Dashboards.
- [x] **Navegação**: Sidebar 100% funcional com ícones e links.
- [x] **Exportação**: Adicionado botão "Exportar PDF/Excel" nas listagens de estoque e fornecedores.