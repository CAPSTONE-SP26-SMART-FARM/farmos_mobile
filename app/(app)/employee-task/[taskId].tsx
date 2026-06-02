import { DailyLogHistoryCard } from '@/components/features/dailyLog/DailyLogHistoryCard'
import { ProgressUpdateSheet } from '@/components/features/dailyLog/ProgressUpdateSheet'
import { WindowBanner } from '@/components/features/dailyLog/WindowBanner'
import
    {
        EmptyState,
        PrimaryButton,
        Text,
        TopBar,
    } from '@/components/ui'
import { icons } from '@/constants/icon'
import { useDeleteDailyLog, useMyDailyLogsByTask } from '@/hooks/useDailyLog'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useUpdateTaskProgress } from '@/hooks/useEmployeeTask'
import { useToast } from '@/hooks/useToast'
import type { DailyLog } from '@/types/dailyLog'
import { isWithinDailyLogWindow } from '@/utils/dailyLogWindow'
import { getDailyLogErrorMessage, getErrorMessage } from '@/utils/error'
import { getProgressColor } from '@/utils/progressColor'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import
    {
        ActivityIndicator,
        Alert,
        FlatList,
        Pressable,
        RefreshControl,
        StyleSheet,
        TextInput,
        TouchableOpacity,
        View,
    } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const PRIORITY_COLOR: Record<string, string> = {
  low: '#6B7280',
  normal: '#15803D',
  high: '#D97706',
  urgent: '#DC2626',
}
const PRIORITY_LABEL: Record<string, string> = {
  low: 'Thấp',
  normal: 'Bình thường',
  high: 'Cao',
  urgent: 'Khẩn cấp',
}

