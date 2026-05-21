import { useCallback, useState } from 'react'
import { View, FlatList, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text, EmptyState } from '@/components/ui'
import { AlertCard } from '@/components/features/alert/AlertCard'
import { useAlertList } from '@/hooks/useAlert'
import { icons } from '@/constants/icon'

export default function AlertsScreen() {
  const { data, isLoading, refetch } = useAlertList()
  const alerts = data?.data ?? []

  const [isRefreshing, setIsRefreshing] = useState(false)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try { await refetch() } finally { setIsRefreshing(false) }
  }, [refetch])

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Cảnh báo</Text>
        <Text style={styles.subtitle}>Thông báo từ cảm biến</Text>
      </View>

      <View style={styles.body}>
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color='#2463EB' />
        ) : alerts.length === 0 ? (
          <EmptyState message='Không có cảnh báo nào' Icon={icons.emptyCartSvg} />
        ) : (
          <FlatList
            data={alerts}
            keyExtractor={(a) => a.id}
            renderItem={({ item }) => <AlertCard item={item} />}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor='#2463EB' />
            }
          />
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: '#FFFFFF' },
  title: { fontSize: 24, lineHeight: 32, color: '#111827', fontFamily: 'Inter_600SemiBold' },
  subtitle: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 2 },
  body: { flex: 1, backgroundColor: '#F3F4F6' },
  list: { padding: 16, paddingBottom: 24 },
})
