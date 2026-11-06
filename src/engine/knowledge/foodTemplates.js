/**
 * Modelos de refeições ricas em nutrientes, adaptáveis proporcionalmente às calorias e macros
 */

export const DIETARY_PREFERENCES = [
  { id: 'omnivore', label: 'Onívoro', icon: '🥩', desc: 'Carnes, ovos, laticínios e vegetais' },
  { id: 'vegetarian', label: 'Vegetariano', icon: '🥗', desc: 'Ovos, laticínios e leguminosas (sem carnes)' },
  { id: 'vegan', label: 'Vegano', icon: '🌱', desc: '100% à base de plantas (tofu, leguminosas e sementes)' },
  { id: 'lactose_free', label: 'Sem Lactose', icon: '🥛', desc: 'Sem derivados tradicionais de leite' },
  { id: 'low_carb', label: 'Low Carb', icon: '🥑', desc: 'Foco em proteínas, gorduras boas e vegetais' }
];

export const MEAL_TEMPLATES = [
  {
    order: 1,
    title: '1. Café da Manhã Energético',
    tag: 'Desjejum Anabólico',
    description: 'Quebra de jejum com proteínas de alto valor biológico e carboidratos complexos.',
    buildText: (ratio = 1, creatinaGrams = 5, preference = 'omnivore') => {
      const eggs = Math.round(3 * ratio);
      const fruit = Math.round(120 * ratio);
      if (preference === 'vegan') {
        const tofu = Math.round(150 * ratio);
        return `${tofu}g de tofu mexido temperado com cúrcuma e orégano + 2 fatias de pão 100% integral (ou ${Math.round(120 * ratio)}g de cuscuz) + ${fruit}g de banana/mamão com 1 colher de sementes de chia.`;
      }
      if (preference === 'vegetarian') {
        return `${Math.max(2, eggs)} ovos mexidos com queijo cottage/ricota + 2 fatias de pão integral (ou ${Math.round(120 * ratio)}g de cuscuz) + ${fruit}g de fruta com aveia.`;
      }
      if (preference === 'lactose_free') {
        return `${Math.max(2, eggs)} ovos inteiros mexidos no azeite + 2 fatias de pão integral (ou ${Math.round(120 * ratio)}g de cuscuz/mandioca) + ${fruit}g de fruta + café com bebida vegetal ou puro.`;
      }
      if (preference === 'low_carb') {
        return `${Math.max(3, eggs)} ovos mexidos na manteiga/azeite com queijo curado + 1/2 abacate fatiado ou ${Math.round(80 * ratio)}g de morangos + café preto sem açúcar.`;
      }
      return `${Math.max(2, eggs)} ovos inteiros mexidos/cozidos + 2 fatias de pão integral (ou ${Math.round(120 * ratio)}g de cuscuz/mandioca) + ${fruit}g de fruta (banana/mamão).`;
    }
  },
  {
    order: 2,
    title: '2. Almoço Construtor',
    tag: 'Pico Anabólico & Creatina',
    description: 'Refeição principal de alta densidade nutricional, micronutrientes e absorção de creatina.',
    buildText: (ratio = 1, creatinaGrams = 5, preference = 'omnivore') => {
      const meat = Math.round(160 * ratio);
      const rice = Math.round(200 * ratio);
      if (preference === 'vegan') {
        const plantProt = Math.round(180 * ratio);
        return `${plantProt}g de tofu grelhado ou proteína vegetal + ${rice}g de arroz integral + 1 concha generosa de lentilha ou grão-de-bico (130g) + salada de folhas verdes com azeite de oliva e sementes de abóbora. + ${creatinaGrams}g de CREATINA monohidratada.`;
      }
      if (preference === 'vegetarian') {
        const vegProt = Math.round(170 * ratio);
        return `${vegProt}g de tofu grelhado ou 3 ovos mexidos com queijo minas + ${rice}g de arroz integral + 1 concha de feijão ou lentilha (120g) + salada de folhas verdes com azeite de oliva. + ${creatinaGrams}g de CREATINA monohidratada.`;
      }
      if (preference === 'low_carb') {
        const meatLow = Math.round(180 * ratio);
        return `${meatLow}g de frango, carne bovina ou peixe grelhado + prato farto de brócolis, couve-flor e abobrinha salteados no azeite + salada de folhas verdes com tomate cereja. + ${creatinaGrams}g de CREATINA monohidratada.`;
      }
      return `${meat}g de frango, carne magra ou peixe + ${rice}g de arroz branco/integral + 1 concha de feijão (100g) + salada de folhas verdes com azeite de oliva extra virgem. + ${creatinaGrams}g de CREATINA monohidratada.`;
    }
  },
  {
    order: 3,
    title: '3. Pré-Treino Natural (45-60m antes)',
    tag: 'Energia & Foco',
    description: 'Glicogênio rápido de fácil digestão gastrointestinal com cafeína para foco neuromuscular.',
    buildText: (ratio = 1, creatinaGrams = 5, preference = 'omnivore') => {
      const oats = Math.round(30 * ratio);
      if (preference === 'vegan') {
        return `1 banana média amassada com ${oats}g de aveia em flocos, 1 colher de pasta de amendoim e melado de cana + 1 xícara de café preto puro sem açúcar.`;
      }
      if (preference === 'low_carb') {
        const nuts = Math.round(25 * ratio);
        return `1 xícara de café preto com 1 colher de óleo de coco ou manteiga + 1 punhado (${nuts}g) de castanhas de caju ou nozes.`;
      }
      return `1 banana média amassada com ${oats}g de aveia em flocos e 1 colher de mel + 1 xícara (150ml) de café preto puro sem açúcar (cafeína pré-treino).`;
    }
  },
  {
    order: 4,
    title: '4. Jantar / Pós-Treino',
    tag: 'Reconstrução Muscular',
    description: 'Reposição completa dos estoques de glicogênio depletados e síntese proteica noturna.',
    buildText: (ratio = 1, creatinaGrams = 5, preference = 'omnivore') => {
      const meat = Math.round(160 * ratio);
      const carb = Math.round(200 * ratio);
      if (preference === 'vegan') {
        const legumes = Math.round(180 * ratio);
        return `${legumes}g de grão-de-bico refogado ou tofu grelhado + ${carb}g de batata-doce, mandioca ou arroz + vegetais cozidos no vapor (brócolis/cenoura).`;
      }
      if (preference === 'vegetarian') {
        const vegProt = Math.round(160 * ratio);
        return `Omelete de 3 ovos com legumes OU ${vegProt}g de tofu/queijo coalho grelhado + ${carb}g de batata-doce, mandioca ou arroz + vegetais cozidos no vapor.`;
      }
      if (preference === 'low_carb') {
        const meatLow = Math.round(180 * ratio);
        return `${meatLow}g de peito de frango grelhado, patinho moído ou filé de salmão + legumes assados no azeite (abobrinha, berinjela e cenoura) + salada crua à vontade.`;
      }
      return `${meat}g de peito de frango grelhado ou patinho moído + ${carb}g de batata-doce, mandioca ou arroz + vegetais cozidos (brócolis/cenoura).`;
    }
  },
  {
    order: 5,
    title: '5. Ceia Noturna (Opcional)',
    tag: 'Anti-catabolismo',
    description: 'Digestão lenta e liberação gradual de aminoácidos durante as 7-8 horas de sono.',
    buildText: (ratio = 1, creatinaGrams = 5, preference = 'omnivore') => {
      if (preference === 'vegan') {
        return `1 copo (200ml) de leite vegetal (amêndoas ou aveia) com 1 colher de pasta de amendoim 100% integral e sementes de chia.`;
      }
      if (preference === 'vegetarian') {
        return `2 ovos cozidos com orégano ou 1 iogurte natural com 1 colher de pasta de amendoim 100% integral.`;
      }
      if (preference === 'lactose_free') {
        return `2 ovos cozidos ou 1 iogurte zero lactose / leite vegetal com 1 colher de pasta de amendoim 100% integral.`;
      }
      if (preference === 'low_carb') {
        const nuts = Math.round(25 * ratio);
        return `2 ovos cozidos com fio de azeite e sal ou 1 punhado (${nuts}g) de castanhas-do-pará e nozes.`;
      }
      return `2 ovos cozidos ou 1 iogurte natural / leite com 1 colher de pasta de amendoim 100% integral.`;
    }
  }
];

