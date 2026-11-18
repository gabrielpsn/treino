<template>
  <section
    v-show="currentMainTab === 'workout'"
    id="screen-workout"
    role="tabpanel"
    aria-labelledby="tab-btn-workout"
    tabindex="0"
    class="space-y-6 focus:outline-none"
  >
    <!-- Sugestão / estado do deload automático -->
    <DeloadBanner
      :evaluation="isProgramActive ? null : deloadEvaluation"
      @start="startDeload"
      @dismiss="dismissDeload"
      @end="endDeload"
    />
  
    <!-- Seletor de Fichas (Sub-tabs A, B, C...) -->
    <div id="workout-sheet-anchor" class="flex items-center justify-between flex-wrap gap-3 border-b border-[#E2E8F0] pb-4 scroll-mt-24">
      <div>
        <h3 class="text-xl font-extrabold text-[#0066FF] tracking-tight flex items-center gap-2">
          Sua ficha de treino <HelpTip term="ficha" />
        </h3>
        <p class="text-xs text-[#64748B]">
          Escolha a ficha do dia, faça os exercícios e anote o peso e as repetições. O app salva sozinho.
          <button type="button" id="btn-open-glossary-inline" class="font-bold text-[#0066FF] underline" @click="openGlossary">Termos da musculação</button>
        </p>
      </div>
  
      <!-- Seletor de Fichas (Sub-tabs A, B, C...) em scroll horizontal -->
      <div class="w-full flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none" role="tablist" aria-label="Seletor de Fichas de Treino">
        <button 
          v-for="split in activePlan?.workoutSplits" 
          :key="split.id"
          :id="`btn-split-${split.id}`"
          role="tab"
          :aria-selected="currentSplitTab === split.id"
          @click="currentSplitTab = split.id"
          :class="currentSplitTab === split.id ? 'bg-[#0066FF] text-white font-bold shadow-xs' : 'text-[#64748B] hover:text-[#0066FF] bg-white border border-[#E2E8F0]'"
          class="tap-btn px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex-shrink-0"
        >
          {{ getSplitTabLabel(split.title) }}
        </button>
      </div>
  
      <!-- Botões de Ação Principais: Grade de 12 colunas no mobile (6 colunas = 50% cada, evitando espaços vazios) -->
      <div class="grid grid-cols-12 gap-2 w-full pt-1 sm:flex sm:flex-wrap sm:items-center">
        <!-- Botão para o usuário criar sua própria ficha de treino -->
        <button
          type="button"
          id="btn-open-create-split"
          @click="openCreateSplitModal"
          class="tap-btn col-span-6 sm:w-auto w-full min-h-[44px] px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold bg-white text-[#0F172A] hover:bg-[#F1F5F9] border border-[#E2E8F0] transition-all flex items-center justify-center gap-1.5 shadow-xs"
          title="Criar sua própria ficha de treino personalizada"
        >
          <span aria-hidden="true">➕</span>
          <span>Criar Ficha</span>
        </button>
  
        <button
          type="button"
          id="btn-open-custom-exercises"
          @click="openCustomExercises"
          class="tap-btn col-span-6 sm:w-auto w-full min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] transition-all flex items-center justify-center shadow-xs"
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
          class="tap-btn col-span-6 sm:w-auto w-full min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold bg-[#F59E0B] text-[#0F172A] hover:bg-[#D97706] border border-[#D97706] transition-all flex items-center justify-center gap-1 shadow-xs"
          title="Abrir o modo treino em tela cheia"
        >
          <span aria-hidden="true">▶</span> Modo Treino
        </button>
  
        <!-- Geração por IA -->
        <button
          v-if="userProfile"
          type="button"
          id="btn-generate-ai-plan"
          @click="generatePlanWithAi"
          :disabled="isAiPlanLoading"
          class="tap-btn col-span-6 sm:w-auto w-full min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-xs"
          :class="isAiPlanLoading
            ? 'border-[#E2E8F0] bg-white text-[#64748B]'
            : 'border-[#0066FF]/30 bg-white text-[#0066FF] hover:bg-[#F1F5F9]'"
          :title="isAiPlanLoading ? 'Gerando ficha com IA...' : 'Gerar a ficha e as metas com IA (Gemini)'"
        >
          <span aria-hidden="true">{{ isAiPlanLoading ? '⏳' : '🤖' }}</span>
          {{ isAiPlanLoading ? 'Gerando...' : 'Gerar com IA' }}
        </button>
  
        <button
          v-if="activeSessionId"
          type="button"
          id="btn-finish-session"
          @click="finishCurrentSession"
          class="tap-btn col-span-12 sm:w-auto w-full min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-[#0066FF] hover:bg-[#0052cc] text-white transition-all flex items-center justify-center shadow-xs"
          title="Encerrar este treino e registrá-lo no histórico"
        >
          ✓ Concluir treino
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
        <template v-else-if="activePlan?.planSource === 'trainer'">
          🧑‍🏫 Ficha enviada pelo seu personal{{ activePlan.trainerName ? ` (${activePlan.trainerName})` : '' }}.
        </template>
        <template v-else-if="activePlan?.planSource === 'ai'">
          🤖 Ficha personalizada pela IA para o seu objetivo e suas restrições.
        </template>
        <template v-else>
          ⚡ Ficha montada pelo app para o seu objetivo. Quer outra opção? Toque em "Gerar com IA".
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
  
          <!-- Fora do modo de edição, só um botão: menos opções na tela de treino. -->
          <button
            type="button"
            :id="`btn-sheet-edit-${split.id}`"
            :aria-pressed="isSheetEditMode ? 'true' : 'false'"
            @click="isSheetEditMode = !isSheetEditMode; cancelRemoveExercise()"
            class="tap-btn min-h-10 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1 shadow-xs w-full sm:w-auto"
            :class="isSheetEditMode ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-[#E2E8F0] text-[#0F172A] hover:bg-[#F1F5F9]'"
          >
            {{ isSheetEditMode ? '✓ Terminar edição' : '✏️ Editar ficha' }}
          </button>
  
          <!-- Botões de ação do split (Grade de 2 colunas no mobile para preencher o espaço) -->
          <div v-if="isSheetEditMode" class="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto self-end sm:self-auto flex-shrink-0">
            <button
              type="button"
              :id="`btn-edit-split-${split.id}`"
              @click="openEditSplitModal(split)"
              class="tap-btn min-h-10 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F1F5F9] transition-colors flex items-center justify-center gap-1 shadow-xs"
              title="Editar nome e cor desta ficha"
            >
              <span aria-hidden="true">✏️</span>
              <span>Editar</span>
            </button>
  
            <button
              v-if="activePlan?.workoutSplits?.length > 1"
              type="button"
              :id="`btn-delete-split-${split.id}`"
              @click="askDeleteSplit(split)"
              class="tap-btn min-h-10 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors flex items-center justify-center gap-1 shadow-xs"
              title="Excluir esta ficha de treino"
            >
              <span aria-hidden="true">🗑</span>
              <span>Excluir</span>
            </button>
  
            <button
              type="button"
              :id="`btn-group-by-muscle-${split.id}`"
              @click="sortSplitByMuscle(split.id)"
              class="tap-btn min-h-10 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors flex items-center justify-center gap-1 shadow-xs"
              title="Organizar e agrupar exercícios por grupo muscular"
            >
              <span aria-hidden="true">⚡</span>
              <span>Agrupar</span>
            </button>
  
            <button
              type="button"
              :id="`btn-add-exercise-${split.id}`"
              @click="openAdderFor(split.id)"
              :class="activePlan?.workoutSplits?.length > 1 ? 'col-span-1' : 'col-span-2 sm:col-span-1'"
              class="tap-btn min-h-10 px-3 py-1.5 rounded-xl text-xs font-bold border border-[#F59E0B] bg-[#F59E0B] text-[#0F172A] hover:bg-[#D97706] transition-colors flex items-center justify-center shadow-xs"
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
        <div :class="getSplitAccentBg(split)" class="p-4 rounded-2xl border text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xs">
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
                <h5 class="text-xs font-black tracking-wider uppercase text-[#0F172A]">
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
                <div class="flex flex-col items-center gap-0.5 flex-shrink-0 mt-1 md:mt-0">
                  <button 
                    type="button"
                    :id="`btn-check-${ex.id}`"
                    @click="toggleExerciseCheck(ex.id, split.id)"
                    :aria-pressed="!!workoutLogs[ex.id]?.isDone"
                    :aria-label="workoutLogs[ex.id]?.isDone ? `Marcar ${ex.name} como pendente` : `Marcar ${ex.name} como concluído`"
                    class="check-btn flex-shrink-0"
                    :class="workoutLogs[ex.id]?.isDone ? 'bg-[#10B981] border-[#10B981] text-white font-black text-sm shadow-xs' : 'bg-white border-[#CBD5E1] hover:border-[#F59E0B] text-transparent'"
                  >
                    ✓
                  </button>
                  <span class="text-[9px] font-bold uppercase" :class="workoutLogs[ex.id]?.isDone ? 'text-emerald-600' : 'text-[#94A3B8]'" aria-hidden="true">
                    {{ workoutLogs[ex.id]?.isDone ? 'Feito' : 'Feito?' }}
                  </span>
                </div>
  
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
                    <span aria-hidden="true">▶</span>
                    <span>Como fazer</span>
                  </button>
  
  <button
                type="button"
                :id="`btn-swap-${ex.id}`"
                @click="openExercisePicker(ex, split.id)" 
                :aria-label="`Substituir exercício ${ex.name}`"
                class="action-btn text-[#64748B] hover:text-[#0066FF] border-[#E2E8F0]"
                style="width: auto; padding: 0 0.6rem;"
                title="Trocar por outro exercício (ex.: aparelho ocupado)"
              >
                <span aria-hidden="true">🔄</span>
                <span class="text-[10px] font-bold ml-0.5">Trocar</span>
              </button>
  
              <template v-if="isSheetEditMode">
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
              </template>
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
                    Série {{ workoutLogs[ex.id]?.sets?.length || 1 }}
                  </span>
                  <span :class="isWeightLoss ? 'text-rose-600' : 'text-[#0066FF]'" class="font-semibold">{{ programSeriesLabel(ex.defaultSeries) }}</span>
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
                  <HelpTip term="descanso" :suffix="ex.id" />
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
                <p
                  v-if="deloadHint(ex.id)"
                  :id="`deload-load-${ex.id}`"
                  class="text-[11px] font-bold text-emerald-700 mt-1"
                >
                  🧘 Deload: use ~{{ deloadHint(ex.id) }} e metade das séries
                </p>
                <p
                  v-if="programHint()"
                  :id="`program-hint-${ex.id}`"
                  class="text-[11px] font-bold text-[#0066FF] mt-1"
                >
                  🎓 {{ programHint() }}
                </p>
              </div>
            </div>
  
            <!-- Lado Direito: Inputs de Carga e Reps (Ocultos se for Cardio Contínuo) -->
            <div v-if="ex.muscle !== 'cardio'" class="flex flex-col gap-2 self-end md:self-auto w-full md:w-auto">
              <div class="flex flex-wrap items-center gap-2 sm:gap-3">
                <div
                  class="flex items-center gap-2 bg-[#F8FAFC] px-3 py-2 rounded-xl border border-[#E2E8F0] shadow-xs flex-1 md:flex-initial transition-all focus-within:border-[#0066FF] focus-within:ring-2 focus-within:ring-[#0066FF]/20 focus-within:bg-white"
                >
                  <label :for="`input-weight-${ex.id}`" class="text-xs text-[#64748B] font-bold uppercase tracking-wider">Peso:</label>
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
                  <HelpTip term="reps" :suffix="ex.id" />
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
                  <label :for="`input-rir-${ex.id}`" class="text-xs text-[#64748B] font-bold uppercase tracking-wider">Sobrou:</label>
                  <HelpTip term="rir" :suffix="ex.id" />
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
</template>

