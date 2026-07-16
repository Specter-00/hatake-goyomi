import { useRef, useState } from 'react';
import {
  Sparkles, Loader2, CheckCircle2, AlertTriangle, AlertCircle, X,
} from 'lucide-react';

interface AnalysisResult {
  ok: boolean;
  species: string;
  confidence: 'high' | 'medium' | 'low';
  health: 'good' | 'caution' | 'concern';
  healthLabel: string;
  issues: string[];
  advice: string;
  disclaimer: string;
  message?: string;
  error?: string;
}

interface PlantAnalyzerProps {
  vegetableName: string;
  /** dataURL(jpeg)を受け取り base64部分とmediaTypeを渡す */
  compress: (file: File) => Promise<string>;
  /** アドバイスを記録として保存 */
  onSaveNote?: (note: string) => Promise<void>;
}

const CONFIDENCE_LABEL = { high: '自信あり', medium: 'たぶん', low: '推測' } as const;

/**
 * AI写真分析
 * 写真を撮る/選ぶ → /api/analyze-plant → 種類・健康状態・アドバイスを表示
 */
export function PlantAnalyzer({ vegetableName, compress, onSaveNote }: PlantAnalyzerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error' | 'unconfigured'>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setState('loading');
    setResult(null);
    setNoteSaved(false);

    try {
      const dataUrl = await compress(file);
      setPreviewUrl(dataUrl);
      const [head, base64] = dataUrl.split(',');
      const mediaType = head.match(/data:(.*?);/)?.[1] ?? 'image/jpeg';

      const res = await fetch('/api/analyze-plant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType, vegetableName }),
      });

      if (res.status === 503) {
        setState('unconfigured');
        return;
      }
      if (res.status === 404 || res.status === 405) {
        // ローカル開発（vite dev）では関数が無い
        setErrorMsg('AI分析は公開版（Vercel上）でのみ利用できます');
        setState('error');
        return;
      }
      const json: AnalysisResult = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'analyze failed');

      setResult(json);
      setState('done');
    } catch (err) {
      console.error(err);
      setErrorMsg('分析に失敗しました。電波の良い場所でもう一度お試しください');
      setState('error');
    }
  };

  const handleSaveNote = async () => {
    if (!result || !onSaveNote || noteSaved) return;
    const issueText = result.issues.length > 0 ? `気になる点: ${result.issues.join(' / ')}。` : '';
    await onSaveNote(`AI分析: ${result.healthLabel}。${issueText}${result.advice}`);
    setNoteSaved(true);
  };

  const healthStyle = {
    good:    { icon: <CheckCircle2 size={16} className="text-wakatake" />,  bg: 'bg-green-50',  border: 'border-green-100',  label: '良好' },
    caution: { icon: <AlertTriangle size={16} className="text-yamabuki" />, bg: 'bg-amber-50',  border: 'border-amber-100',  label: '注意' },
    concern: { icon: <AlertCircle size={16} className="text-shu" />,        bg: 'bg-red-50',    border: 'border-red-100',    label: '心配' },
  } as const;

  return (
    <div className="mb-4" data-testid="plant-analyzer">
      <input
        ref={inputRef} type="file" accept="image/*"
        onChange={handleSelect} className="hidden" data-testid="analyzer-input"
      />

      {/* 分析ボタン */}
      {state !== 'loading' && (
        <button
          onClick={() => inputRef.current?.click()}
          data-testid="analyzer-open"
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-wakatake to-moegi text-white text-sm font-semibold shadow-sm active:scale-[0.99] transition-transform"
        >
          <Sparkles size={16} />
          <span>写真をAIで分析（種類・元気度チェック）</span>
        </button>
      )}

      {/* 読み込み中 */}
      {state === 'loading' && (
        <div className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gray-100 text-sm font-medium text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          <span>AIが写真を見ています...</span>
        </div>
      )}

      {/* エラー */}
      {state === 'error' && (
        <p className="text-xs text-shu mt-2 px-1" data-testid="analyzer-error">{errorMsg}</p>
      )}

      {/* 未設定 */}
      {state === 'unconfigured' && (
        <p className="text-xs text-gray-500 mt-2 px-1" data-testid="analyzer-unconfigured">
          AI分析は準備中です（管理者がAPIキーを設定すると使えます）
        </p>
      )}

      {/* 結果カード */}
      {state === 'done' && result && (
        <div className="mt-3 bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden" data-testid="analyzer-result">
          <div className="flex items-start gap-3 p-4 pb-3">
            {previewUrl && (
              <img src={previewUrl} alt="分析した写真" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles size={12} className="text-wakatake" />
                <p className="text-[10px] font-semibold text-wakatake">AI分析結果</p>
              </div>
              <p className="text-sm font-bold text-gray-800">
                {result.species}
                <span className="text-[10px] font-normal text-gray-400 ml-1.5">
                  （{CONFIDENCE_LABEL[result.confidence]}）
                </span>
              </p>
              <div className={`inline-flex items-center gap-1.5 mt-1.5 px-2 py-1 rounded-full ${healthStyle[result.health].bg}`}>
                {healthStyle[result.health].icon}
                <span className="text-xs font-medium text-gray-700">{result.healthLabel}</span>
              </div>
            </div>
            <button onClick={() => { setState('idle'); setResult(null); }} className="p-1 -mr-1 -mt-1">
              <X size={16} className="text-gray-300" />
            </button>
          </div>

          {result.issues.length > 0 && (
            <div className="px-4 pb-3">
              <p className="text-[10px] font-semibold text-gray-400 mb-1">気になる点</p>
              {result.issues.map((issue, i) => (
                <p key={i} className="text-xs text-gray-600 leading-relaxed">• {issue}</p>
              ))}
            </div>
          )}

          <div className={`mx-4 mb-3 rounded-xl border p-3 ${healthStyle[result.health].bg} ${healthStyle[result.health].border}`}>
            <p className="text-xs text-gray-700 leading-relaxed">{result.advice}</p>
          </div>

          <div className="px-4 pb-3 flex items-center justify-between gap-2">
            <p className="text-[10px] text-gray-400 leading-relaxed flex-1">{result.disclaimer}</p>
            {onSaveNote && (
              <button
                onClick={handleSaveNote}
                disabled={noteSaved}
                data-testid="analyzer-save-note"
                className={`flex-shrink-0 text-xs font-medium px-3 py-2 rounded-full transition-colors ${
                  noteSaved ? 'bg-gray-100 text-gray-400' : 'bg-green-50 text-wakatake'
                }`}
              >
                {noteSaved ? '記録しました ✓' : '記録に残す'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
