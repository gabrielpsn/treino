<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
    
    <!-- Header Fixo Estilo App Mobile/PWA -->
    <header class="border-b border-slate-800 bg-slate-900/70 backdrop-blur sticky top-0 z-30 transition-all">
      <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        
        <div class="flex items-center gap-3">
          <div 
            :class="isWeightLoss ? 'bg-gradient-to-tr from-rose-600 to-rose-400 shadow-rose-500/20 text-white' : 'bg-gradient-to-tr from-amber-600 to-amber-400 shadow-amber-500/20 text-slate-950'"
            class="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg font-black text-lg transition-colors"
          >
            {{ isWeightLoss ? '🔥' : '⚡' }}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 id="app-title" class="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                {{ isWeightLoss ? 'Emagrecimento Saudável' : 'Hipertrofia Pro' }}
              </h1>
              <span 
                :class="isWeightLoss ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'"
                class="text-[10px] px-2 py-0.5 rounded-full font-bold border"
              >
                {{ isWeightLoss ? 'Definição' : 'PWA' }}
              </span>
            </div>
            <p id="app-user-subtitle" class="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
              <span class="text-slate-200 font-semibold">Olá, {{ userProfile?.userName || 'Atleta' }} 👋</span>
              <span>•</span>
              <span :class="isWeightLoss ? 'text-rose-400' : 'text-amber-400'" class="font-medium">{{ userProfile?.weightKg }} kg</span>
              <span>•</span>
              <span class="capitalize">{{ userProfile?.experienceLevel === 'beginner' ? 'Iniciante' : userProfile?.experienceLevel === 'advanced' ? 'Avançado' : 'Intermediário' }}</span>
            </p>
          </div>
        </div>

        <!-- Ações do Header -->
        <div class="flex items-center gap-2">
          <!-- Botão PWA Instalar / Atalho -->
          <button 
            id="btn-install-app"
            @click="handleInstallPWA"
            :class="isWeightLoss ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/40'"
            class="text-xs border px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 font-bold shadow-sm"
            title="Instalar App ou Criar Atalho na Tela Inicial"
          >
            <span aria-hidden="true">📲</span>
            <span class="hidden sm:inline">{{ isAppInstalled ? 'App Instalado' : 'Instalar App' }}</span>
          </button>

          <button 
            id="btn-adjust-profile"
            @click="isOnboardingOpen = true"
            class="text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 font-medium"
            title="Ajustar Perfil & Recalcular"
          >
            <span aria-hidden="true">⚙️</span>
            <span class="hidden sm:inline">Ajustar Perfil</span>
          </button>
          
          <button 
            id="btn-import-backup"
            @click="openBackupFilePicker"
            class="text-xs text-slate-400 hover:text-white p-2 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
            title="Restaurar backup"
          >
            <span aria-hidden="true">📂</span>
            <span class="sr-only">Restaurar backup</span>
          </button>

          <button 
            id="btn-export-backup"
            @click="handleExportJSON" 
            class="text-xs text-slate-400 hover:text-white p-2 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
            title="Exportar Dados (Backup)"
          >
            <span aria-hidden="true">💾</span>
            <span class="sr-only">Exportar dados (backup)</span>
          </button>

          <!-- input escondido: o botão acima é o alvo real, para o seletor de
               arquivo nativo não aparecer na interface -->
          <input
            id="input-backup-file"
            ref="backupFileInput"
            type="file"
            accept="application/json,.json"
            class="sr-only"
            @change="handleBackupFileSelected"
          />
        </div>

      </div>
    </header>

    <!-- Navegação por Abas Principais (Treino, Nutrição, Frequência) -->
    <nav
      class="border-b border-slate-800 bg-slate-900/40 sticky z-20 backdrop-blur"
      :class="storageError ? 'top-[93px]' : 'top-[57px]'"
    >
      <div class="max-w-5xl mx-auto px-4 flex items-center justify-between gap-2 overflow-x-auto py-2">
        <div class="flex items-center gap-2" role="tablist" aria-label="Seções do aplicativo">
