import { useCallback, useState } from 'react';
import type { WeatherData, WeatherDay } from '../types';
import { useAppStore } from '../store';
import { getPrefecture } from '../data/prefectures';

const WEATHER_CODE_LABELS: Record<number, string> = {
  0: '快晴',
  1: '晴れ', 2: '晴れ一時曇', 3: '曇り',
  45: '霧', 48: '濃霧',
  51: '霧雨', 53: '霧雨', 55: '強い霧雨',
  61: '小雨', 63: '雨', 65: '大雨',
  71: '小雪', 73: '雪', 75: '大雪',
  80: 'にわか雨', 81: 'にわか雨', 82: '激しいにわか雨',
  85: 'にわか雪', 86: '大雪',
  95: '雷雨', 96: '雷雨（ひょう）', 99: '激しい雷雨',
};

export function getWeatherLabel(code: number): string {
  return WEATHER_CODE_LABELS[code] ?? '不明';
}

export type WeatherStatus = 'idle' | 'loading' | 'success' | 'error';

export function useWeather() {
  const { settings, setWeather, weather } = useAppStore();
  const [status, setStatus] = useState<WeatherStatus>('idle');

  const fetchWeather = useCallback(async () => {
    if (!settings) return;

    // 座標の決定：現在地優先、なければ都道府県の代表点
    let lat: number, lon: number;
    if (settings.useCurrentLocation && settings.customLat != null && settings.customLon != null) {
      lat = settings.customLat;
      lon = settings.customLon;
    } else {
      const prefecture = getPrefecture(settings.prefectureCode);
      if (!prefecture) return;
      lat = prefecture.lat;
      lon = prefecture.lon;
    }

    // キャッシュチェック（1時間以内 かつ 同じ座標なら再取得しない）
    if (weather?.fetchedAt) {
      const fetchedAt = new Date(weather.fetchedAt).getTime();
      const sameCoords =
        weather.fetchedLat != null &&
        Math.abs(weather.fetchedLat - lat) < 0.01 &&
        Math.abs((weather.fetchedLon ?? 0) - lon) < 0.01;
      if (Date.now() - fetchedAt < 60 * 60 * 1000 && sameCoords) {
        setStatus('success');
        return;
      }
    }

    setStatus('loading');

    try {
      const buildUrl = (useJmaModel: boolean) => {
        const url = new URL('https://api.open-meteo.com/v1/forecast');
        url.searchParams.set('latitude', String(lat));
        url.searchParams.set('longitude', String(lon));
        if (useJmaModel) url.searchParams.set('models', 'jma_seamless'); // 気象庁モデル
        return url;
      };
      const url = buildUrl(true);
      url.searchParams.set('current', [
        'temperature_2m',
        'apparent_temperature',
        'weather_code',
        'wind_speed_10m',
        'precipitation_probability',
      ].join(','));
      url.searchParams.set('daily', [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_probability_max',
      ].join(','));
      url.searchParams.set('timezone', 'Asia/Tokyo');
      url.searchParams.set('forecast_days', '7');

      // 8秒でタイムアウト
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      let res = await fetch(url.toString(), { signal: controller.signal });
      let json = res.ok ? await res.json() : null;

      // 気象庁モデルで必要フィールドが取れない場合は標準モデルにフォールバック
      if (!json?.current || !json?.daily) {
        const fallbackUrl = buildUrl(false);
        // クエリパラメータを引き継ぐ
        fallbackUrl.search = url.search.replace(/&?models=jma_seamless/, '');
        res = await fetch(fallbackUrl.toString(), { signal: controller.signal });
        if (!res.ok) throw new Error('Weather API error');
        json = await res.json();
      }
      clearTimeout(timeout);

      const curr = json.current;
      const daily = json.daily;

      const weekly: WeatherDay[] = daily.time.map((date: string, i: number) => ({
        date,
        weatherCode: daily.weather_code[i],
        maxTemp: Math.round(daily.temperature_2m_max[i]),
        minTemp: Math.round(daily.temperature_2m_min[i]),
        precipProb: daily.precipitation_probability_max[i] ?? 0,
      }));

      const weatherData: WeatherData = {
        temperature: Math.round(curr.temperature_2m),
        feelsLike: Math.round(curr.apparent_temperature),
        weatherCode: curr.weather_code,
        windSpeed: Math.round(curr.wind_speed_10m * 10) / 10,
        precipitationProbability: curr.precipitation_probability ?? 0,
        dailyMax: weekly[0]?.maxTemp ?? Math.round(curr.temperature_2m),
        dailyMin: weekly[0]?.minTemp ?? Math.round(curr.temperature_2m),
        weekly,
        fetchedAt: new Date().toISOString(),
        fetchedLat: lat,
        fetchedLon: lon,
      };

      setWeather(weatherData);
      setStatus('success');
    } catch (err) {
      console.error('Weather fetch failed:', err);
      setStatus('error');
    }
  }, [settings?.prefectureCode, settings?.useCurrentLocation, settings?.customLat, settings?.customLon, weather?.fetchedAt, setWeather]);

  return { weather, fetchWeather, status, getWeatherLabel };
}

export function getWeatherAdvice(
  weather: WeatherData | null,
  precipProbability: number
): string {
  if (!weather) return '';
  if (precipProbability >= 60) return '今日は雨の予報です。水やりは不要です。';
  if (precipProbability >= 30) return '夕方まで様子を見て、降らなければ水やりしましょう。';
  if (weather.temperature >= 30) return '気温が高くなっています。朝か夕方の水やりがおすすめです。';
  if (weather.temperature <= 5) return '気温が低くなっています。霜に注意してください。';
  if (weather.windSpeed >= 10) return '強風注意。支柱が倒れないか確認しましょう。';
  return '良い天気です。朝の水やりに最適です。';
}
