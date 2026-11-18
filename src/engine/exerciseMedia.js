/**
 * Vídeos de execução: busca no YouTube pelo nome do exercício e links
 * próprios por exercício (definidos pelo usuário ou enviados pelo personal).
 */

const ALLOWED_VIDEO_HOSTS = [
  'youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be',
  'vimeo.com', 'player.vimeo.com',
  'instagram.com', 'www.instagram.com',
  'tiktok.com', 'www.tiktok.com', 'vm.tiktok.com',
  'drive.google.com'
];

export function youtubeSearchUrl(exerciseName) {
  const query = `${String(exerciseName ?? '').trim()} execução correta`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

/**
 * Aceita só https de plataformas de vídeo conhecidas: o link vira um botão
 * clicável no app, e um domínio qualquer poderia levar para phishing.
 */
export function normalizeVideoUrl(value) {
  const text = String(value ?? '').trim();
  if (!text) return { ok: true, value: '' };
  let url;
  try {
    url = new URL(text);
  } catch {
    return { ok: false, error: 'Cole um link completo (começando com https://).' };
  }
  if (url.protocol !== 'https:') return { ok: false, error: 'Use um link https.' };
  if (!ALLOWED_VIDEO_HOSTS.includes(url.hostname.toLowerCase())) {
    return { ok: false, error: 'Aceitamos links do YouTube, Vimeo, Instagram, TikTok ou Google Drive.' };
  }
  return { ok: true, value: url.toString() };
}

export const EXERCISE_VIDEO_KEY = 'overload_exercise_videos';

export function loadExerciseVideos() {
  try {
    const raw = window.localStorage.getItem(EXERCISE_VIDEO_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveExerciseVideo(exerciseId, url) {
  const all = loadExerciseVideos();
  if (url) all[exerciseId] = url;
  else delete all[exerciseId];
  try {
    window.localStorage.setItem(EXERCISE_VIDEO_KEY, JSON.stringify(all));
  } catch {
    // ignora
  }
  return all;
}
