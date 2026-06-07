# Backend Required Changes — Round 3

> ✅ **STATUS (2026-06-05): BE đã triển khai R5–R7** trên branch
> `BE--Support-Ticket`. Mobile đã apply cleanup tương ứng — xem section
> "Mobile cleanup applied" cuối doc.
>
> ⚠️ R5 cần user apply SQL migration manual trước khi mobile ship build mới.
>
> Người nhận: Backend team (`farm_os_be`)
> Mobile branch: `MOBILE--Fix-ui-keyboard`
> Round trước: docs/be-required-changes.md (R1), be-required-changes-round2.md (R1-R4) — đã done.

---

## TL;DR — checklist BE round 3

| # | Mobile request | Severity | Mobile blocked? |
|---|----------------|----------|------------------|
| **R5** | `DELETE /tickets/:id` — xoá ticket đã huỷ khỏi danh sách (only creator + only status=cancelled) | High | YES — endpoint chưa có, mobile call sẽ 404. UI long-press + footer "Xoá sự cố" đã sẵn sàng. |
| **R6** | Audit cross-user events: ĐẢM BẢO mỗi event quan trọng có `notification.created` đi kèm (audience đúng) | High | Partial — mobile đã bỏ toast cross-user, nếu BE thiếu notification thì user mất feedback |
| **R7** | Audit event audience: emit thêm event status transition vào `user:{actorId}` (multi-device sync chính chủ) | Medium | Partial — mobile đã subscribe ticket room sớm. Bug vẫn xảy ra khi user trên LIST screen + đổi status từ device khác |

---

## R5 — `DELETE /tickets/:id` (xoá sự cố đã huỷ)

### Use case
Farmer cancel ticket → status `cancelled` → ticket vẫn nằm trong list (lịch sử). User muốn dọn dẹp UI → long-press card → confirm → mobile gọi DELETE endpoint.

### Mobile đã làm gì
- `src/services/api/incident.ts` — method `incidentApi.remove(ticketId)` → `DELETE /tickets/:id`.
- `src/hooks/useIncident.ts` — hook `useDeleteIncident()` invalidate list + detail.
- UI:
  - Long-press card trong tab "Sự cố" (chỉ ticket `status === 'cancelled'`) → ConfirmDialog → DELETE.
  - Detail screen của ticket đã huỷ: footer giờ có nút "Xoá sự cố" thay vì chỉ disabled label.

### BE cần làm

#### Endpoint
```
DELETE /tickets/:id
```

#### Authorization
- Caller PHẢI là `creator` của ticket (`support_ticket.createdBy === auth.userId`).
- Caller KHÔNG đảm bảo phải còn role farmer/rancher (doctor không thể xoá ticket của ai khác — UI gate đã ẩn nhưng BE vẫn enforce).

#### Validation
- Status PHẢI là `cancelled`. Bất kỳ status khác → 422 với i18n message `"Chỉ có thể xoá sự cố đã huỷ"`.
- Ticket KHÔNG được có:
  - Pending withdrawal, prescription, addendum đang reference → quyết định: xoá CASCADE (Postgres `ON DELETE CASCADE`) hay 422 reject?
  - Đề xuất: cancelled ticket khả năng cao không có pending side-effects, nên CASCADE OK.

#### Response
- 204 No Content khi success.
- 404 nếu ticket không tồn tại / không thuộc caller.
- 422 nếu status khác cancelled.

#### Side effects
- `support_ticket` row deleted (hoặc soft-deleted với `deletedAt` nếu BE prefer audit trail — recommended).
- Nếu hard-delete: CASCADE đến `ticket_message`, `ticket_attachment`, `prescription` (cancelled ticket không nên có prescription nhưng defensive).
- Emit event `ticket.deleted` để các device khác của caller invalidate cache:
  ```ts
  // Event: ticket.deleted
  // Audience: user:{creatorId}
  // Payload: { ticketId }
  ```

### Acceptance criteria
```
1. Farmer cancel ticket X → status=cancelled.
2. DELETE /tickets/X (cùng farmer) → 204.
3. GET /tickets → ticket X không còn trong list.
4. DELETE /tickets/X lần 2 → 404.
5. Farmer khác DELETE /tickets/X (status=cancelled của farmer A) → 404 (không leak existence).
6. Farmer DELETE /tickets/Y (status='open') → 422 "Chỉ có thể xoá sự cố đã huỷ".
7. Multi-device: Device A delete → Device B list refresh tự động qua `ticket.deleted` event.
```

