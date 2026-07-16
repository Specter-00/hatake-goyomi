import { useEffect, useRef, useState } from 'react';
import {
  X, ChevronRight, Droplets, Sprout, Bug, Scissors, Camera,
  Leaf, Plus, CheckCircle2, Lightbulb, Images, Play, Sparkles, Loader2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAppStore } from '../../store';
import { ProgressBar } from '../../components/ProgressBar';
import {
  GROWTH_STAGE_LABELS, GROWTH_STAGE_ORDER,
  type GrowthStage, type TaskType, TASK_LABELS,
} from '../../types';
import {
  getGrowthProgress, getDaysFromPlanting, getDaysToHarvest,
  formatDateJP, generateId, today, getNextStage,
} from '../../utils/vegetable';
import { getVegetableMasterByName } from '../../data/vegetables';
import { generateAdvice } from '../../utils/advice';
import { compressImage } from '../../utils/image';
import { analyzePlantPhoto, type PlantAnalysis, type AnalyzeError } from '../../utils/analyze';
import { TimelapsePlayer } from '../../components/TimelapsePlayer';
import { LIBRARY_ARTICLES } from '../../data/library';
import { LibraryPage } from '../library/LibraryPage';
import { PlantAnalyzer } from '../../components/PlantAnalyzer';

interface VegetableDetailPageProps {
  vegetableId: string;
  onClose: () => void;
}

const STAGE_ICONS: Record<GrowthStage, string> = {
  seed: '🌰', sprout: '🌱', seedling: '🌿', transplant: '🪴',
  support: '🎋', flowering: '🌸', fruiting: '🍀', harvest: '🌾', finished: '✅',
};

