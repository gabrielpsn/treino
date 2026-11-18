<template>
  <div :class="appRootThemeClasses" class="min-h-screen flex flex-col font-sans selection:bg-[#F59E0B] selection:text-[#0F172A]">
    
    <!--
      Paleta Athletic Clean Pro (Opção 1) com suporte a temas desbloqueáveis (Cyberpunk, Dark Gold, Matrix, Orange):
      Cor Primária: #0066FF (Azul Royal Cobalto)
      Destaques e CTAs: #F59E0B (Âmbar Ouro Energético)
      Fundos de cards e containers: #FFFFFF (Bordas #E2E8F0, Sub-cards #F8FAFC)
      Fundo Geral: #F8FAFC
      Texto Principal: #0F172A
      Texto Secundário / Labels: #64748B
    -->
    <header :class="headerThemeClasses" class="sticky top-0 z-20 shadow-md safe-top safe-x">
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
            class="w-9 h-9 rounded-xl flex items-center justify-center bg-white/20 border border-white/30 text-white shadow-sm font-black text-base transition-colors flex-shrink-0 overflow-hidden"
          >
            <img src="/overload_AI.svg" alt="Overload AI" class="w-full h-full object-cover" />
          </div>

          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h1 id="app-title" class="text-sm sm:text-base font-black tracking-tight text-white uppercase truncate">
                <span class="text-amber-300">Overload AI</span> • {{ appTitle }}
              </h1>
              <span 
                class="text-[10px] px-2 py-0.5 rounded-full font-bold border border-[#D97706] bg-[#F59E0B] text-[#0F172A] shadow-xs flex-shrink-0"
              >
                {{ goalBadge }}
              </span>
            </div>
            <p id="app-user-subtitle" class="text-[11px] text-white/80 flex items-center gap-1.5 truncate">
              <span class="text-white font-semibold">Olá, {{ userProfile?.userName || 'Atleta' }}</span>
              <template v-if="userProfile?.weightKg">
                <span>•</span>
                <span class="font-bold text-[#F59E0B]">
                  {{ userProfile.weightKg }} kg
                </span>
              </template>
            </p>
          </div>
        </div>

        <!-- Lado Direito do Cabeçalho: Moedas de Ferro, Chama de Streak e Avaliação -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <!-- Botão de Avaliar App & Feedback -->
          <button
            type="button"
            id="header-feedback-btn"
            @click="isFeedbackModalOpen = true"
            class="tap-btn flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-400/25 hover:bg-amber-400/40 border border-amber-300/50 text-amber-200 hover:text-white font-black text-xs shadow-xs transition-all"
            title="Avaliar aplicativo e enviar feedback (+50 XP)"
          >
            <span>⭐</span>
            <span class="hidden sm:inline text-[11px]">Feedback</span>
          </button>

          <!-- Botão / Chip de Moedas de Ferro -->
          <button
            type="button"
            id="header-iron-coins"
            @click="isShopOpen = true"
            class="tap-btn flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/20 border border-white/25 text-white font-black text-xs shadow-xs transition-all"
            title="Abrir Loja de Cosméticos e Temas (Iron Store)"
          >
            <span class="text-sm">🪙</span>
            <span class="text-amber-300 font-black text-xs sm:text-sm">{{ gamificationState.ironCoins || 0 }}</span>
          </button>

          <!-- Chama de Streak Diário -->
          <div
            v-if="dailyStreak > 0"
            id="header-daily-streak"
            class="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/15 hover:bg-white/20 border border-white/25 text-white font-black text-xs shadow-xs transition-all"
            :title="`Sequência ativa: ${dailyStreak} ${dailyStreak === 1 ? 'dia' : 'dias'} (${dailyStreakFlame.flameLabel})`"
          >
            <span class="text-base select-none">{{ dailyStreakFlame.flameEmoji }}</span>
            <span class="text-amber-300 font-black text-xs sm:text-sm">{{ dailyStreak }}</span>
            <span class="hidden sm:inline text-[11px] text-white/90 font-bold">{{ dailyStreak === 1 ? 'dia' : 'dias' }}</span>
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

    <!-- Navegação por Abas Principais (Treino, Nutrição, Frequência) - Oculto em mobile, visível em desktop -->
    <nav class="hidden md:block border-b border-[#E2E8F0] bg-white backdrop-blur sticky top-0 z-30 shadow-xs">
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

      <!-- TREINO DE HOJE: a primeira coisa que o usuário vê -->
      <TodayWorkoutCard
        v-if="activePlan"
        :user-name="userProfile?.userName || ''"
        :split="todayPlan.split"
        :done-today="todayPlan.doneToday"
        :minutes="todayMinutes"
        :muscles="todayMuscles"
        :week-done="weeklySummary.sessions"
        :week-planned="Number(userProfile?.daysPerWeek) || 0"
        :show-first-steps="showFirstSteps"
        :steps-done="firstStepsDone"
        @start="startTodayWorkout"
        @view="viewTodayWorkout"
        @dismiss-steps="dismissFirstSteps"
        @open-glossary="openGlossary"
        @open-body-progress="isBodyProgressOpen = true"
      />

      <!-- Programa guiado para iniciantes (oferta, progresso ou reavaliação) -->
      <ProgramCard
        v-if="activePlan"
        :info="programInfo"
        :offer="shouldOfferProgram"
        @start="startProgram"
        @dismiss="dismissProgram"
        @open="isProgramOpen = true"
      />

      <!-- Resumo do dia e conquistas: recolhido por padrão para não esconder o treino -->
      <section id="day-summary" class="rounded-2xl border border-[#E2E8F0] bg-white shadow-xs">
        <button
          type="button"
          id="btn-toggle-day-summary"
          class="tap-btn w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
          :aria-expanded="isDaySummaryOpen ? 'true' : 'false'"
          aria-controls="day-summary-content"
          @click="toggleDaySummary"
        >
          <span class="min-w-0">
            <span class="block text-sm font-black text-[#0F172A]">📊 Seu dia e conquistas</span>
            <span class="block text-[11px] text-[#64748B] truncate">
              🔥 {{ dailyStreak }} {{ dailyStreak === 1 ? 'dia' : 'dias' }} seguidos ·
              Nível {{ levelInfo.level }} ·
              💧 {{ todayWaterMl }}/{{ targetWaterMl }} ml ·
              🚶 {{ todayWalkingData.steps.toLocaleString('pt-BR') }} passos
            </span>
          </span>
          <span class="text-[#64748B] text-lg" aria-hidden="true">{{ isDaySummaryOpen ? '▴' : '▾' }}</span>
        </button>
        <div v-show="isDaySummaryOpen" id="day-summary-content" class="px-3 pb-3 space-y-4">
      <!-- WIDGET DE STATUS DE GAMIFICAÇÃO (Patente, Nível, XP, Ofensiva, Escudos, RPG Fit e Loja) -->
        <GamificationIronStatus
          :total-xp="gamificationState.totalXp"
          :streak="gamificationState.weeklyStreak"
          :daily-streak="gamificationState.dailyStreak || 0"
          :shields="gamificationState.shieldsCount"
          :iron-coins="gamificationState.ironCoins || 0"
          :equipped-title-name="equippedTitleObj.title"
          :equipped-title-icon="equippedTitleObj.icon"
          @open-skill-tree="isSkillTreeOpen = true"
          @open-shop="isShopOpen = true"
        />

        <!-- ANÉIS DE ATIVIDADE DIÁRIA (Treino, Água, Hábitos & Dieta) -->
        <DailyActivityRings
          :workout-percent="todayWorkoutProgressPercent"
          :workout-status-text="todayWorkoutStatusText"
          :water-percent="waterPercent"
          :water-text="`${todayWaterMl} / ${targetWaterMl} ml`"
          :creatine-taken="!!todayHabits.creatineTaken"
          :diet-percent="dietAdherencePercent"
          :diet-text="`${checkedMealsCount}/${totalMealsCount} Refeições`"
          @toggle-creatine="toggleCreatineToday"
        />

        <!-- WIDGET DE CAMINHADA & PASSOS DIÁRIOS (MOBILE & DESKTOP) -->
        <div
          id="widget-walking-summary"
          class="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4 text-[#0F172A] cursor-pointer hover:border-[#0066FF]/40 transition-all"
          @click="isWalkingModalOpen = true"
          role="button"
          tabindex="0"
          aria-label="Abrir rastreador de caminhada e passos"
          @keydown.enter="isWalkingModalOpen = true"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-xl shadow-2xs flex-shrink-0">
              🚶
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Caminhada & Passos
                </span>
                <span
                  id="walking-steps-badge"
                  class="text-[10px] font-black px-2 py-0.5 rounded-full"
                  :class="todayWalkingData.steps >= todayWalkingData.goalSteps
                    ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
                    : 'bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/20'"
                >
                  {{ Math.min(100, Math.round((todayWalkingData.steps / todayWalkingData.goalSteps) * 100)) }}% da meta
                </span>
              </div>
              <p class="text-sm sm:text-base font-black text-[#0F172A] mt-0.5 truncate">
                {{ todayWalkingData.steps.toLocaleString('pt-BR') }} / {{ todayWalkingData.goalSteps.toLocaleString('pt-BR') }} passos
                <span class="text-xs font-bold text-[#64748B] ml-1">({{ todayWalkingData.distanceKm.toFixed(2) }} km)</span>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              id="btn-open-walking-tracker"
              class="tap-btn px-4 py-2 rounded-xl text-xs font-bold bg-[#0066FF] text-white hover:bg-[#0052cc] transition-all flex items-center gap-1.5 shadow-xs"
              @click.stop="isWalkingModalOpen = true"
            >
              <span>{{ isWalkActive ? '🟢 Em andamento — abrir' : '▶ Iniciar Caminhada' }}</span>
            </button>
          </div>
        </div>
        </div>
      </section>

      <!-- ABA 1: FICHAS DE TREINO -->
      <WorkoutTab />

      <!-- ABA 2: NUTRIÇÃO & CREATINA / TERMOGÊNICOS -->
      <NutritionTab />

      <!-- ABA 3: QUADRO SEMANAL DE FREQUÊNCIA -->
      <FrequencyTab />

      <!-- ABA 4: HISTÓRICO DE TREINOS -->
      <HistoryTab />

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
      :last-sets="lastSets"
      :started-at="trainingStartedAt"
      :series-label="programSeriesLabel"
      :program-hint="programHint()"
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
      @close="handleCloseOnboarding"
      @restore-backup="openBackupFilePicker"
      @restore-cloud="isCloudSyncOpen = true"
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
      :daily-streak="dailyStreak"
      :iron-coins="gamificationState.ironCoins || 0"
      :equipped-title-name="equippedTitleObj.title"
      :equipped-title-icon="equippedTitleObj.icon"
      :league-tier="gamificationState.leagueTier || 'bronze'"
      :today-steps="todayWalkingData.steps"
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
      @set-theme="handleEquipTheme"
      @open-skill-tree="isSkillTreeOpen = true"
      @open-shop="isShopOpen = true"
      @open-league="isLeagueModalOpen = true"
      @open-wrapped="isWrappedModalOpen = true"
      @open-raid="isRaidModalOpen = true"
      @open-walking="isWalkingModalOpen = true"
      @open-feedback="isFeedbackModalOpen = true"
      @open-body-progress="isBodyProgressOpen = true"
      @open-reminders="isRemindersOpen = true"
      @open-cloud-sync="isCloudSyncOpen = true"
      @open-friends-league="isFriendsLeagueOpen = true"
      @open-trainer="isTrainerOpen = true"
      @open-glossary="openGlossary"
      @open-program="isProgramOpen = true"
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
      :daily-streak="gamificationState.dailyStreak || 1"
      :athlete-name="userProfile?.userName || 'Atleta'"
      :patent-title="equippedTitleObj?.title || currentPatentTitle"
      @close="showCelebrationModal = false"
    />

    <!-- Modal de Loading do Agente de IA -->
    <AiPlanLoadingModal :is-open="isAiPlanLoading" />

    <!-- Modal da Árvore de Habilidades por Grupo Muscular (RPG Fit) -->
    <RpgSkillTreeModal
      :is-open="isSkillTreeOpen"
      :rpg-branches="gamificationState.rpgBranches || {}"
      @close="isSkillTreeOpen = false"
    />

    <!-- Modal da Loja de Cosméticos e Temas (Iron Store) -->
    <CosmeticsShopModal
      :is-open="isShopOpen"
      :iron-coins="gamificationState.ironCoins || 0"
      :unlocked-themes="gamificationState.unlockedThemes || ['blue', 'orange']"
      :equipped-theme="currentTheme"
      :unlocked-titles="gamificationState.unlockedTitles || ['iniciante_ferro']"
      :equipped-title="gamificationState.equippedTitle || 'iniciante_ferro'"
      @equip-theme="handleEquipTheme"
      @unlock-theme="handleUnlockTheme"
      @equip-title="handleEquipTitle"
      @unlock-title="handleUnlockTitle"
      @close="isShopOpen = false"
    />

    <!-- Modal da Liga Competitiva Semanal por Elo -->
    <WeeklyLeagueModal
      :is-open="isLeagueModalOpen"
      :user-score="userLeagueScore"
      :current-tier="gamificationState.leagueTier || 'bronze'"
      :user-name="userProfile?.userName || 'Atleta'"
      @close="isLeagueModalOpen = false"
      @open-friends="isLeagueModalOpen = false; isFriendsLeagueOpen = true"
    />

    <!-- Modal da Retrospectiva da Carreira (Wrapped) -->
    <CareerWrappedModal
      :is-open="isWrappedModalOpen"
      :history-sessions="historySessions"
      :gamification-state="gamificationState"
      :user-profile="userProfile"
      @close="isWrappedModalOpen = false"
    />

    <!-- Modal de Raids Coletivas Globais -->
    <CommunityRaidModal
      :is-open="isRaidModalOpen"
      :user-monthly-tonnage-kg="monthlyTonnageKg"
      :claimed-milestones="gamificationState.claimedRaidMilestones || []"
      @claim-milestone="handleClaimRaidMilestone"
      @close="isRaidModalOpen = false"
    />

    <!-- Toast / Banner de Comemoração de PR ao Vivo -->
    <PrCelebrationToast
      :is-open="prToastState.isOpen"
      :exercise-name="prToastState.exerciseName"
      :weight-kg="prToastState.weightKg"
      :reps="prToastState.reps"
      :diff-kg="prToastState.diffKg"
      @close="prToastState.isOpen = false"
    />

    <!-- Modal do Rastreador de Caminhada e Passos no Celular -->
    <WalkingTrackerModal
      :is-open="isWalkingModalOpen"
      :user-height-cm="userProfile?.heightCm || 170"
      :user-weight-kg="userProfile?.weightKg || 70"
      :today-date-str="todayKey"
      @close="isWalkingModalOpen = false"
      @steps-updated="handleWalkingStepsUpdated"
      @goal-reached="handleWalkingGoalReached"
      @active-changed="active => isWalkActive = active"
    />

    <!-- Caminhada em andamento com o modal fechado: atalho para voltar a ela -->
    <button
      v-if="isWalkActive && !isWalkingModalOpen"
      type="button"
      id="btn-walking-in-progress"
      class="tap-btn fixed left-1/2 -translate-x-1/2 bottom-24 md:bottom-6 z-40 px-4 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-black shadow-xl flex items-center gap-2"
      @click="isWalkingModalOpen = true"
    >
      <span class="w-2 h-2 rounded-full bg-white animate-pulse" aria-hidden="true"></span>
      Caminhada em andamento · {{ todayWalkingData.steps.toLocaleString('pt-BR') }} passos
    </button>

    <!-- Modal de Avaliação do App e Envio de Feedback -->
    <AppFeedbackModal
      :is-open="isFeedbackModalOpen"
      :user-name="userProfile?.userName"
      @close="isFeedbackModalOpen = false"
      @feedback-submitted="handleFeedbackSubmitted"
    />

    <BodyProgressModal
      :is-open="isBodyProgressOpen"
      :goal="userProfile?.goal || 'hypertrophy'"
      :gender="userProfile?.gender || 'male'"
      :bmr="activePlan?.physiology?.bmr || 0"
      :target-calories="targetCalories"
      :macros="effectiveMacros"
      @close="isBodyProgressOpen = false"
      @apply-calories="handleApplyCalories"
      @entries-changed="entries => bodyEntries = entries"
    />

    <RemindersModal :is-open="isRemindersOpen" @close="isRemindersOpen = false" />

    <GlossaryModal :is-open="isGlossaryOpen" @close="isGlossaryOpen = false" />

    <ProgramModal
      :is-open="isProgramOpen"
      :info="programInfo"
      :review="programReviewData"
      :reward="PROGRAM_REWARD"
      @close="isProgramOpen = false"
      @start="startProgram"
      @train="isProgramOpen = false; startTodayWorkout()"
      @abandon="abandonProgram"
      @complete="handleCompleteProgram"
      @open-profile="isProgramOpen = false; isOnboardingOpen = true"
    />

    <CloudSyncModal
      :is-open="isCloudSyncOpen"
      @close="isCloudSyncOpen = false"
      @restore-backup="handleCloudRestore"
    />

    <FriendsLeagueModal
      :is-open="isFriendsLeagueOpen"
      :week-key="currentIsoWeekKey"
      :my-score="userLeagueScore"
      :default-nickname="userProfile?.userName || 'Atleta'"
      @close="isFriendsLeagueOpen = false"
    />

    <TrainerModal
      :is-open="isTrainerOpen"
      :student-summary="studentSummary"
      :my-workout-splits="trainerSplitsToSend"
      :default-name="userProfile?.userName || ''"
      @close="isTrainerOpen = false"
      @accept-plan="handleAcceptTrainerPlan"
    />

  </div>
