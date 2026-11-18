<template>
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
</template>

<script setup>
// Aba extraída do App.vue. O estado continua no App e chega por provide/inject
// ('appContext'): esta divisão é estrutural, sem mudar comportamento.
import { inject } from 'vue';

const {
  currentMainTab,
  activePlan,
  weeklyChecks,
  weeklyChecksData,
  completedDaysCount,
  handleRegisterRestDay,
  toggleDayCheck
} = inject('appContext');
</script>
