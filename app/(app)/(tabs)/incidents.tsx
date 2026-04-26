import { View, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Text, PillTabs, EmptyState, type PillTabItem } from '@/components/ui'
import { IncidentCard } from '@/components/features/incident/IncidentCard'
import { useIncidentList } from '@/hooks/useIncident'
import { useDoctorIncidentList, useDoctorProfile } from '@/hooks/useDoctor'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { socketService } from '@/services/socket/socketService'

type DoctorFilter = 'active' | 'resolved'

const DOCTOR_TABS: readonly PillTabItem<DoctorFilter>[] = [
  { key: 'active', label: 'Đang xử lý' },
  { key: 'resolved', label: 'Đã giải quyết' },
]

function Header({
  count, onCreate, showCreate,
}: {
  count: number
  onCreate: () => void
  showCreate: boolean
}) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>Sự cố</Text>
        <Text style={styles.subtitle}>{count} báo cáo</Text>
      </View>
      {showCreate && (
        <TouchableOpacity style={styles.createBtn} onPress={onCreate}>
          <Text style={styles.createBtnText}>+ Tạo mới</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

function DoctorGuardScreen({ message }: { message: string }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Sự cố</Text>
      </View>
      <EmptyState message={message} />
    </SafeAreaView>
  )
}

export default function IncidentsScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const qc = useQueryClient()
  const isDoctor = user?.role === 'doctor'

  const [doctorFilter, setDoctorFilter] = useState<DoctorFilter>('active')
  const endedParam = doctorFilter === 'resolved'

  const farmerQuery = useIncidentList()
  const doctorQuery = useDoctorIncidentList(1, endedParam)
  const { data, isLoading, isError, refetch, isFetching } = isDoctor ? doctorQuery : farmerQuery

  // Doctor profile dùng lấy isOnline — /auth/me không có field này
  const { data: doctorProfile } = useDoctorProfile()

  const tickets = data?.data ?? []
  const isOnline = doctorProfile?.isOnline
  const isApproved = user?.isActive

  useFocusEffect(useCallback(() => { refetch() }, [refetch]))

  useEffect(() => {
    if (!isDoctor || !isOnline) return
    const handler = () => {
      qc.invalidateQueries({ queryKey: ['incident', 'doctor-list'] })
      showToast.success({ message: '🚨 Có sự cố mới cần xử lý!' })
    }
    socketService.on('ticket.incident.created', handler)
    return () => socketService.off('ticket.incident.created', handler)
  }, [isDoctor, isOnline, qc, showToast])

  if (isDoctor && !isApproved) {
    return <DoctorGuardScreen message='⚠️ Hồ sơ chưa được phê duyệt. Vào tab Hồ sơ để hoàn tất.' />
  }
  if (isDoctor && !isOnline) {
    return <DoctorGuardScreen message='🔴 Bạn đang offline. Bật online ở tab Hồ sơ để nhận sự cố.' />
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        count={tickets.length}
        onCreate={() => router.push('/(app)/incident/create')}
        showCreate={!isDoctor}
      />

      {isDoctor && (
        <PillTabs
          items={DOCTOR_TABS}
          value={doctorFilter}
          onChange={setDoctorFilter}
          style={styles.tabRow}
        />
      )}

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color='#2463EB' />
      ) : isError ? (
        <EmptyState message='Không thể tải dữ liệu.' actionLabel='Thử lại' onAction={refetch} />
      ) : tickets.length === 0 ? (
        <EmptyState
          message={isDoctor ? 'Chưa có sự cố nào được gửi đến bạn.' : 'Chưa có sự cố nào được báo cáo.'}
        />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          onRefresh={refetch}
          refreshing={isFetching}
          renderItem={({ item }) => (
            <IncidentCard item={item} onPress={() => router.push(`/(app)/incident/${item.id}`)} />
          )}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16,
  },
  title: { fontSize: 24, color: '#111827', fontFamily: 'Inter_600SemiBold' },
  subtitle: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 2 },
  createBtn: { backgroundColor: '#2463EB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  createBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  tabRow: { paddingHorizontal: 16, paddingBottom: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
})
