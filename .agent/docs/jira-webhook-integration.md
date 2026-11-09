# Guia de Conexão: Jira Automation ➔ TreinoPro Autonomous Agent

Este guia ensina a configurar a automação no **Jira Cloud/Server** para acionar a esteira autônoma no GitHub toda vez que um card/tarefa for movido para **"Em Progresso" (In Progress)**.

---

## 1. Pré-requisito: GitHub Personal Access Token (PAT)
Para que o Jira tenha permissão de disparar o workflow no GitHub:
1. Acesse seu GitHub: **Settings > Developer Settings > Personal Access Tokens > Fine-grained tokens** (ou Classic).
2. Crie um token com permissão de:
   - **Repository permissions > Contents:** Read and write
   - **Repository permissions > Metadata:** Read-only
   - **Repository permissions > Pull requests:** Read and write
3. Copie o token gerado (`ghp_xxxxxxxxxxxx`).

---

## 2. Configurar a Regra de Automação no Jira

1. No seu projeto do Jira, vá em **Project Settings > Automation** (Configurações do Projeto > Automação).
2. Clique em **Create Rule** (Criar Regra).

### 2.1 Trigger (Gatilho):
- Escolha **Issue transitioned** (Transição de item).
- Em **To status**, selecione: `In Progress` (ou `Em Andamento`).

### 2.2 Condição (Opcional, mas recomendado):
- Escolha **Issue fields condition**.
- Campo: **Assignee** (Responsável).
- Condição: `equals` -> `TreinoPro-Bot` (ou se tiver uma label `ai-agent`).

### 2.3 Action (Ação — Disparo do Webhook):
- Escolha **Send web request** (Enviar solicitação web).
- **Web request URL:**
  ```text
  https://api.github.com/repos/gabrielpsn/treino/dispatches
  ```
- **HTTP method:** `POST`
- **Web request headers:**
  - `Accept`: `application/vnd.github.v3+json`
  - `Authorization`: `Bearer ghp_SEU_TOKEN_DO_GITHUB_AQUI`
  - `Content-Type`: `application/json`
  - `User-Agent`: `Jira-Automation-TreinoPro`
- **Web request body:** Selecione `Custom data`.
- **Custom data payload:**
  ```json
  {
    "event_type": "jira_task_trigger",
    "client_payload": {
      "task_id": "{{issue.key}}",
      "task_summary": "{{issue.summary}}"
    }
  }
  ```
- Marque a opção: `Wait for response` (Aguardar resposta).
- Salve e ative a regra (**Turn on rule**).

---

## 3. Como testar o fluxo end-to-end

1. Crie uma tarefa de teste no Jira (ex: `TREINO-101`: "Adicionar novo exercício de tríceps").
2. Arraste a tarefa para a coluna **In Progress**.
3. O Jira enviará o evento para o GitHub.
4. Acesse a aba **Actions** em `https://github.com/gabrielpsn/treino/actions`.
5. Você verá o workflow `Agent Autonomous Dispatcher (Jira & Webhook Trigger)` rodando.
6. Ao finalizar, o bot criará a branch `feature/TREINO-101` e abrirá o Pull Request pronto com o checklist de testes concluídos!
