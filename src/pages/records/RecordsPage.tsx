import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Droplets, Sprout, Bug, Scissors, Camera, Plus, BookOpen } from 'lucide-react';
import { useAppStore } from '../../store';
import { TASK_LABELS, type TaskType } from '../../types';
import { generateId, today } from '../../utils/vegetable';

const TASK_ICON_MAP: Record<TaskType, React.ReactNode> = {
  water:     <Droplets size={16} className="text-blue-400" />,
  fertilize: <Sprout size={16} className="text-amber-500" />,
  pest:      <Bug size={16} className="text-red-400" />,
  harvest:   <Scissors size={16} className="text-yamabuki" />,
  photo:     <Camera size={16} className="text-fuji" />,
  disease:   <Bug size={16} className="text-red-500" />,
  medicine:  <Plus size={16} className="text-purple-400" />,
  support:   <Sprout size={16} className="text-green-500" />,
  other:     <Plus size={16} className="text-gray-400" />,
};

const TASK_BG: Record<TaskType, string> = {
  water:     'bg-blue-50',
  fertilize: 'bg-amber-50',
  pest:      'bg-red-50',
  harvest:   'bg-yellow-50',
  photo:     'bg-purple-50',
  disease:   'bg-red-50',
  medicine:  'bg-purple-50',
  support:   'bg-green-50',
  other:     'bg-gray-50',
};

const FILTER_TASKS: { type: TaskType | 'all'; label: string }[] = [
  { type: 'all',       label: 'すべて' },
  { type: 'water',     label: '水やり' },
  { type: 'fertilize', label: '追肥' },
  { type: 'harvest',   label: '収穫' },
  { type: 'pest',      label: '害虫確認' },
];

