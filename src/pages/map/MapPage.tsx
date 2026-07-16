import { useRef, useState, useEffect } from 'react';
import { Plus, Move, Info } from 'lucide-react';
import { useAppStore } from '../../store';
import type { Vegetable } from '../../types';
import { getGrowthProgress, getDaysToHarvest } from '../../utils/vegetable';

/**
 * 畑マップ
 * - 畑を上から見たレイアウト
 * - ドラッグ＆ドロップで野菜を配置
 * - 色で成長状況を表示（緑=順調 / 黄=もうすぐ収穫 / 灰=未配置）
 */

// 野菜の状態色を判定
function getStatusStyle(veg: Vegetable): { bg: string; border: string; label: string } {
  const progress = getGrowthProgress(veg);
  const daysToHarvest = getDaysToHarvest(veg);

  if (daysToHarvest !== null && daysToHarvest <= 0) {
    return { bg: 'bg-amber-100', border: 'border-yamabuki', label: '収穫時期' };
  }
  if (daysToHarvest !== null && daysToHarvest <= 14) {
    return { bg: 'bg-yellow-50', border: 'border-yellow-400', label: 'もうすぐ収穫' };
  }
  if (progress < 10) {
    return { bg: 'bg-gray-50', border: 'border-gray-300', label: '育成初期' };
  }
  return { bg: 'bg-green-50', border: 'border-wakatake', label: '順調' };
}

const VEGGIE_EMOJIS: Record<string, string> = {
  'トマト': '🍅', 'ミニトマト': '🍅', 'きゅうり': '🥒', 'ナス': '🍆',
  'ピーマン': '🫑', 'とうもろこし': '🌽', '枝豆': '🫘', 'じゃがいも': '🥔',
  'さつまいも': '🍠', 'にんじん': '🥕', '大根': '🫚', '玉ねぎ': '🧅',
  'キャベツ': '🥬', 'レタス': '🥬', 'ほうれん草': '🥬', 'ブロッコリー': '🥦',
  '白菜': '🥬', 'ねぎ': '🧅', 'いちご': '🍓', 'かぼちゃ': '🎃',
  'バジル': '🌿', 'パセリ': '🌿', '大葉（しそ）': '🌿', 'こまつな': '🥬',
  'みずな': '🥬', '万能ねぎ': '🧅', 'にんにく': '🧄', 'すいか': '🍉',
  'メロン': '🍈', 'オクラ': '🌿', 'しょうが': '🫚',
};

