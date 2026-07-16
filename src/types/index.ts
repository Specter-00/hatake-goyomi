// 野菜の成長ステージ
export type GrowthStage =
  | 'seed'       // 種
  | 'sprout'     // 発芽
  | 'seedling'   // 本葉
  | 'transplant' // 植え替え
  | 'support'    // 支柱
  | 'flowering'  // 開花
  | 'fruiting'   // 結実
  | 'harvest'    // 収穫
  | 'finished';  // 終了

export const GROWTH_STAGE_LABELS: Record<GrowthStage, string> = {
  seed: '種まき',
  sprout: '発芽',
  seedling: '本葉',
  transplant: '植え替え',
  support: '支柱立て',
  flowering: '開花',
  fruiting: '結実',
  harvest: '収穫',
  finished: '終了',
};

export const GROWTH_STAGE_ORDER: GrowthStage[] = [
  'seed', 'sprout', 'seedling', 'transplant',
  'support', 'flowering', 'fruiting', 'harvest', 'finished',
];

// 野菜の登録データ
export interface Vegetable {
  id: string;
  name: string;
  variety: string;       // 品種
  plantedAt: string;     // 植え付け日 (YYYY-MM-DD)
  seedType: 'seed' | 'seedling'; // 種 or 苗
  location: 'field' | 'planter'; // 畑 or プランター
  sunlight: 'full' | 'partial' | 'shade'; // 日当たり
  prefectureCode: string; // 都道府県コード
  memo: string;
  photoUrl?: string;
  currentStage: GrowthStage;
  harvestEstimate?: string; // 収穫予定日 (YYYY-MM-DD)
  mapX?: number;  // 畑マップX座標
  mapY?: number;  // 畑マップY座標
  mapW?: number;  // 幅
  mapH?: number;  // 高さ
  createdAt: string;
  updatedAt: string;
}

// 作業記録
export type TaskType =
  | 'water'     // 水やり
  | 'fertilize' // 追肥
  | 'support'   // 支柱
  | 'harvest'   // 収穫
  | 'pest'      // 害虫確認
  | 'disease'   // 病気
  | 'medicine'  // 薬剤
  | 'photo'     // 写真追加
  | 'other';    // その他

export const TASK_LABELS: Record<TaskType, string> = {
  water: '水やり',
  fertilize: '追肥',
  support: '支柱',
  harvest: '収穫',
  pest: '害虫確認',
  disease: '病気',
  medicine: '薬剤',
  photo: '写真',
  other: 'その他',
};

export interface TaskRecord {
  id: string;
  vegetableId: string;
  date: string; // YYYY-MM-DD
  taskType: TaskType;
  note: string;
  photoUrl?: string;
  harvestAmount?: number; // 収穫量(g)
  harvestCount?: number;  // 収穫数(個)
  createdAt: string;
}

// 写真記録
export interface PhotoRecord {
  id: string;
  vegetableId: string;
  date: string;
  photoUrl: string;
  caption: string;
  createdAt: string;
}

// 天気データ
export interface WeatherData {
  temperature: number;
  feelsLike: number;
  weatherCode: number;
  windSpeed: number;
  precipitationProbability: number;
  dailyMax: number;
  dailyMin: number;
  weekly: WeatherDay[];
  fetchedAt: string;
  fetchedLat?: number;
  fetchedLon?: number;
}

export interface WeatherDay {
  date: string;
  weatherCode: number;
  maxTemp: number;
  minTemp: number;
  precipProb: number;
}

// 都道府県
export interface Prefecture {
  code: string;
  name: string;
  lat: number;
  lon: number;
  region: 'hokkaido' | 'tohoku' | 'kanto' | 'chubu' | 'kinki' | 'chugoku' | 'shikoku' | 'kyushu';
}

// 野菜マスターデータ
export interface VegetableMaster {
  id: string;
  name: string;
  kana: string;        // ひらがな読み（検索用）
  emoji: string;
  category: string;
  difficulty: 1 | 2 | 3; // 1=かんたん 2=ふつう 3=むずかしい
  daysToHarvest: { min: number; max: number };
  sowingMonths: number[]; // 1-12
  plantingMonths: number[]; // 1-12 (苗の植え付け)
  harvestMonths: number[];
  stages: {
    stage: GrowthStage;
    daysFromStart: number;
  }[];
  taskSchedule: {
    type: TaskType;
    intervalDays: number;
    startDayFromPlanting: number;
  }[];
  tips: string[];
}

// アプリ設定
export interface AppSettings {
  prefectureCode: string;
  notificationEnabled: boolean;
  notificationTime: string; // HH:mm
  fontSize: 'normal' | 'large' | 'xlarge';
  theme: 'light' | 'dark' | 'auto';
  useCurrentLocation?: boolean; // 現在地の座標で天気を取得するか
  customLat?: number;
  customLon?: number;
}

// 初回起動フラグ
export interface OnboardingState {
  completed: boolean;
  completedAt?: string;
}

// 難易度（1=かんたん / 2=ふつう / 3=むずかしい）
export type Difficulty = 1 | 2 | 3;
