# 💻 Rule 03 — Coding Patterns

> Convention bắt buộc khi viết TS/TSX code trong `app/**` và `src/**`. Đọc trước khi commit.

## 1. Style

- **Prettier**: 2 spaces, single quotes, no semicolons in JS (xem `.prettierrc`). Trailing comma. Mặc định Prettier rule project. **Đừng tự đổi style**.
- `tsc --noEmit` strict — không downgrade `strict: true`.
- Imports group order: built-in → 3rd party → `expo-router` / `react-native` → `@/components` → `@/hooks` → `@/services` → `@/stores` → `@/types` → `@/constants` → `@/lib` → `@/utils` → relative.
- Path alias `@/` cho `src/`, `@/assets/` cho `assets/`. KHÔNG relative `../../../`.
- Default export CHỈ cho screen file (Expo Router yêu cầu). Mọi component / hook / service / type khác → named export.

## 2. TypeScript

- Type literal union thay vì TS `enum`:
  ```ts
  export type TicketStatus = "pending" | "open" | "resolved" | "closed";
  ```
- Tránh `any`. Khi thật cần thoát type ở biên: `as unknown as T` (rare).
- Generic component & hook khi cần (xem `FormTextField<T extends FieldValues>`, `FormSelectField<T, OptionType>`).
- `as const` cho object đóng băng (`KEYS`, `Colors`, factories).

## 3. React patterns

- Function component, no `class`.
- `useMemo` / `useCallback` chỉ khi có vấn đề render thật — đừng micro-optimize mọi handler.
- `useEffect` dependency array đầy đủ — tránh lint disable.
- Cleanup hàm trả về từ `useEffect` khi đăng ký subscription (`socketService.off`, `clearTimeout`, `unsubscribe`).
- Tránh closure stale: pass param qua `set(prev => ...)` thay vì dùng giá trị state hiện tại trong async callback dài.

## 4. Styling — NativeWind & StyleSheet

### Khi nào dùng NativeWind (`className`)
- Screen layout (flex, spacing, color background, padding).
- Feature component (`src/components/features/`).
- Composition utility (responsive nếu cần).

```tsx
<View className="flex-1 bg-gray-50 px-4 pt-6">
    <Text className="text-2xl font-semibold text-gray-900">Tiêu đề</Text>
</View>
```

### Khi nào dùng `StyleSheet.create`
- Base UI primitives ở `src/components/ui/` (Button, TextField, Toast, ...). Lý do: animation phức tạp + variants có sẵn từ codebase + tránh tree-shake NativeWind class names.
- Inline `style={{...}}` chỉ cho giá trị dynamic (vd `style={{ marginBottom: insets.bottom + 16 }}`).

### Color palette
- Từ Tailwind extension trong `tailwind.config.js`:
  - `primary-{50,100,400,500,600,700,900}` (blue #3b82f6 center)
  - `gray-{50..900}`
- Hardcoded color hex chỉ trong `src/constants/theme.ts` hoặc StyleSheet base UI.

## 5. Forms — React Hook Form + Zod

### Pattern

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormTextField } from "@/components/react-hook-form";
import { PrimaryButton } from "@/components/ui";

const schema = z.object({
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
});

type LoginForm = z.infer<typeof schema>;

