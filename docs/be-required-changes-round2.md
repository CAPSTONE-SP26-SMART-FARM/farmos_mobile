# Backend Required Changes — Round 2

> ✅ **STATUS (2026-06-05): BE đã triển khai R1–R4** trên branch
> `BE--Support-Ticket`. Mobile đã apply cleanup tương ứng — xem section
> "Mobile cleanup applied" cuối doc.
>
> ⚠️ R4 cần user apply SQL migration manual trước khi mobile ship build mới.
>
> Người nhận: Backend team (`farm_os_be`)
> Mobile branch: `MOBILE--Fix-ui-keyboard`
> Mobile fix tham chiếu: docs/be-required-changes.md (round 1 đã done)

---

## TL;DR — checklist BE round 2

| # | Mobile request | Severity | Mobile blocked? |
|---|----------------|----------|------------------|
| **R1** | Emit `ticket.fallback.resolved` (multi-device dialog sync) | Medium | No (mobile fallback dùng các event hiện có, dismiss UX delay khoảng vài giây — xem detail) |
| **R2** | Emit `ticket.accepted`, `ticket.cancelled`, `ticket.in_progress` (status transition events) | High | Partial — mobile đã đăng ký listener sẵn, BE chưa emit thì list/detail không refresh realtime cho các transition này |
| **R3** | Confirm/Document shape `addenda[]` trong `/tickets/:id/full` | High | No (mobile đã guess type theo convention) — cần BE confirm để tránh runtime mismatch |
| **R4** | Migrate `support_ticket.severity` enum thành `'normal' \| 'urgent'` (tách khỏi alert enum) | High | YES — mobile đã đổi type. Nếu BE chưa migrate, badge sẽ hiện raw value (`low/medium/high/critical`) và filter dropdown thiếu match |

---

## R1 — Event `ticket.fallback.resolved` (multi-device dialog sync)

### Hiện trạng
- Farmer login trên 2 device cùng tài khoản → AI fallback dialog popup ở cả 2.
- Device A chọn `FALLBACK_AI` hoặc `REFUND_TICKET` → BE xử lý ngay.
- Device B vẫn hang ở dialog cho tới khi user bấm thủ công.

### Mobile workaround đã apply
Mobile listen các event hiện có để auto-dismiss dialog:
- `ticket.abandon.refunded` (REFUND_TICKET path — đã có)
- `ticket.ai.resolved` (FALLBACK_AI path — chỉ tới sau khi AI xong, có thể trễ vài giây/phút)
- `ticket.ai.processing.started` (BE chưa chắc có emit — mobile listen as best-effort)
- `ticket.fallback.resolved` (BE chưa có — mobile listen sẵn cho khi BE thêm)

Hệ quả tạm thời: device B sẽ dismiss CHẬM (sau khi AI process xong) cho FALLBACK_AI flow. UX không tệ nhưng không "tức thì" như device A.

### BE cần làm
**Option A (preferred)** — Emit explicit event `ticket.fallback.resolved` NGAY sau khi `POST /tickets/:id/abandon-resolution` commit (trước khi AI worker chạy / refund logic chạy):

```ts
// Event: ticket.fallback.resolved
// Audience: user:{ownerId} (mọi device của owner — không except acceptor vì
//           các device đều của cùng 1 user, ngược lại với pattern accept).
// Payload:
{
  ticketId: string
  resolution: 'FALLBACK_AI' | 'REFUND_TICKET'
  // Optional: device tag nếu BE biết device id (không bắt buộc cho mobile).
}
```

**Option B** — Emit `ticket.ai.processing.started` ngay khi AI worker queue job (trước khi worker thực sự chạy Gemini):

```ts
// Event: ticket.ai.processing.started
// Audience: user:{ownerId}
// Payload: { ticketId }
```

Mobile đã listen sẵn cả 2 event này — chỉ cần BE bắt đầu emit là hoạt động.

### Acceptance criteria
```
1. Farmer login 2 device A + B, BE đẩy fallback offer → cả 2 device hiện popup
2. Device A bấm "Dùng AI xử lý" → BE nhận POST /tickets/:id/abandon-resolution
3. BE emit `ticket.fallback.resolved` (hoặc `ticket.ai.processing.started`) trong cùng tx
4. Device B nhận event → popup tự dismiss (không cần user bấm)
5. Thời gian từ device A bấm → device B dismiss < 2s
```

---

## R2 — Status transition events (realtime status update cho list + detail)

### Hiện trạng
- Khi ticket chuyển status (open → assigned → in_progress → resolved → closed → cancelled), BE chỉ emit một số event như `ticket.resolved`, `ticket.closed`, `ticket.ai.resolved`, `ticket.abandon.refunded`.
- THIẾU event cho các transition còn lại:
  - `ticket.accepted` (open → assigned, khi doctor accept)
  - `ticket.in_progress` (assigned → in_progress, khi doctor bắt đầu xử lý)
  - `ticket.cancelled` (open → cancelled, khi farmer huỷ)