<button 
              id="tab-btn-workout"
              role="tab"
              :aria-selected="currentMainTab === 'workout'"
              aria-controls="screen-workout"
              @click="currentMainTab = 'workout'"
              :class="currentMainTab === 'workout' ? (isWeightLoss ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20' : 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20') : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
              class="px-4 py-2 rounded-xl text-xs md:text-sm transition-all flex items-center gap-2 flex-shrink-0"
            >
            <span>🏋️</span> Fichas de Treino
          </button>

<button 
              id="tab-btn-nutrition"
              role="tab"
              :aria-selected="currentMainTab === 'nutrition'"
              aria-controls="screen-nutrition"
              @click="currentMainTab = 'nutrition'"
            :class="currentMainTab === 'nutrition' ? (isWeightLoss ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20' : 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20') : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
            class="px-4 py-2 rounded-xl text-xs md:text-sm transition-all flex items-center gap-2 flex-shrink-0"
          >
            <span>🥗</span> Dieta & Metas
          </button>

<button
              id="tab-btn-frequency"
              role="tab"
              :aria-selected="currentMainTab === 'frequency'"
              aria-controls="screen-frequency"
              @click="currentMainTab = 'frequency'"
            :class="currentMainTab === 'frequency' ? (isWeightLoss ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20' : 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20') : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
            class="px-4 py-2 rounded-xl text-xs md:text-sm transition-all flex items-center gap-2 flex-shrink-0"
          >
            <span>📅</span> Calendário Semanal
          </button>

          <button
              id="tab-btn-history"
              role="tab"
              :aria-selected="currentMainTab === 'history'"
              aria-controls="screen-history"
              @click="openHistoryTab"
              :class="currentMainTab === 'history' ? (isWeightLoss ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20' : 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20') : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
              class="px-4 py-2 rounded-xl text-xs md:text-sm transition-all flex items-center gap-2 flex-shrink-0"
            >
            <span>📈</span> Histórico
          </button>
        </div>

        <button 
          id="btn-reset-weights"
          @click="resetAllProgress"
          class="text-xs text-slate-500 hover:text-rose-400 transition-colors px-2 py-1 flex-shrink-0"
        >
          Zerar Histórico
        </button>
      </div>
    </nav>

    <!-- Aviso legal: o app calcula metas e sugere suplementos por fórmula
         publicada e não substitui avaliação médica ou profissional. -->
    <div id="medical-disclaimer" class="border-b border-slate-800/70 bg-slate-950/60">
      <p class="max-w-5xl mx-auto px-4 py-2 text-[11px] text-slate-500 leading-relaxed">
        <strong class="text-slate-400">Aviso:</strong> as metas são calculadas por
        fórmulas públicas (Mifflin-St Jeor, faixas da OMS) e não substituem avaliação médica.
        Com dor, lesão ou condição clínica, consulte um profissional antes de seguir o plano.
      </p>
    </div>

    <!-- Conteúdo Principal -->
    <main class="max-w-5xl mx-auto px-4 py-6 flex-1 w-full space-y-6">

      <!-- BANNER DE BOAS-VINDAS / RESUMO INTELIGENTE -->
      <div v-if="activePlan?.physiology" id="banner-physiology-summary" class="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span :class="isWeightLoss ? 'text-rose-400' : 'text-amber-500'" class="text-xs font-bold uppercase tracking-wider">
            {{ isWeightLoss ? 'Diagnóstico & Déficit Calórico' : 'Metas Diárias Calculadas' }}
          </span>
          <h2 class="text-base sm:text-lg font-bold text-white mt-0.5">
            {{ isWeightLoss ? 'Meta Nutricional:' : 'Superávit Anabólico:' }}
            <span :class="isWeightLoss ? 'text-rose-400' : 'text-amber-400'">{{ activePlan.physiology.targetCalories }} kcal</span> / dia
          </h2>
          <p class="text-xs text-slate-400 mt-1">
            Proteína: <strong class="text-slate-200">{{ activePlan.physiology.macros.proteinGrams }}g</strong> • 
            Carboidrato: <strong class="text-slate-200">{{ activePlan.physiology.macros.carbsGrams }}g</strong> • 
            Gorduras: <strong class="text-slate-200">{{ activePlan.physiology.macros.fatGrams }}g</strong>
            <span v-if="activePlan.physiology.imc"> • IMC: <strong :class="isWeightLoss ? 'text-amber-400' : 'text-slate-200'">{{ activePlan.physiology.imc }} ({{ activePlan.physiology.imcStatus }})</strong></span>
          </p>
        </div>

        <div class="flex items-center gap-3">
          <div class="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-center">
            <span class="block text-[10px] text-slate-500 uppercase font-semibold">Água / Dia</span>
            <span class="text-sm font-bold text-cyan-400">{{ activePlan.physiology.water.liters }} L</span>
          </div>
          <div class="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-center">
            <span class="block text-[10px] text-slate-500 uppercase font-semibold">Creatina</span>
            <span :class="isWeightLoss ? 'text-rose-400' : 'text-amber-400'" class="text-sm font-bold">{{ activePlan.physiology.creatine }}g</span>
          </div>
        </div>
      </div>

      <!-- SEÇÃO EXCLUSIVA DE EMAGRECIMENTO: DIAGNÓSTICO E CRONOGRAMA EM FASES -->
      <section v-if="isWeightLoss && activePlan?.physiology" id="section-weight-loss-diagnosis" class="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div class="border-b border-slate-800 pb-3 mb-4 flex items-center justify-between">
          <div>
            <span class="text-xs font-bold tracking-widest text-rose-400 uppercase">Cronograma de Emagrecimento Saudável</span>
            <h3 class="text-lg font-extrabold text-white mt-0.5">Metas Sustentáveis (Sem Efeito Sanfona)</h3>
          </div>
          <span class="text-xs bg-rose-500/10 text-rose-300 border border-rose-500/20 px-3 py-1 rounded-full font-bold">
            Ritmo: 2 a 3 kg/mês
          </span>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div class="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span class="text-xs text-slate-400 font-medium">Peso Atual</span>
            <div class="text-xl font-black text-white mt-1">{{ userProfile?.weightKg }} kg</div>
            <p class="text-[11px] text-amber-400 mt-0.5">IMC: {{ activePlan.physiology.imc }}</p>
          </div>
          <div class="p-3.5 rounded-2xl bg-slate-950/60 border border-rose-500/30">
            <span class="text-xs text-rose-400 font-medium">Faixa Saudável (OMS)</span>
            <div class="text-xl font-black text-white mt-1">{{ activePlan.physiology.healthyWeightRange }}</div>
            <p class="text-[11px] text-slate-400 mt-0.5">Prevenção articular e metabólica</p>
          </div>
          <div class="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span class="text-xs text-slate-400 font-medium">Meta Estimada</span>
            <div class="text-xl font-black mt-1" :class="activePlan.physiology.targetWeightDiff > 0 ? 'text-rose-400' : 'text-emerald-400'">
              {{ activePlan.physiology.targetWeightText }}
            </div>
            <p class="text-[11px] text-slate-400 mt-0.5">
              {{ activePlan.physiology.targetWeightDiff > 0 ? 'Fase 1: -5 a -7 kg de retenção' : 'Você já está na faixa saudável' }}
            </p>
          </div>
          <div class="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span class="text-xs text-slate-400 font-medium">Prazo Recomendado</span>
            <div class="text-xl font-black text-white mt-1">6 a 10 Meses</div>
            <p class="text-[11px] text-emerald-400 mt-0.5">Consistência e massa magra</p>
          </div>
        </div>

        <div class="grid sm:grid-cols-3 gap-3 text-xs">
          <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
            <strong class="text-rose-300 block mb-1">Etapa 1: Adaptação</strong>
            Redução rápida de inchaço, ganho de mobilidade e adaptação ao déficit sem fome severa.
          </div>
          <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
            <strong class="text-rose-300 block mb-1">Etapa 2: Queima Ativa</strong>
            Perda contínua de gordura visceral, sustentada por musculação e preservação de tônus.
          </div>
          <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
            <strong class="text-rose-300 block mb-1">Etapa 3: Consolidação</strong>
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
        <div class="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <h3 class="text-xl font-extrabold text-white tracking-tight">Ficha & Sobrecarga Progressiva</h3>
            <p class="text-xs text-slate-400">Anote os pesos de hoje. O app salva automaticamente e exibe seu histórico para o próximo treino.</p>
          </div>

          <div class="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
            <button 
              v-for="split in activePlan?.workoutSplits" 
              :key="split.id"
              :id="`btn-split-${split.id}`"
              @click="currentSplitTab = split.id"
              :class="currentSplitTab === split.id ? (isWeightLoss ? 'bg-rose-500 text-white font-black shadow' : 'bg-amber-500 text-slate-950 font-black shadow') : 'text-slate-400 hover:text-white'"
              class="px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-bold transition-all"
            >
              {{ split.title.split(' ')[0] }} {{ split.title.split(' ')[1] }}
            </button>

            <button
              type="button"
              id="btn-open-custom-exercises"
              @click="openCustomExercises"
              class="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-all"
              title="Criar e gerenciar seus próprios exercícios"
            >
              + Meus exercícios
            </button>

            <button
              v-if="activeSessionId"
              type="button"
              id="btn-finish-session"
              @click="finishCurrentSession"
              class="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-all ml-1"
              title="Encerrar este treino e registrá-lo no histórico"
            >
              ✓ Concluir treino
            </button>
          </div>
        </div>

        <!-- Lista de Exercícios da Ficha Ativa -->
        <div v-for="split in activePlan?.workoutSplits" :key="split.id">
          <div v-if="currentSplitTab === split.id" :id="`container-${split.id}`" class="space-y-4">

            <div class="flex justify-end">
              <button
                type="button"
                :id="`btn-add-exercise-${split.id}`"
                @click="openAdderFor(split.id)"
                class="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-700 text-slate-300 hover:text-white hover:border-amber-500/60 transition-colors"
                title="Adicionar um exercício a esta ficha"
              >
                + Adicionar exercício
              </button>
            </div>
            
            <!-- Descrição / Dicas do Split -->
            <div :class="split.accentBg" class="p-4 rounded-2xl border text-xs sm:text-sm flex items-start justify-between gap-3">
              <div>
                <strong>{{ split.title }}:</strong> {{ split.subtitle }}
              </div>
            </div>

            <!-- Cards de Exercícios -->
            <div class="grid gap-3">
              <div 
                v-for="ex in split.exercises" 
                :key="ex.id"
                :id="`exercise-card-${ex.id}`"
                class="p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                :class="workoutLogs[ex.id]?.isDone ? 'bg-slate-900/40 border-slate-800/60 opacity-75' : 'bg-slate-900 border-slate-800 hover:border-slate-700'"
              >
                <!-- Lado Esquerdo: Checkbox + Título + Dicas -->
                <div class="flex items-start md:items-center gap-3.5 flex-1">
                  <button 
                    type="button"
                    :id="`btn-check-${ex.id}`"
                    @click="toggleExerciseCheck(ex.id, split.id)"
                    :aria-pressed="!!workoutLogs[ex.id]?.isDone"
                    :aria-label="workoutLogs[ex.id]?.isDone ? `Marcar ${ex.name} como pendente` : `Marcar ${ex.name} como concluído`"
                    class="mt-1 md:mt-0 w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center border transition-all"
                    :class="workoutLogs[ex.id]?.isDone ? (isWeightLoss ? 'bg-rose-500 border-rose-400 text-white font-black text-sm' : 'bg-amber-500 border-amber-400 text-slate-950 font-black text-sm') : 'border-slate-700 hover:border-amber-500/60 text-transparent'"
                  >
                    ✓
                  </button>

                  <div class="space-y-0.5">
                    <div class="flex items-center gap-2 flex-wrap">
                      <a 
                        v-if="ex.imageUrl"
                        :href="ex.imageUrl" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        :id="`link-exercise-${ex.id}`"
                        class="text-sm md:text-base font-bold transition-colors hover:underline flex items-center gap-1.5 group"
                        :class="workoutLogs[ex.id]?.isDone ? 'line-through text-slate-500' : 'text-white hover:text-amber-300'"
                        title="Ver demonstração do exercício (imagem externa)"
                      >
                        <span>{{ ex.name }}</span>
                        <span class="text-xs opacity-60 group-hover:opacity-100 transition-opacity">↗</span>
                      </a>
                      <h4 
                        v-else
                        class="text-sm md:text-base font-bold transition-colors"
                        :class="workoutLogs[ex.id]?.isDone ? 'line-through text-slate-500' : 'text-white'"
                      >
                        {{ ex.name }}
                      </h4>