export default function LoginScreen() {
    const { control, handleSubmit } = useForm<LoginForm>({
        resolver: zodResolver(schema),
        defaultValues: { email: "", password: "" },
    });
    const onSubmit = async (data: LoginForm) => { /* ... */ };

    return (
        <>
            <FormTextField control={control} name="email" label="Email" keyboardType="email-address" autoCapitalize="none" />
            <FormTextField control={control} name="password" label="Mật khẩu" secureTextEntry />
            <PrimaryButton title="Đăng nhập" onPress={handleSubmit(onSubmit)} />
        </>
    );
}
```

**Bắt buộc**:
- Zod schema declare ngoài component (re-creation tốn kém + ổn định identity cho resolver).
- Error message tiếng Việt trong Zod `.message`.
- `FormTextField` / `FormSelectField` (wrap RHF Controller) — KHÔNG dùng raw `<Controller>` rải rác trừ khi component RN custom.
- Submit handler async, try/catch tự xử lý server error qua `showToast.error`.

**Cấm**:
- `useState` cho field value khi đã dùng RHF.
- Inline regex `/^.../` ngoài schema — đẩy về Zod.
- `yup`, `joi`, `class-validator` — chỉ Zod.
- Validation rule rải rác giữa Zod + JSX (`required` prop) — single source là schema.

### Form sheet với prevent unsaved changes

Dùng `usePreventUnsavedChanges` (`src/hooks/`) khi form có nhiều field — block back navigation khi `isDirty`.

## 6. React Query patterns

### Query keys factory

```ts
// src/constants/queryKeys.ts
export const queryKeys = {
    incident: {
        list: (page?: number, filter?: ListTicketsFilter) =>
            ["incident", "list", page, filter ?? {}] as const,
        detail: (id: string) => ["incident", id] as const,
    },
    ticketMessages: {
        list: (ticketId: string) => ["ticketMessages", ticketId] as const,
    },
};
```

- Tuple đầu = domain name (`"incident"`), tiếp theo = action (`"list"` / `"detail"`).
- Param vào tuple sau cùng. Object filter → pass nguyên, React Query stable-stringify cho equality.
- `as const` để TS infer literal tuple (giúp `setQueryData<T>` type-check chuẩn).

### Mutation invalidation

```ts
onSuccess: (_data, variables) => {
    qc.invalidateQueries({ queryKey: ["incident", "list"] }); // broad
    qc.invalidateQueries({ queryKey: queryKeys.incident.detail(variables.ticketId) }); // specific
}
```

- **Luôn** invalidate cả broad (list) và specific (detail) khi mutation có thể ảnh hưởng cả 2.
- `queryClient.setQueryData(key, updater)` cho optimistic / socket-push update (xem pattern `useTicketMessages`).

### Conditional polling

```ts
useQuery({
    queryKey: queryKeys.incident.detail(id),
    queryFn: () => incidentApi.detail(id),
    enabled: !!id,
    refetchInterval: (q) => q.state.data?.status === "open" ? 5000 : false,
});
```

Dùng khi backend không có realtime event nhưng cần "feels live".

## 7. Axios usage

- Single instance: `apiClient` từ `@/services/api/client`. KHÔNG `axios.create()` mới.
- Service trả `Promise<T>` (đã unwrap `.data.data`). Hook không cần thấy raw response.
- Lỗi: KHÔNG try/catch trong service. Để axios throw → React Query / hook caller xử.
- Cancel: React Query tự cancel khi component unmount (Axios v1 hỗ trợ AbortController qua RQ).

## 8. Error message lifecycle

```
Backend throw exception (i18n key resolve)
    │
    ▼
Axios error.response.data = { statusCode, message, errors?: [{ message, path }] }
    │
    ▼
React Query mutation .error / .isError
    │
    ▼
