import { useState } from 'react'
import {
  View, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Text, TopBar, BottomSheet, PrimaryButton } from '@/components/ui'
import {
  useWithdrawalDetail, useCancelWithdrawal,
  useConfirmWithdrawalReceived, useReportWithdrawalNotReceived,
} from '@/hooks/useWithdrawals'
import { useToast } from '@/hooks/useToast'
import { WD_STATUS_META } from '@/constants/withdrawal'
import { formatVnd } from '@/utils/number'
import { formatDateTime } from '@/utils/date'
import type { WithdrawalRequest } from '@/types/withdrawal'


export default function WithdrawalDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data, isLoading } = useWithdrawalDetail(id || '')
  const { showToast } = useToast()
  const [reportSheetVisible, setReportSheetVisible] = useState(false)
  const [reportReason, setReportReason] = useState('')

  const { mutate: cancel, isPending: isCancelling } = useCancelWithdrawal(id || '')
  const { mutate: confirmReceived, isPending: isConfirming } = useConfirmWithdrawalReceived(id || '')
  const { mutate: reportNotReceived, isPending: isReporting } = useReportWithdrawalNotReceived(id || '')

  if (isLoading || !data) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
        <TopBar title='Chi tiết yêu cầu' />
        <ActivityIndicator color='#15803D' style={{ marginTop: 40 }} />
      </SafeAreaView>
    )
  }

  const meta = WD_STATUS_META[data.status]

  const handleCancel = () => {
    Alert.alert('Huỷ yêu cầu?', 'Số tiền sẽ được hoàn lại vào ví', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Huỷ yêu cầu', style: 'destructive',
        onPress: () => cancel(undefined, {
          onSuccess: () => {
            showToast.success({ message: 'Đã huỷ yêu cầu' })
            router.back()
          },
          onError: (err: any) => {
            const msg = err?.response?.data?.message || 'Không thể huỷ'
            showToast.error({ message: String(msg) })
          },
        }),
      },
    ])
  }

  const handleConfirmReceived = () => {
    Alert.alert('Xác nhận đã nhận tiền?', 'Yêu cầu sẽ chuyển sang Hoàn tất', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Đã nhận',
        onPress: () => confirmReceived(undefined, {
          onSuccess: () => showToast.success({ message: 'Cảm ơn xác nhận của bạn' }),
          onError: (err: any) => {
            const msg = err?.response?.data?.message || 'Không thể xác nhận'
            showToast.error({ message: String(msg) })
          },
        }),
      },
    ])
  }

  const handleSubmitReport = () => {
    if (reportReason.trim().length < 1) {
      showToast.error({ message: 'Vui lòng nhập lý do' })
      return
    }
    reportNotReceived(
      { reason: reportReason.trim() },
      {
        onSuccess: () => {
          showToast.success({ message: 'Đã gửi báo cáo' })
          setReportSheetVisible(false)
          setReportReason('')
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || 'Không thể báo cáo'
          showToast.error({ message: String(msg) })
        },
      }
    )
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <TopBar title='Chi tiết yêu cầu' />

      <ScrollView style={styles.body} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header card */}
        <View style={styles.headerCard}>
          <Text style={styles.amount}>{formatVnd(data.amount)}</Text>
          <View style={[styles.badge, { backgroundColor: meta.bg }]}>
            <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>

        {/* Bank info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài khoản nhận</Text>
          <Row label='Ngân hàng' value={data.snapshotBankName} />
          <Row label='Số tài khoản' value={data.snapshotAccountNumber} />
          <Row label='Chủ tài khoản' value={data.snapshotAccountHolder} />
          {data.snapshotBranch && <Row label='Chi nhánh' value={data.snapshotBranch} />}
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin xử lý</Text>
          <Row label='Ngày tạo' value={formatDateTime(data.createdAt)} />
          {data.reviewedAt && <Row label='Ngày duyệt' value={formatDateTime(data.reviewedAt)} />}
          {data.paidAt && <Row label='Ngày chuyển khoản' value={formatDateTime(data.paidAt)} />}
          {data.transferReference && <Row label='Mã giao dịch' value={data.transferReference} />}
          {data.confirmedAt && <Row label='Ngày xác nhận' value={formatDateTime(data.confirmedAt)} />}
          {data.rejectReason && <Row label='Lý do từ chối' value={data.rejectReason} />}
          {data.notReceivedReason && <Row label='Lý do báo chưa nhận' value={data.notReceivedReason} />}
        </View>

        {/* Note */}
        {data.doctorNote && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ghi chú của bạn</Text>
            <Text style={styles.note}>{data.doctorNote}</Text>
          </View>
        )}

        {/* Actions */}
        <ActionBar
          data={data}
          isCancelling={isCancelling}
          isConfirming={isConfirming}
          onCancel={handleCancel}
          onConfirmReceived={handleConfirmReceived}
          onReportNotReceived={() => setReportSheetVisible(true)}
        />
      </ScrollView>

      {/* Report not-received sheet */}
      <BottomSheet visible={reportSheetVisible} onClose={() => setReportSheetVisible(false)}>
        <BottomSheet.Header title='Báo chưa nhận tiền' onClose={() => setReportSheetVisible(false)} />
        <View style={styles.reportSheet}>
          <Text style={styles.reportLabel}>Vui lòng nhập lý do (tối thiểu 1 ký tự)</Text>
          <TextInput
            style={styles.reportInput}
            value={reportReason}
            onChangeText={setReportReason}
            placeholder='VD: Đã quá 24h chưa thấy tiền về'
            placeholderTextColor='#9CA3AF'
            multiline
            maxLength={2000}
          />
          <PrimaryButton title='Gửi báo cáo' onPress={handleSubmitReport} loading={isReporting} />
        </View>
      </BottomSheet>
    </SafeAreaView>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>{value}</Text>
    </View>
  )
}

