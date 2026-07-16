# 畑ごよみ

家庭菜園管理PWAアプリ。初心者でも迷わず収穫まで育てられることを目標にしたサービスです。

## 機能

- ホーム画面（天気・今日のタスク・野菜一覧）
- 野菜登録（100種類以上のマスターデータ）
- 成長ステージ管理
- Open-Meteo APIによる天気連携
- PWA対応（ホーム画面追加・オフライン動作）

## 開発環境

```bash
npm install
npm run dev
```

## デプロイ

GitHub → Vercel 自動デプロイ

## 技術スタック

- Vite + React 18 + TypeScript
- Tailwind CSS v3
- React Router v6
- Zustand（状態管理）
- Dexie（IndexedDB）
- Open-Meteo API（無料・APIキー不要）
- vite-plugin-pwa
