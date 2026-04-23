import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Text } from './Text'

interface TopBarProps {
  title?: string
  onBack?: () => void
  right?: React.ReactNode
}

export function TopBar({ title, onBack, right }: TopBarProps) {
  const router = useRouter()
  const handleBack = onBack ?? (() => router.back())
  return (
    <View style={styles.topBar}>
      <TouchableOpacity onPress={handleBack} hitSlop={8}>
        <Text style={styles.back}>← Quay lại</Text>
      </TouchableOpacity>
      {title ? <Text style={styles.title}>{title}</Text> : <View />}
      <View style={styles.right}>{right}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  back: { fontSize: 15, color: '#2463EB', fontFamily: 'Inter_500Medium' },
  title: { fontSize: 16, color: '#111827', fontFamily: 'Inter_700Bold' },
  right: { minWidth: 60, alignItems: 'flex-end' },
})
