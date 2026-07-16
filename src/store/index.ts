import { create } from 'zustand';
import type { Vegetable, TaskRecord, PhotoRecord, WeatherData, AppSettings } from '../types';
import { db, getSettings, saveSettings } from '../db';

interface AppState {
  // 野菜
  vegetables: Vegetable[];
  loadVegetables: () => Promise<void>;
  addVegetable: (v: Vegetable) => Promise<void>;
  updateVegetable: (id: string, updates: Partial<Vegetable>) => Promise<void>;
  deleteVegetable: (id: string) => Promise<void>;

  // タスク記録
  taskRecords: TaskRecord[];
  loadTaskRecords: (vegetableId?: string) => Promise<void>;
  addTaskRecord: (record: TaskRecord) => Promise<void>;

  // 写真記録
  photoRecords: PhotoRecord[];
  loadPhotoRecords: () => Promise<void>;
  addPhotoRecord: (record: PhotoRecord) => Promise<void>;

  // 天気
  weather: WeatherData | null;
  setWeather: (data: WeatherData) => void;

  // 設定
  settings: AppSettings | null;
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;

  // 選択中の野菜（詳細表示用）
  selectedVegetableId: string | null;
  setSelectedVegetableId: (id: string | null) => void;

  // 登録モーダル
  isAddVegetableOpen: boolean;
  setIsAddVegetableOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  vegetables: [],
  taskRecords: [],
  photoRecords: [],
  weather: null,
  settings: null,
  selectedVegetableId: null,
  isAddVegetableOpen: false,

  loadVegetables: async () => {
    const vegetables = await db.vegetables.orderBy('updatedAt').reverse().toArray();
    set({ vegetables });
  },

  addVegetable: async (v: Vegetable) => {
    await db.vegetables.put(v);
    await get().loadVegetables();
  },

  updateVegetable: async (id: string, updates: Partial<Vegetable>) => {
    const existing = await db.vegetables.get(id);
    if (existing) {
      await db.vegetables.put({
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      await get().loadVegetables();
    }
  },

  deleteVegetable: async (id: string) => {
    await db.vegetables.delete(id);
    await db.taskRecords.where('vegetableId').equals(id).delete();
    await db.photoRecords.where('vegetableId').equals(id).delete();
    await get().loadVegetables();
  },

  loadTaskRecords: async (vegetableId?: string) => {
    let records: TaskRecord[];
    if (vegetableId) {
      records = await db.taskRecords
        .where('vegetableId').equals(vegetableId)
        .sortBy('date');
    } else {
      records = await db.taskRecords.orderBy('date').reverse().limit(100).toArray();
    }
    set({ taskRecords: records });
  },

  addTaskRecord: async (record: TaskRecord) => {
    await db.taskRecords.put(record);
    await get().loadTaskRecords();
  },

  loadPhotoRecords: async () => {
    const photoRecords = await db.photoRecords.orderBy('date').toArray();
    set({ photoRecords });
  },

  addPhotoRecord: async (record: PhotoRecord) => {
    await db.photoRecords.put(record);
    await get().loadPhotoRecords();
  },

  setWeather: (data: WeatherData) => set({ weather: data }),

  loadSettings: async () => {
    const settings = await getSettings();
    set({ settings });
  },

  updateSettings: async (updates: Partial<AppSettings>) => {
    await saveSettings(updates);
    await get().loadSettings();
  },

  setSelectedVegetableId: (id) => set({ selectedVegetableId: id }),
  setIsAddVegetableOpen: (open) => set({ isAddVegetableOpen: open }),
}));
