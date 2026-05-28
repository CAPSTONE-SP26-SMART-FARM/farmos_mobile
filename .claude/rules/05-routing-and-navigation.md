# 🧭 Rule 05 — Routing & Navigation (Expo Router v6)

> Đọc khi tạo route mới, modal form-sheet, dynamic param, hoặc đụng `app/**/_layout.tsx`.

## 1. Tổng quan file-based routing

```
app/
├── _layout.tsx                # Root layout — providers, auth gate (Stack.Protected), socket lifecycle
├── index.tsx                  # "/" — redirect dựa trên auth
├── (auth)/                    # Group, KHÔNG vào URL ("/login" not "/(auth)/login")
│   ├── _layout.tsx            # Stack cho auth screens
│   ├── login.tsx              # "/login"
│   ├── register.tsx
│   └── forgot-password.tsx
└── (app)/                     # Group bảo vệ, chỉ truy cập sau khi auth
    ├── _layout.tsx            # Stack + formSheetOptions
    ├── (tabs)/                # Group lồng — bottom tabs
    │   ├── _layout.tsx        # Tabs config
    │   ├── index.tsx          # "/" trong tabs context = Home
    │   ├── farm.tsx
    │   ├── incidents.tsx
    │   └── ... (hidden tabs: notifications, doctor-profile, farmer-profile)
    ├── incident/
    │   ├── create.tsx         # "/incident/create" (form-sheet modal)
    │   └── [id]/
    │       ├── index.tsx      # "/incident/:id"
    │       ├── chat.tsx
    │       ├── resolve.tsx    # form-sheet
    │       └── ...
    ├── farm/
    │   ├── [assignmentId].tsx
    │   └── milestone/[milestoneId].tsx
    ├── daily-log/[taskId].tsx (form-sheet)
    ├── bank-accounts/
    ├── withdrawal/
    └── (single screens: edit-profile, wallet, doctor-profile-info, ...)
```

**Quy ước**:
- `()` = route group (không xuất hiện trong URL).
- `[param]` = dynamic segment → đọc qua `useLocalSearchParams<{ param: string }>()`.
- `_layout.tsx` = layout wrap mọi screen cùng level.
- `index.tsx` = root của group / folder.

## 2. Root layout — `app/_layout.tsx`

Đã wire sẵn:
- `QueryClientProvider` (React Query)
- `AppContext.Provider` (cho `useToast`)
- `SafeAreaProvider`
- `GestureHandlerRootView`
- `useAuthStore.fetchMe()` on mount → rehydrate auth
- Socket connect / disconnect theo `isAuthenticated`
- `registerUnauthorizedHandler` (401 → logout)
- `Stack.Protected guard={isAuthenticated}` cho `(app)` group, fallback `(auth)`
- Render `<Toast>` cuối cùng (overlay)

**KHÔNG sửa root layout** trừ khi:
- Thêm global provider (Theme, i18n, Sentry, ...) — hỏi user trước.
- Thay đổi auth gate logic.

Nếu cần thêm global effect cross-screen → tạo hook custom + gọi trong root layout. Không thêm logic inline.

## 3. Tạo screen mới

### 3.1 Full-screen trong tabs

1. File `app/(app)/(tabs)/<name>.tsx`:
   ```tsx
   import { ScrollView } from "react-native";
   import { SafeAreaView } from "react-native-safe-area-context";
   import { Text } from "@/components/ui";

   export default function MyTabScreen() {
       return (
           <SafeAreaView className="flex-1 bg-gray-50">
               <ScrollView contentContainerClassName="px-4 pt-6">
                   <Text>My Tab</Text>
               </ScrollView>
           </SafeAreaView>
       );
   }
   ```
2. Update `app/(app)/(tabs)/_layout.tsx` thêm `<Tabs.Screen name="<name>" options={{ title: "...", tabBarIcon: ... }} />`.
3. Nếu tab role-specific (chỉ doctor / chỉ farmer) → set `href: isDoctor ? "/<name>" : null` (pattern hiện có với `farmer-profile` / `doctor-profile`).

### 3.2 Full-screen stack (không phải tab)

1. File `app/(app)/<name>.tsx` hoặc `app/(app)/<group>/<name>.tsx`.
2. Update `app/(app)/_layout.tsx` thêm `<Stack.Screen name="<name>" options={{ headerShown: true, title: "..." }} />` nếu cần header. Mặc định nhiều screen `headerShown: false` và tự render `<TopBar>` trong screen.
3. Navigate: `router.push("/<name>")`.

### 3.3 Dynamic route `[id]`

1. File `app/(app)/<resource>/[id].tsx` hoặc `app/(app)/<resource>/[id]/index.tsx` (khi có nested screens chung id).
2. Đọc param:
   ```tsx
   import { useLocalSearchParams } from "expo-router";
   const { id } = useLocalSearchParams<{ id: string }>();
   ```
