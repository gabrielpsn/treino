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
          <button 
            id="btn-adjust-profile"
            @click="isOnboardingOpen = true"
            class="text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 font-medium"
            title="Ajustar Perfil & Recalcular"
          >
            <span>⚙️</span>
            <span class="hidden sm:inline">Ajustar Perfil</span>
          </button>
          
          <button 
            id="btn-export-backup"
            @click="handleExportJSON" 
            class="text-xs text-slate-400 hover:text-white p-2 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
            title="Exportar Dados (Backup)"
          >
            💾
          </button>
        </div>

      </div>
    </header>

    <!-- Navegação por Abas Principais (Treino, Nutrição, Frequência) -->
    <nav class="border-b border-slate-800 bg-slate-900/40 sticky top-[57px] z-20 backdrop-blur">
      <div class="max-w-5xl mx-auto px-4 flex items-center justify-between gap-2 overflow-x-auto py-2">
        <div class="flex items-center gap-2">
          <button 
            id="tab-btn-workout"
            @click="currentMainTab = 'workout'"
            :class="currentMainTab === 'workout' ? (isWeightLoss ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20' : 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20') : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
            class="px-4 py-2 rounded-xl text-xs md:text-sm transition-all flex items-center gap-2 flex-shrink-0"
          >
            <span>🏋️</span> Fichas de Treino
          </button>

          <button 
            id="tab-btn-nutrition"
            @click="currentMainTab = 'nutrition'"
            :class="currentMainTab === 'nutrition' ? (isWeightLoss ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20' : 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20') : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
            class="px-4 py-2 rounded-xl text-xs md:text-sm transition-all flex items-center gap-2 flex-shrink-0"
          >
            <span>🥗</span> Dieta & Metas
          </button>

          <button 
            id="tab-btn-frequency"
            @click="currentMainTab = 'frequency'"
            :class="currentMainTab === 'frequency' ? (isWeightLoss ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20' : 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20') : 'text-slate-400 hover:text-white hover:bg-slate-800/60'"
            class="px-4 py-2 rounded-xl text-xs md:text-sm transition-all flex items-center gap-2 flex-shrink-0"
          >
            <span>📅</span> Calendário Semanal
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
            <div class="text-xl font-black text-rose-400 mt-1">-{{ activePlan.physiology.targetWeightDiff > 0 ? activePlan.physiology.targetWeightDiff : 10 }} kg</div>
            <p class="text-[11px] text-slate-400 mt-0.5">Fase 1: -5 a -7 kg de retenção</p>
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
      <section v-show="currentMainTab === 'workout'" id="screen-workout" class="space-y-6">
        
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
          </div>
        </div>

        <!-- Lista de Exercícios da Ficha Ativa -->
        <div v-for="split in activePlan?.workoutSplits" :key="split.id">
          <div v-if="currentSplitTab === split.id" :id="`container-${split.id}`" class="space-y-4">
            
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
                    :id="`btn-check-${ex.id}`"
                    @click="toggleExerciseCheck(ex.id, split.id)"
                    class="mt-1 md:mt-0 w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center border transition-all"
                    :class="workoutLogs[ex.id]?.isDone ? (isWeightLoss ? 'bg-rose-500 border-rose-400 text-white font-black text-sm' : 'bg-amber-500 border-amber-400 text-slate-950 font-black text-sm') : 'border-slate-700 hover:border-amber-500/60 text-transparent'"
                  >
                    ✓
                  </button>

                  <div class="space-y-0.5">
                    <div class="flex items-center gap-2">
                      <h4 
                        class="text-sm md:text-base font-bold transition-colors"
                        :class="workoutLogs[ex.id]?.isDone ? 'line-through text-slate-500' : 'text-white'"
                      >
                        {{ ex.name }}
                      </h4>
                      <button 
                        :id="`btn-swap-${ex.id}`"
                        @click="openExercisePicker(ex, split.id)" 
                        class="text-[11px] text-slate-500 hover:text-amber-400 transition-colors p-1"
                        title="Substituir este exercício"
                      >
                        🔄
                      </button>
                    </div>

                    <div class="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span :class="isWeightLoss ? 'text-rose-400' : 'text-amber-400'" class="font-semibold">{{ ex.defaultSeries }}</span>
                      <span>•</span>
                      <button 
                        @click="triggerRestTimer(ex.rest)"
                        class="hover:text-amber-300 underline underline-offset-2 transition-colors flex items-center gap-1"
                      >
                        ⏱️ Descanso: {{ ex.rest }}
                      </button>
                    </div>

                    <p v-if="ex.tips" class="text-[11px] text-slate-500 italic mt-0.5">
                      💡 {{ ex.tips }}
                    </p>
                  </div>
                </div>

                <!-- Lado Direito: Inputs de Carga e Reps (Ocultos se for Cardio Contínuo) -->
                <div v-if="ex.muscle !== 'cardio'" class="flex items-center gap-3 self-end md:self-auto w-full md:w-auto">
                  <div class="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 flex-1 md:flex-initial">
                    <span class="text-xs text-slate-500 font-medium">Carga:</span>
                    <input 
                      :id="`input-weight-${ex.id}`"
                      type="number" 
                      step="0.5" 
                      placeholder="0"
                      :value="workoutLogs[ex.id]?.weight"
                      @input="e => updateLog(ex.id, split.id, 'weight', e.target.value)"
                      :class="isWeightLoss ? 'text-rose-300' : 'text-amber-300'"
                      class="w-16 bg-transparent text-sm font-bold text-right focus:outline-none focus:text-white"
                    />
                    <span class="text-xs text-slate-500">kg</span>
                  </div>

                  <div class="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 flex-1 md:flex-initial">
                    <span class="text-xs text-slate-500 font-medium">Reps:</span>
                    <input 
                      :id="`input-reps-${ex.id}`"
                      type="number" 
                      placeholder="12"
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
      <section v-show="currentMainTab === 'nutrition'" id="screen-nutrition" class="space-y-6">
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
      <section v-show="currentMainTab === 'frequency'" id="screen-frequency" class="space-y-6">
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

          <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            <div 
              v-for="day in activePlan?.weekSchedule" 
              :key="day.id"
              :id="`day-card-${day.id}`"
              @click="toggleDayCheck(day.id)"
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
                  class="w-6 h-6 rounded-full flex items-center justify-center border text-xs font-bold transition-all"
                  :class="weeklyChecks[day.id] ? (isWeightLoss ? 'bg-rose-500 border-rose-400 text-white' : 'bg-amber-500 border-amber-400 text-slate-950') : 'border-slate-800 text-transparent'"
                >
                  ✓
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>

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
      @select="handleExerciseSwapped"
      @close="isPickerOpen = false"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import confetti from 'canvas-confetti';
