import { useRef, useState } from 'react'
import {
  View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
  Keyboard, TouchableWithoutFeedback,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { TextField } from '@/components/ui'
import { SheetHeader } from '@/components/features/incident/SheetHeader'
import { useResolveStore } from '@/stores/resolveStore'
import { useToast } from '@/hooks/useToast'
import { usePreventUnsavedChanges } from '@/hooks/usePreventUnsavedChanges'

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

  const canSave = name.trim().length > 0 && dosage.trim().length > 0 && frequency.trim().length > 0 && usageInstructions.trim().length >= 30

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
  const justSavedRef = useRef(false)
  usePreventUnsavedChanges(isDirty && !justSavedRef.current, {
    message: 'Bạn đang nhập thông tin thuốc. Thoát ra sẽ mất các thay đổi.',
  })

  const handleSave = () => {
    if (!canSave) {
      if (usageInstructions.trim().length < 30) {
        showToast.error({ message: 'Hướng dẫn sử dụng cần ≥ 30 ký tự' })
      }
      return
    }
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
    justSavedRef.current = true
    router.back()
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
            <View style={styles.section}>
              <View style={styles.fields}>
                <TextField
                  label='Tên thuốc *'
                  value={name}
                  onChangeText={setName}
                  showClear={false}
                  showError={false}
                  editable={!isCatalog}
                />
                <TextField
                  label='Liều dùng *'
                  value={dosage}
                  onChangeText={setDosage}
                  showClear={false}
                  showError={false}
                />
                <TextField
                  label='Tần suất *'
                  value={frequency}
                  onChangeText={setFrequency}
                  showClear={false}
                  showError={false}
                />
                <TextField
                  label='Hướng dẫn sử dụng * (≥30 ký tự)'
                  value={usageInstructions}
                  onChangeText={setUsageInstructions}
                  showClear={false}
                  showError={false}
                />
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
  section: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16,
  },
  fields: { gap: 12 },
})
