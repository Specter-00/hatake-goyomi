import type { Prefecture } from '../types';

export const PREFECTURES: Prefecture[] = [
  { code: '01', name: '北海道', lat: 43.0642, lon: 141.3469, region: 'hokkaido' },
  { code: '02', name: '青森県', lat: 40.8244, lon: 140.7400, region: 'tohoku' },
  { code: '03', name: '岩手県', lat: 39.7036, lon: 141.1527, region: 'tohoku' },
  { code: '04', name: '宮城県', lat: 38.2688, lon: 140.8721, region: 'tohoku' },
  { code: '05', name: '秋田県', lat: 39.7186, lon: 140.1024, region: 'tohoku' },
  { code: '06', name: '山形県', lat: 38.2404, lon: 140.3633, region: 'tohoku' },
  { code: '07', name: '福島県', lat: 37.7503, lon: 140.4676, region: 'tohoku' },
  { code: '08', name: '茨城県', lat: 36.3418, lon: 140.4468, region: 'kanto' },
  { code: '09', name: '栃木県', lat: 36.5658, lon: 139.8836, region: 'kanto' },
  { code: '10', name: '群馬県', lat: 36.3911, lon: 139.0608, region: 'kanto' },
  { code: '11', name: '埼玉県', lat: 35.8575, lon: 139.6489, region: 'kanto' },
  { code: '12', name: '千葉県', lat: 35.6047, lon: 140.1233, region: 'kanto' },
  { code: '13', name: '東京都', lat: 35.6895, lon: 139.6917, region: 'kanto' },
  { code: '14', name: '神奈川県', lat: 35.4478, lon: 139.6425, region: 'kanto' },
  { code: '15', name: '新潟県', lat: 37.9026, lon: 139.0232, region: 'chubu' },
  { code: '16', name: '富山県', lat: 36.6953, lon: 137.2113, region: 'chubu' },
  { code: '17', name: '石川県', lat: 36.5947, lon: 136.6256, region: 'chubu' },
  { code: '18', name: '福井県', lat: 36.0652, lon: 136.2216, region: 'chubu' },
  { code: '19', name: '山梨県', lat: 35.6642, lon: 138.5686, region: 'chubu' },
  { code: '20', name: '長野県', lat: 36.6513, lon: 138.1810, region: 'chubu' },
  { code: '21', name: '岐阜県', lat: 35.3912, lon: 136.7223, region: 'chubu' },
  { code: '22', name: '静岡県', lat: 34.9769, lon: 138.3831, region: 'chubu' },
  { code: '23', name: '愛知県', lat: 35.1802, lon: 136.9066, region: 'chubu' },
  { code: '24', name: '三重県', lat: 34.7303, lon: 136.5086, region: 'kinki' },
  { code: '25', name: '滋賀県', lat: 35.0045, lon: 135.8686, region: 'kinki' },
  { code: '26', name: '京都府', lat: 35.0211, lon: 135.7556, region: 'kinki' },
  { code: '27', name: '大阪府', lat: 34.6937, lon: 135.5023, region: 'kinki' },
  { code: '28', name: '兵庫県', lat: 34.6913, lon: 135.1830, region: 'kinki' },
  { code: '29', name: '奈良県', lat: 34.6851, lon: 135.8329, region: 'kinki' },
  { code: '30', name: '和歌山県', lat: 34.2260, lon: 135.1675, region: 'kinki' },
  { code: '31', name: '鳥取県', lat: 35.5036, lon: 134.2383, region: 'chugoku' },
  { code: '32', name: '島根県', lat: 35.4723, lon: 133.0505, region: 'chugoku' },
  { code: '33', name: '岡山県', lat: 34.6618, lon: 133.9344, region: 'chugoku' },
  { code: '34', name: '広島県', lat: 34.3853, lon: 132.4553, region: 'chugoku' },
  { code: '35', name: '山口県', lat: 34.1860, lon: 131.4706, region: 'chugoku' },
  { code: '36', name: '徳島県', lat: 34.0657, lon: 134.5593, region: 'shikoku' },
  { code: '37', name: '香川県', lat: 34.3401, lon: 134.0434, region: 'shikoku' },
  { code: '38', name: '愛媛県', lat: 33.8416, lon: 132.7657, region: 'shikoku' },
  { code: '39', name: '高知県', lat: 33.5597, lon: 133.5311, region: 'shikoku' },
  { code: '40', name: '福岡県', lat: 33.6064, lon: 130.4183, region: 'kyushu' },
  { code: '41', name: '佐賀県', lat: 33.2494, lon: 130.2988, region: 'kyushu' },
  { code: '42', name: '長崎県', lat: 32.7503, lon: 129.8779, region: 'kyushu' },
  { code: '43', name: '熊本県', lat: 32.7898, lon: 130.7417, region: 'kyushu' },
  { code: '44', name: '大分県', lat: 33.2382, lon: 131.6126, region: 'kyushu' },
  { code: '45', name: '宮崎県', lat: 31.9110, lon: 131.4239, region: 'kyushu' },
  { code: '46', name: '鹿児島県', lat: 31.5602, lon: 130.5580, region: 'kyushu' },
  { code: '47', name: '沖縄県', lat: 26.2124, lon: 127.6809, region: 'kyushu' },
];

export const getPrefecture = (code: string): Prefecture | undefined =>
  PREFECTURES.find(p => p.code === code);


export const REGIONS = [
  { key: 'hokkaido', label: '北海道' },
  { key: 'tohoku',   label: '東北' },
  { key: 'kanto',    label: '関東' },
  { key: 'chubu',    label: '中部' },
  { key: 'kinki',    label: '近畿' },
  { key: 'chugoku',  label: '中国' },
  { key: 'shikoku',  label: '四国' },
  { key: 'kyushu',   label: '九州・沖縄' },
] as const;


/**
 * 座標から最寄りの都道府県を返す（植え付け時期の判定などに使用）
 */
export function nearestPrefecture(lat: number, lon: number): Prefecture {
  let best = PREFECTURES[0];
  let bestDist = Infinity;
  for (const pref of PREFECTURES) {
    const d = (pref.lat - lat) ** 2 + (pref.lon - lon) ** 2;
    if (d < bestDist) { bestDist = d; best = pref; }
  }
  return best;
}
