import { View, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { Text } from './Text'

interface TopBarProps {
  title?: string
  subtitle?: string
  onBack?: () => void
  right?: React.ReactNode
  showBack?: boolean
}

export function TopBar({ title, subtitle, onBack, right, showBack = true }: TopBarProps) {
  const router = useRouter()
  const handleBack = onBack ?? (() => router.back())

  return (
    <View style={styles.topBar}>
      <View style={styles.side}>
        {showBack && (
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnActive]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name='arrow-back-ios-new' size={22} color='#4B5563' />
          </Pressable>
        )}
      </View>

      <View style={styles.center}>
        {title ? <Text style={styles.title} numberOfLines={1}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>

      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  side: {
    width: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sideRight: {
    justifyContent: 'flex-end',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnActive: {
    backgroundColor: '#F3F4F6',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    color: '#111827',
    fontFamily: 'Inter_600SemiBold',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
})
