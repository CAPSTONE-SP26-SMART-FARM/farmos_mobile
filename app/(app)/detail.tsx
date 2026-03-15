import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Text, PrimaryButton, SecondaryButton } from '@/components/ui'
import Ionicons from '@expo/vector-icons/Ionicons'

export default function DetailScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title: string }>()
  const router = useRouter()

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name='arrow-back' size={22} color='#111827' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {/* Placeholder image */}
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>Ảnh minh hoạ</Text>
        </View>

        <Text style={styles.idText}>ID: {id}</Text>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.description}>
          Màn hình detail — navigate từ FlashList qua Expo Router Stack. Params được truyền qua URL query string.
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <SecondaryButton title='Lưu lại' style={styles.actionBtn} onPress={() => {}} />
          <PrimaryButton title='Xem thêm' style={styles.actionBtn} onPress={() => {}} />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, color: '#111827', fontFamily: 'Inter_600SemiBold' },
  headerSpacer: { width: 36 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  imagePlaceholder: { height: 200, backgroundColor: '#F3F4F6', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderText: { fontSize: 14, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  idText: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  itemTitle: { fontSize: 22, color: '#111827', fontFamily: 'Inter_700Bold' },
  description: { fontSize: 14, color: '#6B7280', fontFamily: 'Inter_400Regular', lineHeight: 22 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 'auto', marginBottom: 16 },
  actionBtn: { flex: 1 },
})
