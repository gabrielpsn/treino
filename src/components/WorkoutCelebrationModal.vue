<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop com Blur -->
    <div
      id="celebration-backdrop"
      class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      @click="emit('close')"
      aria-hidden="true"
    ></div>

    <!-- Modal Card -->
    <div
      id="modal-workout-celebration"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
      class="relative w-full max-w-lg bg-white border border-[#E2E8F0] rounded-3xl p-5 sm:p-7 shadow-2xl z-10 text-[#0F172A] space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Topo: Ícone e Título -->
      <div class="text-center space-y-1">
        <div class="w-16 h-16 rounded-2xl bg-[#F59E0B]/15 border border-[#F59E0B] mx-auto flex items-center justify-center text-3xl shadow-sm">
          🏆
        </div>
        <h3 id="celebration-title" class="text-2xl font-black text-[#0F172A] tracking-tight">
          Treino Concluído!
        </h3>
        <p class="text-xs text-[#64748B]">
          Excelente execução. Seus ganhos mecânicos e registros foram consolidados.
        </p>
      </div>

      <!-- Card de Tonelagem e Impacto -->
      <div class="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-center space-y-1">
        <span class="text-[10px] font-bold uppercase tracking-wider text-[#0066FF]">
          Volume Mecânico Total Levantado
        </span>
        <div class="text-3xl sm:text-4xl font-black text-[#0F172A]">
          {{ tonnageKg.toLocaleString('pt-BR') }} <span class="text-base font-extrabold text-[#64748B]">kg</span>
        </div>
        <p class="text-xs text-[#0066FF] font-bold">
          ⚡ {{ realWorldEquivalence }}
        </p>
      </div>

      <!-- Métricas Rápidas: Séries, XP e Streak -->
      <div class="grid grid-cols-3 gap-2 text-center">
        <div class="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs">
          <span class="block text-[9px] font-bold uppercase text-[#64748B]">Séries</span>
          <span class="text-lg font-black text-[#0F172A]">{{ doneSets }}</span>
        </div>
        <div class="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs">
          <span class="block text-[9px] font-bold uppercase text-[#64748B]">Iron XP</span>
          <span class="text-lg font-black text-[#F59E0B]">+{{ earnedXp }}</span>
        </div>
        <div class="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs">
          <span class="block text-[9px] font-bold uppercase text-[#64748B]">Streak</span>
          <span class="text-lg font-black text-amber-600">🔥 {{ dailyStreak }}d</span>
        </div>
      </div>

      <!-- Conquistas / Badges Desbloqueados -->
      <div v-if="newBadges && newBadges.length > 0" class="p-3.5 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 space-y-2">
        <div class="flex items-center gap-1.5 text-xs font-black text-[#0F172A] uppercase">
          <span>✨</span>
          <span>Nova Conquista Desbloqueada!</span>
        </div>
        <div class="space-y-2">
          <div
            v-for="badge in newBadges"
            :key="badge.id"
            class="flex items-center gap-3 p-2 rounded-xl bg-white border border-[#E2E8F0]"
          >
            <span class="text-2xl">{{ badge.icon }}</span>
            <div class="min-w-0 text-left">
              <h5 class="text-xs font-black text-[#0F172A]">{{ badge.title }}</h5>
              <p class="text-[10px] text-[#64748B] truncate">{{ badge.description }}</p>
            </div>
            <span class="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full bg-[#F59E0B] text-[#0F172A]">
              +{{ badge.xpReward }} XP
            </span>
          </div>
        </div>
      </div>

      <!-- Feedback de Compartilhamento -->
      <div v-if="shareStatusText" class="p-2.5 rounded-xl bg-[#0066FF]/10 border border-[#0066FF]/30 text-center text-xs font-bold text-[#0066FF]">
        {{ shareStatusText }}
      </div>

      <!-- Preview do Story (se gerado) -->
      <div v-if="previewImageUrl" class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-[#64748B]">Prévia do Card (9:16):</span>
          <button
            type="button"
            @click="previewImageUrl = null"
            class="text-[11px] text-rose-500 hover:underline font-bold"
          >
            Fechar prévia
          </button>
        </div>
        <div class="max-w-[200px] mx-auto rounded-2xl overflow-hidden border-2 border-[#0066FF] shadow-lg">
          <img :src="previewImageUrl" alt="Card de Treino Story" class="w-full h-auto object-cover" />
        </div>
      </div>

      <!-- Ações: Compartilhar no Story e Fechar -->
      <div class="space-y-2 pt-1">
        <button
          type="button"
          id="btn-share-story"
          @click="shareStoryCard"
          :disabled="isGeneratingImage"
          class="tap-btn w-full py-3 px-4 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-black text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span aria-hidden="true">{{ isGeneratingImage ? '⏳' : '📸' }}</span>
          <span>{{ isGeneratingImage ? 'Gerando Card 9:16...' : 'Compartilhar no Story / WhatsApp' }}</span>
        </button>

        <button
          type="button"
          id="btn-close-celebration"
          @click="emit('close')"
          class="tap-btn w-full py-2.5 px-4 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-1.5"
        >
          <span>Continuar Evoluindo</span>
          <span>→</span>
        </button>
      </div>

      <!-- Canvas invisível para renderização do card -->
      <canvas ref="storyCanvas" class="hidden" width="1080" height="1920"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  tonnageKg: {
    type: Number,
    default: 0
  },
  doneSets: {
    type: Number,
    default: 0
  },
  earnedXp: {
    type: Number,
    default: 0
  },
  realWorldEquivalence: {
    type: String,
    default: ''
  },
  newBadges: {
    type: Array,
    default: () => []
  },
  dailyStreak: {
    type: Number,
    default: 1
  },
  athleteName: {
    type: String,
    default: 'Atleta'
  },
  patentTitle: {
    type: String,
    default: 'Iniciante do Ferro'
  }
});

