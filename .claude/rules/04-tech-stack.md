# 🛠️ Rule 04 — Tech Stack & Versions

> Source: `package.json` tại snapshot 2026-05-27. Khi thêm dependency, ưu tiên dùng package đã có hơn là kéo thêm.

## Runtime

- **Node.js**: 20+ (Expo SDK 54 yêu cầu).
- **Package manager**: `npm` (có `package-lock.json`, KHÔNG `pnpm-lock.yaml` / `yarn.lock`).
- **TypeScript**: `~5.9.2` — `strict: true`. Mở rộng `expo/tsconfig.base`.
- **Build / dev**: Expo CLI (Metro bundler). `expo start | expo run:android | expo run:ios`.
- **iOS native folder**: `ios/` đã prebuilt — KHÔNG nest config trừ khi prebuild lại.

## Expo & React Native core

| Package | Version | Note |
|---------|---------|------|
| `expo` | `~54.0.33` | SDK 54 |
| `react-native` | `0.81.5` | New architecture (Fabric / TurboModules) on by default |
| `react` | `19.1.0` | React 19 — chú ý useTransition / useOptimistic nếu cần |
| `react-dom` | `19.1.0` | Cho `react-native-web` |
| `react-native-web` | `^0.21.0` | Web preview (ít dùng) |
| `expo-router` | `~6.0.23` | File-based routing v6 |
| `expo-constants` | `~18.0.13` | Manifest + env |
| `expo-status-bar` | `~3.0.9` | |
| `expo-splash-screen` | `~31.0.13` | |
| `expo-system-ui` | `^6.0.9` | |
| `expo-linking` | `~8.0.11` | Deep link |
| `expo-web-browser` | `~15.0.10` | OAuth / external link |
| `expo-symbols` | `~1.0.8` | SF Symbols (iOS) |
| `expo-haptics` | `~15.0.8` | Haptic feedback (`HapticTab`) |
| `expo-font` | `~14.0.11` | Font loader |
| `expo-application` | `~7.0.8` | App info |
| `expo-device` | `^8.0.10` | Device info |
| `expo-build-properties` | `~1.0.10` | iOS/Android build override |
| `expo-file-system` | `~19.0.21` | File access |
| `expo-image-picker` | `~17.0.11` | Image picker |
| `expo-linear-gradient` | `^15.0.8` | Gradient |
| `expo-secure-store` | `^15.0.8` | Secure token storage |
| `@expo/metro-runtime` | `~6.1.2` | |
| `@expo/vector-icons` | `^15.1.1` | Ionicons mặc định |
| `@expo-google-fonts/inter` | `^0.4.2` | Inter 400/500/600/700 |

## State / data layer

| Package | Version | Use |
|---------|---------|-----|
| `@tanstack/react-query` | `^5.90.21` | Server state — `useQuery`, `useMutation`. v5 API (`gcTime` not `cacheTime`) |
| `zustand` | `^5.0.11` | Client state — `create((set) => ({...}))`. v5: KHÔNG cần `<StoreProvider>` |
| `axios` | `^1.13.6` | HTTP client. Single instance qua `@/services/api/client` |
| `socket.io-client` | `^4.8.3` | Realtime — namespace `/realtime` |
| `react-hook-form` | `^7.71.1` | Form |
| `@hookform/resolvers` | `^5.2.2` | `zodResolver` |
| `zod` | `^4.3.6` | Schema. **Zod 4 API**: `z.string().email()`, `z.uuid()`, `z.iso.datetime()` |
| `jwt-decode` | `^4.0.0` | Decode JWT (khi cần đọc `exp` / `roleName`) |

## Storage

| Package | Version | Use |
|---------|---------|-----|
| `expo-secure-store` | `^15.0.8` | **Primary**: access + refresh token (`tokenStorage`) |
| `@react-native-async-storage/async-storage` | `2.2.0` | Có trong deps nhưng **không dùng** cho auth. Nếu cần cache nhỏ — hỏi user trước (đa số nên dùng React Query / Zustand `persist` middleware nếu thật cần) |

