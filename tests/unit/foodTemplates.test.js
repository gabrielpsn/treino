import { describe, it, expect } from 'vitest';
import {
  DIETARY_PREFERENCES,
  MEAL_TEMPLATES,
  WEIGHT_LOSS_MEAL_TEMPLATES
} from '../../src/engine/knowledge/foodTemplates.js';

describe('foodTemplates — DIETARY_PREFERENCES', () => {
  it('contém as opções esperadas de estilo de dieta', () => {
    const ids = DIETARY_PREFERENCES.map(d => d.id);
    expect(ids).toEqual(['omnivore', 'vegetarian', 'vegan', 'lactose_free', 'low_carb']);
  });

  it('cada preferência possui label, ícone e descrição legível', () => {
    for (const diet of DIETARY_PREFERENCES) {
      expect(diet.id).toBeTruthy();
      expect(diet.label).toBeTruthy();
      expect(diet.icon).toBeTruthy();
      expect(diet.desc).toBeTruthy();
    }
  });
});

describe('foodTemplates — MEAL_TEMPLATES', () => {
  it('onívoro inclui ovos, carnes e proporções proporcionais ao ratio', () => {
    const breakfast = MEAL_TEMPLATES[0].buildText(1, 5, 'omnivore');
    const lunch = MEAL_TEMPLATES[1].buildText(1, 5, 'omnivore');
    expect(breakfast).toContain('ovos inteiros mexidos');
    expect(lunch).toContain('frango, carne magra ou peixe');
    expect(lunch).toContain('5g de CREATINA');
  });

  it('vegano substitui ovos e carnes por tofu, leguminosas e vegetais', () => {
    const breakfast = MEAL_TEMPLATES[0].buildText(1, 5, 'vegan');
    const lunch = MEAL_TEMPLATES[1].buildText(1, 5, 'vegan');
    const dinner = MEAL_TEMPLATES[3].buildText(1, 5, 'vegan');
    const supper = MEAL_TEMPLATES[4].buildText(1, 5, 'vegan');

    expect(breakfast.toLowerCase()).toContain('tofu');
    expect(lunch.toLowerCase()).toMatch(/tofu|proteína vegetal/);
    expect(dinner.toLowerCase()).toMatch(/grão-de-bico|tofu/);
    expect(supper.toLowerCase()).toContain('leite vegetal');
  });

  it('vegetariano não possui carne vermelha ou frango', () => {
    const lunch = MEAL_TEMPLATES[1].buildText(1, 5, 'vegetarian');
    expect(lunch.toLowerCase()).not.toContain('frango');
    expect(lunch.toLowerCase()).not.toContain('patinho');
    expect(lunch.toLowerCase()).toMatch(/tofu|ovos/);
  });

  it('low carb reduz carboidratos e prioriza saladas e gorduras boas', () => {
    const breakfast = MEAL_TEMPLATES[0].buildText(1, 5, 'low_carb');
    const lunch = MEAL_TEMPLATES[1].buildText(1, 5, 'low_carb');

    expect(breakfast.toLowerCase()).toMatch(/abacate|queijo/);
    expect(lunch.toLowerCase()).toMatch(/brócolis|couve-flor/);
  });
});

describe('foodTemplates — WEIGHT_LOSS_MEAL_TEMPLATES', () => {
  it('cardápio de déficit adapta texto para vegano', () => {
    const bfast = WEIGHT_LOSS_MEAL_TEMPLATES[0].buildText(1, 3, 'vegan');
    const lunch = WEIGHT_LOSS_MEAL_TEMPLATES[1].buildText(1, 3, 'vegan');

    expect(bfast.toLowerCase()).toContain('tofu');
    expect(lunch.toLowerCase()).toMatch(/tofu|grão-de-bico/);
  });

  it('cardápio de déficit adapta texto para low carb', () => {
    const bfast = WEIGHT_LOSS_MEAL_TEMPLATES[0].buildText(1, 3, 'low_carb');
    expect(bfast.toLowerCase()).toMatch(/espinafre|abacate/);
  });
});