const emit = defineEmits(['close']);

const storyCanvas = ref(null);
const isGeneratingImage = ref(false);
const shareStatusText = ref('');
const previewImageUrl = ref(null);

/**
 * Desenha um retângulo com cantos arredondados no canvas 2D
 */
function drawRoundedRect(ctx, x, y, width, height, radius, fillStyle = null, strokeStyle = null, lineWidth = 1) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
  }
}

/**
 * Renderiza o card no canvas de 1080x1920
 */
function renderCardOnCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = 1080;
  const h = 1920;

  // 1. Fundo Gradiente Escuro Cyber / Obsidian
  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  bgGrad.addColorStop(0, '#060911');
  bgGrad.addColorStop(0.3, '#0B132B');
  bgGrad.addColorStop(0.7, '#070C1A');
  bgGrad.addColorStop(1, '#04060C');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Halo / Brilho Radial Central
  const radial = ctx.createRadialGradient(w / 2, 700, 80, w / 2, 700, 650);
  radial.addColorStop(0, 'rgba(0, 102, 255, 0.28)');
  radial.addColorStop(0.5, 'rgba(245, 158, 11, 0.12)');
  radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, w, h);

  // 3. Moldura Externa de Precisão
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 10;
  ctx.strokeRect(36, 36, w - 72, h - 72);

  ctx.strokeStyle = 'rgba(0, 102, 255, 0.4)';
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 48, w - 96, h - 96);

  // 4. Cabeçalho do Card
  ctx.textAlign = 'center';

  // Badge Topo
  drawRoundedRect(ctx, 360, 100, 360, 56, 28, 'rgba(245, 158, 11, 0.15)', '#F59E0B', 2);
  ctx.font = '800 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#F59E0B';
  ctx.fillText('RELATÓRIO DE IMPACTO MECÂNICO', 540, 136);

  // Logo e Título
  ctx.font = '900 78px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('OVERLOAD AI', 540, 240);

  const todayStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText(`SESSÃO DE TREINO • ${todayStr}`, 540, 285);

  // 5. Card do Atleta
  drawRoundedRect(ctx, 90, 330, 900, 170, 28, '#0F172A', '#334155', 2);
  ctx.textAlign = 'left';
  ctx.font = '800 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#38BDF8';
  ctx.fillText('PERFIL DO ATLETA', 130, 375);

  ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(props.athleteName.toUpperCase(), 130, 425);

  ctx.font = '700 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#F59E0B';
  ctx.fillText(`PATENTE: ${props.patentTitle.toUpperCase()}`, 130, 465);

  // Streak no topo direito do card do atleta
  ctx.textAlign = 'right';
  ctx.font = '900 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#F59E0B';
  ctx.fillText(`🔥 ${props.dailyStreak} DIAS`, 950, 425);
  ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('OFENSIVA ATIVA', 950, 460);

  // 6. Bloco Hero: Tonelagem Mecânica Total
  drawRoundedRect(ctx, 90, 530, 900, 450, 36, '#0B1329', '#0066FF', 4);
  ctx.textAlign = 'center';
  ctx.font = '800 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#38BDF8';
  ctx.fillText('VOLUME MECÂNICO TOTAL LEVANTADO', 540, 600);

  ctx.font = '900 110px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#F59E0B';
  ctx.fillText(`${props.tonnageKg.toLocaleString('pt-BR')} kg`, 540, 740);

  if (props.realWorldEquivalence) {
    drawRoundedRect(ctx, 140, 810, 800, 110, 24, 'rgba(0, 102, 255, 0.18)', '#0066FF', 2);
    ctx.font = '800 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`⚡ Equivale a levantar:`, 540, 855);
    ctx.font = '900 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#38BDF8';
    ctx.fillText(props.realWorldEquivalence, 540, 895);
  }

  // 7. Grid de Métricas Principais (3 Colunas)
  const colY = 1010;
  const colW = 280;
  const colH = 200;

  // Coluna 1: Séries Válidas
  drawRoundedRect(ctx, 90, colY, colW, colH, 24, '#0F172A', '#334155', 2);
  ctx.textAlign = 'center';
  ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('SÉRIES VÁLIDAS', 90 + colW / 2, colY + 55);
  ctx.font = '900 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(String(props.doneSets), 90 + colW / 2, colY + 130);

  // Coluna 2: Iron XP Ganho
  drawRoundedRect(ctx, 400, colY, colW, colH, 24, '#0F172A', '#334155', 2);
  ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('IRON XP GANHO', 400 + colW / 2, colY + 55);
  ctx.font = '900 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#F59E0B';
  ctx.fillText(`+${props.earnedXp}`, 400 + colW / 2, colY + 130);

  // Coluna 3: Sequência Diária
  drawRoundedRect(ctx, 710, colY, colW, colH, 24, '#0F172A', '#334155', 2);
  ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('DIAS DE STREAK', 710 + colW / 2, colY + 55);
  ctx.font = '900 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#38BDF8';
  ctx.fillText(`🔥 ${props.dailyStreak}`, 710 + colW / 2, colY + 130);

  // 8. Badges / Conquistas Desbloqueadas (se houver)
  if (props.newBadges && props.newBadges.length > 0) {
    drawRoundedRect(ctx, 90, 1240, 900, 240, 28, 'rgba(245, 158, 11, 0.12)', '#F59E0B', 2);
    ctx.textAlign = 'center';
    ctx.font = '800 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#F59E0B';
    ctx.fillText('✨ NOVAS CONQUISTAS DESBLOQUEADAS', 540, 1290);

    let badgeY = 1350;
    for (const b of props.newBadges.slice(0, 2)) {
      ctx.textAlign = 'left';
      ctx.font = '900 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`${b.icon || '🏆'} ${b.title}`, 140, badgeY);
      ctx.textAlign = 'right';
      ctx.font = '800 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#F59E0B';
      ctx.fillText(`+${b.xpReward || 0} XP`, 940, badgeY);
      badgeY += 45;
    }
  } else {
    // Frase Motivacional de Impacto
    drawRoundedRect(ctx, 90, 1240, 900, 190, 28, '#0F172A', '#1E293B', 2);
    ctx.textAlign = 'center';
    ctx.font = '800 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#F8FAFC';
    ctx.fillText('"Constância supera talento.', 540, 1315);
    ctx.fillText('O ferro nunca mente."', 540, 1365);
  }

  // 9. Rodapé / Branding
  ctx.textAlign = 'center';
  ctx.font = '800 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#0066FF';
  ctx.fillText('OVERLOAD AI', 540, 1740);

  ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('Treino & Dieta com Inteligência Artificial • PWA', 540, 1780);

  ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#F59E0B';
  ctx.fillText('treino.gabrielpsn.workers.dev', 540, 1820);
}

