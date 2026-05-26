# 🤖 Rule 06 — Auto-Implementation Protocol

> **Master checklist** khi user yêu cầu "build feature X end-to-end", "wire up screen Y với API mới", hay "tạo flow Z".

## Phase 1 — Parse requirement

Trước khi code, rút ra:

1. **Endpoint(s)** — Backend đã có chưa? Path, method, body, response shape? (Hỏi backend doc hoặc Swagger nếu user chưa cung cấp.)
2. **UI screens** — Cần bao nhiêu screen? Là tab / stack / form-sheet? Có dynamic param không?
3. **Forms** — Field nào? Validation gì? Server validation hay client?
4. **Realtime** — Có cần socket subscribe? Event name?
5. **Role gating** — Screen này doctor / farmer / cả hai? Tab role-specific?
6. **Side effects** — Upload ảnh (Cloudinary)? Toast feedback? Navigate sau submit?
7. **List vs detail** — Cần pagination? Polling khi state "open"?
8. **State** — Cần Zustand store mới? Hay React Query đủ?

Nếu thiếu thông tin: **pick default an toàn rồi note assumption** (auto mode). Default:
- Endpoint pattern khớp BE convention (vd `GET /<resources>?page=1&limit=20`).
- Form: Zod schema strict, error tiếng Việt.
- Navigate sau submit: `router.back()` hoặc `router.replace` về detail.
- Toast success + error.

## Phase 2 — Generate code (outside-in)

Xây theo thứ tự — KHÔNG đảo (mỗi bước phụ thuộc bước trước):

```
1. src/types/<feature>.ts                # Type definition
2. src/services/api/<feature>.ts         # API service (axios call)
3. src/constants/queryKeys.ts            # Thêm namespace cho feature
4. src/hooks/use<Feature>.ts             # React Query hooks
5. src/components/features/<feature>/    # Domain component (nếu cần tách)
6. app/(app)/<resource>/...tsx           # Screen(s)
7. app/(app)/_layout.tsx                 # Register Stack.Screen (nếu form-sheet hay header config)
8. app/(app)/(tabs)/_layout.tsx          # Register Tabs.Screen (nếu là tab)
```

Đối chiếu lại requirement sau mỗi bước.

## Phase 3 — Mapping

### Backend endpoint → frontend service

| BE | FE (`src/services/api/<feature>.ts`) |
|----|--------------------------------------|
| `GET /<resources>?page=&limit=` | `<feature>Api.list(page, limit, filter)` |
| `GET /<resources>/:id` | `<feature>Api.detail(id)` |
| `POST /<resources>` | `<feature>Api.create(body)` |
| `PATCH /<resources>/:id` | `<feature>Api.update(id, body)` hoặc action method (vd `cancel`, `resolve`) |
| `DELETE /<resources>/:id` | `<feature>Api.delete(id)` |

Mọi method: `apiClient.<verb><{ data: T }>(...).then(r => r.data.data)`.

### Type → `src/types/<feature>.ts`

```ts
import type { PaginatedResponse } from "./api";

export type FooStatus = "pending" | "active" | "closed";

export interface Foo {
    id: string;
    name: string;
    status: FooStatus;
    createdAt: string;
}

export interface CreateFooBody {
    name: string;
}

export type ListFoosRes = PaginatedResponse<Foo>;
```

### Query keys

```ts
// src/constants/queryKeys.ts (extend)
export const queryKeys = {
    // ... existing
    foo: {
        list: (page?: number, filter?: FooFilter) => ["foo", "list", page, filter ?? {}] as const,
        detail: (id: string) => ["foo", id] as const,
    },
};
```

### Hook → `src/hooks/useFoo.ts`

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fooApi } from "@/services/api/foo";
import { queryKeys } from "@/constants/queryKeys";
import type { CreateFooBody } from "@/types/foo";

export function useFooList(page = 1) {
    return useQuery({
        queryKey: queryKeys.foo.list(page),
        queryFn: () => fooApi.list(page),
    });
}

