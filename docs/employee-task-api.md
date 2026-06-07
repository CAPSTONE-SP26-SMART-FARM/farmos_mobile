# Employee Task API — Mobile call map (farmer)

> Snapshot: 2026-06-07 — `farmos_mobile`. Tham chiếu BE: `farm_os_be/src/modules/daily-log/daily-log.controller.ts` + hotfix `2026-06-07` (realtime + error code mới).

Phía mobile, "employee task" của farmer không có endpoint list riêng — toàn bộ quan sát + thao tác đều đi qua module **daily-log** (BE coi đây là góc nhìn "task cần / đã ghi nhật ký hôm nay"). Riêng update progress mới gọi vào module `employee-task`.

---

## 1. Overview chain

```
Screen (app/**)
    └─ Hook (src/hooks/useDailyLog.ts | useEmployeeTask.ts)
            └─ API service (src/services/api/dailyLog.ts | employeeTask.ts)
                    └─ apiClient (axios singleton, attach Bearer + refresh-on-401)
                            └─ BE: /daily-log/**  |  /employee-task/farmer/:id/progress

Realtime side-channel (post-hotfix 2026-06-07):
    socketService ─► useGlobalFarmerRealtime (root layout)
                    └─ event "employee-task.updated" trên room user:{userId}
                            └─ invalidateQueries(['daily-log']) + (['farmer-milestone'])
```

Listener `employee-task.updated` mount global → list / progress tự refresh khi
manager assign / unassign / update / complete task. `notification.created` đi
kèm vẫn render qua `NotificationBanner` chung như mọi event khác.

---

## 2. Endpoint inventory

| Mục đích | Method + Path | Service method | Hook |
|---|---|---|---|
| Lấy khung giờ làm việc (window) | `GET /daily-log/window` | `dailyLogApi.getWindow()` | `useDailyLogWindow()` |
| List task cần / đã ghi hôm nay | `GET /daily-log/farmer/today` | `dailyLogApi.todayTasks(page, limit, filter)` | `useTodayTasks(filter, page)` / `useTasksForDailyLog()` |
| Tạo nhật ký cho 1 task | `POST /daily-log/farmer/submit` | `dailyLogApi.submit(body)` | `useSubmitDailyLog()` |
| Sửa nhật ký (hôm nay, trong window) | `PATCH /daily-log/farmer/:dailyLogId` | `dailyLogApi.update(id, body)` | `useUpdateDailyLog()` |
| Xoá nhật ký (hôm nay, trong window) | `DELETE /daily-log/farmer/:dailyLogId` | `dailyLogApi.delete(id)` | `useDeleteDailyLog()` |
| Lịch sử nhật ký của 1 task (paginated, search) | `GET /daily-log/farmer/my-logs` | `dailyLogApi.myLogs(page, limit, filter)` | `useMyDailyLogsByTask(taskId, search)` |
| Cập nhật progress của task (0–100) | `PATCH /employee-task/farmer/:id/progress` | `employeeTaskApi.updateProgress(id, body)` | `useUpdateTaskProgress()` |

Base URL: `CONFIG.API_URL` (`EXPO_PUBLIC_API_URL`). Auth: `Authorization: Bearer <accessToken>` qua interceptor — không attach thủ công.

---

## 3. Endpoint detail

### 3.1 `GET /daily-log/window`

- **Service**: `src/services/api/dailyLog.ts` → `dailyLogApi.getWindow()`
- **Hook**: `useDailyLogWindow()` (`src/hooks/useDailyLog.ts`)
  - Query key: `['daily-log', 'window']`
  - `staleTime: 5 * 60_000`, `gcTime: 30 * 60_000` (align BE cache 5 phút)
  - Self-tick mỗi 30s để re-evaluate `isOpen` từ clock local
  - Fallback `FALLBACK_WINDOW` (07-17 VN) khi BE chưa response
  - Trả `{ window, isOpen, refreshWindow, isLoading }`
- **Response** (`DailyLogWindow`): `{ startHour, endHour, tzOffsetHours, isOpen, nowIso }`
- **Note**: response `/today` cũng đính kèm `window` snapshot → hook `useTodayTasks` tự `setQueryData(window-key, ...)` để đỡ 1 round-trip.

### 3.2 `GET /daily-log/farmer/today`