/**
 * Escala uma faixa de gramas em torno de uma porção de referência (1.0 = cardápio base).
 * Usado no déficit para que um usuário de 1400 kcal não receba exatamente as mesmas
 * porções de um usuário de 2400 kcal.
 */
function scaleGrams(min, max, ratio = 1) {
  const lo = Math.round((min * ratio) / 5) * 5;
  const hi = Math.round((max * ratio) / 5) * 5;
  return lo === hi ? `${lo}g` : `${lo}g a ${hi}g`;
}

export const WEIGHT_LOSS_MEAL_TEMPLATES = [
  {
    order: 1,
    title: '1. Café da Manhã (Saciedade & Energia)',
    tag: '~320 kcal',
    description: 'Garante proteína logo pela manhã, evitando ataques de fome e ansiedade por doces antes do almoço.',
    buildText: (ratio = 1, creatinaGrams = 3, preference = 'omnivore') => {
      if (preference === 'vegan') {
        const tofu = scaleGrams(120, 140, ratio);
        return `${tofu} de tofu mexido com cúrcuma e orégano + 1 fatia de pão integral 100% ou fruta média + 1 xícara de café preto puro sem açúcar.`;
      }
      if (preference === 'low_carb') {
        return `2 a 3 ovos mexidos no azeite com folhas de espinafre + 1/4 de abacate fatiado + 1 xícara de café preto sem açúcar.`;
      }
      return `2 ovos inteiros mexidos (com orégano e pouco azeite) + 1 fatia de pão integral 100% ou 1 fatia média de melão/mamão + 1 xícara de café preto ou café com leite desnatado.${ratio > 1.05 ? ' Reforce com 1 scoop de proteína em pó se a fome aparecer cedo.' : ''}`;
    }
  },
  {
    order: 2,
    title: '2. Almoço Nutritivo (Alta Saciedade)',
    tag: '~450 kcal',
    description: 'Combinação rica em fibras e aminoácidos para alimentar os músculos e queimar gordura visceral.',
    buildText: (ratio = 1, creatinaGrams = 3, preference = 'omnivore') => {
      if (preference === 'vegan') {
        const grao = scaleGrams(140, 160, ratio);
        const arroz = ratio < 0.95 ? '2 a 3 colheres de sopa' : ratio > 1.1 ? '4 a 5 colheres de sopa' : '3 a 4 colheres de sopa';
        return `${grao} de tofu grelhado ou mix de grão-de-bico com lentilha + ${arroz} de arroz integral + Prato farto de salada verde (alface, rúcula, pepino, tomate) com 1 colher de chá de azeite extra virgem. + Creatina (${creatinaGrams}g).`;
      }
      if (preference === 'vegetarian') {
        const vegProt = scaleGrams(130, 150, ratio);
        const arroz = ratio < 0.95 ? '2 a 3 colheres de sopa' : ratio > 1.1 ? '4 a 5 colheres de sopa' : '3 a 4 colheres de sopa';
        return `${vegProt} de tofu grelhado ou 3 ovos cozidos + ${arroz} de arroz integral + 1 concha rasa de feijão + Prato farto de salada verde com 1 colher de chá de azeite extra virgem. + Creatina (${creatinaGrams}g).`;
      }
      if (preference === 'low_carb') {
        const proteina = scaleGrams(140, 160, ratio);
        return `1 filé generoso (${proteina}) de frango, carne magra ou peixe + prato farto de legumes no vapor (brócolis, couve-flor, abobrinha) + salada verde à vontade com azeite extra virgem. + Creatina (${creatinaGrams}g).`;
      }
      const proteina = scaleGrams(120, 140, ratio);
      const arroz = ratio < 0.95 ? '2 a 3 colheres de sopa' : ratio > 1.1 ? '4 a 5 colheres de sopa' : '3 a 4 colheres de sopa';
      return `1 filé médio (${proteina}) de peito de frango, carne magra (patinho) ou peixe + ${arroz} de arroz integral + 1 concha rasa de feijão + Prato farto de salada verde (alface, rúcula, pepino, tomate) com 1 colher de chá de azeite extra virgem. + Creatina (${creatinaGrams}g).`;
    }
  },
  {
    order: 3,
    title: '3. Lanche da Tarde Anti-Fome',
    tag: '~220 kcal',
    description: 'A chia e o iogurte retardam a digestão e impedem compulsão alimentar no fim da tarde/início da noite.',
    buildText: (ratio = 1, creatinaGrams = 3, preference = 'omnivore') => {
      if (preference === 'vegan') {
        return `1 copo (${scaleGrams(180, 200, ratio)}) de leite vegetal com 1 colher de sopa de sementes de chia + ${ratio > 1.05 ? '1 maçã média' : 'meia maçã média'} picada com canela em pó.`;
      }
      if (preference === 'lactose_free') {
        return `1 pote (${scaleGrams(150, 170, ratio)}) de iogurte zero lactose com 1 colher de sopa de sementes de chia ou farelo de aveia + ${ratio > 1.05 ? '1 maçã média' : 'meia maçã média'} picada com canela em pó.`;
      }
      if (preference === 'low_carb') {
        return `1 punhado (${scaleGrams(25, 30, ratio)}) de mix de castanhas e nozes + 1 fatia pequena de queijo curado ou chá verde gelado.`;
      }
      return `1 pote (${scaleGrams(150, 170, ratio)}) de iogurte natural desnatado com 1 colher de sopa de sementes de chia ou farelo de aveia + ${ratio > 1.05 ? '1 maçã média' : 'meia maçã média'} picada com canela em pó.`;
    }
  },
  {
    order: 4,
    title: '4. Jantar Leve & Digestivo',
    tag: '~350 kcal',
    description: 'Redução de carboidratos pesados à noite para otimizar o hormônio de crescimento (GH) e queima lipídica noturna.',
    buildText: (ratio = 1, creatinaGrams = 3, preference = 'omnivore') => {
      if (preference === 'vegan') {
        return `Salteado de ${scaleGrams(140, 150, ratio)} de tofu com ${scaleGrams(160, 180, ratio)} de legumes no vapor (brócolis, couve-flor, abobrinha) + salada crua à vontade.`;
      }
      if (preference === 'vegetarian') {
        return `Omelete de 2 ovos com legumes (cenoura ralada, abobrinha, espinafre) OU ${scaleGrams(130, 140, ratio)} de tofu grelhado com legumes cozidos no vapor + salada crua à vontade.`;
      }
      if (preference === 'low_carb') {
        return `1 filé (${scaleGrams(140, 160, ratio)}) de peixe ou peito de frango desfiado com prato abundante de legumes refogados no azeite + salada verde à vontade.`;
      }
      return `Omelete de 2 ovos com legumes (cenoura ralada, abobrinha, espinafre) OU ${scaleGrams(120, 120, ratio)} de frango desfiado com ${scaleGrams(150, 150, ratio)} de legumes cozidos no vapor (brócolis, couve-flor, abóbora) + salada crua à vontade.`;
    }
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
