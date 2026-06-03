import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  ScrollView,
  Switch,
} from 'react-native'
import { MaterialIcons, Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { DoctorBroadcast } from '@/types/broadcast'
import { Text, EmptyState, PillTabs } from '@/components/ui'
import type { PillTabItem } from '@/components/ui'
import { IncidentCard } from '@/components/features/incident/IncidentCard'
import { IncidentStatusFilter } from '@/components/features/incident/IncidentStatusFilter'
import { useIncidentList } from '@/hooks/useIncident'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useActiveTicketCategories } from '@/hooks/useTicketCategory'
import { useDoctorProfile, useUpdateDoctorOnlineStatus } from '@/hooks/useDoctor'
import { usePendingBroadcasts } from '@/hooks/useBroadcast'
import { useRejectTicket } from '@/hooks/useTicketLifecycle'
import { ticketLifecycleApi } from '@/services/api/ticketLifecycle'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/utils/error'
import { socketService } from '@/services/socket/socketService'
import { useActiveTicketStore } from '@/stores/activeTicketStore'
import { SEVERITY_META, STATUS_META } from '@/constants/incident'
import { icons } from '@/constants/icon'
import { queryKeys } from '@/constants/queryKeys'
import type { IncidentSeverity, TicketDateRange, TicketStatus } from '@/types/incident'

// Doctor có 2 view: broadcasts (yêu cầu chờ tiếp nhận) vs my-tickets (sự cố đã/đang xử lý).
// Broadcasts dùng endpoint khác (/ticket/broadcast/pending) nên không gộp vào status filter được.
type DoctorView = 'broadcasts' | 'my-tickets'
type StatusFilter = TicketStatus | 'all'

const DATE_OPTIONS: readonly { value: TicketDateRange; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'today', label: 'Hôm nay' },
  { value: '3d', label: '3 ngày' },
  { value: '1w', label: '1 tuần' },
  { value: '1m', label: '1 tháng' },
]

// Status filter — đồng bộ với API: open | assigned | in_progress | resolved | closed | cancelled.
// Label lấy từ STATUS_META để đồng bộ với badge.
const STATUS_FILTER_OPTIONS: readonly { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'open', label: STATUS_META.open.label },
  { value: 'assigned', label: STATUS_META.assigned.label },
  { value: 'in_progress', label: STATUS_META.in_progress.label },
  { value: 'resolved', label: STATUS_META.resolved.label },
  { value: 'closed', label: STATUS_META.closed.label },
  { value: 'cancelled', label: STATUS_META.cancelled.label },
]

