# TreinoPro

PWA de treino, carga e dieta personalizados para **hipertrofia** ou **emagrecimento**.
Tudo roda offline no próprio dispositivo: não há backend, conta de usuário nem
serviço externo obrigatório. Os dados ficam em IndexedDB (Dexie).

Interface em português (pt-BR).

## Stack

| Camada | Escolha |
|---|---|
| UI | Vue 3 (`<script setup>`), sem router nem store |
| Build | Vite 8 |
| Estilo | Tailwind CSS v4 (configuração CSS-first, sem `tailwind.config.js`) |
| Persistência | Dexie sobre IndexedDB |
| PWA | `vite-plugin-pwa` (Workbox, `autoUpdate`, precache de 9 assets) |
| Testes unitários | Vitest + `@vue/test-utils` + `fake-indexeddb` |
| Testes de navegador | Playwright (E2E + screenshots) |
| Deploy | Cloudflare Worker com assets estáticos, via GitHub Actions |

## Comandos

```bash
npm install

npm run dev          # servidor de desenvolvimento
npm run build        # build de produção em dist/
npm run preview      # serve o dist/ localmente

npm run test         # testes unitários (Vitest)
npm run test:watch   # testes unitários em watch
npm run test:visual  # E2E com Playwright (sobe o dev server sozinho)
npm run verify       # test + build, o que o CI executa
```

## Arquitetura

```
src/
├── main.js                  ponto de entrada
├── App.vue                  componente raiz: todo o estado da aplicação
├── style.css                base Tailwind v4 + estilos globais
├── db/
│   ├── index.js               Dexie/IndexedDB + helpers de semana e migrações
│   └── sessions.js            sessões de treino e séries (leitura/escrita)
├── components/
│   ├── OnboardingModal.vue     wizard de 3 passos (perfil → rotina → ambiente)
│   ├── ExercisePickerModal.vue substituição de exercício com filtro de segurança
│   ├── RestTimer.vue           cronômetro de descanso flutuante
│   └── HistoryPanel.vue        histórico de treinos e volume por semana
└── engine/                   lógica pura, sem dependência de framework
    ├── calculators/tdee.js        Mifflin-St Jeor, TDEE, macros, água, creatina
    ├── generators/planGenerator.js orquestrador do plano completo
    ├── generators/workoutGenerator.js divisões (ABC, Upper/Lower, PPL) e seleção segura
    ├── history.js                 agregações de volume, duração e progressão
    └── knowledge/
        ├── exercises.js      catálogo de 41 exercícios
        └── foodTemplates.js  templates de refeição e suplementos
```

O `engine/` é o coração do app: funções puras, sem imports de Vue, totalmente
cobertas por testes unitários. O `App.vue` cuida só de estado, persistência e
renderização.

Suíte: **184 testes unitários** (`vitest run`) e **20 testes de navegador**
(Playwright, `npm run test:visual`). `npm run verify` roda os unitários e o
build, que é o mesmo gate do CI.

### Modelo de dados

Banco `TreinoProDB`, no schema v3:

| Tabela | Chave | Conteúdo |
|---|---|---|
| `user_profile` | `id` (`current_user`) | Perfil único: biometria, objetivo, rotina, restrições |
| `active_plan` | `id` (`current_active_plan`) | Plano gerado: fisiologia, splits, refeições |
| `workout_logs` | `id` (= `exerciseId`) | Estado **atual** da carga de cada exercício |
| `workout_sessions` | `++id` | Um treino executado: dia, semana, início, fim, ficha |
| `session_sets` | `id` (= `<sessionId>:<exerciseId>`) | Séries registradas dentro de uma sessão |
| `weekly_checks` | `id` (`week:YYYY-Www:dayId`) | Dias concluídos, isolados por semana |
| `custom_exercises` | `id` | Reservado para exercícios próprios (ainda não usado) |

O `weekKey` no calendário existe porque, antes, o dia marcado continuava
marcado na semana seguinte e o confetti disparava toda semana. As linhas
antigas são migradas em tempo de execução por `migrateLegacyWeeklyChecks()`.

`workout_logs` guarda só o último valor digitado por exercício, sobrescrito a
cada treino. Por isso o histórico vive em `workout_sessions`/`session_sets`:
uma sessão por treino, com uma linha por exercício. As duas escritas acontecem
na **mesma transação**, então nunca há carga visível na ficha e ausente do
histórico. A sessão de um dia só é encerrada quando o usuário troca de dia ou
clica em "Concluir treino".

Cargas já registradas antes do schema v3 são convertidas em uma sessão única
por `migrateLegacyLogsToSession()`, que é idempotente e roda a cada abertura —
sem ela, quem usasse o app perderia o histórico na migração.

## Histórico

A aba **Histórico** mostra, a partir das sessões gravadas:

- total de treinos, volume acumulado, séries concluídas e tempo médio;
- volume por semana em barras (`summarizeByWeek()`);
- cada sessão expansível, com carga × reps por exercício.

Na aba de Fichas, cada exercício exibe a **última carga de um treino
anterior**. O treino em andamento é excluído de propósito: o selo existe para
lembrar o que foi feito da última vez, e mostrar o que está sendo digitado
agora seria redundante com o campo. As agregações (volume, duração,
progressão) vivem em `src/engine/history.js`, sem dependência de framework.

## Filtro de segurança articular

`getSafeExercise()` nunca devolve um exercício que sobrecarregue uma articulação
que o usuário declarou lesionada. A cascata vai do match mais específico ao mais
flexível, e quando nada é seguro retorna `null` e registra um aviso — em vez de
empurrar um movimento contraindicado. O mesmo conjunto de regras
(`conflictsWithRestrictions`, `matchesEquipment`, `isExerciseSafe`,
`filterSafeExercises`) é usado tanto pelo gerador de planos quanto pelo modal de
substituição, para que as duas telas nunca divirjam.

## Deploy

Push em `main` dispara o GitHub Actions (`.github/workflows/deploy-cloudflare.yml`):

1. Job `verify`: `npm ci`, testes unitários e build.
2. Job `deploy`: só roda se o `verify` passou e o push foi em `main`. Faz o build
   e publica com `wrangler deploy --assets dist`.

Requer o secret `CLOUDFLARE_API_TOKEN`. A versão do wrangler é fixada
(`wrangler@4`) para que uma publicação não quebre por causa de um release novo.

## Protótipos

`prototype_backup.html` e `prototype_mulher.html` na raiz são protótipos de
arquivo único (Tailwind via CDN, `localStorage`, `innerHTML`) que precederam a
migração para Vue. O app atual é a reescrita desses arquivos, com IndexedDB,
motor de seleção segura, PWA e testes. Nenhum código em `src/` os referencia;
estão mantidos apenas como referência histórica.

## Aviso

O app calcula metas nutricionais e sugere suplementos com base em fórmulas
públicas (Mifflin-St Jeor, recomendações de OMS). **Não substitui avaliação
médica ou acompanhamento de profissional.** Quem tem condição clínica, lesão ou
gestação deve consultar médico ou nutricionista antes de seguir o plano.