</template>

<script setup>
import { ref, shallowRef, computed, onMounted, onBeforeUnmount, nextTick, provide } from 'vue';
import confetti from 'canvas-confetti';
import { db, buildWeekCheckId, getCurrentWeekKey, getDayKey, migrateLegacyWeeklyChecks, migrateLegacyLogsToSession } from './db';
import { openSession, recordSet, listSessions, getLastSetsForExercises, getOpenSessionIds, closeSession, deleteSet } from './db/sessions';
import { buildPersonalizedPlan } from './engine/generators/planGenerator';
import { DIETARY_PREFERENCES } from './engine/knowledge/foodTemplates.js';
import { requestAiPlan, AiPlanError } from './engine/ai/planFromAi';
import { parseWeight, parseReps, sessionVolume } from './engine/history';
import { calculatePersonalRecords, suggestNextLoad, getLastSetsForExercise } from './engine/progression';
import OnboardingModal from './components/OnboardingModal.vue';
import RestTimer from './components/RestTimer.vue';
import TrainingMode from './components/TrainingMode.vue';
import ExercisePickerModal from './components/ExercisePickerModal.vue';
import CustomExercisesModal from './components/CustomExercisesModal.vue';
import BackupImportModal from './components/BackupImportModal.vue';
import CreateSplitModal from './components/CreateSplitModal.vue';
import VersionUpdatePrompt from './components/VersionUpdatePrompt.vue';
import AppSideDrawer from './components/AppSideDrawer.vue';
import ExerciseDetailsModal from './components/ExerciseDetailsModal.vue';
import GamificationIronStatus from './components/GamificationIronStatus.vue';
import DailyActivityRings from './components/DailyActivityRings.vue';
import WorkoutCelebrationModal from './components/WorkoutCelebrationModal.vue';
import WorkoutDayCompletionModal from './components/WorkoutDayCompletionModal.vue';
import AiPlanLoadingModal from './components/AiPlanLoadingModal.vue';
import RpgSkillTreeModal from './components/RpgSkillTreeModal.vue';
import CosmeticsShopModal from './components/CosmeticsShopModal.vue';
import WeeklyLeagueModal from './components/WeeklyLeagueModal.vue';
import CareerWrappedModal from './components/CareerWrappedModal.vue';
import CommunityRaidModal from './components/CommunityRaidModal.vue';
import PrCelebrationToast from './components/PrCelebrationToast.vue';
import WalkingTrackerModal from './components/WalkingTrackerModal.vue';
import AppFeedbackModal from './components/AppFeedbackModal.vue';
import { useUiPrefs } from './composables/useUiPrefs.js';
import { useDeload } from './composables/useDeload.js';
import { useWeeklyInsights } from './composables/useWeeklyInsights.js';
import { useTodayWorkout } from './composables/useTodayWorkout.js';
import { useOnlineActions } from './composables/useOnlineActions.js';
import { useBeginnerProgram, PROGRAM_REWARD } from './composables/useBeginnerProgram.js';
import ProgramCard from './components/ProgramCard.vue';
import ProgramModal from './components/ProgramModal.vue';
import HistoryTab from './components/tabs/HistoryTab.vue';
import FrequencyTab from './components/tabs/FrequencyTab.vue';
import NutritionTab from './components/tabs/NutritionTab.vue';
import WorkoutTab from './components/tabs/WorkoutTab.vue';
import BodyProgressModal from './components/BodyProgressModal.vue';
import RemindersModal from './components/RemindersModal.vue';
import CloudSyncModal from './components/CloudSyncModal.vue';
import FriendsLeagueModal from './components/FriendsLeagueModal.vue';
import TrainerModal from './components/TrainerModal.vue';
import TodayWorkoutCard from './components/TodayWorkoutCard.vue';
import GlossaryModal from './components/GlossaryModal.vue';
import { filterSafeExercises } from './engine/generators/workoutGenerator';
import { loadDailyWalkingData } from './engine/walkingTracker';
import {
  calculateSessionGamification,
  checkBadges,
  calculateLevelFromXp,
  getFlameInfo,
  getTitleById,
  getThemeById
} from './engine/gamification.js';
import {
  loadGamificationState,
  recordSessionCompletion,
  recordRestDay,
  recordWeeklyDayCompletion,
  WEEKLY_DAY_COMPLETION_XP,
  awardCoins,
  awardFeedbackReward,
  spendCoins,
  unlockAndEquipTheme,
  equipTheme,
  unlockAndEquipTitle,
  equipTitle,
  claimBossVictory,
  promoteLeague,
  claimRaidMilestone,
  recordDailyDietCompletion,
  recordDailyWalkingGoalCompletion
} from './db/gamification.js';
import { playPlateClick, playPrFanfare, triggerHaptic, speakCoachMessage } from './engine/audioHaptics.js';
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

