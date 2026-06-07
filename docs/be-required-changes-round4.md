# Backend Required Changes — Round 4

> ✅ **STATUS (2026-06-05): BE đã triển khai R8–R10** trên branch `BE--Support-Ticket`.
> Mobile đã apply cleanup — xem section "Mobile cleanup applied" cuối doc.
> Không có DB migration cho round 4.
>
> Người nhận: Backend team (`farm_os_be`)
> Mobile branch: `MOBILE--Fix-ui-keyboard`
> Round trước: round1, round2, round3 — đã done. Round 3 còn 1 gap: `ticket.closed` chưa emit explicit.

---

## TL;DR — checklist BE round 4

| # | Mobile request | Severity | Mobile blocked? |
|---|----------------|----------|------------------|
| **R8** | Emit `ticket.closed` event với stakeholder audience sau `POST /tickets/:id/close` | **CRITICAL** | Partial — mobile fallback polling 10s, nhưng UX có window 0-10s user có thể duplicate close+rate |
| **R9** | Emit `ticket.rated` event với stakeholder audience sau `POST /tickets/:id/rating` | **CRITICAL** | Partial — same as R8 |
| **R10** | Server-side validation REJECT duplicate close/rate mutations (idempotent kết quả) | **CRITICAL** | YES — nếu BE accept duplicates, multi-device sẽ tạo rating trùng / status không nhất quán |

---

## Bối cảnh (critical bug từ client report)

> "Khi farmer viết đánh giá và close ticket, thì tôi cũng có đăng nhập vào farmer trên một device khác và cũng vào trang detail ticket thì không thấy màn hình được cập nhật, và tôi hoàn toàn có thể rating và close ticket lần nữa. Đây là critical issue."

### Root cause analysis
1. Device A: farmer ở detail screen status='resolved' → click "Đóng & Đánh giá" → modal → submit → 2 mutations chạy tuần tự:
   - `POST /tickets/:id/close` → status `resolved` → `closed`
   - `POST /tickets/:id/rating` → rating row created
2. Device A local: useMutation onSuccess invalidate cache → UI update đúng.
3. **Device B (same farmer, cùng detail screen)**:
   - **BE không emit `ticket.closed` event** (round 3 doc xác nhận "ticket.closed chưa emit riêng").
   - **BE không emit `ticket.rated` event** (chưa từng có).
   - Device B không nhận signal → cache không invalidate → UI vẫn hiển thị status='resolved' + nút "Đóng & Đánh giá" enabled.
   - User click → mutation fires lại → **BE accept duplicate** → tạo rating trùng / status update lần 2 (silent overwrite hoặc 200 OK no-op tuỳ implementation).

### Tác động
- **Data integrity**: rating có thể bị duplicate hoặc bị overwrite không kiểm soát.
- **Doctor reputation**: nếu rating duplicate được tính, doctor score sai lệch.
- **UX**: user confused — không biết action đã thành công hay chưa.

---

## R8 — Emit `ticket.closed` event

### BE cần làm
Sau khi `POST /tickets/:id/close` commit thành công (status transition `resolved → closed`):

```ts
this.realtime.emitToTicketStakeholders(
  { ticketId, creatorId, assigneeId: assignedTo },
  RealtimeEvents.TicketClosed,
  { ticketId, closedAt: <ISO timestamp> }
)
```

### Event spec

| Field | Description |
|-------|-------------|
| **Name** | `ticket.closed` |
| **Audience** | `user:{creatorId}` + `user:{assignedTo}` + `ticket:{ticketId}` (dùng `emitToTicketStakeholders` helper từ round 3 R7) |
| **Payload** | `{ ticketId: string, closedAt: string }` |
| **Khi nào emit** | Sau close transaction commit (KHÔNG emit lại nếu status đã closed sẵn — idempotent) |

### Mobile listener
Mobile đã có sẵn listener `ticket.closed` ở cả `incident/[id]/index.tsx` và `(tabs)/incidents.tsx` → invalidate detail/full/list. Chỉ cần BE emit là active.

---

## R9 — Emit `ticket.rated` event

### BE cần làm
Sau khi `POST /tickets/:id/rating` commit rating row:

```ts
this.realtime.emitToTicketStakeholders(
  { ticketId, creatorId, assigneeId: assignedTo },
  RealtimeEvents.TicketRated,
  { ticketId, stars, ratedBy: creatorId, ratedAt: <ISO> }
)
```

