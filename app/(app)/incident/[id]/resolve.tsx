import { useEffect, useRef, useState } from 'react'
import {
  View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
  Keyboard, TouchableWithoutFeedback, Pressable, TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { Text, TextField } from '@/components/ui'
import { SheetHeader } from '@/components/features/incident/SheetHeader'
import { useResolveTicket } from '@/hooks/useTicketLifecycle'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/utils/error'
import { useResolveStore } from '@/stores/resolveStore'
import { usePreventUnsavedChanges } from '@/hooks/usePreventUnsavedChanges'
import type { PrescriptionItemInput } from '@/types/medicine'

const FIELD_LABELS = [
  { key: 'rootCause' as const, label: 'Vấn đề gốc rễ' },
  { key: 'rootCauseReason' as const, label: 'Nguyên nhân vì sao' },
  { key: 'treatment' as const, label: 'Cách giải quyết' },
  { key: 'prevention' as const, label: 'Cách phòng tránh tái phát' },
]

export default function ResolveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
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

  type FieldKey = (typeof FIELD_LABELS)[number]['key']
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({})

  const validate = () => {
    const next: Partial<Record<FieldKey, string>> = {}
    for (const { key, label } of FIELD_LABELS) {
      if (store[key].trim().length < 20) {
        next[key] = `${label} cần tối thiểu 20 ký tự`
      }
    }
    setErrors(next)
    if (Object.keys(next).length > 0) {
      showToast.error({ message: 'Vui lòng điền đầy đủ thông tin còn thiếu' })
      return false
    }
    for (const item of items) {
      if (item.usageInstructions.trim().length < 30) {
        showToast.error({ message: `Hướng dẫn sử dụng "${item._displayName}" cần ≥ 30 ký tự` })
        return false
      }
    }
    return true
  }

  const handleFieldChange = (key: FieldKey, value: string) => {
    setField(key, value)
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleSubmit = () => {
    if (!validate()) return
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
        onError: (err) => showToast.error({ message: getErrorMessage(err, 'Gửi giải pháp thất bại') }),
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
        canDone={!isPending}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps='handled'
          >
            {/* Solution 4 fields */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Giải pháp</Text>
              <View style={styles.fields}>
                {FIELD_LABELS.map(({ key, label }) => (
                  <TextField
                    key={key}
                    label={`${label} *`}
                    value={store[key]}
                    onChangeText={(v) => handleFieldChange(key, v)}
                    showClear={false}
                    showError={false}
                    error={errors[key]}
                  />
                ))}
              </View>
            </View>

            {/* Prescription items + actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Đơn thuốc</Text>

              {items.map((item, idx) => {
                const incomplete = !item.dosage || !item.frequency || item.usageInstructions.trim().length < 30
                return (
                  <Pressable
                    key={idx}
                    style={({ pressed }) => [styles.itemRow, idx > 0 && styles.itemDivider, pressed && { opacity: 0.6 }]}
                    onPress={() => router.push(`/(app)/incident/${id}/custom-medicine?index=${idx}`)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName} numberOfLines={1}>{item._displayName}</Text>
                      <Text style={[styles.itemMeta, incomplete && styles.itemMetaWarn]} numberOfLines={1}>
                        {incomplete
                          ? 'Chưa đủ thông tin — bấm để nhập'
                          : [item.dosage, item.frequency].filter(Boolean).join(' · ')}
                      </Text>
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
                <MaterialIcons name='add' size={24} color='#2463EB' />
                <Text style={styles.actionText}>Chọn thuốc từ danh mục</Text>
              </Pressable>

              <View style={styles.divider} />

              <Pressable
                style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.6 }]}
                onPress={() => router.push(`/(app)/incident/${id}/custom-medicine`)}
              >
                <MaterialIcons name='add' size={24} color='#2463EB' />
                <Text style={styles.actionText}>Thêm thuốc tự nhập</Text>
              </Pressable>
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

  section: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 16, lineHeight: 24,
    fontFamily: 'Inter_500Medium', color: '#111827', marginBottom: 4,
  },
  fields: { gap: 12, paddingTop: 4, paddingBottom: 12 },

  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
  },
  itemDivider: { borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  itemName: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_500Medium', color: '#111827' },
  itemMeta: { fontSize: 13, lineHeight: 18, color: '#6B7280', marginTop: 2 },
  itemMetaWarn: { color: '#D97706' },

  divider: { height: 1, backgroundColor: '#F3F4F6' },

  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 12,
  },
  actionText: { fontSize: 16, lineHeight: 24, fontFamily: 'Inter_500Medium', color: '#2463EB' },
})
