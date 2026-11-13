import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  FEEDBACK_CATEGORIES,
  QUICK_TAGS,
  getStoredFeedbacks,
  submitAppFeedback,
  getFeedbackStats,
  generateWhatsAppFeedbackUrl
} from '../../src/db/feedback.js';

describe('Sistema de Feedback e Avaliação', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('possui categorias e tags rápidas estruturadas', () => {
    expect(FEEDBACK_CATEGORIES.length).toBeGreaterThanOrEqual(5);
    expect(FEEDBACK_CATEGORIES.some(c => c.id === 'treino')).toBe(true);
    expect(FEEDBACK_CATEGORIES.some(c => c.id === 'ia')).toBe(true);
    expect(QUICK_TAGS.length).toBeGreaterThanOrEqual(6);
  });

  it('salva o feedback no localStorage e calcula ID único', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, feedbackId: 'fb-server-123' })
    });
    vi.stubGlobal('fetch', fetchMock);

    const feedback = await submitAppFeedback({
      rating: 5,
      category: 'treinos',
      tags: ['Sinergia Perfeita', 'Intuitivo'],
      comment: 'O app é incrível e os treinos são muito completos!',
      userName: 'Gabriel',
      contact: 'gabriel@exemplo.com'
    });

    expect(feedback.rating).toBe(5);
    expect(feedback.category).toBe('treinos');
    expect(feedback.userName).toBe('Gabriel');
    expect(feedback.comment).toContain('incrível');
    expect(feedback.id).toBeDefined();

    const stored = getStoredFeedbacks();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(feedback.id);
    expect(fetchMock).toHaveBeenCalled();
  });

  it('funciona offline com resiliência sem travar se o fetch falhar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const feedback = await submitAppFeedback({
      rating: 4,
      category: 'ia',
      comment: 'Gostei muito da geração automática de fichas.',
      userName: 'Carlos'
    });

    expect(feedback.rating).toBe(4);
    const stored = getStoredFeedbacks();
    expect(stored).toHaveLength(1);
    expect(stored[0].rating).toBe(4);
  });

  it('calcula estatísticas consolidadas da comunidade corretamente', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) }));

    await submitAppFeedback({ rating: 5, category: 'elogio', comment: 'Excelente' });
    await submitAppFeedback({ rating: 4, category: 'treinos', comment: 'Muito bom' });
    await submitAppFeedback({ rating: 5, category: 'ia', comment: 'Top' });

    const stats = getFeedbackStats();
    expect(stats.count).toBe(3);
    // (5 + 4 + 5) / 3 = 14 / 3 = 4.7
    expect(stats.average).toBe(4.7);
    expect(stats.breakdown[5]).toBe(2);
    expect(stats.breakdown[4]).toBe(1);
    expect(stats.breakdown[3]).toBe(0);
  });

  it('gera URL de compartilhamento direto via WhatsApp para o número oficial', () => {
    const url = generateWhatsAppFeedbackUrl({
      rating: 5,
      category: 'treino',
      tags: ['Excelente', 'Interface Limpa'],
      comment: 'Adorei a divisão Push Pull Legs!',
      userName: 'Gabriel'
    });

    expect(url).toContain('https://wa.me/5581997758849');
    expect(url).toContain(encodeURIComponent('5/5'));
    expect(url).toContain(encodeURIComponent('Gabriel'));
  });
});
