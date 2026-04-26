import { useMemo, useState } from 'react'
import {
  View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
  Keyboard, TouchableWithoutFeedback,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Text, TextField, SelectField, PrimaryButton, TopBar } from '@/components/ui'
import { useCreateIncident, useMyMilestones } from '@/hooks/useIncident'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/utils/error'
import { SEVERITY_META } from '@/constants/incident'
import type { IncidentSeverity } from '@/types/incident'
import type { FarmerMyMilestone } from '@/types/production'

const SEVERITY_OPTIONS = (Object.keys(SEVERITY_META) as IncidentSeverity[]).map((value) => ({
  value,
  label: SEVERITY_META[value].label,
  desc: SEVERITY_META[value].desc,
  color: SEVERITY_META[value].color,
}))

export default function CreateIncidentScreen() {
  const router = useRouter()
  const { showToast } = useToast()
  const { mutate, isPending } = useCreateIncident()
  const { data: milestones = [], isLoading: isLoadingMilestones } = useMyMilestones()

  const [milestone, setMilestone] = useState<FarmerMyMilestone | null>(null)
  const [severity, setSeverity] = useState<IncidentSeverity>('medium')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const milestoneOptions = useMemo(
    () => milestones.map((m) => ({
      ...m,
      label: m.stageName,
      subtitle: m.zoneName,
    })),
    [milestones],
  )

  const severityMeta = SEVERITY_META[severity]
  const canSubmit = !!milestone && title.trim().length > 0 && description.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    mutate(
      {
        milestoneId: milestone!.id,
        title: title.trim(),
        description: description.trim(),
        severity,
      },
      {
        onSuccess: () => {
          showToast.success({ message: 'Đã gửi báo cáo sự cố' })
          router.back()
        },
        onError: (err) => showToast.error({ message: getErrorMessage(err, 'Gửi báo cáo thất bại') }),
      },
    )
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <TopBar title='Báo cáo sự cố' />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps='handled'
          >
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Thông tin sự cố</Text>

              <View style={styles.fields}>
                <SelectField
                  label='Milestone'
                  value={milestone ? `${milestone.stageName} · ${milestone.zoneName}` : ''}
                  options={milestoneOptions}
                  bottomSheetTitle='Chọn milestone'
                  disabled={isLoadingMilestones}
                  labelExtractor={(item) => item.stageName}
                  subtitleExtractor={(item) => item.zoneName}
                  valueExtractor={(item) => item.id}
                  selectedValue={milestone?.id ?? null}
                  onSelect={(item) => setMilestone(item)}
                  showError={false}
                />

                <TextField
                  label='Tiêu đề'
                  value={title}
                  onChangeText={setTitle}
                  autoCapitalize='sentences'
                  showError={false}
                />

                <SelectField
                  label='Mức độ nghiêm trọng'
                  value={severityMeta.label}
                  options={SEVERITY_OPTIONS}
                  bottomSheetTitle='Chọn mức độ nghiêm trọng'
                  labelExtractor={(item) => item.label}
                  subtitleExtractor={(item) => item.desc}
                  valueExtractor={(item) => item.value}
                  selectedValue={severity}
                  onSelect={(item) => setSeverity(item.value)}
                  showError={false}
                />

                <TextField
                  label='Mô tả chi tiết'
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={5}
                  inputStyle={styles.textarea}
                  showError={false}
                />
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>

        <View style={styles.footer}>
          <PrimaryButton
            title='Hoàn thành'
            loading={isPending}
            disabled={!canSubmit}
            onPress={handleSubmit}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  scrollView: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 16, paddingBottom: 24 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  fields: { gap: 12 },
  textarea: { minHeight: 120 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
})
