---
name: new-realtime-listener
description: Add một Socket.IO event listener mới — subscribe room + on/off trong useEffect + update React Query cache qua setQueryData. Trigger khi user nói "lắng nghe event X realtime", "live update list/detail khi Y xảy ra", "push toast khi nhận socket Z".
---

# Skill — new-realtime-listener

## Khi nào dùng

User cần screen / list / detail tự update khi backend phát Socket.IO event. KHÔNG dùng cho:
- Polling đơn giản → `refetchInterval` của React Query.
- Long-running background task → backend đẩy notification, FE chỉ refetch.

## Inputs cần có

1. **Event name** (BE register ở `realtime.events.ts` của `farm_os_be`). Naming `domain.entity.action` (vd `ticket.message.created`, `alert.created`).
2. **Room cần subscribe**: `ticket-<id>` / `zone-<id>` / `farm-<id>` / `user-<id>`. Mặc định subscribe qua helper `socketService.subscribeTicket/.subscribeZone/.subscribeFarm`.
3. **Payload shape**: Define type ở `src/types/<feature>.ts`.
4. **Action khi nhận**: append vào list cache? Invalidate detail? Push toast? Tất cả?

## Pattern — listener gắn với 1 screen

```ts
// src/hooks/use<Feature>.ts — extend existing hook hoặc thêm function mới
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { socketService } from "@/services/socket/socketService";
import { queryKeys } from "@/constants/queryKeys";
import type { <Feature>, <Event>Payload } from "@/types/<feature>";

export function use<Feature>WithLive(id: string) {
    const qc = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.<feature>.detail(id),
        queryFn: () => <feature>Api.detail(id),
        enabled: !!id,
    });

    useEffect(() => {
        if (!id) return;
        // Subscribe room (async — ACK)
        socketService.subscribeTicket(id);  // hoặc subscribeZone / subscribeFarm

        const handler = (payload: <Event>Payload) => {
            // Filter (server có thể emit nhiều room)
            if (payload.<entity>Id !== id) return;

            // Cách 1: setQueryData (update incremental)
            qc.setQueryData<<Feature>>(queryKeys.<feature>.detail(id), (old) => {
                if (!old) return old;
                return { ...old, status: payload.status, updatedAt: payload.at };
            });

            // Cách 2: invalidate (refetch từ server)
            // qc.invalidateQueries({ queryKey: queryKeys.<feature>.detail(id) });
        };

        socketService.on("<event.name>", handler);
        return () => socketService.off("<event.name>", handler);
    }, [id, qc]);

    return query;
}
```

## Pattern — list update khi item mới

```ts
useEffect(() => {
    socketService.subscribeFarm(farmId);

    const handler = (payload: AlertCreatedPayload) => {
        if (payload.farmId !== farmId) return;
        qc.setQueryData<ListAlertsRes>(queryKeys.alert.list(1, {}), (old) => {
            if (!old) {
                qc.invalidateQueries({ queryKey: ["alert", "list"] });
                return old;
            }
            if (old.data.some((a) => a.id === payload.alertId)) return old; // dedup
            const newAlert: Alert = { /* construct from payload */ };
            return { ...old, data: [newAlert, ...old.data] };  // prepend
        });
    };

    socketService.on("alert.created", handler);
    return () => socketService.off("alert.created", handler);
}, [farmId, qc]);
```

## Pattern — global listener (toast cross-screen)

```ts
// src/hooks/useGlobalRealtime.ts (tạo mới nếu chưa có)
import { useEffect } from "react";
import { useToast } from "./useToast";
import { useActiveTicketStore } from "@/stores/activeTicketStore";
import { socketService } from "@/services/socket/socketService";
import type { MessageSocketPayload } from "@/types/ticketMessage";

export function useGlobalRealtime() {
    const { showToast } = useToast();
    const activeTicketId = useActiveTicketStore((s) => s.activeTicketId);

    useEffect(() => {
        const handler = (payload: MessageSocketPayload) => {
            if (payload.ticketId === activeTicketId) return; // user đang xem → bỏ qua
            showToast.info({
                title: "Tin nhắn mới",
                message: payload.content.slice(0, 80),
            });
        };
        socketService.on("ticket.message.created", handler);
        return () => socketService.off("ticket.message.created", handler);
    }, [activeTicketId, showToast]);
}
```

Gọi 1 lần trong `app/_layout.tsx`:
```tsx
function RootLayoutInner() {
    useGlobalRealtime();
    // ... rest
}
```

## Update setQueryData immutably

✅ Đúng:
```ts
qc.setQueryData<Foo>(key, (old) => ({ ...old, status: "new" }));
qc.setQueryData<ListFoosRes>(key, (old) => ({ ...old, data: [...old.data, newItem] }));
```

❌ Sai:
```ts
qc.setQueryData(key, (old) => { old.data.push(newItem); return old; }); // mutate → RQ miss diff
```

## Dedup

Server có thể emit cùng event từ nhiều room (vd farmer trong room ticket + room user). Luôn check:
```ts
if (old.data.some((x) => x.id === payload.id)) return old;
```

## Checklist

- [ ] Event name confirm với backend.
- [ ] Payload type ở `src/types/<feature>.ts`.
- [ ] Subscribe room phù hợp (`subscribeTicket` / `subscribeZone` / `subscribeFarm`).
- [ ] `useEffect` cleanup `socketService.off(event, handler)`.
- [ ] Filter `payload.<entity>Id !== id` để bỏ event lạc.
- [ ] Dedup check theo `id` trong updater.
- [ ] `setQueryData` immutable.
- [ ] Fallback `invalidateQueries` khi cache empty.
- [ ] Manual test: trigger event từ BE (Swagger / postman) → verify UI update không reload.

## Anti-patterns

- ❌ `socket.on(...)` mà không `off(...)` cleanup.
- ❌ Subscribe room trong render body (không useEffect).
- ❌ Mutate cache (`old.data.push`) — React Query không re-render.
- ❌ Quên dedup → list có duplicate khi join nhiều room.
- ❌ Tự đẻ event name không có ở backend.
- ❌ `Alert.alert` trong socket handler — disruptive.
- ❌ Subscribe room với id rỗng → BE reject, console spam.
- ❌ Connect / disconnect socket thủ công từ screen — root layout đã wire qua `isAuthenticated`.
