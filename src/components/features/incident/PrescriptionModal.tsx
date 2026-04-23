import { useState } from 'react'
import {
  View, Modal, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native'
import { Text } from '@/components/ui'
import type { CreatePrescriptionBody } from '@/types/prescription'

interface PrescriptionModalProps {
  visible: boolean
  onClose: () => void
  onSubmit: (body: CreatePrescriptionBody) => void
  isPending: boolean
}

const EMPTY = { medicineName: '', dosage: '' }

export function PrescriptionModal({ visible, onClose, onSubmit, isPending }: PrescriptionModalProps) {
  const [form, setForm] = useState(EMPTY)
  const [err, setErr] = useState('')

  const set = (key: keyof typeof EMPTY) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const handleClose = () => {
    setForm(EMPTY)
    setErr('')
    onClose()
  }

  const handleSubmit = () => {
    if (!form.medicineName.trim() || !form.dosage.trim()) {
      setErr('Vui lòng điền đầy đủ tên thuốc và liều dùng.')
      return
    }
    setErr('')
    onSubmit({ medicineName: form.medicineName.trim(), dosage: form.dosage.trim() })
  }

  return (
    <Modal visible={visible} transparent animationType='slide' onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>📋 Kê đơn thuốc</Text>
              <TouchableOpacity onPress={handleClose} hitSlop={8}>
                <Text style={styles.close}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.body}>
              {err ? <Text style={styles.err}>{err}</Text> : null}

              <Text style={styles.label}>Tên thuốc *</Text>
              <TextInput
                style={styles.input}
                placeholder='VD: Bordeaux mixture'
                placeholderTextColor='#9CA3AF'
                value={form.medicineName}
                onChangeText={set('medicineName')}
              />

              <Text style={styles.label}>Liều dùng *</Text>
              <TextInput
                style={styles.input}
                placeholder='VD: 2g/l nước'
                placeholderTextColor='#9CA3AF'
                value={form.dosage}
                onChangeText={set('dosage')}
              />

              <TouchableOpacity
                style={[styles.submit, isPending && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={isPending}
              >
                {isPending
                  ? <ActivityIndicator size='small' color='#fff' />
                  : <Text style={styles.submitText}>Lưu đơn thuốc</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  title: { fontSize: 16, color: '#111827', fontFamily: 'Inter_700Bold' },
  close: { fontSize: 20, color: '#6B7280', padding: 4 },
  body: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, gap: 4 },
  err: { color: '#DC2626', fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 8 },
  label: { fontSize: 13, color: '#374151', fontFamily: 'Inter_600SemiBold', marginTop: 10, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14,
    color: '#111827', fontFamily: 'Inter_400Regular', backgroundColor: '#FAFAFA',
  },
  submit: {
    backgroundColor: '#2463EB', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 20,
  },
  submitText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
})
