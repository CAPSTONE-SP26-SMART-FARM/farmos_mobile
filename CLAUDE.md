# RN Boilerplate - Claude Instructions

## Project Stack
Expo SDK 55, Expo Router v3, TypeScript strict, NativeWind v4, TanStack Query v5, Zustand, Zod + React Hook Form, Axios, MMKV, SecureStore

## Project Structure
```
app/                    # Expo Router (file-based routing)
  (auth)/              # Public screens (login, register)
  (app)/
    (tabs)/            # Tab screens
    detail.tsx         # Stack screens
src/
  components/ui/       # Base components: Button, Input, Text, LoadingScreen
  components/features/ # Feature-specific components
  hooks/               # useAuth, useForm, useNetworkStatus, use[Feature]
  services/api/        # axios clients: client.ts, auth.ts, [feature].ts
  services/storage/    # tokenStorage (SecureStore), appStorage (MMKV)
  stores/              # authStore, appStore (Zustand)
  types/               # api.ts, auth.ts, [feature].ts
  constants/           # config.ts, queryKeys.ts
  lib/                 # queryClient.ts
```

## Key Conventions

### Screens
- `SafeAreaView` từ `react-native-safe-area-context` (KHÔNG dùng từ react-native)
- NativeWind `className` cho styling
- `export default` cho screens
- Named exports cho components

### API Pattern
```ts
// API service
export const [feature]Api = {
  getAll: () => apiClient.get<ApiResponse<T>>('/path').then(r => r.data.data),
}

// Hook
export function use[Feature]() {
  return useQuery({ queryKey: queryKeys.[feature].all, queryFn: [feature]Api.getAll })
}
```

### Form Pattern
```tsx
const schema = z.object({ field: z.string() })
const { control, handleSubmit } = useForm(schema) // từ @/hooks/useForm
```

### Path Aliases
- `@/` → `src/`
- `@app/` → `app/`

## Slash Commands (dùng khi được yêu cầu)

### /new-screen [ScreenName]
Tạo Expo Router screen mới. Hỏi: tab hay stack? auth hay protected?
- Tab: `app/(app)/(tabs)/[name].tsx` + update `_layout.tsx`
- Stack: `app/(app)/[name].tsx`
- Dùng template:
```tsx
import { View, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui'

export default function [Name]Screen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerClassName="flex-grow px-4 pt-6">
        <Text variant="h2">[Name]</Text>
      </ScrollView>
    </SafeAreaView>
  )
}
```

### /new-component [ComponentName]
Tạo reusable component. Base UI → `src/components/ui/`, feature → `src/components/features/[feature]/`.
Thêm export vào `src/components/ui/index.ts` nếu là base UI.
Template:
```tsx
interface [Name]Props extends ViewProps { }
export function [Name]({ className, ...props }: [Name]Props) {
  return <View className={`... ${className ?? ''}`} {...props} />
}
```

### /new-api [featureName]
Tạo API service + TanStack Query hooks + types. Tạo 3 files:
1. `src/types/[feature].ts` — Entity, CreateRequest, UpdateRequest
2. `src/services/api/[feature].ts` — CRUD methods dùng apiClient
3. `src/hooks/use[Feature].ts` — useQuery + useMutation hooks
Thêm queryKeys vào `src/constants/queryKeys.ts`.
