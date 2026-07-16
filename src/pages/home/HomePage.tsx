import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Plus, MapPin, Wind, Droplets, Thermometer, BookOpen, Navigation, ExternalLink } from 'lucide-react';
import { LibraryPage } from '../library/LibraryPage';
import { useAppStore } from '../../store';
import { useWeather, getWeatherLabel, getWeatherAdvice } from '../../hooks/useWeather';
import { WeatherIcon } from '../../components/WeatherIcon';
import { VegetableCard } from '../../components/VegetableCard';
import { TodayTasks } from '../../components/TodayTasks';
import { getPrefecture } from '../../data/prefectures';

export function HomePage() {
  const {
    vegetables, loadVegetables,
    settings, loadSettings,
    setIsAddVegetableOpen,
    setSelectedVegetableId,
  } = useAppStore();
  const { weather, fetchWeather, status: weatherStatus } = useWeather();

  useEffect(() => {
    loadSettings();
    loadVegetables();
  }, []);

  useEffect(() => {
    if (settings) fetchWeather();
  }, [settings]);

  const [libraryOpen, setLibraryOpen] = useState(false);
  const prefecture = settings ? getPrefecture(settings.prefectureCode) : null;
  const today = new Date();
  const dateLabel = format(today, 'M月d日 E曜日', { locale: ja });
  const hour = today.getHours();
  const greeting = hour < 5 ? 'こんばんは' : hour < 11 ? 'おはようございます' : hour < 18 ? 'こんにちは' : 'こんばんは';

  const activeVegetables = vegetables.filter(v => v.currentStage !== 'finished');

  return (
    <div className="flex flex-col h-full bg-bg-base">
      {/* ヘッダー：天気ブロック */}
      <div className="flex-shrink-0 bg-gradient-to-b from-[#EEF5EF] to-[#F7F3EC] px-5 pt-4 pb-5">
        {/* 日付・地域 */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500 font-medium mb-0.5">{greeting}</p>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight leading-tight">{dateLabel}</h1>
            {prefecture && (
              <div className="flex items-center gap-1 mt-1" data-testid="location-label">
                {settings?.useCurrentLocation
                  ? <Navigation size={11} className="text-wakatake" />
                  : <MapPin size={11} className="text-gray-400" />}
                <p className="text-xs text-gray-500">
                  {settings?.useCurrentLocation ? `現在地（${prefecture.name}付近）` : prefecture.name}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLibraryOpen(true)}
              data-testid="open-library"
              className="flex flex-col items-center gap-0.5 bg-white text-wakatake px-3 py-2 rounded-xl active:scale-95 transition-transform shadow-sm border border-gray-100"
            >
              <BookOpen size={16} />
              <span className="text-[10px] font-semibold">まなぶ</span>
            </button>
            <button
              onClick={() => setIsAddVegetableOpen(true)}
              className="flex flex-col items-center gap-0.5 bg-wakatake text-white px-3 py-2 rounded-xl active:scale-95 transition-transform shadow-sm"
            >
              <Plus size={16} />
              <span className="text-[10px] font-semibold">野菜追加</span>
            </button>
          </div>
        </div>

        {/* 天気カード */}
        {weather ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-white/80 shadow-soft p-4 anim-fade-up">
            <div className="flex items-center gap-4">
              <WeatherIcon code={weather.weatherCode} size={40} className="text-gray-600" />
              <div className="flex-1">
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-light text-gray-800">{weather.temperature}°</span>
                  <span className="text-sm text-gray-400 mb-1">/ {weather.dailyMax}° {weather.dailyMin}°</span>
                </div>
                <p className="text-sm text-gray-500">{getWeatherLabel(weather.weatherCode)}</p>
              </div>
              <div className="flex flex-col gap-1.5 text-right">
                <div className="flex items-center gap-1 justify-end text-xs text-gray-400">
                  <Droplets size={12} />
                  <span>{weather.precipitationProbability}%</span>
                </div>
                <div className="flex items-center gap-1 justify-end text-xs text-gray-400">
                  <Wind size={12} />
                  <span>{weather.windSpeed}m/s</span>
                </div>
                <div className="flex items-center gap-1 justify-end text-xs text-gray-400">
                  <Thermometer size={12} />
                  <span>体感 {weather.feelsLike}°</span>
                </div>
              </div>
            </div>
            {/* AIアドバイス */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 leading-relaxed">
                💡 {getWeatherAdvice(weather, weather.precipitationProbability)}
              </p>
            </div>
            {/* tenki.jpリンク */}
            <a
              href={`https://tenki.jp/search/?keyword=${encodeURIComponent(prefecture?.name ?? '沖縄県')}`}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="tenki-link"
              className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400"
            >
              <span>気象庁予報モデルで表示中</span>
              <span className="flex items-center gap-1 text-asagi font-medium">
                tenki.jpで詳しく見る
                <ExternalLink size={11} />
              </span>
            </a>

            {/* 週間予報 */}
            {weather.weekly.length > 1 && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex gap-1 overflow-x-auto scrollbar-hide" data-testid="weekly-forecast">
                {weather.weekly.slice(0, 7).map((day, i) => {
                  const d = new Date(day.date);
                  const youbi = ['日','月','火','水','木','金','土'][d.getDay()];
                  return (
                    <div key={day.date} className="flex flex-col items-center flex-1 min-w-[42px] gap-0.5">
                      <p className={`text-[10px] font-medium ${
                        i === 0 ? 'text-wakatake' : d.getDay() === 0 ? 'text-red-400' : d.getDay() === 6 ? 'text-blue-400' : 'text-gray-400'
                      }`}>
                        {i === 0 ? '今日' : youbi}
                      </p>
                      <WeatherIcon code={day.weatherCode} size={16} className="text-gray-500" />
                      <p className="text-[10px] text-gray-600">{day.maxTemp}°</p>
                      <p className="text-[10px] text-gray-400">{day.minTemp}°</p>
                      {day.precipProb >= 30 && (
                        <p className="text-[9px] text-blue-400">{day.precipProb}%</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : weatherStatus === 'error' ? (
          <div className="bg-white/70 rounded-xl border border-white/80 shadow-soft p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌤</span>
              <div className="flex-1">
                <p className="text-sm text-gray-500">天気情報を取得できませんでした</p>
                <div className="flex items-center gap-3 mt-1">
                  <button
                    onClick={() => fetchWeather()}
                    className="text-xs text-wakatake font-medium"
                  >
                    再読み込み
                  </button>
                  <a
                    href={`https://tenki.jp/search/?keyword=${encodeURIComponent(prefecture?.name ?? '沖縄県')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="tenki-link-fallback"
                    className="flex items-center gap-1 text-xs text-asagi font-medium"
                  >
                    tenki.jpで見る
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/70 rounded-xl border border-white/80 shadow-soft p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full" />
              <div className="flex-1">
                <div className="h-8 bg-gray-100 rounded w-20 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-16" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* スクロールエリア */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-5 py-4 space-y-6 pb-28">
          {/* 今日やること */}
          <section className="anim-fade-up anim-d1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">今日やること</h2>
              {activeVegetables.length > 0 && (
                <span className="text-xs text-gray-400">{activeVegetables.length}種類</span>
              )}
            </div>
            <TodayTasks vegetables={activeVegetables} />
          </section>

          {/* 育てている野菜 */}
          <section className="anim-fade-up anim-d2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">育てている野菜</h2>
              {activeVegetables.length > 0 && (
                <span className="text-xs text-gray-400">{activeVegetables.length}種類</span>
              )}
            </div>
            {vegetables.length === 0 ? (
              <div className="bg-white rounded-card shadow-soft border border-dashed border-gray-200 p-8 text-center">
                <div className="text-4xl mb-3">🌱</div>
                <p className="text-sm font-medium text-gray-500 mb-1">野菜が登録されていません</p>
                <p className="text-xs text-gray-400 mb-4">「野菜を追加」から始めてみましょう</p>
                <button
                  onClick={() => setIsAddVegetableOpen(true)}
                  className="text-xs font-medium text-wakatake bg-green-50 px-4 py-2 rounded-full"
                >
                  + 最初の野菜を登録する
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeVegetables.map(veg => (
                  <VegetableCard
                    key={veg.id}
                    vegetable={veg}
                    onClick={() => setSelectedVegetableId(veg.id)}
                  />
                ))}
                {/* 終了した野菜 */}
                {vegetables.filter(v => v.currentStage === 'finished').length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-400 mb-2 text-center">
                      終了した野菜 {vegetables.filter(v => v.currentStage === 'finished').length}種類
                    </p>
                    {vegetables
                      .filter(v => v.currentStage === 'finished')
                      .map(veg => (
                        <VegetableCard
                          key={veg.id}
                          vegetable={veg}
                          onClick={() => setSelectedVegetableId(veg.id)}
                        />
                      ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* 学習ライブラリ */}
      {libraryOpen && <LibraryPage onClose={() => setLibraryOpen(false)} />}
    </div>
  );
}
