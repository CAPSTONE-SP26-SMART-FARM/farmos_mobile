# Backend Required Changes — Để mobile code clean & optimize

> ✅ **STATUS (2026-06-05): BE đã triển khai xong C1–C5** trên branch
> `BE--Fix-issue-prescription` (+ `BE--Fix-issue-ai-fallback-timeout`).
> Mobile đã áp dụng cleanup tương ứng — xem section "Mobile cleanup applied" cuối doc.
>
> Doc giữ lại để tham chiếu lịch sử yêu cầu + acceptance criteria.
>
> Người nhận: Backend team (`farm_os_be`)
> Ngày: 2026-06-05
> Liên hệ: mobile team (Tâm) — repo `farmos_mobile`

---

## TL;DR — checklist cho BE

- [ ] **C1**. `GET /tickets/:id/full` populate `prescription` cho ticket
  resolve bằng AI (hiện đang null).
- [ ] **C2**. `GET /ticket/:id/prescriptions` (list) populate `items[]` đầy đủ
  cho mỗi prescription (hiện chỉ có summary `medicineName`/`dosage` top-level).
- [ ] **C3**. Worker AI fallback: commit `solution` + `prescription` **trong
  cùng transaction**, sau đó mới emit `ticket.ai.resolved`. Hoặc emit thêm
  event `prescription.incident.created` cho AI flow.
- [ ] **C4**. Event `ticket.broadcast.removed` với reason `ACCEPTED`: KHÔNG
  emit về socket của doctor vừa accept (ưu tiên), HOẶC luôn kèm field
  `acceptedBy: <doctorId>` trong payload.
- [ ] **C5**. Document chính thức event `prescription.incident.created`
  (payload + audience + khi nào emit).

Nếu làm hết C1–C5, mobile có thể xoá:
- Hook `usePrescriptionDetail` call chained sau list trong screen
  `/(app)/incident/[id]/prescription` (giảm 1 round-trip).
- Module-level guard `markTicketSelfAccepted` (TTL set) trong
  `useDoctorTicketRemoved` (giảm complexity).
- Invalidate prescriptions list trong `onAiResolved` (BE sẽ emit
  `prescription.incident.created` thay).

---

## C1 — `/tickets/:id/full` thiếu prescription cho AI ticket

### Hiện trạng BE
- Endpoint: `GET /tickets/:id/full`
- Response shape (mobile đang assume):
  ```ts
  {
    ticket, solution, prescription, addenda, rating, broadcasts,
    abandonLogs, pendingFallbackChoice
  }
  ```
- Khi ticket được giải quyết bằng **doctor flow** (`POST /tickets/:id/resolve`
  có kèm prescription) → `prescription` field populated đầy đủ ✅
- Khi ticket được giải quyết bằng **AI fallback** (worker chạy Gemini →
  ticket.ai.resolved) → `prescription` field = `null` ❌ mặc dù trong DB AI
  vẫn tạo Prescription row với `authorId = "AI"`.

### Mobile bị ảnh hưởng thế nào
- Screen `/(app)/incident/[id]/prescription` (form-sheet xem chi tiết đơn thuốc)
  trước đây đọc từ `/full.prescription` → render rỗng cho AI ticket.
- Mobile đã chuyển sang gọi `usePrescriptionDetail(id, rxId)` (endpoint
  `/ticket/:id/prescriptions/:rxId`) như workaround → tốn thêm 1 round-trip.

### BE cần làm
- Trong handler `/tickets/:id/full`, populate `prescription` field từ
  Prescription table với điều kiện `ticketId = :id` (bất kể `authorId` là
  doctor UUID hay literal `"AI"`).
- Nếu ticket có nhiều prescription (rare nhưng có thể xảy ra với addendum
  prescription corrections), chọn prescription `status = ACTIVE` mới nhất
  hoặc trả ALL trong field mới `prescriptions: PrescriptionFull[]` (preferred
  long-term — sẽ ăn breaking change nên cần align trước).

