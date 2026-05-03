import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui'

interface Props {
  title: string
  onCancel: () => void
  onDone?: () => void
  doneLabel?: string
  canDone?: boolean
  cancelLabel?: string
}

export function SheetHeader({
  title, onCancel, onDone, doneLabel = 'Xong', canDone = true, cancelLabel = 'Hủy',
}: Props) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onCancel}
        style={({ pressed }) => [styles.pill, pressed && { opacity: 0.6 }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.cancel}>{cancelLabel}</Text>
      </Pressable>

      <Text style={styles.title}>{title}</Text>

      {onDone ? (
        <Pressable
          onPress={onDone}
          disabled={!canDone}
          style={({ pressed }) => [styles.pill, pressed && { opacity: 0.6 }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.done, canDone && styles.doneActive]}>{doneLabel}</Text>
        </Pressable>
      ) : (
        <View style={styles.pillPlaceholder} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  pill: {
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 20, backgroundColor: '#F3F4F6',
    minWidth: 64, alignItems: 'center',
  },
  pillPlaceholder: { minWidth: 64 + 40 },
  title: { fontSize: 17, lineHeight: 24, fontFamily: 'Inter_600SemiBold', color: '#111827' },
  cancel: { fontSize: 15, lineHeight: 22, color: '#111827', fontFamily: 'Inter_600SemiBold' },
  done: { fontSize: 15, lineHeight: 22, fontFamily: 'Inter_600SemiBold', color: '#9CA3AF' },
  doneActive: { color: '#2463EB' },
})
