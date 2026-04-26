import { View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { Text, PrimaryButton, SecondaryButton, TopBar } from '@/components/ui'

export default function DetailScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title: string }>()

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title='Chi tiết' />

      <View style={styles.content}>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>Ảnh minh hoạ</Text>
        </View>

        <Text style={styles.idText}>ID: {id}</Text>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.description}>
          Màn hình detail — navigate từ FlashList qua Expo Router Stack. Params được truyền qua URL query string.
        </Text>

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
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  imagePlaceholder: { height: 200, backgroundColor: '#F3F4F6', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderText: { fontSize: 14, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  idText: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  itemTitle: { fontSize: 22, color: '#111827', fontFamily: 'Inter_700Bold' },
  description: { fontSize: 14, color: '#6B7280', fontFamily: 'Inter_400Regular', lineHeight: 22 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 'auto', marginBottom: 16 },
  actionBtn: { flex: 1 },
})
