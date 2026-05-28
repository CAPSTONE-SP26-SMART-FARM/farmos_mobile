# 🏗️ Rule 02 — Architecture Layers

> Áp dụng cho mọi file trong `app/**` và `src/**`. Đọc trước khi tạo / refactor feature.

## 1. Layer cake

```
┌──────────────────────────────────────────────────────────┐
│  Screen (app/.../*.tsx)                                  │
│  - export default function XxxScreen()                   │
│  - Compose hooks + UI components                         │
│  - Đọc params từ useLocalSearchParams / useGlobalSearch  │
│  - Gọi router.push / router.back để navigate            │
└─────────────────────────────┬────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────┐
│  Hook (src/hooks/useXxx.ts)                              │
│  - Wrap useQuery / useMutation / socket subscription     │
│  - 1 file = 1 domain (useIncident chứa list/detail/...)  │
│  - Invalidate queries trong onSuccess                    │
└─────────────────────────────┬────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────┐
│  Service (src/services/api/<feature>.ts)                 │
│  - const <feature>Api = { list, detail, create, ... }    │
│  - Gọi apiClient.get/.post/.patch/.delete                │
│  - .then(r => r.data.data) unwrap                        │
│  - Return typed Promise<T>                               │
└─────────────────────────────┬────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────┐
│  apiClient (src/services/api/client.ts)                  │
│  - Single axios instance                                 │
│  - Request interceptor: attach Bearer                    │
│  - Response interceptor: refresh on 401 + retry queue    │
└──────────────────────────────────────────────────────────┘
```

Side branches:
- **Zustand store** (`src/stores/`) chỉ giữ client-side state (auth user, active ticket id). KHÔNG dùng để cache server data.
- **Socket service** (`src/services/socket/`) inject vào hook để subscribe room + listen event → update React Query cache qua `setQueryData`.
- **tokenStorage** (`src/services/storage/`) chỉ gọi từ `apiClient` + `authStore` + `socketService`. Component KHÔNG đọc token trực tiếp.

## 2. Screen (`app/**/*.tsx`)

**Chỉ làm**: routing param, layout, compose hooks, render component.

```tsx
// app/(app)/incident/[id]/index.tsx
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native";
import { useIncidentDetail } from "@/hooks/useIncident";
import { Text, EmptyState } from "@/components/ui";
import { IncidentInfoList } from "@/components/features/incident/IncidentInfoList";

export default function IncidentDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { data: incident, isLoading, error } = useIncidentDetail(id);

    if (isLoading) return <Text>Đang tải...</Text>;
    if (error || !incident) return <EmptyState title="Không tìm thấy yêu cầu" />;

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView contentContainerClassName="px-4 pt-4">
                <IncidentInfoList incident={incident} />
            </ScrollView>
        </SafeAreaView>
    );
}
```

**Bắt buộc**:
- `export default function <Name>Screen()` (Expo Router auto-discover).
- `SafeAreaView` từ `react-native-safe-area-context`.
- NativeWind `className` cho layout (không inline `style={{ flex: 1 }}` trừ khi cần animated).
- Compose qua hooks — KHÔNG `useQuery` inline trong screen (đặt vào `src/hooks/`).
- Loading / empty / error state cụ thể (không trắng tinh).

**Cấm**:
- Gọi `apiClient.*` trực tiếp.
- `useState` chứa data fetch được từ server (dùng React Query).
- Hardcode role check — qua `useAuth()` và branch theo `user.roleName`.

## 3. Hook (`src/hooks/useXxx.ts`)

**Trách nhiệm**: 1 file = 1 domain. Group queries + mutations + socket subscription liên quan.

```ts
// src/hooks/useIncident.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { incidentApi } from "@/services/api/incident";
import { queryKeys } from "@/constants/queryKeys";
import type { CreateIncidentBody, ListTicketsFilter } from "@/types/incident";

export function useIncidentList(page = 1, filter: ListTicketsFilter = {}) {
    return useQuery({
        queryKey: queryKeys.incident.list(page, filter),
        queryFn: () => incidentApi.list(page, 20, filter),
    });
}

export function useIncidentDetail(ticketId: string) {
    return useQuery({
        queryKey: queryKeys.incident.detail(ticketId),
        queryFn: () => incidentApi.detail(ticketId),
        enabled: !!ticketId,
    });
}

export function useCreateIncident() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateIncidentBody) => incidentApi.create(body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["incident", "list"] }); // broad
        },
    });
}

export function useCancelIncident() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ ticketId, reason }: { ticketId: string; reason?: string }) =>
            incidentApi.cancel(ticketId, reason),
        onSuccess: (_data, { ticketId }) => {
            qc.invalidateQueries({ queryKey: ["incident", "list"] });
            qc.invalidateQueries({ queryKey: queryKeys.incident.detail(ticketId) });
        },
    });
}
```

