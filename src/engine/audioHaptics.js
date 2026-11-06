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
