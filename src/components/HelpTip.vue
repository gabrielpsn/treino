<template>
  <span class="relative inline-flex align-middle">
    <button
      type="button"
      :id="`help-${term}${suffix ? `-${suffix}` : ''}`"
      class="help-tip-btn w-6 h-6 -my-1 inline-flex items-center justify-center rounded-full text-[11px] font-black text-[#0066FF] bg-blue-50 border border-blue-200 hover:bg-blue-100"
      :aria-label="`O que é ${entry.term}?`"
      :aria-expanded="open ? 'true' : 'false'"
      @click.stop="open = !open"
    >?</button>
    <span
      v-if="open"
      role="note"
      class="absolute z-40 top-7 left-1/2 -translate-x-1/2 w-60 max-w-[80vw] rounded-xl bg-[#0F172A] text-white text-[11px] leading-snug p-3 shadow-xl normal-case tracking-normal font-normal text-left"
      @click.stop
    >
      <strong class="block text-xs mb-1">{{ entry.term }}</strong>
      {{ entry.short }}
      <span class="block mt-1 text-slate-300">{{ entry.long }}</span>
      <button type="button" class="mt-2 text-[10px] font-bold underline" @click="open = false">Entendi</button>
    </span>
  </span>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { GLOSSARY } from '../engine/glossary.js';

const props = defineProps({
  term: { type: String, required: true },
  suffix: { type: String, default: '' }
});
const open = ref(false);
const entry = computed(() => GLOSSARY[props.term] ?? { term: props.term, short: '', long: '' });

function close() { open.value = false; }
onMounted(() => document.addEventListener('click', close));
onBeforeUnmount(() => document.removeEventListener('click', close));
</script>