### Acceptance criteria
```sh
# Setup: ticket được fallback AI, AI đã resolve
GET /tickets/<aiResolvedTicketId>/full
# Expect:
#   response.data.prescription !== null
#   response.data.prescription.authorId === "AI"
#   response.data.prescription.items.length > 0
#   response.data.prescription.items[i] có đầy đủ field
#     (medicineId/customMedicineName, dosage, frequency, usageInstructions, ...)
```

### Mobile sẽ làm sau khi BE fix
- Quay lại đọc prescription từ `/full` (1 call) thay vì gọi thêm
  `/ticket/:id/prescriptions/:rxId`.
- Giảm code branching (rxIdParam, fallback list-then-detail).

---

## C2 — `/ticket/:id/prescriptions` (list) không kèm `items[]`

### Hiện trạng BE
- Endpoint: `GET /ticket/:id/prescriptions?page=&limit=`
- Response item shape hiện tại (best guess từ behavior mobile thấy):
  ```ts
  {
    id, ticketId, authorId, status, generalNotes, createdAt,
    medicineName?, dosage?,  // legacy summary
    // items: PrescriptionItemRes[]   ← THIẾU hoặc empty array
  }
  ```
- Type ở mobile (`src/types/prescription.ts`) declare `items:
  PrescriptionItemRes[]` (required), nhưng thực tế list response không trả →
  TS lying, runtime mobile phải defensive `?? []`.

### Mobile bị ảnh hưởng thế nào
- Screen `PrescriptionSection` ở incident detail render được card vì dùng
  legacy `medicineName`/`dosage` top-level → OK.
- Screen `/(app)/incident/[id]/prescription` (form-sheet) cần render full
  `items[]` → phải gọi thêm endpoint detail. Nếu list có `items[]` thì giảm
  1 round-trip + tránh logic fallback.

### BE cần làm (option, pick 1)
1. **Option A (recommended)**: `GET /ticket/:id/prescriptions` populate
   `items[]` cho mỗi prescription trong response. Mobile chỉ cần 1 call
   `usePrescriptions(id)` là đủ data cho mọi UI.
2. **Option B**: giữ list endpoint summary-only như hiện tại, document rõ
   `items: undefined` hoặc `items: []` trong list. Mobile tiếp tục gọi detail.
   *Nếu chọn option này, đảm bảo C1 đầy đủ (vì /full sẽ là single source cho
   detail).*

### Acceptance criteria (Option A)
```sh
GET /ticket/<ticketId>/prescriptions
# Expect:
#   response.data.data[i].items.length === <số item thực tế trong DB>
#   Mỗi item có đủ field: medicineId | customMedicineName, dosage, frequency,
#     usageInstructions, route, durationDays, warnings, withdrawalPeriodDays
```

### Mobile sẽ làm sau khi BE fix
- Bỏ logic `usePrescriptionDetail` + param `rxId` trong prescription form-sheet.
- Render trực tiếp từ list — đơn giản hoá.

---

## C3 — AI fallback flow: race giữa solution và prescription

### Hiện trạng BE
- Flow: doctor abandon → owner chọn `FALLBACK_AI` → worker chạy Gemini → BE
  emit `ticket.ai.resolved`.
- Hiện tượng mobile thấy (intermittent, ~30% reproduce): khi mobile nhận
  `ticket.ai.resolved` và refetch `/tickets/:id/full`, `solution` đã có
  nhưng `prescription` chưa có. User phải back ra list → vào lại → mới thấy
  prescription.

### Phân tích khả năng
1. Worker commit `solution` row trước `prescription` row, KHÔNG cùng transaction.
   Event `ticket.ai.resolved` emit ngay sau commit solution → mobile fetch
   trong window này thấy prescription chưa có.
2. BE không emit event nào cho việc tạo prescription AI → mobile không có
   signal để invalidate prescriptions list separately.

