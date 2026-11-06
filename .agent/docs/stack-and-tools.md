# Stack Tecnológica e Ferramental de Desenvolvimento — TreinoPro

## 1. Stack Tecnológica Principal

| Camada | Tecnologia | Versão / Detalhes | Justificativa |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Vue.js 3 | `^3.5.x` | Composition API `<script setup>`, reatividade granular e alto desempenho |
| **Build Tool & Bundler** | Vite | `^6.x` | Compilação instantânea com Rollup/Rolldown, HMR ultrarrápido |
| **Estilização** | Tailwind CSS | `^3.4.x` | Utilitários CSS atômicos, zero runtime overhead, design responsivo mobile |
| **PWA & Offline** | `vite-plugin-pwa` (Workbox) | `^0.21.x` | Precache de assets estáticos, service workers e prompt de ciclo de vida |
| **Banco de Dados Local**| IndexedDB Nativo (`idb` wrapper) | `^8.x` | Armazenamento assíncrono e transacional de grande volume no cliente |
| **Serverless AI Proxy** | Cloudflare Workers | `wrangler` | Proxy edge leve, anônimo e seguro para a API do Google Gemini |
| **Modelo de IA** | Google Gemini 2.5 Flash | API REST | Geração rápida de planos personalizados com latência mínima |
| **Testes Unitários** | Vitest + `@vue/test-utils` | `^3.x` | Execução ultrarrápida nativa com suporte a ESM e jsdom |
| **Testes E2E** | Playwright | `^1.48.x` | Testes completos de fluxos em navegadores headless reais (Chromium) |

---

## 2. Comandos Operacionais do Repositório

### 2.1 Desenvolvimento e Build
```bash
# Iniciar servidor de desenvolvimento local (porta padrão 5173 ou 5176)
npm run dev

# Compilar aplicação para produção e gerar manifesto PWA
npm run build

# Executar preview local do build de produção
npm run preview
```

### 2.2 Testes Automatizados e Qualidade
```bash
# Executar todos os testes unitários via Vitest (modo single-run)
npm test -- --run

# Executar testes unitários com interface visual interativa
npm run test:ui

# Executar suíte de testes de ponta a ponta (Playwright)
npx playwright test

# Executar um arquivo E2E específico com relatório detalhado
npx playwright test tests/e2e/drawer-menu.spec.js --reporter=list

# Visualizar o último relatório gráfico do Playwright
npx playwright show-report
```

### 2.3 Cloudflare Worker (Backend Serverless)
```bash
# Iniciar o Worker localmente com Wrangler
npm run worker:dev

# Fazer o deploy do Worker para produção na Cloudflare
npm run worker:deploy
```

---

## 3. Estrutura de Diretórios do Projeto

```
treino/
├── .agent/                    # Inteligência e governança para agentes autônomos
│   ├── docs/                  # Diretrizes arquiteturais, convenções e regras
│   │   ├── architecture.md
│   │   ├── conventions.md
│   │   ├── stack-and-tools.md
│   │   └── guidelines-for-agents.md
│   └── skills/                # Definições operacionais das skills autônomas
│       ├── skill-planner.md
│       ├── skill-executor.md
│       ├── skill-quality.md
│       └── skill-reviewer.md
├── src/
│   ├── components/            # Componentes Vue 3 reutilizáveis e modais
│   ├── db/                    # Camada IndexedDB (conexão, catálogo, backup, sessões)
│   ├── utils/                 # Lógica pura de domínio (TDEE, planos, progressão, IA)
│   ├── assets/                # Imagens, ícones e recursos estáticos
│   ├── App.vue                # Componente raiz orquestrador
│   └── main.js                # Bootstrap da aplicação
├── tests/
│   ├── unit/                  # Testes unitários Vitest (400+ casos cobrindo utils e components)
│   └── e2e/                   # Testes de ponta a ponta Playwright (fluxos de usuário)
├── worker/
│   └── src/index.js           # Cloudflare Worker proxy para Gemini API
├── index.html                 # Ponto de entrada HTML e meta tags PWA
├── vite.config.js             # Configuração do Vite, Plugins e PWA
├── tailwind.config.js         # Configurações de tema, cores atléticas e telas
└── package.json               # Dependências e scripts do ecossistema
```

---

## 4. Utilitários Internos e Ferramentas Compartilhadas

- **`src/utils/tdee.js`:** Cálculo de calorias basais, déficit e distribuição de macronutrientes.
- **`src/utils/workoutGenerator.js`:** Validação de restrições de lesão e catálogo anatômico.
- **`src/utils/progression.js`:** Histórico de sobrecarga progressiva, volume de séries e RIR.
- **`src/db/backup.js`:** Serializador e validador criptográfico/estrutural de backups JSON.
- **`src/utils/pwaUpdate.js`:** Monitoramento e gatilhos de recarregamento para novas versões em produção.
