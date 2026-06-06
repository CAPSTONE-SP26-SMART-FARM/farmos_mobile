import { useEffect, useRef, useState } from 'react'
import { View, StyleSheet, Pressable, TouchableOpacity, useWindowDimensions } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { Text, TextField } from '@/components/ui'
import { SheetHeader } from '@/components/features/incident/SheetHeader'
import { useResolveTicket } from '@/hooks/useTicketLifecycle'
import { useToast } from '@/hooks/useToast'
import { extractApiError, getErrorMessage } from '@/utils/error'
import { useResolveStore } from '@/stores/resolveStore'
import { usePreventUnsavedChanges } from '@/hooks/usePreventUnsavedChanges'
import type { RxItem } from '@/stores/resolveStore'
import type { PrescriptionItemInput } from '@/types/medicine'

const MIN_FIELD_LENGTH = 20

const FIELD_LABELS = [
  {
    key: 'rootCause' as const,
    label: 'Vấn đề gốc rễ',
    hint: 'Mô tả vấn đề chính cây trồng đang gặp. Ví dụ: "Nấm đốm lá do độ ẩm cao".',
  },
  {
    key: 'rootCauseReason' as const,
    label: 'Nguyên nhân vì sao',
    hint: 'Giải thích vì sao vấn đề xảy ra. Ví dụ: "Tưới quá nhiều, thoát nước kém".',
  },
  {
    key: 'treatment' as const,
    label: 'Cách giải quyết',
    hint: 'Hướng dẫn xử lý cụ thể. Ví dụ: "Phun thuốc X 2 lần/tuần trong 10 ngày".',
  },
  {
    key: 'prevention' as const,
    label: 'Cách phòng tránh tái phát',
    hint: 'Biện pháp lâu dài để tránh tái phát. Ví dụ: "Cải thiện thoát nước, giảm mật độ trồng".',
  },
]

// Đơn thuốc đủ thông tin khi có liều lượng, tần suất và hướng dẫn sử dụng ≥ 30 ký tự.
const isRxItemComplete = (item: RxItem) =>
  !!item.dosage && !!item.frequency && item.usageInstructions.trim().length >= 30

// Phần cố định phía trên vùng scroll (status bar + grabber + SheetHeader) mà formSheet không phủ.
// Trừ khỏi screenHeight để ScrollView biết đúng vùng scrollable.
const HEADER_HEIGHT = 160

type FieldKey = (typeof FIELD_LABELS)[number]['key']
type FieldErrors = Partial<Record<FieldKey, string>>

// Map path BE có thể trả về → key của form. Hỗ trợ cả dotted path
// (`prescription.items[0].usageInstructions`) bằng cách match prefix.
const BE_FIELD_PATH_MAP: Record<string, FieldKey> = {
  rootCause: 'rootCause',
  rootCauseReason: 'rootCauseReason',
  treatment: 'treatment',
  prevention: 'prevention',
}

