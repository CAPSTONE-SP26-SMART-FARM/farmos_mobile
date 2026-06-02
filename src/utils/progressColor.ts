/**
 * Màu tiến độ chuyển dần theo % — dùng cho mọi UI hiển thị progress bar
 * (list task, task detail, popup update progress, ...). Đảm bảo 3 chỗ
 * này luôn đồng bộ.
 *
 * Mapping (HSL hue interpolation từ đỏ → vàng → xanh):
 *   0%   → đỏ      (hsl  0)
 *   25%  → cam     (hsl 30)
 *   50%  → vàng    (hsl 60)
 *   75%  → lime    (hsl 90)
 *   100% → xanh lá (hsl 120)
 */
export function getProgressColor(progress: number): string {
  const p = Math.max(0, Math.min(100, Math.round(progress)))
  const hue = Math.round((p / 100) * 120)
  return `hsl(${hue}, 72%, 42%)`
}