**Bắt buộc**:
- Query key TỪ `queryKeys` factory — KHÔNG gõ tay `["incident", id]` rải rác.
- Mutation `onSuccess` invalidate **cả broad** (`["incident", "list"]`) **lẫn specific** (`queryKeys.incident.detail(id)`).
- `enabled: !!param` cho query phụ thuộc param có thể empty.
- Conditional polling qua `refetchInterval: (q) => q.state.data?.status === "open" ? 5000 : false` khi cần live (xem `useIncidentDetail`).
- Realtime hook: subscribe trong `useEffect`, cleanup `socketService.off` khi unmount (xem [07-realtime-and-socket.md](07-realtime-and-socket.md)).

**Cấm**:
- Throw exception trong hook để screen catch. Trả `error` qua React Query `error` field, screen quyết định hiển thị.
- `Alert.alert` từ hook (UI concern — đẩy về screen + `showToast`).
- Đọc Zustand store của domain khác trong hook (giảm coupling).

## 4. Service (`src/services/api/<feature>.ts`)

**Trách nhiệm**: chuyển HTTP call thành typed Promise.

```ts
// src/services/api/incident.ts
import { apiClient } from "./client";
import type {
    IncidentTicket,
    CreateIncidentBody,
    ListIncidentTicketsRes,
    ListTicketsFilter,
} from "@/types/incident";

export const incidentApi = {
    list: (page = 1, limit = 20, filter: ListTicketsFilter = {}) => {
        const q = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (filter.status) q.set("status", filter.status);
        if (filter.priority) q.set("priority", filter.priority);
        return apiClient
            .get<{ data: ListIncidentTicketsRes }>(`/tickets?${q.toString()}`)
            .then((r) => r.data.data);
    },

    detail: (ticketId: string) =>
        apiClient
            .get<{ data: IncidentTicket }>(`/tickets/${ticketId}`)
            .then((r) => r.data.data),

    create: (body: CreateIncidentBody) =>
        apiClient
            .post<{ data: IncidentTicket }>(`/tickets`, body)
            .then((r) => r.data.data),

    cancel: (ticketId: string, reason?: string) =>
        apiClient
            .patch<{ data: IncidentTicket }>(`/tickets/${ticketId}/cancel`, { reason })
            .then((r) => r.data.data),
};
```

**Bắt buộc**:
- Const export `<feature>Api` object — không export individual functions rải rác.
- Type generic `<{ data: T }>` rồi `.then(r => r.data.data)` để unwrap.
- Query string qua `URLSearchParams` — KHÔNG nối chuỗi thủ công.
- Method name động từ thuần (`list`, `detail`, `create`, `update`, `cancel`, `resolve`, `addAddendum`...).

**Cấm**:
- Throw custom error từ service — để axios error nguyên, hook / screen catch.
- Tự `axios.create({...})` mới — dùng `apiClient`.
- Hardcode URL absolute (`https://...`) — chỉ path tương đối, base URL do `apiClient` lo.

## 5. Type (`src/types/<feature>.ts`)

```ts
// src/types/incident.ts
import type { PaginatedResponse } from "./api";

export type TicketStatus = "pending" | "open" | "resolved" | "closed" | "cancelled" | "abandoned";
export type TicketPriority = "low" | "medium" | "high" | "critical";

export interface IncidentTicket {
    id: string;
    code: string;
    title: string;
    status: TicketStatus;
    priority: TicketPriority;
    farmerId: string;
    doctorId: string | null;
    createdAt: string;
    // ...
}

export interface CreateIncidentBody {
    title: string;
    description: string;
    priority: TicketPriority;
    imageUrls?: string[];
}

export interface ListTicketsFilter {
    status?: TicketStatus;
    priority?: TicketPriority;
    search?: string;
}

export type ListIncidentTicketsRes = PaginatedResponse<IncidentTicket>;
```

**Bắt buộc**:
- File `src/types/api.ts` định nghĩa `ApiResponse<T>`, `PaginatedResponse<T>`, `ApiError` — không re-define ở domain file.
- ID = `string` (UUID v4 từ BE).
- Date field = `string` (ISO 8601 từ BE) — convert sang `Date`/`dayjs` ở component khi format.
- Enum literal union (`"open" | "closed"`) — KHÔNG `enum` TS (cumbersome cross-bundle).

## 6. Zustand store (`src/stores/<name>Store.ts`)

```ts
// src/stores/activeTicketStore.ts
import { create } from "zustand";

interface ActiveTicketState {
    activeTicketId: string | null;
    setActiveTicketId: (id: string | null) => void;
}

export const useActiveTicketStore = create<ActiveTicketState>((set) => ({
    activeTicketId: null,
    setActiveTicketId: (id) => set({ activeTicketId: id }),
}));
```