Screen catch trong onSubmit / onPress → getErrorMessage(err, fallback) → showToast.error({ message })
```

Helper:
```ts
// src/utils/error.ts
export function getErrorMessage(err: unknown, fallback: string): string {
    const e = err as { response?: { data?: { message?: string } } } | undefined;
    return e?.response?.data?.message ?? fallback;
}
```

Map server validation `errors[]` về form field (RHF `setError`) chỉ khi form có field tương ứng — không thì toast.

Chi tiết hơn: [08-error-handling-and-toast.md](08-error-handling-and-toast.md).

## 9. Date / time

- `dayjs` cho mọi format. KHÔNG `moment`, KHÔNG `date-fns`, KHÔNG `Intl.DateTimeFormat` cứng.
- ISO string từ BE → `dayjs(iso).format("DD/MM/YYYY HH:mm")`.
- Relative time → `dayjs(iso).from(dayjs())` (cần plugin `relativeTime` + locale `vi`).
- Helper format ở `src/utils/date.ts` — thêm vào đó thay vì rải `dayjs(...).format(...)` khắp app.

## 10. Logging

- `console.log` chỉ trong dev (gated bởi `IS_DEV` từ `@/constants/config`).
- KHÔNG log token, password, refresh token, full response body có PII.
- `console.warn` cho dev warning. `console.error` cho thực sự bất thường.
- Prod log: backend lo — mobile không gửi log về server.

## 11. List rendering

- < 50 item: `FlatList`.
- > 50 item / variable height: `@shopify/flash-list` (đã có dependency).
- `keyExtractor={(item) => item.id}` — không index.
- Pagination "load more": `useInfiniteQuery` của React Query (cần kiểm tra hooks hiện có trước khi xây mới — nhiều list hiện tại dùng manual `page` state + `useIncidentList(page)`).

## 12. Image handling

- Picker: `useImagePicker({ max })` ở `src/hooks/useImagePicker.ts`.
- Upload: hiện codebase upload qua Cloudinary helper `@/utils/cloudinary`. Khi thêm flow upload mới — đọc trước.
- Display: `<Image source={{ uri }}>` từ `react-native`. Cân nhắc `expo-image` cho perf nếu user yêu cầu.

## 13. Navigation

- `import { router, useLocalSearchParams, useGlobalSearchParams, Link } from "expo-router"`.
- Push: `router.push("/incident/" + id)` hoặc object `{ pathname: "/incident/[id]", params: { id } }`.
- Back: `router.back()`.
- Replace (login → tabs): `router.replace("/(app)/(tabs)")`.
- Form sheet dismiss = `router.back()` (Expo Router quản lý animation).

Detail ở [05-routing-and-navigation.md](05-routing-and-navigation.md).

## 14. Helpers — đừng viết lại

`src/utils/`:
- `error.ts` — `getErrorMessage(err, fallback)`
- `date.ts` — format helpers
- `number.ts` — currency, format
- `text.ts` — string helpers
- `sensor.ts` — sensor reading format
- `notification.ts`, `cloudinary.ts`

`src/components/ui/index.ts` re-export đầy đủ — luôn import từ đây, không từ file riêng.

`src/hooks/`:
- `useToast` — toast với `.success/.error/.info/.warning/.networkOffline/.networkOnline`
- `useAuth` — wrap authStore
- `useImagePicker` — image select
- `useNetworkStatus` — connectivity (đã wire vào auth layout)
- `usePreventUnsavedChanges` — block back khi form dirty

Trước khi viết util mới: grep `src/utils/`, `src/hooks/` xem có chưa.

## 15. Comment policy

- Mặc định KHÔNG comment. Chỉ comment khi "tại sao" không hiển nhiên (workaround, business invariant).
- KHÔNG `// removed Xxx`, `// for backwards compat`, `// added in PR #123`.
- Multi-line section divider trong file lớn: `// ============================================================` (xem `apiClient` interceptor section).
- JSDoc cho public helper ở `src/utils/` nếu signature không tự giải thích.

## 16. Anti-patterns thường gặp

- ❌ `import { SafeAreaView } from "react-native"` — dùng `react-native-safe-area-context`.
- ❌ Inline `axios.get(...)` trong component / hook.
- ❌ `setState` lưu data fetched từ server (đẩy về React Query).
- ❌ Quên `enabled: !!param` cho query phụ thuộc param có thể empty → lỗi 400 spam.
- ❌ Mutation không invalidate → màn detail không refresh.
- ❌ Socket `on()` không có `off()` trong cleanup → listener leak khi screen re-mount.
- ❌ `Alert.alert("Error", "...")` cho feedback chung — dùng `showToast.error`.
- ❌ Hardcode color hex trong screen (`style={{ color: "#2463EB" }}`) → dùng Tailwind `text-primary-600` hoặc `Colors.light.tint`.
- ❌ Field value qua `useState` khi đã có RHF `<Controller>`.
- ❌ `useEffect(() => { fetchSomething() }, [])` thay cho `useQuery`.
