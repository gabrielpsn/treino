/**
 * Glossário em linguagem simples para quem está começando na musculação.
 * Usado pelos "?" ao lado dos termos e pela tela de glossário.
 */
export const GLOSSARY = {
  serie: {
    term: 'Série',
    short: 'Um bloco de repetições seguidas, sem parar.',
    long: '"3x 10" quer dizer 3 séries de 10 repetições: faça 10, descanse, faça mais 10, descanse, e mais 10.'
  },
  reps: {
    term: 'Repetições (reps)',
    short: 'Quantas vezes você faz o movimento completo em uma série.',
    long: 'Subir e descer o peso uma vez é 1 repetição. Se a ficha diz "8-12", escolha um peso com que você consiga fazer entre 8 e 12 com boa técnica.'
  },
  carga: {
    term: 'Carga',
    short: 'O peso que você usou, em kg.',
    long: 'Anote o peso total: na barra, some anilhas e barra; no aparelho, use o número da placa. É o que permite ao app sugerir quando subir o peso.'
  },
  rir: {
    term: 'RIR (repetições sobrando)',
    short: 'Quantas repetições a mais você ainda conseguiria fazer ao terminar a série.',
    long: 'Terminou 10 reps e sentiu que faria mais 2? RIR = 2. 0 significa que não dava mais nenhuma. Iniciantes devem treinar com RIR entre 2 e 3. Campo opcional.'
  },
  descanso: {
    term: 'Descanso',
    short: 'Pausa entre uma série e outra.',
    long: 'Toque em "Descanso" para iniciar o cronômetro. Respeitar a pausa ajuda a manter a força nas próximas séries.'
  },
  ficha: {
    term: 'Ficha / Treino A, B, C',
    short: 'A lista de exercícios de cada dia.',
    long: 'Você alterna entre as fichas (A, B, C...) a cada treino. O app mostra qual é a de hoje no topo da tela.'
  },
  sobrecarga: {
    term: 'Sobrecarga progressiva',
    short: 'Aumentar aos poucos o peso ou as repetições.',
    long: 'É o que faz o músculo crescer e ficar mais forte. Quando você completa o máximo de reps com boa técnica, o app sugere subir um pouco o peso.'
  },
  rm1: {
    term: '1RM',
    short: 'O peso máximo que você levantaria uma única vez.',
    long: 'O app estima esse número a partir dos seus treinos, sem você precisar testar o máximo. Serve para acompanhar se você está ficando mais forte.'
  },
  deload: {
    term: 'Deload',
    short: 'Uma semana mais leve para o corpo recuperar.',
    long: 'Você treina com menos peso e menos séries por uma semana. Ajuda a destravar a evolução quando as cargas param de subir.'
  },
  falha: {
    term: 'Falha',
    short: 'Quando não dá para fazer mais nenhuma repetição com boa técnica.',
    long: 'Ir até a falha toda vez cansa demais. Para quem está começando, parar 2–3 repetições antes é mais seguro e funciona bem.'
  },
  calorias: {
    term: 'Meta de calorias',
    short: 'Quanta energia (kcal) comer por dia para o seu objetivo.',
    long: 'Para ganhar massa, come-se um pouco acima do gasto do dia. Para perder gordura, um pouco abaixo. O app calcula a partir do seu peso, altura, idade e treinos.'
  },
  macros: {
    term: 'Macros',
    short: 'Proteína, carboidrato e gordura.',
    long: 'Proteína ajuda a construir músculo; carboidrato dá energia para treinar; gordura é essencial para hormônios. O app sugere quantos gramas de cada.'
  }
};

export const GLOSSARY_ORDER = ['ficha', 'serie', 'reps', 'carga', 'descanso', 'rir', 'falha', 'sobrecarga', 'rm1', 'deload', 'calorias', 'macros'];