---

## R6 — Audit `notification.created` cho cross-user events

### Bối cảnh
Mobile vừa apply policy mới (commit "toast vs notification — issue 2"):
- **Toast**: chỉ cho user's own action trên chính screen của họ (mutation onSuccess/onError, form validation, network).
- **Notification banner** (top of screen, redirect_url): cho cross-user / system events.

### Mobile đã bỏ những toast nào (rely vào notification.created)
| Event | File | Audience cũ (toast) | BE phải gửi notification.created? |
|-------|------|---------------------|------------------------------------|
| `prescription.incident.created` | `usePrescription.ts` | Farmer (cross-user, doctor/AI tạo) | ✅ Bắt buộc |
| `ticket.broadcast` | `useGlobalDoctorRealtime.ts` | Doctor (cross-user, farmer tạo ticket) | ✅ Bắt buộc |
| `doctor.wallet.credited` | `useDoctorWallet.ts` | Doctor (system event, BE credit commission) | ✅ Bắt buộc |
| `withdrawal.approved` | `useWithdrawals.ts` | Doctor (cross-user, admin duyệt) | ✅ Bắt buộc |
| `withdrawal.paid` | `useWithdrawals.ts` | Doctor (cross-user, admin transfer) | ✅ Bắt buộc |
| `withdrawal.rejected` | `useWithdrawals.ts` | Doctor (cross-user, admin reject) | ✅ Bắt buộc |
| `ticket.resolved` (farmer side) | `(tabs)/incidents.tsx`, `incident/[id]/index.tsx` | Farmer | ✅ Bắt buộc |
| `ticket.ai.resolved` | `(tabs)/incidents.tsx`, `incident/[id]/index.tsx` | Farmer (system event) | ✅ Bắt buộc |
| `ticket.abandon.refunded` | `incident/[id]/index.tsx` | Farmer (system event) | ✅ Bắt buộc |
| `ticket.abandon.auto_refunded` | `useGlobalIncidentRealtime.ts` | Farmer (system event, worker) | ✅ Bắt buộc |

### BE cần làm

Audit từng event trên trong `farm_os_be`:
1. Verify trong handler emit event → cũng đã `notificationService.create(...)` cho user audience đúng.
2. Confirm payload chuẩn `notification.created`:
   ```ts
   {
     type: NotificationType,
     title: string,                // Tiếng Việt natural
     content: string,              // Tiếng Việt natural, có context cụ thể
     redirectUrl: string | null,   // Path mobile route, vd `/tickets/<id>` hoặc `/wallet`
     ticketId?: string,            // Để mobile dedup khi đang xem chính ticket đó
   }
   ```
3. Audience NotificationService phải khớp với event:
   - `prescription.incident.created` source DOCTOR → notification cho `user:{creatorId}` (farmer).
   - `prescription.incident.created` source AI → notification cho `user:{creatorId}`.
   - `ticket.broadcast` → notification cho mỗi doctor trong pool (room `doctors:pool`).
   - `doctor.wallet.credited` → notification cho `user:{doctorId}`.
   - `withdrawal.*` → notification cho `user:{doctorId}`.
   - `ticket.resolved` / `ticket.ai.resolved` / `ticket.abandon.refunded` → notification cho `user:{creatorId}`.
   - `ticket.abandon.auto_refunded` → notification cho `user:{creatorId}`.

### Redirect URL chuẩn
Mobile parser hiện handle:
- `/tickets/<id>` → push detail incident.
- Type `alert_triggered` / `sensor_alert` → push tab Alerts.
- Else → push tab Notifications.

Đề xuất BE: dùng path tuyệt đối kiểu `/tickets/<id>`, `/wallet/withdrawal/<id>`, `/alerts/<id>`. Mobile sẽ extend parser để handle thêm path mới.

### Acceptance criteria
- Trigger mỗi event trong table trên → user đích nhận `notification.created` qua socket trong < 2s.
- Notification banner mobile render đúng (title/content).
- Tap banner → redirect tới đúng screen.

