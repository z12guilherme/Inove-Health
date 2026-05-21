# Planejamento da Interface (Frontend) - Sistema Hospitalar

## 1. Configuração e Arquitetura Inicial
- [x] Inicializar o projeto frontend (Vite + React + TypeScript).
- [x] Configurar biblioteca de roteamento (React Router).
- [ ] Configurar cliente HTTP (ex: Axios) com *interceptors* para injetar o token JWT.
- [x] Definir a biblioteca de UI/Componentes (Tailwind CSS + shadcn/ui).

## 2. Autenticação e Estado Global
- [x] Criar a página de Login (`/login`).
- [x] Implementar store global (Zustand) para armazenar os dados do usuário e o Token.
- [ ] Configurar proteção de rotas (Redirecionar para `/login` quem não tiver token).
- [ ] Criar lógica de controle de acesso Baseado em Papel (RBAC) para ocultar menus que o usuário não tem permissão.

## 3. Visão do Administrador
- [/] **Dashboard Principal**: Conectar a UI existente aos endpoints da API para exibir indicadores dinâmicos.
- [ ] **Gestão de Unidades de Saúde**: CRUD (Criar, Listar, Editar e Inativar) de UPAs/Hospitais.
- [ ] **Gestão de Profissionais**: Formulário para registrar novos Médicos e Enfermeiros.
- [ ] **Relatórios de IA**: Visualização do painel de Inteligência Artificial e geração de relatórios epidemiológicos/surtos.

## 4. Visão do Corpo Clínico (Médicos e Enfermeiros)
- [ ] **Gestão de Pacientes**: Cadastro com aceite dos termos (LGPD) e listagem.
- [ ] **Perfil do Paciente**: Histórico clínico consolidado.
- [ ] **Triagem (Enfermeiros)**: Tela rápida para registro de sinais vitais e classificação de risco (cores).
- [ ] **Atendimento (Médicos)**: Tela de Consulta, diagnósticos (CID-10) e evolução.
- [ ] **Prescrições e Prontuários**: Formulário para prescrição e botão para gerar PDF do prontuário.
- [ ] **IA Assistiva**: Visualização de análise de pacientes recorrentes (exclusivo médicos).

## 5. Polimentos Finais
- [ ] Tratamento global de erros (exibir *toasts*/notificações quando a API retornar erro).
- [ ] Responsividade (O sistema deve ser usável em tablets/celulares, essencial para ambiente hospitalar).