<script setup>
// Aba extraída do App.vue. O estado continua no App e chega por provide/inject
// ('appContext'): esta divisão é estrutural, sem mudar comportamento.
import { inject } from 'vue';
import DeloadBanner from '../DeloadBanner.vue';
import HelpTip from '../HelpTip.vue';
import WorkoutTonnageLiveWidget from '../WorkoutTonnageLiveWidget.vue';
import MuscleBodyMap from '../MuscleBodyMap.vue';

const {
  isProgramActive,
  programHint,
  programSeriesLabel,
  MUSCLE_LABELS,
  getMuscleBadgeClass,
  getMuscleDotColor,
  currentMainTab,
  currentSplitTab,
  isAiPlanLoading,
  aiPlanMessage,
  userProfile,
  activePlan,
  workoutLogs,
  openGlossary,
  isSheetEditMode,
  showSplitBodyMap,
  openExerciseDetails,
  pendingDeleteSplit,
  openCreateSplitModal,
  openEditSplitModal,
  askDeleteSplit,
  confirmDeleteSplit,
  getSplitTabLabel,
  getSplitAccentBg,
  pendingRemove,
  askRemoveExercise,
  cancelRemoveExercise,
  confirmRemoveExercise,
  isWeightLoss,
  generatePlanWithAi,
  triggerRestTimer,
  toggleExerciseCheck,
  updateLog,
  addExerciseSet,
  removeExerciseSet,
  updateSetField,
  toggleSetDone,
  personalRecords,
  liveSessionGamification,
  deloadEvaluation,
  startDeload,
  dismissDeload,
  endDeload,
  deloadHint,
  nextLoadSuggestions,
  lastSetLabel,
  activeSessionId,
  finishCurrentSession,
  trainingSplit,
  openTrainingMode,
  openExercisePicker,
  openAdderFor,
  moveExercise,
  activeMuscleFilter,
  getSplitMuscleGroups,
  getMuscleCountInSplit,
  getVisibleExercises,
  shouldShowMuscleHeader,
  toggleMuscleFilter,
  sortSplitByMuscle,
  openCustomExercises
} = inject('appContext');
</script>
