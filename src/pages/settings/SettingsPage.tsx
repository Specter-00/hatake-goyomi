import { useState, useEffect } from 'react';
import {
  MapPin, Bell, BellOff, Type, Trash2, ChevronRight,
  Info, Check, AlertCircle, Moon, Sun, MonitorSmartphone, Navigation, Loader2,
} from 'lucide-react';
import { PREFECTURES, nearestPrefecture } from '../../data/prefectures';
import { useAppStore } from '../../store';
import { requestNotificationPermission, notificationPermission } from '../../utils/notification';

// REGIONS の簡易リスト（OnboardingScreenと同一定義）
const REGION_LABELS: Record<string, string> = {
  hokkaido: '北海道',
  tohoku:   '東北',
  kanto:    '関東',
  chubu:    '中部',
  kinki:    '近畿',
  chugoku:  '中国',
  shikoku:  '四国',
  kyushu:   '九州・沖縄',
};

const REGION_KEYS = Object.keys(REGION_LABELS);

export function SettingsPage() {
  const { settings, updateSettings, vegetables, deleteVegetable } = useAppStore();

  const [regionOpen, setRegionOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [notifTime, setNotifTime] = useState(settings?.notificationTime ?? '08:00');
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (settings) {
      setNotifTime(settings.notificationTime);
      const pref = PREFECTURES.find(p => p.code === settings.prefectureCode);
      if (pref) setSelectedRegion(pref.region);
    }
  }, [settings]);

  const currentPref = PREFECTURES.find(p => p.code === settings?.prefectureCode);
  const prefsByRegion = selectedRegion
    ? PREFECTURES.filter(p => p.region === selectedRegion)
    : [];

  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const handleUseCurrentLocation = async () => {
    if (locating) return;
    setLocationError('');
    if (!('geolocation' in navigator)) {
      setLocationError('この端末では位置情報が利用できません');
      return;
    }
    setLocating(true);
    try {
      // 許可ダイアログ放置などでコールバックが来ないケースに備えた独自タイムアウト
      const pos = await Promise.race([
        new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            maximumAge: 5 * 60 * 1000,
          })
        ),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject({ code: 3 } as GeolocationPositionError), 12000)
        ),
      ]);
      const { latitude, longitude } = pos.coords;
      const nearest = nearestPrefecture(latitude, longitude);
      await updateSettings({
        useCurrentLocation: true,
        customLat: Math.round(latitude * 1000) / 1000,   // プライバシー配慮で約100m精度に丸め
        customLon: Math.round(longitude * 1000) / 1000,
        prefectureCode: nearest.code, // 植え付け時期の判定は最寄り県を使用
      });
      showSaved();
    } catch (err) {
      const e = err as GeolocationPositionError;
      setLocationError(
        e.code === 1
          ? '位置情報がブロックされています。ブラウザの設定から許可してください'
          : '現在地を取得できませんでした。もう一度お試しください'
      );
    }
    setLocating(false);
  };

  const handleDisableCurrentLocation = async () => {
    await updateSettings({ useCurrentLocation: false });
    showSaved();
  };

  const handlePrefSelect = async (code: string) => {
    await updateSettings({ prefectureCode: code, useCurrentLocation: false });
    setRegionOpen(false);
    showSaved();
  };

  const handleNotifToggle = async () => {
    const turningOn = !settings?.notificationEnabled;
    if (turningOn) {
      await requestNotificationPermission();
    }
    await updateSettings({ notificationEnabled: turningOn });
    showSaved();
  };

  const handleNotifTimeChange = async (time: string) => {
    setNotifTime(time);
    await updateSettings({ notificationTime: time });
    showSaved();
  };

  const handleFontSize = async (size: 'normal' | 'large' | 'xlarge') => {
    await updateSettings({ fontSize: size });
    showSaved();
  };

  const handleTheme = async (theme: 'light' | 'dark' | 'auto') => {
    await updateSettings({ theme });
    showSaved();
  };

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDeleteAll = async () => {
    for (const v of vegetables) {
      await deleteVegetable(v.id);
    }
    setDeleteConfirm(false);
    showSaved();
  };

  return (
    <div className="flex flex-col h-full bg-bg-base">
      {/* ヘッダー */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-5 py-4 safe-top">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-gray-800">設定</h1>
          {saved && (
            <div className="flex items-center gap-1.5 text-xs text-wakatake bg-green-50 px-3 py-1.5 rounded-full">
              <Check size={12} />
              <span>保存しました</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-28">
        <div className="px-5 py-4 space-y-5">

          {/* 地域設定 */}
          <Section title="地域" icon={<MapPin size={15} className="text-wakatake" />}>
            {/* 現在地を使う */}
            <button
              onClick={settings?.useCurrentLocation ? handleDisableCurrentLocation : handleUseCurrentLocation}
              disabled={locating}
              data-testid="use-current-location"
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border shadow-soft mb-2 transition-colors ${
                settings?.useCurrentLocation
                  ? 'bg-green-50 border-wakatake/40'
                  : 'bg-white border-gray-100'
              }`}
            >
              {locating
                ? <Loader2 size={18} className="text-wakatake animate-spin" />
                : <Navigation size={18} className={settings?.useCurrentLocation ? 'text-wakatake' : 'text-gray-400'} />}
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-700">
                  {locating ? '現在地を取得中...' : settings?.useCurrentLocation ? '現在地を使用中' : '現在地を使う'}
                </p>
                <p className="text-xs text-gray-400">
                  {settings?.useCurrentLocation
                    ? 'タップで都道府県選択に戻す'
                    : 'GPSの位置で天気をより正確に'}
                </p>
              </div>
              {settings?.useCurrentLocation && <Check size={16} className="text-wakatake" />}
            </button>
            {locationError && (
              <p className="text-xs text-shu px-1 mb-2" data-testid="location-error">{locationError}</p>
            )}

            <button
              onClick={() => setRegionOpen(!regionOpen)}
              className="w-full flex items-center justify-between px-4 py-3.5 bg-white rounded-xl border border-gray-100 shadow-soft"
            >
              <div className="text-left">
                <p className="text-xs text-gray-400 mb-0.5">現在の地域</p>
                <p className="text-sm font-semibold text-gray-800">
                  {settings?.useCurrentLocation
                    ? `現在地（${currentPref?.name ?? ''}付近）`
                    : currentPref?.name ?? '未設定'}
                </p>
              </div>
              <ChevronRight
                size={16}
                className={`text-gray-300 transition-transform ${regionOpen ? 'rotate-90' : ''}`}
              />
            </button>

            {regionOpen && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-hidden mt-2">
                {/* 地方選択 */}
                <div className="px-4 pt-3 pb-2">
                  <p className="text-xs font-semibold text-gray-400 mb-2">地方を選択</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {REGION_KEYS.map(key => (
                      <button
                        key={key}
                        onClick={() => setSelectedRegion(key)}
                        className={`text-xs py-2 rounded-lg font-medium transition-colors ${
                          selectedRegion === key
                            ? 'bg-wakatake text-white'
                            : 'bg-gray-50 text-gray-500'
                        }`}
                      >
                        {REGION_LABELS[key]}
                      </button>
                    ))}
                  </div>
                </div>
                {/* 都道府県 */}
                {prefsByRegion.length > 0 && (
                  <div className="border-t border-gray-50 px-4 py-3">
                    <p className="text-xs font-semibold text-gray-400 mb-2">都道府県を選択</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {prefsByRegion.map(pref => (
                        <button
                          key={pref.code}
                          onClick={() => handlePrefSelect(pref.code)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm border transition-colors ${
                            settings?.prefectureCode === pref.code
                              ? 'bg-green-50 text-wakatake border-wakatake/30 font-medium'
                              : 'bg-gray-50 text-gray-600 border-transparent'
                          }`}
                        >
                          <span>{pref.name}</span>
                          {settings?.prefectureCode === pref.code && (
                            <Check size={12} className="text-wakatake" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* 通知設定 */}
          <Section title="通知" icon={<Bell size={15} className="text-wakatake" />}>
            <div className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-hidden">
              {/* ON/OFFトグル */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  {settings?.notificationEnabled
                    ? <Bell size={18} className="text-wakatake" />
                    : <BellOff size={18} className="text-gray-300" />
                  }
                  <div>
                    <p className="text-sm font-medium text-gray-700">毎日のお知らせ</p>
                    <p className="text-xs text-gray-400">水やり・収穫タイミングを通知</p>
                  </div>
                </div>
                <Toggle
                  enabled={settings?.notificationEnabled ?? false}
                  onToggle={handleNotifToggle}
                />
              </div>

              {/* 通知時間 */}
              {settings?.notificationEnabled && (
                <div className="px-4 py-3.5 flex items-center justify-between">
                  <p className="text-sm text-gray-600">通知時間</p>
                  <input
                    type="time"
                    value={notifTime}
                    onChange={e => handleNotifTimeChange(e.target.value)}
                    className="bg-gray-50 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 outline-none border border-gray-100 focus:border-wakatake"
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 px-1 mt-1.5">
              {notificationPermission() === 'denied'
                ? '※通知がブロックされています。ブラウザの設定から許可してください'
                : notificationPermission() === 'granted'
                ? '※アプリを開いたときに今日のお世話を通知します'
                : '※ブラウザの通知許可が必要です'}
            </p>
          </Section>

          {/* 文字サイズ */}
          <Section title="文字サイズ" icon={<Type size={15} className="text-wakatake" />}>
            <div className="bg-white rounded-xl border border-gray-100 shadow-soft">
              {(
                [
                  { key: 'normal',  label: '標準', sample: 'あ' },
                  { key: 'large',   label: '大きい', sample: 'あ' },
                  { key: 'xlarge',  label: 'とても大きい', sample: 'あ' },
                ] as const
              ).map(({ key, label, sample }, i, arr) => (
                <button
                  key={key}
                  onClick={() => handleFontSize(key)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 ${
                    i < arr.length - 1 ? 'border-b border-gray-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-gray-600"
                      style={{ fontSize: key === 'normal' ? 14 : key === 'large' ? 18 : 22 }}
                    >
                      {sample}
                    </span>
                    <span className="text-sm text-gray-700">{label}</span>
                  </div>
                  {settings?.fontSize === key && (
                    <Check size={16} className="text-wakatake" />
                  )}
                </button>
              ))}
            </div>
          </Section>

          {/* 表示テーマ */}
          <Section title="表示テーマ" icon={<Moon size={15} className="text-wakatake" />}>
            <div className="bg-white rounded-xl border border-gray-100 shadow-soft">
              {(
                [
                  { key: 'light', label: 'ライト', icon: <Sun size={16} className="text-amber-500" /> },
                  { key: 'dark',  label: 'ダーク', icon: <Moon size={16} className="text-fuji" /> },
                  { key: 'auto',  label: '端末の設定に合わせる', icon: <MonitorSmartphone size={16} className="text-asagi" /> },
                ] as const
              ).map(({ key, label, icon }, i, arr) => (
                <button
                  key={key}
                  data-testid={`theme-${key}`}
                  onClick={() => handleTheme(key)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 ${
                    i < arr.length - 1 ? 'border-b border-gray-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {icon}
                    <span className="text-sm text-gray-700">{label}</span>
                  </div>
                  {(settings?.theme ?? 'light') === key && (
                    <Check size={16} className="text-wakatake" />
                  )}
                </button>
              ))}
            </div>
          </Section>

          {/* アプリ情報 */}
          <Section title="このアプリについて" icon={<Info size={15} className="text-wakatake" />}>
            <div className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-hidden">
              <InfoRow label="バージョン" value="1.0.0" />
              <InfoRow label="野菜データ" value={`${vegetables.length}種類登録中`} border />
            </div>
          </Section>

          {/* データ管理 */}
          <Section title="データ管理" icon={<Trash2 size={15} className="text-shu" />}>
            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-xl border border-gray-100 shadow-soft text-shu"
              >
                <Trash2 size={16} />
                <span className="text-sm font-medium">すべての野菜データを削除</span>
              </button>
            ) : (
              <div className="bg-red-50 rounded-xl border border-red-100 p-4">
                <div className="flex items-start gap-2 mb-4">
                  <AlertCircle size={16} className="text-shu mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700 leading-relaxed">
                    全ての野菜と記録が削除されます。この操作は取り消せません。
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="py-3 rounded-xl text-sm font-medium bg-white text-gray-600 border border-gray-200"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleDeleteAll}
                    className="py-3 rounded-xl text-sm font-medium bg-shu text-white"
                  >
                    削除する
                  </button>
                </div>
              </div>
            )}
          </Section>

        </div>
      </div>
    </div>
  );
}

/* 共通部品 */
function Section({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 px-1">
        {icon}
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-wakatake' : 'bg-gray-200'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function InfoRow({ label, value, border }: { label: string; value: string; border?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3.5 ${border ? '' : 'border-b border-gray-50'}`}>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-sm text-gray-400">{value}</p>
    </div>
  );
}
