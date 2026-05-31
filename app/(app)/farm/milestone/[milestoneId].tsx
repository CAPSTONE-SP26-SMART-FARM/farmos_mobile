import { useState, useCallback } from 'react'
import {
  View, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl, Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { Text, TopBar, EmptyState, TextField } from '@/components/ui'
import { useFarmerMilestoneAssignments } from '@/hooks/useFarmerMilestones'
import { icons } from '@/constants/icon'

export default function MilestoneAssignmentsScreen() {
  const router = useRouter()
  const { milestoneId, stageName } = useLocalSearchParams<{
    milestoneId: string
    stageName?: string
  }>()
  const [q, setQ] = useState('')
  const [searchVisible, setSearchVisible] = useState(false)

  const { data, isLoading, refetch } = useFarmerMilestoneAssignments(milestoneId ?? '', {
    page: 1,
    limit: 50,
    q: q.trim() || undefined,
  })
  const assignments = data?.data ?? []

  const [isRefreshing, setIsRefreshing] = useState(false)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try { await refetch() } finally { setIsRefreshing(false) }
  }, [refetch])

  const toggleSearch = () => {
    setSearchVisible((v) => {
      if (v) setQ('')
      return !v
    })
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <TopBar
        title={stageName ?? 'Thiết bị giai đoạn'}
        right={
          <Pressable
            onPress={toggleSearch}
            hitSlop={10}
            style={({ pressed }) => [styles.searchBtn, pressed && styles.searchBtnActive]}
          >
            <MaterialIcons
              name={searchVisible ? 'close' : 'search'}
              size={22}
              color='#4B5563'
            />
          </Pressable>
        }
      />

      {searchVisible && (
        <View style={styles.searchBar}>
          <TextField
            label='Tìm theo mã kit (K001, W002...)'
            value={q}
            onChangeText={setQ}
            showError={false}
            autoFocus
          />
        </View>
      )}

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor='#15803D' />
        }
      >
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color='#15803D' />
        ) : assignments.length === 0 ? (
          <EmptyState message='Giai đoạn này chưa gắn thiết bị.' Icon={icons.emptyCartSvg} />
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
                    params: { assignmentId: a.assignmentId, milestoneId: milestoneId ?? '' },
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
                  <Text style={styles.cardSubtitle}>{a.sensors.length} cảm biến</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  searchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  searchBtnActive: { backgroundColor: '#E5E7EB' },
  searchBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
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
  cardContent: { flex: 1 },
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
  cardSubtitle: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 4 },
  chevron: { fontSize: 22, color: '#9CA3AF' },
})
