import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { mount, flushPromises } from '@vue/test-utils';
import { TreinoDatabase } from '../../src/db/index.js';
import BodyProgressModal from '../../src/components/BodyProgressModal.vue';
import { saveBodyEntry, listBodyEntries, addProgressPhoto, listProgressPhotos, deleteProgressPhoto } from '../../src/db/bodyProgress.js';

let database;
let n = 0;
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  database = new TreinoDatabase(`BodyTest-${++n}`);
});
afterEach(() => database.close());

describe('db/bodyProgress', () => {
  it('uma medição por dia (salvar de novo substitui) e recusa linha vazia', async () => {
    await saveBodyEntry({ date: '2026-03-01', weightKg: 80 }, { database });
    await saveBodyEntry({ date: '2026-03-01', weightKg: 79.5, waistCm: 88 }, { database });
    const rows = await listBodyEntries({ database });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ weightKg: 79.5, waistCm: 88 });
    await expect(saveBodyEntry({ date: '2026-03-02' }, { database })).rejects.toThrow();
  });

  it('fotos: grava Blob, lista por data e exclui', async () => {
    const id = await addProgressPhoto({ date: '2026-03-01', blob: new Blob(['x'], { type: 'image/jpeg' }) }, { database });
    expect((await listProgressPhotos({ database }))).toHaveLength(1);
    await deleteProgressPhoto(id, { database });
    expect((await listProgressPhotos({ database }))).toHaveLength(0);
  });
});

function localDate(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

describe('BodyProgressModal', () => {
  function entriesFor(weights) {
    return Promise.all(weights.map((w, i) => saveBodyEntry({
      // Datas recentes: o ajuste só considera as últimas 4 semanas.
      date: localDate(Date.now() - (weights.length - 1 - i) * 3 * 86_400_000),
      weightKg: w
    }, { database })));
  }

  it('salva medição pelo formulário e mostra no histórico', async () => {
    const w = mount(BodyProgressModal, { props: { isOpen: true, database, targetCalories: 2000 } });
    await flushPromises();
    await w.find('#input-body-weight').setValue('81.2');
    await w.find('#input-body-waistCm').setValue('90');
    await w.find('#form-body-entry').trigger('submit');
    await vi.waitFor(() => expect(w.find('#body-entry-list').text()).toContain('81.2 kg'));
    expect(w.emitted('entries-changed')).toBeTruthy();
  });

  it('com tendência estável no emagrecimento sugere reduzir e aplica rebalanceando macros', async () => {
    await entriesFor([80, 80.1, 79.9, 80, 80.05, 79.95]);
    const w = mount(BodyProgressModal, {
      props: { isOpen: true, database, goal: 'weight_loss', targetCalories: 2000, macros: { proteinGrams: 160, carbsGrams: 200, fatGrams: 60 } }
    });
    await vi.waitFor(() => expect(w.find('#body-weight-chart').exists()).toBe(true));
    await w.find('#modal-body-progress-tab-diet').trigger('click');
    expect(w.find('#diet-adjustment').text()).toContain('-150');
    await w.find('#btn-apply-diet-adjustment').trigger('click');
    const [macros] = w.emitted('apply-calories')[0];
    expect(macros).toEqual({ targetCalories: 1850, proteinGrams: 160, fatGrams: 60, carbsGrams: Math.round((1850 - 640 - 540) / 4) });
  });
});
