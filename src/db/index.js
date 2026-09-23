import Dexie from 'dexie';

export class TreinoDatabase extends Dexie {
  constructor() {
    super('TreinoProDB');
    this.version(1).stores({
      user_profile: 'id',                 // Perfil único: biometria, preferências, nível, foco
      active_plan: 'id',                  // Plano de treino e dieta atualmente gerado
      workout_logs: 'id, date, workoutId, exerciseId', // Histórico de execução de treinos e cargas
      weekly_checks: 'id, weekKey',       // Registro de dias concluídos na semana
      custom_exercises: 'id, muscleGroup' // Exercícios adicionados manualmente pelo usuário
    });
  }
}

export const db = new TreinoDatabase();
