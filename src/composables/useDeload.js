import { computed, ref } from 'vue';
import { evaluateDeload, deloadLoad } from '../engine/deload.js';

/** Sugestão de deload a partir do histórico e carga leve sugerida por exercício. */
export function useDeload({ historySessions, lastSets }) {
  // Deload: guarda a semana em que o usuário aceitou ou dispensou a sugestão,
  // para não insistir na mesma semana.
  const DELOAD_STATE_KEY = 'overload_deload_state';
  function readDeloadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(DELOAD_STATE_KEY) || '{}');
      return { lastDeloadWeekKey: parsed.lastDeloadWeekKey ?? null, dismissedWeekKey: parsed.dismissedWeekKey ?? null };
    } catch {
      return { lastDeloadWeekKey: null, dismissedWeekKey: null };
    }
  }
  const deloadState = ref(readDeloadState());

  // ---------------------------------------------------------------------------
  // Deload automático
  // ---------------------------------------------------------------------------

  const deloadEvaluation = computed(() => evaluateDeload(historySessions.value, {
    now: Date.now(),
    lastDeloadWeekKey: deloadState.value.lastDeloadWeekKey,
    dismissedWeekKey: deloadState.value.dismissedWeekKey
  }));

  function persistDeloadState(next) {
    deloadState.value = next;
    try {
      localStorage.setItem(DELOAD_STATE_KEY, JSON.stringify(next));
    } catch {
      // Sem storage a sugestão volta a aparecer, sem outro efeito.
    }
  }

  function startDeload() {
    persistDeloadState({ ...deloadState.value, lastDeloadWeekKey: deloadEvaluation.value.weekKey });
  }

  function dismissDeload() {
    persistDeloadState({ ...deloadState.value, dismissedWeekKey: deloadEvaluation.value.weekKey });
  }

  function endDeload() {
    persistDeloadState({ lastDeloadWeekKey: null, dismissedWeekKey: deloadEvaluation.value.weekKey });
  }

  function deloadHint(exerciseId) {
    if (!deloadEvaluation.value.inDeload) return null;
    const load = deloadLoad(lastSets.value[exerciseId]?.weight);
    return load ? `${String(load).replace('.', ',')} kg` : null;
  }

  return { deloadState, deloadEvaluation, startDeload, dismissDeload, endDeload, deloadHint };
}
