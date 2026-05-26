# 🌍 Rule 01 — Project Context

## What this project is

**FarmOS Mobile** (`farmos_mobile`) — React Native client cho hệ Smart Farm Management.
Expo SDK 54 (managed workflow) + Expo Router v6 (file-based) + NativeWind v4. Talks to NestJS backend `farm_os_be` qua REST + Socket.IO (`/realtime` namespace).

App phục vụ 3 role end-user: **farmer**, **rancher**, **doctor**. (Admin / owner / manager dùng web back-office, không vào app này.)

## Stack (xem [04-tech-stack.md](04-tech-stack.md) cho version đầy đủ)

- **Framework**: Expo SDK 54, React Native 0.81, React 19
- **Routing**: `expo-router` v6 (file-based, `Stack.Protected` cho auth gate)
- **Styling**: NativeWind v4 (Tailwind for RN) cho screen layout — `StyleSheet.create` cho base UI primitives
- **State (client)**: `zustand` 5 — chỉ cho auth + cross-screen UI state (vd `activeTicketStore`)
- **State (server)**: `@tanstack/react-query` 5 — toàn bộ remote data
- **Forms**: `react-hook-form` 7 + `zod` 4 + `@hookform/resolvers`
- **HTTP**: `axios` 1 (single instance ở `src/services/api/client.ts` với interceptor + refresh queue)
- **Realtime**: `socket.io-client` 4 (singleton `socketService`, listener registry, auto-rebind on reconnect)
- **Storage (secure)**: `expo-secure-store` cho access/refresh token (`tokenStorage`)
- **Storage (legacy)**: `@react-native-async-storage/async-storage` có trong deps nhưng **không dùng** cho token. Nếu cần cache nhỏ, hỏi trước.
- **Auth**: JWT bearer + refresh token rotation (queue khi refresh đang chạy)
- **Date**: `dayjs` (KHÔNG dùng `moment` / `date-fns`)
- **Lists**: `@shopify/flash-list` cho virtualized list dài
- **Animation**: `react-native-reanimated` v4
- **Forms input UX**: `react-native-keyboard-aware-scroll-view`
- **Image**: `expo-image-picker` + helper `useImagePicker`
- **Icons**: `@expo/vector-icons` (Ionicons mặc định)
- **Fonts**: `@expo-google-fonts/inter` (Inter 400/500/600/700)
- **Toast**: in-house `Toast` component + `useToast()` hook qua `AppContext`

## Core philosophy

### 1. Server state ≠ client state
- **Server state** (user, incident list, messages, wallet balance...) → React Query. Cache key qua `queryKeys` factory ở `@/constants/queryKeys`.
- **Client state** (auth token presence, current active ticket id, transient UI) → Zustand store hoặc local `useState`. Đừng đẩy server data vào Zustand.

### 2. Hooks-first
- Component KHÔNG gọi `apiClient` trực tiếp — gọi qua hook (`useIncidentList`, `useSendMessage`, ...).
- Hook KHÔNG chứa business validation phức tạp — chỉ wrap React Query / RHF / socket subscription. Business logic nặng đẩy về backend.
- Socket subscription cũng đi qua hook (`useTicketMessages` subscribe `ticket.subscribe` + listen `ticket.message.created`).

### 3. Type-safe biên I/O
- Mọi response API có type ở `src/types/<feature>.ts`. KHÔNG `any`/`unknown` ra ngoài API service.
- Mọi form có Zod schema + `z.infer<typeof schema>` làm form type.
- TS strict mode bật — không downgrade vì lười fix.

### 4. Vietnamese-first UX
- Mọi string user thấy (label, placeholder, button title, toast message, error copy) → tiếng Việt tự nhiên.
- Code identifier / inline comment kỹ thuật → English.

### 5. Single source of truth cho auth
- Token: `tokenStorage` (SecureStore).
- User profile + isAuthenticated flag: `useAuthStore` (Zustand, in-memory; rehydrate via `fetchMe()` on cold start).
- 401 từ interceptor → tự refresh; refresh fail → `registerUnauthorizedHandler` đẩy về logout + disconnect socket.

## Top-level layout