### BE cần làm (làm cả 2)
1. **Atomic commit**: trong worker AI fallback, wrap `INSERT solution` +
   `INSERT prescription` + `INSERT prescription_items` trong **cùng 1
   transaction**. Chỉ emit `ticket.ai.resolved` sau khi transaction commit
   thành công.
2. **Emit prescription event**: BE emit thêm
   `prescription.incident.created` cho AI flow (giống như khi doctor kê đơn).
   Audience: room `ticket:<ticketId>` (mọi subscriber của ticket — owner + doctor
   assignee nếu có). Payload:
   ```ts
   { created: { ticketId, prescriptionId, authorId: "AI" } }
   ```

### Acceptance criteria
```
1. Trigger AI fallback cho 10 ticket liên tiếp
2. Khi mobile nhận `ticket.ai.resolved`, fetch /full ngay → 10/10 lần phải
   thấy prescription !== null
3. Mobile nhận `prescription.incident.created` event với authorId === "AI"
   trong vòng 500ms sau `ticket.ai.resolved`
```

### Mobile sẽ làm sau khi BE fix
- Bỏ `qc.invalidateQueries({ queryKey: queryKeys.prescriptions.list(id) })`
  trong handler `onAiResolved` (file
  `app/(app)/incident/[id]/index.tsx`) — BE event sẽ tự trigger.

---

## C4 — `ticket.broadcast.removed` echo về acceptor

### Hiện trạng BE
- Event: `ticket.broadcast.removed`
- Mobile assume payload:
  ```ts
  {
    ticketId: string
    reason: 'CANCELLED' | 'ACCEPTED' | 'AI_PROCESSING' | 'AI_RESOLVED' | 'REFUNDED' | 'AUTO_REFUNDED'
    acceptedBy?: string  // optional, không phải lúc nào cũng có
  }
  ```
- Khi doctor A accept ticket X (`POST /tickets/:id/accept`), BE emit
  `ticket.broadcast.removed` với reason `ACCEPTED` đến **tất cả socket** trong
  broadcast pool → bao gồm cả doctor A.
- Doctor A vừa accept thành công xong, nhận event này → mobile hiển thị
  toast nhầm "Yêu cầu đã được bác sĩ khác tiếp nhận" + auto-back về list.

### BE cần làm (option, pick 1)
1. **Option A (recommended)**: KHÔNG emit `ticket.broadcast.removed` về
   socket của doctor vừa accept. Có thể dùng pattern:
   ```ts
   socket.to(`doctors:pool`).except(acceptingDoctorSocketId).emit(
     'ticket.broadcast.removed', { ticketId, reason: 'ACCEPTED', acceptedBy }
   )
   ```
   Tracking socketId của acceptor: tại accept handler, lookup từ doctor's
   active sockets (`io.in(`user:${doctorId}`).fetchSockets()`) hoặc dùng
   `socket.broadcast.to(...)` từ context của accept request.

2. **Option B**: vẫn emit cho mọi người nhưng **luôn** include
   `acceptedBy: <doctorId>` trong payload (không optional). Mobile sẽ filter
   client-side. Field này phải có **mọi lần** với reason `ACCEPTED`, không
   được thiếu trong bất kỳ code path nào.

### Acceptance criteria
**Option A:**
```
1. Doctor A và Doctor B đang subscribe `doctors:pool`
2. Doctor A POST /tickets/X/accept → 200 OK
3. Doctor A socket: KHÔNG nhận `ticket.broadcast.removed`
4. Doctor B socket: nhận `ticket.broadcast.removed`
   với { ticketId: 'X', reason: 'ACCEPTED', acceptedBy: '<doctorA-id>' }
```

**Option B:**
```
1. Cùng setup
2. Doctor A nhận event với acceptedBy === doctorA.id (mobile sẽ tự skip)
3. Doctor B nhận event với acceptedBy === doctorA.id
4. Mọi reason `ACCEPTED` payload PHẢI có `acceptedBy` (verify qua unit test BE)
```

