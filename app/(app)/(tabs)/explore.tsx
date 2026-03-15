import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { FlashList } from '@shopify/flash-list'
import { Text } from '@/components/ui'

const ITEMS = Array.from({ length: 30 }, (_, i) => ({
  id: String(i + 1),
  title: `Item #${String(i + 1).padStart(2, '0')}`,
  subtitle: `Mô tả ngắn cho item số ${i + 1}`,
  tag: (['Hot', 'New', 'Sale', 'Featured'] as const)[i % 4],
}))

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  Hot: { bg: '#FEE2E2', text: '#DC2626' },
  New: { bg: '#DCFCE7', text: '#16A34A' },
  Sale: { bg: '#FEF9C3', text: '#CA8A04' },
  Featured: { bg: '#EFF6FF', text: '#2463EB' },
}

export default function ExploreScreen() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Khám phá</Text>
        <Text style={styles.subtitle}>Bấm vào item để xem chi tiết</Text>
      </View>

      <FlashList
        data={ITEMS}
        estimatedItemSize={76}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          const tag = TAG_COLORS[item.tag]
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => router.push(`/(app)/detail?id=${item.id}&title=${item.title}`)}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSub}>{item.subtitle}</Text>
              </View>
              <View style={[styles.tag, { backgroundColor: tag.bg }]}>
                <Text style={[styles.tagText, { color: tag.text }]}>{item.tag}</Text>
              </View>
            </TouchableOpacity>
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12, gap: 4 },
  title: { fontSize: 24, color: '#111827', fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  separator: { height: 8 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  cardContent: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 15, color: '#111827', fontFamily: 'Inter_500Medium' },
  cardSub: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: 12 },
  tagText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
})
