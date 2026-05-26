# ✅ Rule 10 — Testing & Verification

> Đọc trước khi báo "done". TS compile không = feature đúng.

## 1. Verification ladder

Theo thứ tự nghiêm ngặt — bước trước fail thì không cần làm bước sau:

1. **Type check**: `npm run type-check` (`tsc --noEmit`) — bắt mọi lỗi TS strict.
2. **Lint**: `npm run lint` (`expo lint`).
3. **Manual smoke** trên simulator / Expo Go:
   - Cold start → screen load không crash.
   - Action chính (submit form, mở detail, gửi message) → success path.
   - Error path (network off, 422 từ BE) → toast hiển thị đúng.
   - Edge: empty list, loading skeleton, role gating.
4. **Test trên device thật** (khi đụng camera, haptic, push notification, deep link).

Đừng skip step 1-2 dưới mọi hoàn cảnh.

## 2. Type check

```bash
npm run type-check
```

Pass = no TS error. Lỗi thường gặp:
- `Cannot find module '@/...'` → check path alias trong `tsconfig.json`.
- `Property 'data' does not exist on type 'never'` → query type generic thiếu.
- `Type 'string | undefined' is not assignable to type 'string'` → quên `enabled: !!param` hoặc unwrap optional.

## 3. Lint

```bash
npm run lint
```

`expo lint` chạy ESLint config từ `expo` preset. Auto-fix nhiều case. Còn lại:
- `react-hooks/exhaustive-deps` → thêm dep hoặc giải thích bằng `// eslint-disable-next-line` + lý do.
- `no-unused-vars` → xóa hoặc `_` prefix.
- `@typescript-eslint/no-explicit-any` → tránh `any`.

## 4. Manual smoke checklist

Khi đụng feature có UI (gần 100% case):

- [ ] Screen mở không crash (check console không có RedBox).
- [ ] Loading state hiển thị (skeleton / spinner / "Đang tải...").
- [ ] Empty state hiển thị (`<EmptyState>` hoặc fallback text).
- [ ] Error state hiển thị (toast hoặc inline message).
- [ ] Action mutation → toast success + list refresh / navigate đúng.
- [ ] Pull-to-refresh (nếu có) → refetch.
- [ ] Form (nếu có):
  - Validation Zod hiện inline đúng field.
  - Submit thành công → toast + dismiss/navigate.
  - Server validation 422 → map về field qua `setError` hoặc fallback toast.
  - Network off khi submit → toast offline, không crash.
- [ ] Realtime (nếu có):
  - Event tới khi screen mở → list / detail update không reload.
  - Off screen → handler cleanup (verify bằng cách trigger event lần 2, không thấy log).
- [ ] Role gating:
  - Login farmer → không thấy tab/screen chỉ doctor.
  - Login doctor → không thấy tab/screen chỉ farmer.

## 5. Build verification

`expo start` reload thường đủ. Khi đụng native config (`app.config.js`, native module):
- Confirm với user trước.
- `expo prebuild --clean` chỉ khi user explicit.

## 6. Test files (khi user yêu cầu thêm)

```
src/hooks/__tests__/useXxx.test.ts
src/utils/__tests__/xxx.test.ts
```

Jest preset: `jest-expo`. Pattern (chưa nhiều test trong repo):
```ts
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

describe("useIncidentList", () => {
    it("returns data", async () => {
        // mock incidentApi
        const { result } = renderHook(() => useIncidentList(), { wrapper });
        // ... assertions
    });
});
```

Khi codebase tăng → add test trước khi merge feature critical (auth, payment, prescription submit).

## 7. Báo cáo done

Format trả user:

```
✅ <Feature> done

Files mới:
- src/types/<feature>.ts
- src/services/api/<feature>.ts
- src/hooks/use<Feature>.ts
- src/components/features/<feature>/...
- app/(app)/<resource>/...tsx

Wiring:
- src/constants/queryKeys.ts: thêm namespace <feature>
- app/(app)/_layout.tsx: thêm Stack.Screen (nếu form-sheet)
- app/(app)/(tabs)/_layout.tsx: thêm Tabs.Screen (nếu tab)

Verify:
- type-check: pass
- lint: pass
- (manual) tested loading + action + error path qua iOS simulator

Note / assumption (nếu có):
- ...

Next steps (nếu user cần):
- Test trên device thật cho [camera / haptic / push]
- Wire BE endpoint X khi backend ready
```

## 8. Anti-patterns

- ❌ Báo done mà chưa chạy `npm run type-check`.
- ❌ "Lint pass" mà không chạy thật.
- ❌ "Đã test" mà không mở simulator.
- ❌ Add file mà quên register vào `_layout.tsx` (tab / stack screen ghost).
- ❌ Quên check role gating khi feature là role-specific.
- ❌ Skip socket cleanup verification — leak silent.
- ❌ "Trên simulator chạy ok" rồi merge mà chưa test device thật khi feature đụng native (camera, haptic, deep link, push).
