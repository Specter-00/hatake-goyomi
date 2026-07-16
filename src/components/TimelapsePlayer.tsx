import { useEffect, useRef, useState } from 'react';
import { X, Play, Pause } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { PhotoRecord } from '../types';

interface TimelapsePlayerProps {
  photos: PhotoRecord[];   // 古い順に並んだ写真
  vegetableName: string;
  plantedAt: string;
  onClose: () => void;
}

const FRAME_MS = 700; // 1コマの表示時間

/**
 * タイムラプス風スライドショー
 * 植え付けからの成長を1本の映像のように自動再生する
 */
export function TimelapsePlayer({ photos, vegetableName, plantedAt, onClose }: TimelapsePlayerProps) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) return;
    timerRef.current = setInterval(() => {
      setIndex(i => {
        if (i >= photos.length - 1) {
          setPlaying(false); // 最後で停止
          return i;
        }
        return i + 1;
      });
    }, FRAME_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, photos.length]);

  const current = photos[index];
  if (!current) return null;

  const dayNumber = Math.floor(
    (new Date(current.date).getTime() - new Date(plantedAt).getTime()) / 86400000
  );

  const handleRestart = () => { setIndex(0); setPlaying(true); };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col" data-testid="timelapse-player">
      {/* ヘッダー */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 pt-4 pb-3 safe-top">
        <div>
          <p className="text-white text-sm font-semibold">{vegetableName}の成長記録</p>
          <p className="text-white/50 text-xs">
            {format(parseISO(current.date), 'M月d日(E)', { locale: ja })}
          </p>
        </div>
        <button onClick={onClose} className="p-2 -mr-2" data-testid="timelapse-close">
          <X size={22} className="text-white/80" />
        </button>
      </div>

      {/* 写真 */}
      <div className="flex-1 flex items-center justify-center px-2 min-h-0">
        <img
          src={current.photoUrl}
          alt={`${vegetableName} ${current.date}`}
          className="max-w-full max-h-full object-contain rounded-xl"
          data-testid="timelapse-frame"
        />
      </div>

      {/* 日数バッジ */}
      <div className="flex-shrink-0 flex justify-center pt-3">
        <div className="bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5">
          <p className="text-white text-sm font-medium" data-testid="timelapse-day">
            🌱 植え付けから {dayNumber}日目
          </p>
        </div>
      </div>

      {/* コントロール */}
      <div className="flex-shrink-0 px-5 pt-4 pb-8 safe-bottom">
        {/* プログレスバー */}
        <div className="flex items-center gap-1 mb-4">
          {photos.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full transition-colors duration-200"
              style={{ backgroundColor: i <= index ? '#7CB98A' : 'rgba(255,255,255,0.2)' }}
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-6">
          <p className="text-white/40 text-xs w-16 text-right">{index + 1} / {photos.length}</p>
          {index >= photos.length - 1 && !playing ? (
            <button
              onClick={handleRestart}
              className="w-14 h-14 rounded-full bg-wakatake flex items-center justify-center active:scale-95 transition-transform"
              data-testid="timelapse-toggle"
            >
              <Play size={22} className="text-white ml-0.5" />
            </button>
          ) : (
            <button
              onClick={() => setPlaying(!playing)}
              className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center active:scale-95 transition-transform"
              data-testid="timelapse-toggle"
            >
              {playing
                ? <Pause size={22} className="text-white" />
                : <Play size={22} className="text-white ml-0.5" />}
            </button>
          )}
          <p className="text-white/40 text-xs w-16">
            {index >= photos.length - 1 && !playing ? 'もう一度' : playing ? '再生中' : '一時停止'}
          </p>
        </div>
      </div>
    </div>
  );
}
