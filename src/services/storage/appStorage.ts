import AsyncStorage from '@react-native-async-storage/async-storage'

export const appStorage = {
  get: async <T>(key: string): Promise<T | undefined> => {
    try {
      const value = await AsyncStorage.getItem(key)
      if (!value) return undefined
      return JSON.parse(value) as T
    } catch {
      return undefined
    }
  },

  set: async <T>(key: string, value: T): Promise<void> => {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  },

  delete: async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key)
  },

  clear: async (): Promise<void> => {
    await AsyncStorage.clear()
  },
}
