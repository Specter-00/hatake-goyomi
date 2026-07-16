import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { BottomTabBar } from './components/BottomTabBar';
import { HomePage } from './pages/home/HomePage';
import { AddVegetableModal } from './pages/home/AddVegetableModal';
import { CalendarPage } from './pages/calendar/CalendarPage';
import { RecordsPage } from './pages/records/RecordsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { OnboardingScreen } from './pages/settings/OnboardingScreen';
import { VegetableDetailPage } from './pages/vegetables/VegetableDetailPage';
import { MapPage } from './pages/map/MapPage';
import { useAppStore } from './store';
import { initSettings } from './db';
import { notifyTodayTasksOnce } from './utils/notification';

function App() {
  const {
    isAddVegetableOpen, setIsAddVegetableOpen,
    loadSettings, loadVegetables, loadTaskRecords,
    selectedVegetableId, setSelectedVegetableId,
    settings,
  } = useAppStore();

  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  // 文字サイズ設定をhtmlルートに反映（Tailwindのrem基準テキストが全体スケール）
  useEffect(() => {
    const sizeMap = { normal: '16px', large: '17.5px', xlarge: '19px' } as const;
    document.documentElement.style.fontSize = sizeMap[settings?.fontSize ?? 'normal'];
  }, [settings?.fontSize]);

  // テーマ設定を反映（auto時はOSの設定に追従）
  useEffect(() => {
    const theme = settings?.theme ?? 'light';
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const isDark = theme === 'dark' || (theme === 'auto' && media.matches);
      document.documentElement.classList.toggle('dark', isDark);
      // ステータスバー色も切り替え
      document.querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', isDark ? '#191D1B' : '#7CB98A');
    };
    apply();
    if (theme === 'auto') {
      media.addEventListener('change', apply);
      return () => media.removeEventListener('change', apply);
    }
  }, [settings?.theme]);

  useEffect(() => {
    const done = localStorage.getItem('onboarding_done') === '1';
    initSettings().then(async () => {
      await Promise.all([loadSettings(), loadVegetables(), loadTaskRecords()]);
      setOnboardingDone(done);
      // 通知ON設定なら、今日のタスクを1日1回通知
      const st = useAppStore.getState();
      if (st.settings?.notificationEnabled) {
        notifyTodayTasksOnce(st.vegetables);
      }
    });
  }, []);

  // ロード中
  if (onboardingDone === null) {
    return (
      <div className="flex items-center justify-center h-full bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
            <span className="text-2xl">🌱</span>
          </div>
          <p className="text-sm text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 初回オンボーディング
  if (!onboardingDone) {
    return (
      <div className="relative h-full w-full max-w-md mx-auto overflow-hidden">
        <OnboardingScreen onComplete={() => setOnboardingDone(true)} />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full max-w-md mx-auto overflow-hidden">
      <div className="h-full">
        <Routes>
          <Route path="/"         element={<HomePage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/map"      element={<MapPage />} />
          <Route path="/records"  element={<RecordsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>

      <BottomTabBar />

      {/* 野菜追加モーダル */}
      {isAddVegetableOpen && (
        <AddVegetableModal onClose={() => setIsAddVegetableOpen(false)} />
      )}

      {/* 野菜詳細（スタック表示） */}
      {selectedVegetableId && (
        <VegetableDetailPage
          vegetableId={selectedVegetableId}
          onClose={() => setSelectedVegetableId(null)}
        />
      )}
    </div>
  );
}

export default App;
