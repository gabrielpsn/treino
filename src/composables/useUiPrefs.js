import { computed, ref } from 'vue';

/**
 * Preferências de interface lembradas no aparelho (painel recolhido, glossário
 * visto, primeiros passos dispensados) e o modo "Editar ficha".
 */
export function useUiPrefs() {
  // ---------------------------------------------------------------------------
  // Experiência para iniciantes: treino de hoje, primeiros passos, glossário
  // ---------------------------------------------------------------------------

  const UI_PREFS_KEY = 'overload_ui_prefs';
  function readUiPrefs() {
    try {
      return JSON.parse(localStorage.getItem(UI_PREFS_KEY) || '{}') || {};
    } catch {
      return {};
    }
  }
  const uiPrefs = ref(readUiPrefs());
  function saveUiPrefs(patch) {
    uiPrefs.value = { ...uiPrefs.value, ...patch };
    try {
      localStorage.setItem(UI_PREFS_KEY, JSON.stringify(uiPrefs.value));
    } catch {
      // Preferência visual: sem storage, só não é lembrada.
    }
  }

  const isDaySummaryOpen = computed(() => uiPrefs.value.daySummaryOpen === true);
  function toggleDaySummary() {
    saveUiPrefs({ daySummaryOpen: !isDaySummaryOpen.value });
  }

  const isGlossaryOpen = ref(false);
  function openGlossary() {
    isGlossaryOpen.value = true;
    saveUiPrefs({ seenGlossary: true });
  }

  // Modo de edição da ficha: mover/remover ficam escondidos no dia a dia para
  // o iniciante não apagar um exercício sem querer no meio do treino.
  const isSheetEditMode = ref(false);

  return { uiPrefs, saveUiPrefs, isDaySummaryOpen, toggleDaySummary, isGlossaryOpen, openGlossary, isSheetEditMode };
}
