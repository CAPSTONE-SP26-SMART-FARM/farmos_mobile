---
name: new-form-screen
description: Bootstrap một form screen (Zod schema + React Hook Form + FormTextField/FormSelectField + submit handler + toast). Trigger khi user nói "tạo form X", "form-sheet để tạo Y", "edit profile screen".
---

# Skill — new-form-screen

## Khi nào dùng

User cần screen có form input + validation + submit. Pattern này áp dụng cho:
- Create form (POST mutation).
- Edit form (PATCH mutation).
- Multi-step wizard (split thành nhiều route hoặc state nội bộ).

Thường là form-sheet route (`presentation: "formSheet"`), nhưng cũng có thể full-screen.

## Inputs cần có

1. **Fields**: tên, type (text / email / password / number / select / multiline / image), validation rule.
2. **Mutation hook**: đã có chưa? Nếu chưa → bootstrap hook trước (xem [new-feature](../new-feature/SKILL.md)).
3. **Default values**: empty (create) hay từ existing entity (edit)?
4. **Submit action**: navigate đi đâu sau success?

## Template

```tsx
// app/(app)/<resource>/new.tsx  (hoặc <resource>/[id]/edit.tsx)
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton, Text } from "@/components/ui";
import { FormTextField, FormSelectField } from "@/components/react-hook-form";
import { useCreate<Feature> } from "@/hooks/use<Feature>";
import { useToast } from "@/hooks/useToast";
import { usePreventUnsavedChanges } from "@/hooks/usePreventUnsavedChanges";
import { getErrorMessage } from "@/utils/error";

const schema = z.object({
    name: z.string().min(1, "Vui lòng nhập tên"),
    email: z.string().email("Email không hợp lệ"),
    status: z.enum(["pending", "active"]),
    note: z.string().max(500, "Tối đa 500 ký tự").optional(),
});

type FormValues = z.infer<typeof schema>;

const STATUS_OPTIONS = [
    { value: "pending", label: "Chờ duyệt" },
    { value: "active", label: "Đang hoạt động" },
] as const;

export default function Create<Feature>Screen() {
    const { showToast } = useToast();
    const { mutateAsync, isPending } = useCreate<Feature>();

    const { control, handleSubmit, formState: { isDirty } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { name: "", email: "", status: "pending", note: "" },
    });

    usePreventUnsavedChanges({ isDirty });

    const onSubmit = async (data: FormValues) => {
        try {
            const created = await mutateAsync(data);
            showToast.success({ message: "Tạo thành công!" });
            router.replace(`/<resource>/${created.id}`);
        } catch (err) {
            showToast.error({ message: getErrorMessage(err, "Không thể tạo. Vui lòng thử lại.") });
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
            <KeyboardAwareScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                keyboardShouldPersistTaps="handled"
            >
                <Text className="text-xl font-semibold text-gray-900 mb-4">Tạo mới</Text>

                <FormTextField
                    control={control}
                    name="name"
                    label="Tên"
                    placeholder="Nhập tên..."
                />
                <FormTextField
                    control={control}
                    name="email"
                    label="Email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <FormSelectField
                    control={control}
                    name="status"
                    label="Trạng thái"
                    bottomSheetTitle="Chọn trạng thái"
                    options={STATUS_OPTIONS}
                    labelExtractor={(o) => o.label}
                    valueExtractor={(o) => o.value}
                />
                <FormTextField
                    control={control}
                    name="note"
                    label="Ghi chú"
                    multiline
                    numberOfLines={4}
                />

                <View className="mt-6">
                    <PrimaryButton
                        title="Lưu"
                        loading={isPending}
                        onPress={handleSubmit(onSubmit)}
                    />
                </View>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}
```

## Edit form variant

```tsx
const { data: existing, isLoading } = use<Feature>Detail(id);
const { mutateAsync, isPending } = useUpdate<Feature>();

const { control, handleSubmit, reset, formState: { isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", status: "pending" },  // placeholder until loaded
});

useEffect(() => {
    if (existing) {
        reset({
            name: existing.name,
            email: existing.email,
            status: existing.status,
        });
    }
}, [existing, reset]);

const onSubmit = async (data: FormValues) => {
    try {
        await mutateAsync({ id, body: data });
        showToast.success({ message: "Cập nhật thành công!" });
        router.back();
    } catch (err) {
        showToast.error({ message: getErrorMessage(err, "Không thể cập nhật") });
    }
};
```

## Server validation → setError

Khi BE trả 422 với `errors: [{ message, path }]`:

```ts
const { control, handleSubmit, setError } = useForm<FormValues>(...);

const onSubmit = async (data: FormValues) => {
    try {
        await mutateAsync(data);
        // ...
    } catch (err) {
        const errors = (err as any)?.response?.data?.errors;
        if (Array.isArray(errors)) {
            for (const e of errors) {
                if (e.path && e.message) {
                    setError(e.path as keyof FormValues, { type: "server", message: e.message });
                }
            }
        } else {
            showToast.error({ message: getErrorMessage(err, "Lỗi") });
        }
    }
};
```

## Image upload form

Khi form có upload ảnh:
```ts
import { useImagePicker } from "@/hooks/useImagePicker";

const { imageUris, pick, remove, canAdd } = useImagePicker({ max: 5 });

// Render <ImagePickerGrid imageUris={imageUris} onPick={pick} onRemove={remove} canAdd={canAdd} />
// Submit: upload từng URI lên Cloudinary (@/utils/cloudinary) trước, lấy URL public, rồi mutateAsync với imageUrls.
```

## Form-sheet registration

Sau khi tạo file, thêm vào `app/(app)/_layout.tsx`:
```tsx
<Stack.Screen name="<resource>/new" options={formSheetOptions} />
```

## Checklist

- [ ] Zod schema declare ngoài component.
- [ ] Error message tiếng Việt.
- [ ] `FormTextField` / `FormSelectField` thay vì raw `<Controller>`.
- [ ] `usePreventUnsavedChanges({ isDirty })` cho form nhiều field.
- [ ] `mutateAsync` + try/catch + toast.
- [ ] Navigate sau success (`router.back()` hoặc `router.replace(...)`).
- [ ] Edit: `reset()` sau khi load existing data.
- [ ] Form-sheet: thêm Stack.Screen với formSheetOptions.
- [ ] `KeyboardAwareScrollView` để form không bị keyboard che.
- [ ] `npm run type-check` pass.

## Anti-patterns

- ❌ `useState` cho field value (đã có RHF).
- ❌ Inline regex / validation rule ngoài Zod.
- ❌ Submit không try/catch → unhandled promise rejection.
- ❌ Quên `reset()` khi edit → form trống dù đã load data.
- ❌ Schema literal trong component body → re-create mỗi render.
- ❌ `<Modal>` thay vì form-sheet route.
- ❌ Toast missing / generic "Error" không tiếng Việt.
