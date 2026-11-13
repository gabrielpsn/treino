<template>
  <div
    v-if="isOpen"
    id="app-feedback-modal"
    role="dialog"
    aria-modal="true"
    aria-label="Avaliação e Feedback do App"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-w-lg bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Cabeçalho do Modal -->
      <header class="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl">
            ⭐
          </div>
          <div>
            <h3 class="text-base font-black text-[#0F172A] tracking-tight">
              Avalie o Overload AI
            </h3>
            <p class="text-[11px] text-[#64748B]">
              Sua opinião e sugestões ajudam a aprimorar o app e os treinos
            </p>
          </div>
        </div>

        <button
          type="button"
          id="btn-close-feedback-modal"
          class="tap-btn w-9 h-9 rounded-xl border border-[#CBD5E1] bg-white text-[#64748B] hover:text-[#0F172A] flex items-center justify-center text-sm font-bold transition-colors"
          @click="emit('close')"
          aria-label="Fechar modal de feedback"
        >
          ✕
        </button>
      </header>

      <!-- Abas de Navegação (Avaliar vs Histórico) -->
      <div class="px-5 pt-3 border-b border-[#E2E8F0] flex gap-4 text-xs font-bold">
        <button
          type="button"
          id="tab-btn-form"
          @click="activeView = 'form'"
          class="pb-2.5 transition-colors border-b-2"
          :class="activeView === 'form' ? 'border-[#0066FF] text-[#0066FF] font-black' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'"
        >
          ✍️ Deixar Avaliação
        </button>
        <button
          type="button"
          id="tab-btn-history"
          @click="activeView = 'history'"
          class="pb-2.5 transition-colors border-b-2 flex items-center gap-1.5"
          :class="activeView === 'history' ? 'border-[#0066FF] text-[#0066FF] font-black' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'"
        >
          <span>📜 Avaliações da Comunidade</span>
          <span v-if="storedFeedbacks.length > 0" class="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-[#0F172A]">
            {{ storedFeedbacks.length }}
          </span>
        </button>
      </div>

      <!-- Formulário de Avaliação -->
      <div v-if="activeView === 'form'" class="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
        
        <!-- Estado de Sucesso pós-envio -->
        <div v-if="isSubmitted" class="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-in zoom-in-95">
          <div class="text-4xl">🎉🚀</div>
          <h4 class="text-base font-black text-emerald-900">Muito Obrigado pelo seu Feedback!</h4>
          <p class="text-xs text-emerald-800 leading-relaxed">
            Sua avaliação foi registrada e recebida com sucesso. Cada sugestão ajuda a calibrar a inteligência artificial e a experiência do app!
          </p>
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/80 text-emerald-900 text-xs font-bold border border-emerald-300">
            <span>✨</span>
            <span>+50 XP e +20 Moedas de Ferro creditadas!</span>
          </div>
          <div class="pt-3 flex flex-col sm:flex-row gap-2 justify-center">
            <button
              type="button"
              id="btn-feedback-another"
              @click="resetForm"
              class="tap-btn px-4 py-2 rounded-xl border border-emerald-300 bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50"
            >
              Enviar Outra Mensagem
            </button>
            <button
              type="button"
              id="btn-feedback-close"
              @click="emit('close')"
              class="tap-btn px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm"
            >
              Concluir
            </button>
          </div>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Avaliação por Estrelas (1 a 5) -->
          <div class="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-center space-y-2">
            <label class="block text-xs font-black uppercase tracking-wider text-[#64748B]">
              Como você avalia sua experiência com o app?
            </label>

            <!-- Fileira de 5 Estrelas Interativas -->
            <div class="flex items-center justify-center gap-2 py-1">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                :id="`btn-star-${star}`"
                @click="rating = star"
                @mouseenter="hoverRating = star"
                @mouseleave="hoverRating = 0"
                class="tap-btn text-3xl sm:text-4xl transition-transform hover:scale-125 focus:outline-none"
                :aria-label="`${star} de 5 estrelas`"
              >
                <span :class="(hoverRating || rating) >= star ? 'text-amber-400 drop-shadow-sm' : 'text-slate-200'">
                  ★
                </span>
              </button>
            </div>

            <!-- Rótulo Descritivo da Nota -->
            <p id="star-rating-label" class="text-xs font-bold text-[#0F172A] transition-all">
              {{ ratingLabels[hoverRating || rating] }}
            </p>
          </div>

          <!-- Seleção de Categoria -->
          <div>
            <label class="block text-xs font-bold text-[#0F172A] mb-1.5">
              Qual é o foco da sua mensagem? <span class="text-rose-500">*</span>
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2" role="group" aria-label="Categorias de feedback">
              <button
                v-for="cat in categories"
                :key="cat.id"
                type="button"
                :id="`btn-cat-${cat.id}`"
                @click="category = cat.id"
                class="tap-btn p-2 rounded-xl border text-left text-xs transition-all flex flex-col justify-between"
                :class="category === cat.id
                  ? 'border-[#0066FF] bg-blue-50/70 text-[#0066FF] font-bold ring-1 ring-[#0066FF]/20 shadow-xs'
                  : 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1]'"
              >
                <span class="text-xs text-[#0F172A] font-bold">{{ cat.label }}</span>
                <span class="text-[10px] text-[#64748B] mt-0.5">{{ cat.desc }}</span>
              </button>
            </div>
          </div>

          <!-- Tags Rápidas (Multi-seleção) -->
          <div>
            <label class="block text-xs font-bold text-[#0F172A] mb-1.5">
              Destaques rápidos (opcional):
            </label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="(tag, idx) in quickTags"
                :key="idx"
                type="button"
                :id="`btn-tag-${idx}`"
                @click="toggleTag(tag)"
                class="tap-btn text-xs px-2.5 py-1 rounded-full border transition-all"
                :class="selectedTags.includes(tag)
                  ? 'bg-[#0066FF] text-white border-[#0066FF] font-bold shadow-xs'
                  : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1]'"
              >
                {{ selectedTags.includes(tag) ? '✓ ' : '+ ' }}{{ tag }}
              </button>
            </div>
          </div>

          <!-- Campo de Comentário Detalhado -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label for="input-feedback-comment" class="block text-xs font-bold text-[#0F172A]">
                Sua Mensagem / Sugestão:
              </label>
              <span class="text-[10px] text-[#64748B]">{{ comment.length }}/1000</span>
            </div>
            <textarea
              id="input-feedback-comment"
              v-model="comment"
              rows="3"
              maxlength="1000"
              placeholder="Ex: O que está achando da divisão de treinos? Algum exercício que gostaria de ver adicionado ou melhoria na rotina?"
              class="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#0066FF] focus:bg-white rounded-xl p-3 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none transition-colors"
            ></textarea>
          </div>

          <!-- Informações de Contato / Autor -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label for="input-feedback-name" class="block text-[11px] font-bold text-[#0F172A] mb-1">
                Seu Nome ou Apelido:
              </label>
              <input
                id="input-feedback-name"
                v-model="userName"
                type="text"
                maxlength="50"
                placeholder="Ex: Gabriel"
                class="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#0066FF] focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-[#0F172A] focus:outline-none"
              />
            </div>

            <div>
              <label for="input-feedback-contact" class="block text-[11px] font-bold text-[#0F172A] mb-1">
                WhatsApp / E-mail (Opcional):
              </label>
              <input
                id="input-feedback-contact"
                v-model="contact"
                type="text"
                maxlength="60"
                placeholder="Para retorno ou suporte direto"
                class="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#0066FF] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none"
              />
            </div>
          </div>

          <!-- Botões de Ação do Envio -->
          <div class="pt-3 space-y-2">
            <button
              type="submit"
              id="btn-submit-feedback"
              :disabled="isSubmitting"
              class="tap-btn w-full py-3 rounded-2xl bg-gradient-to-r from-[#0066FF] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{{ isSubmitting ? 'Enviando...' : 'Enviar Avaliação & Feedback' }}</span>
              <span>⭐🚀</span>
            </button>

            <!-- Botão Secundário para WhatsApp -->
            <button
              type="button"
              id="btn-send-whatsapp"
              @click="handleSendWhatsApp"
              class="tap-btn w-full py-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>💬</span>
              <span>Enviar via WhatsApp (81 99775-8849)</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Histórico de Avaliações / Comunidade -->
      <div v-else class="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
        <!-- Resumo das Estrelas -->
        <div class="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="text-3xl font-black text-[#0F172A]">{{ stats.average }}</div>
            <div>
              <div class="text-amber-400 text-sm">★★★★★</div>
              <p class="text-[11px] text-[#64748B]">Média baseada em {{ stats.count }} avaliações</p>
            </div>
          </div>
          <button
            type="button"
            id="btn-export-feedback-json"
            @click="exportFeedbacksJson"
            class="tap-btn text-xs font-bold text-[#0066FF] hover:underline"
            title="Exportar avaliações para JSON"
          >
            📥 Exportar JSON
          </button>
        </div>

        <!-- Lista de Feedbacks Gravados -->
        <div v-if="storedFeedbacks.length === 0" class="p-8 text-center text-xs text-[#64748B] space-y-2">
          <div class="text-3xl">📝</div>
          <p class="font-bold">Nenhuma avaliação salva neste dispositivo ainda.</p>
          <p>Envie a primeira avaliação para inspirar a evolução do app!</p>
        </div>

        <div v-else class="space-y-2.5">
          <div
            v-for="item in storedFeedbacks"
            :key="item.id"
            class="p-3.5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs space-y-1.5"
          >
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <span class="font-black text-[#0F172A]">{{ item.userName }}</span>
                <span class="text-amber-400 font-bold">
                  {{ '★'.repeat(item.rating) }}
                </span>
              </div>
              <span class="text-[10px] text-[#64748B]">{{ item.formattedDate }}</span>
            </div>

            <p v-if="item.comment" class="text-xs text-[#334155] leading-relaxed italic">
              "{{ item.comment }}"
            </p>

            <div class="flex items-center gap-1.5 flex-wrap pt-1">
              <span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {{ formatCategory(item.category) }}
              </span>
              <span
                v-for="(t, idx) in item.tags"
                :key="idx"
                class="text-[9px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-[#0066FF]"
              >
                {{ t }}
              </span>
            </div>
          </div>
        </div>

        <div class="pt-2 text-center">
          <button
            type="button"
            @click="activeView = 'form'"
            class="tap-btn text-xs font-bold text-[#0066FF] hover:underline"
          >
            ← Voltar e Avaliar Agora
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import confetti from 'canvas-confetti';
import {
  FEEDBACK_CATEGORIES,
  QUICK_TAGS,
  FEEDBACK_WHATSAPP_NUMBER,
  submitAppFeedback,
  getStoredFeedbacks,
  getFeedbackStats,
  generateWhatsAppFeedbackUrl
} from '../db/feedback.js';

const props = defineProps({
  isOpen: Boolean,
  userName: {
    type: String,
    default: 'Atleta'
  }
});

const emit = defineEmits(['close', 'feedback-submitted']);

const activeView = ref('form');
const rating = ref(5);
const hoverRating = ref(0);
const category = ref('sugestao');
const selectedTags = ref([]);
const comment = ref('');
const userName = ref(props.userName || 'Atleta');
const contact = ref('');
const isSubmitting = ref(false);
const isSubmitted = ref(false);

const storedFeedbacks = ref([]);
const stats = ref({ average: 5.0, count: 0 });

const categories = FEEDBACK_CATEGORIES;
const quickTags = QUICK_TAGS;

const ratingLabels = {
  0: 'Escolha de 1 a 5 estrelas',
  1: '1 estrela: Precisa melhorar muito 🙁',
  2: '2 estrelas: Regular, encontrei dificuldades 😐',
  3: '3 estrelas: Bom, com potencial para evoluir 🙂',
  4: '4 estrelas: Muito bom! Super útil na rotina 😊👍',
  5: '5 estrelas: Excelente, app perfeito! 🚀🔥'
};

watch(() => props.isOpen, (open) => {
  if (open) {
    userName.value = props.userName || 'Atleta';
    loadFeedbacks();
    isSubmitted.value = false;
    activeView.value = 'form';
  }
});

function loadFeedbacks() {
  storedFeedbacks.value = getStoredFeedbacks();
  stats.value = getFeedbackStats(storedFeedbacks.value);
}

function toggleTag(tag) {
  const idx = selectedTags.value.indexOf(tag);
  if (idx >= 0) {
    selectedTags.value.splice(idx, 1);
  } else {
    selectedTags.value.push(tag);
  }
}

function formatCategory(catId) {
  const found = categories.find(c => c.id === catId);
  return found ? found.label : catId;
}

function resetForm() {
  isSubmitted.value = false;
  rating.value = 5;
  category.value = 'sugestao';
  selectedTags.value = [];
  comment.value = '';
  contact.value = '';
}

async function handleSubmit() {
  if (isSubmitting.value) return;
  isSubmitting.value = true;

  try {
    const feedbackItem = await submitAppFeedback({
      rating: rating.value,
      category: category.value,
      tags: selectedTags.value,
      comment: comment.value,
      userName: userName.value,
      contact: contact.value
    });

    isSubmitted.value = true;
    loadFeedbacks();

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.55 }
    });

    emit('feedback-submitted', feedbackItem);
  } catch (err) {
    console.error('Falha ao submeter feedback:', err);
  } finally {
    isSubmitting.value = false;
  }
}

function handleSendWhatsApp() {
  const url = generateWhatsAppFeedbackUrl({
    rating: rating.value,
    category: formatCategory(category.value),
    tags: selectedTags.value,
    comment: comment.value,
    userName: userName.value,
    appVersion: '2.2'
  }, FEEDBACK_WHATSAPP_NUMBER);
  window.open(url, '_blank');
}

function exportFeedbacksJson() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(storedFeedbacks.value, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `overload_ai_feedbacks_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
</script>
