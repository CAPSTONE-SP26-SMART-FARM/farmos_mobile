# 📡 Rule 07 — Realtime & Socket.IO

> Đọc khi cần subscribe room, lắng nghe event mới, hoặc đụng `src/services/socket/`.

## 1. Architecture

```
socketService (singleton, src/services/socket/socketService.ts)
    │
    ├─ connect()             # gọi từ app/_layout.tsx khi isAuthenticated → true
    ├─ disconnect()          # gọi khi logout / 401
    ├─ subscribeZone(id)     # emit "zone.subscribe" với ack
    ├─ subscribeTicket(id)   # emit "ticket.subscribe"
    ├─ subscribeFarm(id)     # emit "farm.subscribe"
    ├─ on(event, handler)    # đăng ký + lưu vào listener registry
    ├─ off(event, handler)   # gỡ + xóa khỏi registry
    └─ rebindAll()           # auto-call trên 'connect' để re-register listener sau reconnect
```

- **Namespace**: `${API_URL}/realtime`.
- **Auth**: `{ auth: { token } }` (Bearer trong handshake).
- **Transports**: `["websocket", "polling"]`.
- **Reconnection**: 5 attempts, 2000ms delay.
- **Listener registry**: `Map<event, Set<handler>>` — giữ khi disconnect để re-bind lúc reconnect.

## 2. Khi nào dùng realtime

| Use case | Pattern |
|----------|---------|
| Chat / message live | Subscribe room + `setQueryData` thêm message |
| Detail page cần auto refresh | Hoặc subscribe event invalidate, hoặc `refetchInterval` polling (xem `useIncidentDetail`) |
| List update khi item mới tạo | Invalidate broad key trong handler |
| Notification banner trong app | Listener gắn vào global hook trong root layout, push vào Zustand store hoặc Toast |
| Sensor reading live | Subscribe `zone.<zoneId>` → setQueryData |

Khi BE chưa expose event → fallback polling. KHÔNG tự đẻ event name client-side.

## 3. Subscribe pattern (hook)

```ts
// src/hooks/useTicketMessages.ts (ví dụ đã có)
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ticketMessageApi } from "@/services/api/ticketMessage";
import { socketService } from "@/services/socket/socketService";
import { queryKeys } from "@/constants/queryKeys";
import type { TicketMessage, ListTicketMessagesRes, MessageSocketPayload } from "@/types/ticketMessage";

export function useTicketMessages(ticketId: string) {
    const qc = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.ticketMessages.list(ticketId),
        queryFn: () => ticketMessageApi.list(ticketId),
        enabled: !!ticketId,
        staleTime: 0,
        refetchOnMount: "always",
    });

    useEffect(() => {
        if (!ticketId) return;
        socketService.subscribeTicket(ticketId);

        const handler = (payload: MessageSocketPayload) => {
            if (payload.ticketId !== ticketId) return;
            qc.setQueryData<ListTicketMessagesRes>(
                queryKeys.ticketMessages.list(ticketId),
                (old) => {
                    if (!old) {
                        qc.invalidateQueries({ queryKey: queryKeys.ticketMessages.list(ticketId) });
                        return old;
                    }
                    if (old.data.some((m) => m.id === payload.messageId)) return old; // dedup
                    const newMsg: TicketMessage = {
                        id: payload.messageId,
                        ticketId: payload.ticketId,
                        content: payload.content,
                        senderId: payload.senderId,
                        createdAt: payload.createdAt,
                        // ...
                    };
                    return { ...old, data: [...old.data, newMsg] };
                },
            );
        };

        socketService.on("ticket.message.created", handler);
        return () => socketService.off("ticket.message.created", handler);
    }, [ticketId, qc]);

    return query;
}
```

**Bắt buộc**:
- `useEffect` cleanup `socketService.off(event, handler)`. Listener leak là bug khó debug.
- Subscribe room sau khi check `ticketId` exists.
- `setQueryData` updater **immutable** (`{ ...old, data: [...old.data, new] }`).
- Dedup theo `id` — server có thể emit lại event nếu user join nhiều room.
- Fallback `invalidateQueries` khi cache empty.

**Cấm**:
- `socket.on(...)` mà không `off(...)`.
- Subscribe trong screen `useEffect` trực tiếp — đẩy về hook.
- Mutate query cache thiếu kiểm soát (`old.data.push(...)`) — React Query không nhận diện thay đổi.

## 4. Thêm event listener mới

1. **Xác định event name** từ backend. Pattern: `<domain>.<entity>.<action>` (vd `alert.created`, `incident.status.changed`).
   - Confirm với backend `src/realtime/realtime.events.ts` (nếu access được) hoặc hỏi user.
2. **Định nghĩa payload type** trong `src/types/<feature>.ts`:
   ```ts
   export interface AlertCreatedPayload {
       alertId: string;
       zoneId: string;
       severity: "low" | "high" | "critical";
       createdAt: string;
   }
   ```
3. **Trong hook** (tạo mới hoặc extend hook hiện có): subscribe + listen + update cache.
4. **Đảm bảo room subscribe đúng**. Backend phải acknowledge room (xem `RealtimeAccessService` của BE).

## 5. Global listener (root-level)

Khi event cần xử lý bất kể screen nào (vd notification toast):

```ts
// src/hooks/useGlobalRealtime.ts (tạo mới khi cần)
export function useGlobalRealtime() {
    const { showToast } = useToast();
    const activeTicketId = useActiveTicketStore((s) => s.activeTicketId);

    useEffect(() => {
        const handler = (payload: MessageSocketPayload) => {
            // Bỏ qua nếu user đang xem chính ticket đó (tránh duplicate)
            if (payload.ticketId === activeTicketId) return;
            showToast.info({ title: "Tin nhắn mới", message: payload.content });
        };
        socketService.on("ticket.message.created", handler);
        return () => socketService.off("ticket.message.created", handler);
    }, [activeTicketId, showToast]);
}
```

Gọi 1 lần trong `app/_layout.tsx`. KHÔNG gọi trong nhiều layout (sẽ duplicate).

`activeTicketStore` (`src/stores/activeTicketStore.ts`) đã có sẵn cho mục đích này — set khi mở `/incident/[id]`, clear khi unmount.

## 6. Connection lifecycle

Đã xử trong `app/_layout.tsx`:
```tsx
useEffect(() => {
    if (isAuthenticated) {
        socketService.connect();
    } else {
        socketService.disconnect();
    }
}, [isAuthenticated]);
```

KHÔNG `connect()` thủ công trong screen. Nếu cần force reconnect (rare, vd token rotate xong) — gọi `disconnect()` + `connect()` từ store action.

## 7. Anti-patterns

- ❌ Quên `off()` trong cleanup → handler fire nhiều lần.
- ❌ Subscribe room trong render body (không useEffect) — emit liên tục.
- ❌ Mutate cache không immutable (`old.data.push(new)`) — React Query miss diff.
- ❌ Tự bịa event name client side — backend phải register trước.
- ❌ Đẩy data từ socket vào Zustand store thay vì React Query cache — split source of truth.
- ❌ `Alert.alert` trong socket handler — disruptive; dùng `showToast.info` + smart gating qua `activeTicketStore`.
- ❌ Reconnect logic thủ công ở screen — socketService đã handle.
- ❌ Subscribe ticket / zone / farm với ID rỗng → BE reject, console spam.
