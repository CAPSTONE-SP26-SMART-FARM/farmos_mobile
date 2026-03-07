export const CONFIG = {
  API_URL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV ?? 'local',
  API_TIMEOUT: 15000,
} as const

export const IS_DEV = CONFIG.APP_ENV === 'local' || CONFIG.APP_ENV === 'development'