export default function ResolveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { height: screenHeight } = useWindowDimensions()
  const { showToast } = useToast()
  const { mutate: resolve, isPending } = useResolveTicket(id)

  const store = useResolveStore()
  const { rootCause, rootCauseReason, treatment, prevention, items, setField, setTicketId, removeItem, reset } = store

  // Reset store khi vào resolve cho ticket khác
  useEffect(() => {
    if (store.ticketId !== id) {
      reset()
      setTicketId(id)
    }
  }, [id])

  const isDirty =
    rootCause.length > 0 ||
    rootCauseReason.length > 0 ||
    treatment.length > 0 ||
    prevention.length > 0 ||
    items.length > 0
  const justSavedRef = useRef(false)
  usePreventUnsavedChanges(isDirty && !justSavedRef.current && !isPending, {
    message: 'Bạn đang nhập giải pháp. Thoát ra sẽ mất các thay đổi.',
    onBeforeExit: () => { reset() },
  })

  // Đủ điều kiện gửi: 4 field bắt buộc đủ độ dài + có đơn thuốc và mọi đơn đã đủ thông tin.
  const allFieldsValid = FIELD_LABELS.every(({ key }) => store[key].trim().length >= MIN_FIELD_LENGTH)
  const allItemsComplete = items.length > 0 && items.every(isRxItemComplete)
  const canSubmit = allFieldsValid && allItemsComplete

  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const resetErrors = () => {
    setErrors({})
    setServerError(null)
  }

  const validateLocal = (): boolean => {
    const next: FieldErrors = {}
    for (const { key, label } of FIELD_LABELS) {
      const val = store[key].trim()
      if (val.length === 0) {
        next[key] = `Vui lòng nhập ${label.toLowerCase()}`
      } else if (val.length < MIN_FIELD_LENGTH) {
        next[key] = `${label} cần tối thiểu ${MIN_FIELD_LENGTH} ký tự (hiện tại ${val.length})`
      }
    }
    setErrors(next)
    if (Object.keys(next).length > 0) {
      const msg = 'Vui lòng điền đầy đủ thông tin còn thiếu'
      setServerError(msg)
      showToast.error({ message: msg })
      return false
    }
    if (items.length === 0) {
      const msg = 'Vui lòng thêm ít nhất một loại thuốc cho đơn thuốc'
      setServerError(msg)
      showToast.error({ message: msg })
      return false
    }
    for (const item of items) {
      if (!isRxItemComplete(item)) {
        const msg = `Vui lòng nhập đủ thông tin sử dụng cho "${item._displayName}"`
        setServerError(msg)
        showToast.error({ message: msg })
        return false
      }
    }
    return true
  }

  const handleFieldChange = (key: FieldKey, value: string) => {
    setField(key, value)
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
    if (serverError) setServerError(null)
  }

  const handleSubmit = () => {
    resetErrors()
    if (!validateLocal()) return
    const payloadItems: PrescriptionItemInput[] = items.map(({ _displayName, ...rest }) => rest)
    resolve(
      {
        rootCause: rootCause.trim(),
        rootCauseReason: rootCauseReason.trim(),
        treatment: treatment.trim(),
        prevention: prevention.trim(),
        prescription: payloadItems.length > 0 ? { items: payloadItems } : undefined,
      },
      {
        onSuccess: () => {
          showToast.success({ message: 'Đã gửi giải pháp thành công' })
          justSavedRef.current = true
          reset()
          router.back()
        },
        onError: (err) => {
          const ex = extractApiError(err)

          // Map field-level errors BE trả về đúng input của form.
          const nextField: FieldErrors = {}
          for (const [path, message] of Object.entries(ex.fieldErrors)) {
            const directKey = BE_FIELD_PATH_MAP[path]
            if (directKey) {
              nextField[directKey] = message
              continue
            }
            // Match prefix cho dotted path (vd "rootCause.length")
            const prefixMatch = Object.keys(BE_FIELD_PATH_MAP).find(
              (k) => path === k || path.startsWith(`${k}.`) || path.startsWith(`${k}[`),
            )
            if (prefixMatch) nextField[BE_FIELD_PATH_MAP[prefixMatch]] = message
          }
          setErrors(nextField)

          const banner = ex.isNetworkError
            ? 'Mất kết nối mạng. Vui lòng thử lại.'
            : getErrorMessage(err, 'Gửi giải pháp thất bại. Vui lòng thử lại.')
          setServerError(banner)
          showToast.error({ message: banner })
        },
      }
    )
  }

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.container}>
      <Stack.Screen options={{ gestureEnabled: !isDirty }} />
      <SheetHeader
        title='Giải quyết sự cố'
        onCancel={() => router.back()}
        onDone={handleSubmit}
        doneLabel={isPending ? 'Đang gửi…' : 'Xong'}
        canDone={canSubmit && !isPending}
      />

      <KeyboardAwareScrollView
        style={[styles.scrollView, { height: screenHeight - HEADER_HEIGHT }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
        enableOnAndroid
        extraHeight={150}
      >
        {serverError ? (
          <View style={styles.errorBanner}>
            <MaterialIcons name='error-outline' size={18} color='#B91C1C' />
            <Text style={styles.errorBannerText}>{serverError}</Text>
          </View>
        ) : null}

        {/* Solution 4 fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Giải pháp</Text>
          <Text style={styles.sectionSubtitle}>
            Mỗi mục cần tối thiểu {MIN_FIELD_LENGTH} ký tự để bà con/người dùng hiểu rõ.
          </Text>
          <View style={styles.fields}>
            {FIELD_LABELS.map(({ key, label, hint }) => {
              const val = store[key]
              const trimmedLen = val.trim().length
              const fieldError = errors[key]
              const remaining = MIN_FIELD_LENGTH - trimmedLen
              const isValid = trimmedLen >= MIN_FIELD_LENGTH

              return (
                <View key={key}>
                  <TextField
                    label={`${label} *`}
                    value={val}
                    onChangeText={(v) => handleFieldChange(key, v)}
                    showClear={false}
                    showError={false}
                    error={fieldError}
                    multiline
                    numberOfLines={3}
                    inputStyle={styles.textarea}
                  />
                  {fieldError ? (
                    <View style={styles.feedbackRow}>
                      <MaterialIcons name='error-outline' size={14} color='#DC2828' />
                      <Text style={styles.errorText}>{fieldError}</Text>
                    </View>
                  ) : isValid ? (
                    <View style={styles.feedbackRow}>
                      <MaterialIcons name='check-circle' size={14} color='#15803D' />
                      <Text style={styles.successText}>
                        Đã đủ thông tin ({trimmedLen} ký tự)
                      </Text>
                    </View>
                  ) : trimmedLen > 0 ? (
                    <View style={styles.feedbackRow}>
                      <MaterialIcons name='info-outline' size={14} color='#B45309' />
                      <Text style={styles.warnText}>
                        Còn cần {remaining} ký tự nữa
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.hint}>{hint}</Text>
                  )}
                </View>
              )
            })}
          </View>
        </View>

        {/* Prescription items + actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đơn thuốc *</Text>
          <Text style={styles.sectionSubtitle}>
            Thêm ít nhất một loại thuốc. Mỗi thuốc cần có liều dùng, tần suất và hướng dẫn ≥ 30 ký tự.
          </Text>

          {items.length === 0 && (
            <View style={styles.emptyRxRow}>
              <MaterialIcons name='info-outline' size={14} color='#6B7280' />
              <Text style={styles.emptyRxText}>Chưa có thuốc nào trong đơn.</Text>
            </View>
          )}

          {items.map((item, idx) => {
            const incomplete = !isRxItemComplete(item)
            return (
              <Pressable
                key={idx}
                style={({ pressed }) => [styles.itemRow, idx > 0 && styles.itemDivider, pressed && { opacity: 0.6 }]}
                onPress={() => router.push(`/(app)/incident/${id}/custom-medicine?index=${idx}`)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={1}>{item._displayName}</Text>
                  <View style={styles.itemMetaRow}>
                    <MaterialIcons
                      name={incomplete ? 'error-outline' : 'check-circle'}
                      size={13}
                      color={incomplete ? '#DC2626' : '#15803D'}
                    />
                    <Text
                      style={[styles.itemMeta, incomplete && styles.itemMetaWarn]}
                      numberOfLines={1}
                    >
                      {incomplete
                        ? 'Cần nhập thêm thông tin sử dụng'
                        : [item.dosage, item.frequency].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => removeItem(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name='close' size={20} color='#9CA3AF' />
                </TouchableOpacity>
              </Pressable>
            )
          })}

          {items.length > 0 && <View style={styles.divider} />}

          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.6 }]}
            onPress={() => router.push(`/(app)/incident/${id}/select-medicine`)}
          >
            <MaterialIcons name='add' size={24} color='#15803D' />
            <Text style={styles.actionText}>Chọn thuốc từ danh mục</Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.6 }]}
            onPress={() => router.push(`/(app)/incident/${id}/custom-medicine`)}
          >
            <MaterialIcons name='add' size={24} color='#15803D' />
            <Text style={styles.actionText}>Thêm thuốc tự nhập</Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollView: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, gap: 12 },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#B91C1C',
    fontFamily: 'Inter_500Medium',
  },

  section: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 16, lineHeight: 24,
    fontFamily: 'Inter_500Medium', color: '#111827', marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12, lineHeight: 16,
    color: '#6B7280', fontFamily: 'Inter_400Regular',
    marginBottom: 8,
  },
  fields: { gap: 16, paddingTop: 4, paddingBottom: 12 },
  textarea: { minHeight: 90 },

  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginLeft: 4,
  },
  hint: {
    marginTop: 4,
    marginLeft: 4,
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
  },
  errorText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#DC2828',
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  successText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#15803D',
    fontFamily: 'Inter_500Medium',
  },
  warnText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#B45309',
    fontFamily: 'Inter_500Medium',
  },

  emptyRxRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8,
  },
  emptyRxText: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular' },

  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
  },
  itemDivider: { borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  itemName: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_500Medium', color: '#111827' },
  itemMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  itemMeta: { fontSize: 13, lineHeight: 18, color: '#6B7280' },
  itemMetaWarn: { color: '#DC2626' },

  divider: { height: 1, backgroundColor: '#F3F4F6' },

  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 12,
  },
  actionText: { fontSize: 16, lineHeight: 24, fontFamily: 'Inter_500Medium', color: '#15803D' },
})
