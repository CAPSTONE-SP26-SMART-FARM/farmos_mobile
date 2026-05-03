import { View, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Text, PillTabs, EmptyState, type PillTabItem } from '@/components/ui'
import { IncidentCard } from '@/components/features/incident/IncidentCard'
import { useIncidentList } from '@/hooks/useIncident'
import { useActiveTicketCategories } from '@/hooks/useTicketCategory'
import { useDoctorIncidentList, useDoctorProfile } from '@/hooks/useDoctor'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { socketService } from '@/services/socket/socketService'

type DoctorFilter = 'active' | 'resolved'

const DOCTOR_TABS: readonly PillTabItem<DoctorFilter>[] = [
  { key: 'active', label: 'Đang xử lý' },
  { key: 'resolved', label: 'Đã giải quyết' },
]

function DoctorGuardScreen({ message }: { message: string }) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Sự cố</Text>
      </View>
      <View style={styles.body}>
        <EmptyState message={message} />
      </View>
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
  const { data, isLoading, isError, refetch } = isDoctor ? doctorQuery : farmerQuery
  const { data: categories = [] } = useActiveTicketCategories(!isDoctor)
  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  )

  // Doctor profile dùng lấy isOnline — /auth/me không có field này
  const { data: doctorProfile } = useDoctorProfile()

  const tickets = data?.data ?? []
  const isOnline = doctorProfile?.isOnline
  const isApproved = user?.isActive

  const [isRefreshing, setIsRefreshing] = useState(false)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try { await refetch() } finally { setIsRefreshing(false) }
  }, [refetch])

  useFocusEffect(useCallback(() => { refetch() }, [refetch]))

  useEffect(() => {
    if (!isDoctor || !isOnline) return
    const handler = () => {
      qc.invalidateQueries({ queryKey: ['incident', 'doctor-list'] })
      showToast.success({ message: 'Có sự cố mới cần xử lý!' })
    }
    socketService.on('ticket.incident.created', handler)
    return () => socketService.off('ticket.incident.created', handler)
  }, [isDoctor, isOnline, qc, showToast])

  if (isDoctor && !isApproved) {
    return <DoctorGuardScreen message='Hồ sơ chưa được phê duyệt. Vào tab Hồ sơ để hoàn tất.' />
  }
  if (isDoctor && !isOnline) {
    return <DoctorGuardScreen message='Bạn đang offline. Bật online ở tab Hồ sơ để nhận sự cố.' />
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Sự cố</Text>
            <Text style={styles.subtitle}>{tickets.length} báo cáo</Text>
          </View>
          {!isDoctor && (
            <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(app)/incident/create')}>
              <Text style={styles.createBtnText}>+ Tạo mới</Text>
            </TouchableOpacity>
          )}
        </View>
        {isDoctor && (
          <PillTabs
            items={DOCTOR_TABS}
            value={doctorFilter}
            onChange={setDoctorFilter}
            style={styles.tabRow}
          />
        )}
      </View>

      <View style={styles.body}>
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
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            renderItem={({ item }) => (
              <IncidentCard
                item={item}
                categoryName={item.categoryConfigId ? categoryMap[item.categoryConfigId] : undefined}
                onPress={() => router.push(`/(app)/incident/${item.id}`)}
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 24, lineHeight: 36, color: '#111827', fontFamily: 'Inter_600SemiBold' },
  subtitle: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 2 },
  createBtn: { backgroundColor: '#2463EB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  createBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  tabRow: { paddingTop: 8, paddingBottom: 2 },
  body: { flex: 1, backgroundColor: '#F3F4F6' },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
})
