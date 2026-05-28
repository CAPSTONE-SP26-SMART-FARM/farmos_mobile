---
name: new-screen
description: Bootstrap một Expo Router screen mới (tab / stack / form-sheet) theo convention FarmOS Mobile. Trigger khi user nói "tạo screen X", "thêm tab Y", "add detail screen Z", "new modal cho ...".
---

# Skill — new-screen

## Khi nào dùng

User yêu cầu tạo screen mới (không phải sửa screen có sẵn). Trước khi bootstrap, **bắt buộc xác định**:

1. **Loại screen**: `tab` (bottom tab) | `stack` (push từ screen khác) | `form-sheet` (modal slide từ dưới)?
2. **Auth scope**: `(auth)` (public, chưa login) | `(app)` (protected)?
3. **Dynamic param** (vd `[id]`)? Nếu có, đặt trong subfolder `<resource>/[id].tsx`.
4. **Role gating**: chỉ farmer / chỉ doctor / cả hai?
5. **Data**: cần fetch không? Hook nào? Nếu chưa có → bootstrap hook + service trước (xem [new-feature](../new-feature/SKILL.md)).

Nếu auto-mode + user không nói rõ: default **stack screen trong `(app)`, không dynamic, cả 2 role**, hỏi gì confirm trong note assumption.

## Template — Stack screen

```tsx
// app/(app)/<name>.tsx
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, TopBar } from "@/components/ui";

export default function <Name>Screen() {
    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <TopBar title="<Tiêu đề tiếng Việt>" />
            <ScrollView contentContainerClassName="px-4 pt-4 pb-12">
                <Text>Nội dung screen</Text>
            </ScrollView>
        </SafeAreaView>
    );
}
```

Sau khi tạo file, mặc định Expo Router auto-route `/your-name`. Không cần register trừ khi muốn config header / animation:
```tsx
// app/(app)/_layout.tsx
<Stack.Screen name="<name>" options={{ headerShown: false }} />
```

## Template — Dynamic detail screen

```tsx
// app/(app)/<resource>/[id].tsx
import { useLocalSearchParams, router } from "expo-router";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, EmptyState } from "@/components/ui";
import { use<Resource>Detail } from "@/hooks/use<Resource>";

export default function <Resource>DetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { data, isLoading, error } = use<Resource>Detail(id);

    if (isLoading) return <Text className="p-4">Đang tải...</Text>;
    if (error || !data) return <EmptyState title="Không tìm thấy" />;

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView contentContainerClassName="px-4 pt-4">
                <Text className="text-xl font-semibold">{data.name}</Text>
            </ScrollView>
        </SafeAreaView>
    );
}
```

## Template — Tab screen

1. Tạo file `app/(app)/(tabs)/<name>.tsx` theo template Stack ở trên.
2. Update `app/(app)/(tabs)/_layout.tsx`:
   ```tsx
   <Tabs.Screen
       name="<name>"
       options={{
           title: "<Tiếng Việt>",
           tabBarIcon: ({ color }) => <TabBarIcon name="leaf-outline" color={color} />,
           // Role gating nếu cần:
           href: isDoctor ? null : "/<name>",
       }}
   />
   ```
3. Pick icon từ Ionicons (`@expo/vector-icons`).

## Template — Form-sheet (modal) screen

1. Tạo file `app/(app)/<resource>/<action>.tsx` hoặc `<resource>/[id]/<action>.tsx`.
   - Body screen dùng `KeyboardAwareScrollView` từ `react-native-keyboard-aware-scroll-view`.
   - Submit handler: `await mutateAsync(data)` → `showToast.success` → `router.back()`.
2. Update `app/(app)/_layout.tsx` thêm Stack.Screen với form-sheet options:
   ```tsx
   <Stack.Screen
       name="<resource>/<action>"
       options={formSheetOptions}  // đã có sẵn ở đầu file
   />
   ```
3. Thêm `usePreventUnsavedChanges({ isDirty })` nếu form có nhiều field.

Detail form → xem [new-form-screen](../new-form-screen/SKILL.md).

## Checklist sau khi bootstrap

- [ ] File `app/.../*.tsx` với `export default function <Name>Screen()`.
- [ ] `SafeAreaView` từ `react-native-safe-area-context`.
- [ ] NativeWind className cho layout (`flex-1 bg-gray-50 px-4`).
- [ ] Loading / empty / error state (nếu fetch data).
- [ ] Register vào `_layout.tsx` nếu là tab / form-sheet.
- [ ] Role gating qua `useAuth()` / `useAuthStore` nếu role-specific.
- [ ] Navigation in / out hoạt động (`router.push`, `router.back`).
- [ ] `npm run type-check` pass.
- [ ] Smoke test trên simulator.

## Anti-patterns

- ❌ Tạo screen trong `src/` (Expo Router không pickup).
- ❌ Default export trong file không phải screen.
- ❌ Inline `useQuery` trong screen — đẩy về `src/hooks/`.
- ❌ `<Modal>` cho form-sheet — dùng form-sheet route.
- ❌ Hardcode role string viết hoa (`"DOCTOR"`) — `user.roleName === "doctor"`.
