import React, { useCallback, useState } from 'react'
import { RefreshControl } from 'react-native'

export const usePullToRefresh = (refetch: () => Promise<any>) => {
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refetch()
    } finally {
      setRefreshing(false)
    }
  }, [refetch])

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor='#2463EB'
      colors={['#2463EB']}
    />
  )

  return { refreshing, onRefresh, refreshControl }
}
