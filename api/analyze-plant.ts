/**
 * 植物写真のAI分析（Vercelサーバーレス関数）
 *
 * POST /api/analyze-plant
 * body: { imageBase64, mediaType, vegetableName? }
 * 返却: { ok, species, confidence, health, healthLabel, issues[], advice, disclaimer }
 *
 * 必要な設定:
 *   Vercel → プロジェクト → Settings → Environment Variables
 *   ANTHROPIC_API_KEY = sk-ant-...
 *   ※APIキーをクライアントに置かないため、この関数を経由する設計
 */

const MAX_BASE64_LENGTH = 2_000_000; // 約1.5MB（クライアントで圧縮済み前提）
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      ok: false,
      error: 'not_configured',
      message: 'AI分析は準備中です（VercelにANTHROPIC_API_KEYを設定すると使えます）',
    });
  }

  try {
    const { imageBase64, mediaType, vegetableName } = req.body ?? {};
    if (!imageBase64 || !mediaType) {
      return res.status(400).json({ ok: false, error: 'missing_image' });
    }
    if (typeof imageBase64 !== 'string' || imageBase64.length > MAX_BASE64_LENGTH) {
      return res.status(413).json({ ok: false, error: 'image_too_large' });
    }
    if (!ALLOWED_TYPES.includes(mediaType)) {
      return res.status(400).json({ ok: false, error: 'bad_media_type' });
    }

    const systemPrompt = `あなたは家庭菜園の観察を手伝う園芸アドバイザーです。写真を見て以下のJSONだけを返してください。前置き・マークダウン・コードブロックは一切不要です。

{
  "species": "写っている植物の推定（例: ミニトマト。わからなければ「判別できませんでした」）",
  "confidence": "high | medium | low",
  "health": "good | caution | concern",
  "healthLabel": "状態の一言（例: おおむね順調です / 葉に気になる様子があります）",
  "issues": ["気になる点を最大3つ。なければ空配列"],
  "advice": "今日からできる具体的なアドバイスを2〜3文。高校生にも読める言葉で"
}

注意:
- 病名の断定は避け「〜の可能性」という表現にする
- 農薬の具体的な使用指示はしない（必要なら園芸店やJAへの相談を案内する）
- 植物が写っていない場合は species を「植物が写っていないようです」、healthは"good"、issuesは空、adviceで撮り直しを促す`;

    const userText = vegetableName
      ? `この写真は「${vegetableName}」として育てている株です。様子を分析してください。`
      : 'この植物の写真を分析してください。';

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
              { type: 'text', text: userText },
            ],
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('Anthropic API error:', anthropicRes.status, errText.slice(0, 300));
      return res.status(502).json({ ok: false, error: 'ai_error' });
    }

    const data = await anthropicRes.json();
    const text = (data.content ?? [])
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n');

    // JSON抽出（コードブロックで包まれた場合にも対応）
    const cleaned = text.replace(/```json|```/g, '').trim();
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (!m) throw new Error('parse_failed');
      parsed = JSON.parse(m[0]);
    }

    return res.status(200).json({
      ok: true,
      species: String(parsed.species ?? '判別できませんでした'),
      confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'low',
      health: ['good', 'caution', 'concern'].includes(parsed.health) ? parsed.health : 'good',
      healthLabel: String(parsed.healthLabel ?? ''),
      issues: Array.isArray(parsed.issues) ? parsed.issues.slice(0, 3).map(String) : [],
      advice: String(parsed.advice ?? ''),
      disclaimer: 'AIによる推定です。病害の判断や薬剤の使用は、園芸店・JAなど専門家にご相談ください。',
    });
  } catch (err) {
    console.error('analyze-plant error:', err);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
}
