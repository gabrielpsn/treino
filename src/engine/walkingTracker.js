/**
 * Motor de rastreamento de caminhada, pedômetro por acelerômetro e cálculo de km/passos diários.
 *
 * Funciona offline-first com persistência em localStorage e integração com sensores de movimento
 * (DeviceMotionEvent) e GPS (Geolocation API).
 */

export const DEFAULT_WALKING_GOAL_STEPS = 8000;

/**
 * Calcula o comprimento médio do passo (stride length) em metros baseado na altura.
 * A proporção média antropométrica é de ~0.414 * altura (em metros).
 */
export function calculateStrideLength(heightCm) {
  const h = Number(heightCm);
  const validHeight = Number.isFinite(h) && h >= 100 && h <= 250 ? h : 170;
  return Math.round(((validHeight * 0.414) / 100) * 1000) / 1000; // metros, ex: 0.704m
}

/**
 * Converte quantidade de passos em quilômetros com base na altura.
 */
export function stepsToKilometers(steps, heightCm) {
  const s = Math.max(0, Number(steps) || 0);
  const strideM = calculateStrideLength(heightCm);
  const km = (s * strideM) / 1000;
  return Math.round(km * 100) / 100;
}

/**
 * Converte quilômetros em passos estimados.
 */
export function kilometersToSteps(km, heightCm) {
  const k = Math.max(0, Number(km) || 0);
  const strideM = calculateStrideLength(heightCm);
  if (strideM <= 0) return 0;
  return Math.round((k * 1000) / strideM);
}

/**
 * Estima calorias queimadas na caminhada baseado em passos e peso corporal.
 * Referência: ~0.57 kcal por kg por quilômetro percorrido em caminhada moderada.
 */
export function estimateWalkingCalories(steps, weightKg, heightCm) {
  const s = Math.max(0, Number(steps) || 0);
  const w = Number(weightKg);
  const validWeight = Number.isFinite(w) && w >= 30 && w <= 250 ? w : 70;
  const km = stepsToKilometers(s, heightCm);
  return Math.round(validWeight * 0.57 * km);
}

/**
 * Distância Haversine entre duas coordenadas geográficas em quilômetros.
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    return 0;
  }

  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 1000) / 1000; // km com 3 casas
}

/**
 * Cria um detector de passos a partir de dados brutos de aceleração (acelerômetro).
 * Aplica filtro passa-altas adaptativo e debounce para evitar falsos positivos de vibração.
 */
export function createStepDetector({
  onStep = () => {},
  minThreshold = 1.8,
  minIntervalMs = 280
} = {}) {
  let gravityBaseline = 9.8;
  const alpha = 0.85;
  let lastStepTime = 0;
  let stepsCount = 0;

  function processAcceleration(x, y, z, timestamp = Date.now()) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      return false;
    }

    const currentMagnitude = Math.sqrt(x * x + y * y + z * z);
    // Filtro passa-baixas para estimar linha de base da gravidade
    gravityBaseline = alpha * gravityBaseline + (1 - alpha) * currentMagnitude;
    // Magnitude dinâmica sem a gravidade constante
    const delta = Math.abs(currentMagnitude - gravityBaseline);

    if (delta >= minThreshold && timestamp - lastStepTime >= minIntervalMs) {
      lastStepTime = timestamp;
      stepsCount += 1;
      onStep({
        stepNumber: stepsCount,
        magnitude: currentMagnitude,
        delta,
        timestamp
      });
      return true;
    }

    return false;
  }

  function reset() {
    stepsCount = 0;
    lastStepTime = 0;
    gravityBaseline = 9.8;
  }

  return {
    processAcceleration,
    getStepsCount: () => stepsCount,
    reset
  };
}

/**
 * Retorna se o dispositivo suporta DeviceMotionEvent.
 */
export function isDeviceMotionSupported() {
  return typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
}

/**
 * Solicita permissão para sensores de movimento (necessário no Safari / iOS 13+).
 */
export async function requestDeviceMotionPermission() {
  if (typeof window === 'undefined' || !window.DeviceMotionEvent) {
    return false;
  }
  if (typeof window.DeviceMotionEvent.requestPermission === 'function') {
    try {
      const response = await window.DeviceMotionEvent.requestPermission();
      return response === 'granted';
    } catch {
      return false;
    }
  }
  // Android e navegadores onde a permissão é padrão
  return true;
}

/**
 * Retorna se Geolocation é suportado.
 */
export function isGeolocationSupported() {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

/**
 * Chave de armazenamento diário.
 */
export function getDailyWalkingStorageKey(dateStr) {
  const date = dateStr || new Date().toISOString().slice(0, 10);
  return `treinopro_walking_${date}`;
}

/**
 * Carrega os dados de caminhada da data especificada.
 */
export function loadDailyWalkingData(dateStr) {
  const date = dateStr || new Date().toISOString().slice(0, 10);
  const defaultData = {
    date,
    steps: 0,
    distanceKm: 0,
    caloriesKcal: 0,
    activeMinutes: 0,
    goalSteps: DEFAULT_WALKING_GOAL_STEPS
  };

  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultData;
  }

  try {
    const raw = window.localStorage.getItem(getDailyWalkingStorageKey(date));
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw);
    return {
      date,
      steps: Math.max(0, Number(parsed.steps) || 0),
      distanceKm: Math.max(0, Number(parsed.distanceKm) || 0),
      caloriesKcal: Math.max(0, Number(parsed.caloriesKcal) || 0),
      activeMinutes: Math.max(0, Number(parsed.activeMinutes) || 0),
      goalSteps: Math.max(1000, Number(parsed.goalSteps) || DEFAULT_WALKING_GOAL_STEPS)
    };
  } catch {
    return defaultData;
  }
}

/**
 * Salva os dados de caminhada da data especificada.
 */
export function saveDailyWalkingData(dateStr, data) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const date = dateStr || new Date().toISOString().slice(0, 10);
  try {
    window.localStorage.setItem(
      getDailyWalkingStorageKey(date),
      JSON.stringify({
        date,
        steps: Math.max(0, Number(data?.steps) || 0),
        distanceKm: Math.max(0, Number(data?.distanceKm) || 0),
        caloriesKcal: Math.max(0, Number(data?.caloriesKcal) || 0),
        activeMinutes: Math.max(0, Number(data?.activeMinutes) || 0),
        goalSteps: Math.max(1000, Number(data?.goalSteps) || DEFAULT_WALKING_GOAL_STEPS)
      })
    );
  } catch (err) {
    console.error('Erro ao salvar dados de caminhada:', err);
  }
}
