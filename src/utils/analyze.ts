/**
 * AI写真分析クライアント
 * dataURL画像を /api/analyze-plant（Vercelサーバーレス）に送り、結果を受け取る
 */

export interface PlantAnalysis {
  species: string;
  confidence: '高' | '中' | '低';
  health: '良好' | '注意' | '不調';
  issues: string[];
  advice: string[];
}

export type AnalyzeError = 'not_configured' | 'too_large' | 'network' | 'api_error';

export async function analyzePlantPhoto(
  dataUrl: string,
  vegetableName?: string,
): Promise<{ ok: true; result: PlantAnalysis } | { ok: false; error: AnalyzeError }> {
  // dataURL → base64 と mediaType に分解
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!match) return { ok: false, error: 'api_error' };
  const [, mediaType, imageBase64] = match;

  if (imageBase64.length > 2_000_000) {
    return { ok: false, error: 'too_large' };
  }

  try {
    const res = await fetch('/api/analyze-plant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mediaType, vegetableName }),
    });

    if (res.status === 503) return { ok: false, error: 'not_configured' };
    if (res.status === 413) return { ok: false, error: 'too_large' };
    if (!res.ok) return { ok: false, error: res.status === 404 ? 'not_configured' : 'api_error' };

    const result = (await res.json()) as PlantAnalysis;
    return { ok: true, result };
  } catch {
    return { ok: false, error: 'network' };
  }
}
