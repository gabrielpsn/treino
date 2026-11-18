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

Suíte: **591 testes unitários** (`vitest run`) e **102 testes de navegador**
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
calendário semanal, além de XP/moedas/conquistas e o histórico de caminhada
(que vivem no `localStorage`). `src/db/backup.js` centraliza os dois lados.
Backups antigos, sem esses campos, não apagam o XP nem a caminhada atuais.

A restauração é uma **substituição**, não uma fusão: um backup descreve um estado
completo do app, e aplicar isso por cima de dados diferentes exigiria inventar
regras de conflito. O arquivo é lido e validado **antes** de qualquer escrita, e
`BackupImportModal.vue` mostra o que será trocado (quantas fichas, exercícios,
séries) com o aviso de que os dados atuais serão substituídos. Sem esse passo, o
usuário só descobria a perda depois de confirmar.

O que a validação garante, todos em `parseBackupText()`:

- arquivo que não é JSON, não é backup ou veio de versão mais nova é recusado **sem tocar no banco** — inclusive o formato antigo, sem `kind`/`version`, que nunca teve exercícios próprios nem validação;
- o perfil é coberto campo a campo (`ageYears: "30"` vira `30`, `restrictions: "joelho"` vira `[]`), senão um arquivo editado à mão quebraria `restrictions.includes()` no filtro de segurança;
- ids de série são recalculados a partir de `(sessionId, exerciseId)` e séries sem sessão são descartadas, evitando volume fantasma no histórico;
- o plano importado passa pelo mesmo `filterSafeExercises()` do gerador: exercício que conflita com a restrição do próprio backup é removido e **contado no aviso**, não restaurado em silêncio;
- exercícios próprios passam por `validateCustomExercise()`, então um arquivo não consegue injetar articulação inventada para driblar o filtro, nem sequestrar um id do catálogo de fábrica.

A escrita é uma transação única sobre as sete tabelas: se qualquer passo falhar,
o banco volta ao estado anterior em vez de ficar com o perfil sem plano.

## Filtro de segurança articular

`getSafeExercise()` nunca devolve um exercício que sobrecarregue uma articulação
que o usuário declarou lesionada. A cascata vai do match mais específico ao mais
flexível, e quando nada é seguro retorna `null` e registra um aviso — em vez de
empurrar um movimento contraindicado. O mesmo conjunto de regras
(`conflictsWithRestrictions`, `matchesEquipment`, `isExerciseSafe`,
`filterSafeExercises`) é usado tanto pelo gerador de planos quanto pelo modal de
substituição, para que as duas telas nunca divirjam.

## Geração por IA (Gemini)

A ficha e as metas podem ser sugeridas pelo Gemini, sempre por trás de um proxy
no próprio Worker — a chave nunca chega ao navegador:

1. O cliente envia `POST /api/gemini/plan` com o perfil (objetivo, restrições,
   equipamento, `bmr`/`tdee`) e os ids seguros do catálogo, nunca o catálogo
   inteiro nem dados de saúde sensíveis.
2. O Worker (`worker/index.js`) chama a API do Gemini com timeout de 25 s
   (`REQUEST_TIMEOUT_MS`), rate limit de 8 req/min/IP, checagem de Origin e
   erro traduzido — a resposta bruta do modelo não vaza para fora.
3. O cliente valida a resposta **inteira** antes de trocar a ficha atual
   (`src/engine/ai/planFromAi.js`): só ids existentes no catálogo, sem
   exercício conflitante com restrição declarada, sem duplicata na mesma
   ficha, tamanho dentro do limite e macros coerentes com o TDEE. Qualquer
   violação aborta com mensagem amigável e a ficha atual fica intacta.

Configuração (Cloudflare Workers):

- `wrangler secret put GEMINI_API_KEY` — chave da API do Gemini. **Nunca**
  commitar; se uma chave vazar (chat, log, repositório), revogá-la no console
  do Google e gerar outra.
- `GEMINI_MODEL` (padrão `gemini-3.5-flash`), `GEMINI_API_BASE` (padrão
  `https://generativelanguage.googleapis.com/v1beta`) e `REQUEST_TIMEOUT_MS`
  são opcionais.

## Avaliações (feedback)

`POST /api/feedback` grava cada avaliação no Workers KV (binding `FEEDBACK_KV`),
com chave `fb:<data ISO>:<id>`. O log do Worker registra só nota e categoria,
nunca nome nem contato. Sem o binding configurado, a rota responde `503` e o app
mantém a avaliação como pendente no aparelho, oferecendo o envio por WhatsApp.

Configuração (uma vez):

