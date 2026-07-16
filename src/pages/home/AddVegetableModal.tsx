import { useState } from 'react';
import { X, Search, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store';
import {
  VEGETABLE_MASTERS, VEGETABLE_CATEGORIES,
  matchesVegetable, isPlantableThisMonth, DIFFICULTY_LABELS,
} from '../../data/vegetables';
import type { VegetableMaster } from '../../types';
import { generateId, today } from '../../utils/vegetable';
import type { Vegetable } from '../../types';

interface AddVegetableModalProps {
  onClose: () => void;
}

type Step = 'select' | 'detail';

export function AddVegetableModal({ onClose }: AddVegetableModalProps) {
  const { addVegetable, settings } = useAppStore();
  const [step, setStep] = useState<Step>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMaster, setSelectedMaster] = useState<VegetableMaster | null>(null);
  const [plantableOnly, setPlantableOnly] = useState(false);
  const [easyOnly, setEasyOnly] = useState(false);
  const currentMonth = new Date().getMonth() + 1;

  // フォームデータ
  const [plantedAt, setPlantedAt] = useState(today());
  const [seedType, setSeedType] = useState<'seed' | 'seedling'>('seedling');
  const [location, setLocation] = useState<'field' | 'planter'>('field');
  const [sunlight, setSunlight] = useState<'full' | 'partial' | 'shade'>('full');
  const [variety, setVariety] = useState('');
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);

  // 野菜フィルター
  const filtered = VEGETABLE_MASTERS.filter(v => {
    const matchesSearch = matchesVegetable(v, searchQuery);
    const matchesCategory = selectedCategory === null || v.category === selectedCategory;
    const matchesSeason = !plantableOnly || isPlantableThisMonth(v);
    const matchesEasy = !easyOnly || v.difficulty === 1;
    return matchesSearch && matchesCategory && matchesSeason && matchesEasy;
  });

  const handleSelectMaster = (master: VegetableMaster) => {
    setSelectedMaster(master);
    setStep('detail');
  };

  const handleSave = async () => {
    if (!selectedMaster || saving) return;
    setSaving(true);

    const vegetable: Vegetable = {
      id: generateId(),
      name: selectedMaster.name,
      variety,
      plantedAt,
      seedType,
      location,
      sunlight,
      prefectureCode: settings?.prefectureCode ?? '13',
      memo,
      currentStage: seedType === 'seed' ? 'seed' : 'seedling',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addVegetable(vegetable);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg-base">
      {/* ヘッダー */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3 safe-top">
        {step === 'detail' ? (
          <button onClick={() => setStep('select')} className="p-1 -ml-1">
            <ChevronRight size={20} className="text-gray-400 rotate-180" />
          </button>
        ) : (
          <div className="w-7" />
        )}
        <h1 className="flex-1 text-center text-base font-semibold text-gray-800">
          {step === 'select' ? '野菜を選ぶ' : `${selectedMaster?.name}を登録`}
        </h1>
        <button onClick={onClose} className="p-1 -mr-1">
          <X size={20} className="text-gray-400" />
        </button>
      </div>

      {step === 'select' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 検索 */}
          <div className="flex-shrink-0 px-5 py-3 bg-white border-b border-gray-50">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <Search size={15} className="text-gray-400" />
              <input
                type="text"
                placeholder="野菜を検索..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
              />
            </div>
          </div>

          {/* 特別フィルター */}
          <div className="flex-shrink-0 px-5 pt-2 flex gap-2">
            <button
              onClick={() => setPlantableOnly(!plantableOnly)}
              className={`flex-1 text-xs py-2 rounded-xl font-medium border transition-colors ${
                plantableOnly
                  ? 'bg-yamabuki text-white border-yamabuki'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              🌱 {currentMonth}月にまける野菜
            </button>
            <button
              onClick={() => setEasyOnly(!easyOnly)}
              className={`flex-1 text-xs py-2 rounded-xl font-medium border transition-colors ${
                easyOnly
                  ? 'bg-wakatake text-white border-wakatake'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              ✨ かんたんな野菜だけ
            </button>
          </div>

          {/* カテゴリタブ */}
          <div className="flex-shrink-0 px-5 py-2 overflow-x-auto flex gap-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-wakatake text-white'
                  : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              すべて
            </button>
            {VEGETABLE_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-wakatake text-white'
                    : 'bg-white text-gray-500 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 野菜リスト */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-2">
            <div className="grid grid-cols-3 gap-3 pb-8">
              {filtered.map(master => (
                <button
                  key={master.id}
                  onClick={() => handleSelectMaster(master)}
                  className="relative flex flex-col items-center gap-1 bg-white rounded-card shadow-soft border border-gray-100 p-3 active:scale-95 transition-transform"
                >
                  {isPlantableThisMonth(master) && (
                    <span className="absolute top-1.5 right-1.5 text-[9px] font-bold text-yamabuki bg-amber-50 px-1.5 py-0.5 rounded-full">
                      旬
                    </span>
                  )}
                  <span className="text-3xl">{master.emoji}</span>
                  <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                    {master.name}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                    master.difficulty === 1
                      ? 'bg-green-50 text-wakatake'
                      : master.difficulty === 2
                      ? 'bg-gray-50 text-gray-500'
                      : 'bg-red-50 text-shu'
                  }`}>
                    {DIFFICULTY_LABELS[master.difficulty]}
                  </span>
                </button>
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm text-gray-500">見つかりませんでした</p>
                <p className="text-xs text-gray-500 mt-1">検索やしぼりこみを変えてみてください</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 詳細入力フォーム */
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-5 py-4 space-y-5 pb-32">
            {/* 植え付け日 */}
            <FormField label="植え付け日">
              <input
                type="date"
                value={plantedAt}
                onChange={e => setPlantedAt(e.target.value)}
                className="w-full bg-gray-50 rounded-xl px-3 py-3 text-sm text-gray-700 outline-none border border-gray-100 focus:border-wakatake focus:bg-white transition-colors"
              />
            </FormField>

            {/* 種か苗か */}
            <FormField label="種・苗">
              <div className="grid grid-cols-2 gap-2">
                {(['seed', 'seedling'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setSeedType(type)}
                    className={`py-3 rounded-xl text-sm font-medium border transition-colors ${
                      seedType === type
                        ? 'bg-wakatake text-white border-wakatake'
                        : 'bg-gray-50 text-gray-600 border-gray-100'
                    }`}
                  >
                    {type === 'seed' ? '🌱 種から' : '🌿 苗から'}
                  </button>
                ))}
              </div>
            </FormField>

            {/* 場所 */}
            <FormField label="栽培場所">
              <div className="grid grid-cols-2 gap-2">
                {(['field', 'planter'] as const).map(loc => (
                  <button
                    key={loc}
                    onClick={() => setLocation(loc)}
                    className={`py-3 rounded-xl text-sm font-medium border transition-colors ${
                      location === loc
                        ? 'bg-wakatake text-white border-wakatake'
                        : 'bg-gray-50 text-gray-600 border-gray-100'
                    }`}
                  >
                    {loc === 'field' ? '🌾 畑' : '🪴 プランター'}
                  </button>
                ))}
              </div>
            </FormField>

            {/* 日当たり */}
            <FormField label="日当たり">
              <div className="grid grid-cols-3 gap-2">
                {(['full', 'partial', 'shade'] as const).map(sun => (
                  <button
                    key={sun}
                    onClick={() => setSunlight(sun)}
                    className={`py-3 rounded-xl text-sm font-medium border transition-colors ${
                      sunlight === sun
                        ? 'bg-wakatake text-white border-wakatake'
                        : 'bg-gray-50 text-gray-600 border-gray-100'
                    }`}
                  >
                    {sun === 'full' ? '☀️ 日当たり良' : sun === 'partial' ? '⛅ 半日陰' : '🌥 日陰'}
                  </button>
                ))}
              </div>
            </FormField>

            {/* 品種（任意） */}
            <FormField label="品種（任意）">
              <input
                type="text"
                value={variety}
                onChange={e => setVariety(e.target.value)}
                placeholder={`例：ミニキャロル、桃太郎など`}
                className="w-full bg-gray-50 rounded-xl px-3 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none border border-gray-100 focus:border-wakatake focus:bg-white transition-colors"
              />
            </FormField>

            {/* メモ（任意） */}
            <FormField label="メモ（任意）">
              <textarea
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder="気になることや覚えておきたいことを書いておきましょう"
                rows={3}
                className="w-full bg-gray-50 rounded-xl px-3 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none border border-gray-100 focus:border-wakatake focus:bg-white transition-colors resize-none"
              />
            </FormField>

            {/* ヒント */}
            {selectedMaster && selectedMaster.tips.length > 0 && (
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-wakatake mb-2">
                  💡 {selectedMaster.name}のポイント
                </p>
                {selectedMaster.tips.map((tip, i) => (
                  <p key={i} className="text-xs text-gray-600 leading-relaxed">
                    • {tip}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 登録ボタン（詳細ステップのみ表示） */}
      {step === 'detail' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 px-5 py-4 safe-bottom">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-wakatake text-white font-semibold py-4 rounded-xl active:scale-[0.98] transition-transform shadow-sm disabled:opacity-60"
          >
            {saving ? '登録中...' : `${selectedMaster?.name}を登録する`}
          </button>
        </div>
      )}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-2">{label}</label>
      {children}
    </div>
  );
}