### Mobile sẽ làm sau khi BE fix
- Xoá module-level guard `markTicketSelfAccepted` + setTimeout TTL trong
  `src/hooks/useDoctorTicketRemoved.ts`.
- Xoá `onMutate` mark trong `useAcceptIncident`.
- (Option B) chỉ giữ check `payload.acceptedBy === currentUser.id`.
- (Option A) bỏ luôn check, vì event không bao giờ tới acceptor.

---

## C5 — Document event `prescription.incident.created`

### Hiện trạng
- Mobile listen event `prescription.incident.created` trong
  `src/hooks/usePrescription.ts:27` với payload assume:
  ```ts
  { created: { ticketId: string } }
  ```
- BE chưa có doc chính thức cho event này.

### BE cần làm
Document chính thức trong realtime event list (file
`farm_os_be/src/realtime/realtime.events.ts` hoặc Swagger / Postman doc):

1. **Tên event**: `prescription.incident.created`
2. **Khi nào emit**:
   - Sau khi `POST /ticket/:id/prescriptions` (doctor flow) commit thành công
   - Sau khi worker AI fallback commit prescription (C3)
3. **Audience (rooms)**: tối thiểu `ticket:<ticketId>` (owner + assignee).
   Confirm thêm có emit vào `user:<ownerId>` không (để cross-screen
   notification).
4. **Payload final** (đề xuất, mobile prefer):
   ```ts
   {
     created: {
       ticketId: string
       prescriptionId: string
       authorId: string           // doctorId UUID hoặc literal "AI"
       createdAt: string          // ISO 8601
     }
   }
   ```
   Mobile dùng `authorId` để biết là AI vs doctor → render toast khác nhau
   ("Bác sĩ vừa kê đơn" vs "AI đã tạo đơn thuốc").

### Acceptance criteria
- BE doc có entry cho `prescription.incident.created` với payload + audience.
- AI flow emit event này (gắn với C3).

### Mobile sẽ làm sau khi BE fix
- Update `MessageSocketPayload` / `PrescriptionCreatedPayload` type cho
  khớp final payload.
- Update toast trong `usePrescriptions` để phân biệt AI vs doctor.

---

## Phụ lục — Files mobile thay đổi (để BE review impact)

| File | Thay đổi liên quan BE change nào |
|------|----------------------------------|
| `app/(app)/incident/[id]/prescription.tsx` | C1, C2 — workaround đọc detail |
| `app/(app)/incident/[id]/index.tsx` | C3 — invalidate prescriptions list khi nhận `ai.resolved`; push `rxId` qua params (C2 workaround) |
| `src/hooks/useDoctorTicketRemoved.ts` | C4 — filter self-accept + module guard |
| `src/hooks/useDoctor.ts` | C4 — set guard trong `useAcceptIncident` onMutate/onSuccess |

## Phụ lục — Reference current BE shapes mobile đang assume

```ts
// /tickets/:id/full
type TicketFullRes = {
  ticket: unknown
  solution: TicketSolution | null
  prescription: PrescriptionFull | null
  addenda: unknown[]
  rating: unknown
  broadcasts: unknown[]
  abandonLogs: unknown[]
  pendingFallbackChoice: boolean
}

// /ticket/:id/prescriptions
type ListPrescriptionsRes = {
  data: Prescription[]
  meta: { page, limit, totalItems, totalPages }
}

type Prescription = {
  id: string
  ticketId: string
  authorId: string  // UUID doctor hoặc "AI"
  status: string
  generalNotes: string | null
  items: PrescriptionItemRes[]   // currently empty in list response
  createdAt: string
  // legacy summary fields:
  medicineName?: string
  dosage?: string
}

type PrescriptionItemRes = {
  id, prescriptionId, medicineId | null, customMedicineName | null,
  dosage, route | null, frequency, durationDays | null,
  usageInstructions, warnings | null, orderIndex,
  withdrawalPeriodDays | null, medicineName | null, createdAt
}
```

