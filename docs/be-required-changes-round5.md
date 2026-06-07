# Backend Required Changes — Round 5

> ✅ **STATUS (2026-06-05): Endpoint đã có sẵn từ trước Round 5** trên branch
> `BE--Support-Ticket`. BE chỉ thêm partial index migration cho performance.
> Mobile đã apply field-name fix (`count` → `unreadCount`) + bỏ workaround.
>
> Người nhận: Backend team (`farm_os_be`)
> Mobile branch: `MOBILE--Fix-ui-keyboard`
> Round trước: R1-R10 đã done qua round 1-4.

---

## TL;DR — checklist BE round 5

| # | Mobile request | Severity | Mobile blocked? |
|---|----------------|----------|------------------|
| **R11** | `GET /notifications/unread-count` — endpoint trả số notification chưa đọc của user hiện tại | High | Partial — mobile fallback dùng count theo page 1 (kém chính xác); badge sẽ thiếu count nếu user có > 30 unread |

---

## Bối cảnh
Client báo:
1. Cần đếm chính xác số notification chưa đọc.
2. Hiển thị badge đỏ với count trên bell icon.
3. Trước đó mobile dùng chấm xanh — đã đổi sang badge đỏ (mobile-only fix).

### Mobile đã làm gì
- New API method `notificationApi.unreadCount()` gọi `GET /notifications/unread-count`.
- New hook `useUnreadNotificationCount()`:
  - Cache 30s staleTime.
  - Auto-invalidate khi nhận socket event `notification.created` (BE đã emit ở round 3).
  - Broad invalidate qua `['notifications']` namespace khi user mark read.
  - `retry: false` — nếu BE chưa deploy → 404 → silent count=0.
- UI:
  - Bell icon ở home header: badge đỏ overlap top-right, render `count` hoặc `99+`.
  - Notifications screen title: ưu tiên count từ endpoint, fallback `notifications.filter(!isRead).length` (chỉ page 1).
  - Item chưa đọc: dot chuyển từ green `#15803D` → red `#DC2626`, kích thước 10×10.
- New component `<NotificationBadge count style />` ở `src/components/ui/NotificationBadge.tsx` (reusable nếu cần dùng chỗ khác).

---

## R11 — `GET /notifications/unread-count`

### Endpoint spec

```
GET /notifications/unread-count
```

**Auth**: Bearer token (mọi role authenticated).

### Response

```ts
{
  statusCode: 200,
  message: 'OK',
  data: {
    count: number  // số notification của user hiện tại có isRead = false
  }
}
```

### Implementation đề xuất

```ts
// notification.repo.ts
countUnread(userId: string): Promise<number> {
  return this.prisma.notification.count({
    where: { userId, isRead: false }
  });
}

// notification.service.ts
async getUnreadCount(userId: string) {
  const count = await this.repo.countUnread(userId);
  return { count };
}

// notification.controller.ts
@Get('unread-count')
async unreadCount(@AuthUser() user) {
  return this.service.getUnreadCount(user.id);
}
```

### Edge cases / notes

1. **User chưa từng nhận notification nào** → return `{ count: 0 }`. Không 404.
2. **Soft-deleted notifications** (nếu có) → exclude khỏi count.
3. **Performance**: count có thể chạy nhiều lần (mobile staleTime 30s + invalidate trên mỗi `notification.created`). Recommend index DB:
   ```sql
   CREATE INDEX notifications_user_unread_idx
     ON notifications (user_id) WHERE is_read = false;
   ```
   Partial index — nhỏ + nhanh cho query phổ biến.

### Acceptance criteria

```sh
# Setup: user X có 5 unread, 10 read notifications
GET /notifications/unread-count
# Expect:
{
  "statusCode": 200,
  "message": "OK",
  "data": { "count": 5 }
}

# Mark 1 read
PATCH /notifications/<id>/read body { "isRead": true }
GET /notifications/unread-count
# Expect: data.count === 4

# Trigger 1 notification mới (vd doctor kê đơn)
# Mobile nhận socket notification.created → invalidate
GET /notifications/unread-count
# Expect: data.count === 5
```

---

## Edge case nếu BE chưa deploy R11

Mobile hiện đang gọi endpoint với `retry: false`. Khi BE chưa có:
- Query fail silently (404 / không có response).
- `unread?.count` undefined → fallback dùng `notifications.filter(!isRead).length` (chỉ chính xác trong page 1, max 30).
- Badge có thể thiếu count nếu user có > 30 unread.
- Không có toast/error banner để tránh làm phiền user.

Khi BE deploy R11 → query tự success → badge accurate.

---

## Files mobile đã đổi

```
# New
src/components/ui/NotificationBadge.tsx                    # Reusable badge component

# Modified
src/services/api/notification.ts                            # unreadCount() method
src/hooks/useNotification.ts                                 # useUnreadNotificationCount + socket listener
src/constants/queryKeys.ts                                   # notifications.unreadCount key
src/components/ui/index.ts                                   # export NotificationBadge
app/(app)/(tabs)/index.tsx                                   # bell icon + red badge
app/(app)/(tabs)/notifications.tsx                           # accurate count + red dot
```

---

## Liên hệ
- Mobile maintainer: Tâm
- Mobile branch: `MOBILE--Fix-ui-keyboard`
- BE branch hiện tại: `BE--Support-Ticket`
- Q&A: round 5 nhẹ — chỉ 1 endpoint, không có migration.

---

## ✅ Mobile cleanup applied (2026-06-05) sau BE clarification

### Field name fix
BE clarify endpoint trả `data.unreadCount` (không phải `data.count` như mobile đoán ban đầu).

- `src/services/api/notification.ts`:
  - `UnreadCountRes` type đổi từ `{ count: number }` → `{ unreadCount: number }`.
- `src/hooks/useNotification.ts`:
  - Bỏ `retry: false` workaround (endpoint luôn có sẵn, response stable).
- `app/(app)/(tabs)/index.tsx`:
  - `unread?.count` → `unread?.unreadCount` (badge count cho bell icon).
- `app/(app)/(tabs)/notifications.tsx`:
  - `unread?.count` → `unread?.unreadCount` (TopBar count).

### Files changed — Round 5 cleanup
```
src/services/api/notification.ts            # type field unreadCount
src/hooks/useNotification.ts                # bỏ retry: false
app/(app)/(tabs)/index.tsx                  # consumer field name
app/(app)/(tabs)/notifications.tsx          # consumer field name
```

### Verification mobile
- `npm run type-check`: pass (chỉ pre-existing errors).
- Mobile sẵn sàng test sau khi BE apply partial-index migration.
