#!/usr/bin/env bash
# ==============================================================================
# TreinoPro — Script Orquestrador de Tarefas Autônomas
# Executa o loop SDLC: Planejamento -> Validação de Qualidade -> Commit e Push
# Uso: ./scripts/agent-task-runner.sh <TASK_ID> "<TASK_SUMMARY>" [FLAGS]
# Exemplo: ./scripts/agent-task-runner.sh TREINO-42 "Adicionar filtro por repetições"
# ==============================================================================

set -euo pipefail

# Cores para feedback no terminal
C_RESET="\033[0m"
C_BOLD="\033[1m"
C_BLUE="\033[34m"
C_GREEN="\033[32m"
C_YELLOW="\033[33m"
C_RED="\033[31m"
C_CYAN="\033[36m"

log_info() {
  echo -e "${C_CYAN}${C_BOLD}[INFO]${C_RESET} $*"
}

log_step() {
  echo -e "\n${C_BLUE}${C_BOLD}==> $*${C_RESET}"
}

log_success() {
  echo -e "${C_GREEN}${C_BOLD}[SUCCESS]${C_RESET} $*"
}

log_warn() {
  echo -e "${C_YELLOW}${C_BOLD}[WARN]${C_RESET} $*"
}

log_error() {
  echo -e "${C_RED}${C_BOLD}[ERROR]${C_RESET} $*"
}

# ------------------------------------------------------------------------------
# 1. Validação de Argumentos
# ------------------------------------------------------------------------------
TASK_ID="${1:-}"
TASK_SUMMARY="${2:-}"
SKIP_E2E="${SKIP_E2E:-0}"

if [ -z "$TASK_ID" ]; then
  log_error "O identificador da tarefa (TASK_ID) é obrigatório."
  echo "Uso: ./scripts/agent-task-runner.sh <TASK_ID> \"<TASK_SUMMARY>\""
  echo "Exemplo: ./scripts/agent-task-runner.sh TREINO-101 \"Adicionar timer sonoro\""
  exit 1
fi

if [ -z "$TASK_SUMMARY" ]; then
  TASK_SUMMARY="implementação da tarefa $TASK_ID"
fi

BRANCH_NAME="feature/${TASK_ID}"
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$BASE_DIR"

log_step "Iniciando Esteira Autônoma para ${C_BOLD}${TASK_ID}${C_RESET}"
log_info "Resumo: $TASK_SUMMARY"
log_info "Diretório base: $BASE_DIR"
log_info "Branch de trabalho: $BRANCH_NAME"

# ------------------------------------------------------------------------------
# 2. Preparação de Branch Git
# ------------------------------------------------------------------------------
log_step "Etapa 1/4: Preparação de Ambiente e Branch Git"

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
log_info "Branch atual: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "$BRANCH_NAME" ]; then
  if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
    log_info "Branch $BRANCH_NAME já existe localmente. Alternando..."
    git checkout "$BRANCH_NAME"
  else
    log_info "Criando nova branch $BRANCH_NAME a partir de $CURRENT_BRANCH..."
    git checkout -b "$BRANCH_NAME"
  fi
else
  log_info "Já operando na branch $BRANCH_NAME."
fi

# ------------------------------------------------------------------------------
# 3. Verificação de Governança e Diretrizes (.agent/docs)
# ------------------------------------------------------------------------------
log_step "Etapa 2/4: Auditoria de Diretrizes e Governança (.agent/)"

REQUIRED_DOCS=(
  ".agent/docs/architecture.md"
  ".agent/docs/conventions.md"
  ".agent/docs/stack-and-tools.md"
  ".agent/docs/guidelines-for-agents.md"
)

for doc in "${REQUIRED_DOCS[@]}"; do
  if [ ! -f "$doc" ]; then
    log_error "Documento essencial ausente: $doc"
    exit 1
  fi
done
log_success "Todas as diretrizes arquiteturais e regras operacionais estão presentes."

# ------------------------------------------------------------------------------
# 4. Loop de Validação da Qualidade (Quality Gate)
# ------------------------------------------------------------------------------
log_step "Etapa 3/4: Loop de Validação da Qualidade (Quality Gate)"

MAX_ITERATIONS=3
ITERATION=1
SUCCESS=0

while [ "$ITERATION" -le "$MAX_ITERATIONS" ]; do
  echo ""
  log_info "Iteração de validação: ${ITERATION} de ${MAX_ITERATIONS}..."

  # 1. Validação de Build de Produção
  log_info "[1/2] Executando verificação de build (npm run build)..."
  if npm run build; then
    log_success "Build de produção concluído com sucesso."
  else
    log_error "Falha na geração do build de produção (Iteração $ITERATION)."
    ITERATION=$((ITERATION + 1))
    continue
  fi

  # 2. Validação de Testes Unitários
  log_info "[2/2] Executando suíte completa de testes unitários (Vitest)..."
  if npm test -- --run; then
    log_success "Todos os testes unitários foram aprovados."
    SUCCESS=1
    break
  else
    log_error "Falha nos testes unitários (Iteração $ITERATION)."
    ITERATION=$((ITERATION + 1))
  fi
done

if [ "$SUCCESS" -ne 1 ]; then
  log_error "Limite de $MAX_ITERATIONS iterações atingido sem estabilização técnica."
  log_error "A esteira requer intervenção humana para resolução do apontamento."
  exit 1
fi

log_success "Quality Gate 100% aprovado!"

# ------------------------------------------------------------------------------
# 5. Consolidação de Git Commit e Finalização
# ------------------------------------------------------------------------------
log_step "Etapa 4/4: Consolidação das Alterações e Git Commit"

if [ -z "$(git status --porcelain)" ]; then
  log_warn "Nenhuma alteração de código pendente para commit."
  log_info "A branch $BRANCH_NAME está sincronizada e limpa."
else
  log_info "Adicionando arquivos modificados ao índice git..."
  git add .
  
  COMMIT_MSG="feat(${TASK_ID}): ${TASK_SUMMARY}"
  log_info "Gerando commit: ${C_BOLD}${COMMIT_MSG}${C_RESET}"
  git commit -m "$COMMIT_MSG"
  log_success "Commit gerado com sucesso!"
fi

echo ""
echo -e "${C_GREEN}${C_BOLD}==============================================================================${C_RESET}"
echo -e "${C_GREEN}${C_BOLD}  ESTEIRA AUTÔNOMA CONCLUÍDA COM SUCESSO!${C_RESET}"
echo -e "${C_GREEN}${C_BOLD}==============================================================================${C_RESET}"
echo -e "Tarefa:    ${C_BOLD}${TASK_ID}${C_RESET} (${TASK_SUMMARY})"
echo -e "Branch:    ${C_BOLD}${BRANCH_NAME}${C_RESET}"
echo -e "Próximo passo sugerido:"
echo -e "  git push -u origin ${BRANCH_NAME}"
echo -e "  Ou abra o PR diretamente no GitHub para revisão humana."
echo ""
