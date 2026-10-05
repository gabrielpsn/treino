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
│   ├── sessions.js            sessões de treino e séries (leitura/escrita)
│   ├── customExercises.js     CRUD de exercícios próprios + catálogo mesclado
│   └── backup.js              exportação e restauração de todos os dados
├── components/
│   ├── OnboardingModal.vue     wizard de 3 passos (perfil → rotina → ambiente)
│   ├── ExercisePickerModal.vue substituição ou adição de exercício com filtro de segurança
│   ├── CustomExercisesModal.vue CRUD de exercícios próprios
│   ├── BackupImportModal.vue   confirmação antes de substituir os dados
│   ├── RestTimer.vue           cronômetro de descanso flutuante
│   └── HistoryPanel.vue        histórico de treinos e volume por semana
└── engine/                   lógica pura, sem dependência de framework
    ├── calculators/tdee.js        Mifflin-St Jeor, TDEE, macros, água, creatina
    ├── generators/planGenerator.js orquestrador do plano completo
    ├── generators/workoutGenerator.js divisões (ABC, Upper/Lower, PPL) e seleção segura
    ├── history.js                 agregações de volume, duração e progressão
    └── knowledge/
        ├── exercises.js      catálogo de 60 exercícios
        └── foodTemplates.js  templates de refeição e suplementos
```

O `engine/` é o coração do app: funções puras, sem imports de Vue, totalmente
cobertas por testes unitários. O `App.vue` cuida só de estado, persistência e
renderização.

Suíte: **289 testes unitários** (`vitest run`) e **44 testes de navegador**
(Playwright, `npm run test:visual`). `npm run verify` roda os unitários e o
build, que é o mesmo gate do CI.

### Modelo de dados

Banco `TreinoProDB`, no schema v4:

| Tabela | Chave | Conteúdo |
|---|---|---|
| `user_profile` | `id` (`current_user`) | Perfil único: biometria, objetivo, rotina, restrições |
| `active_plan` | `id` (`current_active_plan`) | Plano gerado: fisiologia, splits, refeições |
| `workout_logs` | `id` (= `exerciseId`) | Estado **atual** da carga de cada exercício |
| `workout_sessions` | `++id` | Um treino executado: dia, semana, início, fim, ficha |
| `session_sets` | `id` (= `<sessionId>:<exerciseId>`) | Séries registradas dentro de uma sessão |
| `weekly_checks` | `id` (`week:YYYY-Www:dayId`) | Dias concluídos, isolados por semana |
| `custom_exercises` | `id`, `muscle`, `[muscle+pattern]` | Exercícios criados pelo usuário |

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

## Exercícios próprios

`+ Meus exercícios` abre o CRUD (`CustomExercisesModal.vue`). O exercício criado
pelo usuário entra no mesmo catálogo embutido e passa pelos mesmos filtros de
equipamento e restrição articular — não existe atalho para contornar uma
restrição.

O `id` é um slug derivado do nome (`custom_supino_na_arquinha`) e **não** muda
quando o exercício é renomeado: o id é a chave de `workout_logs` e
`session_sets`, então recalculá-lo deixaria todo o histórico de cargas órfão.
Os exercícios próprios também entram **antes** do catálogo de fábrica no
catálogo mesclado (`buildFullCatalog()`), senão nunca seriam escolhidos: a
fábrica já cobre todos os slots.

## Editor de ficha

Cada exercício na ficha ativa tem três ações — trocar, reordenar (↑ ↓) e remover.
O botão `+ Adicionar exercício` abre o seletor em modo de adição, que já vem com
o grupo muscular e as restrições do perfil aplicados.

Tudo passa por `mutateSplitExercises()` (`App.vue`), que trata o mesmo cuidado nos
três casos: o log de treino é chaveado por `exerciseId`, então um exercício que
sai da ficha tem o log apagado **na mesma transação** que grava o plano, e a UI
só é atualizada depois que a escrita termina. Exercício duplicado dentro da
mesma ficha é recusado com aviso.

## Backup e restauração

Os botões 💾 e 📂 no cabeçalho exportam e restauram **todos** os dados do
usuário: perfil, plano, exercícios próprios, cargas, sessões, séries e
calendário semanal. `src/db/backup.js` centraliza os dois lados.

A restauração é uma **substituição**, não uma fusão: um backup descreve um estado
completo do app, e aplicar isso por cima de dados diferentes exigiria inventar
regras de conflito. O arquivo é lido e validado **antes** de qualquer escrita, e
`BackupImportModal.vue` mostra o que será trocado (quantas fichas, exercícios,
séries) com o aviso de que os dados atuais serão substituídos. Sem esse passo, o
usuário só descobria a perda depois de confirmar.

O que a validação garante, todos em `parseBackupText()`:

- arquivo que não é JSON, não é backup ou veio de versão mais nova é recusado **sem tocar no banco**;
- o perfil é coberto campo a campo (`ageYears: "30"` vira `30`, `restrictions: "joelho"` vira `[]`), senão um arquivo editado à mão quebraria `restrictions.includes()` no filtro de segurança;
- ids de série são recalculados a partir de `(sessionId, exerciseId)` e séries sem sessão são descartadas, evitando volume fantasma no histórico;
- o plano importado passa pelo mesmo `filterSafeExercises()` do gerador: exercício que conflita com a restrição do próprio backup é removido e **contado no aviso**, não restaurado em silêncio;
- exercícios próprios passam por `validateCustomExercise()`, então um arquivo não consegue injetar articulação inventada para driblar o filtro, nem sequestrar um id do catálogo de fábrica.

A escrita é uma transação única sobre as sete tabelas: se qualquer passo falhar,
o banco volta ao estado anterior em vez de ficar com o perfil sem plano.

Backups antigos (sem `kind`/`version`, exportados antes do formato versionado) são
aceitos com aviso — o usuário tem um arquivo legítimo na mão e recusar tudo por
falta de um campo seria o pior resultado possível.

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