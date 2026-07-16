import type { Vegetable, TaskRecord, WeatherData } from '../types';
import { getVegetableMasterByName } from '../data/vegetables';
import { getDaysFromPlanting, getDaysToHarvest } from './vegetable';

/**
 * 野菜ごとの「今日のアドバイス」を生成するルールエンジン。
 * 優先度: 収穫時期 > 天気の警告 > 追肥リマインド > ステージ別ヒント > マスターのコツ
 */
export function generateAdvice(
  veg: Vegetable,
  weather: WeatherData | null,
  records: TaskRecord[],
): string {
  const dth = getDaysToHarvest(veg);
  const days = getDaysFromPlanting(veg);
  const myRecords = records.filter(r => r.vegetableId === veg.id);

  // 1. 収穫時期
  if (dth !== null && dth <= 0 && veg.currentStage !== 'finished') {
    return `収穫時期です！実の様子を見て、食べごろのものから収穫しましょう。`;
  }
  if (dth !== null && dth <= 7 && dth > 0) {
    return `収穫まであと${dth}日。実の色や大きさを毎日チェックしましょう。`;
  }

  // 2. 天気ベースの警告
  if (weather) {
    if (weather.precipitationProbability >= 60) {
      return '今日は雨の予報。水やりは不要です。株元の水はけも確認しましょう。';
    }
    if (weather.temperature >= 32) {
      return '厳しい暑さです。朝夕の涼しい時間に水やりをして、日中の作業は避けましょう。';
    }
    if (weather.temperature <= 3) {
      return '冷え込みに注意。霜が心配な場合は不織布などで覆ってあげましょう。';
    }
    if (weather.windSpeed >= 10) {
      return '風が強い予報です。支柱のゆるみや倒れがないか確認しましょう。';
    }
  }

  // 3. 追肥リマインド（最後の追肥から14日以上 かつ 植え付け21日以降）
  if (days >= 21) {
    const lastFert = [...myRecords]
      .filter(r => r.taskType === 'fertilize')
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    const daysSinceFert = lastFert
      ? Math.floor((Date.now() - new Date(lastFert.date).getTime()) / 86400000)
      : days - 21;
    if (daysSinceFert >= 14) {
      return 'そろそろ追肥のタイミングです。株元に肥料をまいて軽く土と混ぜましょう。';
    }
  }

  // 4. ステージ別ヒント
  const stageTips: Partial<Record<Vegetable['currentStage'], string>> = {
    seed: '発芽まで土を乾かさないようにしましょう。優しく水やりを続けます。',
    sprout: '発芽おめでとうございます！日当たりの良い場所で育てましょう。',
    seedling: '本葉が増えてきたら混み合った株を間引きましょう。',
    transplant: '植え替え後は根が落ち着くまで、たっぷり水をあげましょう。',
    support: '茎が伸びてきたら支柱にゆるく結びましょう。きつく縛らないのがコツです。',
    flowering: '花が咲いたら水切れに注意。実つきが良くなります。',
    fruiting: '実がつき始めました。水と栄養をしっかり届けましょう。',
  };
  const stageTip = stageTips[veg.currentStage];
  if (stageTip) {
    // 日替わりでマスターのコツと交互に
    const m = getVegetableMasterByName(veg.name);
    if (m && m.tips.length > 0 && days % 2 === 1) {
      return m.tips[days % m.tips.length];
    }
    return stageTip;
  }

  // 5. マスターのコツ（日替わりローテーション）
  const m = getVegetableMasterByName(veg.name);
  if (m && m.tips.length > 0) {
    return m.tips[days % m.tips.length];
  }

  return '今日も観察を続けましょう。小さな変化に気づくことが上達のコツです。';
}