Doctor accept ticket → BE chỉ emit `ticket.broadcast.removed` (cho doctor pool) và update DB. Farmer đang ở list/detail KHÔNG biết → badge vẫn hiện "Chờ tiếp nhận" cho tới khi user pull-to-refresh.

### Mobile đã làm gì
Mobile đã đăng ký listener cho:
- `ticket.accepted`
- `ticket.in_progress`
- `ticket.cancelled`
- `ticket.status.changed` (generic fallback nếu BE chọn pattern này)

Cả ở screen list (`app/(app)/(tabs)/incidents.tsx`) và detail (`app/(app)/incident/[id]/index.tsx`). Khi BE emit là mobile tự invalidate query + UI refresh.

### BE cần làm (option, pick 1)

**Option A (preferred — explicit)** — Emit từng event riêng cho mỗi transition:

| Event | Trigger | Audience | Payload |
|-------|---------|----------|---------|
| `ticket.accepted` | Doctor accept (`POST /tickets/:id/accept`) | `user:{ownerId}` + `ticket:{ticketId}` | `{ ticketId, acceptedBy, assignedAt }` |
| `ticket.in_progress` | Doctor bắt đầu xử lý (BE detect lần đầu doctor open chat / first prescription / explicit endpoint) | `user:{ownerId}` + `ticket:{ticketId}` | `{ ticketId }` |
| `ticket.cancelled` | Farmer cancel (`PATCH /tickets/:id/cancel`) | `user:{doctorId nếu có}` + `ticket:{ticketId}` | `{ ticketId, reason? }` |

Mobile đã có handler cho cả 3 event này.

**Option B (alternative — generic)** — Emit 1 event chung `ticket.status.changed` cho mọi transition (rộng hơn, BE chỉ implement 1 chỗ):

```ts
{
  ticketId: string
  fromStatus: TicketStatus  // 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'cancelled'
  toStatus: TicketStatus
  changedBy?: string  // userId trigger transition (optional)
}
```

Audience: room `ticket:{ticketId}` (mọi subscriber của ticket).

Option B cleaner cho BE nhưng mobile loses fine-grained toast distinction (hiện mobile có toast khác nhau per event).

### Acceptance criteria (Option A)
```
1. Doctor accept ticket → owner farmer đang ở list nhận `ticket.accepted`
   → badge chuyển từ "Chờ tiếp nhận" sang "Đã tiếp nhận" mà không cần reload
2. Doctor mở chat / phản hồi đầu tiên → owner nhận `ticket.in_progress`
   → badge "Đang xử lý"
3. Farmer cancel pending ticket → doctor (nếu đã accept) nhận `ticket.cancelled`
   → detail screen update, list không còn ticket đó trong active filter
```

---

## R3 — Confirm shape của `addenda[]` trong `/tickets/:id/full`

### Hiện trạng mobile assume
Mobile hiện đang assume shape sau cho field `addenda` trong response của `GET /tickets/:id/full`:

```ts
type TicketAddendum = {
  id: string
  ticketId: string
  type: 'SOLUTION_NOTE' | 'PRESCRIPTION_NOTE' | 'CORRECTION'
  content: string
  authorId: string
  author?: {
    id: string
    fullName: string
    avatarUrl: string | null
  } | null
  createdAt: string
}
```

Field hiện được populate khi doctor `POST /tickets/:id/addenda` với body `{ type, content }`.

### Mobile đã làm gì
- Render section "Ghi chú bổ sung (N)" trong detail screen sau khi doctor thêm addendum.
- Sort theo `createdAt` desc.
- Display: type label + content + date + author name (nếu có).

Trước fix: doctor thêm addendum xong → không có UI render → user nghĩ chức năng broken.

### BE cần confirm / làm
1. Confirm shape `TicketAddendum` ở trên đúng với BE response. Cập nhật mobile type nếu khác.
2. Đảm bảo `/tickets/:id/full.addenda` populate đầy đủ cho cả doctor + farmer/owner (mobile hiện gọi /full cho cả 2 role).
3. Field `author` (nested object với fullName, avatarUrl) NÊN populate để mobile render tên tác giả ghi chú. Nếu không, mobile chỉ show `authorId` (kém UX).
4. Sau khi `POST /tickets/:id/addenda` commit → BE NÊN emit event `ticket.addendum.created` (xem R2 — cùng pattern) để mobile invalidate /full mà không cần pull-to-refresh:

```ts
// Event: ticket.addendum.created
// Audience: ticket:{ticketId}
// Payload: { ticketId, addendumId, type, authorId }
```