---

## R7 — Multi-device sync: emit status transition tới actor's user room

### Bối cảnh
Round 2 BE đã emit:
- `ticket.accepted` → `user:{creatorId}` + `ticket:{ticketId}`
- `ticket.in_progress` → `user:{creatorId}` + `ticket:{ticketId}`
- `ticket.cancelled` → `ticket:{ticketId}` + `user:{assignedTo}` (nếu có doctor)

### Vấn đề
**Actor không nhận event chính họ trigger.** Vd:
- Doctor A accept ticket → mobile device A của doctor A invalidate cache local qua `useMutation.onSuccess`. Device B của doctor A (cùng tài khoản, login song song) **không nhận** `ticket.accepted` (audience không có `user:{doctorId}`). Hệ quả: device B list/detail của doctor A không refresh.
- Farmer cancel ticket → cùng vấn đề. `ticket.cancelled` audience hiện `ticket:{ticketId}` + `user:{assignedTo}` — KHÔNG bao gồm farmer's user room. Farmer device B không refresh.

Mobile workaround (đã apply):
- Detail screen subscribe ticket room ngay khi mount (qua URL param thay vì chờ data load) → khi user đang xem detail trên device B, vẫn nhận event.

**Workaround NOT sufficient cho LIST screen** — list không thể subscribe mọi ticket room. List chỉ nhận events qua `user:{userId}` room.

### BE cần làm
Mở rộng audience cho mọi status transition event để bao gồm CẢ actor + counterparts:

