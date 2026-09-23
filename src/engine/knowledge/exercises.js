/**
 * Catálogo completo de exercícios com classificação por grupo muscular,
 * padrão de movimento, equipamento necessário e contraindicações/impactos articulares.
 */

export const EXERCISE_CATALOG = [
  // --- PEITORAL ---
  {
    id: 'supino_reto_barra',
    name: 'Supino Reto com Barra',
    muscle: 'peito',
    pattern: 'push_horizontal',
    equipment: 'gym',
    jointStress: ['ombro'],
    defaultSeries: '4x 8-10 reps',
    rest: '90s',
    tips: 'Mantenha os cotovelos a ~75° do tronco e escápulas aduzidas.'
  },
  {
    id: 'supino_reto_halteres',
    name: 'Supino Reto com Halteres',
    muscle: 'peito',
    pattern: 'push_horizontal',
    equipment: 'gym_or_home',
    jointStress: [],
    defaultSeries: '3x 8-10 reps',
    rest: '90s',
    tips: 'Permite rotação natural do punho e maior amplitude sem travar os ombros.'
  },
  {
    id: 'supino_inclinado_halteres',
    name: 'Supino Inclinado com Halteres',
    muscle: 'peito',
    pattern: 'push_incline',
    equipment: 'gym_or_home',
    jointStress: ['ombro'],
    defaultSeries: '3x 10-12 reps',
    rest: '75s',
    tips: 'Inclinação de 30° a 45° para foco em porção clavicular.'
  },
  {
    id: 'voador_peck_deck',
    name: 'Voador / Peck Deck',
    muscle: 'peito',
    pattern: 'fly',
    equipment: 'gym',
    jointStress: [],
    defaultSeries: '3x 12-15 reps',
    rest: '60s',
    tips: 'Concentre no pico de contração apertando o peito por 1s.'
  },
  {
    id: 'crucifixo_halteres',
    name: 'Crucifixo Reto / Inclinado',
    muscle: 'peito',
    pattern: 'fly',
    equipment: 'gym_or_home',
    jointStress: ['ombro'],
    defaultSeries: '3x 12-15 reps',
    rest: '60s',
    tips: 'Cotovelos levemente flexionados durante todo o arco.'
  },
  {
    id: 'flexao_solo',
    name: 'Flexão de Braços (Push-up)',
    muscle: 'peito',
    pattern: 'push_horizontal',
    equipment: 'home',
    jointStress: [],
    defaultSeries: '3x falha (10-20 reps)',
    rest: '60s',
    tips: 'Abdômen e glúteos contraídos sem arquear a lombar.'
  },

  // --- OMBROS ---
  {
    id: 'desenvolvimento_halteres',
    name: 'Desenvolvimento com Halteres',
    muscle: 'ombro',
    pattern: 'push_vertical',
    equipment: 'gym_or_home',
    jointStress: ['ombro'],
    defaultSeries: '3x 8-10 reps',
    rest: '90s',
    tips: 'Não bata os halteres no topo; mantenha tensão constante.'
  },
  {
    id: 'desenvolvimento_maquina',
    name: 'Desenvolvimento na Máquina',
    muscle: 'ombro',
    pattern: 'push_vertical',
    equipment: 'gym',
    jointStress: [],
    defaultSeries: '3x 10-12 reps',
    rest: '75s',
    tips: 'Trajetória guiada muito segura para progressão com sobrecarga.'
  },
  {
    id: 'elevacao_lateral_halteres',
    name: 'Elevação Lateral com Halteres',
    muscle: 'ombro',
    pattern: 'lateral_raise',
    equipment: 'gym_or_home',
    jointStress: [],
    defaultSeries: '4x 12-15 reps',
    rest: '60s',
    tips: 'Suba até a linha do ombro com o polegar ligeiramente inclinado para baixo.'
  },
  {
    id: 'elevacao_lateral_polia',
    name: 'Elevação Lateral na Polia',
    muscle: 'ombro',
    pattern: 'lateral_raise',
    equipment: 'gym',
    jointStress: [],
    defaultSeries: '3x 12-15 reps',
    rest: '60s',
    tips: 'Tensão contínua desde a fase inicial do movimento.'
  },
  {
    id: 'crucifixo_inverso',
    name: 'Crucifixo Inverso (Deltóide Posterior)',
    muscle: 'ombro',
    pattern: 'rear_delt',
    equipment: 'gym_or_home',
    jointStress: [],
    defaultSeries: '3x 12-15 reps',
    rest: '60s',
    tips: 'Foco no deltóide posterior, sem impulsionar com as costas.'
  },

  // --- COSTAS ---
  {
    id: 'puxada_frontal_polia',
    name: 'Puxada Frontal na Polia',
    muscle: 'costas',
    pattern: 'pull_vertical',
    equipment: 'gym',
    jointStress: [],
    defaultSeries: '4x 8-10 reps',
    rest: '90s',
    tips: 'Puxe guiando os cotovelos para baixo em direção aos bolsos.'
  },
  {
    id: 'barra_fixa',
    name: 'Barra Fixa (Pronada ou Supinada)',
    muscle: 'costas',
    pattern: 'pull_vertical',
    equipment: 'gym_or_home',
    jointStress: ['ombro'],
    defaultSeries: '3x falha (6-10 reps)',
    rest: '90s',
    tips: 'Controle a descida completa (fase excêntrica).'
  },
  {
    id: 'remada_baixa_triangulo',
    name: 'Remada Baixa Sentada (Triângulo)',
    muscle: 'costas',
    pattern: 'pull_horizontal',
    equipment: 'gym',
    jointStress: [],
    defaultSeries: '3x 10-12 reps',
    rest: '75s',
    tips: 'Mantenha o peito aberto e estenda a dorsal na volta.'
  },
  {
    id: 'remada_curvada_halteres',
    name: 'Remada Curvada com Halteres',
    muscle: 'costas',
    pattern: 'pull_horizontal',
    equipment: 'gym_or_home',
    jointStress: ['lombar'],
    defaultSeries: '3x 10-12 reps',
    rest: '75s',
    tips: 'Coluna 100% alinhada e tronco firme a ~45°.'
  },
  {
    id: 'remada_articulada_apoiada',
    name: 'Remada Apoiada no Banco / Máquina',
    muscle: 'costas',
    pattern: 'pull_horizontal',
    equipment: 'gym',
    jointStress: [], // Ótimo para quem tem dor na lombar!
    defaultSeries: '3x 10-12 reps',
    rest: '75s',
    tips: 'Peito apoiado elimina qualquer tensão ou sobrecarga na lombar.'
  },
  {
    id: 'pulldown_corda',
    name: 'Pulldown na Polia com Corda',
    muscle: 'costas',
    pattern: 'lat_isolation',
    equipment: 'gym',
    jointStress: [],
    defaultSeries: '3x 12-15 reps',
    rest: '60s',
    tips: 'Excelente isolamento das dorsais com braços quase retos.'
  },

  // --- TRAPÉZIO ---
  {
    id: 'encolhimento_halteres',
    name: 'Encolhimento com Halteres (Trapézio)',
    muscle: 'trapezio',
    pattern: 'shrug',
    equipment: 'gym_or_home',
    jointStress: [],
    defaultSeries: '3x 12-15 reps',
    rest: '60s',
    tips: 'Eleve os ombros reto em direção às orelhas e segure 1-2s no topo. Não faça rotação do ombro.'
  },
  {
    id: 'encolhimento_barra_smith',
    name: 'Encolhimento com Barra / Smith',
    muscle: 'trapezio',
    pattern: 'shrug',
    equipment: 'gym',
    jointStress: [],
    defaultSeries: '3x 10-12 reps',
    rest: '75s',
    tips: 'Mantenha os braços esticados e use sobrecarga progressiva concentrando a contração no trapézio superior.'
  },

  // --- BRAÇOS (BÍCEPS / TRÍCEPS / ANTEBRAÇO) ---
  {
    id: 'rosca_direta_w',
    name: 'Rosca Direta (Barra W ou Halteres)',
    muscle: 'biceps',
    pattern: 'biceps_curl',
    equipment: 'gym_or_home',
    jointStress: [],
    defaultSeries: '3x 10-12 reps',
    rest: '60s',
    tips: 'Cotovelos estáveis ao lado do tronco sem gangorrar.'
  },
  {
    id: 'rosca_martelo',
    name: 'Rosca Martelo com Halteres',
    muscle: 'biceps',
    pattern: 'biceps_curl',
    equipment: 'gym_or_home',
    jointStress: [],
    defaultSeries: '3x 10-12 reps',
    rest: '60s',
    tips: 'Trabalha braquial e braquiorradial para densidade do braço.'
  },
  {
    id: 'rosca_scott',
    name: 'Rosca Scott (Máquina ou Banco)',
    muscle: 'biceps',
    pattern: 'biceps_curl',
    equipment: 'gym',
    jointStress: [],
    defaultSeries: '3x 10-12 reps',
    rest: '60s',
    tips: 'Isolamento estrito da cabeça curta do bíceps.'
  },
  {
    id: 'triceps_corda_pulley',
    name: 'Tríceps Pulley (Corda ou Barra)',
    muscle: 'triceps',
    pattern: 'triceps_extension',
    equipment: 'gym',
    jointStress: [],
    defaultSeries: '3x 10-12 reps',
    rest: '60s',
    tips: 'Abra a corda no final para ativar a cabeça lateral do tríceps.'
  },
  {
    id: 'triceps_frances_haltere',
    name: 'Tríceps Francês Unilateral / Bilateral',
    muscle: 'triceps',
    pattern: 'triceps_overhead',
    equipment: 'gym_or_home',
    jointStress: ['cotovelo'],
    defaultSeries: '3x 12 reps',
    rest: '60s',
    tips: 'Alongamento máximo da cabeça longa do tríceps.'
  },
  {
    id: 'triceps_banco',
    name: 'Tríceps Mergulho no Banco',
    muscle: 'triceps',
    pattern: 'triceps_extension',
    equipment: 'home',
    jointStress: ['ombro'],
    defaultSeries: '3x 12-15 reps',
    rest: '60s',
    tips: 'Mantenha as costas rentes ao banco.'
  },

  // --- PERNAS & GLÚTEOS ---
  {
    id: 'agachamento_livre',
    name: 'Agachamento Livre com Barra',
    muscle: 'quadriceps',
    pattern: 'squat',
    equipment: 'gym',
    jointStress: ['joelho', 'lombar'],
    defaultSeries: '4x 8-10 reps',
    rest: '120s',
    tips: 'Pés alinhados na largura dos ombros, quebrando a paralela se a mobilidade permitir.'
  },
  {
    id: 'leg_press_45',
    name: 'Leg Press 45°',
    muscle: 'quadriceps',
    pattern: 'leg_press',
    equipment: 'gym',
    jointStress: ['joelho'],
    defaultSeries: '4x 10-12 reps',
    rest: '90s',
    tips: 'Não estenda completamente os joelhos no topo (trava articular).'
  },
  {
    id: 'agachamento_goblet',
    name: 'Agachamento Goblet (com Haltere)',
    muscle: 'quadriceps',
    pattern: 'squat',
    equipment: 'gym_or_home',
    jointStress: [],
    defaultSeries: '3x 10-12 reps',
    rest: '75s',
    tips: 'Peso no peito ajuda a manter o tronco ereto e protege a coluna.'
  },
  {
    id: 'cadeira_extensora',
    name: 'Cadeira Extensora',
    muscle: 'quadriceps',
    pattern: 'leg_extension',
    equipment: 'gym',
    jointStress: ['joelho'],
    defaultSeries: '3x 12-15 reps',
    rest: '60s',
    tips: 'Segure 1 segundo no topo antes de descer controladamente.'
  },
  {
    id: 'mesa_flexora',
    name: 'Mesa ou Cadeira Flexora',
    muscle: 'posterior',
    pattern: 'leg_curl',
    equipment: 'gym',
    jointStress: [],
    defaultSeries: '4x 10-12 reps',
    rest: '75s',
    tips: 'Foco exclusivo nos isquiotibiais sem levantar o quadril.'
  },
  {
    id: 'stiff_halteres',
    name: 'Stiff com Halteres ou Barra',
    muscle: 'posterior',
    pattern: 'hinge',
    equipment: 'gym_or_home',
    jointStress: ['lombar'],
    defaultSeries: '3x 10-12 reps',
    rest: '90s',
    tips: 'Quadril viaja para trás; sinta o alongamento da cadeia posterior.'
  },
  {
    id: 'elevacao_pelvica',
    name: 'Elevação Pélvica (Hip Thrust)',
    muscle: 'gluteos',
    pattern: 'hip_thrust',
    equipment: 'gym_or_home',
    jointStress: [],
    defaultSeries: '4x 10-12 reps',
    rest: '90s',
    tips: 'O rei do estímulo de hipertrofia para glúteos. Trave 1s no topo.'
  },
  {
    id: 'panturrilha_em_pe',
    name: 'Panturrilha em Pé (Máquina ou Degrau)',
    muscle: 'panturrilha',
    pattern: 'calf_raise',
    equipment: 'gym_or_home',
    jointStress: [],
    defaultSeries: '4x 15-20 reps',
    rest: '45s',
    tips: 'Alongue ao máximo embaixo e aperte por 2s na ponta dos pés.'
  },

  // --- CORE / ABDÔMEN ---
  {
    id: 'abdominal_supra',
    name: 'Abdominal Supra (Solo ou Declinado)',
    muscle: 'core',
    pattern: 'crunch',
    equipment: 'gym_or_home',
    jointStress: [],
    defaultSeries: '3x 15-20 reps',
    rest: '45s',
    tips: 'Solte todo o ar na subida para contração muscular máxima.'
  },
  {
    id: 'prancha_isometrica',
    name: 'Prancha Isométrica',
    muscle: 'core',
    pattern: 'plank',
    equipment: 'gym_or_home',
    jointStress: [],
    defaultSeries: '3x 30s-60s',
    rest: '45s',
    tips: 'Linha reta dos tornozelos à cabeça. Não deixe o quadril ceder.'
  }
];