```bash
npx wrangler kv namespace create FEEDBACK_KV
```

Copie o `id` gerado para o `wrangler.jsonc`:

```jsonc
"kv_namespaces": [{ "binding": "FEEDBACK_KV", "id": "<id gerado>" }]
```

Para ler as avaliações:

```bash
npx wrangler kv key list --binding FEEDBACK_KV --remote --prefix fb:
npx wrangler kv key get --binding FEEDBACK_KV --remote "<chave>"
```

## Evolução corporal, deload, coach e vídeos

- **Evolução Corporal** (menu lateral): peso e medidas por dia (tabela
  `body_metrics`, schema v5), gráfico com média de 7 dias e fotos de progresso
  (`progress_photos`, comprimidas para 1080 px). As fotos **não** entram no
  backup nem na nuvem.
- **Ajuste automático da dieta** (`engine/bodyProgress.js`): regressão linear do
  peso nas últimas 4 semanas comparada à faixa saudável do objetivo. Só sugere
  com pelo menos 4 pesagens em 14 dias, muda no máximo 150 kcal por vez e nunca
  desce abaixo do piso (1200/1500 kcal ou o BMR). Ao aplicar, o carboidrato
  absorve a diferença.
- **Deload automático** (`engine/deload.js`): sugere uma semana leve quando a
  maioria dos exercícios não melhora o 1RM estimado em 3+ sessões, após 8
  semanas seguidas de treino ou com muitas séries até a falha. Aceito, cada
  exercício mostra ~60% da carga e metade das séries.
- **Coach da semana** (aba Histórico): resumo local sempre disponível; a análise
  por IA (`/api/coach/weekly`) recebe só números agregados.
- **Ver execução**: botão de busca no YouTube e link de vídeo próprio por
  exercício (só https de YouTube, Vimeo, Instagram, TikTok ou Drive).

## Recursos online (D1)

Sincronização na nuvem, ligas reais, modo personal e lembretes usam um banco
Cloudflare D1 (binding `DB`). Não há e-mail nem senha: o app cria uma conta
anônima (`id` + token secreto) e mostra ao usuário um **código de acesso**
(`<id>.<token>`). O servidor guarda só o SHA-256 do token.

| Rota | O que faz |
|---|---|
| `POST/DELETE /api/account` | cria a conta anônima / apaga tudo da conta |
| `GET/PUT /api/sync` | baixa/envia o backup (mesmo JSON do botão de backup, sem fotos); `409` se outro aparelho enviou algo mais novo |
| `/api/leagues…` | ligas por código de convite; ranking semanal só com apelidos |
| `/api/trainer…` | turmas do personal, resumo do aluno (com consentimento ao entrar), envio e aceite de fichas |
| `/api/push…` | inscrição dos lembretes (Web Push) |
| `POST /api/coach/weekly` | comentário da IA sobre o resumo numérico da semana |

Configuração (uma vez):

```bash
npx wrangler d1 create overload-db
```

Copie o `database_id` para o `wrangler.jsonc` (bloco `d1_databases`, binding `DB`) e aplique o esquema:

```bash
npx wrangler d1 migrations apply overload-db --remote
```

Lembretes por Web Push precisam de um par de chaves VAPID:

```bash
node scripts/generate-vapid.mjs
```

A chave pública vai em `vars.VAPID_PUBLIC_KEY` no `wrangler.jsonc`; a privada vira secret:

```bash
npx wrangler secret put VAPID_PRIVATE_JWK
```

O Cron Trigger (`*/15 * * * *`) dispara os lembretes vencidos. O push vai sem
payload (só a assinatura VAPID), e o service worker mostra o texto fixo de
`public/push-sw.js`.

Integração com Google Fit / Health Connect **não** é possível num PWA: o
Health Connect só é acessível por app Android nativo, e as APIs do Google Fit
foram descontinuadas.

## Deploy

Push em `main` dispara o GitHub Actions (`.github/workflows/deploy-cloudflare.yml`):

1. Job `verify`: `npm ci`, testes unitários e build.
2. Job `deploy`: só roda se o `verify` passou e o push foi em `main`. Faz o build
   e publica com `wrangler deploy --name treino --compatibility-date 2026-09-23`
   (assets em `./dist` vêm do `wrangler.jsonc`).

Requer o secret `CLOUDFLARE_API_TOKEN`. O `GEMINI_API_KEY` é configurado à
parte com `wrangler secret put` (seção acima), não pelo Actions. A versão do
wrangler é fixada (`wrangler@4`) para que uma publicação não quebre por causa
de um release novo.

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