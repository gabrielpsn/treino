import { db } from '../db/index.js';
import { buildBackup, parseBackupText, summarizeBackup } from '../db/backup.js';
import { filterSafeExercises } from '../engine/generators/workoutGenerator.js';
import { normalizeVideoUrl, saveExerciseVideo } from '../engine/exerciseMedia.js';
import { loadCloudAccount, pushSnapshot, uploadStudentSummary } from '../services/cloud.js';

/**
 * Ações que aplicam no app o que vem de fora: ajuste de dieta, ficha do
 * personal, backup da nuvem e o sync automático após cada treino.
 */
export function useOnlineActions({
  activePlan, userProfile, persistOrReport, reportStorageError, initCustomNutritionForm,
  isBodyProgressOpen, isTrainerOpen, isCloudSyncOpen, currentMainTab, currentSplitTab,
  aiPlanMessage, activeMuscleFilter, loadLastSets, studentSummary,
  pendingBackup, pendingBackupSummary, pendingBackupFileName, pendingBackupWarnings, isBackupImportOpen
}) {
  async function handleApplyCalories(macros) {
    if (!activePlan.value) return;
    const rawPlan = JSON.parse(JSON.stringify(activePlan.value));
    rawPlan.customNutrition = { enabled: true, ...macros };
    const ok = await persistOrReport('Não foi possível aplicar a nova meta calórica.', () => db.active_plan.put(rawPlan));
    if (!ok) return;
    activePlan.value = rawPlan;
    initCustomNutritionForm();
    isBodyProgressOpen.value = false;
    currentMainTab.value = 'nutrition';
  }

  async function handleAcceptTrainerPlan({ workoutSplits, className }) {
    if (!activePlan.value) return;
    const profile = userProfile.value || {};
    let removed = 0;
    const safeSplits = (workoutSplits || [])
      .filter(split => split && split.id)
      .map(split => {
        const exercises = (split.exercises || []).filter(ex => ex && ex.id);
        // A ficha vem de outro aparelho: passa pelo mesmo filtro articular e de
        // equipamento do aluno, como qualquer outra origem de plano.
        const safe = filterSafeExercises(exercises, {
          restrictions: profile.restrictions || [],
          equipment: profile.equipment || 'gym'
        });
        removed += exercises.length - safe.length;
        return { ...split, exercises: safe };
      })
      .filter(split => split.exercises.length > 0);

    if (safeSplits.length === 0) {
      reportStorageError('A ficha do personal não tem exercícios compatíveis com suas restrições ou equipamento.', null);
      return;
    }

    for (const split of safeSplits) {
      for (const ex of split.exercises) {
        const video = normalizeVideoUrl(ex.videoUrl);
        if (video.ok && video.value) saveExerciseVideo(ex.id, video.value);
      }
    }

    const rawPlan = JSON.parse(JSON.stringify(activePlan.value));
    rawPlan.workoutSplits = JSON.parse(JSON.stringify(safeSplits));
    rawPlan.planSource = 'trainer';
    rawPlan.trainerName = String(className || '').slice(0, 40);
    const ok = await persistOrReport('Não foi possível salvar a ficha do personal.', () => db.active_plan.put(rawPlan));
    if (!ok) return;

    activePlan.value = rawPlan;
    // O aviso da última tentativa de IA não descreve mais a ficha ativa.
    aiPlanMessage.value = null;
    activeMuscleFilter.value = {};
    currentSplitTab.value = rawPlan.workoutSplits[0].id;
    await loadLastSets();
    isTrainerOpen.value = false;
    currentMainTab.value = 'workout';
    if (removed > 0) {
      reportStorageError(`${removed} exercício(s) da ficha do personal conflitavam com suas restrições ou equipamento e foram removidos.`, null);
    }
  }

  function handleCloudRestore(backupObject) {
    const parsed = parseBackupText(JSON.stringify(backupObject));
    if (!parsed.ok) {
      reportStorageError(`Backup da nuvem inválido: ${parsed.error}`, null);
      return;
    }
    isCloudSyncOpen.value = false;
    // Mesmo caminho do arquivo: o usuário confere o que será substituído antes.
    pendingBackup.value = parsed.backup;
    pendingBackupSummary.value = summarizeBackup(parsed.backup);
    pendingBackupFileName.value = 'Backup na nuvem';
    pendingBackupWarnings.value = parsed.warnings;
    isBackupImportOpen.value = true;
  }

  // Depois de cada treino: envia o backup para a nuvem e atualiza o resumo do
  // aluno, se o usuário ativou os recursos online. Falha aqui nunca atrapalha o treino.
  async function autoCloudSync() {
    const account = loadCloudAccount();
    if (!account) return;
    try {
      await pushSnapshot(account, await buildBackup());
    } catch (err) {
      console.warn('Sync automático pendente:', err?.message ?? err);
    }
    uploadStudentSummary(account, studentSummary.value).catch(() => {});
  }

  return { handleApplyCalories, handleAcceptTrainerPlan, handleCloudRestore, autoCloudSync };
}
