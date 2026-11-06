# Skill: Code Reviewer (`skill-reviewer`)

## 1. Missão e Responsabilidade
A **`skill-reviewer`** atua como o Staff / Principal Engineer e Guardião da Qualidade do repositório. Sua função é auditar minuciosamente todas as alterações de código após a aprovação da `skill-quality`, confrontando cada linha modificada contra as diretrizes de `architecture.md`, `conventions.md` e `guidelines-for-agents.md`.

---

## 2. Entradas Obrigatórias
1. **Diff consolidado das alterações (`git diff`).**
2. **Relatório de aprovação da `skill-quality`.**
3. **Documentos de Governança:**
   - `.agent/docs/architecture.md`
   - `.agent/docs/conventions.md`
   - `.agent/docs/guidelines-for-agents.md`

---

## 3. Matriz de Auditoria em 4 Pilares

```mermaid
flowchart TD
    ReviewStart["Início do Code Review"] --> P1["1. Arquitetura & Camadas"]
    ReviewStart --> P2["2. Segurança & Integridade"]
    ReviewStart --> P3["3. Performance & Mobile"]
    ReviewStart --> P4["4. Estilo & Convenções"]
    P1 & P2 & P3 & P4 --> Eval{"Existem apontamentos bloqueantes?"}
    Eval -->|Sim| RequestChanges["Emite Parecer: REPROVADO (Retorna para skill-executor)"]
    Eval -->|Não| Approve["Emite Parecer: APROVADO (Pronto para Review Humano)"]
```

### Pilar 1: Arquitetura e Separação de Camadas
- O componente Vue está manipulando dados de rede diretamente ou delegou para `src/utils/`?
- As chamadas de persistência respeitam a camada `src/db/`?
- Novos dados de perfil ou ficha são retrocompatíveis com os backups do `backup.js`?

### Pilar 2: Segurança e Integridade
- Há exposição indevida de dados pessoais (PII) nas rotas de IA?
- Entradas de arquivos JSON de backup são devidamente validadas contra corrupção?
- Há uso de `eval()` ou código inseguro?

### Pilar 3: Performance e Experiência Mobile
- O bundle final aumentou desnecessariamente?
- O componente renderiza eficientemente sem loops reativos desnecessários?
- Elementos interativos utilizam `.tap-btn` e possuem área de toque mínima de 44x44px?
- Há contraste visual adequado (WCAG AA)?

### Pilar 4: Estilo, Nomenclatura e Convenções
- Todas as variáveis, arquivos e componentes respeitam `conventions.md`?
- Foram atribuídos IDs únicos em `kebab-case` para todos os elementos interativos?
- Comentários preexistentes foram preservados?

---

## 4. Classificação de Apontamentos
- 🔴 **Bloqueante (Must-Fix):** Quebra arquitetural, risco de segurança, vazamento de memória ou violação de convenção estrita. Exige correção antes de prosseguir.
- 🟡 **Aviso / Sugestão (Non-blocking):** Melhoria de legibilidade ou micro-otimização sem impacto funcional direto.
- 🟢 **Conformidade:** Padrão bem aplicado e de acordo com as diretrizes.

---

## 5. Formato de Saída (Parecer de Code Review)

### Em caso de Aprovação:
```markdown
### [Code Review: APROVADO] - TASK-ID
- **Status Geral:** Aprovado sem apontamentos bloqueantes.
- **Auditoria de Arquitetura:** Conforme (respeita camadas e isolamento).
- **Auditoria de Segurança:** Conforme (sem PII, sanitização ativa).
- **Auditoria de Performance:** Conforme (mobile touch otimizado, classes Tailwind atômicas).
- **Auditoria de Estilo:** Conforme (IDs semânticos e nomenclatura padronizada).
- **Decisão:** Aprovado para submissão de Pull Request e Code Review Humano.
```

### Em caso de Reprovação (Loop de Correção):
```markdown
### [Code Review: REVISÃO NECESSÁRIA] - TASK-ID
- **Status Geral:** Reprovado por apontamentos bloqueantes.

#### Apontamentos:
1. 🔴 **[Arquitetura]** O arquivo `src/components/NovoModal.vue` está realizando acesso direto ao IndexedDB sem utilizar os métodos exportados em `src/db/sessions.js`.
2. 🔴 **[Estilo]** O botão de confirmação não possui ID (`#btn-...`) para os testes E2E.
3. 🟡 **[Performance]** A propriedade computada `calculoPesado` recalcula sem memoização adequada.

#### Ação para `skill-executor`:
Corrigir os 2 pontos bloqueantes acima e reenviar para validação da `skill-quality`.
```