### Event spec

| Field | Description |
|-------|-------------|
| **Name** | `ticket.rated` |
| **Audience** | `user:{creatorId}` + `user:{assignedTo}` + `ticket:{ticketId}` |
| **Payload** | `{ ticketId: string, stars: number, ratedBy: string, ratedAt: string }` |
| **Khi nào emit** | Sau rate row insert commit. Chỉ emit 1 lần per rating (idempotent guard R10). |

### Mobile listener
Mobile đã thêm listener `ticket.rated` ở `incident/[id]/index.tsx` → invalidate detail + full.

---

## R10 — Server-side validation: REJECT duplicate close/rate

### `POST /tickets/:id/close`
Validation logic (đề xuất):
1. Lock row `SELECT ... FOR UPDATE` hoặc dùng `updateMany` atomic guard.
2. Reject với 422 nếu `status !== 'resolved'`:
   ```ts
   if (ticket.status !== 'resolved') {
     throw new TicketCloseStateException()
       // message: "Sự cố chỉ có thể đóng khi đang chờ xác nhận"
   }
   ```
3. Hoặc dùng `updateMany({ where: { id, status: 'resolved' }, data: { status: 'closed' } })` → rowsAffected = 0 → throw same exception.
4. KHÔNG silently no-op return 200 — phải feedback cho client biết action không hợp lệ.

### `POST /tickets/:id/rating`
Validation logic:
1. Check unique constraint hoặc query `findFirst({ ticketId })`:
   ```ts
   const existing = await prisma.ticketRating.findUnique({ where: { ticketId } })
   if (existing) {
     throw new TicketRatingExistsException()
       // message: "Sự cố này đã được đánh giá"
   }
   ```
2. Hoặc thêm DB UNIQUE constraint `support_ticket_id UNIQUE` trên `ticket_ratings` để DB enforce.
3. Reject với 422.

### Acceptance criteria
```
1. Farmer device A close ticket X → 200 OK, status=closed.
2. Farmer device B close ticket X (cùng farmer) → 422
   "Sự cố chỉ có thể đóng khi đang chờ xác nhận"
3. Farmer device A rate ticket X (5 sao) → 200 OK.
4. Farmer device B rate ticket X → 422
   "Sự cố này đã được đánh giá"
5. KHÔNG có rating duplicate trong DB:
   SELECT ticket_id, COUNT(*) FROM ticket_ratings GROUP BY ticket_id HAVING COUNT(*) > 1;
   → 0 rows
```

### i18n keys mới đề xuất
- `Error.TicketCloseState`
  - VI: `"Sự cố chỉ có thể đóng khi đang chờ xác nhận."`
  - EN: `"Only resolved tickets can be closed."`
- `Error.TicketRatingExists`
  - VI: `"Sự cố này đã được đánh giá."`
  - EN: `"This ticket has already been rated."`

---

## Mobile fix đã apply (defensive workaround trong khi chờ BE)

### 1. Polling fallback
- `useIncidentDetail`: polling `refetchInterval` 10s khi status='resolved' (cộng thêm 5s cho status='open' đã có).
- `useTicketFull`: polling 10s khi /full.ticket.status='resolved'.
- Hệ quả: device B max 10s sau action ở device A sẽ thấy update.

### 2. Defensive guard `alreadyRated`
- `app/(app)/incident/[id]/index.tsx`:
  ```ts
  const alreadyRated = !!ticketFullQuery.data?.rating
  const canClose = isCreator && status === 'resolved' && !alreadyRated
  ```
- Nếu /full.rating !== null (đã rate ở device khác) → ẩn nút close+rate.

### 3. Submit-time guard
- Trong `handleCloseSubmit`:
  ```ts
  if (alreadyRated || status === 'closed') {
    setCloseModalVisible(false)
    showToast.info({ message: 'Sự cố đã được đóng ở thiết bị khác' })
    refetch(); ticketFullQuery.refetch()
    return
  }
  ```
- Last-line defense ngay trước fire mutation.

### 4. Realtime listener sẵn sàng
- Mobile listen `ticket.rated` ở detail screen. Khi BE add R9 → fire ngay.

### 5. Type
- Thêm `TicketRating` type trong `src/services/api/ticketLifecycle.ts` (thay `rating: unknown`).