// Menu Lateral (Drawer), Detalhes de Exercício, Habilidades, Loja, Ligas e Tema Visual
const isDrawerOpen = ref(false);
const isExerciseDetailsOpen = ref(false);
const selectedExerciseForDetails = ref(null);
const isSkillTreeOpen = ref(false);
const isShopOpen = ref(false);
const isLeagueModalOpen = ref(false);
const isWrappedModalOpen = ref(false);
const isRaidModalOpen = ref(false);
const isWalkingModalOpen = ref(false);
const isFeedbackModalOpen = ref(false);
const isWalkActive = ref(false);
const isBodyProgressOpen = ref(false);
const isRemindersOpen = ref(false);
const isCloudSyncOpen = ref(false);
const isFriendsLeagueOpen = ref(false);
const isTrainerOpen = ref(false);

const todayWalkingData = ref(loadDailyWalkingData(getDayKey()));
const prToastState = ref({
  isOpen: false,
  exerciseName: '',
  weightKg: 0,
  reps: 0,
  diffKg: 0
});
const currentTheme = ref(gamificationState.value?.equippedTheme || 'blue');

const appRootThemeClasses = computed(() => {
  if (currentTheme.value === 'cyberpunk') return 'bg-[#08070F] text-[#F8FAFC]';
  if (currentTheme.value === 'gold') return 'bg-[#0A0A0C] text-[#FAFAF9]';
  if (currentTheme.value === 'matrix') return 'bg-[#030804] text-[#E2F8E8]';
  if (currentTheme.value === 'orange') return 'bg-[#FFF7ED] text-[#0F172A]';
  return 'bg-[#F8FAFC] text-[#0F172A]';
});

