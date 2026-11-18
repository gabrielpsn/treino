<template>
  <BaseModal
    :is-open="isOpen"
    modal-id="modal-glossary"
    title="Termos da Musculação"
    subtitle="Explicações rápidas, sem complicação"
    icon="📖"
    @close="emit('close')"
  >
    <dl class="space-y-2">
      <div v-for="id in GLOSSARY_ORDER" :key="id" :id="`glossary-${id}`" class="rounded-xl border border-[#E2E8F0] p-3">
        <dt class="text-sm font-black">{{ GLOSSARY[id].term }}</dt>
        <dd class="text-xs text-[#334155] mt-0.5">{{ GLOSSARY[id].short }}</dd>
        <dd class="text-[11px] text-[#64748B] mt-1">{{ GLOSSARY[id].long }}</dd>
      </div>
    </dl>
  </BaseModal>
</template>

<script setup>
import BaseModal from './BaseModal.vue';
import { GLOSSARY, GLOSSARY_ORDER } from '../engine/glossary.js';

defineProps({ isOpen: Boolean });
const emit = defineEmits(['close']);
</script>