> **Lưu ý CLAUDE.md cũ nhắc MMKV** — KHÔNG có `react-native-mmkv` trong deps. Đừng cài thêm trừ khi user đồng ý (cần prebuild lại iOS).

## UI / Styling

| Package | Version | Use |
|---------|---------|-----|
| `nativewind` | (implicit via `tailwind.config.js` preset) | Tailwind cho RN. v4 |
| `tailwindcss` | (peer) | |
| `react-native-svg` | `^15.12.1` | SVG render |
| `react-native-svg-transformer` | `^1.5.3` (dev) | Import `.svg` as component |
| `react-native-reanimated` | `~4.1.1` | Animation (Toast, TextField label) |
| `react-native-worklets` | `0.5.1` | Reanimated worklet runtime |
| `react-native-gesture-handler` | `~2.28.0` | Gesture (BottomSheet, swipe) |
| `react-native-screens` | `~4.16.0` | Native stack (Expo Router dep) |
| `react-native-safe-area-context` | `~5.6.0` | `SafeAreaView`, `useSafeAreaInsets` |
| `react-native-keyboard-aware-scroll-view` | `^0.9.5` | Form scroll khi keyboard |
| `@shopify/flash-list` | `2.0.2` | Virtualized list |
| `@react-native-community/netinfo` | `11.4.1` | Network state |

## Date / utility

| Package | Version | Use |
|---------|---------|-----|
| `dayjs` | `^1.11.19` | Date format. Plugin `relativeTime`, locale `vi` cần `import "dayjs/locale/vi"` + `dayjs.locale("vi")` |

## Dev tools

| Package | Version | |
|---------|---------|---|
| `@typescript-eslint/eslint-plugin` + `parser` | `^8.56.1` | ESLint TS |
| `prettier` | `^3.8.1` | |
| `husky` | `^9.0.0` | Git hooks |
| `lint-staged` | `^16.3.2` | Run prettier on staged |
| `@commitlint/cli` + `config-conventional` | `^20.4.3` | Conventional commit enforce |
| `jest` | `^29.7.0` | Unit test (rare so far) |
| `jest-expo` | `~54.0.17` | Expo jest preset |
| `@testing-library/react` | `^16.3.2` | (Note: codebase chưa có e2e / RN-specific Testing Library) |

## Khi cần thêm package

1. Check `package.json` xem đã có chưa (vd đừng add `react-native-mmkv` khi SecureStore đã đủ).
2. Match Expo SDK 54 / React 19 / RN 0.81. Tránh package require RN < 0.74 hoặc cần native module chưa autolink với Expo (cần `expo prebuild` lại).
3. Tránh native module nặng — luôn ưu tiên Expo-managed package (`expo-*`).
4. Hỏi user trước khi add native module mới (cần prebuild ios/android lại).

## Commands cheat-sheet

```bash
npm start                 # Expo dev server (Metro)
npm run android           # Build + chạy android (cần emulator hoặc device)
npm run ios               # Build + chạy ios (cần macOS + Xcode)
npm run web               # Web preview
npm run lint              # expo lint (ESLint)
npm run format            # lint-staged (Prettier on staged)
npm run type-check        # tsc --noEmit  ← BẮT BUỘC trước khi báo done
```

⚠️ KHÔNG chạy: `expo prebuild` / `expo install --check` (regen ios/android dễ phá config thủ công). Nếu thật cần, hỏi user.

## Environment variables

- Prefix `EXPO_PUBLIC_` cho client-readable env (Expo SDK 49+ convention).
- Đọc qua `process.env.EXPO_PUBLIC_API_URL` hoặc gom vào `@/constants/config`:
  ```ts
  export const CONFIG = {
      API_URL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
      APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || "development",
      API_TIMEOUT: 15000,
      // ...
  };
  export const IS_DEV = CONFIG.APP_ENV !== "production";
  ```
- Secret KHÔNG bao giờ vào `EXPO_PUBLIC_*` (sẽ bundled vào JS). Nếu cần secret → backend lo.