const headerThemeClasses = computed(() => {
  if (currentTheme.value === 'cyberpunk') return 'border-b border-[#00F0FF]/40 bg-[#0D0B1E] text-white';
  if (currentTheme.value === 'gold') return 'border-b border-[#D4AF37]/50 bg-[#141416] text-[#FAFAF9]';
  if (currentTheme.value === 'matrix') return 'border-b border-[#00FF66]/40 bg-[#07130A] text-[#E2F8E8]';
  if (currentTheme.value === 'orange') return 'border-b border-[#C2410C] bg-[#EA580C] text-white';
  return 'border-b border-[#0052cc] bg-[#0066FF] text-white';
});

const equippedTitleObj = computed(() => {
  return getTitleById(gamificationState.value?.equippedTitle || 'iniciante_ferro');
});

function handleEquipTheme(themeId) {
  const res = equipTheme(themeId);
  if (res.success) {
    gamificationState.value = res.updated;
    currentTheme.value = themeId;
  }
}

function handleUnlockTheme({ themeId, price }) {
  const res = unlockAndEquipTheme(themeId, price);
  if (res.success) {
    gamificationState.value = res.updated;
    currentTheme.value = themeId;
    confetti({ particleCount: 40, spread: 60 });
  }
}

function handleEquipTitle(titleId) {
  const res = equipTitle(titleId);
  if (res.success) {
    gamificationState.value = res.updated;
  }
}

