import { useEffect, useState } from 'react'

/**
 * Debounce 1 giá trị primitive (string / number / boolean) theo `delay` ms.
 * Dùng cho search input trước khi pass xuống query để tránh fire mỗi keystroke.
 */
export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])

  return debounced
}
