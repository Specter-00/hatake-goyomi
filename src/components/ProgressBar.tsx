interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  color?: 'green' | 'amber' | 'blue';
}

export function ProgressBar({ value, className = '', color = 'green' }: ProgressBarProps) {
  const colorMap = {
    green: 'bg-wakatake',
    amber: 'bg-yamabuki',
    blue: 'bg-asagi',
  };

  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={`h-2 bg-gray-100 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${colorMap[color]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
