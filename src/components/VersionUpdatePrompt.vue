<template>
  <Transition
    enter-active-class="transition duration-300 ease-out transform"
    enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
    enter-to-class="opacity-100 translate-y-0 sm:scale-100"
    leave-active-class="transition duration-200 ease-in transform"
    leave-from-class="opacity-100 translate-y-0 sm:scale-100"
    leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
  >
    <div
      v-if="visible"
      id="pwa-update-prompt"
      role="alert"
      aria-live="polite"
      aria-labelledby="pwa-update-title"
      aria-describedby="pwa-update-desc"
      class="fixed bottom-20 left-3 right-3 sm:bottom-6 sm:right-6 sm:left-auto sm:max-w-md z-50 bg-slate-900/95 backdrop-blur-xl border rounded-2xl p-4 shadow-2xl"
      :class="isWeightLoss ? 'border-rose-500/40 shadow-rose-950/50' : 'border-amber-500/40 shadow-amber-950/50'"
    >
      <div class="flex items-start gap-3">
        <!-- Ícone Animado -->
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg shadow-inner"
          :class="isWeightLoss ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'"
        >
          <span class="animate-bounce" aria-hidden="true">🚀</span>
        </div>

        <!-- Conteúdo do Aviso -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span
              class="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full border"
              :class="isWeightLoss ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'"
            >
              Nova Versão
            </span>
          </div>
          <h4 id="pwa-update-title" class="text-sm font-bold text-white mt-1">
            Atualização Pronta!
          </h4>
          <p id="pwa-update-desc" class="text-xs text-slate-300 mt-0.5 leading-relaxed">
            Uma nova versão do app está pronta com melhorias no treino e correções.
          </p>

          <!-- Ações -->
          <div class="flex items-center gap-2 mt-3">
            <button
              type="button"
              id="btn-pwa-update-now"
              @click="$emit('update')"
              class="tap-btn flex-1 sm:flex-initial min-h-11 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-95"
              :class="isWeightLoss
                ? 'bg-rose-500 text-white hover:bg-rose-400 shadow-rose-500/20'
                : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20'"
            >
              <span>Atualizar agora</span>
              <span aria-hidden="true">⚡</span>
            </button>

            <button
              type="button"
              id="btn-pwa-dismiss"
              @click="$emit('dismiss')"
              class="tap-btn min-h-11 px-3 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Lembrar mais tarde"
            >
              Depois
            </button>
          </div>
        </div>

        <!-- Botão Fechar Rápido -->
        <button
          type="button"
          aria-label="Dispensar aviso de atualização"
          @click="$emit('dismiss')"
          class="text-slate-500 hover:text-white p-1 rounded-lg transition-colors flex-shrink-0"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  isWeightLoss: {
    type: Boolean,
    default: false
  }
});

defineEmits(['update', 'dismiss']);
</script>