- **Service**: `dailyLogApi.todayTasks(page = 1, limit = 20, filter)`
- **Hook**: `useTodayTasks(filter: TodayTasksFilter, page = 1)`
  - Query key: `['daily-log', 'today-tasks', page, milestoneId ?? null, hasLoggedToday ?? null]`
- **Query params**: `page`, `limit`, optional `milestoneId`, optional `hasLoggedToday` (`true` = đã ghi, `false` = chưa ghi, omit = tất cả)
- **BE filter (Swagger)**: chỉ trả task `status IN ('pending', 'in_progress')` thuộc milestone đang active. **Loại bỏ** `cancelled` / `verified` / `completed`. → Task bị manager mark completed sẽ biến mất khỏi list này.
- **Response** (`TasksForDailyLogRes`):
  ```ts
  {
    data: TaskForDailyLog[],
    meta: { page, limit, totalItems, totalPages },
    window?: DailyLogWindow   // BE đính kèm để đỡ round-trip
  }
  ```
- **Shorthand**: `useTasksForDailyLog()` = `useTodayTasks({ hasLoggedToday: false })` — dùng cho badge "cần ghi" trên Home.
- **Client-side search**: BE chưa expose `?search`. `MilestoneTasksTab.tsx` filter local theo `title`/`description` qua `useDebouncedValue` 400ms.

### 3.3 `POST /daily-log/farmer/submit`

- **Service**: `dailyLogApi.submit(body)`
- **Hook**: `useSubmitDailyLog()` — `onSuccess` → `qc.invalidateQueries({ queryKey: ['daily-log'] })` (broad invalidate cả today-tasks + my-logs + window).
- **Body** (`SubmitDailyLogBody`):
  ```ts
  {
    employeeTaskId: string
    activities: string         // bắt buộc, non-empty
    notes?: string             // có thể "" hoặc undefined
    attachments?: { url, fileName?, mimeType?, sizeBytes? }[]
  }
  ```
- **Pre-upload**: ảnh được upload qua `uploadImageToCloudinary` (`src/utils/cloudinary.ts`) trước, sau đó nhét `url` vào `attachments`. Mobile **không** gửi binary lên BE.
- **BE constraints**: chỉ trong window làm việc + milestone đang active + tối đa 1 log "active" / task / ngày UTC.

### 3.4 `PATCH /daily-log/farmer/:dailyLogId`

- **Service**: `dailyLogApi.update(dailyLogId, body)`
- **Hook**: `useUpdateDailyLog()` — invalidate broad `['daily-log']`.
- **Body semantics**:
  - omit `attachments` → keep current
  - `attachments: []` → clear all
  - `attachments: [...]` → replace toàn bộ set
- **BE constraints**: chỉ log của hôm nay + trong window.

### 3.5 `DELETE /daily-log/farmer/:dailyLogId`

- **Service**: `dailyLogApi.delete(dailyLogId)` — soft delete (log + attachments).
- **Hook**: `useDeleteDailyLog()` — invalidate broad `['daily-log']`.
- **BE constraints**: chỉ log hôm nay + trong window. Sau khi xoá, farmer được submit log mới cho cùng task trong ngày.

### 3.6 `GET /daily-log/farmer/my-logs`

- **Service**: `dailyLogApi.myLogs(page = 1, limit = 20, filter)`
- **Hook**: `useMyDailyLogsByTask(taskId, search)`
  - **`useInfiniteQuery`** (page size 10)
  - Query key: `['daily-log', 'my-logs', taskId, search]`
  - `getNextPageParam`: dựa `meta.page < meta.totalPages`
  - `enabled: !!taskId`
- **Query params**: `page`, `limit`, optional `employeeTaskId`, optional `search` (BE support — khác với `/today`).
- **Response**: `MyDailyLogsRes` = `{ data: DailyLog[], meta }`. `DailyLog` chứa `zone`, `task`, `farmer`, `attachments[]`, …

### 3.7 `PATCH /employee-task/farmer/:id/progress`

- **Service**: `src/services/api/employeeTask.ts` → `employeeTaskApi.updateProgress(id, body)`
- **Hook**: `useUpdateTaskProgress()` — `onSuccess` invalidate `['daily-log']` + `['farmer-milestone']` (để list task + milestone progress đồng bộ).
- **Body**: `{ progress: number }` (0–100, clamp ở UI tại `ProgressUpdateSheet`).
- **Response tolerance**: BE có thể trả `{ statusCode, message, data: T }` HOẶC raw `T` HOẶC `204 No Content`. Service unwrap: `body?.data ?? body ?? null`.
- **BE constraints**: cũng nằm trong window làm việc — 422 `OutOfWindow` → screen gọi `refreshWindow()` để force re-fetch `/daily-log/window`.

