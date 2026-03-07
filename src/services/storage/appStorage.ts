import { MMKV } from 'react-native-mmkv'

export const storage = new MMKV({ id: 'app-storage' })

export const appStorage = {
  get: <T>(key: string): T | undefined => {
    const value = storage.getString(key)
    if (!value) return undefined
    try {
      return JSON.parse(value) as T
    } catch {
      return value as unknown as T
    }
  },

  set: <T>(key: string, value: T): void => {
    storage.set(key, JSON.stringify(value))
  },

  delete: (key: string): void => {
    storage.delete(key)
  },

  clear: (): void => {
    storage.clearAll()
  },
}