<button 
                    type="button"
                    :id="`btn-swap-${ex.id}`"
                    @click="openExercisePicker(ex, split.id)" 
                    :aria-label="`Substituir exercício ${ex.name}`"
                    class="text-[11px] text-slate-500 hover:text-amber-400 transition-colors p-1"
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
                    class="text-[11px] text-slate-500 hover:text-amber-400 transition-colors p-1 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:text-slate-500"
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
                    class="text-[11px] text-slate-500 hover:text-amber-400 transition-colors p-1 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:text-slate-500"
                    title="Mover para baixo"
                  >
                    <span aria-hidden="true">↓</span>
                  </button>

                  <button
                    type="button"
                    :id="`btn-remove-${ex.id}`"
                    @click="removeExercise(ex.id, split.id)"
                    :aria-label="`Remover ${ex.name} da ficha`"
                    class="text-[11px] text-slate-500 hover:text-rose-400 transition-colors p-1"
                    title="Remover da ficha"
                  >
                    <span aria-hidden="true">✕</span>
                  </button>
                    </div>

                    <div class="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span :class="isWeightLoss ? 'text-rose-400' : 'text-amber-400'" class="font-semibold">{{ ex.defaultSeries }}</span>
                      <span>•</span>
                      <button 
                        type="button"
                        :id="`btn-rest-${ex.id}`"
                        @click="triggerRestTimer(ex.rest)"
                        :aria-label="`Iniciar descanso de ${ex.rest}`"
                        class="hover:text-amber-300 underline underline-offset-2 transition-colors flex items-center gap-1"
                      >
                        <span aria-hidden="true">⏱️</span> Descanso: {{ ex.rest }}
                      </button>
                    </div>

                    <p v-if="ex.tips" class="text-[11px] text-slate-500 italic mt-0.5">
                      💡 {{ ex.tips }}
                    </p>

                    <!-- Última carga registrada em qualquer treino anterior -->
                    <p
                      v-if="lastSetLabel(ex.id)"
                      :id="`last-load-${ex.id}`"
                      class="text-[11px] text-slate-500 mt-1"
                    >
                      <span aria-hidden="true">🕘</span>
                      Último treino: <span class="text-slate-400 font-semibold">{{ lastSetLabel(ex.id) }}</span>
                    </p>
                  </div>
                </div>

                <!-- Lado Direito: Inputs de Carga e Reps (Ocultos se for Cardio Contínuo) -->
                <div v-if="ex.muscle !== 'cardio'" class="flex items-center gap-3 self-end md:self-auto w-full md:w-auto">
                  <div class="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 flex-1 md:flex-initial">
                    <label :for="`input-weight-${ex.id}`" class="text-xs text-slate-500 font-medium">Carga:</label>
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
                      :class="isWeightLoss ? 'text-rose-300' : 'text-amber-300'"
                      class="w-16 bg-transparent text-sm font-bold text-right focus:outline-none focus:text-white"
                    />
                    <span class="text-xs text-slate-500">kg</span>
                  </div>

                  <div class="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 flex-1 md:flex-initial">
                    <label :for="`input-reps-${ex.id}`" class="text-xs text-slate-500 font-medium">Reps:</label>
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
                      :class="isWeightLoss ? 'text-rose-300' : 'text-amber-300'"
                      class="w-12 bg-transparent text-sm font-bold text-right focus:outline-none focus:text-white"
                    />
                  </div>
                </div>
                <div v-else class="text-xs text-sky-400 font-semibold bg-sky-500/10 px-3 py-1.5 rounded-xl border border-sky-500/20">
                  Exercício Aeróbico
                </div>

              </div>
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
        <div class="border-b border-slate-800 pb-4">
          <h3 class="text-xl font-extrabold text-white tracking-tight">
            {{ isWeightLoss ? 'Plano Nutricional & Termogênicos Naturais' : 'Plano Alimentar & Suplementação Natural' }}
          </h3>
          <p class="text-xs text-slate-400">
            {{ isWeightLoss ? 'Déficit calórico calculado para emagrecer com alta saciedade e estímulos naturais.' : 'Cardápio proporcional calibrado exatamente para seu gasto energético e meta de crescimento.' }}
          </p>
        </div>

        <!-- Destaques Creatina e Componentes Naturais -->
        <div v-if="isWeightLoss" class="grid md:grid-cols-3 gap-4">
          <div 
            v-for="sup in activePlan?.naturalSupplements" 
            :key="sup.id"
            :id="`card-supplement-${sup.id}`"
            class="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div class="flex items-center gap-2 mb-2" :class="sup.color === 'rose' ? 'text-rose-400' : sup.color === 'amber' ? 'text-amber-400' : 'text-emerald-400'">
                <span class="text-xl">{{ sup.icon }}</span>
                <h4 class="font-bold text-white text-sm">{{ sup.name }}</h4>
              </div>
              <p class="text-xs text-slate-300 leading-relaxed">
                <strong>Como usar:</strong> {{ sup.dosage }}<br>
                {{ sup.benefit }}
              </p>
            </div>
          </div>
        </div>

        <div v-else class="grid md:grid-cols-2 gap-4">
          <div class="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/20">
            <div class="flex items-center gap-2.5 mb-2">
              <span class="text-xl">⚡</span>
              <h4 class="font-bold text-white">Creatina Monohidratada ({{ activePlan?.physiology?.creatine }}g / dia)</h4>
            </div>
            <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Consumo diário contínuo, <strong>inclusive nos dias de descanso</strong>. Tome com uma refeição rica em carboidratos (almoço ou pós-treino) para elevar a captação intracelular via pico de insulina.
            </p>
          </div>

          <div class="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-slate-900 to-slate-900 border border-cyan-500/20">
            <div class="flex items-center gap-2.5 mb-2">
              <span class="text-xl">💧</span>
              <h4 class="font-bold text-white">Hidratação Crítica ({{ activePlan?.physiology?.water?.liters }} Litros)</h4>
            </div>
            <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
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
            class="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all"
          >
            <div>
              <div class="flex items-center justify-between gap-2 mb-2">
                <h5 class="font-bold text-white text-sm sm:text-base">{{ meal.title }}</h5>
                <span 
                  :class="isWeightLoss ? 'text-rose-400 bg-slate-800 border-rose-500/30' : 'text-amber-400 bg-slate-800 border-slate-700/60'"
                  class="text-[11px] font-semibold px-2 py-0.5 rounded border"
                >
                  {{ meal.tag }}
                </span>
              </div>
              <p class="text-xs sm:text-sm text-slate-300 leading-relaxed mt-2">{{ meal.items }}</p>
            </div>
            <p class="text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-800/80">
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
        class="space-y-6 focus:outline-none"
      >
        <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 class="text-lg font-bold text-white flex items-center gap-2">
                <span :class="isWeightLoss ? 'text-rose-400' : 'text-amber-400'">📅</span> Quadro de Compromisso Semanal
              </h3>
              <p class="text-xs text-slate-400">Clique no dia para registrar treinos, caminhadas ou descansos concluídos.</p>
            </div>
            <div class="text-xs sm:text-sm bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/60 font-semibold">
              Semana Concluída: <span id="week-progress-text" :class="isWeightLoss ? 'text-rose-400' : 'text-amber-400'" class="font-bold">{{ completedDaysCount }} / 7</span>
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
              :class="weeklyChecks[day.id] ? (isWeightLoss ? 'bg-rose-500/15 border-rose-500/50 text-white shadow' : 'bg-amber-500/15 border-amber-500/50 text-white shadow') : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'"
            >
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wider block" :class="weeklyChecks[day.id] ? (isWeightLoss ? 'text-rose-400' : 'text-amber-400') : 'text-slate-500'">
                  {{ day.label }}
                </span>
                <span class="text-xs font-semibold block mt-1 line-clamp-2" :class="weeklyChecks[day.id] ? 'text-slate-200' : 'text-slate-400'">
                  {{ day.workout }}
                </span>
              </div>

              <div class="mt-3 flex items-center justify-center">
                <span 
                  :id="`day-check-${day.id}`"
                  aria-hidden="true"
                  class="w-6 h-6 rounded-full flex items-center justify-center border text-xs font-bold transition-all"
                  :class="weeklyChecks[day.id] ? (isWeightLoss ? 'bg-rose-500 border-rose-400 text-white' : 'bg-amber-500 border-amber-400 text-slate-950') : 'border-slate-800 text-transparent'"
                >
                  ✓
                </span>
              </div>
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

    <!-- Banner de erro de armazenamento (não bloqueante) -->
    <div
      v-if="storageError"
      id="storage-error-banner"
      role="alert"
      aria-live="assertive"
      class="sticky top-[57px] z-30 bg-rose-950/95 border-b border-rose-800/70 backdrop-blur"
    >
      <div class="max-w-5xl mx-auto px-4 py-2.5 flex items-start gap-2.5">
        <span aria-hidden="true">⚠️</span>
        <p class="text-xs text-rose-100 flex-1">{{ storageError }}</p>
        <button
          type="button"
          id="btn-dismiss-storage-error"
          aria-label="Dispensar aviso"
          @click="storageError = null"
          class="text-rose-300 hover:text-white px-1"
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
      <div class="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-2xl flex items-start gap-3">
        <div class="flex-1">
          <strong class="text-white text-sm">{{ installHelp.title }}</strong>
          <ol class="text-xs text-slate-300 mt-1.5 space-y-1 list-decimal list-inside">
            <li v-for="(step, i) in installHelp.steps" :key="i">{{ step }}</li>
          </ol>
        </div>
        <button
          type="button"
          aria-label="Fechar instruções de instalação"
          @click="dismissInstallHelp"
          class="text-slate-400 hover:text-white px-1"
        >✕</button>
      </div>
    </div>

    <!-- Cronômetro Flutuante de Descanso -->
    <RestTimer ref="restTimerRef" />

    <!-- Modal de Onboarding / Perfil Personalizado -->
    <OnboardingModal 
      :is-open="isOnboardingOpen" 
      :initial-profile="userProfile"
      @save="handleSaveProfile"
      @close="isOnboardingOpen = false"
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

  </div>
