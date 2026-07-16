import { useState } from 'react';
import { Check, Droplets, Sprout, Bug, Scissors, FlaskConical } from 'lucide-react';
import type { Vegetable, TaskType } from '../types';
import { getTodayTasks } from '../utils/vegetable';
import { useAppStore } from '../store';
import { generateId, today } from '../utils/vegetable';

interface TodayTask {
  vegetableId: string;
  vegetableName: string;
  taskType: TaskType;
  label: string;
  done: boolean;
}

const TASK_ICONS: Record<string, React.ReactNode> = {
  '水やり': <Droplets size={16} className="text-blue-400" />,
  '追肥': <Sprout size={16} className="text-amber-500" />,
  '害虫確認': <Bug size={16} className="text-red-400" />,
  '収穫': <Scissors size={16} className="text-yamabuki" />,
  '薬剤': <FlaskConical size={16} className="text-purple-400" />,
};

const LABEL_TO_TYPE: Record<string, TaskType> = {
  '水やり': 'water',
  '追肥': 'fertilize',
  '害虫確認': 'pest',
  '収穫': 'harvest',
  '薬剤': 'medicine',
};

interface TodayTasksProps {
  vegetables: Vegetable[];
}

export function TodayTasks({ vegetables }: TodayTasksProps) {
  const { addTaskRecord } = useAppStore();
  const [completedKeys, setCompletedKeys] = useState<Set<string>>(new Set());

  // 全野菜の今日のタスクを集める
  const allTasks: TodayTask[] = vegetables.flatMap(veg => {
    const tasks = getTodayTasks(veg);
    return tasks.map(label => ({
      vegetableId: veg.id,
      vegetableName: veg.name,
      taskType: LABEL_TO_TYPE[label] ?? 'other',
      label,
      done: false,
    }));
  });

  const handleComplete = async (task: TodayTask, key: string) => {
    if (completedKeys.has(key)) return;
    setCompletedKeys(prev => new Set([...prev, key]));
    await addTaskRecord({
      id: generateId(),
      vegetableId: task.vegetableId,
      date: today(),
      taskType: task.taskType,
      note: '',
      createdAt: new Date().toISOString(),
    });
  };

  if (allTasks.length === 0) {
    return (
      <div className="bg-white rounded-card shadow-soft border border-gray-100 p-4 text-center">
        <p className="text-sm text-gray-400">今日の作業はありません</p>
        <p className="text-xs text-gray-300 mt-1">野菜を登録してみましょう</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {allTasks.map((task) => {
        const key = `${task.vegetableId}-${task.label}`;
        const isDone = completedKeys.has(key);

        return (
          <div
            key={key}
            className={`flex items-center gap-3 bg-white rounded-card shadow-soft border border-gray-100 p-3 transition-opacity ${
              isDone ? 'opacity-40' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
              {TASK_ICONS[task.label] ?? <Sprout size={16} className="text-wakatake" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{task.label}</p>
              <p className="text-xs text-gray-500 truncate">{task.vegetableName}</p>
            </div>
            <button
              onClick={() => handleComplete(task, key)}
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                isDone
                  ? 'bg-wakatake border-wakatake'
                  : 'border-gray-200 bg-white active:scale-90'
              }`}
            >
              {isDone && <Check size={14} className="text-white" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
