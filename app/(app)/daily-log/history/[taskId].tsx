import { useCallback, useMemo, useState } from 'react'
import {
  View,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Text, TopBar, EmptyState, useConfirm } from '@/components/ui'
import { DailyLogHistoryCard } from '@/components/features/dailyLog/DailyLogHistoryCard'
import { WindowBanner } from '@/components/features/dailyLog/WindowBanner'
import { useDeleteDailyLog, useMyDailyLogsByTask } from '@/hooks/useDailyLog'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useToast } from '@/hooks/useToast'
import { icons } from '@/constants/icon'
import type { DailyLog } from '@/types/dailyLog'
import { getWindowLabel } from '@/utils/dailyLogWindow'
import { useDailyLogWindow } from '@/hooks/useDailyLog'
import { getDailyLogErrorMessage, getErrorMessage, isOutOfWindowError } from '@/utils/error'

export default function DailyLogHistoryScreen() {
  const router = useRouter()
  const { showToast } = useToast()
  const confirm = useConfirm()
  const { taskId, title } = useLocalSearchParams<{ taskId: string; title?: string }>()

  const { window: dailyWindow, isOpen: inWindow, refreshWindow } = useDailyLogWindow()
  const windowLabel = getWindowLabel(dailyWindow)

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
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const { mutateAsync: deleteLog } = useDeleteDailyLog()
  const handleEdit = useCallback(
    (log: DailyLog) => {
      router.push({
        pathname: '/(app)/daily-log/edit/[logId]',
        params: { logId: log.id, taskId, title: title ?? '' },
      })
    },
    [router, taskId, title],
  )
  const handleDelete = useCallback(
    async (log: DailyLog) => {
      if (!inWindow) {
        showToast.error({
          message: `Ngoài khung giờ làm việc. Chỉ xóa nhật ký trong ${windowLabel}.`,
        })
        return
      }
      const choice = await confirm.show({
        title: 'Xoá nhật ký?',
        message: 'Bạn có chắc muốn xoá nhật ký này? Hành động không thể hoàn tác.',
        icon: 'warning',
        actions: [
          { key: 'cancel', label: 'Huỷ', variant: 'cancel' },
          { key: 'delete', label: 'Xoá', variant: 'destructive' },
        ],
      })
      if (choice !== 'delete') return
      try {
        await deleteLog(log.id)
        showToast.success({ message: 'Đã xoá nhật ký' })
      } catch (err) {
        if (isOutOfWindowError(err)) refreshWindow()
        const msg =
          getDailyLogErrorMessage(err) ??
          getErrorMessage(err, 'Không thể xoá nhật ký')
        showToast.error({ message: msg })
      }
    },
    [deleteLog, showToast, confirm],
  )

  const renderItem = useCallback(
    ({ item }: { item: DailyLog }) => (
      <DailyLogHistoryCard
        log={item}
        onEdit={inWindow ? handleEdit : undefined}
        onDelete={inWindow ? handleDelete : undefined}
      />
    ),
    [inWindow, handleEdit, handleDelete],
  )

  const renderFooter = () => {
    if (isFetchingNextPage) {
      return <ActivityIndicator style={styles.footer} color='#2463EB' />
    }
    if (!hasNextPage && logs.length > 0) {
      return <Text style={styles.endText}>Đã xem hết</Text>
    }
    return null
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <TopBar
        title='Lịch sử nhật ký'
        subtitle={title || (totalItems > 0 ? `${totalItems} bản ghi` : undefined)}
      />

      <View style={styles.searchWrap}>
        <View style={styles.bannerWrap}>
          <WindowBanner compact />
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

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
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
            tintColor='#2463EB'
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color='#2463EB' />
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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  searchWrap: { paddingHorizontal: 16, paddingTop: 10, backgroundColor: '#FFFFFF', paddingBottom: 10, gap: 10 },
  bannerWrap: {},
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
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#111827',
    padding: 0,
  },
  list: { padding: 16, paddingBottom: 40 },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  footer: { marginVertical: 16 },
  endText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginVertical: 16,
  },
})