| Event | Audience hiện tại | Audience cần bổ sung |
|-------|-------------------|----------------------|
| `ticket.accepted` | `user:{creatorId}` + `ticket:{ticketId}` | Thêm `user:{acceptedBy}` (doctor actor's user room) |
| `ticket.in_progress` | `user:{creatorId}` + `ticket:{ticketId}` | Thêm `user:{senderId}` (doctor trigger first message) |
| `ticket.cancelled` | `ticket:{ticketId}` + `user:{assignedTo}` | Thêm `user:{creatorId}` (farmer actor's user room) |
| `ticket.closed` | (chưa rõ — confirm) | `user:{creatorId}` + `user:{assignedTo}` (cả 2 phía) |
| `ticket.resolved` | (chưa rõ — confirm) | `user:{creatorId}` + `user:{assignedTo}` |
| `ticket.deleted` (R5) | n/a (mới) | `user:{creatorId}` |

**Pattern đề xuất**: mọi event status transition emit tới `user:{X}` cho mọi user có "stake" trong ticket đó (creator + assignee nếu có). Plus `ticket:{ticketId}` room cho non-stakeholder viewer (vd admin watching).

### Helper đề xuất BE side
```ts
function emitToTicketStakeholders(ticketId, creatorId, assigneeId, event, payload) {
  io.to(roomUser(creatorId)).emit(event, payload);
  if (assigneeId) io.to(roomUser(assigneeId)).emit(event, payload);
  io.to(roomTicket(ticketId)).emit(event, payload);
}
```

### Acceptance criteria
```
1. Doctor login 2 device A + B. Device A accept ticket X.
2. Device B (cùng doctor) trong vòng < 2s → list "Sự cố của tôi" thấy ticket X
   xuất hiện (trước đó chỉ ở broadcast pool), broadcast pool bỏ ticket X.
3. Farmer login 2 device A + B. Device A cancel ticket Y.
4. Device B (cùng farmer) list refresh → status badge ticket Y đổi sang "Đã huỷ".
5. Farmer A close ticket Z (status resolved → closed). Doctor's list (cả device 1 + 2)
   refresh → ticket Z status "Hoàn tất".
```

---

## Files mobile đã đổi

```
# R5 — Delete cancelled ticket
src/services/api/incident.ts                            # remove() method
src/hooks/useIncident.ts                                 # useDeleteIncident
src/components/features/incident/IncidentCard.tsx        # onLongPress prop
src/components/features/incident/IncidentFooterActions.tsx # canDelete + delete button
app/(app)/(tabs)/incidents.tsx                          # long-press handler
app/(app)/incident/[id]/index.tsx                       # delete footer action

# R6 — Toast/notification policy
src/hooks/useToast.ts                                    # policy doc
src/hooks/usePrescription.ts                             # remove cross-user toast
src/hooks/useGlobalDoctorRealtime.ts                     # remove "Có yêu cầu mới"
src/hooks/useDoctorWallet.ts                             # remove credited toast
src/hooks/useWithdrawals.ts                              # remove approve/pay/reject toasts
src/hooks/useGlobalIncidentRealtime.ts                   # remove auto-refunded toast
app/(app)/(tabs)/incidents.tsx                          # remove socket-triggered toasts
app/(app)/incident/[id]/index.tsx                       # remove socket-triggered toasts

# R7 — Multi-device sync (mobile workaround)
app/(app)/incident/[id]/index.tsx                       # subscribeTicket(id) ngay khi mount
```

---

## Liên hệ
- Mobile maintainer: Tâm
- Mobile repo: `farmos_mobile`, branch `MOBILE--Fix-ui-keyboard`
- BE repo: `farm_os_be`
- Q&A: ping nếu cần align payload shape hoặc nếu BE chọn approach khác cho R5/R7.

---

## ✅ Mobile cleanup applied (2026-06-05) sau BE response R5–R7

### R5 — Multi-device delete sync
- `app/(app)/(tabs)/incidents.tsx` (list): listen `ticket.deleted` → invalidate list cache → device B của farmer thấy ticket biến mất tự động.
- `app/(app)/incident/[id]/index.tsx` (detail): listen `ticket.deleted` → invalidate cache + `router.back()` khi đang xem chính ticket bị xoá.
- API + hook + UI đã ready từ round trước.

### R6 — NotificationBanner redirect parser
- `src/components/features/notification/NotificationBanner.tsx`: extend `handlePress` để handle các path BE dùng:
  - `/tickets/<id>` → `/(app)/incident/<id>`
  - `/wallet/withdrawal/<id>` → `/(app)/withdrawal/<id>`
  - `/wallet` (hoặc `/wallet/...`) → `/(app)/wallet`
  - `/alerts/...` → `/(app)/(tabs)/alerts`
- `src/types/notification.ts`: align `NotificationType` với BE 5-value enum
  (`sensor_alert | incident_ticket | system_update | payment_reminder | new_message`).
  `Notification.type` để type `NotificationType | string` (defensive vs legacy data).
- `src/utils/notification.ts` (NOTIFICATION_TYPE_META): đã có sẵn cả 5 BE values
  + legacy aliases → không cần đổi, hoạt động đúng.

### R7 — Multi-device stakeholder audience
- `app/(app)/incident/[id]/index.tsx`: giữ `subscribeTicket(id)` ngay khi mount
  như defense-in-depth (BE giờ emit qua `user:{userId}` đủ cho stakeholder,
  nhưng subscribe ticket room vẫn helpful cho non-stakeholder/admin watcher
  events trong tương lai). Update comment giải thích lý do giữ.
- Status transition events (`ticket.accepted`, `ticket.in_progress`,
  `ticket.cancelled`, `ticket.resolved`, `ticket.deleted`) tự động hoạt động
  multi-device qua user room audience BE đã thêm — không cần code change.

### Files changed — Round 3 cleanup
```
app/(app)/(tabs)/incidents.tsx                                # R5 ticket.deleted listener
app/(app)/incident/[id]/index.tsx                             # R5 ticket.deleted + R7 comment
src/components/features/notification/NotificationBanner.tsx   # R6 redirect parser
src/types/notification.ts                                     # R6 align enum
```

### Edge cases acknowledged
- **Idempotent DELETE**: mobile chỉ gọi 1 lần từ UI, không có double-fire path. Nếu race condition gọi 2 lần thì cả 2 lần 204 đều OK (mutation onSuccess invalidate sạch).
- **NotificationType legacy values**: tolerate qua `string` union + `NOTIFICATION_TYPE_META` fallback `'system'`.
- **`ticket.closed` chưa emit**: BE reuse `ticket.resolved` cho close flow. Mobile listener `ticket.closed` vẫn đăng ký nhưng no-op → không hại, sẵn sàng nếu BE add sau.

### Verification mobile
- `npm run type-check`: pass (chỉ pre-existing errors).
- Sẵn sàng test khi BE deploy + user apply SQL migration soft-delete.
