import Dexie, { type Table } from 'dexie';
import type { Vegetable, TaskRecord, PhotoRecord, AppSettings } from '../types';

export class HatakeDB extends Dexie {
  vegetables!: Table<Vegetable>;
  taskRecords!: Table<TaskRecord>;
  photoRecords!: Table<PhotoRecord>;
  settings!: Table<AppSettings & { id: string }>;

  constructor() {
    super('HatakeGoyomi');

    this.version(1).stores({
      vegetables: 'id, name, currentStage, plantedAt, updatedAt',
      taskRecords: 'id, vegetableId, date, taskType, createdAt',
      photoRecords: 'id, vegetableId, date, createdAt',
      settings: 'id',
    });
  }
}

export const db = new HatakeDB();

// デフォルト設定を初期化
export async function initSettings(): Promise<void> {
  const existing = await db.settings.get('app');
  if (!existing) {
    await db.settings.put({
      id: 'app',
      prefectureCode: '47', // デフォルト: 沖縄
      notificationEnabled: false,
      notificationTime: '08:00',
      fontSize: 'normal',
      theme: 'auto',
    });
  }
}

export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.get('app');
  if (settings && !settings.theme) settings.theme = 'auto'; // 旧バージョンからの移行
  return settings ?? {
    prefectureCode: '13',
    notificationEnabled: false,
    notificationTime: '08:00',
    fontSize: 'normal',
    theme: 'auto',
  };
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const current = await getSettings();
  await db.settings.put({ id: 'app', ...current, ...settings });
}