import { db } from './db';
import { buildPersonalizedPlan } from './engine/generators/planGenerator';
import OnboardingModal from './components/OnboardingModal.vue';
import RestTimer from './components/RestTimer.vue';
import ExercisePickerModal from './components/ExercisePickerModal.vue';

// Estados Globais
const currentMainTab = ref('workout');
const currentSplitTab = ref('treino-a');
const isOnboardingOpen = ref(false);
const isPickerOpen = ref(false);

const userProfile = ref(null);
const activePlan = ref(null);
const workoutLogs = ref({});
const weeklyChecks = ref({});

// Referências
const restTimerRef = ref(null);
const selectedExerciseForSwap = ref(null);
const selectedSplitForSwap = ref(null);

const isWeightLoss = computed(() => {
  return userProfile.value?.goal === 'weight_loss' || activePlan.value?.profile?.goal === 'weight_loss';
});

const completedDaysCount = computed(() => {
  return Object.values(weeklyChecks.value).filter(Boolean).length;
});

onMounted(async () => {
  await loadUserData();
});

async function loadUserData() {
  const profileRecord = await db.user_profile.get('current_user');
  
  if (!profileRecord) {
    // Primeiro acesso: abre o onboarding
    isOnboardingOpen.value = true;
    const defaultProfile = {
      userName: 'Mariana',
      goal: 'weight_loss',
      gender: 'female',
      ageYears: 39,
      weightKg: 86,
      heightCm: 156,
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
    if (planRecord) {
      activePlan.value = planRecord;
      if (activePlan.value.workoutSplits?.length > 0) {
        currentSplitTab.value = activePlan.value.workoutSplits[0].id;
      }
    } else {
      applyAndSavePlan(profileRecord, true);
    }
  }

  // Carrega histórico de logs
  const logs = await db.workout_logs.toArray();
  const mapLogs = {};
  logs.forEach(l => {
    mapLogs[l.exerciseId] = l;
  });
  workoutLogs.value = mapLogs;

  // Carrega checks da semana
  const checks = await db.weekly_checks.toArray();
  const mapChecks = {};
  checks.forEach(c => {
    mapChecks[c.id] = c.done;
  });
  weeklyChecks.value = mapChecks;
}

async function handleSaveProfile(newProfile) {
  try {
    const rawProfile = JSON.parse(JSON.stringify(newProfile));
    userProfile.value = rawProfile;
    await db.user_profile.put({ id: 'current_user', ...rawProfile });
    await applyAndSavePlan(rawProfile, true);
    isOnboardingOpen.value = false;

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // Ignora erro de confetti se canvas não suportado
    }
  } catch (err) {
    console.error('Erro ao salvar perfil e gerar plano:', err);
    isOnboardingOpen.value = false;
  }
}

