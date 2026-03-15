const IS_DEV = process.env.APP_VARIANT !== 'release'
const APP_VERSION = process.env.APP_VERSION ?? '1.0.0'
const APP_BUILDCODE = (process.env.APP_BUILDCODE ?? 'v1').substring(1) || '1'
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'
const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV ?? 'local'

export default {
  extra: {
    apiUrl: API_URL,
    env: APP_ENV,
    eas: {
      projectId: ''
    }
  },
  name: IS_DEV ? 'FarmOS (Dev)' : 'FarmOS',
  slug: 'doan-mobile',
  version: APP_VERSION,
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: IS_DEV ? 'com.doan.farmos.dev' : 'com.doan.farmos',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: IS_DEV ? 'com.doan.farmos.dev' : 'com.doan.farmos'
  },
  android: {
    versionCode: parseInt(APP_BUILDCODE) || 1,
    adaptiveIcon: {
      backgroundColor: '#2463EB',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png'
    },
    edgeToEdgeEnabled: true,
    package: IS_DEV ? 'com.doan.farmos.dev' : 'com.doan.farmos'
  },
  web: {
    favicon: './assets/favicon.png'
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
          buildReactNativeFromSource: true
        }
      }
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#2463EB'
      }
    ]
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true
  }
}
