import { useEffect, useRef } from 'react'
import { useNetInfo } from '@react-native-community/netinfo'
import { useToast } from './useToast'

export function useNetworkStatus() {
  const { isConnected } = useNetInfo()
  const { showToast } = useToast()
  const isInitialMount = useRef(true)
  const lastState = useRef<boolean | null>(null)

  useEffect(() => {
    if (isInitialMount.current) {
      if (isConnected === false) showToast.networkOffline({ duration: 6000 })
      isInitialMount.current = false
    } else {
      if (isConnected === false) {
        showToast.networkOffline({ duration: 6000 })
      } else if (isConnected === true && lastState.current === false) {
        showToast.networkOnline({})
      }
    }
    lastState.current = isConnected
  }, [isConnected, showToast])

  return { isConnected }
}
