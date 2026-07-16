import { Home, CalendarDays, Map, BookOpen, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', icon: Home, label: 'ホーム', exact: true },
  { to: '/calendar', icon: CalendarDays, label: 'カレンダー', exact: false },
  { to: '/map', icon: Map, label: '畑マップ', exact: false },
  { to: '/records', icon: BookOpen, label: '記録', exact: false },
  { to: '/settings', icon: Settings, label: '設定', exact: false },
];

export function BottomTabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-gray-100 safe-bottom">
      <div className="flex items-stretch">
        {tabs.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors min-h-[56px] ${
                isActive
                  ? 'text-wakatake'
                  : 'text-gray-400'
              }`
            }
          >
            <Icon size={22} strokeWidth={isActiveTab(to) ? 2 : 1.5} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

// NavLinkのisActiveを外から参照できないのでダミー（NavLink内で解決済み）
function isActiveTab(_to: string) {
  return false;
}