---

## 4. Query keys (factory)

`src/constants/queryKeys.ts`:

```ts
dailyLog: {
  todayTasks: (page?, milestoneId?, hasLoggedToday?) =>
    ['daily-log', 'today-tasks', page ?? 1, milestoneId ?? null, hasLoggedToday ?? null],
  myLogs:     (taskId?, search?) => ['daily-log', 'my-logs', taskId ?? null, search ?? ''],
  window:     () => ['daily-log', 'window'],
},
farmerMilestone: {
  currentUpcoming: ['farmer-milestone', 'current-upcoming'],
  assignments: (milestoneId, query?) => ['farmer-milestone', 'assignments', milestoneId, query ?? {}],
},
```

Mọi mutation đụng employee-task / daily-log đều invalidate broad `['daily-log']` để đảm bảo cả 3 query (today-tasks, my-logs, window) refresh. `updateProgress` cộng thêm `['farmer-milestone']` vì progress hiển thị ngay trong milestone summary.

---

## 5. Screens — ai gọi gì

| Screen | File | Hooks dùng |
|---|---|---|
| Home (tab) — badge "cần ghi" | `app/(app)/(tabs)/index.tsx` | `useTasksForDailyLog()` |
| Milestone detail — tab "Công việc" | `app/(app)/farm/milestone/[milestoneId].tsx` → `MilestoneTasksTab` (`src/components/features/dailyLog/MilestoneTasksTab.tsx`) | `useTodayTasks({ milestoneId, hasLoggedToday })` |
| Task detail (history + progress) | `app/(app)/employee-task/[taskId].tsx` | `useMyDailyLogsByTask`, `useDailyLogWindow`, `useUpdateTaskProgress`, `useDeleteDailyLog` |
| Submit daily log (form-sheet) | `app/(app)/daily-log/[taskId].tsx` | `useSubmitDailyLog`, `useDailyLogWindow` |
| Edit daily log (form-sheet) | `app/(app)/daily-log/edit/[logId].tsx` | `useUpdateDailyLog`, `useDailyLogWindow` |
| History fallback screen | `app/(app)/daily-log/history/[taskId].tsx` | `useMyDailyLogsByTask` |
| Window banner (shared) | `src/components/features/dailyLog/WindowBanner.tsx` | `useDailyLogWindow` |
| Progress sheet (shared) | `src/components/features/dailyLog/ProgressUpdateSheet.tsx` | (nhận props từ parent) |

Role gating: tab "Trang trại" ẩn với doctor qua `href: isDoctor ? null : undefined` ở `app/(app)/(tabs)/_layout.tsx`. BE thêm `@Roles(UserRole.farmer)` ở mọi endpoint `/daily-log/farmer/**` và `/employee-task/farmer/**`.

---

## 6. Types

`src/types/dailyLog.ts`:

- `TaskStatus = 'pending' | 'in_progress' | 'completed' | 'verified' | 'cancelled'` — full enum, nhưng `/today` chỉ trả về 2 giá trị đầu.
- `TaskPriority = 'low' | 'normal' | 'high' | 'urgent'`.
- `TaskForDailyLog` — item trong list today: `{ id, milestoneId, zoneId, title, description, priority, status, progress, hasLoggedToday, todayLog? }`.
- `DailyLog` — log entry chi tiết: gồm `zone`, `task`, `farmer`, `attachments`, `activities`, `notes`, `logDate`, `createdAt`.
- `DailyLogWindow` — `{ startHour, endHour, tzOffsetHours, isOpen, nowIso }`. `nowIso` từ BE để client convert local + tick.
- `SubmitDailyLogBody` / `UpdateDailyLogBody` — semantics attachments quan trọng (xem 3.4).

`src/types/employeeTask.ts`:

- `UpdateTaskProgressBody = { progress: number }`
- `UpdateTaskProgressRes = { id, progress, status }`

---

## 7. Error handling — patterns dùng chung

