/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 和カラーパレット
        washi: '#F5F0E8',      // 和紙（生成り）
        seiji: '#C8DDD4',      // 青磁色
        wakatake: '#7CB98A',   // 若竹色
        moegi: '#A3C47A',      // 萌黄色
        asagi: '#5B9BB5',      // 浅葱色
        yamabuki: '#E8A020',   // 山吹色
        shu: '#C0392B',        // 朱色
        fuji: '#8B7AB5',       // 藤色
        // 背景系
        bg: {
          base: '#F7F3EC',     // 生成り背景
          card: '#FFFFFF',     // カード背景
          light: '#EEF5F0',    // 淡い緑背景
        },
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        xl2: '20px',
        xl3: '24px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.06)',
        soft: '0 1px 6px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