---

## Liên hệ / Q&A

- Mobile maintainer: Tâm (slack / email)
- Mobile repo: `farmos_mobile`, branch `MOBILE--Fix-ui-keyboard`
- Backend repo: `farm_os_be`
- Nếu BE muốn alignment trước khi implement → ping mobile team review API
  contract draft.

---

## ✅ Mobile cleanup applied (2026-06-05) sau BE done

Sau khi BE merge C1–C5, mobile đã update:

### Constants / types
- `src/types/prescription.ts`:
  - Xoá `AI_AUTHOR_ID = 'AI'` (sai — BE dùng UUID sentinel chứ không phải string).
  - Thêm `AI_AUTHOR_SENTINEL_UUID = '00000000-0000-0000-0000-000000000000'`.
  - `isAiPrescription` check theo sentinel UUID.
  - `Prescription.medicineName/dosage` đổi sang `string | null` cho khớp BE schema (BE auto-derive từ `items[0]`).

### Socket event handler (C5)
- `src/hooks/usePrescription.ts`:
  - Payload type extend đầy đủ field BE: `{ created: { ticketId, prescriptionId, authorId, source: 'DOCTOR'|'AI' }, reissued? }`.
  - Toast message khác nhau theo `source`:
    - AI → "AI đã tạo đơn thuốc gợi ý"
    - DOCTOR + reissued → "Bác sĩ đã cập nhật đơn thuốc!"
    - DOCTOR + new → "Bác sĩ vừa kê đơn thuốc mới!"
  - Cũng invalidate `ticketFull(ticketId)` vì `/full.prescription` cũng dirty khi có đơn mới.

### Removed workarounds (C1, C2, C3, C4)
- `app/(app)/incident/[id]/prescription.tsx` (C2):
  - Bỏ `usePrescriptionDetail` chained call — dùng trực tiếp `usePrescriptions(id)` list (BE giờ trả full `items[]`).
  - Tìm prescription theo `rxIdParam` từ params, fallback prescription mới nhất.
- `app/(app)/incident/[id]/index.tsx` (C3):
  - `onAiResolved` không còn invalidate `prescriptions.list(id)` — BE giờ emit `prescription.incident.created` source=AI trước `ticket.ai.resolved`, handler usePrescriptions tự invalidate.
- `src/hooks/useDoctorTicketRemoved.ts` (C4):
  - Xoá module-level `selfAcceptedTickets` Map + `markTicketSelfAccepted` + `isRecentlySelfAccepted`.
  - Giữ check `payload.acceptedBy === user.id` làm defense-in-depth cho multi-device edge.
- `src/hooks/useDoctor.ts` (C4):
  - Bỏ import `markTicketSelfAccepted` + `onMutate` mark + re-mark trong `onSuccess` của `useAcceptIncident`.

### UX improvement (BE C1 edge case note)
- `app/(app)/incident/[id]/index.tsx`:
  - Ẩn `PrescriptionSection` khi `solution.source === 'AI' && prescriptions.length === 0` (AI chỉ tư vấn không kê đơn). `AiSolutionSection` đã hiển thị đầy đủ, không cần card "Chưa có đơn thuốc" gây nhiễu.

### Files changed (final cleanup commit)
```
src/types/prescription.ts                            # AI_AUTHOR_SENTINEL_UUID
src/hooks/usePrescription.ts                         # Updated payload + toast theo source
src/hooks/useDoctorTicketRemoved.ts                  # Drop module guard
src/hooks/useDoctor.ts                               # Drop mark calls
app/(app)/incident/[id]/prescription.tsx             # Drop usePrescriptionDetail
app/(app)/incident/[id]/index.tsx                    # Drop onAiResolved invalidate + AI no-rx hide
```

### Verification mobile
- `npm run type-check`: pass (chỉ còn lỗi pre-existing SVG transformer + notification/ticketMessage không liên quan).
