import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { Text } from '@/components/ui'

interface IncidentFooterActionsProps {
  isClosed: boolean
  closedReason?: 'closed' | 'cancelled'
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
  /** Hiện nút xoá khi user là creator của ticket đã huỷ (issue 1). */
  canDelete?: boolean
  isDeleting?: boolean
  onDelete?: () => void
}

export function IncidentFooterActions({
  isClosed, closedReason, canAccept, canChat, waitingForDoctor,
  isDoctor, isAccepting,
  onAccept, onOpenChat,
  canCancel, isCancelling, onCancel,
  canClose, onClose,
  canResolve, onResolve,
  canDelete, isDeleting, onDelete,
}: IncidentFooterActionsProps) {
  if (isClosed) {
    // Phân biệt đóng (Hoàn tất) vs huỷ — text "đã đóng" generic gây confusion
    // khi user xem ticket đã huỷ (list hiển thị "Đã huỷ" mà detail nói "đã đóng").
    const label =
      closedReason === 'cancelled' ? 'Sự cố đã huỷ' : 'Sự cố đã hoàn tất'
    const showChat = canChat
    // Layout 3 nhánh:
    //   - Có canDelete (cancelled + creator) → label + Delete (cũ).
    //   - Có canChat (closed) → chat icon button + label fill.
    //   - Còn lại → label disabled full width.
    if (canDelete) {
      return (
        <View style={[styles.wrap, styles.wrapRow]}>
          {showChat ? (
            <TouchableOpacity style={styles.chatIconBtn} onPress={onOpenChat}>
              <MaterialIcons name='chat-bubble-outline' size={22} color='#15803D' />
            </TouchableOpacity>
          ) : null}
          <View style={[styles.btn, styles.btnDisabled, { flex: 1 }]}>
            <Text style={[styles.btnText, { color: '#6B7280' }]}>{label}</Text>
          </View>
          <TouchableOpacity
            style={[styles.btn, styles.btnCancel, { flex: 1 }]}
            onPress={onDelete}
            disabled={isDeleting}
          >
            <Text style={[styles.btnText, { color: '#DC2626' }]}>
              {isDeleting ? 'Đang xoá...' : 'Xoá sự cố'}
            </Text>
          </TouchableOpacity>
        </View>
      )
    }
    return (
      <View style={showChat ? [styles.wrap, styles.wrapRow] : styles.wrap}>
        {showChat ? (
          <TouchableOpacity style={styles.chatIconBtn} onPress={onOpenChat}>
            <MaterialIcons name='chat-bubble-outline' size={22} color='#15803D' />
          </TouchableOpacity>
        ) : null}
        <View style={[styles.btn, styles.btnDisabled, showChat && { flex: 1 }]}>
          <Text style={[styles.btnText, { color: '#6B7280' }]}>{label}</Text>
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
            <Text style={[styles.btnText, { color: '#15803D' }]}>Nhắn tin</Text>
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
      <View style={[styles.wrap, styles.wrapRow]}>
        {canChat && (
          <TouchableOpacity style={styles.chatIconBtn} onPress={onOpenChat}>
            <MaterialIcons name='chat-bubble-outline' size={22} color='#15803D' />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: '#10B981', flex: 1 }]}
          onPress={onClose}
        >
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
            {waitingForDoctor ? 'Chờ bác sĩ tiếp nhận...' : isDoctor ? 'Nhắn với nông dân' : 'Nhắn với bác sĩ'}
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
  // Icon-only chat button — dùng khi footer có action chính khác (Close/Disabled).
  // Vẫn cho user truy cập history chat sau khi ticket resolved/closed/cancelled.
  chatIconBtn: {
    width: 52, height: 52,
    borderRadius: 26,
    borderWidth: 1.5, borderColor: '#15803D',
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
})