function handleUnlockTitle({ titleId, price }) {
  const res = unlockAndEquipTitle(titleId, price);
  if (res.success) {
    gamificationState.value = res.updated;
    confetti({ particleCount: 40, spread: 60 });
  }
}

function handleClaimBossReward({ monthKey, rewardCoins, rewardXp }) {
  const res = claimBossVictory({ monthKey, rewardCoins, rewardXp });
  if (res.success) {
    gamificationState.value = res.updated;
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    playPrFanfare();
    triggerHaptic('success');
  }
}

function handleClaimRaidMilestone({ milestonePercent, rewardCoins, rewardXp, unlockTitleId }) {
  const res = claimRaidMilestone({ milestonePercent, rewardCoins, rewardXp, unlockTitleId });
  if (res.success) {
    gamificationState.value = res.updated;
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 }
    });
    playPrFanfare();
    triggerHaptic('success');
  }
}

function handleWalkingStepsUpdated(data) {
  todayWalkingData.value = { ...data };
}

function handleWalkingGoalReached({ date, steps }) {
  const res = recordDailyWalkingGoalCompletion(date);
  if (!res.alreadyClaimed) {
    gamificationState.value = res.updated;
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    playPrFanfare();
    triggerHaptic('celebrate');
    speakCoachMessage(
      'finish',
      `Meta diária de passos batida com sucesso! Você deu ${Number(steps).toLocaleString('pt-BR')} passos e ganhou 30 moedas de ferro e 50 XP!`
    );
  }
}

function handleFeedbackSubmitted(feedbackItem) {
  try {
    const updated = awardFeedbackReward(50, 20);
    if (updated) {
      gamificationState.value = updated;
    }
    triggerHaptic('celebrate');
    confetti({
      particleCount: 75,
      spread: 70,
      origin: { y: 0.6 }
    });
  } catch (err) {
    console.warn('[feedback] Falha ao atribuir recompensa de avaliação:', err);
  }
}
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
    accentBg: accentBg || 'bg-amber-50 border-amber-200 text-amber-800',
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

function getSplitAccentBg(split) {
  const raw = split?.accentBg || '';
  if (!raw) return 'bg-amber-50 border-amber-200 text-amber-800';
  return raw
    .replace(/text-([a-z]+)-300/g, 'text-$1-800')
    .replace(/text-([a-z]+)-400/g, 'text-$1-800')
    .replace(/bg-([a-z]+)-500\/10/g, 'bg-$1-50')
    .replace(/bg-([a-z]+)-500\/15/g, 'bg-$1-50')
    .replace(/border-([a-z]+)-500\/20/g, 'border-$1-200');
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
  const m = activePlan.value?.physiology?.macros;
  return {
    proteinGrams: m?.proteinGrams ?? m?.protein ?? 0,
    carbsGrams: m?.carbsGrams ?? m?.carbs ?? 0,
    fatGrams: m?.fatGrams ?? m?.fat ?? 0
  };
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
    // Concede +15 moedas de ferro por bater o hábito diário de suplementação
    gamificationState.value = awardCoins(15);
  }
}

// ---------------------------------------------------------------------------
// Aderência Alimentar & Checklist Diário de Refeições
// ---------------------------------------------------------------------------
const todayMealChecks = ref({});

function loadMealChecks() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const key = `treinopro_meal_checks_${todayKey.value}`;
    const raw = window.localStorage.getItem(key);
    todayMealChecks.value = raw ? JSON.parse(raw) : {};
  } catch {
    todayMealChecks.value = {};
  }
}

const targetCalories = computed(() => effectiveTargetCalories.value || 0);
const targetProteinGrams = computed(() => effectiveMacros.value?.proteinGrams || 0);

const totalMealsCount = computed(() => activePlan.value?.meals?.length || 0);
const checkedMealsCount = computed(() => {
  return Object.values(todayMealChecks.value || {}).filter(Boolean).length;
});
const dietAdherencePercent = computed(() => {
  if (totalMealsCount.value === 0) return 0;
  return Math.min(100, Math.round((checkedMealsCount.value / totalMealsCount.value) * 100));
});

const consumedCaloriesEstimated = computed(() => {
  let explicitTotal = 0;
  let hasExplicit = false;
  for (const meal of activePlan.value?.meals || []) {
    if (todayMealChecks.value[meal.id] && meal.calories) {
      explicitTotal += Number(meal.calories) || 0;
      hasExplicit = true;
    }
  }
  if (hasExplicit && explicitTotal > 0) return explicitTotal;
  if (totalMealsCount.value === 0 || !targetCalories.value) return 0;
  return Math.round((checkedMealsCount.value / totalMealsCount.value) * targetCalories.value);
});

const consumedProteinEstimated = computed(() => {
  let explicitProtein = 0;
  let hasExplicit = false;
  for (const meal of activePlan.value?.meals || []) {
    if (todayMealChecks.value[meal.id] && meal.protein) {
      explicitProtein += Number(meal.protein) || 0;
      hasExplicit = true;
    }
  }
  if (hasExplicit && explicitProtein > 0) return explicitProtein;
  if (totalMealsCount.value === 0 || !targetProteinGrams.value) return 0;
  return Math.round((checkedMealsCount.value / totalMealsCount.value) * targetProteinGrams.value);
});

function toggleMealCheck(mealId) {
  const current = !!todayMealChecks.value[mealId];
  const next = !current;
  todayMealChecks.value = {
    ...todayMealChecks.value,
    [mealId]: next
  };
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(`treinopro_meal_checks_${todayKey.value}`, JSON.stringify(todayMealChecks.value));
  }

  if (next) {
    playPlateClick();
    triggerHaptic('click');

    const total = totalMealsCount.value;
    const checked = Object.values(todayMealChecks.value).filter(Boolean).length;
    if (total > 0 && checked === total) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
      playPrFanfare();
      triggerHaptic('celebrate');
      const dietRes = recordDailyDietCompletion(todayKey.value);
      if (!dietRes.alreadyClaimed) {
        gamificationState.value = dietRes.updated;
      }
    }
  }
}