export default function EmployeeTaskDetailScreen() {
  const router = useRouter()
  const { taskId, title, priority, progress, description } = useLocalSearchParams<{
    taskId: string
    title?: string
    priority?: string
    progress?: string
    description?: string
  }>()
  const { showToast } = useToast()

  const initialProgress = Math.max(0, Math.min(100, Math.round(Number(progress ?? 0))))
  const [progressValue, setProgressValue] = useState(initialProgress)
  const progressColor = getProgressColor(progressValue)
  const priorityColor = PRIORITY_COLOR[priority ?? ''] ?? '#15803D'

  const [searchText, setSearchText] = useState('')
  const debouncedSearch = useDebouncedValue(searchText.trim(), 400)
  const isDebouncing = searchText.trim() !== debouncedSearch

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMyDailyLogsByTask(taskId, debouncedSearch)

  const logs: DailyLog[] = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  )
  const totalItems = data?.pages[0]?.meta.totalItems ?? 0

  const [isRefreshing, setIsRefreshing] = useState(false)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }, [refetch])

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Window state — re-check mỗi phút để label đổi khi qua 17:00
  const [inWindow, setInWindow] = useState(isWithinDailyLogWindow())
  useEffect(() => {
    const id = setInterval(() => setInWindow(isWithinDailyLogWindow()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Progress edit
  const [isProgressSheetOpen, setProgressSheetOpen] = useState(false)
  const { mutateAsync: updateProgress, isPending: isUpdatingProgress } = useUpdateTaskProgress()
  const handleConfirmProgress = async (next: number) => {
    if (next === progressValue) {
      setProgressSheetOpen(false)
      return
    }
    try {
      await updateProgress({ id: taskId, body: { progress: next } })
      setProgressValue(next)
      setProgressSheetOpen(false)
      showToast.success({ message: `Đã cập nhật tiến độ: ${next}%` })
    } catch (err) {
      const msg =
        getDailyLogErrorMessage(err) ?? getErrorMessage(err, 'Không thể cập nhật tiến độ')
      showToast.error({ message: msg })
    }
  }

  const handleCreateLog = () => {
    router.push({
      pathname: '/(app)/daily-log/[taskId]',
      params: {
        taskId,
        title: title ?? '',
        priority: priority ?? '',
      },
    })
  }

  // Edit / Delete log (chỉ cho log hôm nay)
  const { mutateAsync: deleteLog, isPending: isDeleting } = useDeleteDailyLog()
  const handleEditLog = useCallback(
    (log: DailyLog) => {
      router.push({
        pathname: '/(app)/daily-log/edit/[logId]',
        params: { logId: log.id, taskId, title: title ?? '' },
      })
    },
    [router, taskId, title],
  )
  const handleDeleteLog = useCallback(
    (log: DailyLog) => {
      if (!isWithinDailyLogWindow()) {
        showToast.error({
          message: 'Ngoài khung giờ làm việc. Chỉ xóa nhật ký trong 07:00–17:00.',
        })
        return
      }
      Alert.alert(
        'Xóa nhật ký?',
        'Bạn có chắc muốn xóa nhật ký này? Hành động này không thể hoàn tác.',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xóa',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteLog(log.id)
                showToast.success({ message: 'Đã xóa nhật ký' })
              } catch (err) {
                const msg =
                  getDailyLogErrorMessage(err) ??
                  getErrorMessage(err, 'Không thể xóa nhật ký')
                showToast.error({ message: msg })
              }
            },
          },
        ],
      )
    },
    [deleteLog, showToast],
  )

  const renderItem = useCallback(
    ({ item }: { item: DailyLog }) => (
      <DailyLogHistoryCard
        log={item}
        onEdit={inWindow ? handleEditLog : undefined}
        onDelete={inWindow ? handleDeleteLog : undefined}
      />
    ),
    [inWindow, handleEditLog, handleDeleteLog],
  )

  const renderFooter = () => {
    if (isFetchingNextPage) return <ActivityIndicator style={styles.footer} color='#15803D' />
    if (!hasNextPage && logs.length > 0) {
      return <Text style={styles.endText}>Đã xem hết</Text>
    }
    return null
  }

  const ListHeader = (
    <View>
      <View style={styles.bannerWrap}>
        <WindowBanner />
      </View>
      <TouchableOpacity
        style={styles.taskCard}
        activeOpacity={0.85}
        onPress={() => setProgressSheetOpen(true)}
      >
        <Text style={styles.taskTitle} numberOfLines={3}>{title || 'Công việc'}</Text>

        <View style={styles.metaRow}>
          {priority ? (
            <View style={styles.metaItem}>
              <Text style={styles.metaCaption}>Độ ưu tiên:</Text>
              <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
              <Text style={[styles.priorityLabel, { color: priorityColor }]}>
                {PRIORITY_LABEL[priority] ?? priority}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.progressRow}>
          <Text style={styles.metaCaption}>Tiến độ:</Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressValue}%`, backgroundColor: progressColor },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: progressColor }]}>{progressValue}%</Text>
          <Ionicons name='create-outline' size={14} color='#6B7280' />
        </View>

        {description ? (
          <Text style={styles.description} numberOfLines={6}>
            {description}
          </Text>
        ) : null}
      </TouchableOpacity>

      <View style={styles.logsHeader}>
        <Text style={styles.sectionTitle}>Nhật ký công việc</Text>
        <Text style={styles.sectionCount}>
          {totalItems > 0 ? `${totalItems} bản ghi` : ''}
        </Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name='search-outline' size={18} color='#9CA3AF' />
        <TextInput
          style={styles.searchInput}
          placeholder='Tìm trong nội dung, ghi chú...'
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
    </View>
  )

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <TopBar title='Chi tiết công việc' />

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[
          styles.list,
          logs.length === 0 && styles.listEmpty,
        ]}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor='#15803D'
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator style={{ marginTop: 24 }} color='#15803D' />
          ) : isError ? (
            <EmptyState
              message='Không tải được nhật ký. Vui lòng kéo xuống để thử lại.'
              Icon={icons.emptyCartSvg}
            />
          ) : debouncedSearch ? (
            <EmptyState
              message={`Không tìm thấy nhật ký khớp với "${debouncedSearch}".`}
              Icon={icons.emptySearchSvg}
            />
          ) : (
            <EmptyState
              message='Công việc này chưa có nhật ký nào.'
              Icon={icons.diarySvg}
            />
          )
        }
        showsVerticalScrollIndicator={false}
      />

      <SafeAreaView edges={['bottom']} style={styles.fabWrap}>
        <PrimaryButton
          title={inWindow ? 'Tạo nhật ký' : 'Ngoài giờ làm việc (07:00–17:00)'}
          onPress={handleCreateLog}
          disabled={!inWindow || isDeleting}
          style={styles.fab}
        />
      </SafeAreaView>

      <ProgressUpdateSheet
        visible={isProgressSheetOpen}
        initialValue={progressValue}
        isSubmitting={isUpdatingProgress}
        onClose={() => setProgressSheetOpen(false)}
        onConfirm={handleConfirmProgress}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },

  list: { padding: 16, paddingBottom: 120 },
  listEmpty: { flexGrow: 1 },

  bannerWrap: { marginBottom: 12 },

  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  taskTitle: {
    fontSize: 17,
    lineHeight: 24,
    color: '#111827',
    fontFamily: 'Inter_700Bold',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaCaption: { fontSize: 12, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priorityLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter_700Bold',
    minWidth: 38,
    textAlign: 'right',
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: '#4B5563',
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },

  logsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    color: '#111827',
    fontFamily: 'Inter_700Bold',
  },
  sectionCount: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter_500Medium',
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#111827',
    padding: 0,
  },

  footer: { marginVertical: 16 },
  endText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginVertical: 16,
  },

  fabWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  fab: { paddingVertical: 14 },
})