/**
 * Dispara o fluxo de compartilhamento do Story via Web Share API ou download
 */
async function shareStoryCard() {
  if (isGeneratingImage.value) return;
  isGeneratingImage.value = true;
  shareStatusText.value = 'Gerando card 9:16...';

  try {
    const canvas = storyCanvas.value || document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;

    renderCardOnCanvas(canvas);

    // Converte para Blob PNG
    const blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/png');
    });

    if (!blob) {
      throw new Error('Falha ao gerar imagem do canvas');
    }

    const filename = `treino-overload-ai-${Date.now()}.png`;
    const file = new File([blob], filename, { type: 'image/png' });
    const url = URL.createObjectURL(blob);
    previewImageUrl.value = url;

    // Tenta Web Share API nativa (mobile)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      shareStatusText.value = 'Abrindo menu de compartilhamento...';
      await navigator.share({
        title: 'Meu Treino no Overload AI',
        text: `Treino concluído hoje no Overload AI! Volume: ${props.tonnageKg.toLocaleString('pt-BR')} kg erguidos. 🔥`,
        files: [file]
      });
      shareStatusText.value = 'Compartilhado com sucesso!';
    } else {
      // Fallback: download automático
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      shareStatusText.value = 'Card baixado com sucesso! Pronto para postar.';
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('Falha ao compartilhar card:', err);
      shareStatusText.value = 'Não foi possível compartilhar direto. Baixando imagem...';
      // Tenta fallback de download se canvas renderizou
      try {
        const canvas = storyCanvas.value;
        if (canvas) {
          const fallbackUrl = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = fallbackUrl;
          a.download = `treino-overload-ai.png`;
          a.click();
          shareStatusText.value = 'Card baixado com sucesso!';
        }
      } catch (e) {
        shareStatusText.value = 'Erro ao processar imagem.';
      }
    } else {
      shareStatusText.value = '';
    }
  } finally {
    isGeneratingImage.value = false;
  }
}
</script>
