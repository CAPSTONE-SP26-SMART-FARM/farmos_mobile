import { useEffect, useRef, useState } from 'react'
import {
  View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
  Keyboard, TouchableWithoutFeedback,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { Text, TextField } from '@/components/ui'
import { SheetHeader } from '@/components/features/incident/SheetHeader'
import { useResolveStore } from '@/stores/resolveStore'
import { useToast } from '@/hooks/useToast'
import { usePreventUnsavedChanges } from '@/hooks/usePreventUnsavedChanges'

const MIN_USAGE_LENGTH = 30

type FieldKey = 'name' | 'dosage' | 'frequency' | 'usageInstructions'
type FieldErrors = Partial<Record<FieldKey, string>>

const FIELD_HINTS: Record<FieldKey, string> = {
  name: 'Tên đầy đủ của thuốc/sản phẩm. Ví dụ: "Ridomil Gold 68WG".',
  dosage: 'Liều dùng cho mỗi lần. Ví dụ: "20g pha với 10 lít nước".',
  frequency: 'Tần suất sử dụng. Ví dụ: "2 lần/tuần, cách nhau 3 ngày".',
  usageInstructions: `Hướng dẫn chi tiết cho người dùng (≥ ${MIN_USAGE_LENGTH} ký tự). Ví dụ: "Phun đều mặt dưới lá vào sáng sớm hoặc chiều mát, tránh trời mưa, đeo khẩu trang khi phun."`,
}

export default function CustomMedicineScreen() {
  const router = useRouter()
  const { showToast } = useToast()
  const { index } = useLocalSearchParams<{ index?: string }>()
  const editIndex = index !== undefined ? Number(index) : -1
  const isEdit = editIndex >= 0

  const addItem = useResolveStore((s) => s.addItem)
  const updateItem = useResolveStore((s) => s.updateItem)
  const existing = useResolveStore((s) => (isEdit ? s.items[editIndex] : undefined))
  const isCatalog = !!existing?.medicineId

  const [name, setName] = useState(existing?._displayName ?? '')
  const [dosage, setDosage] = useState(existing?.dosage ?? '')
  const [frequency, setFrequency] = useState(existing?.frequency ?? '')
  const [usageInstructions, setUsageInstructions] = useState(existing?.usageInstructions ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [bannerError, setBannerError] = useState<string | null>(null)

  // Trạng thái valid per-field — dùng cho "✓ Đã đủ thông tin" inline.
  const validity: Record<FieldKey, boolean> = {
    name: name.trim().length > 0,
    dosage: dosage.trim().length > 0,
    frequency: frequency.trim().length > 0,
    usageInstructions: usageInstructions.trim().length >= MIN_USAGE_LENGTH,
  }
  const canSave = validity.name && validity.dosage && validity.frequency && validity.usageInstructions

  const initial = useRef({
    name: existing?._displayName ?? '',
    dosage: existing?.dosage ?? '',
    frequency: existing?.frequency ?? '',
    usageInstructions: existing?.usageInstructions ?? '',
  }).current
  const isDirty =
    name !== initial.name ||
    dosage !== initial.dosage ||
    frequency !== initial.frequency ||
    usageInstructions !== initial.usageInstructions
  const [justSaved, setJustSaved] = useState(false)
  usePreventUnsavedChanges(isDirty && !justSaved, {
    message: 'Bạn đang nhập thông tin thuốc. Thoát ra sẽ mất các thay đổi.',
  })
  useEffect(() => {
    if (justSaved) router.back()
  }, [justSaved])

  const clearError = (key: FieldKey) => {
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }))
    if (bannerError) setBannerError(null)
  }

  const validateLocal = (): boolean => {
    const next: FieldErrors = {}
    if (!isCatalog && name.trim().length === 0) {
      next.name = 'Vui lòng nhập tên thuốc'
    }
    if (dosage.trim().length === 0) {
      next.dosage = 'Vui lòng nhập liều dùng'
    }
    if (frequency.trim().length === 0) {
      next.frequency = 'Vui lòng nhập tần suất'
    }
    if (usageInstructions.trim().length === 0) {
      next.usageInstructions = 'Vui lòng nhập hướng dẫn sử dụng'
    } else if (usageInstructions.trim().length < MIN_USAGE_LENGTH) {
      next.usageInstructions = `Hướng dẫn cần tối thiểu ${MIN_USAGE_LENGTH} ký tự (hiện tại ${usageInstructions.trim().length})`
    }
    setErrors(next)
    if (Object.keys(next).length > 0) {
      const msg = 'Vui lòng kiểm tra lại các trường thông tin còn thiếu'
      setBannerError(msg)
      showToast.error({ message: msg })
      return false
    }
    return true
  }

  const handleSave = () => {
    setBannerError(null)
    if (!validateLocal()) return
    if (isEdit) {
      updateItem(editIndex, {
        ...(isCatalog ? {} : { _displayName: name.trim(), customMedicineName: name.trim() }),
        dosage: dosage.trim(),
        frequency: frequency.trim(),
        usageInstructions: usageInstructions.trim(),
      })
    } else {
      addItem({
        _displayName: name.trim(),
        customMedicineName: name.trim(),
        dosage: dosage.trim(),
        frequency: frequency.trim(),
        usageInstructions: usageInstructions.trim(),
      })
    }
    showToast.success({ message: isEdit ? 'Đã cập nhật thuốc' : 'Đã thêm thuốc vào đơn' })
    setJustSaved(true)
  }

  const renderFeedback = (key: FieldKey, opts?: { liveCount?: number; min?: number }) => {
    const err = errors[key]
    if (err) {
      return (
        <View style={styles.feedbackRow}>
          <MaterialIcons name='error-outline' size={14} color='#DC2828' />
          <Text style={styles.errorText}>{err}</Text>
        </View>
      )
    }
    if (validity[key]) {
      return (
        <View style={styles.feedbackRow}>
          <MaterialIcons name='check-circle' size={14} color='#15803D' />
          <Text style={styles.successText}>Đã đủ thông tin</Text>
        </View>
      )
    }
    // Khi field có quy định độ dài tối thiểu mà chưa đạt → hiện counter cảnh báo.
    if (opts?.min !== undefined && opts.liveCount !== undefined && opts.liveCount > 0) {
      const remaining = opts.min - opts.liveCount
      return (
        <View style={styles.feedbackRow}>
          <MaterialIcons name='info-outline' size={14} color='#B45309' />
          <Text style={styles.warnText}>Còn cần {remaining} ký tự nữa</Text>
        </View>
      )
    }
    return <Text style={styles.hint}>{FIELD_HINTS[key]}</Text>
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <Stack.Screen options={{ gestureEnabled: !isDirty }} />
      <SheetHeader
        title={isEdit ? 'Chi tiết thuốc' : 'Thêm thuốc tự nhập'}
        onCancel={() => router.back()}
        onDone={handleSave}
        doneLabel='Lưu'
        canDone={canSave}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps='handled'
          >
            {bannerError ? (
              <View style={styles.errorBanner}>
                <MaterialIcons name='error-outline' size={18} color='#B91C1C' />
                <Text style={styles.errorBannerText}>{bannerError}</Text>
              </View>
            ) : null}

            <View style={styles.section}>
              <View style={styles.fields}>
                {/* Tên thuốc */}
                <View>
                  <TextField
                    label='Tên thuốc *'
                    value={name}
                    onChangeText={(v) => { setName(v); clearError('name') }}
                    showClear={false}
                    showError={false}
                    editable={!isCatalog}
                    error={errors.name}
                  />
                  {isCatalog ? (
                    <Text style={styles.hint}>Thuốc được chọn từ danh mục — tên không thể chỉnh sửa.</Text>
                  ) : (
                    renderFeedback('name')
                  )}
                </View>

                {/* Liều dùng */}
                <View>
                  <TextField
                    label='Liều dùng *'
                    value={dosage}
                    onChangeText={(v) => { setDosage(v); clearError('dosage') }}
                    showClear={false}
                    showError={false}
                    error={errors.dosage}
                  />
                  {renderFeedback('dosage')}
                </View>

                {/* Tần suất */}
                <View>
                  <TextField
                    label='Tần suất *'
                    value={frequency}
                    onChangeText={(v) => { setFrequency(v); clearError('frequency') }}
                    showClear={false}
                    showError={false}
                    error={errors.frequency}
                  />
                  {renderFeedback('frequency')}
                </View>

                {/* Hướng dẫn sử dụng */}
                <View>
                  <TextField
                    label={`Hướng dẫn sử dụng * (≥ ${MIN_USAGE_LENGTH} ký tự)`}
                    value={usageInstructions}
                    onChangeText={(v) => { setUsageInstructions(v); clearError('usageInstructions') }}
                    showClear={false}
                    showError={false}
                    error={errors.usageInstructions}
                    multiline
                    numberOfLines={4}
                    inputStyle={styles.textarea}
                  />
                  {renderFeedback('usageInstructions', {
                    liveCount: usageInstructions.trim().length,
                    min: MIN_USAGE_LENGTH,
                  })}
                </View>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16,
  },
  fields: { gap: 16 },
  textarea: { minHeight: 100 },

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
})