### Vẫn còn gap
Mobile workaround KHÔNG cover 100%:
- Window 0–10s sau device A action, device B vẫn có thể click submit close.
- Nếu BE accept duplicate (R10 chưa làm) → BE side bug vẫn xảy ra.
- → **R10 vẫn CRITICAL bất kể mobile workaround**.

---

## Files mobile đã đổi

```
# Issue 1 — banner colors
src/components/features/notification/NotificationBanner.tsx   # tinted bg, accent border, brighter

# Issue 2 — duplicate close/rate defense
src/services/api/ticketLifecycle.ts                            # TicketRating type
src/hooks/useIncident.ts                                        # polling resolved status (10s)
src/hooks/useTicketLifecycle.ts                                 # useTicketFull polling
app/(app)/incident/[id]/index.tsx                              # alreadyRated guard + handleCloseSubmit pre-check + ticket.rated listener
```

---

## Liên hệ
- Mobile maintainer: Tâm
- Mobile branch: `MOBILE--Fix-ui-keyboard`
- BE branch hiện tại: `BE--Support-Ticket`
- Q&A: critical issue — đề nghị priority high cho round 4 trước khi ship build mới.

---

## ✅ Mobile cleanup applied (2026-06-05) sau BE response R8–R10

### R8 + R9 — Realtime listener (event đã active)
- `app/(app)/incident/[id]/index.tsx`:
  - Listener `ticket.closed` invalidate detail + full + list (đã có sẵn — chỉ cần BE emit).
  - Listener `ticket.rated` invalidate detail + full (đã add ở round 3 mobile).
  - Comment update reflect BE payload: `{ ticketId, stars, ratedBy, ratedAt }`.
- `app/(app)/(tabs)/incidents.tsx`:
  - Listener `ticket.closed` invalidate list (đã có sẵn).

Cả 2 listener dùng `onlyThisTicket` extractor — chỉ đọc `ticketId`, extra field BE thêm (`closedBy`/`stars`/`ratedAt`) không break.

### R10 — Error handling 422 close / 409 rate
- `app/(app)/incident/[id]/index.tsx:handleCloseSubmit`:
  - **Close mutation onError**: check `statusCode === 422` (`TicketCloseState`)
    → toast info `"Sự cố đã được đóng ở thiết bị khác"` + refetch + đóng modal.
  - **Rate mutation onError** (nested sau close success): check `statusCode === 409`
    (`TicketRatingAlreadyExists`) → toast info `"Đã có đánh giá cho yêu cầu hỗ trợ này."` +
    refetch /full + đóng modal. Trước đây silent success on rate error — bug đã fix.

### Polling reduction (BE realtime đã primary)
- `src/hooks/useIncident.ts:useIncidentDetail`:
  - 'resolved' polling: 10s → **30s** defense-in-depth.
  - 'open' polling: giữ 5s (UX feel live khi chờ doctor accept).
- `src/hooks/useTicketLifecycle.ts:useTicketFull`:
  - 'resolved' polling: 10s → **30s**.
- Comment update reflect BE primary sync qua socket events.

### UX-first guard (vẫn giữ)
- `alreadyRated = !!ticketFullQuery.data?.rating` + `canClose = ... && !alreadyRated` → button "Đóng & Đánh giá" ẩn ngay khi device khác đã rate (xem qua /full.rating). BE 409 là last-line nếu cache không kịp sync.

### Files changed — Round 4 cleanup
```
app/(app)/incident/[id]/index.tsx                       # 422/409 error handling + comments
src/hooks/useIncident.ts                                 # polling 10s → 30s
src/hooks/useTicketLifecycle.ts                          # polling 10s → 30s
```

### Edge cases acknowledged
- **Backward compat 200 → 422 cho close**: mobile đã handle 422 explicitly, không lệ thuộc 200 silent no-op cũ.
- **Event order**: device B nhận `ticket.closed` rồi `ticket.rated` → 2 invalidate liên tiếp /full → react-query coalesce, OK.
- **i18n key**: mobile dùng `ex.message` từ BE response (đã i18n resolve theo `Accept-Language: vi`), không hardcode key tên.

### Verification mobile
- `npm run type-check`: pass (chỉ pre-existing errors).
- Ready test sau khi BE deploy.
