import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Text } from '@/components/ui'

interface IncidentFooterActionsProps {
  isClosed: boolean
  canAccept: boolean
  canChat: boolean
  waitingForDoctor: boolean
  isDoctor: boolean
  isAccepting: boolean
  onAccept: () => void
  onOpenChat: () => void
}

export function IncidentFooterActions({
  isClosed, canAccept, canChat, waitingForDoctor,
  isDoctor, isAccepting,
  onAccept, onOpenChat,
}: IncidentFooterActionsProps) {
  if (isClosed) {
    return (
      <View style={styles.wrap}>
        <View style={[styles.btn, styles.btnDisabled]}>
          <Text style={[styles.btnText, { color: '#6B7280' }]}>Sự cố đã đóng</Text>
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
            {isAccepting ? 'Đang tiếp nhận...' : 'Tiếp nhận sự cố'}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (canChat) {
    return (
      <View style={styles.wrap}>
        <TouchableOpacity
          style={[styles.btn, waitingForDoctor && styles.btnDisabled]}
          onPress={onOpenChat}
          disabled={waitingForDoctor}
        >
          <Text style={styles.btnText}>
            {waitingForDoctor ? 'Chờ bác sĩ tiếp nhận...' : isDoctor ? 'Chat với Farmer' : 'Chat với Bác sĩ'}
          </Text>
        </TouchableOpacity>
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
