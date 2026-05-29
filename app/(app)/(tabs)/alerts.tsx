import { useCallback, useMemo, useState } from 'react'
import { View, SectionList, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { Text, EmptyState } from '@/components/ui'
import { AlertCard } from '@/components/features/alert/AlertCard'
import { useAlertList } from '@/hooks/useAlert'
import { useDeviceAssignmentMap } from '@/hooks/useFarmerMilestones'
import { useToast } from '@/hooks/useToast'
import { icons } from '@/constants/icon'
import type { Alert } from '@/types/alert'

const NO_BOARD_KEY = '__no_board__'

function groupByBoard(alerts: Alert[]): { title: string; data: Alert[] }[] {
  const map = new Map<string, { title: string; data: Alert[] }>()
  for (const a of alerts) {
    const key = a.deviceId ?? NO_BOARD_KEY
    if (!map.has(key)) {
      const title =
        a.deviceId === null
          ? 'Cảnh báo khác'
          : a.deviceLabel ?? a.deviceName ?? 'Thiết bị không tên'
      map.set(key, { title, data: [] })
    }
    map.get(key)!.data.push(a)
  }
  return [...map.values()]
}

export default function AlertsScreen() {
  const router = useRouter()
  const { showToast } = useToast()
  const { data, isLoading, refetch } = useAlertList()
  const deviceAssignmentMap = useDeviceAssignmentMap()
  const alerts = data?.data ?? []

  const sections = useMemo(() => groupByBoard(alerts), [alerts])

  const [isRefreshing, setIsRefreshing] = useState(false)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try { await refetch() } finally { setIsRefreshing(false) }
  }, [refetch])

  const handleAlertPress = useCallback(
    (alert: Alert) => {
      if (!alert.deviceId) {
        showToast.info({ message: 'Cảnh báo này không gắn với thiết bị cụ thể.' })
        return
      }
      const found = deviceAssignmentMap.get(alert.deviceId)
      if (found) {
        router.push({
          pathname: '/(app)/farm/[assignmentId]',
          params: { assignmentId: found.assignmentId, milestoneId: found.milestoneId },
        })
        return
      }
      showToast.info({ message: 'Không tìm thấy thiết bị tương ứng. Mở danh sách trang trại.' })
      router.push('/(app)/(tabs)/farm')
    },
    [deviceAssignmentMap, router, showToast],
  )

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Cảnh báo</Text>
        <Text style={styles.subtitle}>Thông báo từ cảm biến</Text>
      </View>

      <View style={styles.body}>
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color='#2463EB' />
        ) : alerts.length === 0 ? (
          <EmptyState message='Không có cảnh báo nào' Icon={icons.emptyCartSvg} />
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(a) => a.id}
            renderItem={({ item }) => (
              <View style={styles.itemWrap}>
                <AlertCard item={item} onPress={() => handleAlertPress(item)} />
              </View>
            )}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <View style={styles.boardChip}>
                  <MaterialIcons name='memory' size={18} color='#2463EB' />
                  <Text style={styles.boardChipText}>{section.title}</Text>
                </View>
                <Text style={styles.sectionCount}>{section.data.length} cảnh báo</Text>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            SectionSeparatorComponent={() => <View style={{ height: 8 }} />}
            contentContainerStyle={styles.list}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor='#2463EB' />
            }
          />
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: '#FFFFFF' },
  title: { fontSize: 24, lineHeight: 32, color: '#111827', fontFamily: 'Inter_600SemiBold' },
  subtitle: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 2 },
  body: { flex: 1, backgroundColor: '#F3F4F6' },
  list: { padding: 16, paddingBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
  },
  boardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingLeft: 10,
    paddingRight: 14,
    paddingVertical: 7,
    borderRadius: 100,
  },
  boardChipText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#2463EB',
    fontFamily: 'Inter_700Bold',
  },
  sectionCount: {
    fontSize: 12,
    lineHeight: 16,
    color: '#9CA3AF',
    fontFamily: 'Inter_500Medium',
  },
  itemWrap: {
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E7EB',
  },
})