export function MapPage() {
  const { vegetables, updateVegetable, setSelectedVegetableId } = useAppStore();
  const fieldRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [showHint, setShowHint] = useState(true);

  const activeVegetables = vegetables.filter(v => v.currentStage !== 'finished');
  const placedVegs = activeVegetables.filter(v => v.mapX !== undefined && v.mapY !== undefined);
  const unplacedVegs = activeVegetables.filter(v => v.mapX === undefined || v.mapY === undefined);

  useEffect(() => {
    const dismissed = localStorage.getItem('map_hint_dismissed') === '1';
    setShowHint(!dismissed && activeVegetables.length > 0);
  }, [activeVegetables.length]);

  // フィールド内の相対座標（%）を計算
  const getRelativePos = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const field = fieldRef.current;
    if (!field) return null;
    const rect = field.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    // カードがはみ出さないよう 5〜95% にクランプ
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(8, Math.min(92, y)),
    };
  };

  /* === ドラッグ処理（Pointer Events） === */
  const handlePointerDown = (e: React.PointerEvent, vegId: string) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDraggingId(vegId);
    const pos = getRelativePos(e.clientX, e.clientY);
    if (pos) setDragPos(pos);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId) return;
    const pos = getRelativePos(e.clientX, e.clientY);
    if (pos) setDragPos(pos);
  };

  const handlePointerUp = async () => {
    if (draggingId && dragPos) {
      await updateVegetable(draggingId, { mapX: dragPos.x, mapY: dragPos.y });
    }
    setDraggingId(null);
    setDragPos(null);
  };

  // 未配置の野菜をマップに追加（自動でランダム空き位置に）
  const handlePlaceVegetable = async (vegId: string) => {
    const x = 15 + Math.random() * 70;
    const y = 15 + Math.random() * 70;
    await updateVegetable(vegId, { mapX: x, mapY: y });
  };

  const dismissHint = () => {
    localStorage.setItem('map_hint_dismissed', '1');
    setShowHint(false);
  };

  return (
    <div className="flex flex-col h-full bg-bg-base">
      {/* ヘッダー */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-5 pt-4 pb-3 safe-top">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-gray-800">畑マップ</h1>
          <div className="flex items-center gap-3 text-xs">
            <LegendDot color="bg-wakatake" label="順調" />
            <LegendDot color="bg-yellow-400" label="もうすぐ" />
            <LegendDot color="bg-yamabuki" label="収穫" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-28">
        <div className="px-5 py-4 space-y-4">

          {/* ヒント */}
          {showHint && (
            <div className="flex items-start gap-2 bg-blue-50 rounded-xl border border-blue-100 p-3">
              <Info size={14} className="text-asagi mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-600 leading-relaxed">
                  野菜カードを長押ししてドラッグすると、実際の畑の配置に合わせて自由に動かせます
                </p>
              </div>
              <button onClick={dismissHint} className="text-xs text-asagi font-medium flex-shrink-0">
                OK
              </button>
            </div>
          )}

          {/* 畑エリア */}
          <div
            ref={fieldRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative w-full rounded-card border-2 border-dashed border-[#C9BFA8] overflow-hidden touch-none select-none"
            style={{
              aspectRatio: '4 / 5',
              background: 'repeating-linear-gradient(0deg, #EFE9DA 0px, #EFE9DA 38px, #E9E2D0 38px, #E9E2D0 40px)',
            }}
          >
            {/* 畝ラベル */}
            <div className="absolute top-2 left-3 text-[10px] text-[#A89B7E] font-medium tracking-wide">
              うちの畑
            </div>

            {placedVegs.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <span className="text-3xl opacity-40">🌱</span>
                <p className="text-xs text-[#A89B7E]">下のリストから野菜を配置しましょう</p>
              </div>
            )}

            {/* 配置済み野菜カード */}
            {placedVegs.map(veg => {
              const isDragging = draggingId === veg.id;
              const pos = isDragging && dragPos
                ? dragPos
                : { x: veg.mapX!, y: veg.mapY! };
              const status = getStatusStyle(veg);
              const emoji = VEGGIE_EMOJIS[veg.name] ?? '🌱';

              return (
                <div
                  key={veg.id}
                  onPointerDown={e => handlePointerDown(e, veg.id)}
                  onClick={() => {
                    if (!isDragging) setSelectedVegetableId(veg.id);
                  }}
                  className={`absolute flex flex-col items-center cursor-grab active:cursor-grabbing transition-shadow ${
                    isDragging ? 'z-20 scale-110 drop-shadow-lg' : 'z-10'
                  }`}
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: 'translate(-50%, -50%)',
                    transition: isDragging ? 'none' : 'left 0.2s, top 0.2s',
                  }}
                >
                  <div className={`w-14 h-14 rounded-2xl ${status.bg} border-2 ${status.border} flex items-center justify-center shadow-soft`}>
                    <span className="text-2xl">{emoji}</span>
                  </div>
                  <span className="mt-1 text-[10px] font-medium text-gray-600 bg-white/80 px-1.5 py-0.5 rounded-full whitespace-nowrap max-w-[72px] truncate">
                    {veg.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 未配置の野菜 */}
          {unplacedVegs.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 px-1">
                まだ配置していない野菜
              </p>
              <div className="space-y-2">
                {unplacedVegs.map(veg => {
                  const emoji = VEGGIE_EMOJIS[veg.name] ?? '🌱';
                  return (
                    <div
                      key={veg.id}
                      className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-soft px-4 py-3"
                    >
                      <span className="text-xl">{emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{veg.name}</p>
                        <p className="text-xs text-gray-400">
                          {veg.location === 'field' ? '畑' : 'プランター'}
                        </p>
                      </div>
                      <button
                        onClick={() => handlePlaceVegetable(veg.id)}
                        className="flex items-center gap-1 text-xs font-medium text-wakatake bg-green-50 px-3 py-2 rounded-full active:scale-95 transition-transform"
                      >
                        <Plus size={12} />
                        <span>配置する</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 配置済みステータス一覧 */}
          {placedVegs.length > 0 && (
            <div className="bg-white rounded-card border border-gray-100 shadow-soft p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Move size={13} className="text-gray-400" />
                <p className="text-xs font-semibold text-gray-500">配置済みの野菜</p>
              </div>
              <div className="space-y-2">
                {placedVegs.map(veg => {
                  const status = getStatusStyle(veg);
                  return (
                    <button
                      key={veg.id}
                      onClick={() => setSelectedVegetableId(veg.id)}
                      className="w-full flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full border-2 ${status.border} ${status.bg}`} />
                        <span className="text-sm text-gray-700">{veg.name}</span>
                      </div>
                      <span className="text-xs text-gray-400">{status.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 空状態 */}
          {activeVegetables.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">育てている野菜がありません</p>
              <p className="text-xs text-gray-300 mt-1">ホームから野菜を登録しましょう</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-gray-400">{label}</span>
    </div>
  );
}