const DOCTOR_VIEW_TABS: readonly PillTabItem<DoctorView>[] = [
  { key: 'broadcasts', label: 'Yêu cầu mới' },
  { key: 'my-tickets', label: 'Sự cố của tôi' },
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

function OnlineToggleBanner({ isOnline, isApproved }: { isOnline: boolean; isApproved: boolean }) {
  const { showToast } = useToast()
  const { mutate: updateOnlineStatus, isPending } = useUpdateDoctorOnlineStatus()

  const handleToggle = () => {
    if (!isApproved) {
      showToast.error({ message: 'Cần được phê duyệt trước khi bật online' })
      return
    }
    updateOnlineStatus(
      { isOnline: !isOnline },
      {
        onSuccess: () =>
          showToast.success({ message: `Đã chuyển sang ${!isOnline ? 'Online' : 'Offline'}` }),
        onError: (err: any) =>
          showToast.error({ message: err?.response?.data?.message ?? 'Cập nhật thất bại' }),
      },
    )
  }

  return (
    <View style={styles.onlineBanner}>
      <View style={styles.onlineLeft}>
        <MaterialIcons
          name={isOnline ? 'wifi' : 'wifi-off'}
          size={22}
          color={isOnline ? '#059669' : '#9CA3AF'}
        />
        <View>
          <Text style={styles.onlineLabel}>Nhận sự cố</Text>
          <Text style={styles.onlineSub}>
            {!isApproved ? 'Cần phê duyệt' : isOnline ? 'Đang bật' : 'Đang tắt'}
          </Text>
        </View>
      </View>
      <Switch
        value={isOnline}
        onValueChange={handleToggle}
        disabled={!isApproved || isPending}
        trackColor={{ false: '#E5E7EB', true: '#BBF7D0' }}
        thumbColor={isOnline ? '#059669' : '#9CA3AF'}
      />
    </View>
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

  const [doctorView, setDoctorView] = useState<DoctorView>('broadcasts')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateFilter, setDateFilter] = useState<TicketDateRange>('all')
  const [searchText, setSearchText] = useState('')
  const debouncedSearch = useDebouncedValue(searchText.trim(), 400)
  // Hiện spinner mini trong search bar khi text đã thay đổi nhưng debounce chưa flush.
  const isDebouncing = searchText.trim() !== debouncedSearch

  const isBroadcastTab = isDoctor && doctorView === 'broadcasts'

  // /tickets dùng chung cho cả farmer + doctor — BE filter theo role qua auth token.
  // Doctor "Sự cố của tôi" và farmer ticket list cùng endpoint, chỉ enable khi không ở tab broadcasts.
  const ticketQuery = useIncidentList(
    1,
    {
      status: statusFilter !== 'all' ? statusFilter : undefined,
      dateRange: dateFilter,
      search: debouncedSearch || undefined,
    },
    !isBroadcastTab,
  )

  const broadcastQuery = usePendingBroadcasts(isDoctor)

  const { data, isLoading, isError, refetch } = isBroadcastTab
    ? { data: null, isLoading: false, isError: false, refetch: broadcastQuery.refetch }
    : ticketQuery

  const { data: categories = [] } = useActiveTicketCategories(!isDoctor)
  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  )

  const { data: doctorProfile } = useDoctorProfile(isDoctor)
  const tickets = (data as any)?.data ?? []

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

  // Broadcasts endpoint không support search param → filter client-side theo title / description / ticketNumber.
  // Dataset broadcasts thường nhỏ (chỉ pending) nên cost OK.
  // ⚠ Phải đặt useMemo TRƯỚC các early return (rules-of-hooks).
  const broadcasts = useMemo(() => {
    const list = broadcastQuery.data ?? []
    if (!debouncedSearch) return list
    const q = debouncedSearch.toLocaleLowerCase('vi')
    return list.filter(
      (b) =>
        b.title.toLocaleLowerCase('vi').includes(q) ||
        b.description.toLocaleLowerCase('vi').includes(q) ||
        b.ticketNumber.toLowerCase().includes(q),
    )
  }, [broadcastQuery.data, debouncedSearch])

  if (isDoctor && !isApproved)
    return (
      <DoctorGuardScreen message='Hồ sơ chưa được phê duyệt. Vào tab Hồ sơ để hoàn tất.' />
    )

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
              <MaterialIcons name='add' size={18} color='#15803D' />
              <Text style={styles.createBtnText}>Tạo mới</Text>
            </Pressable>
          )}
        </View>

        {/* Doctor view switcher: broadcasts (yêu cầu mới chưa tiếp nhận) vs sự cố của tôi */}
        {isDoctor && (
          <PillTabs
            items={DOCTOR_VIEW_TABS}
            value={doctorView}
            onChange={setDoctorView}
            style={styles.doctorTabs}
          />
        )}

        {/* Online toggle — doctor bật/tắt nhận sự cố ngay tại đây (thay vì ở tab Hồ sơ) */}
        {isDoctor && (
          <OnlineToggleBanner isOnline={!!isOnline} isApproved={!!isApproved} />
        )}

        {/* Search bar — hiện ở mọi tab. Broadcasts filter client-side, ticket list filter server-side. */}
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
          {isDebouncing ? (
            <ActivityIndicator size='small' color='#9CA3AF' />
          ) : searchText.length > 0 ? (
            <Pressable onPress={() => setSearchText('')} hitSlop={8}>
              <Ionicons name='close-circle' size={18} color='#9CA3AF' />
            </Pressable>
          ) : null}
        </View>

        {/* Filter row — horizontal scroll để pill luôn cùng 1 dòng, không bị wrap xếp chồng */}
        {!isBroadcastTab && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <IncidentStatusFilter
              value={statusFilter}
              options={STATUS_FILTER_OPTIONS}
              onChange={setStatusFilter}
              title='Lọc theo trạng thái'
              prefix='Trạng thái'
            />
            <IncidentStatusFilter
              value={dateFilter}
              options={DATE_OPTIONS}
              onChange={setDateFilter}
              title='Lọc theo thời gian'
              prefix='Thời gian'
            />
          </ScrollView>
        )}
      </View>

      <View style={styles.body}>
        {showLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color='#15803D' />
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
              isDoctor && !isOnline && isBroadcastTab
                ? 'Bạn đang offline. Bật "Nhận sự cố" ở trên để nhận yêu cầu mới.'
                : isBroadcastTab
                  ? 'Không có yêu cầu mới nào.'
                  : debouncedSearch
                    ? `Không tìm thấy kết quả cho "${debouncedSearch}".`
                    : statusFilter !== 'all' || dateFilter !== 'all'
                      ? 'Không có sự cố nào khớp bộ lọc hiện tại.'
                      : isDoctor
                        ? 'Chưa có sự cố nào.'
                        : 'Chưa có sự cố nào được báo cáo.'
            }
            Icon={icons.emptyCartSvg}
            actionLabel={
              !isDoctor && !debouncedSearch && statusFilter === 'all' && dateFilter === 'all'
                ? 'Tạo sự cố mới'
                : undefined
            }
            onAction={
              !isDoctor && !debouncedSearch && statusFilter === 'all' && dateFilter === 'all'
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
  onlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  onlineLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  onlineLabel: { fontSize: 15, color: '#111827', fontFamily: 'Inter_500Medium' },
  onlineSub: { fontSize: 12, color: '#6B7280', fontFamily: 'Inter_400Regular', marginTop: 1 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  createBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#15803D' },
  doctorTabs: { marginBottom: 10 },

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
    alignItems: 'center',
    gap: 8,
    paddingRight: 16,
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
  acceptText: { fontSize: 14, color: '#15803D', fontFamily: 'Inter_600SemiBold' },
})
