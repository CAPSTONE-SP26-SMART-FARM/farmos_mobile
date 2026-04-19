import { View, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui'
import { useAlertList } from '@/hooks/useAlert'
import type { Alert, AlertSeverity } from '@/types/alert'

const SEVERITY_META: Record<AlertSeverity, { label: string; color: string; bg: string }> = {
  low:      { label: 'Thấp',     color: '#16A34A', bg: '#DCFCE7' },
  medium:   { label: 'Trung bình', color: '#CA8A04', bg: '#FEF9C3' },
  high:     { label: 'Cao',      color: '#EA580C', bg: '#FFEDD5' },
  critical: { label: 'Nghiêm trọng', color: '#DC2626', bg: '#FEE2E2' },
}

function AlertCard({ item }: { item: Alert }) {
  const meta = SEVERITY_META[item.severity]
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: meta.bg }]}>
          <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
        {item.isResolved && (
          <View style={styles.resolvedBadge}>
            <Text style={styles.resolvedText}>Đã xử lý</Text>
          </View>
        )}
      </View>

      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardMessage}>{item.message}</Text>

      {(item.actualValue != null || item.thresholdValue != null) && (
        <View style={styles.valuesRow}>
          {item.actualValue != null && (
            <Text style={styles.valueText}>Thực tế: <Text style={styles.valueNum}>{item.actualValue}</Text></Text>
          )}
          {item.thresholdValue != null && (
            <Text style={styles.valueText}>Ngưỡng: <Text style={styles.valueNum}>{item.thresholdValue}</Text></Text>
          )}
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.zoneName}>{item.zoneName} · {item.farmName}</Text>
        <Text style={styles.time}>
          {new Date(item.createdAt).toLocaleString('vi-VN', {
            hour: '2-digit', minute: '2-digit',
            day: '2-digit', month: '2-digit',
          })}
        </Text>
      </View>
    </View>
  )
}

export default function AlertsScreen() {
  const { data, isLoading, isError, refetch, isFetching } = useAlertList()
  const alerts = data?.data ?? []

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Cảnh báo</Text>
          <Text style={styles.subtitle}>{data?.meta.totalItems ?? 0} cảnh báo</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2463EB" />
      ) : isError ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Không thể tải dữ liệu.</Text>
          <TouchableOpacity onPress={refetch} style={styles.retryBtn}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : alerts.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Không có cảnh báo nào.</Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          onRefresh={refetch}
          refreshing={isFetching}
          renderItem={({ item }) => <AlertCard item={item} />}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: { fontSize: 24, color: '#111827', fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#EFF6FF', borderRadius: 8 },
  retryText: { color: '#2463EB', fontFamily: 'Inter_500Medium', fontSize: 14 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  resolvedBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, backgroundColor: '#F3F4F6' },
  resolvedText: { fontSize: 12, color: '#6B7280', fontFamily: 'Inter_500Medium' },
  cardTitle: { fontSize: 15, color: '#111827', fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  cardMessage: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular', lineHeight: 19, marginBottom: 10 },
  valuesRow: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  valueText: { fontSize: 12, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  valueNum: { fontSize: 12, color: '#111827', fontFamily: 'Inter_600SemiBold' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  zoneName: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular', flex: 1 },
  time: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
})
