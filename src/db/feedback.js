/**
 * Gerenciamento e persistência de avaliações e feedbacks dos usuários do Overload AI.
 * 
 * Permite avaliação por estrelas (1 a 5), categoria, tags rápidas e comentários,
 * com envio online via Worker (/api/feedback), fallback offline em localStorage
 * e geração de link para compartilhamento direto via WhatsApp ou e-mail.
 */

export const FEEDBACK_STORAGE_KEY = 'overload_ai_user_feedbacks';

export const FEEDBACK_CATEGORIES = [
  { id: 'sugestao', label: '💡 Sugestão', desc: 'Ideia para melhorar o app' },
  { id: 'treino', label: '🏋️ Treinos & Fichas', desc: 'Exercícios, séries e divisões' },
  { id: 'ia', label: '🤖 Inteligência Artificial', desc: 'Geração e recomendações' },
  { id: 'dieta', label: '🥗 Dieta & Nutrição', desc: 'Cardápios e macros' },
  { id: 'bug', label: '🐛 Reportar Bug', desc: 'Algo não funcionou como esperado' },
  { id: 'elogio', label: '❤️ Elogio', desc: 'O que você mais gostou' }
];

export const QUICK_TAGS = [
  'IA muito precisa',
  'Gostei da gamificação e XP',
  'Fácil e rápido de usar',
  'Design moderno e fluido',
  'Falta algum exercício específico',
  'Ajustar timer de descanso',
  'Adicionar mais opções de dieta',
  'Melhorar no celular'
];

/**
 * Obtém todos os feedbacks armazenados no dispositivo
 */
export function getStoredFeedbacks() {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(FEEDBACK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Erro ao ler feedbacks locais:', err);
    return [];
  }
}

/**
 * Salva uma nova avaliação no dispositivo e tenta enviar à API da Cloudflare
 */
export async function submitAppFeedback(data, { fetchImpl = fetch } = {}) {
  const now = new Date();
  const feedbackItem = {
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    rating: Math.min(5, Math.max(1, Number(data.rating) || 5)),
    category: String(data.category || 'sugestao'),
    tags: Array.isArray(data.tags) ? [...data.tags] : [],
    comment: String(data.comment || '').trim(),
    userName: String(data.userName || 'Atleta').trim(),
    contact: String(data.contact || '').trim(),
    appVersion: '2.2',
    createdAt: now.toISOString(),
    formattedDate: now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    syncedWithServer: false
  };

  // Salva no armazenamento local primeiro (resiliência offline)
  try {
    const currentList = getStoredFeedbacks();
    currentList.unshift(feedbackItem);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(currentList));
    }
  } catch (err) {
    console.warn('Não foi possível gravar feedback no localStorage:', err);
  }

  // Tenta sincronizar com o backend Cloudflare Workers (/api/feedback)
  if (typeof fetchImpl === 'function') {
    try {
      const response = await fetchImpl('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(feedbackItem)
      });
      if (response && response.ok) {
        feedbackItem.syncedWithServer = true;
        // Atualiza marcação de sincronizado
        try {
          const currentList = getStoredFeedbacks();
          const found = currentList.find(f => f.id === feedbackItem.id);
          if (found) {
            found.syncedWithServer = true;
            window.localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(currentList));
          }
        } catch (_) {}
      }
    } catch (err) {
      console.warn('Envio do feedback ao servidor pendente (salvo localmente):', err);
    }
  }

  return feedbackItem;
}

/**
 * Estatísticas resumidas das avaliações
 */
export function getFeedbackStats(feedbacks = getStoredFeedbacks()) {
  const baseCount = feedbacks.length;
  if (baseCount === 0) {
    return {
      average: 5.0,
      count: 0,
      breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }

  const sum = feedbacks.reduce((acc, f) => acc + (Number(f.rating) || 5), 0);
  const average = Number((sum / baseCount).toFixed(1));

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  feedbacks.forEach(f => {
    const r = Math.min(5, Math.max(1, Math.round(Number(f.rating) || 5)));
    breakdown[r] = (breakdown[r] || 0) + 1;
  });

  return { average, count: baseCount, breakdown };
}

/**
 * Gera URL de compartilhamento via WhatsApp
 */
export function generateWhatsAppFeedbackUrl(feedback, phoneNumber = '') {
  const starsText = '⭐'.repeat(feedback.rating || 5);
  const lines = [
    `*Avaliação do Overload AI* 📱`,
    `Nota: ${starsText} (${feedback.rating || 5}/5)`,
    feedback.category ? `Categoria: ${feedback.category}` : '',
    feedback.tags?.length ? `Destaques: ${feedback.tags.join(', ')}` : '',
    feedback.comment ? `\n*Comentário:*\n"${feedback.comment}"` : '',
    `\nAtleta: ${feedback.userName || 'Atleta'}`,
    `App: Overload AI v${feedback.appVersion || '2.2'}`
  ].filter(Boolean);

  const text = encodeURIComponent(lines.join('\n'));
  const phone = phoneNumber ? phoneNumber.replace(/\D/g, '') : '';
  return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
}