function ActionBar({
  data, isCancelling, isConfirming, onCancel, onConfirmReceived, onReportNotReceived,
}: {
  data: WithdrawalRequest
  isCancelling: boolean
  isConfirming: boolean
  onCancel: () => void
  onConfirmReceived: () => void
  onReportNotReceived: () => void
}) {
  if (data.status === 'pending') {
    return (
      <TouchableOpacity style={styles.dangerBtn} onPress={onCancel} disabled={isCancelling}>
        <Text style={styles.dangerBtnText}>{isCancelling ? 'Đang huỷ...' : 'Huỷ yêu cầu'}</Text>
      </TouchableOpacity>
    )
  }
  if (data.status === 'paid') {
    return (
      <View style={{ gap: 10 }}>
        <PrimaryButton title='Tôi đã nhận tiền' onPress={onConfirmReceived} loading={isConfirming} />
        <TouchableOpacity style={styles.outlineBtn} onPress={onReportNotReceived}>
          <Text style={styles.outlineBtnText}>Báo chưa nhận</Text>
        </TouchableOpacity>
      </View>
    )
  }
  return null
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  body: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, gap: 12, paddingBottom: 32 },

  headerCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    paddingVertical: 20, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  amount: { fontSize: 22, fontFamily: 'Inter_600SemiBold', color: '#111827' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 12, fontFamily: 'Inter_500Medium' },

  section: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14,
    gap: 10,
  },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#111827', marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  rowLabel: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular', flex: 1 },
  rowValue: { fontSize: 13, color: '#111827', fontFamily: 'Inter_500Medium', flex: 1.5, textAlign: 'right' },
  note: { fontSize: 13, color: '#374151', fontFamily: 'Inter_400Regular', lineHeight: 20 },

  dangerBtn: {
    backgroundColor: '#FEE2E2', paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', marginTop: 4,
  },
  dangerBtnText: { color: '#991B1B', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  outlineBtn: {
    backgroundColor: '#FFFFFF', paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
  },
  outlineBtnText: { color: '#374151', fontSize: 15, fontFamily: 'Inter_500Medium' },

  reportSheet: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  reportLabel: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  reportInput: {
    minHeight: 100, padding: 12, borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, fontSize: 14, color: '#111827', fontFamily: 'Inter_400Regular',
    textAlignVertical: 'top',
  },
})
