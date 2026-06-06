import type { DailyLogWindow } from '@/types/dailyLog'

/**
 * Daily-log working window — BE driven (round 7 handoff). Khung giờ + timezone
 * lấy từ `system_config`, mobile fetch qua `GET /daily-log/window` hoặc lấy
 * embedded từ `GET /daily-log/farmer/today`.
 *
 * Backend là source of truth — client check chỉ để disable nút sớm, vẫn phải
 * handle HTTP 422 (clock skew, hết giờ giữa lúc bấm).
 *
 * End hour EXCLUSIVE: `startHour=7, endHour=17` → cho phép `[07:00:00, 17:00:00)`.
 */

/** Fallback hard-coded khi BE chưa response (cold start). 07-17 VN. */
export const FALLBACK_WINDOW: DailyLogWindow = {
  startHour: 7,
  endHour: 17,
  tzOffsetHours: 7,
  isOpen: false,
  nowIso: new Date().toISOString(),
}

/**
 * Tính `isOpen` từ snapshot + thời điểm hiện tại (client tick mỗi phút).
 * Dùng formula trong BE doc §4.1.
 */
export function isWithinWindow(now: Date, w: Pick<DailyLogWindow, 'startHour' | 'endHour' | 'tzOffsetHours'>): boolean {
  const localMs = now.getTime() + w.tzOffsetHours * 3_600_000
  const hour = new Date(localMs).getUTCHours()
  return hour >= w.startHour && hour < w.endHour
}

/** Hiển thị label `07:00 – 17:00` từ window snapshot. */
export function getWindowLabel(w: Pick<DailyLogWindow, 'startHour' | 'endHour'>): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(w.startHour)}:00 – ${pad(w.endHour)}:00`
}
