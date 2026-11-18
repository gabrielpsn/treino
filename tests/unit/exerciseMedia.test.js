import { describe, it, expect } from 'vitest';
import { youtubeSearchUrl, normalizeVideoUrl, saveExerciseVideo, loadExerciseVideos } from '../../src/engine/exerciseMedia.js';

describe('exerciseMedia', () => {
  it('monta a busca no YouTube', () => {
    expect(youtubeSearchUrl('Supino Reto')).toBe('https://www.youtube.com/results?search_query=Supino%20Reto%20execu%C3%A7%C3%A3o%20correta');
  });

  it('aceita só https de plataformas de vídeo', () => {
    expect(normalizeVideoUrl('https://youtu.be/abc').ok).toBe(true);
    expect(normalizeVideoUrl('').value).toBe('');
    expect(normalizeVideoUrl('http://youtu.be/abc').ok).toBe(false);
    expect(normalizeVideoUrl('https://site-estranho.com/v').ok).toBe(false);
    expect(normalizeVideoUrl('javascript:alert(1)').ok).toBe(false);
  });

  it('salva e remove link por exercício', () => {
    saveExerciseVideo('supino', 'https://youtu.be/abc');
    expect(loadExerciseVideos().supino).toBe('https://youtu.be/abc');
    saveExerciseVideo('supino', '');
    expect(loadExerciseVideos().supino).toBeUndefined();
  });
});
