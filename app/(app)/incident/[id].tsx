import { View, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Text } from '@/components/ui'
import { useIncidentDetail } from '@/hooks/useIncident'
import { SEVERITY_META, STATUS_META } from '@/constants/incident'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data, isLoading, isError } = useIncidentDetail(id)

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Quay lại</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2463EB" />
      ) : isError || !data ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Không thể tải thông tin sự cố.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.ticketNum}>{data.ticketNumber}</Text>
          <Text style={styles.title}>{data.title}</Text>

          <View style={styles.badges}>
            {[SEVERITY_META[data.severity], STATUS_META[data.status]].map((meta, i) => (
              <View key={i} style={[styles.badge, { backgroundColor: meta.bg }]}>
                <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Mô tả</Text>
          <Text style={styles.description}>{data.description}</Text>

          <Text style={styles.sectionTitle}>Thông tin</Text>
          <View style={styles.infoBox}>
            <Row label="Ưu tiên" value={data.priority} />
            {data.zone && <Row label="Khu vực" value={data.zone.name} />}
            {data.assignee && <Row label="Bác sĩ phụ trách" value={data.assignee.fullName} />}
            <Row label="Ngày tạo" value={new Date(data.createdAt).toLocaleString('vi-VN')} />
            <Row label="Cập nhật" value={new Date(data.updatedAt).toLocaleString('vi-VN')} />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  topBar: { paddingHorizontal: 20, paddingVertical: 14 },
  back: { fontSize: 15, color: '#2463EB', fontFamily: 'Inter_500Medium' },
  content: { padding: 20, paddingBottom: 40 },
  ticketNum: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginBottom: 6 },
  title: { fontSize: 20, color: '#111827', fontFamily: 'Inter_700Bold', marginBottom: 12 },
  badges: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  sectionTitle: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_600SemiBold', marginBottom: 8, marginTop: 16 },
  description: { fontSize: 15, color: '#374151', fontFamily: 'Inter_400Regular', lineHeight: 22 },
  infoBox: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowLabel: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  rowValue: { fontSize: 13, color: '#111827', fontFamily: 'Inter_500Medium', flex: 1, textAlign: 'right' },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
})
