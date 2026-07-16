import { useState } from 'react';
import { ChevronRight, MapPin, Bell, BellOff, Check, Leaf } from 'lucide-react';
import { PREFECTURES } from '../../data/prefectures';
import { useAppStore } from '../../store';
import { requestNotificationPermission } from '../../utils/notification';

interface OnboardingProps {
  onComplete: () => void;
}

type Step = 'welcome' | 'region' | 'notification' | 'done';

const REGIONS = [
  { key: 'hokkaido', label: '北海道' },
  { key: 'tohoku',   label: '東北' },
  { key: 'kanto',    label: '関東' },
  { key: 'chubu',    label: '中部' },
  { key: 'kinki',    label: '近畿' },
  { key: 'chugoku',  label: '中国' },
  { key: 'shikoku',  label: '四国' },
  { key: 'kyushu',   label: '九州・沖縄' },
] as const;

export function OnboardingScreen({ onComplete }: OnboardingProps) {
  const { updateSettings } = useAppStore();
  const [step, setStep] = useState<Step>('welcome');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedPref, setSelectedPref] = useState<string | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifTime, setNotifTime] = useState('08:00');
  const [saving, setSaving] = useState(false);

  const prefsByRegion = selectedRegion
    ? PREFECTURES.filter(p => p.region === selectedRegion)
    : [];

  const handleFinish = async () => {
    if (saving) return;
    setSaving(true);
    if (notifEnabled) {
      await requestNotificationPermission();
    }
    await updateSettings({
      prefectureCode: selectedPref ?? '13',
      notificationEnabled: notifEnabled,
      notificationTime: notifTime,
    });
    localStorage.setItem('onboarding_done', '1');
    setSaving(false);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg-base flex flex-col safe-top">

      {/* === ウェルカム === */}
      {step === 'welcome' && (
        <div className="flex flex-col items-center justify-center flex-1 px-8 text-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#EAF4E8] to-[#C8DDD4] flex items-center justify-center mb-8 shadow-soft">
            <Leaf size={44} className="text-wakatake" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3 tracking-tight">畑ごよみ</h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-2">
            初心者でも迷わず、収穫まで育てられる
          </p>
          <p className="text-sm text-gray-500 leading-relaxed mb-10">
            家庭菜園の記録アプリです
          </p>

          {/* 特徴 */}
          <div className="w-full space-y-3 mb-10">
            {[
              { icon: '📅', text: 'カレンダーで作業を一目確認' },
              { icon: '🌤', text: '今日の天気に合わせたアドバイス' },
              { icon: '🌱', text: '種まきから収穫まで丁寧にサポート' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-soft border border-gray-50">
                <span className="text-xl">{icon}</span>
                <p className="text-sm text-gray-600">{text}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep('region')}
            className="w-full bg-wakatake text-white font-semibold py-4 rounded-xl shadow-sm active:scale-[0.98] transition-transform"
          >
            はじめる
          </button>
        </div>
      )}

      {/* === 地域選択 === */}
      {step === 'region' && (
        <div className="flex flex-col h-full">
          {/* ヘッダー */}
          <div className="flex-shrink-0 px-5 pt-4 pb-4">
            <StepIndicator current={1} total={2} />
            <div className="flex items-center gap-2 mt-4 mb-1">
              <MapPin size={18} className="text-wakatake" />
              <h2 className="text-lg font-bold text-gray-800">お住まいの地域を選んでください</h2>
            </div>
            <p className="text-xs text-gray-400 pl-7">
              地域に合わせた植え付け時期・天気をお知らせします
            </p>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-8">
            {/* 地方選択 */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {REGIONS.map(r => (
                <button
                  key={r.key}
                  onClick={() => { setSelectedRegion(r.key); setSelectedPref(null); }}
                  className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                    selectedRegion === r.key
                      ? 'bg-wakatake text-white border-wakatake shadow-sm'
                      : 'bg-white text-gray-600 border-gray-100 shadow-soft'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* 都道府県 */}
            {prefsByRegion.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 px-1">都道府県を選んでください</p>
                <div className="grid grid-cols-2 gap-2">
                  {prefsByRegion.map(pref => (
                    <button
                      key={pref.code}
                      onClick={() => setSelectedPref(pref.code)}
                      className={`py-3 rounded-xl text-sm font-medium border transition-all flex items-center justify-between px-4 ${
                        selectedPref === pref.code
                          ? 'bg-seiji/40 text-gray-800 border-wakatake/50'
                          : 'bg-white text-gray-600 border-gray-100 shadow-soft'
                      }`}
                    >
                      <span>{pref.name}</span>
                      {selectedPref === pref.code && (
                        <Check size={14} className="text-wakatake" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 次へボタン */}
          <div className="flex-shrink-0 px-5 pb-8">
            <button
              onClick={() => setStep('notification')}
              disabled={!selectedPref}
              className="w-full bg-wakatake text-white font-semibold py-4 rounded-xl shadow-sm active:scale-[0.98] transition-transform disabled:opacity-40"
            >
              次へ
              <ChevronRight size={16} className="inline ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* === 通知設定 === */}
      {step === 'notification' && (
        <div className="flex flex-col h-full">
          <div className="flex-shrink-0 px-5 pt-4 pb-4">
            <StepIndicator current={2} total={2} />
            <div className="flex items-center gap-2 mt-4 mb-1">
              <Bell size={18} className="text-wakatake" />
              <h2 className="text-lg font-bold text-gray-800">通知の設定</h2>
            </div>
            <p className="text-xs text-gray-400 pl-7">
              水やりや収穫のタイミングをお知らせします
            </p>
          </div>

          <div className="flex-1 px-5">
            {/* ON/OFF選択 */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setNotifEnabled(true)}
                className={`flex flex-col items-center gap-2 py-5 rounded-xl border transition-all ${
                  notifEnabled
                    ? 'bg-wakatake text-white border-wakatake shadow-sm'
                    : 'bg-white text-gray-500 border-gray-100 shadow-soft'
                }`}
              >
                <Bell size={24} />
                <span className="text-sm font-medium">通知する</span>
              </button>
              <button
                onClick={() => setNotifEnabled(false)}
                className={`flex flex-col items-center gap-2 py-5 rounded-xl border transition-all ${
                  !notifEnabled
                    ? 'bg-gray-100 text-gray-700 border-gray-200'
                    : 'bg-white text-gray-400 border-gray-100 shadow-soft'
                }`}
              >
                <BellOff size={24} />
                <span className="text-sm font-medium">通知しない</span>
              </button>
            </div>

            {/* 通知時間（ON時のみ） */}
            {notifEnabled && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-4">
                <p className="text-xs font-semibold text-gray-500 mb-3">通知時間</p>
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={notifTime}
                    onChange={e => setNotifTime(e.target.value)}
                    className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-base font-medium text-gray-700 outline-none border border-gray-100 focus:border-wakatake"
                  />
                  <div className="text-right">
                    <p className="text-xs text-gray-400">毎朝</p>
                    <p className="text-xs text-gray-400">お知らせ</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                  ※通知は初回起動後にOSの許可が必要です
                </p>
              </div>
            )}

            {/* 後で設定 */}
            <button
              onClick={() => setStep('done')}
              className="mt-4 w-full text-center text-sm text-gray-400 py-3"
            >
              あとで設定する
            </button>
          </div>

          <div className="flex-shrink-0 px-5 pb-8">
            <button
              onClick={() => setStep('done')}
              className="w-full bg-wakatake text-white font-semibold py-4 rounded-xl shadow-sm active:scale-[0.98] transition-transform"
            >
              設定を保存する
            </button>
          </div>
        </div>
      )}

      {/* === 完了 === */}
      {step === 'done' && (
        <div className="flex flex-col items-center justify-center flex-1 px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
            <Check size={36} className="text-wakatake" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">準備ができました！</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-10">
            野菜を登録して、<br />家庭菜園の記録を始めましょう
          </p>
          <button
            onClick={handleFinish}
            disabled={saving}
            className="w-full bg-wakatake text-white font-semibold py-4 rounded-xl shadow-sm active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {saving ? '設定中...' : 'アプリをはじめる'}
          </button>
        </div>
      )}
    </div>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i + 1 <= current ? 'bg-wakatake w-8' : 'bg-gray-200 w-4'
          }`}
        />
      ))}
      <span className="text-xs text-gray-400 ml-1">{current} / {total}</span>
    </div>
  );
}
