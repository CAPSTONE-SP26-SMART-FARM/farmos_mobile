import { useCallback, useState } from 'react'
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Text, EmptyState } from '@/components/ui'
import type { PillTabItem } from '@/components/ui'
import { MilestoneTabToolbar } from '@/components/features/farm/MilestoneTabToolbar'
import { DeviceStatusBadge } from './DeviceStatusBadge'
import { useFarmerMilestoneAssignments } from '@/hooks/useFarmerMilestones'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { icons } from '@/constants/icon'
import type { DeviceStatus, FarmerMilestoneStatus } from '@/types/farmerIot'

type SensorFilter = 'all' | 'active' | 'error'

const FILTER_TABS: readonly PillTabItem<SensorFilter>[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Hoạt động' },
  { key: 'error', label: 'Lỗi' },
]

function filterToStatus(f: SensorFilter): DeviceStatus | undefined {
  if (f === 'active') return 'active'
  if (f === 'error') return 'error'
  return undefined
}

interface MilestoneSensorsTabProps {
  milestoneId: string
  /**
   * Trạng thái milestone — pass để badge áp đúng quy tắc override
   * (xem [[DeviceStatusBadge]]). Không có thì badge hiển thị nhãn board đơn.
   */
  milestoneStatus?: FarmerMilestoneStatus
}

export function MilestoneSensorsTab({ milestoneId, milestoneStatus }: MilestoneSensorsTabProps) {
  const router = useRouter()
  const [searchText, setSearchText] = useState('')
  const debouncedSearch = useDebouncedValue(searchText.trim(), 400)
  const isDebouncing = searchText.trim() !== debouncedSearch

  const [filter, setFilter] = useState<SensorFilter>('all')

  const { data, isLoading, refetch } = useFarmerMilestoneAssignments(milestoneId, {
    page: 1,
    limit: 50,
    q: debouncedSearch || undefined,
    status: filterToStatus(filter),
  })
  const assignments = data?.data ?? []

  const [isRefreshing, setIsRefreshing] = useState(false)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }, [refetch])

  const emptyMessage = debouncedSearch
    ? `Không tìm thấy thiết bị khớp với "${debouncedSearch}".`
    : filter === 'active'
      ? 'Không có thiết bị nào đang hoạt động.'
      : filter === 'error'
        ? 'Không có thiết bị nào bị lỗi.'
        : 'Giai đoạn này chưa gắn thiết bị.'

  return (
    <View style={styles.container}>
      <MilestoneTabToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder='Tìm mã kit, tên thiết bị...'
        isSearching={isDebouncing}
        filterItems={FILTER_TABS}
        filterValue={filter}
        onFilterChange={setFilter}
      />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor='#2463EB' />
        }
      >
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color='#2463EB' />
        ) : assignments.length === 0 ? (
          <EmptyState message={emptyMessage} Icon={icons.emptyCartSvg} />
        ) : (
          <View style={styles.list}>
            {assignments.map((a) => (
              <TouchableOpacity
                key={a.assignmentId}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/farm/[assignmentId]',
                    params: { assignmentId: a.assignmentId, milestoneId },
                  })
                }
              >
                <View style={styles.cardContent}>
                  <View style={styles.titleRow}>
                    {a.device.label ? (
                      <Text style={styles.kitLabel}>{a.device.label}</Text>
                    ) : null}
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {a.device.deviceName}
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <DeviceStatusBadge
                      status={a.device.status}
                      milestoneStatus={milestoneStatus}
                    />
                    <Text style={styles.cardSubtitle}>{a.sensors.length} cảm biến</Text>
                  </View>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, paddingBottom: 24, gap: 12 },
  list: { gap: 12 },
  card: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardContent: { flex: 1, gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kitLabel: {
    fontSize: 13,
    color: '#15803D',
    fontFamily: 'Inter_700Bold',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  cardTitle: { flex: 1, fontSize: 14, color: '#111827', fontFamily: 'Inter_600SemiBold', lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardSubtitle: { fontSize: 12, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  chevron: { fontSize: 22, color: '#9CA3AF' },
})
