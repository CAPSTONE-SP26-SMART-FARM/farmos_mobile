import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
} from 'react-native'
import { MaterialIcons, Ionicons } from '@expo/vector-icons'
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
import { ticketLifecycleApi } from '@/services/api/ticketLifecycle'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/utils/error'
import { socketService } from '@/services/socket/socketService'
import { useActiveTicketStore } from '@/stores/activeTicketStore'
import { SEVERITY_META } from '@/constants/incident'
import { icons } from '@/constants/icon'
import { queryKeys } from '@/constants/queryKeys'
import type { IncidentSeverity, TicketDateRange, TicketStatus } from '@/types/incident'

type DoctorFilter = 'broadcasts' | 'active' | 'resolved'
type FarmerStatusFilter = TicketStatus | 'all'

const DATE_OPTIONS: readonly { value: TicketDateRange; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'today', label: 'Hôm nay' },
  { value: '3d', label: '3 ngày gần đây' },
  { value: '1w', label: '1 tuần' },
  { value: '1m', label: '1 tháng' },
]

const DOCTOR_OPTIONS: readonly { value: DoctorFilter; label: string }[] = [
  { value: 'broadcasts', label: 'Yêu cầu mới' },
  { value: 'active', label: 'Đang xử lý' },
  { value: 'resolved', label: 'Đã giải quyết' },
]

const FARMER_STATUS_OPTIONS: readonly { value: FarmerStatusFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'open', label: 'Đang mở' },
  { value: 'assigned', label: 'Đã tiếp nhận' },
  { value: 'in_progress', label: 'Đang xử lý' },
  { value: 'resolved', label: 'Đã giải quyết' },
  { value: 'closed', label: 'Đã đóng' },
  { value: 'cancelled', label: 'Đã hủy' },
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

