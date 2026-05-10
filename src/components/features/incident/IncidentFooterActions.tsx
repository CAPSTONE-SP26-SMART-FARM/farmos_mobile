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
      <View style={[styles.wrap, styles.wrapStack]}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#7C3AED' }]} onPress={onResolve}>
          <Text style={styles.btnText}>Giải quyết & Kê đơn thuốc</Text>
        </TouchableOpacity>
        {canChat && (
          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onOpenChat}>
            <Text style={[styles.btnText, { color: '#2463EB' }]}>Chat với Farmer</Text>
          </TouchableOpacity>
        )}
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
    backgroundColor: '#2463EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: '#E5E7EB' },
  btnCancel: { backgroundColor: '#FEF2F2' },
  btnSecondary: { backgroundColor: '#EFF6FF' },
  btnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  wrapStack: { gap: 8 },
})
