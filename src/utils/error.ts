import type { FieldValues, UseFormSetError, Path } from 'react-hook-form'

export type ApiErrorItem = {
  message: string
  path?: string
  code?: string
}

export interface ApiErrorPayload {
  statusCode?: number
  message?: string
  errors?: ApiErrorItem[]
}

export interface ExtractedApiError {
  /** HTTP status code từ axios response, undefined nếu không tới được server. */
  statusCode?: number
  /** Message top-level BE trả (đã được i18n resolve theo `Accept-Language`). */
  message?: string
  /** Map { path → message } cho field-level validation errors. */
  fieldErrors: Record<string, string>
  /** Raw array `errors` BE trả. */
  errors: ApiErrorItem[]
  /** Có response HTTP từ server (kể cả 4xx/5xx). */
  isHttpError: boolean
  /** Lỗi mạng / timeout — request không tới được server. */
  isNetworkError: boolean
}

/**
 * Bóc lỗi từ axios/fetch error thành shape thống nhất.
 * Dùng global ở mọi nơi cần đọc lỗi BE: hook mutation onError, screen catch,
 * RHF setError, toast, banner. Không phụ thuộc axios cụ thể.
 */
export function extractApiError(err: unknown): ExtractedApiError {
  const e = err as {
    response?: { status?: number; data?: ApiErrorPayload }
    message?: string
    code?: string
  } | undefined

  const status = e?.response?.status
  const payload = e?.response?.data

  const fieldErrors: Record<string, string> = {}
  const items = Array.isArray(payload?.errors) ? payload!.errors! : []
  for (const item of items) {
    if (item?.path && item?.message && !fieldErrors[item.path]) {
      fieldErrors[item.path] = item.message
    }
  }

  const isHttpError = Boolean(status)
  const isNetworkError =
    !isHttpError && (e?.message === 'Network Error' || e?.code === 'ECONNABORTED')

  return {
    statusCode: status ?? payload?.statusCode,
    message: payload?.message,
    fieldErrors,
    errors: items,
    isHttpError,
    isNetworkError,
  }
}

/**
 * Lấy 1 string message tốt nhất để hiển thị toast / banner.
 * Ưu tiên: network error > top-level message > field error đầu tiên > fallback.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  const ex = extractApiError(err)
  if (ex.isNetworkError) return 'Mất kết nối mạng. Vui lòng thử lại.'
  if (ex.message) return ex.message
  const firstFieldErr = Object.values(ex.fieldErrors)[0]
  return firstFieldErr ?? fallback
}

/**
 * Detect 422 `Error.DailyLogTaskAlreadyCompleted` — manager đã mark task xong
 * (completed/verified/cancelled) trong lúc farmer vẫn giữ form mở. Screen
 * dùng để invalidate cache + dismiss form thay vì giữ user trong form chết.
 */
export function isTaskAlreadyCompletedError(err: unknown): boolean {
  const ex = extractApiError(err)
  if (ex.statusCode !== 422) return false
  const haystacks = [
    ex.message ?? '',
    ...ex.errors.map((e) => e?.message ?? ''),
    ...ex.errors.map((e) => e?.code ?? ''),
  ]
  return haystacks.some(
    (h) =>
      h.includes('DailyLogTaskAlreadyCompleted') ||
      h.includes('TaskAlreadyCompleted') ||
      h.toLowerCase().includes('task này đã hoàn thành'),
  )
}

/**
 * Detect 422 OutOfWindow để screen có thể refresh window snapshot.
 * Match cả message `OutOfWindow` (error code) và keyword tiếng Việt.
 */
export function isOutOfWindowError(err: unknown): boolean {
  const ex = extractApiError(err)
  const haystacks = [
    ex.message ?? '',
    ...ex.errors.map((e) => e?.message ?? ''),
    ...ex.errors.map((e) => e?.code ?? ''),
  ]
  return haystacks.some(
    (h) =>
      h.toLowerCase().includes('outofwindow') ||
      h.toLowerCase().includes('khung giờ') ||
      h.toLowerCase().includes('ngoài giờ'),
  )
}

/**
 * Map error code daily-log / employee-task progress thành message tiếng Việt
 * thân thiện cho toast. Trả `null` nếu không match — caller fallback `getErrorMessage`.
 *
 * Match dựa trên cả i18n message (BE đã resolve sang tiếng Việt) và
 * error key dạng `Error.DailyLogXxx` để chắc chắn không bỏ sót.
 */
export function getDailyLogErrorMessage(err: unknown): string | null {
  const ex = extractApiError(err)
  const haystacks = [
    ex.message ?? '',
    ...ex.errors.map((e) => e?.message ?? ''),
    ...ex.errors.map((e) => e?.code ?? ''),
  ]
  const has = (needle: string) =>
    haystacks.some((h) => h.toLowerCase().includes(needle.toLowerCase()))

  if (has('OutOfWindow') || has('khung giờ') || has('ngoài giờ')) {
    return 'Ngoài khung giờ làm việc. Chỉ thao tác trong khung giờ làm việc cho phép.'
  }
  if (has('NotOwner')) {
    return 'Bạn chỉ có thể chỉnh sửa hoặc xóa nhật ký của chính mình.'
  }
  if (has('NotToday')) {
    return 'Chỉ có thể chỉnh sửa hoặc xóa nhật ký của hôm nay.'
  }
  if (has('AlreadySubmittedToday')) {
    return 'Bạn đã ghi nhật ký cho công việc này hôm nay rồi.'
  }
  if (has('DailyLogTaskAlreadyCompleted') || has('TaskAlreadyCompleted') || has('task này đã hoàn thành')) {
    return 'Task đã hoàn thành, không thể ghi nhật ký thêm.'
  }
  if (has('TaskProgressLocked') || has('terminal')) {
    return 'Công việc đã kết thúc, không thể cập nhật tiến độ.'
  }
  if (has('NotTaskAssignee')) {
    return 'Công việc không còn được gán cho bạn. Vui lòng tải lại.'
  }
  if (has('DailyLogNotFound')) {
    return 'Không tìm thấy nhật ký. Có thể đã bị xóa.'
  }
  return null
}

/**
 * Áp dụng field errors từ BE vào React Hook Form `setError`.
 * Chỉ set những path mà form có khai báo — path không match sẽ bị bỏ qua bởi RHF
 * (vẫn cần fallback toast ở caller cho những lỗi không map được).
 *
 * @returns Số field đã được set. 0 = không có field error nào trong response.
 */
export function applyFieldErrors<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  type: string = 'server',
): number {
  const { fieldErrors } = extractApiError(err)
  let count = 0
  for (const [path, message] of Object.entries(fieldErrors)) {
    setError(path as Path<T>, { type, message })
    count++
  }
  return count
}
