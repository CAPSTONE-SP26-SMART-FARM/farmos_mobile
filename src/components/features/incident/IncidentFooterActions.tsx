import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'

interface IncidentFooterActionsProps {
  isClosed: boolean
  canAccept: boolean
  canChat: boolean
  canResolve: boolean
  waitingForDoctor: boolean
  isAccepting: boolean
  isEnding: boolean
  onAccept: () => void
  onOpenChat: () => void
  onResolve: () => void
}

export function IncidentFooterActions({
  isClosed, canAccept, canChat, canResolve, waitingForDoctor,
  isAccepting, isEnding,
  onAccept, onOpenChat, onResolve,
}: IncidentFooterActionsProps) {
  if (isClosed) {
    return (
      <View style={styles.wrap}>
        <View style={[styles.btn, styles.btnDisabled]}>
          <Text style={[styles.btnText, { color: '#6B7280' }]}>✓ Sự cố đã đóng</Text>
        </View>
      </View>
    )
  }

  if (canAccept) {
    return (
      <View style={styles.wrap}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: '#10B981' }]}
          onPress={onAccept}
          disabled={isAccepting}
        >
          <Text style={styles.btnText}>
            {isAccepting ? '⏳ Đang tiếp nhận...' : '✓ Tiếp nhận sự cố'}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (canChat) {
    return (
      <View style={styles.wrap}>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.btn, { flex: 1 }, waitingForDoctor && styles.btnDisabled]}
            onPress={onOpenChat}
            disabled={waitingForDoctor}
          >
            <Text style={styles.btnText}>
              {waitingForDoctor ? '⏳ Chờ bác sĩ tiếp nhận...' : '💬 Trao đổi'}
            </Text>
          </TouchableOpacity>
          {canResolve && (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: '#10B981' }]}
              onPress={onResolve}
              disabled={isEnding}
            >
              <Text style={styles.btnText}>{isEnding ? '⏳' : '✓ Đã giải quyết'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  }

  return null
}

const styles = StyleSheet.create({
  wrap: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  row: { flexDirection: 'row', gap: 8 },
  btn: {
    backgroundColor: '#2463EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: '#E5E7EB' },
  btnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
})