function BroadcastItem({ item, onRefetch }: { item: DoctorBroadcast; onRefetch: () => void }) {
  const router = useRouter()
  const { showToast } = useToast()
  const { mutate: reject, isPending } = useRejectTicket(item.ticketId)
  const severity = SEVERITY_META[item.severity as IncidentSeverity]

  const handleReject = () => {
    reject(undefined, {
      onSuccess: () => {
        onRefetch()
        showToast.success({ message: 'Đã từ chối' })
      },
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
          <Text style={styles.broadcastTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={[styles.severityBadge, { backgroundColor: severity?.bg ?? '#F3F4F6' }]}>
            <Text style={[styles.severityText, { color: severity?.color ?? '#6B7280' }]}>
              {severity?.label ?? item.severity}
            </Text>
          </View>
        </View>
        <Text style={styles.broadcastDesc} numberOfLines={2}>
          {item.description}
        </Text>
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
  const [farmerStatusFilter, setFarmerStatusFilter] = useState<FarmerStatusFilter>('all')
  const [dateFilter, setDateFilter] = useState<TicketDateRange>('all')
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText.trim()), 400)
    return () => clearTimeout(timer)
  }, [searchText])

  const endedParam = doctorFilter === 'resolved'
  const isBroadcastTab = isDoctor && doctorFilter === 'broadcasts'

  const farmerQuery = useIncidentList(1, {
    status: farmerStatusFilter !== 'all' ? farmerStatusFilter : undefined,
    dateRange: dateFilter,
    search: debouncedSearch || undefined,
  })

  const doctorQuery = useDoctorIncidentList(1, endedParam, isDoctor, {
    dateRange: dateFilter,
    search: debouncedSearch || undefined,
  })

  const broadcastQuery = usePendingBroadcasts(isDoctor)

  const { data, isLoading, isError, refetch } = isDoctor
    ? isBroadcastTab
      ? { data: null, isLoading: false, isError: false, refetch: broadcastQuery.refetch }
      : doctorQuery
    : farmerQuery

  const { data: categories = [] } = useActiveTicketCategories(!isDoctor)
  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  )

  const { data: doctorProfile } = useDoctorProfile(isDoctor)
  const rawTickets = (data as any)?.data ?? []

  // Doctor "Đang xử lý": chỉ show ticket doctor đã accept (assignee là mình)
  const tickets =
    isDoctor && doctorFilter === 'active'
      ? rawTickets.filter((t: any) => t.assignee?.id === user?.id)
      : rawTickets

  const isOnline = doctorProfile?.isOnline
  const isApproved = user?.isActive

  const [isRefreshing, setIsRefreshing] = useState(false)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }, [refetch])

  useFocusEffect(useCallback(() => { refetch() }, [refetch]))

  useEffect(() => {
    const onBroadcast = () => {
      if (!isDoctor) return
      qc.invalidateQueries({ queryKey: queryKeys.broadcast.pending })
      showToast.success({ message: 'Có yêu cầu sự cố mới!' })
    }
    const onCreated = () => {
      if (!isDoctor) return
      qc.invalidateQueries({ queryKey: queryKeys.incident.doctorList() })
    }
    const onResolved = () => {
      if (isDoctor) return
      qc.invalidateQueries({ queryKey: queryKeys.incident.list() })
      showToast.success({ message: 'Bác sĩ vừa giải quyết một sự cố' })
    }
    const onAiResolved = () => {
      if (isDoctor) return
      qc.invalidateQueries({ queryKey: queryKeys.incident.list() })
      showToast.success({ message: 'AI đã xử lý xong sự cố' })
    }
    const onAiOffered = (payload: { ticketId: string; title?: string }) => {
      if (isDoctor) return
      if (useActiveTicketStore.getState().activeTicketId === payload.ticketId) return
      const respond = async (resolution: 'FALLBACK_AI' | 'REFUND_TICKET', successMsg: string) => {
        try {
          await ticketLifecycleApi.abandon(payload.ticketId, { resolution })
          qc.invalidateQueries({ queryKey: queryKeys.incident.list() })
          showToast.success({ message: successMsg })
        } catch (e) {
          showToast.error({ message: getErrorMessage(e, 'Có lỗi xảy ra, vui lòng thử lại') })
        }
      }
      Alert.alert(
        'Chưa có bác sĩ tiếp nhận',
        `Sự cố${payload.title ? ` "${payload.title}"` : ''} vẫn chưa có bác sĩ nào tiếp nhận. Bạn có muốn AI xử lý ngay?`,
        [
          {
            text: 'Hoàn lại',
            style: 'cancel',
            onPress: () => respond('REFUND_TICKET', 'Đã hoàn lại sự cố'),
          },
          { text: 'Dùng AI', onPress: () => respond('FALLBACK_AI', 'AI đang xử lý sự cố…') },
        ],
        { cancelable: false },
      )
    }
    socketService.on('ticket.broadcast', onBroadcast)
    socketService.on('ticket.incident.created', onCreated)
    socketService.on('ticket.resolved', onResolved)
    socketService.on('ticket.ai.resolved', onAiResolved)
    socketService.on('ticket.ai.fallback.offered', onAiOffered)
    return () => {
      socketService.off('ticket.broadcast', onBroadcast)
      socketService.off('ticket.incident.created', onCreated)
      socketService.off('ticket.resolved', onResolved)
      socketService.off('ticket.ai.resolved', onAiResolved)
      socketService.off('ticket.ai.fallback.offered', onAiOffered)
    }
  }, [isDoctor, qc, showToast])

  if (isDoctor && !isApproved)
    return (
      <DoctorGuardScreen message='Hồ sơ chưa được phê duyệt. Vào tab Hồ sơ để hoàn tất.' />
    )
  if (isDoctor && !isOnline)
    return (
      <DoctorGuardScreen message='Bạn đang offline. Bật online ở tab Hồ sơ để nhận sự cố.' />
    )

  const broadcasts = broadcastQuery.data ?? []
  const showLoading = isBroadcastTab ? broadcastQuery.isLoading : isLoading
  const showError = !isBroadcastTab && isError
  const itemCount = isBroadcastTab ? broadcasts.length : tickets.length

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <View style={styles.header}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>Sự cố</Text>
          {!isDoctor && (
            <Pressable
              style={styles.createBtn}
              onPress={() => router.push('/(app)/incident/create')}
            >
              <MaterialIcons name='add' size={18} color='#2463EB' />
              <Text style={styles.createBtnText}>Tạo mới</Text>
            </Pressable>
          )}
        </View>

        {/* Search bar — ẩn trên tab broadcasts vì endpoint không hỗ trợ search */}
        {!isBroadcastTab && (
          <View style={styles.searchBar}>
            <Ionicons name='search-outline' size={18} color='#9CA3AF' />
            <TextInput
              style={styles.searchInput}
              placeholder='Tìm kiếm sự cố...'
              placeholderTextColor='#9CA3AF'
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType='search'
              autoCapitalize='none'
              autoCorrect={false}
            />
            {searchText.length > 0 && (
              <Pressable onPress={() => setSearchText('')} hitSlop={8}>
                <Ionicons name='close-circle' size={18} color='#9CA3AF' />
              </Pressable>
            )}
          </View>
        )}

        {/* Filter row */}
        <View style={styles.filterRow}>
          {isDoctor ? (
            <IncidentStatusFilter
              value={doctorFilter}
              options={DOCTOR_OPTIONS}
              onChange={setDoctorFilter}
              title='Trạng thái'
            />
          ) : (
            <IncidentStatusFilter
              value={farmerStatusFilter}
              options={FARMER_STATUS_OPTIONS}
              onChange={setFarmerStatusFilter}
              title='Trạng thái'
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
        {showLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color='#2463EB' />
        ) : showError ? (
          <EmptyState
            message='Không thể tải dữ liệu.'
            actionLabel='Thử lại'
            onAction={refetch}
            Icon={icons.emptyCartSvg}
          />
        ) : itemCount === 0 ? (
          <EmptyState
            message={
              debouncedSearch
                ? `Không tìm thấy kết quả cho "${debouncedSearch}".`
                : isBroadcastTab
                  ? 'Không có yêu cầu mới nào.'
                  : isDoctor
                    ? 'Chưa có sự cố nào.'
                    : 'Chưa có sự cố nào được báo cáo.'
            }
            Icon={icons.emptyCartSvg}
            actionLabel={!isDoctor && !debouncedSearch ? 'Tạo sự cố mới' : undefined}
            onAction={
              !isDoctor && !debouncedSearch
                ? () => router.push('/(app)/incident/create')
                : undefined
            }
          />
        ) : isBroadcastTab ? (
          <FlatList
            data={broadcasts}
            keyExtractor={(b) => b.id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item }) => (
              <BroadcastItem item={item} onRefetch={broadcastQuery.refetch} />
            )}
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
                categoryName={
                  item.categoryConfigId ? categoryMap[item.categoryConfigId] : undefined
                }
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
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: { fontSize: 24, lineHeight: 36, color: '#111827', fontFamily: 'Inter_600SemiBold' },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  createBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#2463EB' },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#111827',
    padding: 0,
  },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flexWrap: 'wrap',
  },

  body: { flex: 1, backgroundColor: '#F3F4F6', paddingTop: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },

  broadcastCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  broadcastContent: { padding: 16 },
  broadcastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  broadcastTitle: { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#111827' },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  severityText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  broadcastDesc: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  broadcastActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  rejectBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F3F4F6',
  },
  rejectText: { fontSize: 14, color: '#6B7280', fontFamily: 'Inter_500Medium' },
  acceptBtn: { flex: 2, paddingVertical: 12, alignItems: 'center' },
  acceptText: { fontSize: 14, color: '#2463EB', fontFamily: 'Inter_600SemiBold' },
})
