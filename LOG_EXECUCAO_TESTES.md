# Log de Execução de Testes Manuais - Inove Health

**Data:** 22/05/2026  
**Responsável:** [Seu Nome]  
**Status Geral:** 🔄 Em Execução

## 1. Fluxo Ambulatorial
| Passo | Ação | Status | Observações |
| :--- | :--- | :--- | :--- |
| 1.1 | Criar atendimento (Moura) | [ ] | |
| 1.2 | Marcar como Realizado | [ ] | |
| 1.3 | Coletar Assinatura Digital | [ ] | Verificar legibilidade na tela |
| 1.4 | Aparecer na aba Faturamento | [ ] | |
| 1.5 | Criar Remessa (Lote) | [ ] | Testar restrição de convênio/tipo |
| 1.6 | Exportar XML TISS | [ ] | Abrir arquivo e checar tags <ans> |

## 2. Fluxo de Urgência (P.A)
| Passo | Ação | Status | Observações |
| :--- | :--- | :--- | :--- |
| 2.1 | Recepção -> Triagem | [ ] | |
| 2.2 | Painel de Chamada (Áudio) | [ ] | O som do nome está claro? |
| 2.3 | Iniciar Atendimento Médico | [ ] | Notas da triagem aparecem? |
| 2.4 | Solicitar Hemograma (LAB) | [ ] | |
| 2.5 | Solicitar Jelco (FARM) | [ ] | |

## 3. Farmácia e Estoque
| Passo | Ação | Status | Observações |
| :--- | :--- | :--- | :--- |
| 3.1 | Baixa de item SEM estoque | [ ] | Validar mensagem de erro/entrada |
| 3.2 | Baixa de item COM estoque | [ ] | |
| 3.3 | Verificação de valor (Moura) | [ ] | Deve ser R$ 70,00 no faturamento |
| 3.4 | Verificação de valor (Hapvida)| [ ] | Deve ser R$ 80,00 no faturamento |

## 4. Fechamento e TISS
| Passo | Ação | Status | Observações |
| :--- | :--- | :--- | :--- |
| 4.1 | Conferência Prontuário vs Conta| [ ] | |
| 4.2 | Faturamento da Conta | [ ] | |
| 4.3 | Exportação XML Urgência | [ ] | |

---
**Notas de Bug / Melhorias:**
- 