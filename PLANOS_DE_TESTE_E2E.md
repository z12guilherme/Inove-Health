# Plano de Testes de Ponta a Ponta (E2E) - Inove Health

Este documento descreve os fluxos críticos de negócio para validação do sistema, abrangendo desde o atendimento ambulatorial até a urgência e exportação TISS.

## 1. Módulo de Consultas e Exames (Ambulatorial)

**Objetivo:** Validar o ciclo de vida de um atendimento agendado até o faturamento em lote.

### Cenário 1.1: Ciclo de Atendimento e Documentação
1. **Criação:** Acessar a tela de "Novo Atendimento", selecionar um paciente existente (ou criar via modal), selecionar o convênio e salvar.
2. **Realização:** Alterar o status do atendimento para "Realizado".
3. **Documentação:**
    - **Opção A:** Realizar o upload de um arquivo PDF/Imagem da autorização do convênio.
    - **Opção B:** Abrir o modal de assinatura digital e coletar a assinatura do paciente via tela/tablet.
4. **Verificação:** Validar se o documento anexado ou a assinatura estão salvos no prontuário eletrônico.

### Cenário 1.2: Faturamento e Exportação TISS
1. **Disponibilidade:** Acessar a aba "Faturamento" e verificar se o atendimento realizado no passo anterior aparece na lista de "Pendentes de Faturamento".
2. **Faturamento Individual:** Abrir o atendimento, conferir os itens e clicar em "Faturar".
3. **Geração de Remessa:**
    - Selecionar múltiplos atendimentos (mínimo 3).
    - **Regra de Agrupamento:** Validar se o sistema permite agrupar apenas atendimentos do **mesmo convênio** e **mesmo tipo** (Ex: Consultas).
    - Criar a Remessa.
4. **Exportação:** Dentro da remessa, clicar em "Exportar XML TISS". Validar se o arquivo gerado segue a estrutura XSD da ANS.

---

## 2. Módulo de Urgência e Emergência (Pronto Atendimento)

**Objetivo:** Validar a interoperabilidade entre Recepção, Enfermagem, Médico e áreas de apoio (Farmácia/Laboratório).

### Cenário 2.1: Triagem e Fluxo Clínico
1. **Recepção:** Criar um atendimento de urgência para um novo paciente.
2. **Enfermagem (Triagem):**
    - O paciente deve aparecer na lista de espera da enfermagem.
    - Realizar a triagem (Sinais vitais, escala de dor, classificação de risco por cor).
    - Salvar e enviar para o médico.
3. **Painel de Chamados:**
    - O médico visualiza o paciente na lista de espera (ordenado por prioridade da triagem).
    - O médico clica em "Chamar".
    - **Validação:** O nome do paciente deve ser ditado/exibido no painel de chamadas da sala de espera.

### Cenário 2.2: Prescrição e Integração de Apoio
1. **Atendimento Médico:**
    - O médico inicia o atendimento e visualiza as notas da triagem.
    - **Solicitação de Exames:** O médico solicita um "Hemograma" para o Laboratório.
    - **Solicitação de Materiais/Medicamentos:** O médico prescreve "Dipirona EV" e "Soro Fisiológico" para a Farmácia.
2. **Execução Apoio:**
    - **Laboratório:** Acessar a tela do laboratório, localizar o pedido, marcar como "Realizado/Coletado".
    - **Farmácia:** Acessar a tela de dispensação, localizar a prescrição e confirmar a "Liberação/Baixa".
        - **Validação de Estoque:**
            - Se houver estoque suficiente: Confirmar a "Liberação/Baixa".
            - Se não houver estoque: O sistema deve exibir uma mensagem clara indicando a falta de estoque e a necessidade de dar entrada no item.
        - **Regra de Negócio:** Neste momento, o sistema deve ser indiferente ao convênio e à tabela de preços. A vinculação de valores e códigos (TUSS/Próprio) para cada convênio ocorrerá na etapa de faturamento.
3. **Conta do Paciente:**
    - **Validação Automática:** Abrir a conta do paciente no faturamento.
    - Verificar se o Hemograma, a Dipirona e o Soro foram lançados automaticamente com os valores e códigos (TUSS/Próprio) vinculados ao contrato do convênio específico.

### Cenário 2.3: Auditoria e Fechamento de Conta
1. **Conferência:** O faturista deve abrir o prontuário digital e comparar com os itens lançados na conta (Auditoria de conta).
2. **Fechamento:** Clicar em "Faturar Conta".
3. **Remessa de Urgência:** Criar uma remessa específica para o convênio da urgência, gerar o lote e exportar o XML TISS.

---

## 3. Critérios de Aceite Globais

| ID | Critério | Resultado Esperado |
|:---|:---|:---|
| CA01 | Persistência de Dados | Todos os dados salvos em um módulo devem refletir instantaneamente nos outros. |
| CA02 | Regras de Preço | O valor do material na conta deve ser o definido na tabela de preços do convênio do paciente. |
| CA03 | Validação TISS | O XML exportado deve ser validado com sucesso em um validador oficial de arquivos TISS. |
| CA04 | Painel de Chamada | O áudio do chamado deve ser claro e o nome coincidir com o selecionado pelo médico. |

---

## Próximos Passos
- [ ] Validar integração com Módulo Financeiro (Contas a Receber após faturamento).
- [ ] Testar cancelamentos e estornos de itens de conta.
- [ ] Homologar assinatura digital com certificado ICP-Brasil (se aplicável).