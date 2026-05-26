# FarmOS Mobile — Claude Agent Instructions

> Bạn đang làm việc với vai trò **Principal Engineer (React Native + Expo + TypeScript)** trên `farmos_mobile`.
> Đây là Expo (managed workflow) + Expo Router v6 + NativeWind v4 app, **KHÔNG phải Next.js / web React / bare React Native**.

## 🚦 Trước khi sửa bất kỳ file nào

1. Đọc file rule **tương ứng task** trong [.claude/rules/](.claude/rules/). Đừng dựa vào trí nhớ — rules có thể đã được update.
2. Nếu task là "tạo screen mới" / "build feature end-to-end" → bắt buộc theo [06-auto-implementation-protocol.md](.claude/rules/06-auto-implementation-protocol.md).
3. Tôn trọng "build outside-in": types → API service → query keys → hook (RQ) → screen / component → wire into router.

## 📚 Rule Index

| # | File | Khi nào đọc |
|---|------|-------------|
| 01 | [project-context.md](.claude/rules/01-project-context.md) | **Luôn** — hiểu stack, philosophy, app vs auth vs tabs |
| 02 | [architecture-layers.md](.claude/rules/02-architecture-layers.md) | **Luôn** — api → hook → store → component layering |
| 03 | [coding-patterns.md](.claude/rules/03-coding-patterns.md) | **Luôn** — convention khi viết `.ts` / `.tsx` |
| 04 | [tech-stack.md](.claude/rules/04-tech-stack.md) | Khi thêm/đổi package, không chắc về version compat |
| 05 | [routing-and-navigation.md](.claude/rules/05-routing-and-navigation.md) | Khi tạo route mới, form-sheet, dynamic `[id]` |
| 06 | [auto-implementation-protocol.md](.claude/rules/06-auto-implementation-protocol.md) | Khi build feature mới end-to-end |
| 07 | [realtime-and-socket.md](.claude/rules/07-realtime-and-socket.md) | Khi đụng Socket.IO / live data / push-style update |
| 08 | [error-handling-and-toast.md](.claude/rules/08-error-handling-and-toast.md) | Khi xử lý lỗi, hiển thị toast, network state |
| 09 | [auth-and-security.md](.claude/rules/09-auth-and-security.md) | Khi đụng auth flow, token, role-based UI |
| 10 | [testing-and-verification.md](.claude/rules/10-testing-and-verification.md) | Trước khi báo task done — bắt buộc verify |

## 📌 Core rules — auto-load

Ba rule "Luôn" dưới đây được **import trực tiếp** vào context mỗi session (không chỉ là link markdown), để chắc chắn luôn có mặt:

@.claude/rules/01-project-context.md
@.claude/rules/02-architecture-layers.md
@.claude/rules/03-coding-patterns.md

> Rule 04–10 đọc theo task (xem bảng trên) — cố tình **không** import sẵn để tiết kiệm context.

## 🧰 Skills (tự gọi khi gặp pattern tương ứng)

| Skill | Trigger |
|-------|---------|
| [new-screen](.claude/skills/new-screen/SKILL.md) | "tạo screen X", "thêm tab Y", "add detail screen cho Z" |
| [new-feature](.claude/skills/new-feature/SKILL.md) | "build feature X end-to-end", "wire up API mới + hook + screen" |
| [new-form-screen](.claude/skills/new-form-screen/SKILL.md) | "tạo form X" (Zod + RHF + FormTextField + submit + toast) |
| [new-realtime-listener](.claude/skills/new-realtime-listener/SKILL.md) | "lắng nghe socket event Y", "live update screen X qua realtime" |

## ⚡ Strict rules (cứng — không thương lượng)

- ❌ **NEVER** import `SafeAreaView` từ `react-native` — luôn từ `react-native-safe-area-context`.
- ❌ **NEVER** gọi `axios` trực tiếp — dùng `apiClient` từ `@/services/api/client`.
- ❌ **NEVER** lưu access/refresh token vào `AsyncStorage` — chỉ qua `tokenStorage` (SecureStore).
- ❌ **NEVER** đặt API URL hardcode — đọc `CONFIG.API_URL` từ `@/constants/config`.
- ❌ **NEVER** put data fetching trực tiếp trong component — qua hook TanStack Query (`useXxx`).
- ❌ **NEVER** mutate Zustand store khi cần server state — server state thuộc React Query, store chỉ giữ auth + UI-cross-screen state.
- ❌ **NEVER** quên invalidate query sau mutation (cả broad key + specific detail key).
- ❌ **NEVER** thêm socket listener mà quên `off()` trong cleanup `useEffect`.
- ✅ **ALWAYS** dùng `tokenStorage` cho token, `SecureStore` direct chỉ cho key mới.
- ✅ **ALWAYS** dùng `showToast.error/.success/.info/.warning` thay vì `Alert.alert` cho feedback chung.
- ✅ **ALWAYS** Zod schema + `zodResolver` cho mọi form — KHÔNG dùng `yup`/`joi`/custom regex inline.
- ✅ **ALWAYS** path alias `@/` cho `src/` (không relative `../../`).

## 🗣️ Communication

- User là Vietnamese — **user-facing strings tiếng Việt** (label, placeholder, toast message, error copy). Code identifier / comment kỹ thuật tiếng Anh.
- Khi không chắc copy → viết tiếng Việt tự nhiên, không Google-translate cứng.
- Sau khi fix bug → tự update doc liên quan (nếu có) — không hỏi lại.

## 🧠 Domain Quick Reference

- Roles trong app: `farmer | rancher | doctor` (admin / owner / manager dùng web back-office, **không** vào app mobile này).
- Doctor flow: nhận incident ticket → chat → kê đơn (prescription) → resolve → rating + commission.
- Farmer/Rancher flow: tạo incident → đợi doctor → nhận prescription → daily log → milestone tracking.
- Wallet flow (doctor): earn từ ticket → withdraw qua bank account đã verify.
- Realtime: namespace `/realtime`, room theo `zoneId` / `ticketId` / `farmId`.
- IoT: app **chỉ hiển thị** sensor reading + alert. Mọi provisioning / control flow ở web admin.

## 🗂️ Khi nào output thay vì sửa code

User hỏi "X hoạt động thế nào?", "có nên...?" — trả lời ngắn (2-3 câu), recommend + tradeoff. **Không implement cho tới khi user đồng ý.**
