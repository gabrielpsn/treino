/**
 * Utilitários leves de Feedback Tátil e Sonoro sintetizado (Web Audio API).
 *
 * Não requer download de arquivos de áudio externos (.mp3/.wav):
 * sintetiza frequências curtas em tempo de execução com zero impacto na rede.
 */

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Som metálico sutil de encaixe de anilha / trava de série.
 */
export function playPlateClick() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    // Silêncio gracioso se o navegador bloquear áudio
  }
}

/**
 * Efeito sonoro triunfante para quebra de Recorde Pessoal (PR).
 */
export function playPrFanfare() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startTime = ctx.currentTime + idx * 0.06;
      const duration = 0.18;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } catch {
    // Silêncio gracioso
  }
}

/**
 * Feedback tátil suave para dispositivos móveis via Vibration API.
 */
export function triggerHaptic(type = 'click') {
  if (typeof window === 'undefined' || !('navigator' in window) || !navigator.vibrate) return;

  try {
    if (type === 'pr') {
      navigator.vibrate([25, 30, 45, 30, 60]);
    } else if (type === 'celebrate') {
      navigator.vibrate([40, 50, 40, 60, 80]);
    } else {
      navigator.vibrate([16, 25, 18]);
    }
  } catch {
    // Falha silenciosa
  }
}

/**
 * Treinador de Voz AI (Web Speech API nativa em pt-BR).
 * Fornece feedbacks de voz motivacionais durante a execução do treino.
 */
const VOICE_PREF_KEY = 'treinopro_voice_coach_enabled';
let isVoiceCoachEnabled = true;

if (typeof window !== 'undefined' && window.localStorage) {
  const stored = window.localStorage.getItem(VOICE_PREF_KEY);
  if (stored !== null) {
    isVoiceCoachEnabled = stored === 'true';
  }
}

export function isVoiceSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function getVoiceCoachEnabled() {
  return isVoiceCoachEnabled;
}

export function setVoiceCoachEnabled(enabled) {
  isVoiceCoachEnabled = !!enabled;
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(VOICE_PREF_KEY, String(isVoiceCoachEnabled));
  }
}

const COACH_PHRASES = {
  start: [
    'Modo treino ativado! Foco total na sobrecarga.',
    'Vamos com tudo! Cada repetição constrói sua força.',
    'Sessão iniciada. Amplitude máxima e controle na descida.'
  ],
  set_done: [
    'Excelente série! Descanse e respire fundo.',
    'Boa! Mais uma série na conta.',
    'Série concluída! Mantenha a intensidade.',
    'Perfeito! Recuperação iniciada.'
  ],
  pr: [
    'Incrível! Novo recorde pessoal batido! O ferro nunca mente.',
    'Sensacional! Você superou sua melhor marca histórica!',
    'Novo PR na conta! Sobrecarga progressiva em ação!'
  ],
  warning_10s: [
    'Faltam 10 segundos! Prepare-se para a barra.',
    'Atenção! Dez segundos para a próxima série.',
    'Bora para a barra! Dez segundos.'
  ],
  finish: [
    'Treino concluído com maestria! O crescimento está garantido.',
    'Missão cumprida! Excelente intensidade hoje. Bom descanso!',
    'Treino finalizado com sucesso! Parabéns pela consistência.'
  ]
};

export function speakCoachMessage(type = 'set_done', customText = null) {
  if (!isVoiceCoachEnabled) return;
  if (!isVoiceSupported()) return;

  try {
    const list = COACH_PHRASES[type] || COACH_PHRASES.set_done;
    const textToSpeak = customText || list[Math.floor(Math.random() * list.length)];
    if (!textToSpeak) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang && (v.lang.startsWith('pt') || v.lang.startsWith('pt_')));
    if (ptVoice) utterance.voice = ptVoice;

    window.speechSynthesis.speak(utterance);
  } catch {
    // Falha silenciosa
  }
}