const WEEK_REFRESH_INTERVAL_MS = 60 * 1000;
let weekWatcherTimer = null;

onMounted(async () => {
  setupPWA();
  await loadUserData();
  loadMealChecks();
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
    await loadHistory();
    await loadBodyEntries();
  } catch (err) {
    reportStorageError(
      'Não foi possível acessar o armazenamento local do navegador. Seu histórico pode não ser salvo. Verifique se cookies/armazenamento não estão bloqueados.',
      err
    );
    isOnboardingOpen.value = true;
  }
}

async function hydrateFromDatabase(profileRecord) {
  const isProfileComplete = profileRecord && 
    profileRecord.isConfigured === true && 
    profileRecord.userName && 
    profileRecord.userName.trim() !== '' &&
    profileRecord.userName !== 'João';

  if (!isProfileComplete) {
    // O registro foi lido antes das migrações terminarem: se o usuário salvou
    // o perfil nesse meio-tempo, este null está desatualizado. Aplicar o
    // default por cima reabriria o onboarding e apagaria o perfil novo.
    if (profileSavedDuringLoad) return;

    // Primeiro acesso ou dados pendentes: abre o onboarding limpo para o usuário preencher
    isFirstAccess.value = true;
    isOnboardingOpen.value = true;
    userProfile.value = null;
  } else {
    isFirstAccess.value = false;
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

function handleCloseOnboarding() {
  if (isFirstAccess.value) return;
  isOnboardingOpen.value = false;
}

async function handleSaveProfile(newProfile) {
  try {
    isFirstAccess.value = false;
    const rawProfile = JSON.parse(JSON.stringify(newProfile));
    rawProfile.isConfigured = true;
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

    // A ficha deve ser sempre gerada pela IA disponível no APP:
    // Se não for para preservar treinos antigos, gera automaticamente a ficha pela IA
    if (!preserveWorkouts) {
      nextTick(() => {
        generatePlanWithAi({ automatic: true }).catch(err => {
          console.warn('Geração por IA pós-onboarding:', err);
        });
      });
    }

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
 * Garante que fichas de padrão Push / Treino A sempre contenham exercícios de Tríceps,
 * completando a sinergia biomecânica de empurrar caso a IA tenha sugerido apenas peito e ombros.
 */
function ensurePushSplitHasTriceps(workoutSplits, catalog = [], profile = {}) {
  if (!Array.isArray(workoutSplits)) return;
  const restrictions = profile.restrictions || [];
  const equipment = profile.equipment || 'gym';

  for (const split of workoutSplits) {
    const isPush = split.id === 'treino-a' ||
      /push|empurrar|peito/i.test(split.title || '') ||
      /push|empurrar|peito/i.test(split.subtitle || '');

    if (!isPush || !Array.isArray(split.exercises)) continue;

    const hasTriceps = split.exercises.some(e => e.muscle === 'triceps');
    if (!hasTriceps) {
      const existingIds = new Set(split.exercises.map(e => e.id));
      const safeCandidates = catalog.filter(ex =>
        ex.muscle === 'triceps' &&
        !existingIds.has(ex.id) &&
        filterSafeExercises([ex], { restrictions, equipment }).length > 0
      );

      if (safeCandidates.length > 0) {
        // Se a ficha já tiver 6 ou mais exercícios e houver 3 ou mais de peito, substitui o último exercício de peito
        const chestExercises = split.exercises.filter(e => e.muscle === 'peito');
        if (split.exercises.length >= 6 && chestExercises.length >= 3) {
          const lastChestIndex = split.exercises.findLastIndex(e => e.muscle === 'peito');
          if (lastChestIndex !== -1) {
            split.exercises.splice(lastChestIndex, 1);
          }
        }

        const tricepsEx = safeCandidates[0];
        split.exercises.push({
          ...tricepsEx,
          defaultSeries: '3x 10-12 reps',
          rest: '60s',
          aiReps: '10-12',
          aiNote: 'Exercício de tríceps adicionado para equilíbrio biomecânico do treino de empurrar'
        });
      }
    }
  }
}

/**
 * Gera a ficha e as metas com o Agente no Cloudflare Workers / Gemini.
 *
 * Regra que dá nome à função: o plano atual só é trocado depois que a gravação
 * no banco termina. Se a IA falhar, responder devagar ou devolver lixo, o
 * usuário continua exatamente com o treino que já tinha.
 */
async function generatePlanWithAi({ automatic = false } = {}) {
  const profile = userProfile.value;
  if (!profile || isAiPlanLoading.value) return;

  isAiPlanLoading.value = true;
  aiPlanMessage.value = { tone: 'info', text: 'Personalizando seu treino e cardápio com IA...' };

  try {
    const splitsPayload = (activePlan.value?.workoutSplits ?? []).map(s => ({
      id: s.id,
      title: s.title,
      subtitle: s.subtitle,
      muscles: getSplitMuscleGroups(s)
    }));

    const aiPlan = await requestAiPlan({
      profile: {
        ...profile,
        dietaryPreference: currentDietaryPreference.value || profile.dietaryPreference || 'omnivore'
      },
      catalog: fullCatalog.value,
      splitIds: splitsPayload.map(s => s.id),
      splits: splitsPayload
    });

    const rawPlan = JSON.parse(JSON.stringify(aiPlan));
    ensurePushSplitHasTriceps(rawPlan.workoutSplits, fullCatalog.value, profile);

    // Preserva os hábitos diários (água e creatina de hoje)
    if (activePlan.value?.dailyHabits) {
      rawPlan.dailyHabits = JSON.parse(JSON.stringify(activePlan.value.dailyHabits));
    }
    // Remove eventual sobreposição de nutrição customizada manual para exibir imediatamente os valores gerados pela IA
    if (rawPlan.customNutrition) {
      delete rawPlan.customNutrition;
    }

    const ok = await persistOrReport(
      'Não foi possível salvar a ficha gerada por IA.',
      () => db.active_plan.put(rawPlan)
    );
    if (!ok) {
      aiPlanMessage.value = { tone: 'error', text: 'A ficha foi gerada, mas não consegui salvar. A ficha atual continua valendo.' };
      return;
    }

    activePlan.value = rawPlan;
    initCustomNutritionForm();
    activeMuscleFilter.value = {};
    if (!rawPlan.workoutSplits?.some(s => s.id === currentSplitTab.value)) {
      currentSplitTab.value = rawPlan.workoutSplits?.[0]?.id ?? 'treino-a';
    }
    await loadLastSets();

    confetti({
      particleCount: 75,
      spread: 65,
      origin: { y: 0.6 }
    });

    const count = rawPlan.workoutSplits.reduce((total, s) => total + s.exercises.length, 0);
    const mealsCount = rawPlan.meals?.length || 0;
    aiPlanMessage.value = {
      tone: 'info',
      text: `Plano gerado por IA com sucesso! ${rawPlan.workoutSplits.length} fichas (${count} exercícios), ${mealsCount} refeições personalizadas e ${rawPlan.physiology.targetCalories} kcal.${rawPlan.aiRationale ? ` ${rawPlan.aiRationale}` : ''}`
    };
  } catch (error) {
    const reason = error instanceof AiPlanError ? error.reason : 'unknown';
    // Logo após o cadastro, uma falha da IA não é problema do usuário: a ficha
    // calculada pelo app já está pronta. Mostrar erro vermelho aqui assusta.
    if (automatic) {
      aiPlanMessage.value = null;
      return;
    }
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

    // Feedback sonoro, tátil, visual de PR e treinador de voz
    const pr = personalRecords.value[exerciseId];
    const weight = Number(current.weight) || 0;
    const isPr = pr && weight > (pr.maxWeightKg || 0);
    if (isPr) {
      playPrFanfare();
      triggerHaptic('pr');
      speakCoachMessage('pr');
      const diff = Math.round((weight - (pr.maxWeightKg || 0)) * 10) / 10;
      prToastState.value = {
        isOpen: true,
        exerciseName: exerciseNames.value[exerciseId] || exerciseId,
        weightKg: weight,
        reps: Number(current.reps) || 0,
        diffKg: diff > 0 ? diff : 0
      };
    } else {
      playPlateClick();
      triggerHaptic('click');
      speakCoachMessage('set_done');
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

      // Feedback sonoro, tátil, visual de PR e treinador de voz
      const pr = personalRecords.value[exerciseId];
      const weight = Number(target.weight) || 0;
      const isPr = pr && weight > (pr.maxWeightKg || 0);
      if (isPr) {
        playPrFanfare();
        triggerHaptic('pr');
        speakCoachMessage('pr');
        const diff = Math.round((weight - (pr.maxWeightKg || 0)) * 10) / 10;
        prToastState.value = {
          isOpen: true,
          exerciseName: exerciseNames.value[exerciseId] || exerciseId,
          weightKg: weight,
          reps: Number(target.reps) || 0,
          diffKg: diff > 0 ? diff : 0
        };
      } else {
        playPlateClick();
        triggerHaptic('click');
        speakCoachMessage('set_done');
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

// Mapeamento de id do exercício para o músculo primário (usado pelo radar e gamificação)
const exerciseMuscleMap = computed(() => {
  const map = {};
  for (const split of activePlan.value?.workoutSplits || []) {
    for (const ex of split.exercises || []) {
      if (ex.id && ex.muscle) map[ex.id] = ex.muscle;
    }
  }
  return map;
});

// Gamificação ao vivo da sessão atual (tonelagem em tempo real, PRs e XP)
const liveSessionGamification = computed(() => {
  return calculateSessionGamification({
    workoutLogs: workoutLogs.value,
    existingPrs: personalRecords.value,
    exerciseMuscleMap: exerciseMuscleMap.value,
    isFinished: false
  });
});

const currentMonthKey = computed(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
});

const monthlyTonnageKg = computed(() => {
  const monthPrefix = currentMonthKey.value;
  let totalKg = 0;
  for (const session of historySessions.value) {
    if (session.dayKey && session.dayKey.startsWith(monthPrefix)) {
      totalKg += sessionVolume(session.sets || []);
    }
  }
  totalKg += liveSessionGamification.value?.tonnageKg || 0;
  return Math.round(totalKg);
});

const weeklySessions = computed(() => {
  const currentWeek = currentWeekKey.value;
  return historySessions.value.filter(s => s.weekKey === currentWeek);
});

const userLeagueScore = computed(() => {
  let doneSets = 0;
  for (const session of weeklySessions.value) {
    for (const set of session.sets || []) {
      if (set.isDone) doneSets++;
    }
  }
  for (const log of Object.values(workoutLogs.value || {})) {
    if (!log) continue;
    if (Array.isArray(log.sets) && log.sets.length > 0) {
      for (const set of log.sets) {
        if (set.isDone) doneSets++;
      }
    } else if (log.isDone) {
      doneSets++;
    }
  }
  const prsCount = Object.keys(personalRecords.value || {}).length;
  const streak = gamificationState.value?.dailyStreak || 1;
  return (doneSets * 10) + (prsCount * 50) + (streak * 20);
});

const dailyStreak = computed(() => gamificationState.value?.dailyStreak || 0);
const dailyStreakFlame = computed(() => getFlameInfo(dailyStreak.value));

const levelInfo = computed(() => calculateLevelFromXp(gamificationState.value?.totalXp || 0));

const currentPatentTitle = computed(() => calculateLevelFromXp(gamificationState.value?.totalXp || 0).patent);

const todayWorkoutProgressPercent = computed(() => {
  if (gamificationState.value?.lastActiveDate === todayKey.value) return 100;
  const done = liveSessionGamification.value?.doneSetsCount || 0;
  if (done > 0) return Math.min(95, Math.round((done / 10) * 100));
  return 0;
});

const todayWorkoutStatusText = computed(() => {
  if (gamificationState.value?.lastActiveDate === todayKey.value) return 'Concluído hoje';
  const done = liveSessionGamification.value?.doneSetsCount || 0;
  if (done > 0) return `${done} séries feitas`;
  return 'Pendente';
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
  autoCloudSync();

  // Gamificação: consolida impacto, tonelagem, XP, moedas e branches RPG
  const stats = calculateSessionGamification({
    workoutLogs: workoutLogs.value,
    existingPrs: personalRecords.value,
    exerciseMuscleMap: exerciseMuscleMap.value,
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
    earnedCoins: stats.earnedCoins,
    branchXp: stats.branchXp,
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
  speakCoachMessage('finish');
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

  let counts = null;
  const ok = await persistOrReport('Não foi possível restaurar o backup.', async () => {
    counts = await restoreBackup(backup);
  });
  if (!ok) return;
  if (counts?.localDataError) {
    reportStorageError('Treinos restaurados, mas não foi possível restaurar XP/caminhada neste aparelho.', null);
  }

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

  // Gamificação e caminhada vêm do localStorage, que o restore acabou de
  // reescrever: os refs ainda guardam o estado do aparelho anterior.
  gamificationState.value = loadGamificationState();
  todayWalkingData.value = loadDailyWalkingData(getDayKey());

  await loadCustomExercises();
  const profileRecord = await db.user_profile.get('current_user');
  await hydrateFromDatabase(profileRecord);
  // Restauração feita a partir do onboarding (aparelho novo): com perfil
  // completo no backup, o cadastro não tem mais o que pedir.
  if (userProfile.value) {
    isFirstAccess.value = false;
    isOnboardingOpen.value = false;
  }
  await loadHistory();
  await loadBodyEntries();
  reloadProgramState();
}

// ---------------------------------------------------------------------------
// Funcionalidades em composables (src/composables). Ficam no fim do setup
// porque dependem de estado declarado acima; tudo o que usam roda depois.
// ---------------------------------------------------------------------------
const { uiPrefs, saveUiPrefs, isDaySummaryOpen, toggleDaySummary, isGlossaryOpen, openGlossary, isSheetEditMode } = useUiPrefs();
const { deloadEvaluation, startDeload, dismissDeload, endDeload, deloadHint } = useDeload({ historySessions, lastSets });
const {
  bodyEntries, loadBodyEntries, bodyTrend, latestBodyWeight, currentIsoWeekKey,
  weeklySummary, studentSummary, trainerSplitsToSend
} = useWeeklyInsights({
  historySessions, weeklySessions, userProfile, activePlan,
  exerciseNames, exerciseMuscleMap, todayWalkingData, deloadEvaluation
});
const {
  todayPlan, todayMinutes, todayMuscles, firstStepsDone, showFirstSteps,
  dismissFirstSteps, startTodayWorkout, viewTodayWorkout
} = useTodayWorkout({
  activePlan, historySessions, bodyEntries, uiPrefs, saveUiPrefs,
  currentMainTab, currentSplitTab, openTrainingMode, getSplitMuscleGroups, MUSCLE_LABELS
});
const { handleApplyCalories, handleAcceptTrainerPlan, handleCloudRestore, autoCloudSync } = useOnlineActions({
  activePlan, userProfile, persistOrReport, reportStorageError, initCustomNutritionForm,
  isBodyProgressOpen, isTrainerOpen, isCloudSyncOpen, currentMainTab, currentSplitTab,
  aiPlanMessage, activeMuscleFilter, loadLastSets, studentSummary,
  pendingBackup, pendingBackupSummary, pendingBackupFileName, pendingBackupWarnings, isBackupImportOpen
});
const {
  programInfo, isProgramActive, shouldOfferProgram, programReviewData, isProgramOpen,
  programHint, programSeriesLabel, startProgram, dismissProgram, abandonProgram, completeProgram, reloadProgramState
} = useBeginnerProgram({ historySessions, userProfile, gamificationState, exerciseNames });

function handleCompleteProgram() {
  completeProgram();
  triggerHaptic('celebrate');
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
}

// ---------------------------------------------------------------------------
// Contexto das abas (components/tabs/*): o que cada aba lê ou chama do App.
// Gerado a partir do uso real nos templates das abas.
// ---------------------------------------------------------------------------
provide('appContext', {
  isProgramActive,
  programHint,
  programSeriesLabel,
  DIETARY_PREFERENCES,
  MUSCLE_LABELS,
  activeMuscleFilter,
  activePlan,
  activeSessionId,
  addExerciseSet,
  addWater,
  aiPlanMessage,
  askDeleteSplit,
  askRemoveExercise,
  cancelRemoveExercise,
  checkedMealsCount,
  completedDaysCount,
  confirmDeleteSplit,
  confirmRemoveExercise,
  consumedCaloriesEstimated,
  consumedProteinEstimated,
  currentDietaryPreference,
  currentMainTab,
  currentSplitTab,
  customNutritionForm,
  deloadEvaluation,
  deloadHint,
  dietAdherencePercent,
  dismissDeload,
  effectiveMacros,
  effectiveTargetCalories,
  endDeload,
  exerciseMuscleMap,
  exerciseNames,
  finishCurrentSession,
  gamificationState,
  generatePlanWithAi,
  getMuscleBadgeClass,
  getMuscleCountInSplit,
  getMuscleDotColor,
  getSplitAccentBg,
  getSplitMuscleGroups,
  getSplitTabLabel,
  getVisibleExercises,
  handleClaimBossReward,
  handleRegisterRestDay,
  historySessions,
  isAiPlanLoading,
  isCreatineTakenToday,
  isCustomNutritionActive,
  isEditingCustomNutrition,
  isSheetEditMode,
  isWeightLoss,
  lastSetLabel,
  liveSessionGamification,
  monthlyTonnageKg,
  moveExercise,
  nextLoadSuggestions,
  openAdderFor,
  openCreateSplitModal,
  openCustomExercises,
  openEditSplitModal,
  openExerciseDetails,
  openExercisePicker,
  openGlossary,
  openTrainingMode,
  pendingDeleteSplit,
  pendingRemove,
  personalRecords,
  removeExerciseSet,
  resetCustomNutrition,
  resetWater,
  saveCustomNutrition,
  setDietaryPreference,
  shouldShowMuscleHeader,
  showSplitBodyMap,
  sortSplitByMuscle,
  splitTitles,
  startDeload,
  targetCalories,
  targetProteinGrams,
  targetWaterMl,
  todayDateFormatted,
  todayMealChecks,
  todayWaterMl,
  toggleCreatineToday,
  toggleDayCheck,
  toggleExerciseCheck,
  toggleMealCheck,
  toggleMuscleFilter,
  toggleSetDone,
  totalMealsCount,
  trainingSplit,
  triggerRestTimer,
  updateLog,
  updateSetField,
  userProfile,
  waterPercent,
  weeklyChecks,
  weeklyChecksData,
  weeklySessions,
  weeklySummary,
  workoutLogs
});
</script>
