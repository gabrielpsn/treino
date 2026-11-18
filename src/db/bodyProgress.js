/**
 * Persistência de medições corporais e fotos de progresso (IndexedDB).
 *
 * Fotos ficam SÓ no aparelho: não entram no backup em arquivo nem na nuvem.
 * São dados sensíveis e pesados demais para um JSON.
 */
import { db } from './index.js';
import { normalizeBodyEntry, sortEntries } from '../engine/bodyProgress.js';

export async function listBodyEntries({ database = db } = {}) {
  return sortEntries(await database.body_metrics.toArray());
}

export async function saveBodyEntry(raw, { database = db } = {}) {
  const entry = normalizeBodyEntry({ ...raw, updatedAt: new Date().toISOString() });
  if (!entry) throw new Error('Informe a data e pelo menos uma medida.');
  await database.body_metrics.put(entry);
  return entry;
}

export async function deleteBodyEntry(id, { database = db } = {}) {
  await database.body_metrics.delete(id);
}

export async function listProgressPhotos({ database = db } = {}) {
  const rows = await database.progress_photos.toArray();
  return rows.sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

export async function addProgressPhoto({ date, blob, pose = 'frente', note = '' }, { database = db } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) throw new Error('Data inválida.');
  if (!(blob instanceof Blob)) throw new Error('Imagem inválida.');
  const id = await database.progress_photos.add({
    date,
    blob,
    pose: String(pose).slice(0, 20),
    note: String(note).slice(0, 200),
    createdAt: new Date().toISOString()
  });
  return id;
}

export async function deleteProgressPhoto(id, { database = db } = {}) {
  await database.progress_photos.delete(id);
}
