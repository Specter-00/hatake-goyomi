import {
  Sun, Cloud, CloudSun, CloudRain, CloudSnow,
  CloudDrizzle, CloudFog, CloudLightning, Wind,
} from 'lucide-react';

interface WeatherIconProps {
  code: number;
  size?: number;
  className?: string;
}

export function WeatherIcon({ code, size = 24, className = '' }: WeatherIconProps) {
  const props = { size, className };

  if (code === 0) return <Sun {...props} />;
  if (code <= 2) return <CloudSun {...props} />;
  if (code === 3) return <Cloud {...props} />;
  if (code <= 48) return <CloudFog {...props} />;
  if (code <= 55) return <CloudDrizzle {...props} />;
  if (code <= 67) return <CloudRain {...props} />;
  if (code <= 77) return <CloudSnow {...props} />;
  if (code <= 82) return <CloudRain {...props} />;
  if (code <= 86) return <CloudSnow {...props} />;
  if (code <= 99) return <CloudLightning {...props} />;
  return <Wind {...props} />;
}
