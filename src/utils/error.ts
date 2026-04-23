/** Lấy message lỗi từ axios error, fallback về `fallback` nếu không có. */
export function getErrorMessage(err: unknown, fallback: string): string {
  const anyErr = err as { response?: { data?: { message?: string } } } | undefined
  return anyErr?.response?.data?.message ?? fallback
}