export function VegetableDetailPage({ vegetableId, onClose }: VegetableDetailPageProps) {
  const {
    vegetables, taskRecords, photoRecords, weather,
    loadTaskRecords, loadPhotoRecords, addTaskRecord, addPhotoRecord, updateVegetable,
  } = useAppStore();
  const vegetable = vegetables.find(v => v.id === vegetableId);
  const [recordedTasks, setRecordedTasks] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'records'>('overview');
  const [stageAdvanceConfirm, setStageAdvanceConfirm] = useState(false);
  const [harvestDialog, setHarvestDialog] = useState(false);
  const [harvestCount, setHarvestCount] = useState('');
  const [harvestWeight, setHarvestWeight] = useState('');
  const [harvestNote, setHarvestNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [timelapseOpen, setTimelapseOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PlantAnalysis | null>(null);
  const [analyzeError, setAnalyzeError] = useState<AnalyzeError | null>(null);
  const analyzeInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTaskRecords(vegetableId);
    loadPhotoRecords();
  }, [vegetableId]);

  if (!vegetable) {
    return (
      <div className="fixed inset-0 z-50 bg-bg-base flex items-center justify-center">
        <p className="text-gray-400">野菜が見つかりません</p>
      </div>
    );
  }

  const master = getVegetableMasterByName(vegetable.name);
  const progress = getGrowthProgress(vegetable);
  const daysFromPlanting = getDaysFromPlanting(vegetable);
  const daysToHarvest = getDaysToHarvest(vegetable);
  const nextStage = getNextStage(vegetable.currentStage);
  const myRecords = taskRecords.filter(r => r.vegetableId === vegetableId);
  const myPhotos = photoRecords.filter(p => p.vegetableId === vegetableId);
  const advice = generateAdvice(vegetable, weather, taskRecords);
  // 学習ライブラリの関連記事（野菜名の主要部分でマッチ）
  const nameKey = vegetable.name.replace(/（.*）/, '').slice(0, 3);
  const relatedArticle =
    LIBRARY_ARTICLES.find(a => a.title.includes(nameKey)) ??
    LIBRARY_ARTICLES.find(a => a.sections.some(sec => sec.body.includes(vegetable.name)));
  const currentStageIndex = GROWTH_STAGE_ORDER.indexOf(vegetable.currentStage);

  /* === 写真アップロード === */
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await compressImage(file);
      await addPhotoRecord({
        id: generateId(),
        vegetableId,
        date: today(),
        photoUrl: dataUrl,
        caption: '',
        createdAt: new Date().toISOString(),
      });
      // 最初の1枚は野菜カードのサムネイルにも設定
      if (!vegetable.photoUrl) {
        await updateVegetable(vegetableId, { photoUrl: dataUrl });
      }
      setActiveTab('photos');
    } catch (err) {
      console.error('photo upload failed:', err);
    }
    setUploading(false);
    e.target.value = '';
  };

  /* === AI写真分析 === */
  const handleAnalyzeSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzing(true);
    setAnalysis(null);
    setAnalyzeError(null);
    try {
      const dataUrl = await compressImage(file);
      // 分析用の写真もアルバムに残す
      await addPhotoRecord({
        id: generateId(), vegetableId, date: today(),
        photoUrl: dataUrl, caption: 'AI分析', createdAt: new Date().toISOString(),
      });
      if (!vegetable.photoUrl) {
        await updateVegetable(vegetableId, { photoUrl: dataUrl });
      }
      const res = await analyzePlantPhoto(dataUrl, vegetable.name);
      if (res.ok) setAnalysis(res.result);
      else setAnalyzeError(res.error);
    } catch {
      setAnalyzeError('api_error');
    }
    setAnalyzing(false);
    e.target.value = '';
  };

  const handleSaveAnalysisNote = async () => {
    if (!analysis) return;
    const note = `AI分析: ${analysis.species}／状態:${analysis.health}` +
      (analysis.issues.length ? `／${analysis.issues[0]}` : '');
    await addTaskRecord({
      id: generateId(), vegetableId, date: today(),
      taskType: 'other', note: note.slice(0, 120),
      createdAt: new Date().toISOString(),
    });
    setAnalysis(null);
  };

  /* === クイック記録 === */
  const handleQuickTask = async (type: TaskType) => {
    if (type === 'photo') {
      fileInputRef.current?.click();
      return;
    }
    if (type === 'harvest') {
      setHarvestDialog(true);
      return;
    }
    if (recordedTasks.has(type)) return;
    setRecordedTasks(prev => new Set([...prev, type]));
    await addTaskRecord({
      id: generateId(), vegetableId, date: today(),
      taskType: type, note: '', createdAt: new Date().toISOString(),
    });
  };

  /* === 収穫記録の保存 === */
  const handleHarvestSave = async () => {
    await addTaskRecord({
      id: generateId(), vegetableId, date: today(),
      taskType: 'harvest',
      note: harvestNote,
      harvestCount: harvestCount ? Number(harvestCount) : undefined,
      harvestAmount: harvestWeight ? Number(harvestWeight) : undefined,
      createdAt: new Date().toISOString(),
    });
    setRecordedTasks(prev => new Set([...prev, 'harvest']));
    setHarvestDialog(false);
    setHarvestCount(''); setHarvestWeight(''); setHarvestNote('');
  };

  const handleAdvanceStage = async () => {
    if (!nextStage) return;
    await updateVegetable(vegetableId, { currentStage: nextStage });
    setStageAdvanceConfirm(false);
  };

  const QUICK_TASKS: { type: TaskType; label: string; icon: React.ReactNode }[] = [
    { type: 'water',     label: '水やり',  icon: <Droplets size={18} className="text-blue-400" /> },
    { type: 'fertilize', label: '追肥',    icon: <Sprout size={18} className="text-amber-500" /> },
    { type: 'pest',      label: '害虫確認', icon: <Bug size={18} className="text-red-400" /> },
    { type: 'harvest',   label: '収穫',    icon: <Scissors size={18} className="text-yamabuki" /> },
    { type: 'photo',     label: '写真',    icon: <Camera size={18} className="text-fuji" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-bg-base flex flex-col">
      {/* 隠しファイル入力 */}
      <input
        ref={fileInputRef} type="file" accept="image/*"
        onChange={handlePhotoSelect} className="hidden" data-testid="photo-input"
      />

      {/* ヘッダー */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-5 pt-4 pb-3 safe-top">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1 -ml-1">
            <X size={20} className="text-gray-400" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-gray-800">{vegetable.name}</h1>
            {vegetable.variety && <p className="text-xs text-gray-500">{vegetable.variety}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">植え付け</p>
            <p className="text-xs font-medium text-gray-600">{formatDateJP(vegetable.plantedAt)}</p>
          </div>
        </div>
      </div>

      {/* タブ */}
      <div className="flex-shrink-0 flex bg-white border-b border-gray-100 px-5">
        {([['overview', '概要'], ['photos', '写真'], ['records', '記録']] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab ? 'border-wakatake text-wakatake' : 'border-transparent text-gray-400'
            }`}
          >
            {label}{tab === 'photos' && myPhotos.length > 0 ? ` ${myPhotos.length}` : ''}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-28">

        {/* === 概要タブ === */}
        {activeTab === 'overview' && (
          <div className="px-5 py-4 space-y-4">
            {/* 今日のアドバイス */}
            <div className="rounded-card border border-green-100 bg-green-50 p-4 flex items-start gap-3 anim-fade-up">
              <Lightbulb size={16} className="text-wakatake mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-wakatake mb-1">今日のアドバイス</p>
                <p className="text-sm text-gray-700 leading-relaxed" data-testid="advice-text">{advice}</p>
              </div>
            </div>

            {/* 成長サマリー */}
            <div className="bg-white rounded-card border border-gray-100 shadow-soft p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">現在のステージ</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">{STAGE_ICONS[vegetable.currentStage]}</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {GROWTH_STAGE_LABELS[vegetable.currentStage]}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-0.5">植え付けから</p>
                  <p className="text-2xl font-light text-gray-800">
                    {daysFromPlanting}<span className="text-sm font-normal text-gray-400">日</span>
                  </p>
                </div>
              </div>
              <ProgressBar value={progress} className="mb-2" />
              <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                <span>{progress}%</span>
                {daysToHarvest !== null && daysToHarvest > 0 && <span>収穫まで約{daysToHarvest}日</span>}
                {daysToHarvest !== null && daysToHarvest <= 0 && (
                  <span className="text-yamabuki font-medium">収穫時期です！</span>
                )}
              </div>
            </div>

            {/* 成長タイムライン */}
            <div className="bg-white rounded-card border border-gray-100 shadow-soft p-4">
              <p className="text-xs font-semibold text-gray-500 mb-3">成長タイムライン</p>
              <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide pb-1">
                {GROWTH_STAGE_ORDER.map((stage, idx) => {
                  const isPast = idx < currentStageIndex;
                  const isCurrent = idx === currentStageIndex;
                  return (
                    <div key={stage} className="flex items-center flex-shrink-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base border-2 transition-all ${
                          isCurrent ? 'border-wakatake bg-green-50 scale-110'
                          : isPast ? 'border-wakatake bg-wakatake'
                          : 'border-gray-200 bg-gray-50'
                        }`}>
                          {isPast
                            ? <CheckCircle2 size={16} className="text-white" />
                            : <span className={idx > currentStageIndex ? 'opacity-40' : ''}>{STAGE_ICONS[stage]}</span>}
                        </div>
                        <p className={`text-[10px] mt-1 text-center leading-tight w-12 ${
                          isCurrent ? 'text-wakatake font-semibold' : 'text-gray-400'
                        }`}>
                          {GROWTH_STAGE_LABELS[stage]}
                        </p>
                      </div>
                      {idx < GROWTH_STAGE_ORDER.length - 1 && (
                        <div className={`h-0.5 w-4 flex-shrink-0 mb-5 ${idx < currentStageIndex ? 'bg-wakatake' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ステージ更新 */}
            {nextStage && vegetable.currentStage !== 'finished' && (
              !stageAdvanceConfirm ? (
                <button
                  onClick={() => setStageAdvanceConfirm(true)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-white rounded-xl border border-gray-100 shadow-soft"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{STAGE_ICONS[nextStage]}</span>
                    <span className="text-sm text-gray-700">「{GROWTH_STAGE_LABELS[nextStage]}」に進む</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </button>
              ) : (
                <div className="bg-green-50 rounded-xl border border-green-100 p-4">
                  <p className="text-sm text-gray-700 mb-3 text-center">
                    ステージを「{GROWTH_STAGE_LABELS[nextStage]}」に更新しますか？
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setStageAdvanceConfirm(false)}
                      className="py-2.5 rounded-xl text-sm text-gray-500 bg-white border border-gray-200">
                      キャンセル
                    </button>
                    <button onClick={handleAdvanceStage}
                      className="py-2.5 rounded-xl text-sm text-white bg-wakatake font-medium">
                      更新する
                    </button>
                  </div>
                </div>
              )
            )}

            {/* クイック記録 */}
            <div className="bg-white rounded-card border border-gray-100 shadow-soft p-4">
              <p className="text-xs font-semibold text-gray-500 mb-3">今日の作業を記録</p>
              <div className="grid grid-cols-5 gap-2">
                {QUICK_TASKS.map(({ type, label, icon }) => {
                  const isDone = recordedTasks.has(type);
                  return (
                    <button
                      key={type}
                      data-testid={`quick-${type}`}
                      onClick={() => handleQuickTask(type)}
                      disabled={uploading && type === 'photo'}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                        isDone ? 'bg-green-50 border-wakatake/30' : 'bg-gray-50 border-gray-100 active:scale-95'
                      }`}
                    >
                      {isDone ? <CheckCircle2 size={18} className="text-wakatake" /> : icon}
                      <span className={`text-[10px] font-medium ${isDone ? 'text-wakatake' : 'text-gray-500'}`}>
                        {uploading && type === 'photo' ? '保存中' : label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 育て方のポイント */}
            {master && master.tips.length > 0 && (
              <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
                <p className="text-xs font-semibold text-yamabuki mb-2">💡 育て方のポイント</p>
                {master.tips.map((tip, i) => (
                  <p key={i} className="text-xs text-gray-600 leading-relaxed">• {tip}</p>
                ))}
              </div>
            )}

            {/* 関連する学習記事 */}
            {relatedArticle && (
              <button
                onClick={() => setLibraryOpen(true)}
                data-testid="related-article"
                className="w-full text-left flex items-center gap-3 px-4 py-3.5 bg-white rounded-xl border border-gray-100 shadow-soft active:scale-[0.99] transition-transform"
              >
                <span className="text-xl">{relatedArticle.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-wakatake font-medium">まなぶ｜{relatedArticle.category}</p>
                  <p className="text-sm font-bold text-gray-800 truncate">{relatedArticle.title}</p>
                </div>
                <ChevronRight size={15} className="text-gray-300" />
              </button>
            )}

            {/* 詳細情報 */}
            <div className="bg-white rounded-card border border-gray-100 shadow-soft overflow-hidden">
              {([
                ['種類', vegetable.seedType === 'seed' ? '種から' : '苗から'],
                ['場所', vegetable.location === 'field' ? '畑' : 'プランター'],
                ['日当たり', vegetable.sunlight === 'full' ? '日当たり良' : vegetable.sunlight === 'partial' ? '半日陰' : '日陰'],
                ...(vegetable.memo ? [['メモ', vegetable.memo]] : []),
              ] as [string, string][]).map(([l, v], i, arr) => (
                <div key={l} className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <p className="text-xs text-gray-400">{l}</p>
                  <p className="text-sm text-gray-700">{v}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === 写真タブ === */}
        {activeTab === 'photos' && (
          <div className="px-5 py-4">
            {/* AI写真分析 */}
            <PlantAnalyzer
              vegetableName={vegetable.name}
              compress={compressImage}
              onSaveNote={async (note) => {
                await addTaskRecord({
                  id: generateId(), vegetableId, date: today(),
                  taskType: 'other', note,
                  createdAt: new Date().toISOString(),
                });
              }}
            />

            {/* 分析用の隠しファイル入力 */}
            <input
              ref={analyzeInputRef} type="file" accept="image/*"
              onChange={handleAnalyzeSelect} className="hidden" data-testid="analyze-input"
            />

            {/* AI写真分析 */}
            <div className="mb-4 bg-white rounded-card border border-gray-100 shadow-soft p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={15} className="text-fuji" />
                <p className="text-sm font-bold text-gray-800">AI写真分析</p>
                <span className="text-[9px] font-bold text-fuji bg-purple-50 px-1.5 py-0.5 rounded-full">ベータ</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                写真から植物の種類や健康状態をAIが推定します
              </p>
              <button
                onClick={() => analyzeInputRef.current?.click()}
                disabled={analyzing}
                data-testid="analyze-button"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-fuji text-white text-sm font-semibold shadow-sm active:scale-[0.99] transition-transform disabled:opacity-60"
              >
                {analyzing
                  ? <><Loader2 size={15} className="animate-spin" /><span>分析中...（10秒ほど）</span></>
                  : <><Camera size={15} /><span>写真を選んで分析する</span></>}
              </button>

              {/* 分析結果 */}
              {analysis && (
                <div className="mt-3 rounded-xl border border-purple-100 bg-purple-50/60 p-3.5" data-testid="analyze-result">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-gray-800">{analysis.species}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400">確度:{analysis.confidence}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        analysis.health === '良好' ? 'bg-green-100 text-wakatake'
                        : analysis.health === '注意' ? 'bg-amber-100 text-yamabuki'
                        : 'bg-red-100 text-shu'
                      }`}>
                        {analysis.health}
                      </span>
                    </div>
                  </div>
                  {analysis.issues.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[10px] font-semibold text-gray-400 mb-1">気になる点</p>
                      {analysis.issues.map((issue, i) => (
                        <p key={i} className="text-xs text-gray-600 leading-relaxed">• {issue}</p>
                      ))}
                    </div>
                  )}
                  {analysis.advice.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[10px] font-semibold text-gray-400 mb-1">アドバイス</p>
                      {analysis.advice.map((a, i) => (
                        <p key={i} className="text-xs text-gray-600 leading-relaxed">• {a}</p>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 leading-relaxed mb-2.5">
                    ※AIによる推定です。病気の診断や薬剤使用の判断は、園芸店やJA等にもご相談ください
                  </p>
                  <button
                    onClick={handleSaveAnalysisNote}
                    data-testid="analyze-save"
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-fuji bg-white border border-purple-100"
                  >
                    この結果を記録に残す
                  </button>
                </div>
              )}

              {/* エラー */}
              {analyzeError && (
                <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5" data-testid="analyze-error">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {analyzeError === 'not_configured'
                      ? '🔧 この機能は公開版（Vercel）でAPIキーを設定すると使えるようになります。ローカル環境では利用できません。'
                      : analyzeError === 'too_large'
                      ? '画像が大きすぎます。別の写真でお試しください。'
                      : analyzeError === 'network'
                      ? '通信できませんでした。電波の良い場所でもう一度お試しください。'
                      : '分析に失敗しました。もう一度お試しください。'}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 py-3.5 mb-4 rounded-xl border-2 border-dashed border-gray-200 bg-white text-sm font-medium text-gray-500 active:scale-[0.99] transition-transform disabled:opacity-50"
            >
              <Camera size={16} />
              <span>{uploading ? '保存中...' : '今日の写真を追加'}</span>
            </button>

            {myPhotos.length >= 3 && (
              <button
                onClick={() => setTimelapseOpen(true)}
                data-testid="timelapse-open"
                className="w-full flex items-center justify-center gap-2 py-3.5 mb-4 rounded-xl bg-wakatake text-white text-sm font-semibold shadow-sm active:scale-[0.99] transition-transform"
              >
                <Play size={16} />
                <span>タイムラプス再生（{myPhotos.length}枚）</span>
              </button>
            )}

            {myPhotos.length === 0 ? (
              <div className="text-center py-14">
                <Images size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">まだ写真がありません</p>
                <p className="text-xs text-gray-400 mt-1">毎日撮ると成長アルバムになります</p>
              </div>
            ) : (
              <div className="space-y-4" data-testid="photo-timeline">
                {/* 日付ごとにグループ化して時系列表示（新しい順） */}
                {Object.entries(
                  [...myPhotos].reverse().reduce<Record<string, typeof myPhotos>>((acc, p) => {
                    (acc[p.date] ??= []).push(p);
                    return acc;
                  }, {})
                ).map(([date, photos]) => (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-semibold text-gray-500">
                        {format(parseISO(date), 'M月d日(E)', { locale: ja })}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        植え付けから{Math.floor((new Date(date).getTime() - new Date(vegetable.plantedAt).getTime()) / 86400000)}日目
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {photos.map(p => (
                        <div key={p.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                          <img src={p.photoUrl} alt={`${vegetable.name} ${date}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === 記録タブ === */}
        {activeTab === 'records' && (
          <div className="px-5 py-4">
            {myRecords.length === 0 ? (
              <div className="text-center py-16">
                <Leaf size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">まだ記録がありません</p>
                <p className="text-xs text-gray-400 mt-1">「概要」タブから作業を記録しましょう</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...myRecords].reverse().map(record => (
                  <div key={record.id} className="bg-white rounded-xl border border-gray-100 shadow-soft px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      {getTaskIcon(record.taskType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700">
                        {TASK_LABELS[record.taskType]}
                        {record.taskType === 'harvest' && (record.harvestCount || record.harvestAmount) && (
                          <span className="text-xs text-yamabuki ml-1.5">
                            {record.harvestCount ? `${record.harvestCount}個` : ''}
                            {record.harvestCount && record.harvestAmount ? '・' : ''}
                            {record.harvestAmount ? `${record.harvestAmount}g` : ''}
                          </span>
                        )}
                      </p>
                      {record.note && <p className="text-xs text-gray-500 truncate">{record.note}</p>}
                    </div>
                    <p className="text-xs text-gray-400 flex-shrink-0">
                      {format(parseISO(record.createdAt), 'M/d', { locale: ja })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* === タイムラプス === */}
      {timelapseOpen && (
        <TimelapsePlayer
          photos={myPhotos}
          vegetableName={vegetable.name}
          plantedAt={vegetable.plantedAt}
          onClose={() => setTimelapseOpen(false)}
        />
      )}

      {/* === 学習ライブラリ === */}
      {libraryOpen && <LibraryPage onClose={() => setLibraryOpen(false)} />}

      {/* === 収穫ダイアログ === */}
      {harvestDialog && (
        <div className="absolute inset-0 z-50 bg-black/30 flex items-end" onClick={() => setHarvestDialog(false)}>
          <div className="w-full bg-white rounded-t-3xl p-5 pb-8 safe-bottom" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <Scissors size={18} className="text-yamabuki" />
              <h3 className="text-base font-semibold text-gray-800">収穫を記録</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">数量（個）</label>
                <input
                  type="number" inputMode="numeric" min="0" placeholder="例：3"
                  value={harvestCount} onChange={e => setHarvestCount(e.target.value)}
                  className="w-full bg-gray-50 rounded-xl px-3 py-3 text-base text-gray-700 outline-none border border-gray-100 focus:border-wakatake"
                  data-testid="harvest-count"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">重さ（g）</label>
                <input
                  type="number" inputMode="numeric" min="0" placeholder="例：450"
                  value={harvestWeight} onChange={e => setHarvestWeight(e.target.value)}
                  className="w-full bg-gray-50 rounded-xl px-3 py-3 text-base text-gray-700 outline-none border border-gray-100 focus:border-wakatake"
                  data-testid="harvest-weight"
                />
              </div>
            </div>
            <input
              type="text" placeholder="メモ（任意）例：形が良い、甘かった"
              value={harvestNote} onChange={e => setHarvestNote(e.target.value)}
              className="w-full bg-gray-50 rounded-xl px-3 py-3 text-sm text-gray-700 outline-none border border-gray-100 focus:border-wakatake mb-4"
            />
            <p className="text-xs text-gray-400 mb-4">数量・重さはどちらか片方だけでもOKです</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setHarvestDialog(false)}
                className="py-3.5 rounded-xl text-sm font-medium text-gray-500 bg-gray-50 border border-gray-100">
                キャンセル
              </button>
              <button onClick={handleHarvestSave}
                className="py-3.5 rounded-xl text-sm font-semibold text-white bg-yamabuki"
                data-testid="harvest-save">
                記録する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getTaskIcon(type: TaskType) {
  switch (type) {
    case 'water':     return <Droplets size={15} className="text-blue-400" />;
    case 'fertilize': return <Sprout size={15} className="text-amber-500" />;
    case 'pest':      return <Bug size={15} className="text-red-400" />;
    case 'harvest':   return <Scissors size={15} className="text-yamabuki" />;
    case 'photo':     return <Camera size={15} className="text-fuji" />;
    default:          return <Plus size={15} className="text-gray-400" />;
  }
}
