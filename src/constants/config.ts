export const CONFIG = {
  API_URL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV ?? 'local',
  API_TIMEOUT: 15000,
  CLOUDINARY_CLOUD_NAME: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '',
  CLOUDINARY_UPLOAD_PRESET: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '',
  HELP_INCIDENT_URL: 'https://farmos-fe.vercel.app/help/incident-reporting',
  HELP_DOCTOR_URL: 'https://farmos-fe.vercel.app/help/doctor-guide',
} as const

export const IS_DEV = CONFIG.APP_ENV === 'local' || CONFIG.APP_ENV === 'development'