(Hiện tại mobile invalidate ticketFull trong `useAddAddendum.onSuccess` → đủ cho người tạo thấy. Nhưng farmer đang xem detail của doctor ghi → cần socket event để refresh.)

### Acceptance criteria
```
1. GET /tickets/:id/full với ticket đã có 2 addenda
   → response.data.addenda.length === 2
   → mỗi addendum đủ field { id, type, content, authorId, author?.fullName, createdAt }
2. Doctor POST addendum → farmer đang mở detail của ticket đó nhận
   `ticket.addendum.created` → ghi chú mới hiện trên screen trong <2s
```

---

## R4 — Migrate `support_ticket.severity` thành `'normal' | 'urgent'`

### Hiện trạng
- BE schema: `support_ticket.severity` đang dùng enum 4 mức (`low | medium | high | critical`) — SHARE enum với `alert.severity`.
- Vấn đề: 4 mức là dư thừa cho support_ticket. Domain meaning của support_ticket khác với alert:
  - Alert (IoT sensor): 4 mức làm sense (gradient cảnh báo)
  - Support_ticket: chỉ cần phân biệt "có thể chờ" vs "khẩn cấp" → 2 mức `normal | urgent` đủ và rõ nghĩa hơn

### Mobile đã làm gì
- Đổi type `IncidentSeverity = 'normal' | 'urgent'`
- Đổi `SEVERITY_META`: chỉ còn 2 key
- Đổi default trong form `incident/create`: từ `'medium'` → `'normal'`
- Đổi `INACTIVITY_LIMIT_MS`: `urgent: 60min, normal: 30min`
- Đổi `SEVERITY_ORDER` trong analytics screen
- Defensive UI: `IncidentCard` fallback render raw value nếu key không trong META

⚠️ **NẾU BE CHƯA MIGRATE**: ticket từ BE trả về `'medium'/'high'/etc` → badge sẽ render raw text (vd "medium") và filter dropdown thiếu match. Cần BE migrate ASAP để clean UX.

### BE cần làm

#### Schema migration
1. **Tạo enum mới cho ticket severity** (tách khỏi alert):
   ```sql
   -- Postgres example
   CREATE TYPE ticket_severity_new AS ENUM ('normal', 'urgent');
   ```
2. **Add cột tạm** + **backfill mapping**:
   ```sql
   ALTER TABLE support_ticket ADD COLUMN severity_new ticket_severity_new;
   UPDATE support_ticket SET severity_new = CASE
     WHEN severity IN ('low', 'medium') THEN 'normal'::ticket_severity_new
     WHEN severity IN ('high', 'critical') THEN 'urgent'::ticket_severity_new
     ELSE 'normal'::ticket_severity_new
   END;
   ```
3. **Swap column**:
   ```sql
   ALTER TABLE support_ticket DROP COLUMN severity;
   ALTER TABLE support_ticket RENAME COLUMN severity_new TO severity;
   ALTER TABLE support_ticket ALTER COLUMN severity SET NOT NULL;
   ```
4. **Drop ràng buộc với enum cũ** (nếu alert vẫn dùng enum cũ thì giữ nguyên — chỉ tách reference của support_ticket).

#### API endpoints update
- `POST /tickets` (create incident): accept body `{ severity: 'normal' | 'urgent' }`. Reject các giá trị cũ với 422.
- `GET /tickets`, `GET /tickets/:id`, `GET /tickets/:id/full`: trả `severity` là `'normal' | 'urgent'`.
- `GET /tickets/doctor/stats` (analytics): `bySeverity` key chỉ còn 2: `{ normal: number, urgent: number }`.
- Filter / query params nếu có: chỉ accept 2 giá trị mới.

#### Mapping cho data cũ (đề xuất)
| Old | New |
|-----|-----|
| `low` | `normal` |
| `medium` | `normal` |
| `high` | `urgent` |
| `critical` | `urgent` |

#### Alert KHÔNG đổi
- `Alert.severity` giữ nguyên 4 mức (`low | medium | high | critical`).
- Mobile đã tách type: `AlertSeverity` riêng (xem `src/types/alert.ts`).

### Acceptance criteria
```
1. Migration chạy xong: SELECT DISTINCT severity FROM support_ticket
   → Chỉ có 'normal', 'urgent' (không còn low/medium/high/critical)
2. POST /tickets { severity: 'normal' } → 201 OK
3. POST /tickets { severity: 'medium' } → 422 với message "Invalid severity"
4. GET /tickets/doctor/stats → bySeverity = { normal: N, urgent: M }
5. Alert API endpoints không bị ảnh hưởng — vẫn nhận/trả low/medium/high/critical
```

---

## Files mobile đã đổi (cho BE tham khảo impact)