export function RecordsPage() {
  const { vegetables, taskRecords, loadTaskRecords, addTaskRecord } = useAppStore();
  const [filter, setFilter] = useState<TaskType | 'all'>('all');
  const [quickVegId, setQuickVegId] = useState<string>('');
  const [quickTask, setQuickTask] = useState<TaskType>('water');
  const [quickNote, setQuickNote] = useState('');
  const [quickHCount, setQuickHCount] = useState('');
  const [quickHWeight, setQuickHWeight] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTaskRecords();
  }, []);

  const activeVegs = vegetables.filter(v => v.currentStage !== 'finished');

  const filtered = filter === 'all'
    ? taskRecords
    : taskRecords.filter(r => r.taskType === filter);

  // 日付でグループ化
  const grouped: Record<string, typeof taskRecords> = {};
  for (const record of filtered) {
    if (!grouped[record.date]) grouped[record.date] = [];
    grouped[record.date].push(record);
  }
  const sortedDates = Object.keys(grouped).sort().reverse();

  const handleAdd = async () => {
    if (!quickVegId || saving) return;
    setSaving(true);
    await addTaskRecord({
      id: generateId(),
      vegetableId: quickVegId,
      date: today(),
      taskType: quickTask,
      note: quickNote,
      harvestCount: quickTask === 'harvest' && quickHCount ? Number(quickHCount) : undefined,
      harvestAmount: quickTask === 'harvest' && quickHWeight ? Number(quickHWeight) : undefined,
      createdAt: new Date().toISOString(),
    });
    setQuickNote('');
    setShowAdd(false);
    setSaving(false);
  };

  const totalHarvests = taskRecords.filter(r => r.taskType === 'harvest').length;
  const totalWaters = taskRecords.filter(r => r.taskType === 'water').length;
  const totalFertilize = taskRecords.filter(r => r.taskType === 'fertilize').length;

  return (
    <div className="flex flex-col h-full bg-bg-base">
      {/* ヘッダー */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-5 pt-4 pb-3 safe-top">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-gray-800">記録</h1>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 bg-wakatake text-white text-sm font-medium px-3 py-2 rounded-xl active:scale-95 transition-transform"
          >
            <Plus size={15} />
            <span>記録を追加</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* クイック記録フォーム */}
        {showAdd && (
          <div className="bg-white border-b border-gray-100 px-5 py-4">
            <p className="text-xs font-semibold text-gray-500 mb-3">今日の作業を記録</p>
            <div className="space-y-3">
              {/* 野菜選択 */}
              <select
                value={quickVegId}
                onChange={e => setQuickVegId(e.target.value)}
                className="w-full bg-gray-50 rounded-xl px-3 py-3 text-sm text-gray-700 outline-none border border-gray-100 focus:border-wakatake appearance-none"
              >
                <option value="">野菜を選ぶ</option>
                {activeVegs.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>

              {/* タスク種類 */}
              <div className="grid grid-cols-4 gap-1.5">
                {(Object.entries(TASK_LABELS) as [TaskType, string][])
                  .filter(([t]) => ['water','fertilize','harvest','pest'].includes(t))
                  .map(([type, label]) => (
                    <button
                      key={type}
                      onClick={() => setQuickTask(type)}
                      className={`py-2.5 rounded-xl text-xs font-medium border transition-colors ${
                        quickTask === type
                          ? 'bg-wakatake text-white border-wakatake'
                          : 'bg-gray-50 text-gray-600 border-gray-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
              </div>

              {/* 収穫量（収穫選択時のみ） */}
              {quickTask === 'harvest' && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number" inputMode="numeric" min="0"
                    value={quickHCount}
                    onChange={e => setQuickHCount(e.target.value)}
                    placeholder="数量（個）"
                    className="w-full bg-gray-50 rounded-xl px-3 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none border border-gray-100 focus:border-wakatake"
                  />
                  <input
                    type="number" inputMode="numeric" min="0"
                    value={quickHWeight}
                    onChange={e => setQuickHWeight(e.target.value)}
                    placeholder="重さ（g）"
                    className="w-full bg-gray-50 rounded-xl px-3 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none border border-gray-100 focus:border-wakatake"
                  />
                </div>
              )}

              {/* メモ */}
              <input
                type="text"
                value={quickNote}
                onChange={e => setQuickNote(e.target.value)}
                placeholder="メモ（任意）"
                className="w-full bg-gray-50 rounded-xl px-3 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none border border-gray-100 focus:border-wakatake"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-3 rounded-xl text-sm text-gray-500 bg-gray-50 border border-gray-100"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!quickVegId || saving}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-wakatake disabled:opacity-50"
                >
                  {saving ? '記録中...' : '記録する'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="px-5 py-4 space-y-4 pb-28">
          {/* サマリー */}
          <div className="grid grid-cols-3 gap-3">
            <SummaryCard label="水やり" value={totalWaters} icon={<Droplets size={16} className="text-blue-400" />} />
            <SummaryCard label="追肥"  value={totalFertilize} icon={<Sprout size={16} className="text-amber-500" />} />
            <SummaryCard label="収穫"  value={totalHarvests} icon={<Scissors size={16} className="text-yamabuki" />} />
          </div>

          {/* 収穫グラフ（直近6ヶ月） */}
          <HarvestChart records={taskRecords} />

          {/* フィルター */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {FILTER_TASKS.map(({ type, label }) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  filter === type
                    ? 'bg-wakatake text-white'
                    : 'bg-white text-gray-500 border border-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 記録リスト */}
          {sortedDates.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">まだ記録がありません</p>
              <p className="text-xs text-gray-300 mt-1">作業を記録して履歴を積み上げましょう</p>
            </div>
          ) : (
            <div className="space-y-5">
              {sortedDates.map(dateStr => (
                <div key={dateStr}>
                  <p className="text-xs font-semibold text-gray-400 mb-2 px-1">
                    {format(parseISO(dateStr), 'M月d日(E)', { locale: ja })}
                  </p>
                  <div className="space-y-2">
                    {grouped[dateStr].map(record => {
                      const veg = vegetables.find(v => v.id === record.vegetableId);
                      return (
                        <div
                          key={record.id}
                          className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-soft px-4 py-3"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            TASK_BG[record.taskType]
                          }`}>
                            {TASK_ICON_MAP[record.taskType]}
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
                            <p className="text-xs text-gray-400 truncate">
                              {veg?.name ?? '不明'}
                              {record.note && ` — ${record.note}`}
                            </p>
                          </div>
                          <p className="text-xs text-gray-300 flex-shrink-0">
                            {format(parseISO(record.createdAt), 'HH:mm')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-soft px-3 py-3 text-center">
      <div className="flex items-center justify-center mb-1">{icon}</div>
      <p className="text-xl font-semibold text-gray-800">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

/* 収穫グラフ：直近6ヶ月の月別収穫（重さ合計。重さ未入力は個数×平均で近似せず個数系列を別表示） */
function HarvestChart({ records }: { records: import('../../types').TaskRecord[] }) {
  const now = new Date();
  const months: { key: string; label: string; grams: number; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push({ key, label: `${d.getMonth() + 1}月`, grams: 0, count: 0 });
  }
  for (const r of records) {
    if (r.taskType !== 'harvest') continue;
    const key = r.date.slice(0, 7);
    const m = months.find(x => x.key === key);
    if (!m) continue;
    m.grams += r.harvestAmount ?? 0;
    m.count += r.harvestCount ?? (r.harvestAmount ? 0 : 1); // 数量未入力は1回=1個として近似
  }
  const totalGrams = months.reduce((s, m) => s + m.grams, 0);
  const totalCount = months.reduce((s, m) => s + m.count, 0);
  if (totalGrams === 0 && totalCount === 0) return null;

  // 表示系列：重さデータがあれば重さ、なければ個数
  const useGrams = totalGrams > 0;
  const values = months.map(m => (useGrams ? m.grams : m.count));
  const max = Math.max(...values, 1);

  return (
    <div className="bg-white rounded-card border border-gray-100 shadow-soft p-4" data-testid="harvest-chart">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500">収穫の記録（6ヶ月）</p>
        <p className="text-xs text-yamabuki font-medium">
          合計 {useGrams ? `${totalGrams >= 1000 ? (totalGrams / 1000).toFixed(1) + 'kg' : totalGrams + 'g'}` : `${totalCount}個`}
        </p>
      </div>
      <div className="flex items-end gap-2 h-24">
        {months.map((m, i) => {
          const v = values[i];
          const h = Math.round((v / max) * 100);
          return (
            <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
              <p className="text-[9px] text-gray-500 h-3">
                {v > 0 ? (useGrams ? (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v) : v) : ''}
              </p>
              <div className="w-full flex items-end" style={{ height: '64px' }}>
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${Math.max(h, v > 0 ? 8 : 2)}%`,
                    backgroundColor: v > 0 ? '#E8A020' : '#F3F4F6',
                  }}
                />
              </div>
              <p className="text-[10px] text-gray-400">{m.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
