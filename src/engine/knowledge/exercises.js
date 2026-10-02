/**
 * Catálogo completo de exercícios com classificação por grupo muscular,
 * padrão de movimento, equipamento necessário e contraindicações/impactos articulares.
 */

export const EXERCISE_CATALOG = [
  // --- PEITORAL ---
  {
    id: 'supino_reto_barra',
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bench_Press/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Press/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Butterfly/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Decline_Dumbbell_Flyes/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pushups/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Shoulder_Press/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Machine_Shoulder_Military_Press/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Lateral_Raise/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Seated_Lateral_Raise/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Rear_Delt_Row/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Wide-Grip_Lat_Pulldown/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pullups/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Cable_Rows/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bent_Over_Two-Dumbbell_Row/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_One-arm_Cable_Pulley_Rows/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Rope_Straight-Arm_Pulldown/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Shrug/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Shrug/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Curl/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Hammer_Curls_-_Rope_Attachment/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Preacher_Curl/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Pushdown_-_Rope_Attachment/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_One-Arm_Triceps_Extension/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bench_Dips/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Full_Squat/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Press/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Goblet_Squat/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Extensions/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Leg_Curls/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Stiff-Legged_Dumbbell_Deadlift/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Hip_Thrust/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Calf_Raises/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Crunches/0.jpg',
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
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Plank/0.jpg',
    name: 'Prancha Isométrica',
    muscle: 'core',
    pattern: 'plank',
    equipment: 'gym_or_home',
    jointStress: [],
    defaultSeries: '3x 30s-60s',
    rest: '45s',
    tips: 'Linha reta dos tornozelos à cabeça. Não deixe o quadril ceder.'
  },
  {
    id: 'prancha_modificada_joelhos',
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Plank/0.jpg',
    name: 'Prancha Modificada (Joelhos Apoiados)',
    muscle: 'core',
    pattern: 'plank',
    equipment: 'gym_or_home',
    jointStress: [],
    defaultSeries: '3x 20-35s',
    rest: '45s',
    tips: 'Apoie os joelhos em colchonete para eliminar sobrecarga na lombar.'
  },

  // --- GLÚTEOS / QUADRIL (ESPECÍFICOS) ---
  {
    id: 'cadeira_abdutora',
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Thigh_Abductor/0.jpg',
    name: 'Cadeira Abdutora (Tronco Inclinado)',
    muscle: 'gluteos',
    pattern: 'abduction',
    equipment: 'gym',
    jointStress: [],
    defaultSeries: '3x 15-20 reps',
    rest: '45s',
    tips: 'Incline o tronco levemente à frente para maior ativação do glúteo médio e mínimo.'
  },

  // --- CARDIO ESTRATÉGICO & BAIXO IMPACTO ---
  {
    id: 'esteira_inclinada',
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Walking_Treadmill/0.jpg',
    name: 'Esteira Inclinada (Caminhada 4-5 km/h)',
    muscle: 'cardio',
    pattern: 'cardio_incline',
    equipment: 'gym',
    jointStress: [],
    defaultSeries: '25-35 min',
    rest: 'Contínuo',
    tips: 'Aumente a inclinação (4 a 8%) sem correr para queimar gordura com zero impacto nos joelhos.'
  },
  {
    id: 'bike_ergometrica',
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Recumbent_Bike/0.jpg',
    name: 'Bicicleta Ergométrica (Ritmo Moderado)',
    muscle: 'cardio',
    pattern: 'cardio_bike',
    equipment: 'gym_or_home',
    jointStress: [],
    defaultSeries: '20-30 min',
    rest: 'Contínuo',
    tips: 'Ajuste a altura do banco no osso do quadril para proteger a patela.'
  },
  {
    id: 'eliptico_transport',
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Elliptical_Trainer/0.jpg',
    name: 'Elíptico / Transport (Zero Impacto)',
    muscle: 'cardio',
    pattern: 'cardio_eliptico',
    equipment: 'gym',
    jointStress: [],
    defaultSeries: '20-25 min',
    rest: 'Contínuo',
    tips: 'Movimento guiado e fluido que preserva totalmente joelhos e tornozelos.'
  },
  {
    id: 'meta_passos_diarios',
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Trail_Running_Walking/0.jpg',
    name: 'Meta Diária de Passos no Celular',
    muscle: 'cardio',
    pattern: 'steps',
    equipment: 'gym_or_home',
    jointStress: [],
    defaultSeries: '7.000 a 9.000 passos',
    rest: 'Ao longo do dia',
    tips: 'Garante o gasto calórico não-exercício (NEAT) sustentável.'
  },

  // =========================================================================
  // COMPLEMENTO PARA TREINO EM CASA E PARA RESTRIÇÕES ARTICULARES
  // =========================================================================
  // Todos os exercícios acima vivem no topo do catálogo de propósito. Como
  // getSafeExercise devolve o PRIMEIRO match encontrado, manter estes aqui no
  // fim garante que nenhum plano já gerado mude: eles só entram quando não
  // existe nenhuma alternativa segura, exatamente a situação em que antes o
  // slot era simplesmente omitido.
  //
  // Não têm imageUrl de propósito: os URLs do catálogo apontam para
  // free-exercise-db e não existe arquivo correspondente para banda, elástico
  // ou movements isométricos. Link inventado quebraria em produção; a dica
  // textual cobre o caso sem inventar asset.

  // --- QUADRÍCEPS SEM CARGA ARTICULAR (essencial para dor no joelho) ---
  {
    id: 'agachamento_isometrico_parede',
    name: 'Agachamento Isométrico na Parede (Wall Sit)',
    muscle: 'quadriceps',
    pattern: 'leg_extension',
    equipment: 'home',
    jointStress: [],
    defaultSeries: '4x 20-45s',
    rest: '60s',
    tips: 'Apoie as costas na parede e desça até 90° sem ultrapassar os joelhos dos pés. É o principal construtor de quadríceps para quem tem dor no joelho: a carga é estática e não há impacto.'
  },
  {
    id: 'extensora_uma_perna',
    name: 'Extensora de Perna Unilateral',
    muscle: 'quadriceps',
    pattern: 'leg_extension',
    equipment: 'gym_or_home',
    jointStress: [],
    defaultSeries: '3x 12-15 reps',
    rest: '45s',
    tips: 'Com elástico no pé, estenda o joelho de uma perna por vez. A unilateralidade corrige assimetrias e a carga baixa poupa a articulação.'
  },
  {
    id: 'deadlift_banda',
    name: 'Deadlift com Elástico',
    muscle: 'posterior',
    pattern: 'hinge',
    equipment: 'home',
    jointStress: [],
    defaultSeries: '3x 15 reps',
    rest: '60s',
    tips: 'Quadril para trás, coluna neutra e tronco inclinado, como no stiff. Substitui a carga livre em quem tem restrição na lombar.'
  },
  {
    id: 'nordic_curl',
    name: 'Nordic Curl',
    muscle: 'posterior',
    pattern: 'leg_curl',
    equipment: 'home',
    jointStress: [],
    defaultSeries: '3x 6-10 reps',
    rest: '90s',
    tips: 'Ajoelhado, desça lentamente contando até 5 e volte com o empurrão de outra pessoa ou apoio. Não carrega a coluna nem o joelho: é a melhor opção de isquiotibiais em casa.'
  },
  {
    id: 'leg_curl_slider',
    name: 'Mesa Flexora com Slider (Piso)',
    muscle: 'posterior',
    pattern: 'leg_curl',
    equipment: 'home',
    jointStress: [],
    defaultSeries: '3x 10-15 reps',
    rest: '60s',
    tips: 'Deitado de barriga para baixo, deslize o calcanhar puxando o quadril para dentro. Alternativa doméstica à mesa flexora.'
  },
  {
    id: 'afundo_bulgarian',
    name: 'Afundo Búlgaro',
    muscle: 'quadriceps',
    pattern: 'squat',
    equipment: 'gym_or_home',
    jointStress: ['joelho'],
    defaultSeries: '3x 10-12 reps',
    rest: '90s',
    tips: 'Pé de trás elevado em um banco, desça controlando. Muito eficiente, mas exige joelho saudável — se houver dor, prefira o agachamento na parede.'
  },
  {
    id: 'elevacao_gluteo_banda',
    name: 'Elevação Pélvica com Elástico',
    muscle: 'gluteos',
    pattern: 'hip_thrust',
    equipment: 'home',
    jointStress: [],
    defaultSeries: '4x 12-15 reps',
    rest: '60s',
    tips: 'Costas no chão, elástico acima dos joelhos e empurre o quadril para o teto. Ativa glúteo médio, que é o que segura o joelho na corrida.'
  },
  {
    id: 'clam_shell_banda',
    name: 'Clam Shell com Elástico',
    muscle: 'gluteos',
    pattern: 'abduction',
    equipment: 'home',
    jointStress: [],
    defaultSeries: '3x 15 reps cada perna',
    rest: '45s',
    tips: 'Deitado de lado, joelhos dobrados e pés juntos: abra o joelho de cima como uma concha. Substitui a cadeira abdutora em casa.'
  },
  {
    id: 'passada_lateral',
    name: 'Passada Lateral (Lateral Shuffle)',
    muscle: 'cardio',
    pattern: 'cardio_bike',
    equipment: 'home',
    jointStress: [],
    defaultSeries: '3x 30s',
    rest: '30s',
    tips: 'Agachado em semiposição, salte de lado para o outro. Cardio sem impacto e sem machines.'
  },
  {
    id: 'caminhada_rapida',
    name: 'Caminhada Rápida',
    muscle: 'cardio',
    pattern: 'cardio_incline',
    equipment: 'home',
    jointStress: [],
    defaultSeries: '25-35 min',
    rest: 'Contínuo',
    tips: 'Inclinação não é obrigatória sem esteira: bastam ritmo de passo rápido e terreno em subida. Alternativa doméstica à esteira inclinada.'
  },
  {
    id: 'pular_corda',
    name: 'Pular Corda',
    muscle: 'cardio',
    pattern: 'cardio_eliptico',
    equipment: 'home',
    jointStress: ['joelho', 'quadril'],
    defaultSeries: '3x 2 min',
    rest: '45s',
    tips: 'Aterrissagem repetida no mesmo ponto: se você tem dor no joelho ou no quadril, prefira caminhada rápida ou bicicleta.'
  },
  {
    id: 'puxada_banda',
    name: 'Puxada de Elástico no Chão',
    muscle: 'costas',
    pattern: 'pull_vertical',
    equipment: 'home',
    jointStress: [],
    defaultSeries: '3x 12-15 reps',
    rest: '60s',
    tips: 'Sente-se com a banda presa acima da porta e puxe em direção ao quadril. Substitui a barra fixa com carga baixa.'
  },
  {
    id: 'remo_baixo_banda',
    name: 'Remada Baixa com Elástico',
    muscle: 'costas',
    pattern: 'pull_horizontal',
    equipment: 'home',
    jointStress: [],
    defaultSeries: '3x 12-15 reps',
    rest: '60s',
    tips: 'Quadril flexionado, coluna neutra e elástico na altura do abdômen. Sem curvatura da lombar, que é o erro mais comum na remada.'
  },
  {
    id: 'remo_uma_mao_banda',
    name: 'Remada unilateral com Elástico',
    muscle: 'costas',
    pattern: 'pull_horizontal',
    equipment: 'home',
    jointStress: [],
    defaultSeries: '3x 12 reps cada lado',
    rest: '45s',
    tips: 'Mão apoiada no banco e puxa com o outro braço. Corrige a lateralidade e entrela a musculatura das costas.'
  },
  {
    id: 'pullover_banda',
    name: 'Pullover com Elástico',
    muscle: 'costas',
    pattern: 'lat_isolation',
    equipment: 'home',
    jointStress: [],
    defaultSeries: '3x 12-15 reps',
    rest: '60s',
    tips: 'Deitado de costas, braços quase estendidos, leve o elástico em arco até os quadris. Isola o dorsal sem carga na coluna.'
  },
  {
    id: 'triceps_banda',
    name: 'Tríceps na Corda com Elástico',
    muscle: 'triceps',
    pattern: 'triceps_extension',
    equipment: 'home',
    jointStress: [],
    defaultSeries: '3x 12-15 reps',
    rest: '45s',
    tips: 'Cotovelos colados ao corpo, estenda o antebraço contra a tensão da banda. Não gera pressão no ombro como o apoio no banco.'
  },
  {
    id: 'triceps_banda_alongado',
    name: 'Tríceps Alongado com Elástico',
    muscle: 'triceps',
    pattern: 'triceps_overhead',
    equipment: 'home',
    jointStress: [],
    defaultSeries: '3x 12-15 reps',
    rest: '60s',
    tips: 'Costas retas, banda atrás da cabeça e cotovelos apontando para a frente. Pegada neutra e carga baixa reduzem a tensão de cotovelo.'
  },
  {
    id: 'crucifixo_banda',
    name: 'Crucifixo com Elástico',
    muscle: 'peito',
    pattern: 'fly',
    equipment: 'home',
    jointStress: [],
    defaultSeries: '3x 12-15 reps',
    rest: '45s',
    tips: 'Cotovelos levemente flexionados, abra as mãos até sentir o peitoral. Movimento controlado e amplitude parcial, então o ombro fica descansado.'
  },
  {
    id: 'flexao_inclinada_banco',
    name: 'Flexão Inclinada no Banco',
    muscle: 'peito',
    pattern: 'push_incline',
    equipment: 'gym_or_home',
    jointStress: [],
    defaultSeries: '3x 10-15 reps',
    rest: '60s',
    tips: 'As mãos mais altas que os pés reduzem a carga no ombro. É a inclinate que substitui o supino inclinado para quem sente dor no ombro.'
  }
];

