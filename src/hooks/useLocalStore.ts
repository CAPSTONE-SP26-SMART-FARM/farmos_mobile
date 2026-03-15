import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useState } from 'react'

type SetValue<T> = (value?: T | null) => Promise<void>

export function useLocalStore(key: string): [string | null | undefined, SetValue<string>]
export function useLocalStore<T>(key: string): [T | null | undefined, SetValue<T>]
export function useLocalStore<T>(key: string) {
  const [value, setValue] = useState<T | string | null>()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const raw = await AsyncStorage.getItem(key)
        if (!mounted) return
        if (raw == null) { setValue(null); return }
        try { setValue(JSON.parse(raw)) } catch { setValue(raw) }
      } catch {
        if (mounted) setValue(null)
      }
    })()
    return () => { mounted = false }
  }, [key])

  const set = useCallback(
    async (next?: T | string | null) => {
      if (next == null) {
        await AsyncStorage.removeItem(key)
        setValue(null)
        return
      }
      const raw = typeof next === 'string' ? next : JSON.stringify(next)
      await AsyncStorage.setItem(key, raw)
      setValue(next)
    },
    [key]
  )

  return [value, set]
}