```
# Issue 1 (mobile-only): footer label theo status
src/components/features/incident/IncidentFooterActions.tsx
app/(app)/incident/[id]/index.tsx                                 # pass closedReason

# Issue 2 (R1): multi-device dialog sync
src/components/ui/ConfirmDialog.tsx                               # add tag + dismiss API
src/hooks/useGlobalIncidentRealtime.ts                            # listen fallback resolved events
app/(app)/incident/[id]/index.tsx                                 # tag detail-screen dialog

# Issue 3 (R3): addendum render
src/services/api/ticketLifecycle.ts                               # add TicketAddendum type
src/components/features/incident/AddendaSection.tsx               # NEW
app/(app)/incident/[id]/index.tsx                                 # mount section + enable useTicketFull cho doctor

# Issue 4 (R2): realtime status listener
app/(app)/incident/[id]/index.tsx                                 # add ticket.accepted/in_progress/cancelled/status.changed listeners
app/(app)/(tabs)/incidents.tsx                                    # same in list

# Issue 5 (R4): severity refactor
src/types/incident.ts                                              # IncidentSeverity = normal|urgent
src/constants/incident.ts                                          # SEVERITY_META 2 keys
app/(app)/incident/[id]/index.tsx                                 # INACTIVITY_LIMIT_MS
app/(app)/incident/create.tsx                                      # default 'normal'
app/(app)/doctor-ticket-analytics.tsx                             # SEVERITY_ORDER 2 items
src/components/features/incident/IncidentCard.tsx                  # defensive render
```

---

## Liên hệ
- Mobile maintainer: Tâm
- Mobile repo: `farmos_mobile`, branch `MOBILE--Fix-ui-keyboard`
- BE repo: `farm_os_be`
- Nếu BE cần align contract trước khi implement → ping mobile để review payload shape.

---

## ✅ Mobile cleanup applied (2026-06-05) sau BE response

Sau khi BE merge R1–R4 trên branch `BE--Support-Ticket`, mobile đã apply cleanup
theo "Mobile cleanup possible" trong BE doc:

### R1 — Multi-device dialog sync (`useGlobalIncidentRealtime.ts`)
- Bỏ listener `ticket.ai.processing.started` (BE không emit event này).
- Bỏ listener redundant `ticket.abandon.refunded` + `ticket.ai.resolved` cho dialog dismiss
  (giữ chúng cho purpose khác trong detail screen).
- **Giữ duy nhất `ticket.fallback.resolved`** làm primary trigger dismiss popup.

### R2 — Status transition (`incident/[id]/index.tsx` + `(tabs)/incidents.tsx`)
- Bỏ listener generic `ticket.status.changed` (BE chọn Option A — explicit per-event).
- Giữ 3 listener explicit: `ticket.accepted`, `ticket.in_progress`, `ticket.cancelled`.
- Comment payload spec match BE doc:
  - `ticket.accepted`: `{ ticketId, acceptedBy, assignedAt }`
  - `ticket.in_progress`: `{ ticketId }` (emit atomic khi doctor gửi message đầu tiên)
  - `ticket.cancelled`: `{ ticketId, reason: string | null }`

### R3 — Addendum realtime (`incident/[id]/index.tsx`)
- Add listener `ticket.addendum.created` → invalidate `ticketFull(id)` → AddendaSection
  refresh tự động khi doctor add addendum (cover case farmer đang xem realtime).
- Type `TicketAddendum.author` đã khớp BE shape: `{ id, fullName, avatarUrl }` (đã add
  trong round trước).

### R4 — Severity (`IncidentCard.tsx`)
- Bỏ defensive fallback `severity?.color ?? '#9CA3AF'` — BE enforce 2-level enum,
  `SEVERITY_META[item.severity]` luôn match.
- `IncidentSeverity = 'normal' | 'urgent'`, `INACTIVITY_LIMIT_MS = { urgent: 60min, normal: 30min }` đã có từ trước.
- BroadcastItem trong `(tabs)/incidents.tsx` GIỮ defensive vì broadcast type field
  `severity` typed là `string`, không phải enum (xem `types/broadcast.ts`).

### Files changed — Round 2 cleanup
```
src/hooks/useGlobalIncidentRealtime.ts                    # R1: bỏ 3 listener redundant
app/(app)/incident/[id]/index.tsx                         # R2 cleanup + R3 listener
app/(app)/(tabs)/incidents.tsx                            # R2 cleanup
src/components/features/incident/IncidentCard.tsx         # R4: bỏ defensive fallback
```

### Verification mobile
- `npm run type-check`: pass (chỉ lỗi pre-existing SVG transformer + notification/ticketMessage).
- Mobile sẵn sàng test khi BE deploy + user apply SQL migration (R4).