async function applyAndSavePlan(profile, persist = true) {
  try {
    const generated = buildPersonalizedPlan(profile);
    const rawPlan = JSON.parse(JSON.stringify(generated));
    activePlan.value = rawPlan;
    if (rawPlan.workoutSplits?.length > 0) {
      currentSplitTab.value = rawPlan.workoutSplits[0].id;
    }
    if (persist) {
      await db.active_plan.put(rawPlan);
    }
  } catch (err) {
    console.error('Erro ao gerar/salvar plano:', err);
  }
}

function triggerRestTimer(restString) {
  const seconds = parseInt(restString) || 60;
  restTimerRef.value?.startTimer(seconds);
}

async function toggleExerciseCheck(exerciseId, splitId) {
  const current = workoutLogs.value[exerciseId] || { weight: '', reps: '', isDone: false };
  const nextState = !current.isDone;

  const updated = {
    ...current,
    id: exerciseId,
    exerciseId,
    workoutId: splitId,
    isDone: nextState,
    updatedAt: new Date().toISOString()
  };

  workoutLogs.value[exerciseId] = updated;
  await db.workout_logs.put(updated);

  if (nextState) {
    const ex = activePlan.value.workoutSplits
      .find(s => s.id === splitId)
      ?.exercises?.find(e => e.id === exerciseId);
    if (ex) triggerRestTimer(ex.rest);
  }
}

async function updateLog(exerciseId, splitId, field, value) {
  const current = workoutLogs.value[exerciseId] || { weight: '', reps: '', isDone: false };
  const updated = {
    ...current,
    id: exerciseId,
    exerciseId,
    workoutId: splitId,
    [field]: value,
    updatedAt: new Date().toISOString()
  };

  workoutLogs.value[exerciseId] = updated;
  await db.workout_logs.put(updated);
}

async function toggleDayCheck(dayId) {
  const next = !weeklyChecks.value[dayId];
  weeklyChecks.value[dayId] = next;
  await db.weekly_checks.put({ id: dayId, done: next, updatedAt: new Date().toISOString() });

  if (next && completedDaysCount.value === 7) {
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 }
    });
  }
}

function openExercisePicker(exercise, splitId) {
  selectedExerciseForSwap.value = exercise;
  selectedSplitForSwap.value = splitId;
  isPickerOpen.value = true;
}

async function handleExerciseSwapped(newExercise) {
  if (!selectedSplitForSwap.value || !selectedExerciseForSwap.value) return;

  const split = activePlan.value.workoutSplits.find(s => s.id === selectedSplitForSwap.value);
  if (split) {
    const idx = split.exercises.findIndex(e => e.id === selectedExerciseForSwap.value.id);
    if (idx !== -1) {
      split.exercises[idx] = newExercise;
      await db.active_plan.put(activePlan.value);
    }
  }
}

async function resetAllProgress() {
  if (confirm('Deseja resetar as marcações de exercícios e o calendário da semana?')) {
    await db.workout_logs.clear();
    await db.weekly_checks.clear();
    workoutLogs.value = {};
    weeklyChecks.value = {};
  }
}

function handleExportJSON() {
  const backup = {
    userProfile: userProfile.value,
    activePlan: activePlan.value,
    workoutLogs: workoutLogs.value,
    weeklyChecks: weeklyChecks.value,
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `treino-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>
