import {
  View, ScrollView, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Text } from '@/components/ui'
import { useIncidentDetail } from '@/hooks/useIncident'
import { usePrescriptions } from '@/hooks/usePrescription'
import { SEVERITY_META, STATUS_META } from '@/constants/incident'
import { PrescriptionCard } from '@/components/features/incident/PrescriptionCard'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

function TopBar({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.topBar}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.back}>← Quay lại</Text>
      </TouchableOpacity>
    </View>
  )
}

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data, isLoading, isError } = useIncidentDetail(id)
  const { data: rxData, isLoading: rxLoading } = usePrescriptions(id)
  const prescriptions = rxData?.data ?? []

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <TopBar onBack={() => router.back()} />
        <ActivityIndicator style={{ marginTop: 40 }} color="#2463EB" />
      </SafeAreaView>
    )
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <TopBar onBack={() => router.back()} />
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Không thể tải thông tin sự cố.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar onBack={() => router.back()} />

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

        <Text style={styles.sectionTitle}>Đơn thuốc</Text>
        {rxLoading ? (
          <ActivityIndicator size="small" color="#2463EB" style={{ marginVertical: 12 }} />
        ) : prescriptions.length === 0 ? (
          <View style={styles.emptyRx}>
            <Text style={styles.emptyRxText}>Chưa có đơn thuốc.</Text>
          </View>
        ) : (
          <View style={styles.rxList}>
            {prescriptions.map((rx) => (
              <PrescriptionCard key={rx.id} item={rx} />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.chatBtn, !data.assignee && styles.chatBtnDisabled]}
          onPress={() => router.push(`/(app)/incident/${id}/chat`)}
          disabled={!data.assignee}
        >
          <Text style={styles.chatBtnText}>
            {data.assignee ? '💬 Trao đổi với bác sĩ' : '⏳ Chờ bác sĩ tiếp nhận...'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  topBar: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#fff' },
  back: { fontSize: 15, color: '#2463EB', fontFamily: 'Inter_500Medium' },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  content: { padding: 20, paddingBottom: 32 },
  ticketNum: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginBottom: 6 },
  title: { fontSize: 20, color: '#111827', fontFamily: 'Inter_700Bold', marginBottom: 12 },
  badges: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  sectionTitle: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_600SemiBold', marginBottom: 8, marginTop: 20 },
  description: { fontSize: 15, color: '#374151', fontFamily: 'Inter_400Regular', lineHeight: 22 },
  infoBox: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowLabel: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  rowValue: { fontSize: 13, color: '#111827', fontFamily: 'Inter_500Medium', flex: 1, textAlign: 'right' },
  rxList: { gap: 10 },
  emptyRx: { paddingVertical: 16, alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  emptyRxText: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#fff' },
  chatBtn: { backgroundColor: '#2463EB', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  chatBtnDisabled: { backgroundColor: '#E5E7EB' },
  chatBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
})
