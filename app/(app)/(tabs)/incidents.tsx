import { View, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Pressable } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { DoctorBroadcast } from '@/types/broadcast'
import { Text, EmptyState } from '@/components/ui'
import { IncidentCard } from '@/components/features/incident/IncidentCard'
import { IncidentStatusFilter } from '@/components/features/incident/IncidentStatusFilter'
import { useIncidentList } from '@/hooks/useIncident'
import { useActiveTicketCategories } from '@/hooks/useTicketCategory'
import { useDoctorIncidentList, useDoctorProfile } from '@/hooks/useDoctor'
import { usePendingBroadcasts } from '@/hooks/useBroadcast'
import { useRejectTicket } from '@/hooks/useTicketLifecycle'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/utils/error'
import { socketService } from '@/services/socket/socketService'
import { SEVERITY_META } from '@/constants/incident'
import { icons } from '@/constants/icon'
import type { IncidentSeverity } from '@/types/incident'

type DoctorFilter = 'broadcasts' | 'active' | 'resolved'
type FarmerFilter = 'active' | 'resolved'
type DateFilter = 'today' | '3days' | 'week' | 'month' | 'all'

const DATE_OPTIONS: readonly { value: DateFilter; label: string }[] = [
  { value: 'today', label: 'Hôm nay' },
  { value: '3days', label: '3 ngày gần đây' },
  { value: 'week', label: '1 tuần' },
  { value: 'month', label: '1 tháng' },
  { value: 'all', label: 'Tất cả' },
]

function isWithinDateRange(createdAt: string, filter: DateFilter): boolean {
  if (filter === 'all') return true
  const date = new Date(createdAt)
  const now = new Date()
  if (filter === 'today') return date.toDateString() === now.toDateString()
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  if (filter === '3days') return diffDays <= 3
  if (filter === 'week') return diffDays <= 7
  if (filter === 'month') return diffDays <= 30
  return true
}

const DOCTOR_OPTIONS: readonly { value: DoctorFilter; label: string }[] = [
  { value: 'broadcasts', label: 'Yêu cầu mới' },
  { value: 'active', label: 'Đang xử lý' },
  { value: 'resolved', label: 'Đã giải quyết' },
]

const FARMER_OPTIONS: readonly { value: FarmerFilter; label: string }[] = [
  { value: 'active', label: 'Đang xử lý' },
  { value: 'resolved', label: 'Đã giải quyết' },
]

const FARMER_ACTIVE_STATUSES = ['open', 'assigned', 'in_progress', 'resolved']
const FARMER_ENDED_STATUSES = ['closed', 'cancelled']

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

