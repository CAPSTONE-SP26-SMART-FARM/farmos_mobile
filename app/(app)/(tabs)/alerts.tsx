import { useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
import { View, ScrollView, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui'
import { useAlertList } from '@/hooks/useAlert'

export default function AlertsScreen() {
  const { data, isLoading } = useAlertList()
  const alerts = data?.data ?? []

  useFocusEffect(useCallback(() => {}, []))

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Cảnh báo</Text>
        <Text style={styles.subtitle}>Thông báo từ cảm biến</Text>

        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 20 }} color="#2463EB" />
        ) : alerts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Không có cảnh báo nào</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {alerts.map((a) => (
              <View key={a.id} style={styles.card}>
                <Text style={styles.cardTitle}>{a.message}</Text>
                <Text style={styles.cardTime}>{new Date(a.createdAt).toLocaleString('vi-VN')}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, color: '#111827', fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginBottom: 20 },
  empty: { marginTop: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  list: { gap: 12 },
  card: { padding: 16, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  cardTitle: { fontSize: 14, color: '#111827', fontFamily: 'Inter_600SemiBold' },
  cardTime: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 4 },
})