3. Navigate:
   ```ts
   router.push({ pathname: "/<resource>/[id]", params: { id } });
   // hoặc string interpolation (cẩn thận escape):
   router.push(`/<resource>/${id}`);
   ```

### 3.4 Form-sheet (modal) screen

Pattern hiện dùng cho `incident/create.tsx`, `incident/[id]/resolve.tsx`, `incident/[id]/select-medicine.tsx`, `daily-log/[taskId].tsx`, `bank-accounts/form.tsx`, `withdrawal/new.tsx`.

Trong `app/(app)/_layout.tsx`:
```tsx
const formSheetOptions = {
    presentation: "formSheet" as const,
    sheetGrabberVisible: true,
    sheetAllowedDetents: Platform.OS === "ios" ? [1.0] : [0.9],
    contentStyle: { backgroundColor: "#F9FAFB" },
};

<Stack.Screen name="incident/create" options={formSheetOptions} />
<Stack.Screen name="incident/[id]/resolve" options={formSheetOptions} />
```

Trong screen:
- Dismiss = `router.back()` (Expo Router xử animation).
- Phòng unsaved changes: `usePreventUnsavedChanges({ isDirty })` (`@/hooks/usePreventUnsavedChanges`).
- KHÔNG dùng `<Modal>` của RN — ưu tiên form-sheet route.

## 4. Auth gating

```tsx
// Đã wire trong app/_layout.tsx — KHÔNG copy logic vào nơi khác
<Stack>
    <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
    </Stack.Protected>
    <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack.Protected>
</Stack>
```

- Khi `isAuthenticated` đổi, Expo Router auto-switch group.
- KHÔNG `router.replace("/login")` thủ công khi logout — chỉ cần `await logout()` từ `useAuthStore`, gate sẽ tự đẩy về `(auth)`.

## 5. Tab visibility theo role

```tsx
// app/(app)/(tabs)/_layout.tsx
const user = useAuthStore((s) => s.user);
const isDoctor = user?.roleName === "doctor";

<Tabs.Screen
    name="farmer-profile"
    options={{
        href: isDoctor ? null : "/farmer-profile",  // null = ẩn tab
        // ...
    }}
/>
<Tabs.Screen
    name="doctor-profile"
    options={{
        href: isDoctor ? "/doctor-profile" : null,
        // ...
    }}
/>
```

**Bắt buộc**:
- Quyết định visible/hidden qua `href: null` — KHÔNG render conditional `<Tabs.Screen>` (Expo Router cần ổn định cấu trúc).
- Tab icon: dùng `<TabBarIcon name="..." color={...} />` (`@/components/ui`) — wrapper Ionicons.
- Bottom bar style hiện tại: height 85, fontSize 11, shadowOpacity 0.04. Khi thêm tab thứ 6 → kiểm tra layout chật chưa.

## 6. Navigation helpers

```ts
import { router, useLocalSearchParams, useGlobalSearchParams, Link, Stack, Tabs } from "expo-router";

router.push("/incident/" + id);
router.push({ pathname: "/incident/[id]", params: { id } });
router.replace("/(app)/(tabs)");
router.back();
router.canGoBack();
router.dismiss();        // form-sheet dismiss
router.dismissAll();     // pop hết stack
```

**Bắt buộc**:
- Type-safe khi dynamic: `params: { id }` thay vì interpolate, để tránh quên encodeURIComponent.
- Login → tab: `router.replace` (không push) để user không back về login.
- Logout: KHÔNG cần navigate thủ công — auth gate xử (xem mục 4).

## 7. Deep link

`app.config.js` set scheme `farmos://`. Path follow file structure.

Khi cần deep link mới:
- Confirm scheme + universal link config trong `app.config.js`.
- Test cả iOS + Android.
- Token-protected deep link: handle trong `app/_layout.tsx` redirect — gate sẽ block tới khi authenticated.

## 8. Anti-patterns

- ❌ Tạo screen ở `src/` thay vì `app/` — Expo Router không pickup.
- ❌ Multiple default export trong cùng file — chỉ 1 default = screen component.
- ❌ Hook không phải-React (named export object) trong file screen — đẩy về `src/hooks/`.
- ❌ Navigate logic phức tạp trong `useEffect(() => router.push(...))` — dễ infinite loop. Dùng `<Redirect>` của Expo Router cho conditional routing tĩnh.
- ❌ Quên update `(tabs)/_layout.tsx` khi thêm tab file — màn sẽ orphan.
- ❌ `<Modal visible={open}>` cho form lớn — dùng form-sheet route.
- ❌ Inject `Stack.Protected` rải rác — chỉ ở root `app/_layout.tsx`.
- ❌ Static `href` cho tab role-specific → tab hiện cho mọi role.