function BroadcastItem({ item, onRefetch }: { item: DoctorBroadcast; onRefetch: () => void }) {
  const router = useRouter()
  const { showToast } = useToast()
  const { mutate: reject, isPending } = useRejectTicket(item.ticketId)
  const severity = SEVERITY_META[item.severity as IncidentSeverity]

  const handleReject = () => {
    reject(undefined, {
      onSuccess: () => { onRefetch(); showToast.success({ message: 'Đã từ chối' }) },
      onError: (err) => showToast.error({ message: getErrorMessage(err, 'Thất bại') }),
    })
  }

  return (
    <View style={styles.broadcastCard}>
      <TouchableOpacity
        style={styles.broadcastContent}
        onPress={() => router.push(`/(app)/incident/${item.ticketId}`)}
        activeOpacity={0.8}
      >
        <View style={styles.broadcastHeader}>
          <Text style={styles.broadcastTitle} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.severityBadge, { backgroundColor: severity?.bg ?? '#F3F4F6' }]}>
            <Text style={[styles.severityText, { color: severity?.color ?? '#6B7280' }]}>
              {severity?.label ?? item.severity}
            </Text>
          </View>
        </View>
        <Text style={styles.broadcastDesc} numberOfLines={2}>{item.description}</Text>
      </TouchableOpacity>

      <View style={styles.broadcastActions}>
        <TouchableOpacity style={styles.rejectBtn} onPress={handleReject} disabled={isPending}>
          <Text style={styles.rejectText}>{isPending ? '...' : 'Từ chối'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() => router.push(`/(app)/incident/${item.ticketId}`)}
        >
          <Text style={styles.acceptText}>Xem & Tiếp nhận</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default function IncidentsScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const qc = useQueryClient()
  const isDoctor = user?.role === 'doctor'

  const [doctorFilter, setDoctorFilter] = useState<DoctorFilter>('broadcasts')
  const [farmerFilter, setFarmerFilter] = useState<FarmerFilter>('active')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const endedParam = doctorFilter === 'resolved'

  const isBroadcastTab = isDoctor && doctorFilter === 'broadcasts'

  const farmerQuery = useIncidentList()
  const doctorQuery = useDoctorIncidentList(1, endedParam)
  const broadcastQuery = usePendingBroadcasts()
  const { data, isLoading, isError, refetch } = isDoctor
    ? (isBroadcastTab ? { data: null, isLoading: false, isError: false, refetch: broadcastQuery.refetch } : doctorQuery)
    : farmerQuery

  const { data: categories = [] } = useActiveTicketCategories(!isDoctor)
  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  )

  const { data: doctorProfile } = useDoctorProfile()
  const rawTickets = (data as any)?.data ?? []
  // Doctor "Đang xử lý": chỉ show ticket doctor đã accept (assignee là mình)
  // Farmer: client-side filter theo status
  const statusFilteredTickets = isDoctor
    ? (doctorFilter === 'active'
        ? rawTickets.filter((t: any) => t.assignee?.id === user?.id)
        : rawTickets)
    : rawTickets.filter((t: any) =>
        farmerFilter === 'active'
          ? FARMER_ACTIVE_STATUSES.includes(t.status)
          : FARMER_ENDED_STATUSES.includes(t.status),
      )
  const tickets = statusFilteredTickets.filter((t: any) => isWithinDateRange(t.createdAt, dateFilter))
  const isOnline = doctorProfile?.isOnline
  const isApproved = user?.isActive

  const [isRefreshing, setIsRefreshing] = useState(false)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try { await refetch() } finally { setIsRefreshing(false) }
  }, [refetch])

  useFocusEffect(useCallback(() => { refetch() }, [refetch]))

  // D4 — WS: ticket.broadcast → switch to broadcasts tab + toast
  useEffect(() => {
    if (!isDoctor || !isOnline) return
    const onBroadcast = () => {
      qc.invalidateQueries({ queryKey: ['broadcast', 'pending'] })
      showToast.success({ message: 'Có yêu cầu sự cố mới!' })
    }
    const onCreated = () => {
      qc.invalidateQueries({ queryKey: ['incident', 'doctor-list'] })
    }
    socketService.on('ticket.broadcast', onBroadcast)
    socketService.on('ticket.incident.created', onCreated)
    return () => {
      socketService.off('ticket.broadcast', onBroadcast)
      socketService.off('ticket.incident.created', onCreated)
    }
  }, [isDoctor, isOnline, qc, showToast])

  if (isDoctor && !isApproved) return <DoctorGuardScreen message='Hồ sơ chưa được phê duyệt. Vào tab Hồ sơ để hoàn tất.' />
  if (isDoctor && !isOnline) return <DoctorGuardScreen message='Bạn đang offline. Bật online ở tab Hồ sơ để nhận sự cố.' />

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Sự cố</Text>
        <View style={styles.filterRow}>
          {isDoctor ? (
            <IncidentStatusFilter
              value={doctorFilter}
              options={DOCTOR_OPTIONS}
              onChange={setDoctorFilter}
            />
          ) : (
            <IncidentStatusFilter
              value={farmerFilter}
              options={FARMER_OPTIONS}
              onChange={setFarmerFilter}
            />
          )}
          <IncidentStatusFilter
            value={dateFilter}
            options={DATE_OPTIONS}
            onChange={setDateFilter}
            title='Lọc theo thời gian'
          />
        </View>
      </View>

      <View style={styles.body}>
        {(() => {
          const broadcasts = broadcastQuery.data ?? []
          const showLoading = isBroadcastTab ? broadcastQuery.isLoading : isLoading
          const showError = !isBroadcastTab && isError
          const itemCount = isBroadcastTab ? broadcasts.length : tickets.length
          const hasItems = itemCount > 0 && !showLoading && !showError

          return (
            <>
              {hasItems && (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Danh sách sự cố</Text>
                  {!isDoctor && (
                    <Pressable style={styles.createLink} onPress={() => router.push('/(app)/incident/create')}>
                      <MaterialIcons name='add' size={20} color='#2463EB' />
                      <Text style={styles.createLinkText}>Tạo sự cố</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {showLoading ? (
                <ActivityIndicator style={{ marginTop: 40 }} color='#2463EB' />
              ) : showError ? (
                <EmptyState message='Không thể tải dữ liệu.' actionLabel='Thử lại' onAction={refetch} Icon={icons.emptyCartSvg} />
              ) : itemCount === 0 ? (
                <EmptyState
                  message={
                    isBroadcastTab
                      ? 'Không có yêu cầu mới nào.'
                      : isDoctor
                      ? 'Chưa có sự cố nào.'
                      : 'Chưa có sự cố nào được báo cáo.'
                  }
                  Icon={icons.emptyCartSvg}
                  actionLabel={!isDoctor ? 'Tạo sự cố mới' : undefined}
                  onAction={!isDoctor ? () => router.push('/(app)/incident/create') : undefined}
                />
              ) : isBroadcastTab ? (
                <FlatList
                  data={broadcasts}
                  keyExtractor={(b) => b.id}
                  contentContainerStyle={styles.list}
                  ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                  renderItem={({ item }) => <BroadcastItem item={item} onRefetch={broadcastQuery.refetch} />}
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
            </>
          )
        })()}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10 },
  title: { fontSize: 24, lineHeight: 36, color: '#111827', fontFamily: 'Inter_600SemiBold' },
  filterRow: { paddingTop: 8, paddingBottom: 2, flexDirection: 'row', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' },
  body: { flex: 1, backgroundColor: '#F3F4F6', paddingTop: 16 },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16, lineHeight: 24,
    fontFamily: 'Inter_500Medium', color: '#1F2937',
  },
  createLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  createLinkText: {
    fontSize: 14, lineHeight: 20,
    fontFamily: 'Inter_500Medium', color: '#2463EB',
  },

  list: { paddingHorizontal: 16, paddingBottom: 24 },

  broadcastCard: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  broadcastContent: { padding: 16 },
  broadcastHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  broadcastTitle: { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#111827' },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  severityText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  broadcastDesc: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular', lineHeight: 18 },
  broadcastActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  rejectBtn: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderRightWidth: 1, borderRightColor: '#F3F4F6',
  },
  rejectText: { fontSize: 14, color: '#6B7280', fontFamily: 'Inter_500Medium' },
  acceptBtn: { flex: 2, paddingVertical: 12, alignItems: 'center' },
  acceptText: { fontSize: 14, color: '#2463EB', fontFamily: 'Inter_600SemiBold' },
})
