# Convenções de Código e Boas Práticas — TreinoPro

Este documento define os padrões obrigatórios de nomenclatura, formatação, qualidade e arquitetura que devem ser respeitados por desenvolvedores humanos e agentes autônomos.

---

## 1. Convenções de Nomenclatura

### 1.1 Arquivos e Diretórios
| Tipo de Artefato | Convenção | Exemplo |
| :--- | :--- | :--- |
| **Componentes Vue** | `PascalCase.vue` | `MuscleBodyMap.vue`, `ExerciseDetailsModal.vue` |
| **Módulos de Domínio e Utils** | `camelCase.js` | `planGenerator.js`, `tdee.js`, `pwaUpdate.js` |
| **Módulos de Banco de Dados** | `camelCase.js` | `indexedDb.js`, `customExercises.js`, `sessions.js` |
| **Testes Unitários** | `*.test.js` | `MuscleBodyMap.test.js`, `tdee.test.js` |
| **Testes E2E (Playwright)** | `kebab-case.spec.js` | `drawer-menu.spec.js`, `exercise-details.spec.js` |
| **Diretórios** | `kebab-case` ou `camelCase` consistente | `src/components/`, `src/utils/`, `src/db/` |

### 1.2 Código JavaScript / Vue
- **Variáveis e Funções:** `camelCase` (ex: `calculateCalories`, `activeSplitId`, `handleExportJSON`).
- **Constantes Globais e Dicionários de Domínio:** `UPPER_SNAKE_CASE` (ex: `MUSCLE_LABELS`, `PATTERN_LABELS`, `BACKUP_VERSION`).
- **Props de Componentes:**
  - Declaração no script: `camelCase` (ex: `userProfile`, `activeMuscles`, `isOpen`).
  - Utilização no template: `kebab-case` (ex: `:user-profile="userProfile"`, `:is-open="isDrawerOpen"`).
- **Eventos Customizados (`emit`):** `kebab-case` objetivo (ex: `close`, `select-muscle`, `open-create-split`, `export-backup`).

### 1.3 Identificadores de DOM e Testabilidade (Regra Crítica)
- Todos os botões, modais, inputs e cards navegáveis **devem obrigatoriamente possuir um `id` explícito em `kebab-case` com prefixo semântico**:
  - Botões de ação: `#btn-<ação>` (ex: `#btn-open-menu`, `#btn-close-drawer`, `#btn-check-${id}`).
  - Abas navegáveis: `#tab-btn-<aba>` (ex: `#tab-btn-workout`, `#tab-btn-detail-muscle`).
  - Modais e painéis: `#<nome>-modal` ou `#<nome>-panel` (ex: `#exercise-details-modal`, `#app-side-drawer`).
  - Campos de entrada: `#input-<campo>` (ex: `#input-weight`, `#input-reps-${id}`).
  - Textos de métrica: `#<contexto>-<métrica>` (ex: `#drawer-user-name`, `#week-progress-text`).

---

## 2. Tipagem e Contratos de Dados (JSDoc)
Como o projeto utiliza JavaScript Vanilla de alta performance com bundler Vite, a consistência de contratos é assegurada via **JSDoc padronizado**.

Exemplo obrigatório em funções de domínio:
```javascript
/**
 * Calcula o Gasto Energético Total (TDEE) com base na fórmula Mifflin-St Jeor.
 * 
 * @param {Object} profile - Dados biométricos do atleta.
 * @param {number} profile.weightKg - Peso em quilogramas (ex: 82.5).
 * @param {number} profile.heightCm - Altura em centímetros (ex: 180).
 * @param {number} profile.ageYears - Idade em anos (ex: 29).
 * @param {'male' | 'female'} profile.gender - Sexo biológico para coeficiente basal.
 * @param {'sedentary' | 'light' | 'moderate' | 'intense'} profile.activityLevel - Fator de atividade.
 * @returns {{ bmr: number, tdee: number, targetDeficitCalories: number }}
 */
export function calculateEnergyExpenditure(profile) { ... }
```

---

## 3. Padrões de Design e UI (Tailwind CSS)

### 3.1 Identidade Visual e Paleta de Cores
- **Azul Atlético Elétrico (Primário / Hipertrofia):** `#0077ff` / `#0084ff` (`from-blue-600 to-indigo-800`).
- **Verde Menta / Performance:** `#00c48c` / `#10b981` (pills de séries `SET 1`, botões de sucesso/check).
- **Laranja Energia / Destaque Muscular:** `#ff6b4a` / `#f97316` (músculos agonistas no mapa anatômico, badges de aviso).
- **Rosa Atlético (Modo Emagrecimento):** `#f43f5e` / `#e11d48` (`from-rose-600 to-orange-700`).
- **Fundos e Superfícies:** `bg-slate-950` (fundo geral), `bg-slate-900` (cards), `border-slate-800` (divisórias).

### 3.2 Acessibilidade e Mobile First
- Todo botão acionável por toque em mobile deve usar a classe utilitária `.tap-btn` (com touch-target mínimo de 44x44px).
- Modais e menus off-canvas devem possuir `role="dialog"`, `aria-modal="true"` e fechamento via tecla `Escape` ou clique no backdrop.
- Todos os campos de texto e labels devem manter taxa de contraste mínima WCAG AA (texto claro sobre fundos escuros).

---

## 4. Anti-padrões Estritamente Proibidos 🚫

1. **PROIBIDO acoplar chamadas de rede diretas em componentes Vue:**
   Toda comunicação externa (como a rota de IA) deve passar pelo adaptador `src/utils/planFromAi.js`.
2. **PROIBIDO utilizar `localStorage` para histórico ou fichas de treino:**
   Dados estruturados de treino pertencem exclusivamente ao IndexedDB (`TreinoProDB`). O `localStorage` é restrito a flags efêmeras.
3. **PROIBIDO remover IDs existentes do DOM:**
   A suíte de testes de ponta a ponta (Playwright) depende dos IDs documentados. Remover ou renomear um ID arbitrariamente é considerado quebra de build.
4. **PROIBIDO usar `eval()` ou comandos que contornem a sanitização:**
   Payloads recebidos de APIs ou importados via JSON de backup devem ser validados e higienizados rigorosamente.
5. **PROIBIDO adicionar pacotes pesados sem justificativa arquitetural:**
   O projeto prioriza performance mobile pura, baixo payload de assets e inicialização instantânea offline. Dependências devem ser leves e aprovadas.
