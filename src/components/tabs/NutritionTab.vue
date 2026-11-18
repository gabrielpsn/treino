<template>
  <section
    v-show="currentMainTab === 'nutrition'"
    id="screen-nutrition"
    role="tabpanel"
    aria-labelledby="tab-btn-nutrition"
    tabindex="0"
    class="space-y-6 focus:outline-none"
  >
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
  
    <div class="border-b border-[#E2E8F0] pb-4">
      <h3 class="text-xl font-extrabold text-[#0066FF] tracking-tight">
        {{ isWeightLoss ? 'Plano Nutricional & Termogênicos Naturais' : 'Plano Alimentar & Suplementação Natural' }}
      </h3>
      <p class="text-xs text-[#64748B]">
        {{ isWeightLoss ? 'Déficit calórico calculado para emagrecer com alta saciedade e estímulos naturais.' : 'Cardápio proporcional calibrado exatamente para seu gasto energético e meta de crescimento.' }}
      </p>
    </div>
  
    <!-- Barra de Seleção de Preferência Alimentar e Agente IA -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
      <div>
        <span class="text-xs font-bold uppercase tracking-wider text-[#64748B]">Estilo de Dieta</span>
        <p class="text-xs text-[#0F172A]">Escolha o padrão para adaptar os alimentos do cardápio</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
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
  
        <!-- Botão de Sincronizar com Agente de IA -->
        <button
          v-if="userProfile"
          type="button"
          id="btn-diet-generate-ai"
          @click="generatePlanWithAi"
          :disabled="isAiPlanLoading"
          class="tap-btn px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs border-[#0066FF]/30 bg-white text-[#0066FF] hover:bg-[#F1F5F9]"
          :title="isAiPlanLoading ? 'Gerando plano completo com IA...' : 'Gerar cardápio e rotina de treino com Agente Cloudflare'"
        >
          <span>{{ isAiPlanLoading ? '⏳' : '🤖' }}</span>
          <span>{{ isAiPlanLoading ? 'Gerando...' : 'Personalizar Dieta & Treino com IA' }}</span>
        </button>
      </div>
  
      <!-- Status da geração por IA na tela de Dieta -->
      <p
        v-if="aiPlanMessage"
        id="ai-plan-diet-status"
        role="status"
        aria-live="polite"
        class="w-full text-xs leading-relaxed"
        :class="aiPlanMessage?.tone === 'error' ? 'text-rose-500 font-semibold' : 'text-[#0066FF] font-semibold'"
      >
        {{ aiPlanMessage.text }}
      </p>
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
            class="tap-btn px-3 py-2 rounded-xl text-xs font-bold text-rose-700 hover:text-rose-800 border border-rose-200 bg-rose-50 transition-colors"
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
          <div class="flex items-center gap-2 mb-2" :class="sup.color === 'rose' ? 'text-rose-700' : sup.color === 'amber' ? 'text-amber-800' : 'text-emerald-700'">
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
  
    <!-- Resumo de Adesão Nutricional Diária -->
    <div id="section-diet-adherence" class="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-3">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl shadow-xs flex-shrink-0">
            🥗
          </div>
          <div>
            <h4 class="text-sm sm:text-base font-black text-[#0F172A] uppercase tracking-tight">
              Adesão Nutricional Diária
            </h4>
            <p class="text-xs text-[#64748B]">
              Marque cada refeição consumida para bater seus macros e ganhar moedas de ferro.
            </p>
          </div>
        </div>
  
        <div class="flex items-center gap-2">
          <span
            id="diet-adherence-badge"
            class="text-xs font-black px-3 py-1 rounded-full shadow-xs"
            :class="dietAdherencePercent === 100
              ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
              : 'bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/20'"
          >
            {{ checkedMealsCount }}/{{ totalMealsCount }} Refeições ({{ dietAdherencePercent }}%)
          </span>
        </div>
      </div>
  
      <!-- Barra de Progresso de Adesão à Dieta -->
      <div class="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden" role="progressbar" :aria-valuenow="dietAdherencePercent" aria-valuemin="0" aria-valuemax="100">
        <div
          id="diet-progress-bar"
          class="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500 rounded-full"
          :style="{ width: `${dietAdherencePercent}%` }"
        ></div>
      </div>
  
      <!-- Calorias e Proteínas Consumidas Estimadas -->
      <div class="grid grid-cols-2 gap-3 pt-1 text-xs">
        <div class="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
          <span class="text-[#64748B] font-bold">Calorias Ingeridas:</span>
          <span class="font-black text-[#0F172A]">
            {{ consumedCaloriesEstimated }} / {{ targetCalories }} kcal
          </span>
        </div>
        <div class="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
          <span class="text-[#64748B] font-bold">Proteína Ingerida:</span>
          <span class="font-black text-[#0066FF]">
            {{ consumedProteinEstimated }} / {{ targetProteinGrams }} g
          </span>
        </div>
      </div>
    </div>
  
    <!-- Cards de Refeições -->
    <div class="grid md:grid-cols-2 gap-4">
      <div
        v-for="meal in activePlan?.meals"
        :key="meal.id"
        :id="`meal-card-${meal.id}`"
        class="p-5 rounded-2xl border flex flex-col justify-between transition-all shadow-xs"
        :class="todayMealChecks[meal.id]
          ? 'bg-emerald-500/5 border-emerald-500/40 shadow-sm'
          : 'bg-white border-[#E2E8F0] hover:border-[#0066FF]/40'"
      >
        <div>
          <div class="flex items-center justify-between gap-2 mb-2">
            <div class="flex items-center gap-2">
              <h5 class="font-bold text-[#0F172A] text-sm sm:text-base">{{ meal.title }}</h5>
              <span v-if="meal.timeSuggestion" class="text-[10px] font-semibold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-md">
                ⏰ {{ meal.timeSuggestion }}
              </span>
            </div>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                :id="`btn-check-meal-${meal.id}`"
                @click="toggleMealCheck(meal.id)"
                class="tap-btn px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1"
                :class="todayMealChecks[meal.id]
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] border border-[#CBD5E1]'"
              >
                <span>{{ todayMealChecks[meal.id] ? '✓ Feita' : 'Marcar' }}</span>
              </button>
              <span v-if="activePlan?.planSource === 'ai'" class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                IA
              </span>
              <span 
                :class="isWeightLoss ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-[#0066FF] bg-blue-50 border-blue-200'"
                class="text-[11px] font-semibold px-2 py-0.5 rounded border"
              >
                {{ meal.tag }}
              </span>
            </div>
          </div>
          <p class="text-xs sm:text-sm text-[#0F172A] leading-relaxed mt-2">{{ meal.items }}</p>
        </div>
        <div class="mt-4 pt-3 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-[#64748B]">
          <p>
            <strong>Objetivo Fisiológico:</strong> {{ meal.objective }}
          </p>
          <span v-if="meal.calories" class="font-bold text-[#0066FF] flex-shrink-0">
            ⚡ ~{{ meal.calories }} kcal
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
// Aba extraída do App.vue. O estado continua no App e chega por provide/inject
// ('appContext'): esta divisão é estrutural, sem mudar comportamento.
import { inject } from 'vue';

const {
  DIETARY_PREFERENCES,
  currentMainTab,
  isAiPlanLoading,
  aiPlanMessage,
  userProfile,
  activePlan,
  isWeightLoss,
  currentDietaryPreference,
  setDietaryPreference,
  isEditingCustomNutrition,
  customNutritionForm,
  isCustomNutritionActive,
  effectiveTargetCalories,
  effectiveMacros,
  saveCustomNutrition,
  resetCustomNutrition,
  todayWaterMl,
  targetWaterMl,
  waterPercent,
  isCreatineTakenToday,
  todayDateFormatted,
  addWater,
  resetWater,
  toggleCreatineToday,
  todayMealChecks,
  targetCalories,
  targetProteinGrams,
  totalMealsCount,
  checkedMealsCount,
  dietAdherencePercent,
  consumedCaloriesEstimated,
  consumedProteinEstimated,
  toggleMealCheck,
  generatePlanWithAi
} = inject('appContext');
</script>
