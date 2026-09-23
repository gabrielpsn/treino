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

export const WEIGHT_LOSS_MEAL_TEMPLATES = [
  {
    order: 1,
    title: '1. Café da Manhã (Saciedade & Energia)',
    tag: '~320 kcal',
    description: 'Garante proteína logo pela manhã, evitando ataques de fome e ansiedade por doces antes do almoço.',
    buildText: () => '2 ovos inteiros mexidos (com orégano e pouco azeite) + 1 fatia de pão integral 100% ou 1 fatia média de melão/mamão + 1 xícara de café preto ou café com leite desnatado.'
  },
  {
    order: 2,
    title: '2. Almoço Nutritivo (Alta Saciedade)',
    tag: '~450 kcal',
    description: 'Combinação rica em fibras e aminoácidos para alimentar os músculos e queimar gordura visceral.',
    buildText: (ratio = 1, creatinaGrams = 3) => `1 filé médio (120g a 140g) de peito de frango, carne magra (patinho) ou peixe + 3 a 4 colheres de sopa de arroz integral + 1 concha rasa de feijão + Prato farto de salada verde (alface, rúcula, pepino, tomate) com 1 colher de chá de azeite extra virgem. + Creatina (${creatinaGrams}g).`
  },
  {
    order: 3,
    title: '3. Lanche da Tarde Anti-Fome',
    tag: '~220 kcal',
    description: 'A chia e o iogurte retardam a digestão e impedem compulsão alimentar no fim da tarde/início da noite.',
    buildText: () => '1 pote (150g a 170g) de iogurte natural desnatado com 1 colher de sopa de sementes de chia ou farelo de aveia + 1 maçã média picada com canela em pó.'
  },
  {
    order: 4,
    title: '4. Jantar Leve & Digestivo',
    tag: '~350 kcal',
    description: 'Redução de carboidratos pesados à noite para otimizar o hormônio de crescimento (GH) e queima lipídica noturna.',
    buildText: () => 'Omelete de 2 ovos com legumes (cenoura ralada, abobrinha, espinafre) OU 120g de frango desfiado com 150g de legumes cozidos no vapor (brócolis, couve-flor, abóbora) + salada crua à vontade.'
  },
  {
    order: 5,
    title: '5. Chá Relaxante Noturno (Ceia)',
    tag: 'Zero Açúcar',
    description: 'Reduz o cortisol (hormônio do estresse que retém líquido e acumula gordura abdominal) e induz o sono profundo.',
    buildText: () => '1 xícara de infusão de camomila, melissa ou erva-doce (sem açúcar ou com poucas gotas de stevia se necessário).'
  }
];

export const NATURAL_SUPPLEMENTS = [
  {
    id: 'cha-verde',
    name: 'Chá Verde com Gengibre & Canela',
    icon: '🍵',
    color: 'rose',
    dosage: '300 ml pela manhã ou antes das 15h.',
    benefit: 'Acelera moderadamente o gasto térmico, combate a retenção hídrica matinal e diminui picos de insulina.'
  },
  {
    id: 'psyllium',
    name: 'Psyllium em Flocos (Fibra Natural)',
    icon: '🌾',
    color: 'amber',
    dosage: '1 colher de sobremesa em 250ml de água 20 minutos antes do almoço.',
    benefit: 'Expande no estômago formando um gel que reduz a absorção de gorduras e controla a fome compulsiva.'
  },
  {
    id: 'creatina',
    name: 'Creatina Monohidratada (3g a 5g/dia)',
    icon: '⚡',
    color: 'emerald',
    dosage: 'Todos os dias no almoço.',
    benefit: 'Fundamental para não perder massa magra (músculo) durante o déficit calórico, evitando flacidez ao emagrecer.'
  }
];
