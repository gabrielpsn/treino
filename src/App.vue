<template>
  <div class="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-[#F59E0B] selection:text-[#0F172A]">
    
    <!--
      Paleta Athletic Clean Pro (Opção 1):
      Cor Primária: #0066FF (Azul Royal Cobalto)
      Destaques e CTAs: #F59E0B (Âmbar Ouro Energético)
      Fundos de cards e containers: #FFFFFF (Bordas #E2E8F0, Sub-cards #F8FAFC)
      Fundo Geral: #F8FAFC
      Texto Principal: #0F172A
      Texto Secundário / Labels: #64748B
    -->
    <header class="border-b border-[#0052cc] bg-[#0066FF] text-white sticky top-0 z-20 shadow-md">
      <div class="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        
        <!-- Lado Esquerdo: Hambúrguer + Logo/Avatar + Título -->
        <div class="flex items-center gap-2.5 min-w-0">
          <!-- Botão Hambúrguer para Abrir o Menu Lateral -->
          <button 
            type="button"
            id="btn-open-menu"
            @click="isDrawerOpen = true"
            aria-label="Abrir menu lateral de opções"
            class="tap-btn p-2 -ml-1 rounded-xl text-white hover:bg-white/20 bg-white/10 transition-colors flex items-center justify-center text-lg font-bold shadow-xs"
            title="Abrir menu de opções"
          >
            <span aria-hidden="true">☰</span>
          </button>

          <div 
            class="w-9 h-9 rounded-xl flex items-center justify-center bg-white/20 border border-white/30 text-white shadow-sm font-black text-base transition-colors flex-shrink-0"
          >
            {{ isWeightLoss ? '🔥' : '⚡' }}
          </div>

          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h1 id="app-title" class="text-sm sm:text-base font-black tracking-tight text-white uppercase truncate">
                {{ appTitle }}
              </h1>
              <span 
                class="text-[10px] px-2 py-0.5 rounded-full font-bold border border-[#D97706] bg-[#F59E0B] text-[#0F172A] shadow-xs flex-shrink-0"
              >
                {{ goalBadge }}
              </span>
            </div>
            <p id="app-user-subtitle" class="text-[11px] text-white/80 flex items-center gap-1.5 truncate">
              <span class="text-white font-semibold">Olá, {{ userProfile?.userName || 'Atleta' }}</span>
              <span>•</span>
              <span class="font-bold text-[#F59E0B]">
                {{ userProfile?.weightKg }} kg
              </span>
            </p>
          </div>
        </div>

      </div>

      <!-- input escondido: acionado pelo menu lateral para importar arquivo JSON -->
      <input
        id="input-backup-file"
        ref="backupFileInput"
        type="file"
        accept="application/json,.json"
        class="sr-only"
        @change="handleBackupFileSelected"
      />
    </header>

    <!-- Navegação por Abas Principais (Treino, Nutrição, Frequência) -->
    <nav class="border-b border-[#E2E8F0] bg-white backdrop-blur sticky top-0 z-30 shadow-xs">
      <div class="max-w-5xl mx-auto px-4 flex items-center justify-between gap-2 overflow-x-auto py-2">
        <div class="flex items-center gap-2" role="tablist" aria-label="Seções do aplicativo">
          <button 
            id="tab-btn-workout"
            role="tab"
            :aria-selected="currentMainTab === 'workout'"
            aria-controls="screen-workout"
            @click="currentMainTab = 'workout'"
            :class="currentMainTab === 'workout' ? 'bg-[#F59E0B] text-[#0F172A] font-bold shadow-xs' : 'text-[#64748B] hover:text-[#0066FF] hover:bg-[#F1F5F9] font-medium'"
            class="tap-btn px-4 py-2 rounded-xl text-xs md:text-sm transition-all flex items-center gap-2 flex-shrink-0"
          >
            <span>🏋️</span> Fichas de Treino
          </button>

          <button 
            id="tab-btn-nutrition"
            role="tab"
            :aria-selected="currentMainTab === 'nutrition'"
            aria-controls="screen-nutrition"
            @click="currentMainTab = 'nutrition'"
            :class="currentMainTab === 'nutrition' ? 'bg-[#F59E0B] text-[#0F172A] font-bold shadow-xs' : 'text-[#64748B] hover:text-[#0066FF] hover:bg-[#F1F5F9] font-medium'"
            class="tap-btn px-4 py-2 rounded-xl text-xs md:text-sm transition-all flex items-center gap-2 flex-shrink-0"
          >
            <span>🥗</span> Dieta & Metas
          </button>

          <button
            id="tab-btn-frequency"
            role="tab"
            :aria-selected="currentMainTab === 'frequency'"
            aria-controls="screen-frequency"
            @click="currentMainTab = 'frequency'"
            :class="currentMainTab === 'frequency' ? 'bg-[#F59E0B] text-[#0F172A] font-bold shadow-xs' : 'text-[#64748B] hover:text-[#0066FF] hover:bg-[#F1F5F9] font-medium'"
            class="tap-btn px-4 py-2 rounded-xl text-xs md:text-sm transition-all flex items-center gap-2 flex-shrink-0"
          >
            <span>📅</span> Calendário Semanal
          </button>

          <button
            id="tab-btn-history"
            role="tab"
            :aria-selected="currentMainTab === 'history'"
            aria-controls="screen-history"
            @click="openHistoryTab"
            :class="currentMainTab === 'history' ? 'bg-[#F59E0B] text-[#0F172A] font-bold shadow-xs' : 'text-[#64748B] hover:text-[#0066FF] hover:bg-[#F1F5F9] font-medium'"
            class="tap-btn px-4 py-2 rounded-xl text-xs md:text-sm transition-all flex items-center gap-2 flex-shrink-0"
          >
            <span>📈</span> Histórico
          </button>
        </div>

        <button 
          id="btn-reset-weights"
          @click="resetAllProgress"
          class="tap-btn text-xs text-[#64748B] hover:text-rose-500 transition-colors px-2 py-1 flex-shrink-0 font-medium"
        >
          Zerar Histórico
        </button>
      </div>
    </nav>

    <!-- Aviso legal: o app calcula metas e sugere suplementos por fórmula
         publicada e não substitui avaliação médica ou profissional. -->
    <div id="medical-disclaimer" class="border-b border-[#E2E8F0] bg-white">
      <p class="max-w-5xl mx-auto px-4 py-2 text-[11px] text-[#64748B] leading-relaxed">
        <strong class="text-[#0F172A]">Aviso:</strong> as metas são calculadas por
        fórmulas públicas (Mifflin-St Jeor, faixas da OMS) e não substituem avaliação médica.
        Com dor, lesão ou condição clínica, consulte um profissional antes de seguir o plano.
      </p>
    </div>

    <!-- Conteúdo Principal -->
    <main class="max-w-5xl mx-auto px-4 py-6 pb-28 md:pb-20 flex-1 w-full space-y-6">

      <!-- WIDGET DE STATUS DE GAMIFICAÇÃO (Patente, Nível, XP, Ofensiva e Escudos) -->
      <GamificationIronStatus
        :total-xp="gamificationState.totalXp"
        :streak="gamificationState.weeklyStreak"
        :shields="gamificationState.shieldsCount"
      />

      <!-- BANNER DE BOAS-VINDAS / RESUMO INTELIGENTE -->
      <div v-if="activePlan?.physiology" id="banner-physiology-summary" class="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4 text-[#0F172A]">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold uppercase tracking-wider text-[#0066FF]">
              {{ isWeightLoss ? 'Diagnóstico & Déficit Calórico' : 'Metas Diárias Calculadas' }}
            </span>
            <span v-if="isCustomNutritionActive" class="text-[10px] bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/20 px-2 py-0.5 rounded-full font-semibold">
              Metas Customizadas
            </span>
          </div>
          <h2 class="text-base sm:text-lg font-bold text-[#0F172A] mt-0.5">
            {{ isWeightLoss ? 'Meta Nutricional:' : 'Superávit Anabólico:' }}
            <span class="text-[#0066FF]">{{ effectiveTargetCalories }} kcal</span> / dia
          </h2>
          <p class="text-xs text-[#64748B] mt-1">
            Proteína: <strong class="text-[#0F172A]">{{ effectiveMacros.proteinGrams }}g</strong> • 
            Carboidrato: <strong class="text-[#0F172A]">{{ effectiveMacros.carbsGrams }}g</strong> • 
            Gorduras: <strong class="text-[#0F172A]">{{ effectiveMacros.fatGrams }}g</strong>
            <span v-if="activePlan.physiology.imc"> • IMC: <strong class="text-[#0F172A]">{{ activePlan.physiology.imc }} ({{ activePlan.physiology.imcStatus }})</strong></span>
          </p>
        </div>

        <div class="flex items-center gap-3">
          <div class="bg-[#F8FAFC] px-3.5 py-2 rounded-xl border border-[#E2E8F0] text-center shadow-xs">
            <span class="block text-[10px] text-[#64748B] uppercase font-semibold">Água / Dia</span>
            <span class="text-sm font-bold text-[#0066FF]">{{ activePlan.physiology.water.liters }} L</span>
          </div>
          <div class="bg-[#F8FAFC] px-3.5 py-2 rounded-xl border border-[#E2E8F0] text-center shadow-xs">
            <span class="block text-[10px] text-[#64748B] uppercase font-semibold">Creatina</span>
            <span class="text-sm font-bold text-[#F59E0B]">{{ activePlan.physiology.creatine }}g</span>
          </div>
        </div>
      </div>

      <!-- SEÇÃO EXCLUSIVA DE EMAGRECIMENTO: DIAGNÓSTICO E CRONOGRAMA EM FASES -->
      <section v-if="isWeightLoss && activePlan?.physiology" id="section-weight-loss-diagnosis" class="bg-white border border-[#E2E8F0] rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden text-[#0F172A]">
        <div class="border-b border-[#E2E8F0] pb-3 mb-4 flex items-center justify-between">
          <div>
            <span class="text-xs font-bold tracking-widest text-[#0066FF] uppercase">Cronograma de Emagrecimento Saudável</span>
            <h3 class="text-lg font-extrabold text-[#0F172A] mt-0.5">Metas Sustentáveis (Sem Efeito Sanfona)</h3>
          </div>
          <span class="text-xs bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1 rounded-full font-bold">
            Ritmo: 2 a 3 kg/mês
          </span>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div class="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs">
            <span class="text-xs text-[#64748B] font-medium">Peso Atual</span>
            <div class="text-xl font-black text-[#0F172A] mt-1">{{ userProfile?.weightKg }} kg</div>
            <p class="text-[11px] text-[#F59E0B] mt-0.5">IMC: {{ activePlan.physiology.imc }}</p>
          </div>
          <div class="p-3.5 rounded-2xl bg-[#F8FAFC] border border-rose-200 shadow-xs">
            <span class="text-xs text-rose-500 font-medium">Faixa Saudável (OMS)</span>
            <div class="text-xl font-black text-[#0F172A] mt-1">{{ activePlan.physiology.healthyWeightRange }}</div>
            <p class="text-[11px] text-[#64748B] mt-0.5">Prevenção articular e metabólica</p>
          </div>
          <div class="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs">
            <span class="text-xs text-[#64748B] font-medium">Meta Estimada</span>
            <div class="text-xl font-black mt-1" :class="activePlan.physiology.targetWeightDiff > 0 ? 'text-rose-500' : 'text-emerald-500'">
              {{ activePlan.physiology.targetWeightText }}
            </div>
            <p class="text-[11px] text-[#64748B] mt-0.5">
              {{ activePlan.physiology.targetWeightDiff > 0 ? 'Fase 1: -5 a -7 kg de retenção' : 'Você já está na faixa saudável' }}
            </p>
          </div>
          <div class="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs">
            <span class="text-xs text-[#64748B] font-medium">Prazo Recomendado</span>
            <div class="text-xl font-black text-[#0F172A] mt-1">6 a 10 Meses</div>
            <p class="text-[11px] text-emerald-600 mt-0.5">Consistência e massa magra</p>
          </div>
        </div>

        <div class="grid sm:grid-cols-3 gap-3 text-xs">
          <div class="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs">
            <strong class="text-rose-600 block mb-1">Etapa 1: Adaptação</strong>
            Redução rápida de inchaço, ganho de mobilidade e adaptação ao déficit sem fome severa.
          </div>
          <div class="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs">
            <strong class="text-rose-600 block mb-1">Etapa 2: Queima Ativa</strong>
            Perda contínua de gordura visceral, sustentada por musculação e preservação de tônus.
          </div>
          <div class="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs">
            <strong class="text-rose-600 block mb-1">Etapa 3: Consolidação</strong>
            Manutenção hormonal estável e ajuste de passos diários para impedir o reganho de peso.
          </div>
        </div>
      </section>

      <!-- ABA 1: FICHAS DE TREINO -->
      <section
        v-show="currentMainTab === 'workout'"
        id="screen-workout"
        role="tabpanel"
        aria-labelledby="tab-btn-workout"
        tabindex="0"
        class="space-y-6 focus:outline-none"
      >
        
        <!-- Seletor de Fichas (Sub-tabs A, B, C...) -->
        <div class="flex items-center justify-between flex-wrap gap-3 border-b border-[#E2E8F0] pb-4">
          <div>
            <h3 class="text-xl font-extrabold text-[#0066FF] tracking-tight">Ficha & Sobrecarga Progressiva</h3>
            <p class="text-xs text-[#64748B]">Anote os pesos de hoje. O app salva automaticamente e exibe seu histórico para o próximo treino.</p>
          </div>

          <div class="flex flex-wrap items-center gap-1.5 bg-[#F1F5F9] p-1.5 rounded-2xl border border-[#E2E8F0] max-w-full">
            <button 
              v-for="split in activePlan?.workoutSplits" 
              :key="split.id"
              :id="`btn-split-${split.id}`"
              @click="currentSplitTab = split.id"
              :class="currentSplitTab === split.id ? 'bg-[#0066FF] text-white font-bold shadow-xs' : 'text-[#64748B] hover:text-[#0066FF] hover:bg-white'"
              class="tap-btn px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-bold transition-all flex-shrink-0"
            >
              {{ getSplitTabLabel(split.title) }}
            </button>

            <!-- Botão para o usuário criar sua própria ficha de treino -->
            <button
              type="button"
              id="btn-open-create-split"
              @click="openCreateSplitModal"
              class="tap-btn px-3 py-1.5 rounded-xl text-xs md:text-sm font-bold bg-[#F59E0B] text-[#0F172A] hover:bg-[#D97706] border border-[#D97706] transition-all flex items-center gap-1 flex-shrink-0 shadow-xs"
              title="Criar sua própria ficha de treino personalizada"
            >
              <span aria-hidden="true">➕</span>
              <span>Criar Ficha</span>
            </button>

            <button
              type="button"
              id="btn-open-custom-exercises"
              @click="openCustomExercises"
              class="tap-btn px-3 py-1.5 rounded-xl text-xs font-bold border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] transition-all flex-shrink-0 shadow-xs"
              title="Criar e gerenciar seus próprios exercícios"
            >
              + Meus exercícios
            </button>

            <!-- Tela cheia para executar o treino -->
            <button
              v-if="trainingSplit"
              type="button"
              id="btn-open-training-mode"
              @click="openTrainingMode"
              class="tap-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F59E0B] text-[#0F172A] hover:bg-[#D97706] border border-[#D97706] transition-all flex-shrink-0 shadow-xs"
              title="Abrir o modo treino em tela cheia"
            >
              <span aria-hidden="true">▶</span> Modo Treino
            </button>

            <button
              v-if="activeSessionId"
              type="button"
              id="btn-finish-session"
              @click="finishCurrentSession"
              class="tap-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0066FF] hover:bg-[#0052cc] text-white transition-all ml-1 flex-shrink-0 shadow-xs"
              title="Encerrar este treino e registrá-lo no histórico"
            >
              ✓ Concluir treino
            </button>

            <!-- Geração por IA -->
            <button
              v-if="userProfile"
              type="button"
              id="btn-generate-ai-plan"
              @click="generatePlanWithAi"
              :disabled="isAiPlanLoading"
              class="tap-btn px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-xs"
              :class="isAiPlanLoading
                ? 'border-[#E2E8F0] bg-white text-[#64748B]'
                : 'border-[#0066FF]/30 bg-white text-[#0066FF] hover:bg-[#F1F5F9]'"
              :title="isAiPlanLoading ? 'Gerando ficha com IA...' : 'Gerar a ficha e as metas com IA (Gemini)'"
            >
              <span aria-hidden="true">{{ isAiPlanLoading ? '⏳' : '🤖' }}</span>
              {{ isAiPlanLoading ? 'Gerando...' : 'Gerar com IA' }}
            </button>
          </div>

          <!-- Origem do plano e retorno da IA -->
          <p
            id="ai-plan-status"
            role="status"
            aria-live="polite"
            class="w-full text-xs leading-relaxed"
            :class="aiPlanMessage?.tone === 'error' ? 'text-rose-500' : (aiPlanMessage ? 'text-[#0066FF]' : 'text-[#64748B]')"
          >
            <template v-if="aiPlanMessage">{{ aiPlanMessage.text }}</template>
            <template v-else-if="activePlan?.planSource === 'ai'">
              Ficha montada por IA a partir dos seus dados e das suas restrições —
              vale revisar antes de treinar.
            </template>
            <template v-else>
              Ficha calculada por fórmula (TDEE e volume por grupo muscular).
            </template>
          </p>
        </div>

        <!-- Widget de Tonelagem e PRs em Tempo Real na Sessão -->
        <WorkoutTonnageLiveWidget v-bind="liveSessionGamification" />

        <!-- Lista de Exercícios da Ficha Ativa -->
        <div v-for="split in activePlan?.workoutSplits" :key="split.id">
          <div v-if="currentSplitTab === split.id" :id="`container-${split.id}`" class="space-y-4">

            <!-- Barra de Ações e Filtros por Grupo Muscular -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <!-- Filtros rápidos por grupo muscular -->
              <div class="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
                <span class="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider hidden md:inline-block mr-1">Músculos:</span>
                <button
                  type="button"
                  :id="`btn-filter-all-${split.id}`"
                  @click="activeMuscleFilter[split.id] = 'all'"
                  :class="(!activeMuscleFilter[split.id] || activeMuscleFilter[split.id] === 'all')
                    ? 'bg-[#0066FF] text-white font-bold shadow-xs'
                    : 'bg-white text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] border border-[#E2E8F0]'"
                  class="tap-btn px-2.5 py-1 rounded-xl text-xs transition-colors flex-shrink-0"
                >
                  Todos ({{ split.exercises.length }})
                </button>

                <button
                  v-for="m in getSplitMuscleGroups(split)"
                  :key="m"
                  :id="`btn-filter-${split.id}-${m}`"
                  @click="toggleMuscleFilter(split.id, m)"
                  :class="activeMuscleFilter[split.id] === m
                    ? 'bg-[#0066FF] text-white font-bold shadow-xs'
                    : 'bg-white text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] border border-[#E2E8F0]'"
                  class="tap-btn px-2.5 py-1 rounded-xl text-xs transition-colors flex items-center gap-1.5 flex-shrink-0"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="getMuscleDotColor(m)"></span>
                  <span>{{ MUSCLE_LABELS[m] || m }}</span>
                  <span class="text-[10px] opacity-75">({{ getMuscleCountInSplit(split, m) }})</span>
                </button>
              </div>

              <!-- Botões de ação do split -->
              <div class="flex items-center gap-2 self-end sm:self-auto flex-shrink-0 flex-wrap">
                <button
                  type="button"
                  :id="`btn-edit-split-${split.id}`"
                  @click="openEditSplitModal(split)"
                  class="tap-btn px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F1F5F9] transition-colors flex items-center gap-1 shadow-xs"
                  title="Editar nome e cor desta ficha"
                >
                  <span aria-hidden="true">✏️</span>
                  <span class="hidden sm:inline">Editar</span>
                </button>

                <button
                  v-if="activePlan?.workoutSplits?.length > 1"
                  type="button"
                  :id="`btn-delete-split-${split.id}`"
                  @click="askDeleteSplit(split)"
                  class="tap-btn px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors flex items-center gap-1 shadow-xs"
                  title="Excluir esta ficha de treino"
                >
                  <span aria-hidden="true">🗑</span>
                  <span class="hidden sm:inline">Excluir</span>
                </button>

                <button
                  type="button"
                  :id="`btn-group-by-muscle-${split.id}`"
                  @click="sortSplitByMuscle(split.id)"
                  class="tap-btn px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors flex items-center gap-1 shadow-xs"
                  title="Organizar e agrupar exercícios por grupo muscular"
                >
                  <span aria-hidden="true">⚡</span>
                  <span class="hidden sm:inline">Agrupar</span>
                </button>

                <button
                  type="button"
                  :id="`btn-add-exercise-${split.id}`"
                  @click="openAdderFor(split.id)"
                  class="tap-btn px-3 py-1.5 rounded-xl text-xs font-bold border border-[#F59E0B] bg-[#F59E0B] text-[#0F172A] hover:bg-[#D97706] transition-colors shadow-xs"
                  title="Adicionar um exercício a esta ficha"
                >
                  + Adicionar exercício
                </button>
              </div>
            </div>

            <!-- Confirmação de Exclusão da Ficha -->
            <div
              v-if="pendingDeleteSplit?.id === split.id"
              :id="`confirm-delete-split-${split.id}`"
              class="p-4 rounded-2xl bg-rose-50 border border-rose-200 shadow-sm"
              role="alertdialog"
              :aria-label="`Confirmar exclusão da ficha ${split.title}`"
            >
              <p class="text-xs sm:text-sm font-bold text-rose-800 mb-2.5">
                Tem certeza que deseja excluir a ficha <strong>{{ split.title }}</strong>? Os exercícios serão removidos desta rotina.
              </p>
              <div class="flex gap-2.5">
                <button
                  type="button"
                  :id="`btn-confirm-delete-split-${split.id}`"
                  @click="confirmDeleteSplit(split.id)"
                  class="min-h-11 px-4 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 active:bg-rose-700 transition-colors shadow-xs"
                >
                  Sim, excluir ficha
                </button>
                <button
                  type="button"
                  :id="`btn-cancel-delete-split-${split.id}`"
                  @click="pendingDeleteSplit = null"
                  class="min-h-11 px-4 rounded-xl bg-white border border-[#E2E8F0] text-[#0F172A] text-xs font-bold hover:bg-[#F1F5F9] active:bg-[#E2E8F0] transition-colors shadow-xs"
                >
                  Cancelar
                </button>
              </div>
            </div>
            
            <!-- Descrição / Dicas do Split -->
            <div :class="split.accentBg" class="p-4 rounded-2xl border text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xs">
              <div>
                <strong>{{ split.title }}:</strong> {{ split.subtitle }}
              </div>
            </div>

            <!-- Resumo Métrico & Mapa Anatômico da Sessão -->
            <div class="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-3">
              <!-- Métricas Rápidas da Sessão (Exercícios, Séries, Tempo, Calorias) -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div class="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs">
                  <p class="text-[10px] uppercase font-bold text-[#64748B]">Exercícios</p>
                  <p class="text-base font-black text-[#0F172A]">{{ split.exercises.length }}</p>
                </div>
                <div class="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs">
                  <p class="text-[10px] uppercase font-bold text-[#64748B]">Séries Totais</p>
                  <p class="text-base font-black text-[#0066FF]">{{ split.exercises.length * 3 }}</p>
                </div>
                <div class="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs">
                  <p class="text-[10px] uppercase font-bold text-[#64748B]">Tempo Estimado</p>
                  <p class="text-base font-black text-[#0F172A]">~{{ split.exercises.length * 8 }} min</p>
                </div>
                <div class="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs">
                  <p class="text-[10px] uppercase font-bold text-[#64748B]">Gasto Estimado</p>
                  <p class="text-base font-black text-[#F59E0B]">~{{ split.exercises.length * 45 }} kcal</p>
                </div>
              </div>

              <!-- Botão para Alternar / Exibir Mapa Anatômico -->
              <div class="flex items-center justify-between pt-1">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                    <span>💪</span> Músculos Ativos Deste Treino
                  </span>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/20">
                    {{ getSplitMuscleGroups(split).length }} grupos
                  </span>
                </div>

                <button
                  type="button"
                  :id="`btn-toggle-body-map-${split.id}`"
                  @click="showSplitBodyMap = !showSplitBodyMap"
                  class="tap-btn text-xs font-bold text-[#0066FF] hover:text-[#0052cc] flex items-center gap-1 transition-colors"
                >
                  <span>{{ showSplitBodyMap ? 'Ocultar Mapa' : 'Ver Mapa Anatômico' }}</span>
                  <span class="text-[10px]">{{ showSplitBodyMap ? '▲' : '▼' }}</span>
                </button>
              </div>

              <!-- Diagrama Anatômico Integrado -->
              <div v-if="showSplitBodyMap" :id="`split-body-map-${split.id}`" class="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex justify-center shadow-xs">
                <MuscleBodyMap
                  :highlighted-muscles="getSplitMuscleGroups(split)"
                  :id-prefix="`split-${split.id}-`"
                  :show-controls="true"
                  :show-legend="true"
                />
              </div>
            </div>

            <!-- Cards de Exercícios Divididos por Grupos Musculares -->
            <div class="grid gap-3">
              <template v-for="(ex, index) in getVisibleExercises(split)" :key="ex.id">
                <!-- Cabeçalho de Divisão do Grupo Muscular -->
                <div
                  v-if="shouldShowMuscleHeader(split, ex, index)"
                  :id="`muscle-header-${split.id}-${ex.muscle}`"
                  class="flex items-center justify-between gap-3 pt-3 pb-1 border-b border-[#E2E8F0] mt-1"
                >
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full" :class="getMuscleDotColor(ex.muscle)"></span>
                    <h5 class="text-xs font-black tracking-wider uppercase" :class="getMuscleTextColor(ex.muscle)">
                      {{ MUSCLE_LABELS[ex.muscle] || ex.muscle }}
                    </h5>
                    <span class="text-[11px] font-medium text-[#64748B]">
                      • {{ getMuscleCountInSplit(split, ex.muscle) }} {{ getMuscleCountInSplit(split, ex.muscle) === 1 ? 'exercício' : 'exercícios' }}
                    </span>
                  </div>
                  <span :class="getMuscleBadgeClass(ex.muscle)" class="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider hidden sm:inline-block">
                    Grupo Muscular
                  </span>
                </div>

                <div 
                  :id="`exercise-card-${ex.id}`"
                  class="p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0"
                  :class="workoutLogs[ex.id]?.isDone ? 'bg-[#F8FAFC] border-[#E2E8F0] opacity-80' : 'bg-white border-[#E2E8F0] hover:border-[#0066FF]/40 shadow-xs'"
                >
                  <!-- Lado Esquerdo: Checkbox + Miniatura + Título + Badges -->
                  <div class="flex items-start md:items-center gap-3 flex-1 min-w-0">
                    <button 
                      type="button"
                      :id="`btn-check-${ex.id}`"
                      @click="toggleExerciseCheck(ex.id, split.id)"
                      :aria-pressed="!!workoutLogs[ex.id]?.isDone"
                      :aria-label="workoutLogs[ex.id]?.isDone ? `Marcar ${ex.name} como pendente` : `Marcar ${ex.name} como concluído`"
                      class="check-btn mt-1 md:mt-0 flex-shrink-0"
                      :class="workoutLogs[ex.id]?.isDone ? 'bg-[#10B981] border-[#10B981] text-white font-black text-sm shadow-xs' : 'bg-white border-[#CBD5E1] hover:border-[#F59E0B] text-transparent'"
                    >
                      ✓
                    </button>

                    <!-- Miniatura Visual do Exercício -->
                    <button
                      type="button"
                      :id="`btn-thumb-${ex.id}`"
                      @click="openExerciseDetails(ex)"
                      class="w-12 h-12 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] overflow-hidden flex items-center justify-center flex-shrink-0 cursor-pointer hover:border-[#0066FF] transition-all shadow-xs group relative"
                      title="Ver demonstração e músculos trabalhados"
                    >
                      <img
                        v-if="ex.imageUrl"
                        :src="ex.imageUrl"
                        :alt="ex.name"
                        class="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        loading="lazy"
                      />
                      <span v-else class="text-xl">🏋️</span>
                      <span class="absolute inset-0 bg-[#0066FF]/10 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    </button>

                    <div class="space-y-1 min-w-0 flex-1">
                      <!-- Badge do Grupo Muscular -->
                      <div class="flex items-center gap-2">
                        <span
                          :id="`muscle-badge-${ex.id}`"
                          :class="getMuscleBadgeClass(ex.muscle)"
                          class="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider inline-flex items-center gap-1"
                        >
                          <span class="w-1.5 h-1.5 rounded-full" :class="getMuscleDotColor(ex.muscle)"></span>
                          {{ MUSCLE_LABELS[ex.muscle] || ex.muscle }}
                        </span>
                      </div>

                      <div class="flex items-center gap-2 flex-wrap">
                      <a 
                        v-if="ex.imageUrl"
                        :href="ex.imageUrl" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        :id="`link-exercise-${ex.id}`"
                        class="text-sm md:text-base font-bold transition-colors hover:underline flex items-center gap-1.5 group min-w-0"
                        :class="workoutLogs[ex.id]?.isDone ? 'line-through text-[#64748B]' : 'text-[#0F172A] hover:text-[#0066FF]'"
                        title="Ver demonstração do exercício (imagem externa)"
                      >
                        <span>{{ ex.name }}</span>
                        <span class="text-xs opacity-60 group-hover:opacity-100 transition-opacity">↗</span>
                      </a>
                      <h4 
                        v-else
                        class="text-sm md:text-base font-bold transition-colors"
                        :class="workoutLogs[ex.id]?.isDone ? 'line-through text-[#64748B]' : 'text-[#0F172A]'"
                      >
                        {{ ex.name }}
                      </h4>

                      <!-- Botão Ver Exemplo / Detalhes -->
                      <button
                        type="button"
                        :id="`btn-details-${ex.id}`"
                        @click="openExerciseDetails(ex)"
                        class="tap-btn text-xs text-[#0066FF] hover:text-[#0052cc] font-bold inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-[#E2E8F0] transition-colors shadow-xs"
                        title="Ver demonstração e detalhes anatômicos"
                      >
                        <span>ℹ️</span>
                        <span class="hidden sm:inline">Exemplo</span>
                      </button>

<button
                    type="button"
                    :id="`btn-swap-${ex.id}`"
                    @click="openExercisePicker(ex, split.id)" 
                    :aria-label="`Substituir exercício ${ex.name}`"
                    class="action-btn text-[#64748B] hover:text-[#0066FF]"
                    title="Substituir este exercício"
                  >
                    <span aria-hidden="true">🔄</span>
                  </button>

                  <button
                    type="button"
                    :id="`btn-up-${ex.id}`"
                    @click="moveExercise(ex.id, split.id, -1)"
                    :disabled="split.exercises[0]?.id === ex.id"
                    :aria-label="`Mover ${ex.name} para cima`"
                    class="action-btn text-[#64748B] hover:text-[#0066FF] disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Mover para cima"
                  >
                    <span aria-hidden="true">↑</span>
                  </button>

                  <button
                    type="button"
                    :id="`btn-down-${ex.id}`"
                    @click="moveExercise(ex.id, split.id, 1)"
                    :disabled="split.exercises[split.exercises.length - 1]?.id === ex.id"
                    :aria-label="`Mover ${ex.name} para baixo`"
                    class="action-btn text-[#64748B] hover:text-[#0066FF] disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Mover para baixo"
                  >
                    <span aria-hidden="true">↓</span>
                  </button>

                  <button
                    type="button"
                    :id="`btn-remove-${ex.id}`"
                    @click="askRemoveExercise(ex, split.id)"
                    :aria-expanded="pendingRemove?.exerciseId === ex.id ? 'true' : 'false'"
                    :aria-label="`Remover ${ex.name} da ficha`"
                    class="action-btn action-btn-danger"
                    title="Remover da ficha"
                  >
                    <span aria-hidden="true">🗑</span>
                  </button>
                    </div>

                    <!-- Confirmação da remoção: remover apaga o log de cargas do
                         exercício, então o botão não pode ser um toque só. Fica
                         na própria linha do nome em vez de num modal para não
                         cobrir a ficha num celular. -->
                    <div
                      v-if="pendingRemove?.exerciseId === ex.id"
                      :id="`confirm-remove-${ex.id}`"
                      class="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800"
                      role="alertdialog"
                      :aria-label="`Confirmar remoção de ${ex.name}`"
                    >
                      <p class="text-xs text-rose-800 mb-2 font-medium">
                        Remover <strong>{{ ex.name }}</strong> da ficha?
                        O histórico de cargas dele também é apagado.
                      </p>
                      <div class="flex gap-2">
                        <button
                          type="button"
                          :id="`btn-confirm-remove-${ex.id}`"
                          @click="confirmRemoveExercise(split.id)"
                          class="flex-1 min-h-11 px-3 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 active:bg-rose-700 transition-colors shadow-xs"
                        >
                          Remover
                        </button>
                        <button
                          type="button"
                          :id="`btn-cancel-remove-${ex.id}`"
                          @click="cancelRemoveExercise"
                          class="flex-1 min-h-11 px-3 rounded-xl bg-white border border-[#E2E8F0] text-[#0F172A] text-xs font-bold hover:bg-[#F1F5F9] active:bg-[#E2E8F0] transition-colors shadow-xs"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
                      <!-- Badge de Série Estilizado -->
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                        SET {{ workoutLogs[ex.id]?.sets?.length || 1 }}
                      </span>
                      <span :class="isWeightLoss ? 'text-rose-600' : 'text-[#0066FF]'" class="font-semibold">{{ ex.defaultSeries }}</span>
                      <!-- Reps sugeridas pela IA: o app não impõe repetição, o
                           campo continua editável e é o que vale. -->
                      <template v-if="ex.aiReps">
                        <span>•</span>
                        <span>{{ ex.aiReps }} reps</span>
                      </template>
                      <span>•</span>
                      <button 
                        type="button"
                        :id="`btn-rest-${ex.id}`"
                        @click="triggerRestTimer(ex.rest)"
                        :aria-label="`Iniciar descanso de ${ex.rest}`"
                        class="tap-btn hover:text-[#0066FF] underline underline-offset-2 transition-colors flex items-center gap-1 rounded-lg hover:bg-blue-50 text-[#64748B]"
                      >
                        <span aria-hidden="true">⏱️</span> Descanso: {{ ex.rest }}
                      </button>
                    </div>

                    <p v-if="ex.tips" class="text-[11px] text-[#64748B] italic mt-0.5">
                      💡 {{ ex.tips }}
                    </p>

                    <!-- PR (Personal Record) mais relevante -->
                    <p
                      v-if="personalRecords[ex.id]"
                      class="text-[11px] text-[#0066FF] mt-1 flex flex-wrap items-center gap-1.5"
                    >
                      <span aria-hidden="true">🏆</span>
                      PR: <span class="font-semibold">{{ personalRecords[ex.id].maxWeightKg.toString().replace('.', ',') }} kg</span>
                      <span>•</span>
                      {{ personalRecords[ex.id].maxReps }} reps
                    </p>

                    <!-- Sugestão de próxima carga (double progression) -->
                    <p
                      v-if="nextLoadSuggestions[ex.id]"
                      :id="`suggest-next-${ex.id}`"
                      class="text-[11px] text-emerald-600 mt-1 flex flex-wrap items-center gap-1.5"
                    >
                      <span aria-hidden="true">📈</span>
                      Sugestão: <span class="font-semibold">
                        {{ nextLoadSuggestions[ex.id].suggestedWeightKg > 0
                          ? nextLoadSuggestions[ex.id].suggestedWeightKg.toString().replace('.', ',') + ' kg'
                          : '' }}
                        <template v-if="nextLoadSuggestions[ex.id].suggestedWeightKg > 0 && nextLoadSuggestions[ex.id].suggestedReps > 0"> × </template>
                        {{ nextLoadSuggestions[ex.id].suggestedReps > 0 ? nextLoadSuggestions[ex.id].suggestedReps + ' reps' : '' }}
                      </span>
                    </p>

                    <!-- Última carga registrada em qualquer treino anterior -->
                    <p
                      v-if="lastSetLabel(ex.id)"
                      :id="`last-load-${ex.id}`"
                      class="text-[11px] text-[#64748B] mt-1"
                    >
                      <span aria-hidden="true">🕘</span>
                      Último treino: <span class="text-[#0F172A] font-semibold">{{ lastSetLabel(ex.id) }}</span>
                    </p>
                  </div>
                </div>

                <!-- Lado Direito: Inputs de Carga e Reps (Ocultos se for Cardio Contínuo) -->
                <div v-if="ex.muscle !== 'cardio'" class="flex flex-col gap-2 self-end md:self-auto w-full md:w-auto">
                  <div class="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div
                      class="flex items-center gap-2 bg-[#F8FAFC] px-3 py-2 rounded-xl border border-[#E2E8F0] shadow-xs flex-1 md:flex-initial transition-all focus-within:border-[#0066FF] focus-within:ring-2 focus-within:ring-[#0066FF]/20 focus-within:bg-white"
                    >
                      <label :for="`input-weight-${ex.id}`" class="text-xs text-[#64748B] font-bold uppercase tracking-wider">Carga:</label>
                      <input 
                        :id="`input-weight-${ex.id}`"
                        type="number" 
                        step="0.5" 
                        min="0"
                        inputmode="decimal"
                        placeholder="0"
                        :aria-label="`Carga em kg para ${ex.name}`"
                        :value="workoutLogs[ex.id]?.weight"
                        @input="e => updateLog(ex.id, split.id, 'weight', e.target.value)"
                        class="log-input w-16 text-base font-extrabold text-right focus:outline-none text-[#0F172A]"
                      />
                      <span class="text-xs text-[#64748B] font-bold">kg</span>
                    </div>

                    <div
                      class="flex items-center gap-2 bg-[#F8FAFC] px-3 py-2 rounded-xl border border-[#E2E8F0] shadow-xs flex-1 md:flex-initial transition-all focus-within:border-[#0066FF] focus-within:ring-2 focus-within:ring-[#0066FF]/20 focus-within:bg-white"
                    >
                      <label :for="`input-reps-${ex.id}`" class="text-xs text-[#64748B] font-bold uppercase tracking-wider">Reps:</label>
                      <input 
                        :id="`input-reps-${ex.id}`"
                        type="number" 
                        min="0"
                        max="500"
                        inputmode="numeric"
                        placeholder="12"
                        :aria-label="`Repetições para ${ex.name}`"
                        :value="workoutLogs[ex.id]?.reps"
                        @input="e => updateLog(ex.id, split.id, 'reps', e.target.value)"
                        class="log-input w-12 text-base font-extrabold text-right focus:outline-none text-[#0F172A]"
                      />
                    </div>

                    <!-- RIR: reps em reserva do último esforço. -->
                    <div
                      class="flex items-center gap-2 bg-[#F8FAFC] px-3 py-2 rounded-xl border border-[#E2E8F0] shadow-xs flex-1 md:flex-initial transition-all focus-within:border-[#0066FF] focus-within:ring-2 focus-within:ring-[#0066FF]/20 focus-within:bg-white"
                    >
                      <label :for="`input-rir-${ex.id}`" class="text-xs text-[#64748B] font-bold uppercase tracking-wider">RIR:</label>
                      <input
                        :id="`input-rir-${ex.id}`"
                        type="number"
                        min="0"
                        max="10"
                        inputmode="numeric"
                        placeholder="—"
                        :aria-label="`RIR (reps em reserva) para ${ex.name}`"
                        :value="workoutLogs[ex.id]?.rir"
                        @input="e => updateLog(ex.id, split.id, 'rir', e.target.value)"
                        class="log-input w-10 text-base font-extrabold text-right focus:outline-none text-[#0F172A]"
                      />
                    </div>

                    <button
                      type="button"
                      :id="`btn-add-set-${ex.id}`"
                      @click="addExerciseSet(ex.id, split.id)"
                      class="tap-btn px-2.5 py-2 rounded-xl text-xs font-bold border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#0F172A] hover:text-[#0066FF] transition-colors flex items-center gap-1 shadow-xs"
                      title="Adicionar mais uma série para este exercício"
                    >
                      <span aria-hidden="true">+</span> Série
                    </button>
                  </div>

                  <!-- Séries adicionais (Série 2, 3...) -->
                  <div v-if="workoutLogs[ex.id]?.sets?.length > 1" class="space-y-1.5 pt-1 border-t border-[#E2E8F0]">
                    <div
                      v-for="s in workoutLogs[ex.id].sets.slice(1)"
                      :key="s.setNumber"
                      class="flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#E2E8F0] text-xs shadow-xs"
                    >
                      <div class="flex items-center gap-2">
                        <button
                          type="button"
                          :id="`btn-check-set-${ex.id}-${s.setNumber}`"
                          @click="toggleSetDone(ex.id, split.id, s.setNumber)"
                          class="w-5 h-5 rounded-lg border flex items-center justify-center font-bold text-[10px] transition-colors"
                          :class="s.isDone ? 'bg-[#10B981] border-[#10B981] text-white' : 'border-[#CBD5E1] text-transparent hover:border-[#F59E0B]'"
                        >
                          ✓
                        </button>
                        <span class="font-semibold text-[#0F172A]">Série {{ s.setNumber }}</span>
                      </div>

                      <div class="flex items-center gap-2">
                        <div class="flex items-center gap-1 bg-[#F8FAFC] px-2 py-1 rounded-lg border border-[#E2E8F0]">
                          <input
                            :id="`input-weight-${ex.id}-${s.setNumber}`"
                            type="number"
                            step="0.5"
                            placeholder="0"
                            :value="s.weight"
                            @input="e => updateSetField(ex.id, split.id, s.setNumber, 'weight', e.target.value)"
                            class="w-12 text-right bg-transparent font-bold focus:outline-none text-[#0F172A]"
                          />
                          <span class="text-[10px] text-[#64748B]">kg</span>
                        </div>

                        <div class="flex items-center gap-1 bg-[#F8FAFC] px-2 py-1 rounded-lg border border-[#E2E8F0]">
                          <input
                            :id="`input-reps-${ex.id}-${s.setNumber}`"
                            type="number"
                            placeholder="12"
                            :value="s.reps"
                            @input="e => updateSetField(ex.id, split.id, s.setNumber, 'reps', e.target.value)"
                            class="w-10 text-right bg-transparent font-bold focus:outline-none text-[#0F172A]"
                          />
                          <span class="text-[10px] text-[#64748B]">reps</span>
                        </div>

                        <button
                          type="button"
                          :id="`btn-remove-set-${ex.id}-${s.setNumber}`"
                          @click="removeExerciseSet(ex.id, split.id, s.setNumber)"
                          class="text-[#64748B] hover:text-rose-500 p-1 text-xs"
                          title="Remover esta série"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-xs text-[#0066FF] font-semibold bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
                  Exercício Aeróbico
                </div>

              </div>
            </template>
            </div>

          </div>
        </div>

      </section>

      <!-- ABA 2: NUTRIÇÃO & CREATINA / TERMOGÊNICOS -->
      <section
        v-show="currentMainTab === 'nutrition'"
        id="screen-nutrition"
        role="tabpanel"
        aria-labelledby="tab-btn-nutrition"
        tabindex="0"
        class="space-y-6 focus:outline-none"
      >
        <div class="border-b border-[#E2E8F0] pb-4">
          <h3 class="text-xl font-extrabold text-[#0066FF] tracking-tight">
            {{ isWeightLoss ? 'Plano Nutricional & Termogênicos Naturais' : 'Plano Alimentar & Suplementação Natural' }}
          </h3>
          <p class="text-xs text-[#64748B]">
            {{ isWeightLoss ? 'Déficit calórico calculado para emagrecer com alta saciedade e estímulos naturais.' : 'Cardápio proporcional calibrado exatamente para seu gasto energético e meta de crescimento.' }}
          </p>
        </div>

        <!-- Barra de Seleção de Preferência Alimentar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-[#64748B]">Estilo de Dieta</span>
            <p class="text-xs text-[#0F172A]">Escolha o padrão para adaptar os alimentos do cardápio</p>
          </div>
          <div class="flex flex-wrap gap-1.5" role="group" aria-label="Preferência alimentar">
            <button
              v-for="diet in DIETARY_PREFERENCES"
              :key="diet.id"
              :id="`btn-diet-switch-${diet.id}`"
              type="button"
              @click="setDietaryPreference(diet.id)"
              :class="currentDietaryPreference === diet.id ? 'bg-[#0066FF] text-white font-bold shadow-xs' : 'bg-white text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] border border-[#E2E8F0]'"
              class="tap-btn px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <span>{{ diet.icon }}</span>
              <span>{{ diet.label }}</span>
            </button>
          </div>
        </div>

        <!-- Hábitos Diários Interativos: Água e Creatina -->
        <div id="section-daily-habits" class="bg-white border border-[#E2E8F0] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div class="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-[#0066FF]">Hábitos de Hoje</span>
              <h4 class="text-base sm:text-lg font-bold text-[#0F172A] mt-0.5">Hidratação & Creatina Diária</h4>
            </div>
            <span class="text-xs text-[#64748B] font-medium capitalize">{{ todayDateFormatted }}</span>
          </div>

          <div class="grid md:grid-cols-2 gap-4">
            <!-- Rastreador de Água -->
            <div class="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-xl">💧</span>
                  <span class="text-sm font-bold text-[#0F172A]">Meta de Água</span>
                </div>
                <span id="water-progress-text" class="text-xs font-bold text-[#0066FF]">
                  {{ todayWaterMl }} / {{ targetWaterMl }} ml ({{ waterPercent }}%)
                </span>
              </div>

              <!-- Barra de Progresso de Água -->
              <div class="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden" role="progressbar" :aria-valuenow="waterPercent" aria-valuemin="0" aria-valuemax="100">
                <div
                  id="water-progress-bar"
                  class="h-full bg-gradient-to-r from-[#0066FF] to-cyan-500 transition-all duration-300 rounded-full"
                  :style="{ width: `${waterPercent}%` }"
                ></div>
              </div>

              <!-- Botões de Ingestão de Água -->
              <div class="flex flex-wrap gap-2 pt-1">
                <button
                  id="btn-water-add-250"
                  @click="addWater(250)"
                  type="button"
                  class="tap-btn px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0066FF] border border-blue-200 text-xs font-bold transition-all"
                >
                  +250 ml
                </button>
                <button
                  id="btn-water-add-500"
                  @click="addWater(500)"
                  type="button"
                  class="tap-btn px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0066FF] border border-blue-200 text-xs font-bold transition-all"
                >
                  +500 ml
                </button>
                <button
                  id="btn-water-add-1000"
                  @click="addWater(1000)"
                  type="button"
                  class="tap-btn px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0066FF] border border-blue-200 text-xs font-bold transition-all"
                >
                  +1 L
                </button>
                <button
                  id="btn-water-sub-250"
                  @click="addWater(-250)"
                  type="button"
                  class="tap-btn px-2.5 py-1.5 rounded-xl bg-white text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0] text-xs transition-all shadow-xs"
                  title="Diminuir 250ml"
                >
                  -250
                </button>
                <button
                  id="btn-water-reset"
                  @click="resetWater"
                  type="button"
                  class="tap-btn px-2.5 py-1.5 rounded-xl bg-white text-[#64748B] hover:text-rose-500 border border-[#E2E8F0] text-xs transition-all ml-auto shadow-xs"
                >
                  Zerar
                </button>
              </div>
            </div>

            <!-- Rastreador de Creatina -->
            <div class="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-xl">⚡</span>
                  <span class="text-sm font-bold text-[#0F172A]">Creatina do Dia</span>
                </div>
                <span class="text-xs text-[#64748B] font-semibold">{{ activePlan?.physiology?.creatine }}g / dose</span>
              </div>
              <p class="text-xs text-[#64748B] mb-3">
                Consumo diário contínuo, inclusive nos dias de descanso. Tome com sua principal refeição rica em carboidratos.
              </p>
              <button
                id="btn-toggle-creatine-today"
                @click="toggleCreatineToday"
                type="button"
                :class="isCreatineTakenToday ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs font-bold' : 'bg-white text-[#0F172A] border border-[#E2E8F0] hover:border-[#F59E0B] shadow-xs'"
                class="tap-btn w-full p-2.5 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>{{ isCreatineTakenToday ? '✓ Creatina Ingerida Hoje!' : 'Registrar Creatina de Hoje' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Personalização de Calorias & Macros -->
        <div id="section-custom-nutrition" class="bg-white border border-[#E2E8F0] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-[#0066FF]">
                Metas Nutricionais & Macros
              </span>
              <h4 class="text-base sm:text-lg font-bold text-[#0F172A] mt-0.5">
                {{ isCustomNutritionActive ? 'Metas Personalizadas Manuais' : 'Metas Recomendadas para seu Perfil' }}
              </h4>
            </div>
            <button
              id="btn-toggle-custom-nutrition-form"
              @click="isEditingCustomNutrition = !isEditingCustomNutrition"
              type="button"
              class="tap-btn text-xs px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0F172A] transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-xs font-medium"
            >
              <span>⚙️</span>
              <span>{{ isEditingCustomNutrition ? 'Fechar Ajuste' : 'Personalizar Metas (Nutricionista)' }}</span>
            </button>
          </div>

          <!-- Visor dos macros atuais -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-center shadow-xs">
              <span class="block text-[10px] text-[#64748B] uppercase font-bold">Calorias / Dia</span>
              <span id="display-calories" class="text-lg font-black text-[#0F172A]">{{ effectiveTargetCalories }} kcal</span>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-center shadow-xs">
              <span class="block text-[10px] text-[#64748B] uppercase font-bold">Proteína</span>
              <span id="display-protein" class="text-lg font-black text-emerald-600">{{ effectiveMacros.proteinGrams }}g</span>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-center shadow-xs">
              <span class="block text-[10px] text-[#64748B] uppercase font-bold">Carboidratos</span>
              <span id="display-carbs" class="text-lg font-black text-[#F59E0B]">{{ effectiveMacros.carbsGrams }}g</span>
            </div>
            <div class="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-center shadow-xs">
              <span class="block text-[10px] text-[#64748B] uppercase font-bold">Gorduras</span>
              <span id="display-fat" class="text-lg font-black text-rose-600">{{ effectiveMacros.fatGrams }}g</span>
            </div>
          </div>

          <!-- Formulário de personalização de metas -->
          <div v-if="isEditingCustomNutrition" id="form-custom-nutrition" class="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3 pt-4">
            <p class="text-xs text-[#64748B]">
              Defina os alvos específicos prescritos pelo seu nutricionista ou personalize suas preferências calóricas:
            </p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label for="input-custom-calories" class="block text-[11px] font-semibold text-[#64748B] mb-1">Calorias (kcal)</label>
                <input
                  id="input-custom-calories"
                  v-model.number="customNutritionForm.targetCalories"
                  type="number"
                  min="1000"
                  max="6000"
                  class="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#0F172A] font-semibold text-sm focus:outline-none focus:border-[#0066FF]"
                />
              </div>
              <div>
                <label for="input-custom-protein" class="block text-[11px] font-semibold text-[#64748B] mb-1">Proteína (g)</label>
                <input
                  id="input-custom-protein"
                  v-model.number="customNutritionForm.proteinGrams"
                  type="number"
                  min="30"
                  max="400"
                  class="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#0F172A] font-semibold text-sm focus:outline-none focus:border-[#0066FF]"
                />
              </div>
              <div>
                <label for="input-custom-carbs" class="block text-[11px] font-semibold text-[#64748B] mb-1">Carboidratos (g)</label>
                <input
                  id="input-custom-carbs"
                  v-model.number="customNutritionForm.carbsGrams"
                  type="number"
                  min="20"
                  max="700"
                  class="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#0F172A] font-semibold text-sm focus:outline-none focus:border-[#0066FF]"
                />
              </div>
              <div>
                <label for="input-custom-fat" class="block text-[11px] font-semibold text-[#64748B] mb-1">Gorduras (g)</label>
                <input
                  id="input-custom-fat"
                  v-model.number="customNutritionForm.fatGrams"
                  type="number"
                  min="15"
                  max="200"
                  class="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#0F172A] font-semibold text-sm focus:outline-none focus:border-[#0066FF]"
                />
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2">
              <button
                v-if="isCustomNutritionActive"
                id="btn-reset-custom-nutrition"
                type="button"
                @click="resetCustomNutrition"
                class="tap-btn px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 border border-rose-500/30 bg-rose-500/10 transition-colors"
              >
                Restaurar Cálculo Automático
              </button>
              <button
                id="btn-save-custom-nutrition"
                type="button"
                @click="saveCustomNutrition"
                class="tap-btn px-4 py-2 rounded-xl text-xs font-bold bg-[#F59E0B] hover:bg-[#D97706] text-[#0F172A] transition-colors shadow-xs"
              >
                Salvar Metas
              </button>
            </div>
          </div>
        </div>

        <!-- Destaques Creatina e Componentes Naturais -->
        <div v-if="isWeightLoss" class="grid md:grid-cols-3 gap-4">
          <div 
            v-for="sup in activePlan?.naturalSupplements" 
            :key="sup.id"
            :id="`card-supplement-${sup.id}`"
            class="p-5 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#0066FF]/40 transition-all flex flex-col justify-between shadow-xs"
          >
            <div>
              <div class="flex items-center gap-2 mb-2" :class="sup.color === 'rose' ? 'text-rose-400' : sup.color === 'amber' ? 'text-amber-400' : 'text-emerald-400'">
                <span class="text-xl">{{ sup.icon }}</span>
                <h4 class="font-bold text-[#0F172A] text-sm">{{ sup.name }}</h4>
              </div>
              <p class="text-xs text-[#64748B] leading-relaxed">
                <strong>Como usar:</strong> {{ sup.dosage }}<br>
                {{ sup.benefit }}
              </p>
            </div>
          </div>
        </div>

        <div v-else class="grid md:grid-cols-2 gap-4">
          <div class="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
            <div class="flex items-center gap-2.5 mb-2">
              <span class="text-xl">⚡</span>
              <h4 class="font-bold text-[#0F172A]">Creatina Monohidratada ({{ activePlan?.physiology?.creatine }}g / dia)</h4>
            </div>
            <p class="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              Consumo diário contínuo, <strong>inclusive nos dias de descanso</strong>. Tome com uma refeição rica em carboidratos (almoço ou pós-treino) para elevar a captação intracelular via pico de insulina.
            </p>
          </div>

          <div class="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
            <div class="flex items-center gap-2.5 mb-2">
              <span class="text-xl">💧</span>
              <h4 class="font-bold text-[#0F172A]">Hidratação Crítica ({{ activePlan?.physiology?.water?.liters }} Litros)</h4>
            </div>
            <p class="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              A creatina puxa água para o meio sarcoplasmático das fibras. Beba pelo menos {{ activePlan?.physiology?.water?.liters }}L ao longo do dia para volumização celular ideal e saúde renal.
            </p>
          </div>
        </div>

        <!-- Cards de Refeições -->
        <div class="grid md:grid-cols-2 gap-4">
          <div
            v-for="meal in activePlan?.meals"
            :key="meal.id"
            :id="`meal-card-${meal.id}`"
            class="p-5 rounded-2xl bg-white border border-[#E2E8F0] flex flex-col justify-between hover:border-[#0066FF]/40 transition-all shadow-xs"
          >
            <div>
              <div class="flex items-center justify-between gap-2 mb-2">
                <h5 class="font-bold text-[#0F172A] text-sm sm:text-base">{{ meal.title }}</h5>
                <span 
                  :class="isWeightLoss ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-[#0066FF] bg-blue-50 border-blue-200'"
                  class="text-[11px] font-semibold px-2 py-0.5 rounded border"
                >
                  {{ meal.tag }}
                </span>
              </div>
              <p class="text-xs sm:text-sm text-[#0F172A] leading-relaxed mt-2">{{ meal.items }}</p>
            </div>
            <p class="text-[11px] text-[#64748B] mt-4 pt-3 border-t border-[#E2E8F0]">
              <strong>Objetivo Fisiológico:</strong> {{ meal.objective }}
            </p>
          </div>
        </div>
      </section>

      <!-- ABA 3: QUADRO SEMANAL DE FREQUÊNCIA -->
      <section
        v-show="currentMainTab === 'frequency'"
        id="screen-frequency"
        role="tabpanel"
        aria-labelledby="tab-btn-frequency"
        tabindex="0"
        class="space-y-6 focus:outline-none text-[#1E293B]"
      >
        <div class="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-xs relative overflow-hidden">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 class="text-lg font-bold text-[#1E293B] flex items-center gap-2">
                <span>📅</span> Quadro de Compromisso Semanal
              </h3>
              <p class="text-xs text-[#64748B]">Clique no dia para registrar treinos, caminhadas ou descansos concluídos.</p>
            </div>
            <div class="text-xs sm:text-sm bg-[#F8FAFC] px-4 py-2 rounded-xl border border-[#E2E8F0] font-semibold text-[#0F172A] shadow-xs">
              Semana Concluída: <span id="week-progress-text" class="font-black text-[#0066FF]">{{ completedDaysCount }} / 7</span>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3" role="group" aria-label="Dias da semana">
            <button
              v-for="day in activePlan?.weekSchedule" 
              :key="day.id"
              type="button"
              :id="`day-card-${day.id}`"
              @click="toggleDayCheck(day.id)"
              :aria-pressed="!!weeklyChecks[day.id]"
              :aria-label="`${day.label}: ${day.workout}. ${weeklyChecks[day.id] ? 'Concluído' : 'Não concluído'}. Clique para alternar.`"
              class="p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col justify-between"
              :class="weeklyChecks[day.id] ? 'bg-[#F59E0B] border-[#F59E0B] text-[#0F172A] shadow-xs font-bold' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#0066FF]'"
            >
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wider block" :class="weeklyChecks[day.id] ? 'text-[#0F172A]' : 'text-[#64748B]'">
                  {{ day.label }}
                </span>
                <span class="text-xs font-semibold block mt-1 line-clamp-2" :class="weeklyChecks[day.id] ? 'text-[#0F172A]' : 'text-[#64748B]'">
                  {{ day.workout }}
                </span>

                <!-- Data de conclusão e XP quando marcado -->
                <div v-if="weeklyChecks[day.id]" class="mt-2 space-y-1">
                  <span
                    :id="`day-completed-date-${day.id}`"
                    class="text-[10px] font-black block py-0.5 px-1.5 rounded-md bg-black/10 text-[#0F172A] tabular-nums truncate"
                  >
                    📅 {{ weeklyChecksData[day.id]?.completedDate || 'Hoje' }}
                  </span>
                  <span class="text-[9px] font-black uppercase text-[#0F172A] bg-white/80 border border-amber-300 px-1.5 py-0.5 rounded-md inline-block">
                    +50 XP
                  </span>
                </div>
              </div>

              <div class="mt-3 flex items-center justify-center">
                <span 
                  :id="`day-check-${day.id}`"
                  aria-hidden="true"
                  class="w-6 h-6 rounded-full flex items-center justify-center border text-xs font-bold transition-all"
                  :class="weeklyChecks[day.id] ? 'bg-white border-[#0F172A] text-[#0F172A]' : 'border-[#CBD5E1] text-transparent'"
                >
                  ✓
                </span>
              </div>
            </button>
          </div>

          <!-- Ação Gamificada: Descanso Ativo & Recuperação (Preserva Ofensiva e Rende XP) -->
          <div class="mt-6 pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
            <div>
              <span class="text-xs font-black text-[#0F172A] flex items-center gap-1.5">
                <span>🛡️</span> Descanso Ativo & Recuperação Muscular
              </span>
              <p class="text-[11px] text-[#64748B] mt-0.5">
                Registrar dia de regeneração preserva sua ofensiva e rende <strong>+25 Iron XP</strong>.
              </p>
            </div>
            <button
              type="button"
              id="btn-register-rest-day"
              @click="handleRegisterRestDay"
              class="tap-btn px-4 py-2 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] font-bold text-xs shadow-xs flex items-center gap-2 transition-all hover:border-[#0066FF]"
              title="Registrar dia de descanso regenerativo"
            >
              <span>⚡</span>
              <span>Registrar Descanso (+25 XP)</span>
            </button>
          </div>
        </div>
      </section>

      <!-- ABA 4: HISTÓRICO DE TREINOS -->
      <section
        v-show="currentMainTab === 'history'"
        id="screen-history"
        role="tabpanel"
        aria-labelledby="tab-btn-history"
        tabindex="0"
        class="focus:outline-none"
      >
        <HistoryPanel
          :sessions="historySessions"
          :split-titles="splitTitles"
          :exercise-names="exerciseNames"
          :is-weight-loss="isWeightLoss"
        />
      </section>

    </main>

    <!--
      Aviso de erro de armazenamento (não bloqueante).

      Fica no fim do DOM e aparece como toast no rodapé, no mesmo esquema do
      #install-help-snackbar. Antes ele era `sticky top-[57px]`: dependia da
      altura do cabeçalho, cobria o menu e, quando a conta errava, sumia. No
      rodapé ele não tem.offset nenhum para acertar — e ainda é visível de
      qualquer ponto da ficha.
    -->
    <div
      v-if="storageError"
      id="storage-error-banner"
      role="alert"
      aria-live="assertive"
      class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md"
    >
      <div class="bg-rose-950/95 border border-rose-800/70 backdrop-blur rounded-2xl p-4 shadow-2xl flex items-start gap-3">
        <span aria-hidden="true">⚠️</span>
        <p class="text-xs text-rose-100 flex-1 leading-relaxed">{{ storageError }}</p>
        <button
          type="button"
          id="btn-dismiss-storage-error"
          aria-label="Dispensar aviso"
          @click="storageError = null"
          class="text-rose-300 hover:text-white w-8 h-8 -m-1.5 flex-shrink-0 flex items-center justify-center rounded-lg hover:bg-rose-900/60 transition-colors"
        >✕</button>
      </div>
    </div>

    <!-- Ajuda de instalação (substitui o alert nativo) -->
    <div
      v-if="installHelp"
      id="install-help-snackbar"
      role="status"
      aria-live="polite"
      class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md"
    >
      <div class="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-2xl flex items-start gap-3 text-[#0F172A]">
        <div class="flex-1">
          <strong class="text-[#0F172A] text-sm">{{ installHelp.title }}</strong>
          <ol class="text-xs text-[#64748B] mt-1.5 space-y-1 list-decimal list-inside">
            <li v-for="(step, i) in installHelp.steps" :key="i">{{ step }}</li>
          </ol>
        </div>
        <button
          type="button"
          aria-label="Fechar instruções de instalação"
          @click="dismissInstallHelp"
          class="text-[#64748B] hover:text-[#0F172A] px-1">
          ✕
        </button>
      </div>
    </div>

    <!-- Cronômetro Flutuante de Descanso -->
    <RestTimer ref="restTimerRef" />

    <!-- Modo Treino: tela cheia com cronômetro da sessão. Desmonta ao fechar,
         então o intervalo do relógio morre junto (z-30 deixa o RestTimer de
         z-40 flutuar por cima). -->
    <TrainingMode
      v-if="isTrainingModeOpen"
      :split="trainingSplit"
      :logs="workoutLogs"
      :started-at="trainingStartedAt"
      @close="isTrainingModeOpen = false"
      @toggle="onTrainingToggle"
      @update="onTrainingUpdate"
      @rest="triggerRestTimer"
      @finish="onTrainingFinish"
      @swap="handleTrainingSwap"
      @add-set="id => addExerciseSet(id, trainingSplit?.id)"
      @update-set="(id, setNum, field, val) => updateSetField(id, trainingSplit?.id, setNum, field, val)"
      @toggle-set="(id, setNum) => toggleSetDone(id, trainingSplit?.id, setNum)"
    />

    <!-- Modal de Onboarding / Perfil Personalizado -->
    <OnboardingModal 
      :is-open="isOnboardingOpen" 
      :initial-profile="isFirstAccess ? null : userProfile"
      @save="handleSaveProfile"
      @close="isOnboardingOpen = false; isFirstAccess = false"
    />

    <!-- Modal de Troca de Exercício Individual -->
    <ExercisePickerModal 
      :is-open="isPickerOpen"
      :current-exercise="selectedExerciseForSwap"
      :profile="userProfile"
      :catalog="fullCatalog"
      @select="handleExerciseSwapped"
      @close="isPickerOpen = false"
    />

    <!-- Adicionar exercício a uma ficha -->
    <ExercisePickerModal
      :is-open="isAdderOpen"
      :current-exercise="adderGroup"
      :profile="userProfile"
      :catalog="fullCatalog"
      mode="add"
      @select="handleExerciseAdded"
      @create="handleCreateFromAdder"
      @close="closeAdder"
    />

    <!-- CRUD de exercícios próprios -->
    <CustomExercisesModal
      :is-open="isCustomExercisesOpen"
      :exercises="customExercises"
      :initial-muscle="customExercisePreset?.muscle ?? null"
      @save="handleCustomExerciseSaved"
      @delete="handleCustomExerciseDeleted"
      @close="isCustomExercisesOpen = false"
    />

    <!-- Restauração de backup -->
    <BackupImportModal
      :is-open="isBackupImportOpen"
      :backup="pendingBackupSummary ? { summary: pendingBackupSummary } : null"
      :file-name="pendingBackupFileName"
      :warnings="pendingBackupWarnings"
      @confirm="confirmBackupImport"
      @close="closeBackupImport"
    />

    <!-- BARRA DE NAVEGAÇÃO INFERIOR MÓVEL (THUMB ZONE) -->
    <!--
      Fixa na base no celular (`md:hidden`) na zona de alcance natural do polegar,
      permitindo alternar com uma mão só entre Treino, Dieta, Agenda e Histórico,
      com atalho central para o Modo Treino.
    -->
    <div
      id="mobile-bottom-nav"
      role="navigation"
      aria-label="Navegação móvel inferior"
      class="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-[#E2E8F0] px-2 py-1 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-md transition-transform"
    >
      <div class="flex items-center justify-around max-w-md mx-auto">
        <!-- Aba Treino -->
        <button
          type="button"
          id="mobile-nav-workout"
          @click="currentMainTab = 'workout'"
          :aria-current="currentMainTab === 'workout' ? 'page' : undefined"
          class="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] py-1 transition-all rounded-xl relative"
          :class="currentMainTab === 'workout' ? 'text-[#0066FF] font-bold' : 'text-[#64748B] hover:text-[#0F172A]'"
        >
          <span class="text-xl leading-none" aria-hidden="true">🏋️</span>
          <span class="text-[10px] mt-1 font-semibold tracking-tight">Treino</span>
          <span
            v-if="currentMainTab === 'workout'"
            class="absolute -bottom-0.5 w-4 h-0.5 rounded-full bg-[#0066FF]"
          ></span>
        </button>

        <!-- Aba Dieta -->
        <button
          type="button"
          id="mobile-nav-nutrition"
          @click="currentMainTab = 'nutrition'"
          :aria-current="currentMainTab === 'nutrition' ? 'page' : undefined"
          class="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] py-1 transition-all rounded-xl relative"
          :class="currentMainTab === 'nutrition' ? 'text-[#0066FF] font-bold' : 'text-[#64748B] hover:text-[#0F172A]'"
        >
          <span class="text-xl leading-none" aria-hidden="true">🥗</span>
          <span class="text-[10px] mt-1 font-semibold tracking-tight">Dieta</span>
          <span
            v-if="currentMainTab === 'nutrition'"
            class="absolute -bottom-0.5 w-4 h-0.5 rounded-full bg-[#0066FF]"
          ></span>
        </button>

        <!-- Ação Central Destacada (FAB Modo Treino) -->
        <button
          v-if="trainingSplit"
          type="button"
          id="mobile-nav-training-fab"
          @click="openTrainingMode"
          class="flex flex-col items-center justify-center -mt-4 w-12 h-12 rounded-2xl shadow-lg border border-[#D97706] bg-[#F59E0B] text-[#0F172A] transition-transform active:scale-95 flex-shrink-0"
          title="Executar Modo Treino em Tela Cheia"
          aria-label="Abrir modo treino em tela cheia"
        >
          <span class="text-lg font-black leading-none ml-0.5" aria-hidden="true">▶</span>
        </button>

        <!-- Aba Calendário / Agenda -->
        <button
          type="button"
          id="mobile-nav-frequency"
          @click="currentMainTab = 'frequency'"
          :aria-current="currentMainTab === 'frequency' ? 'page' : undefined"
          class="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] py-1 transition-all rounded-xl relative"
          :class="currentMainTab === 'frequency' ? 'text-[#0066FF] font-bold' : 'text-[#64748B] hover:text-[#0F172A]'"
        >
          <span class="text-xl leading-none" aria-hidden="true">📅</span>
          <span class="text-[10px] mt-1 font-semibold tracking-tight">Agenda</span>
          <span
            v-if="currentMainTab === 'frequency'"
            class="absolute -bottom-0.5 w-4 h-0.5 rounded-full bg-[#0066FF]"
          ></span>
        </button>

        <!-- Aba Histórico -->
        <button
          type="button"
          id="mobile-nav-history"
          @click="openHistoryTab"
          :aria-current="currentMainTab === 'history' ? 'page' : undefined"
          class="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] py-1 transition-all rounded-xl relative"
          :class="currentMainTab === 'history' ? 'text-[#0066FF] font-bold' : 'text-[#64748B] hover:text-[#0F172A]'"
        >
          <span class="text-xl leading-none" aria-hidden="true">📈</span>
          <span class="text-[10px] mt-1 font-semibold tracking-tight">Histórico</span>
          <span
            v-if="currentMainTab === 'history'"
            class="absolute -bottom-0.5 w-4 h-0.5 rounded-full bg-[#0066FF]"
          ></span>
        </button>
      </div>
    </div>

    <!-- Modal de Criação / Edição de Ficha Personalizada -->
    <CreateSplitModal
      :is-open="isCreateSplitOpen"
      :existing-splits="activePlan?.workoutSplits || []"
      :catalog="fullCatalog"
      :editing-split="editingSplitTarget"
      :is-weight-loss="isWeightLoss"
      @close="isCreateSplitOpen = false"
      @create="handleSplitCreated"
      @update="handleSplitUpdated"
    />

    <!-- Aviso de Nova Versão do PWA -->
    <VersionUpdatePrompt
      :visible="pwa.needRefresh.value"
      :is-weight-loss="isWeightLoss"
      @update="pwa.updateApp"
      @dismiss="pwa.dismissUpdate"
    />

    <!-- Menu Lateral Deslizante (Side Drawer) -->
    <AppSideDrawer
      :is-open="isDrawerOpen"
      :user-profile="userProfile"
      :is-weight-loss="isWeightLoss"
      :active-tab="currentMainTab"
      :current-theme="currentTheme"
      :is-app-installed="isAppInstalled"
      @close="isDrawerOpen = false"
      @navigate="tab => currentMainTab = tab"
      @open-profile="isOnboardingOpen = true"
      @open-create-split="openCreateSplitModal"
      @open-custom-exercises="isCustomExercisesOpen = true"
      @generate-ai-plan="generatePlanWithAi"
      @export-backup="handleExportJSON"
      @import-backup="openBackupFilePicker"
      @install-app="handleInstallPWA"
      @set-theme="theme => currentTheme = theme"
    />

    <!-- Modal de Demonstração e Detalhes do Exercício -->
    <ExerciseDetailsModal
      :is-open="isExerciseDetailsOpen"
      :exercise="selectedExerciseForDetails"
      @close="isExerciseDetailsOpen = false"
    />

    <!-- Modal de Confirmação de Conclusão do Dia no Quadro Semanal -->
    <WorkoutDayCompletionModal
      :is-open="showDayCompletionModal"
      :suggested-day-id="dayCompletionPayload.suggestedDayId"
      :all-days="activePlan?.weekSchedule || []"
      :split-title="dayCompletionPayload.splitTitle"
      :xp-reward="50"
      @confirm="handleConfirmDayCompletion"
      @skip="handleSkipDayCompletion"
    />

    <!-- Modal de Celebração e Impacto do Treino -->
    <WorkoutCelebrationModal
      :is-open="showCelebrationModal"
      :tonnage-kg="lastSessionCelebration.tonnageKg"
      :done-sets="lastSessionCelebration.doneSets"
      :earned-xp="lastSessionCelebration.earnedXp"
      :real-world-equivalence="lastSessionCelebration.realWorldEquivalence"
      :new-badges="lastSessionCelebration.newBadges"
      @close="showCelebrationModal = false"
    />

  </div>
</template>

<script setup>
import { ref, shallowRef, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import confetti from 'canvas-confetti';
import { db, buildWeekCheckId, getCurrentWeekKey, getDayKey, migrateLegacyWeeklyChecks, migrateLegacyLogsToSession } from './db';
import { openSession, recordSet, listSessions, getLastSetsForExercises, getOpenSessionIds, closeSession, deleteSet } from './db/sessions';
import { buildPersonalizedPlan } from './engine/generators/planGenerator';
import { DIETARY_PREFERENCES } from './engine/knowledge/foodTemplates.js';
import { requestAiPlan, AiPlanError } from './engine/ai/planFromAi';
import { parseWeight, parseReps } from './engine/history';
import { calculatePersonalRecords, suggestNextLoad, getLastSetsForExercise } from './engine/progression';
import OnboardingModal from './components/OnboardingModal.vue';
import HistoryPanel from './components/HistoryPanel.vue';
import RestTimer from './components/RestTimer.vue';
import TrainingMode from './components/TrainingMode.vue';
import ExercisePickerModal from './components/ExercisePickerModal.vue';
import CustomExercisesModal from './components/CustomExercisesModal.vue';
import BackupImportModal from './components/BackupImportModal.vue';
import CreateSplitModal from './components/CreateSplitModal.vue';
import VersionUpdatePrompt from './components/VersionUpdatePrompt.vue';
import AppSideDrawer from './components/AppSideDrawer.vue';
import ExerciseDetailsModal from './components/ExerciseDetailsModal.vue';
import MuscleBodyMap from './components/MuscleBodyMap.vue';
import GamificationIronStatus from './components/GamificationIronStatus.vue';
import WorkoutTonnageLiveWidget from './components/WorkoutTonnageLiveWidget.vue';
import WorkoutCelebrationModal from './components/WorkoutCelebrationModal.vue';
import WorkoutDayCompletionModal from './components/WorkoutDayCompletionModal.vue';
import { calculateSessionGamification, checkBadges } from './engine/gamification.js';
import { loadGamificationState, recordSessionCompletion, recordRestDay, recordWeeklyDayCompletion, WEEKLY_DAY_COMPLETION_XP } from './db/gamification.js';
import { playPlateClick, playPrFanfare, triggerHaptic } from './engine/audioHaptics.js';
import { usePwaUpdate } from './composables/usePwaUpdate';
import {
  buildFullCatalog,
  listCustomExercises,
  saveCustomExercise,
  deleteCustomExercise,
  MUSCLE_LABELS,
  MUSCLE_ORDER,
  getMuscleBadgeClass,
  getMuscleDotColor,
  getMuscleTextColor
} from './db/customExercises';
import {
  buildBackup,
  backupFileName,
  summarizeBackup,
  parseBackupText,
  restoreBackup,
  hasBackupData
} from './db/backup';

// Estados Globais
const currentMainTab = ref('workout');
const currentSplitTab = ref('treino-a');
const pwa = usePwaUpdate();

// Geração por IA: estado separado do plano para que uma falha nunca
// apague o treino que o usuário já está usando.
const isAiPlanLoading = ref(false);
const aiPlanMessage = ref(null);
const isOnboardingOpen = ref(false);
const isFirstAccess = ref(false);

// Corrida entre o carregamento inicial (mount) e o primeiro save: se a
// migração/lentidão do IndexedDB fizer `hydrateFromDatabase` ler o perfil como
// null e terminar DEPOIS do save, o registro está desatualizado — aplicar o
// default por cima apagaria o perfil recém-salvo e reabriria o modal em cima
// da tela do usuário.
let profileSavedDuringLoad = false;

const isPickerOpen = ref(false);

const userProfile = ref(null);
const activePlan = ref(null);
const workoutLogs = ref({});
const weeklyChecks = ref({});

// Gamificação & Conquistas
const gamificationState = ref(loadGamificationState());
const showCelebrationModal = ref(false);
const showDayCompletionModal = ref(false);
const dayCompletionPayload = ref({
  suggestedDayId: 'seg',
  splitTitle: ''
});
const weeklyChecksData = ref({});
const lastSessionCelebration = ref({
  tonnageKg: 0,
  doneSets: 0,
  earnedXp: 0,
  realWorldEquivalence: '',
  newBadges: []
});

// Última série registrada de cada exercício do plano, usada para exibir
// "última carga" na ficha. projection exerciseId -> session_sets.
const lastSets = ref({});

// Cache da sessão aberta por split. O campo de carga dispara @input a cada
// tecla; sem o cache, cada caractere faria uma consulta para rediscover a
// sessão antes de gravar.
const openSessionBySplit = ref({});

// startedAt da sessão aberta, ao lado do id: o Modo Treino mostra o tempo
// total do treino (da primeira série até agora), não só desde que a tela
// cheia foi aberta.
const sessionStartedAtBySplit = ref({});

// Modo Treino: tela cheia com cronômetro e fila de exercícios da ficha ativa.
const isTrainingModeOpen = ref(false);
const trainingModeStartedAt = ref(null);

// Sessões carregadas sob demanda: abrir a aba Histórico faz a consulta, em vez
// de pagar esse custo no boot de quem só quer treinar.
const historySessions = ref([]);

// Semana exibida no calendário. Fica em memória para reagir à virada de semana
// sem precisar reescrever o banco inteiro.
const currentWeekKey = ref(getCurrentWeekKey());

const deferredPrompt = ref(null);
const isAppInstalled = ref(false);

// Banner de erro não bloqueante: o app continua utilizável (somente leitura)
// quando o IndexedDB falha, em vez de virar uma tela branca silenciosa.
const storageError = ref(null);

function reportStorageError(message, err) {
  console.error(message, err);
  storageError.value = message;
}

// Menu Lateral (Drawer), Detalhes de Exercício e Tema Visual
const isDrawerOpen = ref(false);
const isExerciseDetailsOpen = ref(false);
const selectedExerciseForDetails = ref(null);
const currentTheme = ref('blue'); // 'blue' (Image 2 Tecnofit) | 'orange' (Image 1 Gym)
const showSplitBodyMap = ref(false);

function openExerciseDetails(exercise) {
  selectedExerciseForDetails.value = exercise;
  isExerciseDetailsOpen.value = true;
}

// Criação e Gerenciamento de Fichas Customizadas pelo Usuário
const isCreateSplitOpen = ref(false);
const editingSplitTarget = ref(null);
const pendingDeleteSplit = ref(null);

function openCreateSplitModal() {
  editingSplitTarget.value = null;
  isCreateSplitOpen.value = true;
}

function openEditSplitModal(split) {
  editingSplitTarget.value = split;
  isCreateSplitOpen.value = true;
}

function askDeleteSplit(split) {
  pendingDeleteSplit.value = split;
}

async function handleSplitCreated({ title, subtitle, color, accentBg, exercises = [] }) {
  isCreateSplitOpen.value = false;
  if (!activePlan.value) return;

  const splitId = 'treino-custom-' + Date.now().toString(36);
  const cleanExercises = Array.isArray(exercises)
    ? exercises.map(e => ({
        id: e.id,
        name: e.name,
        muscle: e.muscle,
        series: Number(e.series) || 3,
        reps: e.reps || '8-12',
        rest: Number(e.rest) || 60,
        pattern: e.pattern || 'custom',
        tips: e.tips || '',
        imageUrl: e.imageUrl || ''
      }))
    : [];

  const newSplit = {
    id: splitId,
    title,
    subtitle: subtitle || 'Ficha personalizada pelo atleta',
    color: color || 'amber',
    accentBg: accentBg || 'bg-amber-500/10 border-amber-500/20 text-amber-300',
    exercises: cleanExercises
  };

  const nextSnapshot = JSON.parse(JSON.stringify({
    ...activePlan.value,
    workoutSplits: [...(activePlan.value.workoutSplits || []), newSplit]
  }));

  const ok = await persistOrReport('Não foi possível criar a nova ficha de treino.', async () => {
    await db.active_plan.put(nextSnapshot);
  });

  if (ok) {
    activePlan.value = nextSnapshot;
    currentSplitTab.value = splitId;
  }
}

async function handleSplitUpdated({ splitId, title, subtitle, color, accentBg }) {
  isCreateSplitOpen.value = false;
  editingSplitTarget.value = null;
  if (!activePlan.value) return;

  const nextSnapshot = JSON.parse(JSON.stringify(activePlan.value));
  const split = nextSnapshot.workoutSplits.find(s => s.id === splitId);
  if (!split) return;

  split.title = title;
  split.subtitle = subtitle;
  split.color = color;
  split.accentBg = accentBg;

  const ok = await persistOrReport('Não foi possível atualizar a ficha.', async () => {
    await db.active_plan.put(nextSnapshot);
  });

  if (ok) {
    activePlan.value = nextSnapshot;
  }
}

async function confirmDeleteSplit(splitId) {
  pendingDeleteSplit.value = null;
  if (!activePlan.value || activePlan.value.workoutSplits.length <= 1) return;

  const splitToDelete = activePlan.value.workoutSplits.find(s => s.id === splitId);
  const removedExerciseIds = splitToDelete ? splitToDelete.exercises.map(e => e.id) : [];

  const nextSnapshot = JSON.parse(JSON.stringify(activePlan.value));
  nextSnapshot.workoutSplits = nextSnapshot.workoutSplits.filter(s => s.id !== splitId);

  const ok = await persistOrReport('Não foi possível excluir a ficha.', async () => {
    for (const id of removedExerciseIds) {
      await db.workout_logs.delete(id);
    }
    await db.active_plan.put(nextSnapshot);
  });

  if (ok) {
    activePlan.value = nextSnapshot;
    if (currentSplitTab.value === splitId) {
      currentSplitTab.value = nextSnapshot.workoutSplits[0]?.id || 'treino-a';
    }
  }
}

function getSplitTabLabel(title) {
  if (!title) return '';
  // Se for no formato clássico "Treino A (Descrição...)" ou "Treino 1..."
  const match = title.match(/^(Treino\s+[A-Za-z0-9]\b)/i);
  if (match) return match[1];
  // Se já for curto (até 18 caracteres), exibe o título completo
  if (title.length <= 18) return title;
  // Caso contrário, usa as 2 primeiras palavras
  const words = title.trim().split(/\s+/);
  if (words.length <= 2) return title;
  return `${words[0]} ${words[1]}`;
}

// Referências
const restTimerRef = ref(null);
const selectedExerciseForSwap = ref(null);
const selectedSplitForSwap = ref(null);
const customExercises = ref([]);
const isCustomExercisesOpen = ref(false);
// Grupo pré-escolhado quando o CRUD é aberto a partir do seletor de adição.
const customExercisePreset = ref(null);
const isAdderOpen = ref(false);
const selectedSplitForAdd = ref(null);

// Restauração de backup: o arquivo é lido e validado antes de qualquer escrita,
// e o modal de confirmação só recebe o backup já normalizado.
const backupFileInput = ref(null);
const isBackupImportOpen = ref(false);
// `shallowRef` e não `ref`: um `ref` normal embrulha o backup num Proxy reativo,
// e o IndexedDB não sabe clonar Proxy — o restore falharia com DataCloneError
// bem depois de o usuário confirmar.
const pendingBackup = shallowRef(null);
const pendingBackupSummary = ref(null);
const pendingBackupFileName = ref('');
const pendingBackupWarnings = ref([]);

// Grupo muscular aberto no seletor de adição. Vem de um exercício já presente na
// ficha, então o seletor já nasce com o grupo e as restrições já aplicadas.
const adderGroup = computed(() => {
  if (!selectedSplitForAdd.value) return null;
  return activePlan.value?.workoutSplits
    .find(s => s.id === selectedSplitForAdd.value)
    ?.exercises?.[0] ?? null;
});

// Remoção pendente de confirmação. Só uma por vez: dois "¿remover?" abertos ao
// mesmo tempo transformam a ficha num quebra-cabeça de botões.
const pendingRemove = ref(null);

function askRemoveExercise(exercise, splitId) {
  pendingRemove.value = { exerciseId: exercise.id, name: exercise.name, splitId };
}

function cancelRemoveExercise() {
  pendingRemove.value = null;
}

function confirmRemoveExercise(splitId) {
  const target = pendingRemove.value;
  if (!target) return;

  pendingRemove.value = null;
  return removeExercise(target.exerciseId, splitId);
}

// Catálogo único para gerador e modal de troca: se um usasse o catálogo de
// fábrica e o outro o mesclado, um exercício recém-criado apareceria como
// alternativa na troca mas nunca entraria no plano — e o inverso também.
const fullCatalog = computed(() => buildFullCatalog(customExercises.value));
const hasCustomExercises = computed(() => customExercises.value.length > 0);

const isWeightLoss = computed(() => {
  return userProfile.value?.goal === 'weight_loss' || activePlan.value?.profile?.goal === 'weight_loss';
});

const appTitle = computed(() => {
  const goal = userProfile.value?.goal || activePlan.value?.profile?.goal;
  if (goal === 'weight_loss') return 'Emagrecimento Saudável';
  if (goal === 'strength') return 'Força & Carga Pro';
  if (goal === 'recomposition') return 'Recomposição Corporal';
  if (goal === 'maintenance') return 'Saúde & Manutenção';
  return 'Hipertrofia Pro';
});

const goalBadge = computed(() => {
  const goal = userProfile.value?.goal || activePlan.value?.profile?.goal;
  if (goal === 'weight_loss') return 'Definição';
  if (goal === 'strength') return 'Força';
  if (goal === 'recomposition') return 'Recomp';
  if (goal === 'maintenance') return 'Saúde';
  return 'PWA';
});

const completedDaysCount = computed(() => {
  return Object.values(weeklyChecks.value).filter(Boolean).length;
});

// ---------------------------------------------------------------------------
// Personalização Nutricional, Hábitos e Hidratação
// ---------------------------------------------------------------------------
const currentDietaryPreference = computed(() => {
  return activePlan.value?.dietaryPreference || userProfile.value?.dietaryPreference || 'omnivore';
});

async function setDietaryPreference(prefId) {
  if (!userProfile.value) return;
  userProfile.value.dietaryPreference = prefId;
  await db.user_profile.put({ id: 'current_user', ...JSON.parse(JSON.stringify(userProfile.value)) });
  await applyAndSavePlan(userProfile.value, true, true);
}

const isEditingCustomNutrition = ref(false);
const customNutritionForm = ref({
  targetCalories: 2000,
  proteinGrams: 150,
  carbsGrams: 200,
  fatGrams: 60
});

const isCustomNutritionActive = computed(() => {
  return !!activePlan.value?.customNutrition?.enabled;
});

const effectiveTargetCalories = computed(() => {
  if (isCustomNutritionActive.value && activePlan.value?.customNutrition?.targetCalories) {
    return activePlan.value.customNutrition.targetCalories;
  }
  return activePlan.value?.physiology?.targetCalories || 0;
});

const effectiveMacros = computed(() => {
  if (isCustomNutritionActive.value && activePlan.value?.customNutrition) {
    return {
      proteinGrams: activePlan.value.customNutrition.proteinGrams,
      carbsGrams: activePlan.value.customNutrition.carbsGrams,
      fatGrams: activePlan.value.customNutrition.fatGrams
    };
  }
  return activePlan.value?.physiology?.macros || { proteinGrams: 0, carbsGrams: 0, fatGrams: 0 };
});

function initCustomNutritionForm() {
  if (activePlan.value?.customNutrition?.enabled) {
    customNutritionForm.value = {
      targetCalories: activePlan.value.customNutrition.targetCalories,
      proteinGrams: activePlan.value.customNutrition.proteinGrams,
      carbsGrams: activePlan.value.customNutrition.carbsGrams,
      fatGrams: activePlan.value.customNutrition.fatGrams
    };
  } else if (activePlan.value?.physiology) {
    customNutritionForm.value = {
      targetCalories: activePlan.value.physiology.targetCalories,
      proteinGrams: activePlan.value.physiology.macros?.proteinGrams || 150,
      carbsGrams: activePlan.value.physiology.macros?.carbsGrams || 200,
      fatGrams: activePlan.value.physiology.macros?.fatGrams || 60
    };
  }
}

async function saveCustomNutrition() {
  if (!activePlan.value) return;
  const rawPlan = JSON.parse(JSON.stringify(activePlan.value));
  rawPlan.customNutrition = {
    enabled: true,
    targetCalories: Math.round(Number(customNutritionForm.value.targetCalories) || 2000),
    proteinGrams: Math.round(Number(customNutritionForm.value.proteinGrams) || 150),
    carbsGrams: Math.round(Number(customNutritionForm.value.carbsGrams) || 200),
    fatGrams: Math.round(Number(customNutritionForm.value.fatGrams) || 60)
  };
  await db.active_plan.put(rawPlan);
  activePlan.value = rawPlan;
  isEditingCustomNutrition.value = false;
}

async function resetCustomNutrition() {
  if (!activePlan.value) return;
  const rawPlan = JSON.parse(JSON.stringify(activePlan.value));
  delete rawPlan.customNutrition;
  await db.active_plan.put(rawPlan);
  activePlan.value = rawPlan;
  initCustomNutritionForm();
  isEditingCustomNutrition.value = false;
}

const todayKey = computed(() => getDayKey());
const todayHabits = computed(() => {
  return activePlan.value?.dailyHabits?.[todayKey.value] || { waterMl: 0, creatineTaken: false };
});
const todayWaterMl = computed(() => todayHabits.value.waterMl || 0);
const targetWaterMl = computed(() => {
  const liters = activePlan.value?.physiology?.water?.liters || 2.5;
  return Math.round(liters * 1000);
});
const waterPercent = computed(() => {
  if (!targetWaterMl.value) return 0;
  return Math.min(100, Math.round((todayWaterMl.value / targetWaterMl.value) * 100));
});
const isCreatineTakenToday = computed(() => !!todayHabits.value.creatineTaken);
const todayDateFormatted = computed(() => {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
});

async function addWater(amountMl) {
  if (!activePlan.value) return;
  const rawPlan = JSON.parse(JSON.stringify(activePlan.value));
  if (!rawPlan.dailyHabits) rawPlan.dailyHabits = {};
  const current = rawPlan.dailyHabits[todayKey.value] || { waterMl: 0, creatineTaken: false };
  current.waterMl = Math.max(0, (current.waterMl || 0) + amountMl);
  rawPlan.dailyHabits[todayKey.value] = current;
  await db.active_plan.put(rawPlan);
  activePlan.value = rawPlan;
}

async function resetWater() {
  if (!activePlan.value) return;
  const rawPlan = JSON.parse(JSON.stringify(activePlan.value));
  if (!rawPlan.dailyHabits) rawPlan.dailyHabits = {};
  const current = rawPlan.dailyHabits[todayKey.value] || { waterMl: 0, creatineTaken: false };
  current.waterMl = 0;
  rawPlan.dailyHabits[todayKey.value] = current;
  await db.active_plan.put(rawPlan);
  activePlan.value = rawPlan;
}

async function toggleCreatineToday() {
  if (!activePlan.value) return;
  const rawPlan = JSON.parse(JSON.stringify(activePlan.value));
  if (!rawPlan.dailyHabits) rawPlan.dailyHabits = {};
  const current = rawPlan.dailyHabits[todayKey.value] || { waterMl: 0, creatineTaken: false };
  current.creatineTaken = !current.creatineTaken;
  rawPlan.dailyHabits[todayKey.value] = current;
  await db.active_plan.put(rawPlan);
  activePlan.value = rawPlan;

  if (current.creatineTaken) {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
  }
}

const WEEK_REFRESH_INTERVAL_MS = 60 * 1000;
let weekWatcherTimer = null;

onMounted(async () => {
  setupPWA();
  await loadUserData();
  startWeekRolloverWatcher();
});

onBeforeUnmount(() => {
  if (weekWatcherTimer) clearInterval(weekWatcherTimer);
  weekWatcherTimer = null;
  if (installHelpTimer) clearTimeout(installHelpTimer);
  installHelpTimer = null;
});

function startWeekRolloverWatcher() {
  if (weekWatcherTimer) return;
  weekWatcherTimer = setInterval(() => {
    const weekKey = getCurrentWeekKey();
    if (weekKey !== currentWeekKey.value) {
      currentWeekKey.value = weekKey;
      loadWeeklyChecks().catch(err => reportStorageError('Não foi possível atualizar o calendário da nova semana.', err));
    }
  }, WEEK_REFRESH_INTERVAL_MS);
}

async function loadWeeklyChecks() {
  const weekKey = currentWeekKey.value;
  const rows = await db.weekly_checks.where('weekKey').equals(weekKey).toArray();
  const map = {};
  const dataMap = {};
  rows.forEach(r => {
    map[r.dayId] = !!r.done;
    if (r.done) {
      dataMap[r.dayId] = {
        completedAt: r.completedAt || r.updatedAt,
        completedDate: r.completedDate || (r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('pt-BR') : null),
        completedTime: r.completedTime || (r.updatedAt ? new Date(r.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null),
        workoutTitle: r.workoutTitle || null,
        xpAwarded: r.xpAwarded || null
      };
    }
  });
  weeklyChecks.value = map;
  weeklyChecksData.value = dataMap;
}

function setupPWA() {
  pwa.register();

  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
    isAppInstalled.value = true;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt.value = e;
  });

  window.addEventListener('appinstalled', () => {
    isAppInstalled.value = true;
    deferredPrompt.value = null;
  });
}

const installHelp = ref(null);

// Snackbar em vez de alert(): o alert nativo bloqueia a thread, não é
// estilizável e some sozinho sem dar chance de o usuário ler com calma.
async function handleInstallPWA() {
  if (deferredPrompt.value) {
    deferredPrompt.value.prompt();
    const { outcome } = await deferredPrompt.value.userChoice;
    if (outcome === 'accepted') {
      isAppInstalled.value = true;
    }
    deferredPrompt.value = null;
    return;
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  installHelp.value = {
    title: isIOS ? 'Instalar no iPhone / iOS' : 'Instalar como aplicativo',
    steps: isIOS
      ? [
          'Toque no botão Compartilhar (ícone com quadrado e seta).',
          'Role para baixo e selecione "Adicionar à Tela de Início".'
        ]
      : [
          'Abra o menu do navegador (três pontinhos no canto superior).',
          'Selecione "Instalar aplicativo" ou "Adicionar à tela inicial".'
        ]
  };
  scheduleInstallHelpDismiss();
}

function dismissInstallHelp() {
  installHelp.value = null;
}

let installHelpTimer = null;
function scheduleInstallHelpDismiss() {
  if (installHelpTimer) clearTimeout(installHelpTimer);
  installHelpTimer = setTimeout(() => {
    installHelp.value = null;
    installHelpTimer = null;
  }, 12000);
}

async function loadUserData() {
  // O IndexedDB pode estar indisponível (modo privativo, bloqueio de storage,
  // upgrade de schema incompatível). Sem este try/catch a rejeição do onMounted
  // deixava o app em branco sem nenhuma indicação do motivo.
  try {
    await migrateLegacyWeeklyChecks();
    await migrateLegacyLogsToSession();
    // Antes do perfil: o plano persistido precisa ser regerado com os
    // exercícios próprios já carregados, senão a ficha abriria sem eles.
    await loadCustomExercises();
    const profileRecord = await db.user_profile.get('current_user');
    await hydrateFromDatabase(profileRecord);
  } catch (err) {
    reportStorageError(
      'Não foi possível acessar o armazenamento local do navegador. Seu histórico pode não ser salvo. Verifique se cookies/armazenamento não estão bloqueados.',
      err
    );
    isOnboardingOpen.value = true;
  }
}

async function hydrateFromDatabase(profileRecord) {
  if (!profileRecord) {
    // O registro foi lido antes das migrações terminarem: se o usuário salvou
    // o perfil nesse meio-tempo, este null está desatualizado. Aplicar o
    // default por cima reabriria o onboarding e apagaria o perfil novo.
    if (profileSavedDuringLoad) return;

    // Primeiro acesso: abre o onboarding com homem/João por padrão inicial
    isFirstAccess.value = true;
    isOnboardingOpen.value = true;
    const defaultProfile = {
      userName: 'João',
      goal: 'hypertrophy',
      gender: 'male',
      ageYears: 25,
      weightKg: 74,
      heightCm: 175,
      daysPerWeek: 4,
      experienceLevel: 'intermediate',
      equipment: 'gym',
      restrictions: [],
      dietaryPreference: 'omnivore'
    };
    userProfile.value = defaultProfile;
    await db.user_profile.put({ id: 'current_user', ...defaultProfile });
    if (profileSavedDuringLoad) return;
    await applyAndSavePlan(defaultProfile, true);
  } else {
    userProfile.value = profileRecord;
    const planRecord = await db.active_plan.get('current_active_plan');

    // O plano salvo em disco não sabe nada dos exercícios que o usuário criou
    // depois. Regerar aqui garante que a ficha abra já com eles, sem obrigar o
    // usuário a passar pela tela de CRUD a cada visita.
    if (planRecord && !hasCustomExercises.value) {
      activePlan.value = planRecord;
      initCustomNutritionForm();
      if (activePlan.value.workoutSplits?.length > 0) {
        currentSplitTab.value = activePlan.value.workoutSplits[0].id;
      }
    } else {
      await applyAndSavePlan(profileRecord, true);
    }
  }

  // Carrega histórico de logs
  const logs = await db.workout_logs.toArray();
  const mapLogs = {};
  logs.forEach(l => {
    if (!l.sets || !Array.isArray(l.sets) || l.sets.length === 0) {
      l.sets = [{
        setNumber: 1,
        weight: l.weight || '',
        reps: l.reps || '',
        rir: l.rir ?? '',
        isDone: !!l.isDone
      }];
    }
    mapLogs[l.exerciseId] = l;
  });
  workoutLogs.value = mapLogs;

  await loadLastSets();

  // Carrega checks da semana corrente (o histórico de semanas anteriores fica no banco)
  await loadWeeklyChecks();
}

// Alimenta os selos de "última carga" da ficha. Falha aqui não deve impedir o
// app de abrir: o histórico é informativo, o treino é o essencial.
async function loadLastSets() {
  const exerciseIds = (activePlan.value?.workoutSplits || []).flatMap(split => split.exercises.map(ex => ex.id));
  if (exerciseIds.length === 0) {
    lastSets.value = {};
    return;
  }

  // O treino em andamento não conta como "último treino": o selo mostra a
  // última sessão anterior, que é a base da sobrecarga progressiva.
  try {
    const openIds = await getOpenSessionIds();
    lastSets.value = await getLastSetsForExercises(exerciseIds, { excludeSessionIds: openIds });
  } catch (err) {
    console.error('Não foi possível carregar o histórico de cargas.', err);
    lastSets.value = {};
  }
}

async function handleSaveProfile(newProfile) {
  try {
    isFirstAccess.value = false;
    const rawProfile = JSON.parse(JSON.stringify(newProfile));
    const preserveWorkouts = !!rawProfile.preserveWorkouts;
    delete rawProfile.preserveWorkouts;

    // Marcado antes de qualquer await: se o carregamento inicial ainda estiver
    // rodando, ele não pode aplicar o perfil default por cima do save novo.
    profileSavedDuringLoad = true;
    const plan = await applyAndSavePlan(rawProfile, true, preserveWorkouts);

    userProfile.value = rawProfile;
    await db.user_profile.put({ id: 'current_user', ...rawProfile });
    isOnboardingOpen.value = false;
    storageError.value = null;

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    return plan;
  } catch (err) {
    // O modal NÃO pode ser fechado aqui: sem plano novo o usuário ficaria preso
    // numa tela com um plano velho sem nenhuma indicação do que aconteceu.
    reportStorageError('Não foi possível salvar seu perfil e gerar o plano. Tente novamente.', err);
    return null;
  }
}

async function applyAndSavePlan(profile, persist = true, keepExistingSplits = false) {
  // O catálogo mesclado entra aqui e não só em regeneratePlanWithCustomExercises:
  // qualquer geração de plano (onboarding, reset de perfil) precisa enxergar os
  // exercícios próprios.
  const generated = buildPersonalizedPlan({
    ...profile,
    catalog: fullCatalog.value
  });
  let rawPlan = JSON.parse(JSON.stringify(generated));

  if (keepExistingSplits && activePlan.value?.workoutSplits?.length) {
    // Preserva as fichas e semana existentes, mantendo as customizações do usuário
    rawPlan.workoutSplits = JSON.parse(JSON.stringify(activePlan.value.workoutSplits));
    if (activePlan.value.weekSchedule) {
      rawPlan.weekSchedule = JSON.parse(JSON.stringify(activePlan.value.weekSchedule));
    }
    if (activePlan.value.planSource) {
      rawPlan.planSource = activePlan.value.planSource;
    }
  }

  if (activePlan.value?.customNutrition) {
    rawPlan.customNutrition = JSON.parse(JSON.stringify(activePlan.value.customNutrition));
  }
  if (activePlan.value?.dailyHabits) {
    rawPlan.dailyHabits = JSON.parse(JSON.stringify(activePlan.value.dailyHabits));
  }

  if (persist) {
    await db.active_plan.put(rawPlan);
  }

  // Só troca o plano em memória depois que a escrita terminou, para não
  // exibir um plano que falhou ao ser salvo.
  activePlan.value = rawPlan;
  initCustomNutritionForm();
  if (!activePlan.value.workoutSplits?.find(s => s.id === currentSplitTab.value)) {
    if (rawPlan.workoutSplits?.length > 0) {
      currentSplitTab.value = rawPlan.workoutSplits[0].id;
    }
  }

  // O plano novo pode ter exercícios diferentes dos antigos, então os selos de
  // "última carga" precisam ser recalculados para a ficha.
  await loadLastSets();

  return rawPlan;
}

// Mensagem por motivo: "algo deu errado" não ajuda ninguém a decidir se vale
// tentar de novo, se o perfil está errado ou se a IA choseexercise perigoso.
const AI_FAILURE_MESSAGES = {
  unavailable: 'A geração por IA precisa do servidor ligado. A ficha atual continua valendo.',
  network: 'Sem conexão com o servidor de IA. A ficha atual continua valendo.',
  timeout: 'A IA demorou demais e foi cancelada. A ficha atual continua valendo.',
  ai_disabled: 'A geração por IA está desligada no servidor. A ficha atual continua valendo.',
  rate_limited: 'Você pediu fichas com IA várias vezes seguidas. Espere um minuto e tente de novo.',
  forbidden_origin: 'O servidor recusou o pedido por origem. A ficha atual continua valendo.',
  unknown_exercise: 'A IA escolheu um exercício que não existe no catálogo. Ficha descartada.',
  unsafe_exercise: 'A IA escolheu um exercício fora das suas restrições. Ficha descartada.',
  duplicate_exercise: 'A IA repetiu um exercício na mesma ficha. Ficha descartada.',
  split_size: 'A IA montou uma ficha com tamanho inválido. Ficha descartada.',
  nutrition_out_of_range: 'As metas da IA estavam fora de uma faixa saudável. Ficha descartada.',
  nutrition_invalid: 'As metas da IA vieram incompletas. Ficha descartada.',
  // Códigos do próprio Worker: sem eles o usuário leria "falhou" para um timeout
  // que ele pode resolver simplesmente tentando de novo em instantes.
  ai_timeout: 'A IA demorou demais no servidor. Tente de novo em instantes — sua ficha atual continua valendo.',
  ai_upstream_error: 'O serviço de IA respondeu com erro. Tente de novo mais tarde — sua ficha atual continua valendo.',
  ai_empty_plan: 'A IA devolveu uma ficha vazia. Tente de novo.',
  malformed: 'A resposta da IA veio fora do formato esperado. Tente de novo.'
};

/**
 * Gera a ficha e as metas com o Gemini, pelo proxy do servidor.
 *
 * Regra que dá nome à função: o plano atual só é trocado depois que a gravação
 * no banco termina. Se a IA falhar, responder devagar ou devolver lixo, o
 * usuário continua exatamente com o treino que já tinha.
 */
async function generatePlanWithAi() {
  const profile = userProfile.value;
  if (!profile || isAiPlanLoading.value) return;

  isAiPlanLoading.value = true;
  aiPlanMessage.value = { tone: 'info', text: 'Consultando a IA... ela leva alguns segundos.' };

  try {
    const splitIds = (activePlan.value?.workoutSplits ?? []).map(s => s.id);

    const aiPlan = await requestAiPlan({
      profile,
      catalog: fullCatalog.value,
      splitIds: splitIds.length > 0 ? splitIds : ['treino-a']
    });

    const rawPlan = JSON.parse(JSON.stringify(aiPlan));

    const ok = await persistOrReport(
      'Não foi possível salvar a ficha gerada por IA.',
      () => db.active_plan.put(rawPlan)
    );
    if (!ok) {
      aiPlanMessage.value = { tone: 'error', text: 'A ficha foi gerada, mas não consegui salvar. A ficha atual continua valendo.' };
      return;
    }

    activePlan.value = rawPlan;
    currentSplitTab.value = rawPlan.workoutSplits?.[0]?.id ?? currentSplitTab.value;
    await loadLastSets();

    const count = rawPlan.workoutSplits.reduce((total, s) => total + s.exercises.length, 0);
    aiPlanMessage.value = {
      tone: 'info',
      text: `Ficha gerada por IA: ${rawPlan.workoutSplits.length} fichas, ${count} exercícios e ${rawPlan.physiology.targetCalories} kcal.${rawPlan.aiRationale ? ` ${rawPlan.aiRationale}` : ''}`
    };
  } catch (error) {
    const reason = error instanceof AiPlanError ? error.reason : 'unknown';
    aiPlanMessage.value = {
      tone: 'error',
      text: AI_FAILURE_MESSAGES[reason] ?? `A geração por IA falhou. A ficha atual continua valendo.`
    };
  } finally {
    isAiPlanLoading.value = false;
  }
}

function triggerRestTimer(restString) {
  const seconds = parseInt(restString) || 60;
  restTimerRef.value?.startTimer(seconds);
}

async function toggleExerciseCheck(exerciseId, splitId) {
  const current = workoutLogs.value[exerciseId] || { weight: '', reps: '', isDone: false };
  const nextState = !current.isDone;

  await persistExerciseLog(
    exerciseId,
    splitId,
    { isDone: nextState },
    'Não foi possível salvar a marcação do exercício.'
  );

  if (nextState) {
    const ex = activePlan.value.workoutSplits
      .find(s => s.id === splitId)
      ?.exercises?.find(e => e.id === exerciseId);
    if (ex) triggerRestTimer(ex.rest);

    // Feedback sonoro e tátil
    const pr = personalRecords.value[exerciseId];
    const weight = Number(current.weight) || 0;
    const isPr = pr && weight > (pr.maxWeightKg || 0);
    if (isPr) {
      playPrFanfare();
      triggerHaptic('pr');
    } else {
      playPlateClick();
      triggerHaptic('click');
    }
  }
}

async function updateLog(exerciseId, splitId, field, value) {
  await persistExerciseLog(
    exerciseId,
    splitId,
    { [field]: value },
    'Não foi possível salvar a carga registrada.'
  );
}

// Escrita dupla: workout_logs guarda o estado atual lido pela ficha e
// session_sets alimenta o histórico. As duas acontecem na mesma transação —
// sem isso, uma falha no meio deixaria a carga visível na tela mas ausente do
// histórico (ou o contrário), e o usuário nunca saberia qual está certo.
const writeToken = new Map();

async function persistExerciseLog(exerciseId, splitId, patch, errorMessage) {
  const previous = workoutLogs.value[exerciseId];
  const hadNoPreviousLog = previous === undefined;
  const current = previous || { weight: '', reps: '', rir: '', isDone: false, sets: [] };

  const currentSets = Array.isArray(current.sets) && current.sets.length > 0
    ? current.sets.map(s => ({ ...s }))
    : [{ setNumber: 1, weight: current.weight || '', reps: current.reps || '', rir: current.rir || '', isDone: !!current.isDone }];

  const updated = {
    ...current,
    ...patch,
    id: exerciseId,
    exerciseId,
    workoutId: splitId,
    updatedAt: new Date().toISOString()
  };

  if (patch.sets) {
    updated.sets = patch.sets;
    if (patch.sets[0]) {
      updated.weight = patch.sets[0].weight;
      updated.reps = patch.sets[0].reps;
      updated.rir = patch.sets[0].rir;
      updated.isDone = patch.sets.every(s => s.isDone);
    }
  } else {
    // Sincroniza campos de topo (weight, reps, rir, isDone) com a série 1
    currentSets[0] = {
      ...currentSets[0],
      setNumber: 1,
      weight: updated.weight ?? currentSets[0].weight,
      reps: updated.reps ?? currentSets[0].reps,
      rir: updated.rir ?? currentSets[0].rir,
      isDone: updated.isDone ?? currentSets[0].isDone
    };
    updated.sets = currentSets;
  }

  // Otimista e síncrono, antes de qualquer await. Os campos de carga disparam
  // @input a cada tecla: esperar o IndexedDB para atualizar o estado fazia a
  // segunda digitação ler um `current` ainda velho e sobrescrever a primeira.
  workoutLogs.value[exerciseId] = updated;
  const token = (writeToken.get(exerciseId) || 0) + 1;
  writeToken.set(exerciseId, token);

  const ok = await persistOrReport(errorMessage, () =>
    db.transaction('rw', db.workout_logs, db.workout_sessions, db.session_sets, async () => {
      const sessionId = await resolveOpenSessionId(splitId);
      await db.workout_logs.put(updated);
      for (const s of updated.sets) {
        await recordSet(
          {
            splitId,
            exerciseId,
            weight: s.weight,
            reps: s.reps,
            rir: s.rir ?? '',
            isDone: !!s.isDone,
            setNumber: s.setNumber || 1
          },
          { sessionId }
        );
      }
    })
  );

  if (ok) return;

  // Reverte só se nenhuma edição mais recente sobrescrever esta. Reverter
  // cegamente apagaria da tela uma carga que a pessoa acabou de digitar.
  if (writeToken.get(exerciseId) !== token) return;

  const nextLogs = { ...workoutLogs.value };
  if (hadNoPreviousLog) {
    delete nextLogs[exerciseId];
  } else {
    nextLogs[exerciseId] = current;
  }
  workoutLogs.value = nextLogs;
}

async function addExerciseSet(exerciseId, splitId) {
  const current = workoutLogs.value[exerciseId] || { weight: '', reps: '', rir: '', isDone: false, sets: [] };
  const sets = Array.isArray(current.sets) && current.sets.length > 0
    ? current.sets.map(s => ({ ...s }))
    : [{ setNumber: 1, weight: current.weight || '', reps: current.reps || '', rir: current.rir || '', isDone: !!current.isDone }];

  const lastSet = sets[sets.length - 1];
  const newSetNumber = sets.length + 1;
  const newSet = {
    setNumber: newSetNumber,
    weight: lastSet ? lastSet.weight : '',
    reps: lastSet ? lastSet.reps : '',
    rir: lastSet ? lastSet.rir : '',
    isDone: false
  };

  sets.push(newSet);
  await persistExerciseLog(
    exerciseId,
    splitId,
    { sets },
    'Não foi possível adicionar nova série.'
  );

  const ex = activePlan.value.workoutSplits
    ?.find(s => s.id === splitId)
    ?.exercises?.find(e => e.id === exerciseId);
  if (ex) triggerRestTimer(ex.rest);
}

async function removeExerciseSet(exerciseId, splitId, setNumber) {
  const current = workoutLogs.value[exerciseId];
  if (!current || !Array.isArray(current.sets) || current.sets.length <= 1) return;

  const sessionId = activeSessionId.value;
  const sets = current.sets
    .filter(s => s.setNumber !== setNumber)
    .map((s, idx) => ({ ...s, setNumber: idx + 1 }));

  if (sessionId) {
    try {
      await deleteSet(sessionId, exerciseId, setNumber);
    } catch {
      // Ignora erro se série ainda não estava no banco
    }
  }

  await persistExerciseLog(
    exerciseId,
    splitId,
    { sets },
    'Não foi possível remover a série.'
  );
}

async function updateSetField(exerciseId, splitId, setNumber, field, value) {
  const current = workoutLogs.value[exerciseId] || { weight: '', reps: '', rir: '', isDone: false, sets: [] };
  const sets = Array.isArray(current.sets) && current.sets.length > 0
    ? current.sets.map(s => ({ ...s }))
    : [{ setNumber: 1, weight: current.weight || '', reps: current.reps || '', rir: current.rir || '', isDone: !!current.isDone }];

  const target = sets.find(s => s.setNumber === setNumber);
  if (target) {
    target[field] = value;
  }

  await persistExerciseLog(
    exerciseId,
    splitId,
    { sets },
    'Não foi possível atualizar a série.'
  );
}

async function toggleSetDone(exerciseId, splitId, setNumber) {
  const current = workoutLogs.value[exerciseId] || { weight: '', reps: '', rir: '', isDone: false, sets: [] };
  const sets = Array.isArray(current.sets) && current.sets.length > 0
    ? current.sets.map(s => ({ ...s }))
    : [{ setNumber: 1, weight: current.weight || '', reps: current.reps || '', rir: current.rir || '', isDone: !!current.isDone }];

  const target = sets.find(s => s.setNumber === setNumber);
  if (target) {
    target.isDone = !target.isDone;
    if (target.isDone) {
      const ex = activePlan.value.workoutSplits
        ?.find(s => s.id === splitId)
        ?.exercises?.find(e => e.id === exerciseId);
      if (ex) triggerRestTimer(ex.rest);

      // Feedback sonoro e tátil
      const pr = personalRecords.value[exerciseId];
      const weight = Number(target.weight) || 0;
      const isPr = pr && weight > (pr.maxWeightKg || 0);
      if (isPr) {
        playPrFanfare();
        triggerHaptic('pr');
      } else {
        playPlateClick();
        triggerHaptic('click');
      }
    }
  }

  await persistExerciseLog(
    exerciseId,
    splitId,
    { sets },
    'Não foi possível marcar a série.'
  );
}

function handleRegisterRestDay() {
  const today = getDayKey();
  const res = recordRestDay(today);
  gamificationState.value = res.updated;
  if (!res.alreadyClaimed) {
    playPlateClick();
    triggerHaptic('click');
  }
}

async function toggleDayCheck(dayId) {
  const next = !weeklyChecks.value[dayId];
  const now = new Date();
  const completedDate = now.toLocaleDateString('pt-BR');
  const completedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const completedAt = now.toISOString();

  weeklyChecks.value = { ...weeklyChecks.value, [dayId]: next };

  if (next) {
    weeklyChecksData.value = {
      ...weeklyChecksData.value,
      [dayId]: {
        completedAt,
        completedDate,
        completedTime,
        workoutTitle: 'Concluído no Quadro',
        xpAwarded: WEEKLY_DAY_COMPLETION_XP
      }
    };

    const res = recordWeeklyDayCompletion({
      dayId,
      weekKey: currentWeekKey.value,
      xpReward: WEEKLY_DAY_COMPLETION_XP
    });
    gamificationState.value = res.updated;
    triggerHaptic('success');
  } else {
    const updatedData = { ...weeklyChecksData.value };
    delete updatedData[dayId];
    weeklyChecksData.value = updatedData;
    triggerHaptic('click');
  }

  await persistOrReport('Não foi possível salvar a marcação do dia.', () =>
    db.weekly_checks.put({
      id: buildWeekCheckId(dayId, currentWeekKey.value),
      weekKey: currentWeekKey.value,
      dayId,
      done: next,
      completedAt: next ? completedAt : null,
      completedDate: next ? completedDate : null,
      completedTime: next ? completedTime : null,
      xpAwarded: next ? WEEKLY_DAY_COMPLETION_XP : 0,
      updatedAt: completedAt
    })
  );

  if (next && completedDaysCount.value === 7) {
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 }
    });
  }
}

async function persistOrReport(message, action) {
  try {
    await action();
    storageError.value = null;
    return true;
  } catch (err) {
    reportStorageError(message, err);
    return false;
  }
}

async function resolveOpenSessionId(splitId) {
  const cached = openSessionBySplit.value[splitId];
  if (cached) return cached;

  const session = await openSession(splitId);
  if (session?.id) {
    openSessionBySplit.value = { ...openSessionBySplit.value, [splitId]: session.id };
    sessionStartedAtBySplit.value = { ...sessionStartedAtBySplit.value, [splitId]: session.startedAt };
  }
  return session?.id || null;
}

async function openHistoryTab() {
  currentMainTab.value = 'history';
  await loadHistory();
}

async function loadHistory() {
  try {
    historySessions.value = await listSessions({ limit: 100, includeSets: true });
  } catch (err) {
    reportStorageError('Não foi possível carregar o histórico de treinos.', err);
  }
}

const splitTitles = computed(() => {
  const map = {};
  for (const split of activePlan.value?.workoutSplits || []) map[split.id] = split.title;
  return map;
});

// Nome do exercício para o histórico: o plano atual é a fonte primária, mas
// séries podem ter vindo de exercícios já removidos da ficha depois.
const exerciseNames = computed(() => {
  const map = {};
  for (const split of activePlan.value?.workoutSplits || []) {
    for (const ex of split.exercises || []) map[ex.id] = ex.name;
  }
  for (const session of historySessions.value) {
    for (const set of session.sets || []) {
      if (!map[set.exerciseId]) map[set.exerciseId] = set.exerciseId;
    }
  }
  return map;
});

// PRs por exercício (maior carga, reps, volume, melhor 1RM estimado)
const personalRecords = computed(() => {
  const prs = calculatePersonalRecords(historySessions.value);
  const out = {};
  for (const [id, pr] of prs) {
    out[id] = pr;
  }
  return out;
});

// Gamificação ao vivo da sessão atual (tonelagem em tempo real, PRs e XP)
const liveSessionGamification = computed(() => {
  return calculateSessionGamification({
    workoutLogs: workoutLogs.value,
    existingPrs: personalRecords.value,
    isFinished: false
  });
});

// Sugestões de próxima carga por exercício (derivadas do histórico)
const nextLoadSuggestions = computed(() => {
  const suggestions = {};
  const splits = activePlan.value?.workoutSplits || [];
  for (const split of splits) {
    for (const ex of split.exercises || []) {
      const last = getLastSetsForExercise(historySessions.value, ex.id);
      const range = Array.isArray(ex.repsRange) && ex.repsRange.length === 2 ? ex.repsRange : null;
      const sugg = suggestNextLoad({
        exerciseId: ex.id,
        exercise: ex,
        lastSets: last,
        targetRepsRange: range,
        defaultWeightKg: Number(ex.defaultWeight) || 0,
        defaultReps: Number(ex.defaultReps) || 10
      });
      if (sugg && sugg.exerciseId) {
        suggestions[ex.id] = sugg;
      }
    }
  }
  return suggestions;
});

// Evita mostrar "último treino" para a série que o usuário está preenchendo
// agora: o valor viria do próprio input, não do histórico.
function lastSetLabel(exerciseId) {
  const current = workoutLogs.value[exerciseId];
  if (current && (current.weight || current.reps)) return null;

  const set = lastSets.value[exerciseId];
  if (!set) return null;

  const weight = parseWeight(set.weight);
  const reps = parseReps(set.reps);
  if (weight !== null && reps !== null) return `${String(weight).replace('.', ',')} kg × ${reps}`;
  if (weight !== null) return `${String(weight).replace('.', ',')} kg`;
  return null;
}

// Id da sessão aberta do split em edição. Enquanto for null, não há treino em
// andamento e o botão "Concluir treino" não aparece.
const activeSessionId = computed(() => openSessionBySplit.value[currentSplitTab.value] || null);

async function finishCurrentSession() {
  const sessionId = activeSessionId.value;
  if (!sessionId) return;

  const ok = await persistOrReport('Não foi possível concluir o treino.', async () => {
    await closeSession(sessionId);
    if (historySessions.value.length > 0) await loadHistory();
  });

  if (!ok) return;

  // Gamificação: consolida impacto, tonelagem, XP e badges
  const stats = calculateSessionGamification({
    workoutLogs: workoutLogs.value,
    existingPrs: personalRecords.value,
    isFinished: true
  });

  const completedSets = [];
  for (const log of Object.values(workoutLogs.value || {})) {
    const sets = Array.isArray(log?.sets) && log.sets.length > 0
      ? log.sets
      : [{ weight: log?.weight, reps: log?.reps, isDone: !!log?.isDone }];
    for (const s of sets) {
      if (s.isDone) completedSets.push(s);
    }
  }

  const newBadges = checkBadges({
    sets: completedSets,
    userProfile: userProfile.value,
    lifetimeTonnageKg: gamificationState.value.lifetimeTonnageKg + stats.tonnageKg,
    unlockedBadgeIds: gamificationState.value.unlockedBadgeIds
  });

  const updatedGamification = recordSessionCompletion({
    earnedXp: stats.earnedXp,
    tonnageKg: stats.tonnageKg,
    newBadgeIds: newBadges.map(b => b.id),
    currentWeekKey: currentWeekKey.value
  });

  gamificationState.value = updatedGamification;
  lastSessionCelebration.value = {
    tonnageKg: stats.tonnageKg,
    doneSets: stats.doneSetsCount,
    earnedXp: stats.earnedXp,
    realWorldEquivalence: stats.realWorldEquivalence,
    newBadges
  };

  const next = { ...openSessionBySplit.value };
  delete next[currentSplitTab.value];
  openSessionBySplit.value = next;

  const startedAtBySplit = { ...sessionStartedAtBySplit.value };
  delete startedAtBySplit[currentSplitTab.value];
  sessionStartedAtBySplit.value = startedAtBySplit;

  // Com a sessão encerrada, ela passa a contar como "último treino" nos selos.
  await loadLastSets();

  // Sugestão e confirmação de marcação do dia da semana
  const currentSplitObj = (activePlan.value?.workoutSplits || []).find(s => s.id === currentSplitTab.value);
  const splitTitle = currentSplitObj?.title || 'Treino Concluído';
  const suggestedDayId = getTodayScheduleDayId();

  dayCompletionPayload.value = {
    suggestedDayId,
    splitTitle
  };
  showDayCompletionModal.value = true;
  triggerHaptic('celebrate');
}

function getTodayScheduleDayId() {
  const DAY_MAP = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  const todayId = DAY_MAP[new Date().getDay()];
  const schedule = activePlan.value?.weekSchedule || [];
  if (schedule.some(d => d.id === todayId)) {
    return todayId;
  }
  const pending = schedule.find(d => !weeklyChecks.value[d.id]);
  return pending?.id || schedule[0]?.id || 'seg';
}

async function handleConfirmDayCompletion({ dayId, dayLabel, completedAt, completedDate, completedTime }) {
  showDayCompletionModal.value = false;

  weeklyChecks.value = { ...weeklyChecks.value, [dayId]: true };
  weeklyChecksData.value = {
    ...weeklyChecksData.value,
    [dayId]: {
      completedAt,
      completedDate,
      completedTime,
      workoutTitle: dayCompletionPayload.value.splitTitle,
      xpAwarded: WEEKLY_DAY_COMPLETION_XP
    }
  };

  await persistOrReport('Não foi possível salvar a marcação do dia.', () =>
    db.weekly_checks.put({
      id: buildWeekCheckId(dayId, currentWeekKey.value),
      weekKey: currentWeekKey.value,
      dayId,
      done: true,
      completedAt,
      completedDate,
      completedTime,
      workoutTitle: dayCompletionPayload.value.splitTitle,
      xpAwarded: WEEKLY_DAY_COMPLETION_XP,
      updatedAt: completedAt
    })
  );

  const dayXpRes = recordWeeklyDayCompletion({
    dayId,
    weekKey: currentWeekKey.value,
    xpReward: WEEKLY_DAY_COMPLETION_XP
  });
  gamificationState.value = dayXpRes.updated;

  if (lastSessionCelebration.value && dayXpRes.xpGained > 0) {
    lastSessionCelebration.value = {
      ...lastSessionCelebration.value,
      earnedXp: lastSessionCelebration.value.earnedXp + dayXpRes.xpGained
    };
  }

  confetti({
    particleCount: 120,
    spread: 90,
    origin: { y: 0.5 }
  });
  triggerHaptic('celebrate');
  showCelebrationModal.value = true;
}

function handleSkipDayCompletion() {
  showDayCompletionModal.value = false;
  showCelebrationModal.value = true;
  triggerHaptic('celebrate');
}

// --- Modo Treino (tela cheia durante a execução da ficha) ---

const trainingSplit = computed(() =>
  (activePlan.value?.workoutSplits || []).find(split => split.id === currentSplitTab.value) || null
);

// O cronômetro prefere o startedAt real da sessão (tempo total do treino);
// antes da primeira série a sessão ainda não existe, então vale desde que a
// tela cheia foi aberta.
const trainingStartedAt = computed(
  () => sessionStartedAtBySplit.value[currentSplitTab.value] ?? trainingModeStartedAt.value
);

function openTrainingMode() {
  if (!trainingSplit.value) return;
  trainingModeStartedAt.value = new Date().toISOString();
  isTrainingModeOpen.value = true;
}

function onTrainingToggle(exerciseId) {
  return toggleExerciseCheck(exerciseId, currentSplitTab.value);
}

function onTrainingUpdate(exerciseId, field, value) {
  return updateLog(exerciseId, currentSplitTab.value, field, value);
}

async function onTrainingFinish() {
  await finishCurrentSession();
  isTrainingModeOpen.value = false;
  trainingModeStartedAt.value = null;
}

function openExercisePicker(exercise, splitId) {
  selectedExerciseForSwap.value = exercise;
  selectedSplitForSwap.value = splitId;
  isPickerOpen.value = true;
}

function handleTrainingSwap(exercise) {
  if (!exercise || !trainingSplit.value) return;
  openExercisePicker(exercise, trainingSplit.value.id);
}

// --- Editor de ficha (ordenar, remover, adicionar) ---

function openAdderFor(splitId) {
  selectedSplitForAdd.value = splitId;
  isAdderOpen.value = true;
}

function handleExerciseAdded(exercise) {
  const splitId = selectedSplitForAdd.value;
  closeAdder();
  if (!splitId) return;
  return addExerciseToSplit(exercise, splitId);
}

// Abre o CRUD já com o grupo do seletor pré-escolhido, para o usuário não ter
// que escolher de novo o mesmo grupo muscular.
function handleCreateFromAdder(muscleParam) {
  const muscle = (typeof muscleParam === 'string' ? muscleParam : null) || adderGroup.value?.muscle || null;
  closeAdder();
  isCustomExercisesOpen.value = true;
  customExercisePreset.value = muscle ? { muscle } : null;
}

function closeExercisePicker() {
  isPickerOpen.value = false;
  selectedExerciseForSwap.value = null;
  selectedSplitForSwap.value = null;
}

function closeAdder() {
  isAdderOpen.value = false;
  selectedSplitForAdd.value = null;
}

/**
 * Aplica uma mudança na lista de exercícios de uma ficha.
 *
 * Tudo que mexe na ordem ou na composição passa por aqui porque o mesmo cuidado
 * vale para os três casos: o log de treino é chaveado por exerciseId, então
 * qualquer exercício que sai da ficha precisa ter o log removido na mesma
 * transação, e a UI só é atualizada depois que a escrita termina.
 */
async function mutateSplitExercises(splitId, mutate, errorMessage) {
  const split = activePlan.value?.workoutSplits.find(s => s.id === splitId);
  if (!split) return;

  const previousIds = split.exercises.map(e => e.id);
  const nextSnapshot = JSON.parse(JSON.stringify(activePlan.value));
  const nextSplit = nextSnapshot.workoutSplits.find(s => s.id === splitId);
  const previous = nextSplit.exercises;

  const result = mutate([...previous]);
  if (!result) return;

  nextSplit.exercises = result;
  const nextIds = result.map(e => e.id);

  // Duplicado dentro da mesma ficha quebraria a lógica de carga por exercício:
  // as duas linhas apontariam para o mesmo log.
  if (new Set(nextIds).size !== nextIds.length) {
    reportStorageError('Essa ficha já tem esse exercício. Escolha outro.', null);
    return;
  }

  const removedIds = previousIds.filter(id => !nextIds.includes(id));

  const ok = await persistOrReport(errorMessage, async () => {
    for (const id of removedIds) {
      await db.workout_logs.delete(id);
    }
    await db.active_plan.put(nextSnapshot);
  });

  if (!ok) return;

  activePlan.value = nextSnapshot;
  await loadLastSets();
}

function moveExercise(exerciseId, splitId, direction) {
  return mutateSplitExercises(
    splitId,
    (list) => {
      const idx = list.findIndex(e => e.id === exerciseId);
      const target = idx + direction;
      if (idx === -1 || target < 0 || target >= list.length) return null;
      [list[idx], list[target]] = [list[target], list[idx]];
      return list;
    },
    'Não foi possível reordenar os exercícios.'
  );
}

function removeExercise(exerciseId, splitId) {
  return mutateSplitExercises(
    splitId,
    (list) => {
      const next = list.filter(e => e.id !== exerciseId);
      return next.length === list.length ? null : next;
    },
    'Não foi possível remover o exercício.'
  );
}

function addExerciseToSplit(exercise, splitId) {
  return mutateSplitExercises(
    splitId,
    (list) => [...list, exercise],
    'Não foi possível adicionar o exercício.'
  );
}

// ---------------------------------------------------------------------------
// Organização e visualização por grupos musculares
// ---------------------------------------------------------------------------
const activeMuscleFilter = ref({});

function getSplitMuscleGroups(split) {
  if (!split?.exercises) return [];
  const muscles = new Set(split.exercises.map(e => e.muscle).filter(Boolean));
  return MUSCLE_ORDER.filter(m => muscles.has(m));
}

function getMuscleCountInSplit(split, muscle) {
  if (!split?.exercises) return 0;
  return split.exercises.filter(e => e.muscle === muscle).length;
}

function getVisibleExercises(split) {
  if (!split?.exercises) return [];
  const filter = activeMuscleFilter.value[split.id];
  if (!filter || filter === 'all') return split.exercises;
  return split.exercises.filter(e => e.muscle === filter);
}

function shouldShowMuscleHeader(split, ex, index) {
  const filter = activeMuscleFilter.value[split.id];
  if (filter && filter !== 'all') {
    return index === 0;
  }
  const list = getVisibleExercises(split);
  if (index === 0) return true;
  return list[index - 1]?.muscle !== ex.muscle;
}

function toggleMuscleFilter(splitId, muscle) {
  if (activeMuscleFilter.value[splitId] === muscle) {
    activeMuscleFilter.value[splitId] = 'all';
  } else {
    activeMuscleFilter.value[splitId] = muscle;
  }
}

function sortSplitByMuscle(splitId) {
  return mutateSplitExercises(
    splitId,
    (list) => {
      const sorted = [...list].sort((a, b) => {
        const orderA = MUSCLE_ORDER.indexOf(a.muscle);
        const orderB = MUSCLE_ORDER.indexOf(b.muscle);
        const rankA = orderA === -1 ? 999 : orderA;
        const rankB = orderB === -1 ? 999 : orderB;
        return rankA - rankB;
      });
      return sorted;
    },
    'Não foi possível agrupar os exercícios por músculo.'
  );
}

async function loadCustomExercises() {
  customExercises.value = await listCustomExercises();
}

function openCustomExercises() {
  customExercisePreset.value = null;
  isCustomExercisesOpen.value = true;
}

// Depois de salvar ou excluir, o plano é regerado para que a ficha reflita a
// mudança. Sem isso, o exercício recém-criado só apareceria na próxima
// abertura do app.
async function regeneratePlanWithCustomExercises() {
  const profile = userProfile.value;
  if (!profile) return;

  const regenerated = JSON.parse(JSON.stringify(
    buildPersonalizedPlan({ ...profile, catalog: fullCatalog.value })
  ));

  const ok = await persistOrReport(
    'Não foi possível salvar seu exercício e atualizar o plano.',
    () => db.active_plan.put(regenerated)
  );
  if (!ok) return;

  activePlan.value = regenerated;
  if (!regenerated.workoutSplits?.some(s => s.id === currentSplitTab.value)) {
    currentSplitTab.value = regenerated.workoutSplits?.[0]?.id ?? currentSplitTab.value;
  }
  await loadLastSets();
}

async function handleCustomExerciseSaved(exercise) {
  const ok = await persistOrReport(
    'Não foi possível salvar o exercício.',
    () => saveCustomExercise(exercise)
  );
  if (!ok) return;

  await loadCustomExercises();
  await regeneratePlanWithCustomExercises();
}

async function handleCustomExerciseDeleted(id) {
  const ok = await persistOrReport(
    'Não foi possível excluir o exercício.',
    () => deleteCustomExercise(id)
  );
  if (!ok) return;

  await loadCustomExercises();
  await regeneratePlanWithCustomExercises();
}

async function handleExerciseSwapped(newExercise) {
  if (!selectedSplitForSwap.value || !selectedExerciseForSwap.value) return;

  const split = activePlan.value.workoutSplits.find(s => s.id === selectedSplitForSwap.value);
  if (!split) return;

  const idx = split.exercises.findIndex(e => e.id === selectedExerciseForSwap.value.id);
  if (idx === -1) return;

  const previousExerciseId = split.exercises[idx].id;
  const snapshot = JSON.parse(JSON.stringify(activePlan.value));
  const nextSnapshot = JSON.parse(JSON.stringify(snapshot));

  const nextSplit = nextSnapshot.workoutSplits.find(s => s.id === split.id);
  nextSplit.exercises[idx] = newExercise;

  const ok = await persistOrReport('Não foi possível salvar a substituição do exercício.', async () => {
    // O log é chaveado por exerciseId. Sem tratar isso, o histórico do exercício
    // removido ficaria órfão e reapareceria atribuido ao exercício novo.
    if (previousExerciseId !== newExercise.id) {
      await db.workout_logs.delete(previousExerciseId);
    }
    await db.active_plan.put(nextSnapshot);
  });

  if (!ok) return;

  activePlan.value = nextSnapshot;
  if (previousExerciseId !== newExercise.id) {
    const nextLogs = { ...workoutLogs.value };
    delete nextLogs[previousExerciseId];
    workoutLogs.value = nextLogs;
    await loadLastSets();
  }
}

async function resetAllProgress() {
  if (!confirm('Deseja resetar as marcações de exercícios, o histórico de treinos e o calendário da semana?')) return;

  const ok = await persistOrReport('Não foi possível apagar o histórico.', async () => {
    await db.transaction(
      'rw',
      db.workout_logs,
      db.weekly_checks,
      db.workout_sessions,
      db.session_sets,
      async () => {
        await db.workout_logs.clear();
        await db.weekly_checks.clear();
        // O histórico das sessões precisa cair junto: deixar as tabelas novas
        // intactas faria a tela de histórico mostrar treinos "apagados".
        await db.workout_sessions.clear();
        await db.session_sets.clear();
      }
    );
  });

  if (!ok) return;

  workoutLogs.value = {};
  weeklyChecks.value = {};
  lastSets.value = {};
  openSessionBySplit.value = {};
  sessionStartedAtBySplit.value = {};
}

async function handleExportJSON() {
  // Lê do banco, e não dos refs da tela: o arquivo precisa ser um retrato do que
  // está salvo, incluindo exercícios próprios e séries que a tela ainda não teve
  // chance de recarregar.
  const backup = await buildBackup();

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backupFileName();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------------------------------------------------------------------------
// Restauração de backup
// ---------------------------------------------------------------------------

function openBackupFilePicker() {
  backupFileInput.value?.click();
}

async function handleBackupFileSelected(event) {
  const file = event.target.files?.[0];
  // O input é zerado de propósito: sem isso, escolher o mesmo arquivo duas vezes
  // seguidas não dispara o evento change e o usuário não consegue restaurar.
  event.target.value = '';
  if (!file) return;

  let text;
  try {
    text = await file.text();
  } catch (err) {
    reportStorageError('Não foi possível ler o arquivo de backup.', err);
    return;
  }

  const parsed = parseBackupText(text);
  if (!parsed.ok) {
    reportStorageError(`Backup inválido: ${parsed.error}`, null);
    return;
  }

  if (!hasBackupData(parsed.backup)) {
    reportStorageError('Este arquivo de backup não tem perfil, plano nem histórico para restaurar.', null);
    return;
  }

  // Nada é gravado ainda: a confirmação mostra o que será substituído.
  pendingBackup.value = parsed.backup;
  pendingBackupSummary.value = summarizeBackup(parsed.backup);
  pendingBackupFileName.value = file.name;
  pendingBackupWarnings.value = parsed.warnings;
  isBackupImportOpen.value = true;
}

function closeBackupImport() {
  isBackupImportOpen.value = false;
  pendingBackup.value = null;
  pendingBackupSummary.value = null;
  pendingBackupFileName.value = '';
  pendingBackupWarnings.value = [];
}

async function confirmBackupImport() {
  const backup = pendingBackup.value;
  if (!backup) return;

  // O modal sai antes da escrita: se a restauração demorar, o usuário não fica
  // preso numa tela que promete "substituir dados" enquanto isso já acontece.
  closeBackupImport();

  const counts = await persistOrReport('Não foi possível restaurar o backup.', () =>
    restoreBackup(backup)
  );
  if (!counts) return;

  // O estado em memória era do aparelho anterior. Recarregar tudo do disco é o
  // que garante que nenhuma tela mostre resíduo do backup anterior — inclusive
  // as séries abertas, que sem isso voltariam a ser anexadas à sessão antiga.
  await rehydrateAfterRestore();
}

async function rehydrateAfterRestore() {
  openSessionBySplit.value = {};
  sessionStartedAtBySplit.value = {};
  lastSets.value = {};
  workoutLogs.value = {};
  weeklyChecks.value = {};
  weeklyChecksData.value = {};
  historySessions.value = [];
  currentMainTab.value = 'workout';

  await loadCustomExercises();
  const profileRecord = await db.user_profile.get('current_user');
  await hydrateFromDatabase(profileRecord);
  await loadHistory();
}
</script>