```
farmos_mobile/
├── app/                            # Expo Router (file-based)
│   ├── _layout.tsx                 # Root: QueryClientProvider, AppContext, SafeAreaProvider, Socket lifecycle, Toast
│   ├── index.tsx                   # Redirect: isAuthenticated ? "/(app)/(tabs)" : "/(auth)/login"
│   ├── (auth)/                     # Public group (login, register, forgot-password)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   └── (app)/                      # Protected group (gated by Stack.Protected)
│       ├── _layout.tsx             # Stack + formSheetOptions cho modal screens
│       ├── (tabs)/                 # 5 tab visible + 3 hidden (role-based)
│       │   ├── _layout.tsx
│       │   ├── index.tsx           # Home
│       │   ├── farm.tsx | incidents.tsx | alerts.tsx | profile.tsx
│       │   └── notifications.tsx | doctor-profile.tsx | farmer-profile.tsx (hidden href: null)
│       ├── incident/[id]/          # Detail + chat + resolve + prescription + select-medicine
│       ├── farm/[assignmentId].tsx | farm/milestone/[milestoneId].tsx
│       ├── daily-log/[taskId].tsx
│       ├── bank-accounts/
│       ├── withdrawal/
│       ├── edit-profile.tsx | edit-doctor-profile.tsx | wallet.tsx | ...
│
├── src/
│   ├── components/
│   │   ├── ui/                     # Base primitives: Button, Text, TextField, SelectField, BottomSheet, Toast, PillTabs, EmptyState, TopBar, TabBarIcon, ImagePickerGrid (re-export qua index.ts)
│   │   ├── react-hook-form/        # FormTextField, FormSelectField (Controller wrappers)
│   │   └── features/<domain>/      # Domain-specific (incident, home, wallet, notification, alert, sensor, profile)
│   ├── hooks/                      # useXxx: 1 hook = 1 domain (useIncident, useTicketMessages, useAuth, useToast, useImagePicker, ...)
│   ├── services/
│   │   ├── api/
│   │   │   ├── client.ts           # axios instance + request/response interceptor (attach token, refresh on 401)
│   │   │   └── <feature>.ts        # const <feature>Api = { list, detail, create, ... }
│   │   ├── storage/tokenStorage.ts # SecureStore wrapper
│   │   └── socket/socketService.ts # Socket.IO singleton + listener registry
│   ├── stores/                     # Zustand: authStore, activeTicketStore, resolveStore (small UI state)
│   ├── types/                      # ApiResponse<T>, domain types, request/response shapes
│   ├── constants/                  # config (env-driven), queryKeys, theme, banks, doctor, withdrawal, user, icon
│   ├── lib/queryClient.ts          # QueryClient default options (staleTime 5m, gcTime 30m, retry on 5xx)
│   └── utils/                      # date, error, sensor, number, text, notification, cloudinary
│
├── assets/                         # Fonts, images, SVG (via react-native-svg-transformer)
├── tailwind.config.js              # NativeWind preset + extended colors (primary blue, gray scale) + Inter font
├── global.css                      # @tailwind base/components/utilities
├── app.config.js, app.json         # Expo config
├── babel.config.js, metro.config.js
└── tsconfig.json                   # paths: @/* → src/*, @/assets/* → assets/*
```

## Dead zones / không sửa

- `node_modules/`, `ios/`, `.expo/`, `assets/` — generated / build artifacts / static files (chỉ sửa khi user explicit request).
- `babel.config.js`, `metro.config.js`, `app.config.js` — hỏi user trước khi sửa (đụng vào dễ vỡ Expo build).
- `expo-env.d.ts`, `nativewind-env.d.ts` — auto-generated.

## Khi user đưa request mơ hồ

- "Thêm screen X" → confirm: tab hay stack? auth hay protected? form-sheet modal hay full screen? Xem [05-routing-and-navigation.md](05-routing-and-navigation.md).
- "Build feature Y" → check `src/services/api/`, `src/hooks/`, `src/types/` xem đã có một phần chưa; nếu chỉ thiếu wire-up screen → đừng tạo lại API client.
- "Lắng nghe event Z realtime" → xem [07-realtime-and-socket.md](07-realtime-and-socket.md), pattern là `useEffect` + `socketService.on/off` + `setQueryData`.
- Nếu user nói tên feature (vd "sửa incident"), xác định version chính xác qua file list (`src/services/api/incident.ts` vs `src/hooks/useIncident.ts`) trước khi viết code.

## Communication với backend (`farm_os_be`)

- Base URL: `CONFIG.API_URL` (env `EXPO_PUBLIC_API_URL`).
- Auth: `Authorization: Bearer <accessToken>` (interceptor tự attach).
- Response shape chuẩn: `{ statusCode, message, data?: T }` — unwrap qua `.then(r => r.data.data)` trong service.
- Pagination: backend trả `{ data: T[], meta: { page, limit, total, totalPages } }`.
- Error response: `{ statusCode, message, errors?: [{ message, path }] }` — i18n key đã resolve từ BE theo `Accept-Language` (mặc định `vi`).
- Socket: `${API_URL}/realtime`, auth qua `handshake.auth.token`. Sự kiện naming `domain.entity.action` (vd `ticket.message.created`).