- `extractApiError(err)` + `getDailyLogErrorMessage(err)` + `isOutOfWindowError(err)` + `isTaskAlreadyCompletedError(err)` ở `src/utils/error.ts`.
- BE 422 `OutOfWindow` ở submit / update / delete / updateProgress → screen gọi `refreshWindow()` → re-fetch window snapshot (clock skew hoặc admin đổi giờ).
- BE 422 `Error.DailyLogTaskAlreadyCompleted` (hotfix 2026-06-07) ở submit / update → screen:
  - `qc.invalidateQueries({ queryKey: ['daily-log'] })` + `['farmer-milestone']` (task biến mất khỏi list)
  - Show toast "Task đã hoàn thành, không thể ghi nhật ký thêm."
  - Set `justSavedRef = true` để bypass `usePreventUnsavedChanges` rồi `router.back()`
- BE 409 ở submit ("đã ghi log hôm nay") → screen show banner thân thiện thay vì message gốc.
- Field error map về input qua `ex.fieldErrors.activities` / `.notes`.

---

## 8. Behaviors đáng lưu ý

1. **Manager mark task `completed` → farmer mất task khỏi list**: BE filter `status IN ('pending','in_progress')`. Sau hotfix 2026-06-07:
   - BE emit `employee-task.updated` trên room `user:{farmerId}` → `useGlobalFarmerRealtime` invalidate cache → task biến mất khỏi list realtime (không cần pull-to-refresh).
   - Nếu farmer đã mở form submit/edit trước khi mark → POST/PATCH trả 422 `Error.DailyLogTaskAlreadyCompleted` → screen dismiss form + invalidate cache.
2. **Window guard ở client**: mọi nút "Tạo nhật ký" / "Cập nhật tiến độ" / "Xoá" đều `disabled` khi `!inWindow`. UI dựa `useDailyLogWindow().isOpen` (tick 30s) — không tự suy đoán giờ.
3. **`/today` chỉ trả task của hôm nay theo lịch BE**. Nếu cần xem mọi task của milestone bất kể trạng thái — chưa có endpoint trên mobile (BE có `GET /daily-log/tasks` cho owner/manager/farmer nhưng mobile chưa wire).
4. **Endpoint dùng search**:
   - `/today` → **không** có `?search` (filter client-side title/description).
   - `/my-logs` → **có** `?search` BE-driven (filter trong activities/notes của log).
5. **Cache invalidation broad**: tất cả mutation đụng vào key `['daily-log']` ⇒ list + history + window cùng refresh. Tránh việc list không refresh sau khi farmer log xong.
6. **Cloudinary upload riêng**: ảnh không đi qua BE — mobile upload trực tiếp Cloudinary rồi gửi URL. Lỗi upload tách bạch với lỗi submit log.
7. **Realtime `employee-task.updated`** (hotfix 2026-06-07):
   - Room: `user:{farmerId}` — BE auto-join theo JWT khi connect, mobile không cần emit subscribe.
   - Payload: `{ action: 'created' | 'assigned' | 'unassigned' | 'updated' | 'completed', taskTitle }` — KHÔNG có `taskId` ⇒ chỉ invalidate broad `['daily-log']` + `['farmer-milestone']`.
   - Listener mount global tại `app/_layout.tsx` qua `useGlobalFarmerRealtime` (gate `role === 'farmer' | 'rancher'`).
   - KHÔNG showToast trong handler — BE gửi kèm `notification.created` ⇒ `NotificationBanner` render banner (xem policy `useToast.ts`).

---

## 9. Quick reference — copy paste

```ts
// List today (theo milestone, chưa ghi)
import { useTodayTasks } from '@/hooks/useDailyLog'
const { data, isLoading, refetch } = useTodayTasks({ milestoneId, hasLoggedToday: false })

// Submit
import { useSubmitDailyLog } from '@/hooks/useDailyLog'
const { mutate, isPending } = useSubmitDailyLog()
mutate({ employeeTaskId, activities, notes, attachments })

// Update progress (0-100)
import { useUpdateTaskProgress } from '@/hooks/useEmployeeTask'
const { mutateAsync } = useUpdateTaskProgress()
await mutateAsync({ id: taskId, body: { progress: 75 } })

// Window
import { useDailyLogWindow } from '@/hooks/useDailyLog'
const { window, isOpen, refreshWindow } = useDailyLogWindow()

// History infinite
import { useMyDailyLogsByTask } from '@/hooks/useDailyLog'
const { data, fetchNextPage, hasNextPage } = useMyDailyLogsByTask(taskId, search)
```