**Bắt buộc**:
- State shape flat (no nested object lớn).
- Actions trong cùng `create()` callback.
- Persist: KHÔNG bật `persist` middleware cho server data. Auth user persist qua `tokenStorage` + `fetchMe()` rehydrate.
- Đọc qua selector: `useAuthStore((s) => s.user)` — không destructure cả store ở component (gây re-render thừa).

**Cấm**:
- Cache server response trong Zustand.
- Side effect lớn trong action (vd gọi API + update store + emit toast cùng action — chỉ giữ state mutation; orchestration thuộc hook / screen).

Exception: `authStore` cố ý chứa async login/logout/fetchMe vì đây là cross-cutting concern và lifecycle gắn chặt với `tokenStorage`.

## 7. UI component layers

### 7.1 `src/components/ui/` — base primitive
- KHÔNG biết domain. Reusable mọi feature.
- StyleSheet.create + hardcoded color/spacing (không Tailwind class trong base). Animation qua Reanimated khi cần.
- Re-export qua `src/components/ui/index.ts`.

Examples: `Button`, `PrimaryButton`, `SecondaryButton`, `Text`, `TextBold`, `TextField`, `SelectField`, `BottomSheet`, `Toast`, `PillTabs`, `EmptyState`, `TopBar`, `TabBarIcon`, `ImagePickerGrid`.

### 7.2 `src/components/react-hook-form/` — RHF + Zod wrapper
- `FormTextField`, `FormSelectField`: `<Controller>` wrap base UI component, pass `error?.message` từ `fieldState`.

### 7.3 `src/components/features/<domain>/` — domain-specific
- Biết domain (IncidentCard, PrescriptionSection, WalletBalanceCard).
- Có thể dùng cả base UI + NativeWind class.
- Nhận props từ screen, KHÔNG fetch data trực tiếp (parent screen cung cấp). Trừ khi component lớn quản lý sub-fetch (vd `IncidentChatPanel` self-subscribe socket).

## 8. Naming convention

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Screen file | kebab-case `.tsx`, dynamic `[param].tsx` | `incidents.tsx`, `[id]/chat.tsx` |
| Screen default export | PascalCase + `Screen` suffix | `IncidentDetailScreen`, `LoginScreen` |
| Hook file | camelCase `use<Domain>.ts` | `useIncident.ts`, `useTicketMessages.ts` |
| Hook export | camelCase `use<Action><Entity>` | `useIncidentList`, `useCreateIncident` |
| Service file | camelCase `<feature>.ts` | `incident.ts`, `ticketMessage.ts` |
| Service const | camelCase `<feature>Api` | `incidentApi`, `ticketMessageApi` |
| Type file | camelCase `<feature>.ts` | `incident.ts`, `bankAccount.ts` |
| Type | PascalCase | `IncidentTicket`, `CreateIncidentBody` |
| Store | camelCase `<name>Store.ts`, hook `use<Name>Store` | `authStore.ts` → `useAuthStore` |
| Base UI component file | PascalCase `.tsx` | `Button.tsx`, `TextField.tsx` |
| Feature component | PascalCase | `IncidentCard.tsx`, `WalletBalanceCard.tsx` |
| Query key namespace | camelCase per domain | `queryKeys.incident.list(...)` |
| Socket event | `<domain>.<entity>.<action>` (snake/dot) | `ticket.message.created`, `alert.created` |

## 9. Cross-feature data sharing

- Cần data từ feature B trong feature A → **gọi hook B** (`useTicketMessages` từ trong incident detail). React Query share cache theo key → free deduplication.
- KHÔNG copy logic API call. KHÔNG re-export `bApi` từ feature A.
- Cần state cross-screen rất hẹp (vd "đang mở ticket nào") → tạo `<scope>Store.ts` Zustand nhỏ.

## 10. Anti-patterns (đừng tái phạm)

- ❌ Screen tự `fetch()` / `axios.get()` — phải qua hook → service → apiClient.
- ❌ Hook tự build URL `apiClient.get("/tickets?page=" + page)` — đẩy về service.
- ❌ Component nhận prop `apiClient` hoặc `queryClient` — dùng hook bên trong.
- ❌ Đặt response data vào `useState` rồi `useEffect(fetch)` — dùng React Query.
- ❌ Đặt `useEffect` socket trong screen — đặt trong hook custom.
- ❌ Re-implement `Button` / `TextField` / `Toast` riêng cho 1 feature — dùng base UI hoặc compose.
- ❌ Bỏ qua loading / error state — luôn render fallback rõ ràng.
- ❌ Mix SafeAreaView source (`react-native` vs `react-native-safe-area-context`) — luôn `react-native-safe-area-context`.
