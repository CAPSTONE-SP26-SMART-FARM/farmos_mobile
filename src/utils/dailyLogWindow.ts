/**
 * Daily-log working window: 07:00 → 17:00 giờ Việt Nam (UTC+7).
 * End hour exclusive (16:59 OK, 17:00 không OK).
 *
 * Backend là source of truth — client check chỉ để disable nút,
 * vẫn phải handle HTTP 422 trả về (đồng hồ máy có thể lệch).
 */
export const DAILY_LOG_WINDOW = {
  startHour: 7,
  endHour: 17,
  tzOffsetHours: 7,
} as const

export function isWithinDailyLogWindow(now: Date = new Date()): boolean {
  const localMs = now.getTime() + DAILY_LOG_WINDOW.tzOffsetHours * 3_600_000
  const hour = new Date(localMs).getUTCHours()
  return hour >= DAILY_LOG_WINDOW.startHour && hour < DAILY_LOG_WINDOW.endHour
}

export function getWindowLabel(): string {
  const { startHour, endHour } = DAILY_LOG_WINDOW
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(startHour)}:00 – ${pad(endHour)}:00`
}
