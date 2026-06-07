# Backend Handoff — Ticket / AI / Doctor Accept Issues

> Tổng hợp các vấn đề mobile phát hiện trong flow ticket cần backend xem xét và
> hỗ trợ. Mobile đã apply workaround tạm thời ở phía client, nhưng cần BE fix
> dứt điểm để đảm bảo data consistency và không phụ thuộc race-condition guard.
>
> Ngày tổng hợp: 2026-06-04
> Branch mobile: `MOBILE--Fix-ui-keyboard`

---

## Issue A — `GET /tickets/:id/full` không chứa AI prescription

### Mô tả
- Endpoint: `GET /tickets/:id/full`
- Response shape (`TicketFullRes`): có field `prescription: PrescriptionFull | null`.
- Hiện tượng: khi ticket được giải quyết bởi **AI fallback** (Gemini), field
  `prescription` trong response thường trả về `null` mặc dù `GET
  /ticket/:id/prescriptions` có data (đơn thuốc do AI sinh ra với `authorId =
  "AI"`).

### Tác động lên mobile
- Trước fix: màn `prescription` form-sheet (`/(app)/incident/[id]/prescription`)
  đọc từ `/full.prescription` → render rỗng cho ticket AI-resolved.
- Workaround đã apply (mobile): điều hướng từ PrescriptionSection card kèm
  `rxId` (prescription id) → form-sheet gọi
  `GET /ticket/:id/prescriptions/:rxId` để lấy detail. Trường hợp deep link
  không kèm rxId → fallback list → lấy prescription mới nhất → gọi detail.

> Phụ chú quan trọng: `GET /ticket/:id/prescriptions` (list) trả về summary
> chỉ có `medicineName`, `dosage` legacy top-level, **không kèm `items[]` đầy
> đủ**. Mobile đã tránh dựa vào items từ list. Nếu BE muốn giảm số call thì có
> thể populate `items[]` ở list response — nhưng không bắt buộc.

### Yêu cầu BE
Decide một trong hai hướng (consistent across endpoints):
1. **Option A (recommended)**: `/tickets/:id/full` phải populate `prescription`
   field cho cả AI fallback case (đọc từ Prescription table với `authorId =
   "AI"` cho ticket đó).
2. **Option B**: document rõ rằng `/full.prescription` chỉ chứa
   doctor-authored prescription, mobile phải tự fetch list cho AI case. Nếu
   chọn Option B, cập nhật API doc + Swagger schema để mobile/web biết.

### Suggested test
```sh
# Ticket được resolve bởi AI fallback
GET /tickets/<aiResolvedTicketId>/full
# Expect: response.data.prescription !== null AND prescription.authorId === "AI"
```

---

## Issue B — AI fallback flow: prescription tạo trễ hoặc không emit event

### Mô tả
- Flow: doctor abandon ticket → owner chọn `FALLBACK_AI` → backend worker chạy
  Gemini → emit `ticket.ai.resolved`.
- Hiện tượng (một số ticket, không reproduce 100%): khi mobile nhận event
  `ticket.ai.resolved`, fetch lại `/tickets/:id/full` thấy `solution` (giải
  pháp AI) đã có nhưng `prescription` chưa có. User phải back ra list và vào
  lại detail → mới thấy prescription.

### Phân tích
Hai khả năng:
1. **Race condition trong worker**: AI worker commit `solution` trước khi
   commit `prescription` (hai bước riêng), event `ticket.ai.resolved` emit
   ngay sau commit solution → mobile fetch trong window này thấy prescription
   chưa có.
2. **Missing event**: BE chỉ emit `prescription.incident.created` cho doctor
   flow (`POST /ticket/:id/prescriptions`), KHÔNG emit cho AI flow → mobile
   không có signal để refresh prescriptions list khi AI tạo đơn.

### Workaround đã apply (mobile)
- Khi nhận `ticket.ai.resolved` → cũng `invalidateQueries` cho
  `queryKeys.prescriptions.list(ticketId)` (trước đây chỉ invalidate detail/full).
- Vẫn không cover 100% nếu BE commit prescription sau khi emit event.

### Yêu cầu BE
1. Đảm bảo worker AI fallback **commit cả solution + prescription trong cùng
   transaction** (hoặc commit prescription trước rồi mới emit `ticket.ai.resolved`).
2. Hoặc emit thêm event `prescription.incident.created` (giống doctor flow)
   khi AI tạo prescription — payload dạng `{ created: { ticketId, prescriptionId, authorId: "AI" } }`.

### Suggested test
- Tạo ticket → broadcast → doctor không respond → owner chọn FALLBACK_AI →
  worker chạy.