</template>

<script setup>
import { ref, shallowRef, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import confetti from 'canvas-confetti';
import { db, buildWeekCheckId, getCurrentWeekKey, migrateLegacyWeeklyChecks, migrateLegacyLogsToSession } from './db';
import { openSession, recordSet, listSessions, getLastSetsForExercises, getOpenSessionIds, closeSession } from './db/sessions';
import { buildPersonalizedPlan } from './engine/generators/planGenerator';
import { parseWeight, parseReps } from './engine/history';
import OnboardingModal from './components/OnboardingModal.vue';
import HistoryPanel from './components/HistoryPanel.vue';
import RestTimer from './components/RestTimer.vue';
import ExercisePickerModal from './components/ExercisePickerModal.vue';
import CustomExercisesModal from './components/CustomExercisesModal.vue';
import BackupImportModal from './components/BackupImportModal.vue';
import {
  buildFullCatalog,
  listCustomExercises,
  saveCustomExercise,
  deleteCustomExercise
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
const isOnboardingOpen = ref(false);
const isPickerOpen = ref(false);

const userProfile = ref(null);
const activePlan = ref(null);
const workoutLogs = ref({});
const weeklyChecks = ref({});

// Última série registrada de cada exercício do plano, usada para exibir
// "última carga" na ficha. projection exerciseId -> session_sets.
const lastSets = ref({});

// Cache da sessão aberta por split. O campo de carga dispara @input a cada
// tecla; sem o cache, cada caractere faria uma consulta para rediscover a
// sessão antes de gravar.
const openSessionBySplit = ref({});

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

// Catálogo único para gerador e modal de troca: se um usasse o catálogo de
// fábrica e o outro o mesclado, um exercício recém-criado apareceria como
// alternativa na troca mas nunca entraria no plano — e o inverso também.
const fullCatalog = computed(() => buildFullCatalog(customExercises.value));
const hasCustomExercises = computed(() => customExercises.value.length > 0);

const isWeightLoss = computed(() => {
  return userProfile.value?.goal === 'weight_loss' || activePlan.value?.profile?.goal === 'weight_loss';
});

const completedDaysCount = computed(() => {
  return Object.values(weeklyChecks.value).filter(Boolean).length;
});

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
  rows.forEach(r => {
    map[r.dayId] = r.done;
  });
  weeklyChecks.value = map;
}

function setupPWA() {
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
    // Primeiro acesso: abre o onboarding com homem/João por padrão inicial
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
      restrictions: []
    };
    userProfile.value = defaultProfile;
    await db.user_profile.put({ id: 'current_user', ...defaultProfile });
    await applyAndSavePlan(defaultProfile, true);
  } else {
    userProfile.value = profileRecord;
    const planRecord = await db.active_plan.get('current_active_plan');

    // O plano salvo em disco não sabe nada dos exercícios que o usuário criou
    // depois. Regerar aqui garante que a ficha abra já com eles, sem obrigar o
    // usuário a passar pela tela de CRUD a cada visita.
    if (planRecord && !hasCustomExercises.value) {
      activePlan.value = planRecord;
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
    const rawProfile = JSON.parse(JSON.stringify(newProfile));
    const plan = await applyAndSavePlan(rawProfile, true);

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

async function applyAndSavePlan(profile, persist = true) {
  // O catálogo mesclado entra aqui e não só em regeneratePlanWithCustomExercises:
  // qualquer geração de plano (onboarding, reset de perfil) precisa enxergar os
  // exercícios próprios.
  const generated = buildPersonalizedPlan({
    ...profile,
    catalog: fullCatalog.value
  });
  const rawPlan = JSON.parse(JSON.stringify(generated));

  if (persist) {
    await db.active_plan.put(rawPlan);
  }

  // Só troca o plano em memória depois que a escrita terminou, para não
  // exibir um plano que falhou ao ser salvo.
  activePlan.value = rawPlan;
  if (rawPlan.workoutSplits?.length > 0) {
    currentSplitTab.value = rawPlan.workoutSplits[0].id;
  }

  // O plano novo pode ter exercícios diferentes dos antigos, então os selos de
  // "última carga" precisam ser recalculados para a ficha.
  await loadLastSets();

  return rawPlan;
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
  const current = previous || { weight: '', reps: '', isDone: false };
  const updated = {
    ...current,
    ...patch,
    id: exerciseId,
    exerciseId,
    workoutId: splitId,
    updatedAt: new Date().toISOString()
  };

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
      await recordSet(
        { splitId, exerciseId, weight: updated.weight, reps: updated.reps, isDone: updated.isDone },
        { sessionId }
      );
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

async function toggleDayCheck(dayId) {
  const next = !weeklyChecks.value[dayId];
  weeklyChecks.value = { ...weeklyChecks.value, [dayId]: next };
  await persistOrReport('Não foi possível salvar a marcação do dia.', () =>
    db.weekly_checks.put({
      id: buildWeekCheckId(dayId, currentWeekKey.value),
      weekKey: currentWeekKey.value,
      dayId,
      done: next,
      updatedAt: new Date().toISOString()
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
  if (session?.id) openSessionBySplit.value = { ...openSessionBySplit.value, [splitId]: session.id };
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

  const next = { ...openSessionBySplit.value };
  delete next[currentSplitTab.value];
  openSessionBySplit.value = next;

  // Com a sessão encerrada, ela passa a contar como "último treino" nos selos.
  await loadLastSets();
}

function openExercisePicker(exercise, splitId) {
  selectedExerciseForSwap.value = exercise;
  selectedSplitForSwap.value = splitId;
  isPickerOpen.value = true;
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
function handleCreateFromAdder() {
  const muscle = adderGroup.value?.muscle ?? null;
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
  a.click();
  URL.revokeObjectURL(url);
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
  lastSets.value = {};
  workoutLogs.value = {};
  weeklyChecks.value = {};
  historySessions.value = [];
  currentMainTab.value = 'workout';

  await loadCustomExercises();
  const profileRecord = await db.user_profile.get('current_user');
  await hydrateFromDatabase(profileRecord);
  await loadHistory();
}
</script>
