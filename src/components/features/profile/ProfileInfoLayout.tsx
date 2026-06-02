import type { ReactNode } from 'react'
import { ScrollView, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, type Href } from 'expo-router'
import { TopBar } from '@/components/ui'
import { icons } from '@/constants/icon'

const EditIcon = icons.editNoBackgroundSvg

interface Props {
  editPath: Href
  children: ReactNode
}

export function ProfileInfoLayout({ editPath, children }: Props) {
  const router = useRouter()
  return (
    <SafeAreaView style={styles.safe}>
      <TopBar
        title='Quản lý hồ sơ'
        right={
          <Pressable
            style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.6 }]}
            onPress={() => router.push(editPath)}
            hitSlop={10}
          >
            <EditIcon width={16} height={16} />
          </Pressable>
        }
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  )
}

// Shared styles for profile info row screens — import alongside ProfileInfoLayout
export const s = StyleSheet.create({
  section: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
  },
  sectionTitle: {
    fontSize: 16, lineHeight: 24, color: '#111827',
    fontFamily: 'Inter_600SemiBold', marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingVertical: 8,
  },
  infoLabel: { fontSize: 14, color: '#6B7280', fontFamily: 'Inter_400Regular', lineHeight: 20 },
  infoValue: {
    fontSize: 14, color: '#111827', fontFamily: 'Inter_500Medium',
    textAlign: 'right', flex: 1, lineHeight: 20, marginLeft: 16,
  },
  infoValueGray: { color: '#9CA3AF' },
  divider: { height: 1, backgroundColor: '#E5E7EB' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  emptyText: {
    fontSize: 14, color: '#9CA3AF', fontFamily: 'Inter_400Regular',
    lineHeight: 20, paddingVertical: 8,
  },
})

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  editBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
  scroll: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 16, paddingBottom: 32, gap: 12 },
})
