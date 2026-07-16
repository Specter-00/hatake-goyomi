import type { Vegetable } from '../types';
import { getTodayTasks } from './vegetable';

/**
 * 通知の実装について（正直な制約）:
 * - Webの通知はサーバーPushなしでは「決まった時刻に自動送信」ができない
 * - このアプリでは「アプリを開いたとき」に今日のタスクを通知する方式を採用
 * - 1日1回のみ表示（localStorageでガード）
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function notificationSupported(): boolean {
  return 'Notification' in window;
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

const NOTIFIED_KEY = 'last_notified_date';

/**
 * 今日まだ通知していなければ、今日のタスクまとめを通知する
 */
export function notifyTodayTasksOnce(vegetables: Vegetable[]): boolean {
  if (!('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem(NOTIFIED_KEY) === today) return false;

  const active = vegetables.filter(v => v.currentStage !== 'finished');
  const taskCount = active.reduce((sum, v) => sum + getTodayTasks(v).length, 0);
  if (taskCount === 0) return false;

  const names = active
    .filter(v => getTodayTasks(v).length > 0)
    .map(v => v.name)
    .slice(0, 3)
    .join('、');

  try {
    new Notification('畑ごよみ 🌱 今日のお世話', {
      body: `${names}${active.length > 3 ? ' など' : ''}に今日やることが${taskCount}件あります`,
      icon: '/icons/icon-192.png',
      tag: 'daily-tasks',
    });
    localStorage.setItem(NOTIFIED_KEY, today);
    return true;
  } catch {
    return false;
  }
}