export function useFooDetail(id: string) {
    return useQuery({
        queryKey: queryKeys.foo.detail(id),
        queryFn: () => fooApi.detail(id),
        enabled: !!id,
    });
}

export function useCreateFoo() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateFooBody) => fooApi.create(body),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["foo", "list"] }),
    });
}
```

### Screen → `app/(app)/foo/[id].tsx`

```tsx
import { useLocalSearchParams, router } from "expo-router";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, EmptyState, PrimaryButton } from "@/components/ui";
import { useFooDetail } from "@/hooks/useFoo";
import { useToast } from "@/hooks/useToast";

export default function FooDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { data, isLoading, error } = useFooDetail(id);
    const { showToast } = useToast();

    if (isLoading) return <Text className="p-4">Đang tải...</Text>;
    if (error || !data) return <EmptyState title="Không tìm thấy" />;

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView contentContainerClassName="px-4 pt-4">
                <Text className="text-xl font-semibold">{data.name}</Text>
                <PrimaryButton title="Quay lại" onPress={() => router.back()} className="mt-4" />
            </ScrollView>
        </SafeAreaView>
    );
}
```

### Form screen → xem [skills/new-form-screen](../skills/new-form-screen/SKILL.md).

### Realtime → xem [07-realtime-and-socket.md](07-realtime-and-socket.md) + [skills/new-realtime-listener](../skills/new-realtime-listener/SKILL.md).

## Phase 4 — Wire & verify

1. Import + render screen (check Expo Router auto-discover).
2. Đăng ký `Stack.Screen` / `Tabs.Screen` nếu cần (form-sheet options, tab icon, role gating).
3. Test path alias `@/` import resolve (`npm run type-check`).
4. Chạy `npm run type-check` — phải pass.
5. Chạy `npm run lint` — auto-fix; còn warning thì xem có liên quan code mình viết không.
6. Manual smoke trong Expo Go / simulator:
   - Mở screen → load không crash, không trắng.
   - Action mutation → toast + invalidate (xem list refresh).
   - Error path → toast error, không crash.

## Phase 5 — Document & report

Sau khi xong, trả user:

```
✅ <Feature> done

Files mới:
- src/types/<feature>.ts
- src/services/api/<feature>.ts
- src/hooks/use<Feature>.ts
- src/components/features/<feature>/...
- app/(app)/<resource>/...tsx

Update:
- src/constants/queryKeys.ts: thêm namespace <feature>
- app/(app)/_layout.tsx: register Stack.Screen (nếu cần)
- app/(app)/(tabs)/_layout.tsx: register Tabs.Screen (nếu là tab)

Verify:
- type-check: pass
- lint: pass
- (manual) tested loading + action + error qua simulator

Note / assumption:
- ...

Next steps (nếu user cần):
- Test trên device thật (camera / haptic)
- Wire backend endpoint X nếu chưa sẵn sàng
```

## ⚠️ Strict checklist final

Trước khi báo "done":

- [ ] Type defined đầy đủ ở `src/types/<feature>.ts`.
- [ ] API service object có `<feature>Api` đúng convention.
- [ ] Query key trong `queryKeys` factory, không hardcode array rải rác.
- [ ] Hook có invalidate broad + specific sau mutation.
- [ ] Screen `export default function`, `SafeAreaView` từ `react-native-safe-area-context`.
- [ ] Loading + error + empty state hiển thị rõ.
- [ ] Form (nếu có): Zod schema + `zodResolver` + `FormTextField`/`FormSelectField`.
- [ ] Toast feedback cho success + error.
- [ ] Role gating (nếu cần): qua `useAuth()` + `roleName`.
- [ ] Socket cleanup `off()` trong useEffect (nếu có realtime).
- [ ] `npm run type-check` pass.
- [ ] Không hardcode color hex / API URL / token.

Nếu bất kỳ ô nào fail → fix trước khi báo done.
