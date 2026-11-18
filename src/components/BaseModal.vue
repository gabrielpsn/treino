<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" aria-hidden="true" @click="emit('close')"></div>
    <div
      :id="modalId"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="`${modalId}-title`"
      class="relative w-full bg-white border border-[#E2E8F0] rounded-3xl p-5 sm:p-7 shadow-2xl z-10 text-[#0F172A] space-y-4 max-h-[90vh] overflow-y-auto"
      :class="wide ? 'max-w-2xl' : 'max-w-lg'"
    >
      <div class="flex items-start justify-between gap-3 border-b border-[#E2E8F0] pb-3">
        <div class="flex items-center gap-3 min-w-0">
          <span class="text-2xl" aria-hidden="true">{{ icon }}</span>
          <div class="min-w-0">
            <h3 :id="`${modalId}-title`" class="text-lg font-black tracking-tight">{{ title }}</h3>
            <p v-if="subtitle" class="text-xs text-[#64748B]">{{ subtitle }}</p>
          </div>
        </div>
        <button
          type="button"
          :id="`${modalId}-close`"
          aria-label="Fechar"
          class="tap-btn p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] bg-[#F1F5F9] hover:bg-[#E2E8F0]"
          @click="emit('close')"
        >✕</button>
      </div>

      <div v-if="tabs.length" role="tablist" class="flex gap-1 p-1 rounded-xl bg-[#F1F5F9] overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          role="tab"
          :id="`${modalId}-tab-${tab.id}`"
          :aria-selected="activeTab === tab.id"
          class="tap-btn flex-1 whitespace-nowrap px-3 py-2 rounded-lg text-xs font-bold transition-colors"
          :class="activeTab === tab.id ? 'bg-white text-[#0066FF] shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'"
          @click="emit('update:activeTab', tab.id)"
        >{{ tab.label }}</button>
      </div>

      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  isOpen: Boolean,
  modalId: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  icon: { type: String, default: '' },
  wide: Boolean,
  tabs: { type: Array, default: () => [] },
  activeTab: { type: String, default: '' }
});
const emit = defineEmits(['close', 'update:activeTab']);
</script>
