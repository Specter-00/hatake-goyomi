import { useState } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, addMonths, subMonths,
  getDay, startOfWeek, endOfWeek,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store';
import { getTodayTasks } from '../../utils/vegetable';
import type { Vegetable, TaskRecord } from '../../types';

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

type TaskDotType = 'water' | 'fertilize' | 'pest' | 'harvest';

const DOT_COLORS: Record<TaskDotType, string> = {
  water:     'bg-blue-400',
  fertilize: 'bg-amber-400',
  pest:      'bg-red-400',
  harvest:   'bg-yellow-500',
};

function getTaskDots(date: Date, vegetables: Vegetable[]): TaskDotType[] {
  const dots = new Set<TaskDotType>();
  for (const veg of vegetables) {
    if (veg.currentStage === 'finished') continue;
    const tasks = getTodayTasks(veg);
    // getTodayTasksは「今日」基準なので、日付ずらしには別ロジック
    // 簡易版: 今日のみ実タスク、他は植え付けパターンから推定
    if (isToday(date)) {
      tasks.forEach(t => {
        if (t === '水やり') dots.add('water');
        if (t === '追肥') dots.add('fertilize');
        if (t === '害虫確認') dots.add('pest');
        if (t === '収穫') dots.add('harvest');
      });
    }
  }
  return [...dots];
}

interface DayDetailProps {
  date: Date;
  vegetables: Vegetable[];
  taskRecords: TaskRecord[];
  onClose: () => void;
}

function DayDetail({ date, vegetables, taskRecords, onClose }: DayDetailProps) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayRecords = taskRecords.filter(r => r.date === dateStr);
  const dayLabel = format(date, 'M月d日(E)', { locale: ja });

  // その日の対象野菜のタスク予定
  const plannedTasks = isToday(date)
    ? vegetables.flatMap(veg =>
        getTodayTasks(veg).map(task => ({ veg, task }))
      )
    : [];

  return (
    <div className="bg-white rounded-t-2xl border-t border-gray-100 shadow-lg px-5 py-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">{dayLabel}</h3>
        <button onClick={onClose} className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
          閉じる
        </button>
      </div>

      {/* 予定タスク */}
      {plannedTasks.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 mb-2">作業予定</p>
          <div className="space-y-1.5">
            {plannedTasks.map(({ veg, task }, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-wakatake flex-shrink-0" />
                <span className="text-gray-600">{veg.name}</span>
                <span className="text-gray-400">—</span>
                <span className="text-gray-700">{task}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 記録済みタスク */}
      {dayRecords.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2">記録済み</p>
          <div className="space-y-1.5">
            {dayRecords.map(record => {
              const veg = vegetables.find(v => v.id === record.vegetableId);
              return (
                <div key={record.id} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                  <span className="text-xs text-gray-500">{veg?.name ?? '—'}</span>
                  <span className="text-xs text-gray-400">{record.taskType}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {plannedTasks.length === 0 && dayRecords.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">この日の記録はありません</p>
      )}
    </div>
  );
}

export function CalendarPage() {
  const { vegetables, taskRecords } = useAppStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // カレンダーグリッド（週の始まりを日曜に揃える）
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const activeVegetables = vegetables.filter(v => v.currentStage !== 'finished');

  return (
    <div className="flex flex-col h-full bg-bg-base">
      {/* ヘッダー */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-5 pt-4 pb-3 safe-top">
        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 -ml-2">
            <ChevronLeft size={20} className="text-gray-400" />
          </button>
          <h1 className="text-base font-semibold text-gray-800">
            {format(currentMonth, 'yyyy年M月', { locale: ja })}
          </h1>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 -mr-2">
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-28">
        {/* 曜日ヘッダー */}
        <div className="bg-white border-b border-gray-50 px-4 py-2">
          <div className="grid grid-cols-7 gap-0">
            {DAY_LABELS.map((d, i) => (
              <div
                key={d}
                className={`text-center text-xs font-medium py-1 ${
                  i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
                }`}
              >
                {d}
              </div>
            ))}
          </div>
        </div>

        {/* カレンダーグリッド */}
        <div className="px-2 pt-2">
          <div className="grid grid-cols-7 gap-0">
            {calDays.map(day => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isTodayDate = isToday(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const dots = getTaskDots(day, activeVegetables);
              const dayOfWeek = getDay(day);

              // 記録済みの日かどうか
              const dateStr = format(day, 'yyyy-MM-dd');
              const hasRecord = taskRecords.some(r => r.date === dateStr);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(isSameDay(day, selectedDate ?? new Date(0)) ? null : day)}
                  className={`relative flex flex-col items-center py-2 rounded-xl mx-0.5 my-0.5 transition-colors ${
                    isSelected ? 'bg-green-50' : 'active:bg-gray-50'
                  }`}
                >
                  {/* 日付数字 */}
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${
                    isTodayDate
                      ? 'bg-wakatake text-white'
                      : isSelected
                      ? 'bg-green-100 text-wakatake'
                      : !isCurrentMonth
                      ? 'text-gray-300'
                      : dayOfWeek === 0
                      ? 'text-red-400'
                      : dayOfWeek === 6
                      ? 'text-blue-400'
                      : 'text-gray-700'
                  }`}>
                    {format(day, 'd')}
                  </div>

                  {/* タスクドット */}
                  <div className="flex items-center gap-0.5 mt-0.5 h-3">
                    {dots.slice(0, 3).map((type, i) => (
                      <span key={i} className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[type]}`} />
                    ))}
                    {hasRecord && !isTodayDate && (
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 凡例 */}
        <div className="flex items-center gap-4 px-5 py-3 border-t border-gray-100 mt-2">
          {[
            { label: '水やり',   color: 'bg-blue-400' },
            { label: '追肥',    color: 'bg-amber-400' },
            { label: '害虫確認', color: 'bg-red-400' },
            { label: '収穫',    color: 'bg-yellow-500' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-xs text-gray-400">{label}</span>
            </div>
          ))}
        </div>

        {/* 月間サマリー */}
        {activeVegetables.length > 0 && (
          <div className="px-5 mt-2">
            <div className="bg-white rounded-card border border-gray-100 shadow-soft p-4">
              <p className="text-xs font-semibold text-gray-500 mb-3">今月の管理中の野菜</p>
              <div className="space-y-2">
                {activeVegetables.map(veg => (
                  <div key={veg.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-wakatake flex-shrink-0" />
                      <span className="text-sm text-gray-700">{veg.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {getTodayTasks(veg).map((task, i) => (
                        <span key={i} className="text-xs text-gray-400">{task}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 空状態 */}
        {activeVegetables.length === 0 && (
          <div className="text-center py-12 px-8">
            <p className="text-sm text-gray-400">野菜を登録すると</p>
            <p className="text-sm text-gray-400">作業スケジュールが表示されます</p>
          </div>
        )}
      </div>

      {/* 選択日の詳細パネル */}
      {selectedDate && (
        <div className="fixed bottom-16 left-0 right-0 z-30">
          <DayDetail
            date={selectedDate}
            vegetables={activeVegetables}
            taskRecords={taskRecords}
            onClose={() => setSelectedDate(null)}
          />
        </div>
      )}
    </div>
  );
}
