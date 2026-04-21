import { View, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'
import { Text } from '@/components/ui'
import { IncidentCard } from '@/components/features/incident/IncidentCard'
import { useIncidentList } from '@/hooks/useIncident'

export default function IncidentScreen() {
  const router = useRouter()
  const { data, isLoading, isError, refetch, isFetching } = useIncidentList()
  const tickets = data?.data ?? []

  useFocusEffect(
    useCallback(() => { refetch() }, [refetch])
  )

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Sự cố</Text>
          <Text style={styles.subtitle}>{tickets.length} báo cáo</Text>
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push('/(app)/incident/create')}
        >
          <Text style={styles.createBtnText}>+ Tạo mới</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2463EB" />
      ) : isError ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Không thể tải dữ liệu.</Text>
          <TouchableOpacity onPress={refetch} style={styles.retryBtn}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : tickets.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Chưa có sự cố nào được báo cáo.</Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          onRefresh={refetch}
          refreshing={isFetching}
          renderItem={({ item }) => (
            <IncidentCard
              item={item}
              onPress={() => router.push(`/(app)/incident/${item.id}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16,
  },
  title: { fontSize: 24, color: '#111827', fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 2 },
  createBtn: {
    backgroundColor: '#2463EB', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 10,
  },
  createBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#EFF6FF', borderRadius: 8 },
  retryText: { color: '#2463EB', fontFamily: 'Inter_500Medium', fontSize: 14 },
})
