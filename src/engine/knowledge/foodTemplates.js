/**
 * Modelos de refeições ricas em nutrientes, adaptáveis proporcionalmente às calorias e macros
 */

export const MEAL_TEMPLATES = [
  {
    order: 1,
    title: '1. Café da Manhã Energético',
    tag: 'Desjejum Anabólico',
    description: 'Quebra de jejum com proteínas de alto valor biológico e carboidratos complexos.',
    basePortions: {
      eggs: 3, // ovos
      breadSlices: 2, // fatias pão integral
      fruitGrams: 120 // banana ou mamão
    },
    buildText: (ratio = 1) => {
      const eggs = Math.round(3 * ratio);
      const fruit = Math.round(120 * ratio);
      return `${Math.max(2, eggs)} ovos inteiros mexidos/cozidos + 2 fatias de pão integral (ou ${Math.round(120 * ratio)}g de cuscuz/mandioca) + ${fruit}g de fruta (banana/mamão).`;
    }
  },
  {
    order: 2,
    title: '2. Almoço Construtor',
    tag: 'Pico Anabólico & Creatina',
    description: 'Refeição principal de alta densidade nutricional, micronutrientes e absorção de creatina.',
    basePortions: {
      proteinGrams: 160,
      carbGrams: 200,
      beansGrams: 100
    },
    buildText: (ratio = 1, creatinaGrams = 5) => {
      const meat = Math.round(160 * ratio);
      const rice = Math.round(200 * ratio);
      return `${meat}g de frango, carne magra ou peixe + ${rice}g de arroz branco/integral + 1 concha de feijão (100g) + salada de folhas verdes com azeite de oliva extra virgem. + ${creatinaGrams}g de CREATINA monohidratada.`;
    }
  },
  {
    order: 3,
    title: '3. Pré-Treino Natural (45-60m antes)',
    tag: 'Energia & Foco',
    description: 'Glicogênio rápido de fácil digestão gastrointestinal com cafeína para foco neuromuscular.',
    basePortions: {
      oatsGrams: 30,
      honeyGrams: 15
    },
    buildText: (ratio = 1) => {
      const oats = Math.round(30 * ratio);
      return `1 banana média amassada com ${oats}g de aveia em flocos e 1 colher de mel + 1 xícara (150ml) de café preto puro sem açúcar (cafeína pré-treino).`;
    }
  },
  {
    order: 4,
    title: '4. Jantar / Pós-Treino',
    tag: 'Reconstrução Muscular',
    description: 'Reposição completa dos estoques de glicogênio depletados e síntese proteica noturna.',
    basePortions: {
      proteinGrams: 160,
      carbGrams: 200
    },
    buildText: (ratio = 1) => {
      const meat = Math.round(160 * ratio);
      const carb = Math.round(200 * ratio);
      return `${meat}g de peito de frango grelhado ou patinho moído + ${carb}g de batata-doce, mandioca ou arroz + vegetais cozidos (brócolis/cenoura).`;
    }
  },
  {
    order: 5,
    title: '5. Ceia Noturna (Opcional)',
    tag: 'Anti-catabolismo',
    description: 'Digestão lenta e liberação gradual de aminoácidos durante as 7-8 horas de sono.',
    basePortions: {
      eggs: 2
    },
    buildText: (ratio = 1) => {
      return `2 ovos cozidos ou 1 iogurte natural / leite com 1 colher de pasta de amendoim 100% integral.`;
    }
  }
];
