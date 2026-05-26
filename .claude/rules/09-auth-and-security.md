# 🔐 Rule 09 — Auth & Security

## 1. Token storage

```ts
// src/services/storage/tokenStorage.ts
import * as SecureStore from "expo-secure-store";

const KEYS = { ACCESS_TOKEN: "access_token", REFRESH_TOKEN: "refresh_token" } as const;

export const tokenStorage = {
    getAccessToken: () => SecureStore.getItemAsync(KEYS.ACCESS_TOKEN),
    getRefreshToken: () => SecureStore.getItemAsync(KEYS.REFRESH_TOKEN),
    setTokens: async (a: string, r: string) => { /* setItemAsync x2 */ },
    clearTokens: async () => { /* deleteItemAsync x2 */ },
};
```

**Bắt buộc**:
- Mọi đọc / ghi token PHẢI qua `tokenStorage`.
- KHÔNG `SecureStore.getItemAsync("...")` rải rác (dễ key typo).
- KHÔNG lưu token vào `AsyncStorage`, `Zustand`, `MMKV`, biến module-level.
- KHÔNG log token (kể cả truncated) trong production.

## 2. Auth state

```ts
// src/stores/authStore.ts
useAuthStore: {
    user: User | null,
    isAuthenticated: boolean,
    isLoading: boolean,
    login, register, logout, fetchMe, forgotPassword, updateProfile, setUser,
}
```

- `user` + `isAuthenticated` chỉ ở Zustand (in-memory).
- Rehydrate cold start qua `fetchMe()`:
  - Đọc token từ SecureStore.
  - Nếu không có → set unauth.
  - Nếu có → call `/auth/me`. Success → set user + auth. Fail → clear token + set unauth.
- KHÔNG persist `user` vào storage (chỉ token; user reload qua API).

Selector usage:
```ts
const user = useAuthStore((s) => s.user);
const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
const { login, logout } = useAuthStore();  // hoặc useAuth() wrapper
```

## 3. Login flow

1. User submit form → `authStore.login(credentials)`:
   ```ts
   const tokens = await authApi.login(credentials);
   await tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
   const user = await authApi.me();
   set({ user, isAuthenticated: true });
   ```
2. `isAuthenticated` đổi → `Stack.Protected` đẩy về `(app)/(tabs)`.
3. Socket service `connect()` (wire trong root layout).

KHÔNG navigate thủ công sau login — gate xử lý.

## 4. Logout flow

```ts
logout: async () => {
    const refreshToken = await tokenStorage.getRefreshToken();
    try {
        if (refreshToken) await authApi.logout(refreshToken);
    } catch {
        // server revoke fail — vẫn proceed clear local
    } finally {
        await tokenStorage.clearTokens();
        set({ user: null, isAuthenticated: false });
    }
}
```

- Try revoke trên server, fail thì cũng clear local.
- Set unauth → gate đẩy về `(auth)/login` + socket disconnect.

## 5. Token refresh (interceptor)

```ts
// src/services/api/client.ts (đã wire — KHÔNG re-implement)
apiClient.interceptors.response.use(
    (r) => r,
    async (err) => {
        if (err.response?.status === 401 && !err.config._retry) {
            // Queue request nếu đang refresh
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    refreshQueue.push({ resolve, reject, config: err.config });
                });
            }
            isRefreshing = true;
            try {
                const refresh = await tokenStorage.getRefreshToken();
                const tokens = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken: refresh });
                await tokenStorage.setTokens(tokens.data.data.accessToken, tokens.data.data.refreshToken);
                flushQueue(null, tokens.data.data.accessToken);
                err.config._retry = true;
                err.config.headers.Authorization = `Bearer ${tokens.data.data.accessToken}`;
                return apiClient(err.config);
            } catch (e) {
                flushQueue(e);
                unauthorizedHandler?.();  // trigger logout
                throw e;
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(err);
    },
);
```

- Refresh dùng `axios.post(...)` raw — KHÔNG qua `apiClient` để tránh loop.
- Concurrent 401 → queue → flush sau refresh.
- Refresh fail → `unauthorizedHandler` (set trong root layout) trigger logout + socket disconnect.

KHÔNG sửa interceptor trừ khi user yêu cầu. Nếu refresh endpoint đổi shape → cập nhật ở đây.

## 6. Authorization (role-based UI)

```ts
const user = useAuthStore((s) => s.user);
const isDoctor = user?.roleName === "doctor";

if (isDoctor) {
    return <DoctorView />;
}
return <FarmerView />;
```

- Source of truth: `user.roleName` từ `/auth/me`.
- Role: `farmer | rancher | doctor` (admin / owner / manager không vào app này — nếu BE trả về role này, hiển thị empty / logout).
- KHÔNG decode JWT để lấy role (đã có `user` từ `/auth/me`). Trừ khi cần đọc `exp` cho expiry hint.

Tab visibility role-based: xem [05-routing-and-navigation.md](05-routing-and-navigation.md).

## 7. Resource ownership

Mobile **KHÔNG** verify ownership — backend đã enforce. UI chỉ:
- Hide button action không phù hợp role (UX).
- Hiển thị error toast khi BE reject 403.

Đừng trust client-side check như security boundary.

## 8. Sensitive data masking

- KHÔNG render password / OTP / token / bank account số đầy đủ trong log hay UI debug.
- Bank account: hiển thị 4 số cuối, mask `****XXXX`.
- Email partial mask khi cần (vd forgot password confirm `t****@gmail.com`).

## 9. Deep link auth

Deep link vào `(app)` group → nếu chưa auth, `Stack.Protected` đẩy về login. Sau khi login, user mất context deep link.

Nếu cần preserve intent: lưu pending route vào Zustand `redirectAfterLoginStore` (chưa có; thêm khi cần) → đọc trong root layout sau auth.

## 10. Network security

- HTTPS only trong production. `app.config.js` đảm bảo `usesCleartextTraffic` = false trên Android (managed workflow mặc định).
- Cert pinning: hiện không có. Nếu user yêu cầu → cần native module / `react-native-ssl-pinning` (prebuild lại).

## 11. Anti-patterns

- ❌ Lưu token vào `AsyncStorage`, `localStorage`, biến module global.
- ❌ Refresh token thủ công trong component / hook — interceptor lo.
- ❌ Navigate `router.replace("/login")` sau khi logout — chỉ cần clear auth state.
- ❌ Decode JWT để lấy user info — gọi `/auth/me`.
- ❌ Hardcode role check theo string không qua `roleName` field (vd check `user.role === "DOCTOR"` viết hoa, hoặc check qua array index).
- ❌ Render unmasked sensitive data (token, full bank account, full email).
- ❌ Trust client để ẩn route nhạy cảm — đó là UX, BE vẫn phải enforce.
- ❌ Custom auth header (`X-Auth-Token: ...`) — backend mặc định Bearer.
