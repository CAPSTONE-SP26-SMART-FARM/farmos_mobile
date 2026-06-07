# Backend Required Changes — Round 8

> Yêu cầu BE sau khi fix issue 1-3 client report 2026-06-06 (round 8).
>
> Người nhận: Backend team (`farm_os_be`)
> Mobile branch: `MOBILE--Fix-ui-keyboard`

---

## TL;DR — checklist BE round 8

| # | Mobile request | Severity | Mobile blocked? |
|---|----------------|----------|------------------|
| **R12** | Confirm `GET /sensor-reading/farmer/assignment/:id/latest` trả `data[]` **theo thứ tự stable** (không sort theo `timestamp`) | Low | No — mobile đã sort client-side defensive. BE confirm giúp xoá workaround nếu order đã stable từ trước. |

Issue 1 và 2 hoàn toàn mobile-side fix — không cần BE support.

---

## R12 — Sensor readings ordering

### Bối cảnh
Client báo card sensor nhảy thứ tự liên tục khi reading mới về. Nguyên nhân khả nghi: BE response `data: SensorReading[]` order theo `lastReadingAt DESC` hoặc tương tự → sensor vừa có reading mới float lên đầu list → mobile re-render với thứ tự khác.

### Mobile đã làm gì
Trong `app/(app)/farm/[assignmentId].tsx`, sort client-side với comparator:
```ts
const SENSOR_TYPE_ORDER: Record<string, number> = {
  air_temperature: 1,
  air_humidity: 2,
  soil_moisture: 3,
  soil_temperature: 4,
  soil_ph: 5,
  light_intensity: 6,
}
// fallback: sensor không nằm trong map → order=999 (đẩy về cuối)
// tiebreaker: sensorId.localeCompare
```

Kết quả: card luôn cùng vị trí, dùng `key={sensorId}` để React reuse component → animate value đổi mà không remount.

### BE cần làm
Một trong hai option:

**Option A (preferred — order ổn định ngay từ BE)**
- Endpoint `/sensor-reading/farmer/assignment/:id/latest` order theo:
  - `sensor.position` nếu có column (vd `display_order`).
  - Fallback `sensor.type` rồi `sensor.id`.
- Mobile có thể xoá sort client-side → reduce client work, đồng bộ với web.

**Option B (mobile keep workaround)**
- BE confirm KHÔNG sort theo `timestamp` mà theo `sensor.id` (default Prisma) → mobile workaround vẫn cần defensive vì `sensorType` ordering semantic vẫn quan trọng cho UX VN.
- Confirm để mobile note vào comment.

### Acceptance criteria
```
1. Trigger 5 reading liên tiếp cho cùng assignment, mỗi reading ở sensor khác nhau.
2. GET /sensor-reading/farmer/assignment/<id>/latest sau mỗi reading.
3. response.data[].sensorId TUYỆT ĐỐI giữ nguyên thứ tự giữa 5 lần gọi.
4. Mobile re-render → card cùng vị trí.
```

### Nếu BE chọn Option A
Đề xuất add SENSOR_TYPE_ORDER chung cho web + mobile vào file constants `farm_os_be/src/shared/constants/sensor.ts`:
```ts
export const SENSOR_TYPE_DISPLAY_ORDER = [
  'air_temperature',
  'air_humidity',
  'soil_moisture',
  'soil_temperature',
  'soil_ph',
  'light_intensity',
] as const
```

---

## Mobile fix Issue 1 — Farmer chat access post-resolve

### Hiện trạng
`IncidentFooterActions` render chỉ 1 nhánh action theo priority:
- `isClosed` → label disabled (+ Delete nếu cancelled)
- `canAccept` → Tiếp nhận
- `canResolve` → **Chat + Giải quyết** (doctor)
- `canClose` → Đóng & Đánh giá (farmer — KHÔNG có chat)
- `canCancel` → Hủy
- `canChat` → Chat

→ Khi farmer ở status='resolved'/'closed' KHÔNG thấy chat button mà doctor vẫn chat được.

### Mobile đã làm gì
- Thêm chat icon button (`MaterialIcons chat-bubble-outline` size 22, viền xanh) bên trái:
  - Trong nhánh `canClose` (farmer status=resolved).
  - Trong nhánh `isClosed` cho cả 2 trường hợp closed (Hoàn tất) + cancelled (Đã huỷ).
- Vẫn giữ Delete button cho cancelled.

UI 3 layout:
- canClose: `[💬 chat] [Đóng & Đánh giá fill]`
- isClosed + canDelete: `[💬 chat] [Sự cố đã huỷ fill] [Xoá]`
- isClosed only: `[💬 chat] [Sự cố đã hoàn tất fill]`

Không cần BE support — đoạn chat đã có (`/ticket/:id/messages` cho phép gửi mọi status); chỉ thiếu entry point ở mobile UI.

---

## Mobile fix Issue 2 — Doctor online nudge on login

### Hiện trạng
Doctor sau khi login mặc định offline nhiều case → bỏ lỡ ticket broadcast. Không có UX nhắc.

### Mobile đã làm gì
New hook `useDoctorOnlineNudge` mount ở `GlobalRealtimeBridge` (root layout):
- Check `useDoctorProfile().data.isOnline === false`.
- Skip nếu doctor chưa approved (`!profile.approvedAt`).
- Show `ConfirmDialog` (icon='info') với 2 action:
  - "Bật online ngay" → fire `useUpdateDoctorOnlineStatus({ isOnline: true })` ngay từ dialog.
  - "Để sau" → dismiss.
- Guard 1 lần per session theo `userId` (logout/login khác account → fire lại).

Không cần BE support — dùng endpoint `PATCH /doctor/online-status` đã có.

---

## Files mobile đã đổi

```
# Issue 1
src/components/features/incident/IncidentFooterActions.tsx   # chat icon trong canClose + isClosed

# Issue 2
src/hooks/useDoctorOnlineNudge.ts                            # NEW
app/_layout.tsx                                              # mount nudge trong GlobalRealtimeBridge

# Issue 3
app/(app)/farm/[assignmentId].tsx                            # SENSOR_TYPE_ORDER + sort stable
```

---

## Liên hệ
- Mobile maintainer: Tâm
- Mobile branch: `MOBILE--Fix-ui-keyboard`
- BE branch hiện tại: `BE--Support-Ticket`
- Q&A: chỉ R12 cần align — nếu BE đã trả stable order rồi, ping mobile xoá workaround sort client-side.
