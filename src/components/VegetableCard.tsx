import { ChevronRight, Leaf, CalendarDays } from 'lucide-react';
import type { Vegetable } from '../types';
import { GROWTH_STAGE_LABELS } from '../types';
import { ProgressBar } from './ProgressBar';
import { getGrowthProgress, getDaysToHarvest, estimateHarvestDate, formatDateJP } from '../utils/vegetable';


interface VegetableCardProps {
  vegetable: Vegetable;
  onClick?: () => void;
}

export function VegetableCard({ vegetable, onClick }: VegetableCardProps) {
  const progress = getGrowthProgress(vegetable);
  const daysToHarvest = getDaysToHarvest(vegetable);
  const harvestDate = estimateHarvestDate(vegetable);

  const isNearHarvest = daysToHarvest !== null && daysToHarvest <= 14 && daysToHarvest >= 0;
  const isHarvesting = vegetable.currentStage === 'harvest';

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-card shadow-soft border border-gray-100 p-4 active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start gap-3">
        {/* 写真 or プレースホルダー */}
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-green-50 flex-shrink-0 flex items-center justify-center">
          {vegetable.photoUrl ? (
            <img
              src={vegetable.photoUrl}
              alt={vegetable.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Leaf size={28} className="text-wakatake" />
          )}
        </div>

        {/* 情報 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-base text-gray-900 truncate">{vegetable.name}</h3>
            <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
          </div>

          {/* ステージバッジ */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isHarvesting
                ? 'bg-amber-100 text-amber-700'
                : 'bg-green-50 text-wakatake'
            }`}>
              {GROWTH_STAGE_LABELS[vegetable.currentStage]}
            </span>
            {isNearHarvest && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
                収穫まであと{daysToHarvest}日
              </span>
            )}
          </div>

          {/* プログレスバー */}
          <ProgressBar
            value={progress}
            color={isNearHarvest || isHarvesting ? 'amber' : 'green'}
            className="mb-2"
          />

          {/* 収穫予定日 */}
          {harvestDate && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <CalendarDays size={11} />
              <span>収穫予定：{formatDateJP(harvestDate)}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export function VegetableCardSkeleton() {
  return (
    <div className="w-full bg-white rounded-card shadow-soft border border-gray-100 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-gray-100 rounded w-24 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-16 mb-2" />
          <div className="h-2 bg-gray-100 rounded w-full mb-2" />
          <div className="h-3 bg-gray-100 rounded w-32" />
        </div>
      </div>
    </div>
  );
}
