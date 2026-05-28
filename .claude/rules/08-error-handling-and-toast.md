# 🚨 Rule 08 — Error Handling & Toast

## 1. Lifecycle

```
Backend (NestJS) throw exception
    │  (GlobalExceptionFilter resolve i18n key theo Accept-Language)
    ▼
Response shape: { statusCode, message, errors?: [{ message, path }] }
    │
    ▼
Axios reject với err.response.data
    │
    ▼
Hook (useMutation) hoặc service call ở screen catch
    │
    ▼
getErrorMessage(err, fallback)  →  showToast.error({ message })
              │
              └─ Nếu err.response.data.errors: map về RHF setError theo path
```

Mobile **không** tự i18n — text trên đã là tiếng Việt (BE resolve). FE chỉ cần extract + display.

## 2. Helper

```ts
// src/utils/error.ts
export function getErrorMessage(err: unknown, fallback: string): string {
    const e = err as { response?: { data?: { message?: string } } } | undefined;
    return e?.response?.data?.message ?? fallback;
}
```

Mọi nơi catch error → qua helper. Fallback string tiếng Việt phù hợp ngữ cảnh.

## 3. Toast types

```ts
type ToastType = "success" | "error" | "info" | "warning" | "network_offline" | "network_online";
```

Hook (`@/hooks/useToast`):
```ts
const { showToast } = useToast();
showToast.success({ message: "Lưu thành công!" });
showToast.error({ message: "Có lỗi xảy ra." });
showToast.info({ title: "Tin nhắn mới", message: "Bạn có 1 tin mới" });
showToast.warning({ message: "Vui lòng kiểm tra lại thông tin." });
showToast.networkOffline({});            // duration tự đặt 6000ms
showToast.networkOnline({ message: "Đã kết nối lại." });
```

**Defaults**:
- Duration: 3500ms (network offline: 6000ms).
- Bottom offset: `safeAreaInsets.bottom + 60`. Override `{ bottomOffset: 80 }` khi có bottom sheet che.

## 4. Khi dùng toast vs Alert

| Tình huống | Dùng |
|------------|------|
| Confirm action quan trọng (xóa, abandon ticket, logout) | `Alert.alert` (React Native) hoặc custom modal — cần button "Cancel/OK" |
| Feedback non-blocking (lưu thành công, lỗi mạng, có thông báo mới) | `showToast.*` |
| Validation inline form field | RHF + Zod error → `<TextField error={...} />` |
| Banner persistent (incident chat notification) | `<ChatNotificationBanner />` (`src/components/features/incident/`) |

KHÔNG dùng `Alert.alert` cho feedback chung — UX gián đoạn, không dismiss tự động.

## 5. Mutation pattern

```tsx
const { mutateAsync, isPending } = useCreateIncident();
const { showToast } = useToast();

const onSubmit = async (data: CreateIncidentBody) => {
    try {
        const created = await mutateAsync(data);
        showToast.success({ message: "Tạo yêu cầu thành công!" });
        router.replace(`/incident/${created.id}`);
    } catch (err) {
        showToast.error({ message: getErrorMessage(err, "Không thể tạo yêu cầu") });
    }
};
```

**Bắt buộc**:
- `mutateAsync` (Promise) trong handler async — dễ try/catch.
- Toast success ngay sau action, navigate sau.
- Fallback message cụ thể (không "Error" / "Đã có lỗi xảy ra" chung chung) — giúp user biết action nào fail.

## 6. Form validation error → RHF setError

Khi server trả `errors: [{ message, path }]` (422 từ NestJS):

```ts
import { useForm } from "react-hook-form";

const { setError, handleSubmit, control } = useForm<MyForm>({ resolver: zodResolver(schema) });

const onSubmit = async (data: MyForm) => {
    try {
        await mutateAsync(data);
    } catch (err) {
        const errors = (err as any)?.response?.data?.errors;
        if (Array.isArray(errors)) {
            for (const e of errors) {
                if (e.path && e.message) {
                    setError(e.path as any, { type: "server", message: e.message });
                }
            }
        } else {
            showToast.error({ message: getErrorMessage(err, "Lưu thất bại") });
        }
    }
};
```

`path` từ BE phải match field name của RHF. Nếu không match → fallback toast.

## 7. Network state

`useNetworkStatus` (`@/hooks/`) đã wire trong `app/(auth)/_layout.tsx` — toast offline/online tự động.

Custom check trong screen:
```ts
import NetInfo from "@react-native-community/netinfo";
const state = await NetInfo.fetch();
if (!state.isConnected) {
    showToast.networkOffline({});
    return;
}
```

KHÔNG block UI hoàn toàn khi offline — chỉ disable button submit, để user vẫn xem cached data từ React Query.

## 8. Crash / unexpected error

- KHÔNG catch + swallow silently.
- `console.error` trong dev (gated bởi `IS_DEV`).
- Toast generic fallback nếu không xác định nguyên nhân.
- Khi cần Sentry / crashlytics → thêm vào root layout (chưa wire). Hỏi user.

## 9. 401 / unauthorized

Đã handle qua `registerUnauthorizedHandler` trong `apiClient`:
- Refresh token thử trước.
- Refresh fail → handler trigger `socketService.disconnect()` + `useAuthStore.getState().logout()`.
- Logout reset auth state → Stack.Protected auto đẩy về `(auth)/login`.

KHÔNG handle 401 riêng trong screen.

## 10. Anti-patterns

- ❌ `Alert.alert("Error", err.message)` — message có thể là i18n key sống.
- ❌ `console.log(error)` trong production code (ungated).
- ❌ Toast với message rỗng / placeholder English (`"Failed to submit"`).
- ❌ Catch error rồi không phản hồi gì (user không biết bị gì).
- ❌ Throw từ hook để screen catch — React Query đã capture vào `error` field.
- ❌ Map `setError` mà path không khớp field RHF → user thấy không có gì sai.
- ❌ Toast trong vòng lặp / re-render — sẽ flicker. Đặt trong handler / `useEffect` có guard.
- ❌ Block toàn screen khi offline — user mất context.
