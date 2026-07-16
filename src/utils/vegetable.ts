import { differenceInDays, format, addDays, parseISO } from 'date-fns';
import type { Vegetable } from '../types';
import { GROWTH_STAGE_ORDER, type GrowthStage } from '../types';
import { getVegetableMasterByName } from '../data/vegetables';

/**
 * 植え付けからの日数を計算
 */
export function getDaysFromPlanting(vegetable: Vegetable): number {
  const planted = parseISO(vegetable.plantedAt);
  return differenceInDays(new Date(), planted);
}

/**
 * 成長進捗率（0〜100）を計算
 */
export function getGrowthProgress(vegetable: Vegetable): number {
  const master = getVegetableMasterByName(vegetable.name);
  if (!master) {
    const stageIndex = GROWTH_STAGE_ORDER.indexOf(vegetable.currentStage);
    return Math.round((stageIndex / (GROWTH_STAGE_ORDER.length - 1)) * 100);
  }

  const daysFromPlanting = getDaysFromPlanting(vegetable);
  const harvestDays = master.daysToHarvest.min;
  return Math.min(100, Math.round((daysFromPlanting / harvestDays) * 100));
}

/**
 * 次のステージを取得
 */
export function getNextStage(currentStage: GrowthStage): GrowthStage | null {
  const idx = GROWTH_STAGE_ORDER.indexOf(currentStage);
  if (idx === -1 || idx >= GROWTH_STAGE_ORDER.length - 1) return null;
  return GROWTH_STAGE_ORDER[idx + 1];
}

/**
 * 今日のタスクを取得
 */
export function getTodayTasks(vegetable: Vegetable): string[] {
  const master = getVegetableMasterByName(vegetable.name);
  if (!master) return ['水やりを確認する'];

  const days = getDaysFromPlanting(vegetable);
  const tasks: string[] = [];

  for (const task of master.taskSchedule) {
    if (days < task.startDayFromPlanting) continue;
    if (task.intervalDays === 0) continue; // 一回限りのタスクはスキップ
    const daysSinceStart = days - task.startDayFromPlanting;
    if (daysSinceStart % task.intervalDays === 0) {
      switch (task.type) {
        case 'water': tasks.push('水やり'); break;
        case 'fertilize': tasks.push('追肥'); break;
        case 'pest': tasks.push('害虫確認'); break;
        case 'harvest': tasks.push('収穫'); break;
      }
    }
  }

  return tasks.length > 0 ? tasks : [];
}

/**
 * 収穫予定日を計算
 */
export function estimateHarvestDate(vegetable: Vegetable): string | null {
  if (vegetable.harvestEstimate) return vegetable.harvestEstimate;

  const master = getVegetableMasterByName(vegetable.name);
  if (!master) return null;

  const planted = parseISO(vegetable.plantedAt);
  const harvestDate = addDays(planted, master.daysToHarvest.min);
  return format(harvestDate, 'yyyy-MM-dd');
}

/**
 * 収穫まであと何日か計算
 */
export function getDaysToHarvest(vegetable: Vegetable): number | null {
  const harvestDate = estimateHarvestDate(vegetable);
  if (!harvestDate) return null;
  return differenceInDays(parseISO(harvestDate), new Date());
}

/**
 * 日付フォーマット (M月d日)
 */
export function formatDateJP(dateStr: string): string {
  return format(parseISO(dateStr), 'M月d日');
}

/**
 * 今日の日付 (YYYY-MM-DD)
 */
export function today(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * IDを生成
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * ステータスカラー（成長度合い）
 */
export function getStatusColor(progress: number): string {
  if (progress >= 90) return 'text-yamabuki';
  if (progress >= 60) return 'text-wakatake';
  if (progress < 10) return 'text-gray-400';
  return 'text-wakatake';
}

/**
 * 背景ステータスカラー
 */
export function getStatusBgColor(progress: number): string {
  if (progress >= 90) return 'bg-amber-100';
  return 'bg-green-50';
}
