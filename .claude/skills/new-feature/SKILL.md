---
name: new-feature
description: Bootstrap một feature end-to-end (types → API service → query keys → hook → screen). Trigger khi user nói "build feature X", "wire up API mới", "thêm flow Y cho doctor/farmer".
---

# Skill — new-feature

## Khi nào dùng

User yêu cầu build feature mới mà cần TẤT CẢ: type + API + hook + UI. Khi chỉ thiếu 1 phần (vd screen mới cho hook có sẵn) → dùng [new-screen](../new-screen/SKILL.md).

## Inputs cần có

Trước khi code, confirm:

1. **Backend endpoints**: path, method, body, response. Pattern thường là CRUD `/<resources>`.
2. **Domain name**: kebab-case (vd `bank-account`, `withdrawal`). Tên file dùng camelCase (`bankAccount.ts`).
3. **Screens cần**: list, detail, form, etc.
4. **Role**: doctor / farmer / cả hai.
5. **Realtime**: có event nào không?

Nếu thiếu → pick default theo BE convention + note assumption.

## Phase order (outside-in, mỗi bước phụ thuộc bước trước)

### 1. Types — `src/types/<feature>.ts`

```ts
import type { PaginatedResponse } from "./api";

export type <Feature>Status = "pending" | "active" | "closed";

export interface <Feature> {
    id: string;
    name: string;
    status: <Feature>Status;
    createdAt: string;
}

export interface Create<Feature>Body {
    name: string;
}

export interface Update<Feature>Body {
    name?: string;
}

export interface <Feature>Filter {
    status?: <Feature>Status;
    search?: string;
}

export type List<Feature>sRes = PaginatedResponse<<Feature>>;
```

### 2. API service — `src/services/api/<feature>.ts`

```ts
import { apiClient } from "./client";
import type {
    <Feature>,
    Create<Feature>Body,
    Update<Feature>Body,
    <Feature>Filter,
    List<Feature>sRes,
} from "@/types/<feature>";

export const <feature>Api = {
    list: (page = 1, limit = 20, filter: <Feature>Filter = {}) => {
        const q = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (filter.status) q.set("status", filter.status);
        if (filter.search) q.set("search", filter.search);
        return apiClient
            .get<{ data: List<Feature>sRes }>(`/<resources>?${q.toString()}`)
            .then((r) => r.data.data);
    },

    detail: (id: string) =>
        apiClient
            .get<{ data: <Feature> }>(`/<resources>/${id}`)
            .then((r) => r.data.data),

    create: (body: Create<Feature>Body) =>
        apiClient
            .post<{ data: <Feature> }>(`/<resources>`, body)
            .then((r) => r.data.data),

    update: (id: string, body: Update<Feature>Body) =>
        apiClient
            .patch<{ data: <Feature> }>(`/<resources>/${id}`, body)
            .then((r) => r.data.data),

    remove: (id: string) =>
        apiClient
            .delete<{ data: <Feature> }>(`/<resources>/${id}`)
            .then((r) => r.data.data),
};
```

### 3. Query keys — extend `src/constants/queryKeys.ts`

```ts
export const queryKeys = {
    // ... existing
    <feature>: {
        list: (page?: number, filter?: <Feature>Filter) =>
            ["<feature>", "list", page, filter ?? {}] as const,
        detail: (id: string) => ["<feature>", id] as const,
    },
};
```

### 4. Hook — `src/hooks/use<Feature>.ts`

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { <feature>Api } from "@/services/api/<feature>";
import { queryKeys } from "@/constants/queryKeys";
import type { Create<Feature>Body, Update<Feature>Body, <Feature>Filter } from "@/types/<feature>";

export function use<Feature>List(page = 1, filter: <Feature>Filter = {}) {
    return useQuery({
        queryKey: queryKeys.<feature>.list(page, filter),
        queryFn: () => <feature>Api.list(page, 20, filter),
    });
}

export function use<Feature>Detail(id: string) {
    return useQuery({
        queryKey: queryKeys.<feature>.detail(id),
        queryFn: () => <feature>Api.detail(id),
        enabled: !!id,
    });
}

export function useCreate<Feature>() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: Create<Feature>Body) => <feature>Api.create(body),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["<feature>", "list"] }),
    });
}

export function useUpdate<Feature>() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, body }: { id: string; body: Update<Feature>Body }) =>
            <feature>Api.update(id, body),
        onSuccess: (_data, { id }) => {
            qc.invalidateQueries({ queryKey: ["<feature>", "list"] });
            qc.invalidateQueries({ queryKey: queryKeys.<feature>.detail(id) });
        },
    });
}

export function useDelete<Feature>() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => <feature>Api.remove(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["<feature>", "list"] }),
    });
}
```

### 5. Screens — dùng [new-screen](../new-screen/SKILL.md)

Thường cần:
- List: `app/(app)/<resource>/index.tsx` (hoặc tab nếu primary nav).
- Detail: `app/(app)/<resource>/[id].tsx`.
- Form create: `app/(app)/<resource>/new.tsx` (form-sheet).
- Form edit: `app/(app)/<resource>/[id]/edit.tsx` (form-sheet) — hoặc edit inline ở detail.

Form: dùng [new-form-screen](../new-form-screen/SKILL.md).

### 6. Wire layouts

- Nếu list ở tab: thêm `<Tabs.Screen>` trong `app/(app)/(tabs)/_layout.tsx`.
- Nếu form-sheet: thêm `<Stack.Screen>` với `formSheetOptions` trong `app/(app)/_layout.tsx`.

## Checklist final

- [ ] Types ở `src/types/<feature>.ts`.
- [ ] API service `<feature>Api` đầy đủ method cần.
- [ ] Query keys factory ở `src/constants/queryKeys.ts`.
- [ ] Hook `use<Feature>List`, `use<Feature>Detail`, mutation hooks.
- [ ] Mutation onSuccess invalidate broad + specific.
- [ ] Screen(s) tạo + register layout (nếu cần).
- [ ] Toast feedback success / error.
- [ ] Role gating (nếu role-specific).
- [ ] `npm run type-check` pass.
- [ ] Manual smoke: list → detail → create → update → delete.

## Anti-patterns

- ❌ Bỏ qua type definition, viết inline `apiClient.get<any>`.
- ❌ Gõ tay query key array trong hook thay vì factory.
- ❌ Mutation không invalidate.
- ❌ Component fetch trực tiếp qua apiClient.
- ❌ Tạo Zustand store để cache server data của feature.
