import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateStrideLength,
  stepsToKilometers,
  kilometersToSteps,
  estimateWalkingCalories,
  calculateHaversineDistanceKm,
  createStepDetector,
  loadDailyWalkingData,
  saveDailyWalkingData,
  DEFAULT_WALKING_GOAL_STEPS
} from '../../src/engine/walkingTracker';

describe('walkingTracker Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Cálculos Antropométricos e Distância', () => {
    it('calcula o comprimento da passada baseado na altura', () => {
      // 170cm * 0.414 / 100 = ~0.704m
      const stride170 = calculateStrideLength(170);
      expect(stride170).toBeCloseTo(0.704, 3);

      // 185cm
      const stride185 = calculateStrideLength(185);
      expect(stride185).toBeCloseTo(0.766, 3);

      // Fallback para valores inválidos ou zerados
      expect(calculateStrideLength(0)).toBeCloseTo(0.704, 3);
      expect(calculateStrideLength(null)).toBeCloseTo(0.704, 3);
    });

    it('converte passos em quilômetros com precisão', () => {
      // 10.000 passos para altura de 170cm (0.704m por passo) = 7.04 km
      const km = stepsToKilometers(10000, 170);
      expect(km).toBe(7.04);

      // 0 passos
      expect(stepsToKilometers(0, 170)).toBe(0);
      // Valores negativos
      expect(stepsToKilometers(-50, 170)).toBe(0);
    });

    it('converte quilômetros em passos estimados', () => {
      // 7.04 km com passo de 0.704m ~= 10.000 passos
      const steps = kilometersToSteps(7.04, 170);
      expect(steps).toBe(10000);
      expect(kilometersToSteps(0, 170)).toBe(0);
    });

    it('estima o gasto calórico baseado no peso corporal e distância', () => {
      // 10.000 passos (7.04 km) para uma pessoa de 70kg: 70 * 0.57 * 7.04 = ~281 kcal
      const kcal = estimateWalkingCalories(10000, 70, 170);
      expect(kcal).toBeGreaterThan(250);
      expect(kcal).toBeLessThan(320);

      // Fallback se peso não for informado
      expect(estimateWalkingCalories(5000, 0, 170)).toBeGreaterThan(0);
    });

    it('calcula a distância Haversine entre coordenadas geográficas', () => {
      // Distância entre Obelisco de SP (-23.5854, -46.6579) e MASP (-23.5614, -46.6559) é ~2.67 km
      const dist = calculateHaversineDistanceKm(-23.5854, -46.6579, -23.5614, -46.6559);
      expect(dist).toBeGreaterThan(2.5);
      expect(dist).toBeLessThan(2.9);

      // Coordenadas idênticas
      expect(calculateHaversineDistanceKm(-23.5, -46.6, -23.5, -46.6)).toBe(0);

      // Coordenadas inválidas
      expect(calculateHaversineDistanceKm(null, 0, 10, 20)).toBe(0);
    });
  });

  describe('Detector de Passos (Pedometer)', () => {
    it('detecta passos a partir de picos de aceleração e respeita debounce', () => {
      const steps = [];
      const detector = createStepDetector({
        onStep: step => steps.push(step),
        minThreshold: 1.5,
        minIntervalMs: 250
      });

      let timestamp = 1000;

      // Movimento estático em repouso (gravidade constante ~9.8m/s²)
      detector.processAcceleration(0, 0, 9.8, timestamp);
      expect(steps).toHaveLength(0);

      // Passo 1: Pico de impacto (ex: aceleração salta para 13 m/s²)
      timestamp += 300;
      const detected1 = detector.processAcceleration(2, 3, 12.5, timestamp);
      expect(detected1).toBe(true);
      expect(steps).toHaveLength(1);
      expect(steps[0].stepNumber).toBe(1);

      // Vibração rápida / tremor antes de 250ms deve ser ignorada
      timestamp += 100;
      const falsePositive = detector.processAcceleration(3, 4, 13.0, timestamp);
      expect(falsePositive).toBe(false);
      expect(steps).toHaveLength(1);

      // Passo 2: Segundo passo após intervalo normal de caminhada
      timestamp += 350;
      const detected2 = detector.processAcceleration(1.5, 2.8, 12.8, timestamp);
      expect(detected2).toBe(true);
      expect(steps).toHaveLength(2);
      expect(steps[1].stepNumber).toBe(2);
      expect(detector.getStepsCount()).toBe(2);

      // Reset
      detector.reset();
      expect(detector.getStepsCount()).toBe(0);
    });
  });

  describe('Persistência Local Diária', () => {
    it('carrega valores padrão quando não há registro prévio', () => {
      const data = loadDailyWalkingData('2026-11-09');
      expect(data.date).toBe('2026-11-09');
      expect(data.steps).toBe(0);
      expect(data.distanceKm).toBe(0);
      expect(data.goalSteps).toBe(DEFAULT_WALKING_GOAL_STEPS);
    });

    it('salva e recupera dados diários com sucesso', () => {
      saveDailyWalkingData('2026-11-09', {
        steps: 6420,
        distanceKm: 4.52,
        caloriesKcal: 256,
        activeMinutes: 45,
        goalSteps: 8000
      });

      const loaded = loadDailyWalkingData('2026-11-09');
      expect(loaded.steps).toBe(6420);
      expect(loaded.distanceKm).toBe(4.52);
      expect(loaded.caloriesKcal).toBe(256);
      expect(loaded.activeMinutes).toBe(45);
      expect(loaded.goalSteps).toBe(8000);
    });
  });
});
