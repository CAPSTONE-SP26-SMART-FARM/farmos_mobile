import { useEffect } from 'react'
import NetInfo from '@react-native-community/netinfo'
import { useAppStore } from '@/stores/appStore'

export function useNetworkStatus() {
  const { isOnline, setOnline } = useAppStore()

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setOnline(state.isConnected ?? true)
    })
    return unsubscribe
  }, [setOnline])

  return { isOnline }
}
