import { useState } from 'react'
import {
  View, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, FlatList, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Text } from '@/components/ui'
import { useCreateIncident, useMyMilestones } from '@/hooks/useIncident'
import { SEVERITY_META } from '@/constants/incident'
import type { IncidentSeverity } from '@/types/incident'
import type { FarmerMyMilestone } from '@/types/production'

export default function CreateIncidentScreen() {
  const router = useRouter()
  const { mutate, isPending } = useCreateIncident()
  const { data: milestones = [], isLoading: isLoadingMilestones } = useMyMilestones()

  // Nhận severity từ picker qua search params
  const params = useLocalSearchParams<{ severity?: IncidentSeverity }>()
  const severity: IncidentSeverity = params.severity ?? 'medium'

  const [milestoneId, setMilestoneId] = useState('')
  const [selectedMilestone, setSelectedMilestone] = useState<FarmerMyMilestone | null>(null)
  const [milestoneModalVisible, setMilestoneModalVisible] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const openSeverityPicker = () => {
    router.push(`/(app)/incident/severity-picker?current=${severity}&returnTo=create`)
  }

  const handleSelectMilestone = (milestone: FarmerMyMilestone) => {
    setMilestoneId(milestone.id)
    setSelectedMilestone(milestone)
    setMilestoneModalVisible(false)
  }

  const handleSubmit = () => {
    if (!milestoneId.trim() || !title.trim() || !description.trim()) {
      setError('Vui lòng điền đầy đủ thông tin.')
      return
    }
    setError('')
    mutate(
      { milestoneId: milestoneId.trim(), title: title.trim(), description: description.trim(), severity },
      { onSuccess: () => router.back() }
    )
  }

  const meta = SEVERITY_META[severity]

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancel}>Huỷ</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>Báo cáo sự cố</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={isPending}>
            {isPending
              ? <ActivityIndicator size="small" color="#2463EB" />
              : <Text style={styles.submit}>Gửi</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>Milestone *</Text>
          <TouchableOpacity
            style={styles.pickerRow}
            onPress={() => setMilestoneModalVisible(true)}
            activeOpacity={0.7}
            disabled={isLoadingMilestones}
          >
            <Text style={[
              styles.pickerValue,
              { color: selectedMilestone ? '#111827' : '#9CA3AF' }
            ]}>
              {isLoadingMilestones ? 'Đang tải...' : (selectedMilestone ? `${selectedMilestone.stageName} (${selectedMilestone.zoneName})` : 'Chọn milestone...')}
            </Text>
            <Text style={styles.pickerArrow}>›</Text>
          </TouchableOpacity>

          <Modal
            visible={milestoneModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setMilestoneModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <SafeAreaView style={styles.modalSafe}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setMilestoneModalVisible(false)} style={styles.modalCloseBtn}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>Chọn Milestone</Text>
                  <View style={{ width: 40 }} />
                </View>
              <FlatList
                data={milestones}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.milestoneList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.milestoneItem}
                    onPress={() => handleSelectMilestone(item)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.milestoneName}>{item.stageName}</Text>
                      <Text style={styles.milestoneZone}>{item.zoneName}</Text>
                    </View>
                    <Text style={[styles.milestoneStatus, { color: item.status === 'in_progress' ? '#059669' : '#9CA3AF' }]}>
                      {item.status === 'in_progress' ? '●' : '○'}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyList}>
                    <Text style={styles.emptyText}>Không có milestone nào</Text>
                  </View>
                }
              />
            </SafeAreaView>
            </View>
          </Modal>

          <Text style={styles.label}>Tiêu đề *</Text>
          <TextInput
            style={styles.input}
            placeholder="Mô tả ngắn về sự cố..."
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Mức độ nghiêm trọng *</Text>
          <TouchableOpacity style={styles.pickerRow} onPress={openSeverityPicker} activeOpacity={0.7}>
            <View style={[styles.dot, { backgroundColor: meta.color }]} />
            <Text style={[styles.pickerValue, { color: meta.color }]}>{meta.label}</Text>
            <Text style={styles.pickerArrow}>›</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Mô tả chi tiết *</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Diễn giải chi tiết về sự cố xảy ra..."
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  topTitle: { fontSize: 16, color: '#111827', fontFamily: 'Inter_600SemiBold' },
  cancel: { fontSize: 15, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  submit: { fontSize: 15, color: '#2463EB', fontFamily: 'Inter_600SemiBold' },
  content: { padding: 16, gap: 6 },
  error: { color: '#DC2626', fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 8 },
  label: { fontSize: 13, color: '#374151', fontFamily: 'Inter_600SemiBold', marginTop: 12, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
    color: '#111827', fontFamily: 'Inter_400Regular', backgroundColor: '#FAFAFA',
  },
  textarea: { height: 120 },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#FAFAFA',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  pickerValue: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  pickerArrow: { fontSize: 20, color: '#9CA3AF', lineHeight: 22 },
  modalSafe: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  modalTitle: { fontSize: 16, color: '#111827', fontFamily: 'Inter_600SemiBold', flex: 1, textAlign: 'center' },
  modalCloseBtn: { padding: 8, marginLeft: -8 },
  modalClose: { fontSize: 24, color: '#6B7280', fontFamily: 'Inter_400Regular', lineHeight: 28 },
  milestoneList: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  milestoneItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14, marginBottom: 10,
    backgroundColor: '#FAFAFA',
  },
  milestoneName: { fontSize: 14, color: '#111827', fontFamily: 'Inter_600SemiBold' },
  milestoneZone: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 2 },
  milestoneStatus: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  emptyList: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
})
