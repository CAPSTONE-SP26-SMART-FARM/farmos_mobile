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
  canCancel?: boolean
  isCancelling?: boolean
  onCancel?: () => void
  canClose?: boolean
  onClose?: () => void
  canResolve?: boolean
  onResolve?: () => void
}

export function IncidentFooterActions({
  isClosed, canAccept, canChat, waitingForDoctor,
  isDoctor, isAccepting,
  onAccept, onOpenChat,
  canCancel, isCancelling, onCancel,
  canClose, onClose,
  canResolve, onResolve,
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

  if (canResolve) {
    return (
      <View style={[styles.wrap, styles.wrapRow]}>
        {canChat && (
          <TouchableOpacity style={[styles.btn, styles.btnOutline, styles.btnChat]} onPress={onOpenChat}>
            <Text style={[styles.btnText, { color: '#15803D' }]}>Chat</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.btn, styles.btnResolve]} onPress={onResolve}>
          <Text style={styles.btnText}>Giải quyết & Kê đơn</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (canClose) {
    return (
      <View style={styles.wrap}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#10B981' }]} onPress={onClose}>
          <Text style={styles.btnText}>Đóng & Đánh giá</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (canCancel) {
    return (
      <View style={styles.wrap}>
        <TouchableOpacity
          style={[styles.btn, styles.btnCancel]}
          onPress={onCancel}
          disabled={isCancelling}
        >
          <Text style={[styles.btnText, { color: '#DC2626' }]}>
            {isCancelling ? 'Đang hủy...' : 'Hủy sự cố'}
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
    backgroundColor: '#15803D',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: '#E5E7EB' },
  btnCancel: { backgroundColor: '#FEF2F2' },
  btnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  wrapRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  btnResolve: { flex: 1, backgroundColor: '#15803D' },
  btnOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#15803D',
  },
  btnChat: { paddingHorizontal: 24 },
})