- Verify: tại thời điểm `ticket.ai.resolved` emit, query trực tiếp DB:
  prescription row đã tồn tại với `authorId = "AI"`.

---

## Issue C — `ticket.broadcast.removed` với reason `ACCEPTED` không có/không nhất quán field `acceptedBy`

### Mô tả
- Event: `ticket.broadcast.removed`
- Payload (theo TS interface mobile đang giả định):
  ```ts
  { ticketId: string; reason: 'CANCELLED' | 'ACCEPTED' | 'AI_PROCESSING' | 'AI_RESOLVED' | 'REFUNDED' | 'AUTO_REFUNDED'; acceptedBy?: string }
  ```
- Hiện tượng: khi doctor A bấm Accept ticket X, BE emit `ticket.broadcast.removed`
  với reason `ACCEPTED` đến **all subscribers** của broadcast pool (bao gồm
  cả doctor A vừa accept). Mobile của doctor A nhận event này → render toast
  "Yêu cầu đã được bác sĩ khác tiếp nhận" + auto-back, mặc dù chính họ là
  người vừa accept thành công.

### Workaround đã apply (mobile)
1. Filter: nếu `payload.acceptedBy === currentUser.id` → skip toast/back.
2. Backup guard: module-level `Set<ticketId>` được set bởi `useAcceptIncident`
   trong `onMutate` (TTL 8s). Nếu event đến cho ticket đã trong set → skip.

### Yêu cầu BE
Một trong hai hướng:
1. **Option A (recommended)**: KHÔNG emit `ticket.broadcast.removed` về chính
   socket của doctor vừa accept. Có thể dùng `socket.to(room).except(acceptingDoctorSocketId).emit(...)`
   hoặc subscribe pattern phù hợp.
2. **Option B**: luôn kèm `acceptedBy: userId` trong payload khi `reason ===
   'ACCEPTED'`. Mobile sẽ filter ở client. Field này phải có **mọi lần**, không
   được optional / thiếu trong một số code path.

### Suggested test
```sh
# Doctor A accept ticket X
# Verify: socket của doctor A không nhận `ticket.broadcast.removed` cho ticket X
#         (hoặc nếu có, payload.acceptedBy === doctorA.id)
# Verify: doctor B (cũng đang xem broadcast detail của ticket X) nhận event,
#         toast hiện đúng và back ra list.
```

---

## Issue D — `prescription.incident.created` event scope (đang ngầm chứ chưa rõ)

### Mô tả (cần BE confirm)
- Event: `prescription.incident.created`
- Payload mobile đang assume: `{ created: { ticketId: string } }` (xem
  `src/hooks/usePrescription.ts:22-29`).
- Mobile dùng event này để invalidate prescriptions list khi doctor kê đơn
  realtime (farmer đang xem detail thì thấy đơn mới ngay).

### Câu hỏi
1. BE có emit event này không? Trigger từ đâu (POST /prescriptions handler)?
2. Audience là ai? Room nào? (farmer ticket creator? doctor assignee? cả hai?
   chỉ `ticket:<ticketId>` room?)
3. AI flow có emit event này không? (xem Issue B).
4. Payload chính xác có giống mobile đang assume không? Có thêm field
   `authorId`, `prescriptionId` để mobile biết là AI vs doctor không?

### Yêu cầu BE
- Document event này trong API doc / realtime events doc.
- Confirm payload shape final.
- Nếu chưa emit cho AI flow → bổ sung (xem Issue B).

---

## Summary

| # | Issue | Severity | Mobile workaround | BE action |
|---|-------|----------|-------------------|-----------|
| A | `/full.prescription` null cho AI ticket | High | Đọc từ list endpoint | Populate prescription cho AI case OR document |
| B | AI prescription tạo trễ / không có event | Medium | Invalidate list khi `ai.resolved` | Atomic commit + emit event |
| C | `broadcast.removed` echo về chính người accept | Medium | Filter `acceptedBy` + module-level guard | Skip emit về acceptor OR luôn kèm `acceptedBy` |
| D | `prescription.incident.created` payload/scope chưa rõ | Low | Hiện đang work theo assumption | Document |

---

## Contact
- Mobile branch: `MOBILE--Fix-ui-keyboard`
- Files thay đổi:
  - `app/(app)/incident/[id]/prescription.tsx`
  - `app/(app)/incident/[id]/index.tsx`
  - `src/hooks/useDoctorTicketRemoved.ts`
  - `src/hooks/useDoctor.ts`
  - `src/constants/incident.ts`
