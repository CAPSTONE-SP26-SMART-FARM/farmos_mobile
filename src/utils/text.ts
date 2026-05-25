/** Viết hoa chữ đầu, giữ nguyên phần còn lại. */
export function capitalize(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Rút gọn title cảm biến / cảnh báo do BE tự sinh:
 * "Cảm biến độ ẩm đất cao hơn ngưỡng tại Khu Ớt Chuông" → "Độ ẩm đất vượt ngưỡng"
 */
export function shortAlertTitle(title: string): string {
  return title
    .replace(/^Cảm biến\s+/i, '')
    .replace(/\s+(tại|ở)\s+.+$/i, '')
    .replace(/\s+an toàn$/i, '')
    .replace(/\s+(cao hơn|thấp hơn)\s+ngưỡng/i, ' vượt ngưỡng')
    .trim()
}

/**
 * Cắt header "Bộ kit K... lúc HH:MM dd/MM/yyyy:" — giữ phần nội dung chính
 * sau dấu ":" cuối cùng (tránh trúng dấu ":" của giờ HH:MM).
 */
export function shortAlertContent(content: string): string {
  if (!content) return ''
  const colonIdx = content.lastIndexOf(':')
  if (colonIdx > 0 && colonIdx < content.length - 1) {
    return content.slice(colonIdx + 1).trim()
  }
  return content
}
