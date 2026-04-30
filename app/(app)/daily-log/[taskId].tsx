import { useState } from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Text, TextField, TopBar, PrimaryButton } from '@/components/ui'
import { useSubmitDailyLog } from '@/hooks/useDailyLog'
import { useToast } from '@/hooks/useToast'
import { icons } from '@/constants/icon'

const DiaryIcon = icons.diarySvg

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Thấp',
  normal: 'Bình thường',
  high: 'Cao',
  urgent: 'Khẩn cấp',
}
const PRIORITY_COLOR: Record<string, string> = {
  low: '#6B7280',
  normal: '#2463EB',
  high: '#D97706',
  urgent: '#DC2626',
}

export default function DailyLogSubmitScreen() {
  const router = useRouter()
  const { taskId, title, priority } = useLocalSearchParams<{
    taskId: string
    title: string
    priority: string
  }>()
  const { showToast } = useToast()
  const { mutate, isPending } = useSubmitDailyLog()

  const [activities, setActivities] = useState('')
  const [notes, setNotes] = useState('')
  const [activitiesError, setActivitiesError] = useState('')

  const handleSubmit = () => {
    if (!activities.trim()) {
      setActivitiesError('Vui lòng mô tả công việc đã làm hôm nay')
      return
    }
    setActivitiesError('')
    mutate(
      { employeeTaskId: taskId, activities: activities.trim(), notes: notes.trim() },
      {
        onSuccess: () => {
          showToast.success({ message: 'Đã ghi nhật ký thành công' })
          router.back()
        },
        onError: (err: any) => {
          if (err?.response?.status === 409) {
            showToast.error({ message: 'Bạn đã ghi nhật ký cho công việc này hôm nay rồi' })
          } else {
            showToast.error({ message: err?.response?.data?.message ?? 'Ghi nhật ký thất bại' })
          }
        },
      }
    )
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <TopBar title='Ghi nhật ký' />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.taskCard}>
          <View style={styles.taskIconWrap}>
            <DiaryIcon width={24} height={24} color='#2463EB' />
          </View>
          <View style={styles.taskInfo}>
            <Text style={styles.taskTitle} numberOfLines={2}>{title}</Text>
            <Text style={[styles.taskPriority, { color: PRIORITY_COLOR[priority] ?? '#2463EB' }]}>
              {PRIORITY_LABEL[priority] ?? priority}
            </Text>
          </View>
        </View>

        <View style={styles.dateChip}>
          <Text style={styles.dateChipText}>
            {new Date().toLocaleDateString('vi-VN', {
              weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
            })}
          </Text>
        </View>

        <TextField
          label='Đã làm gì hôm nay *'
          value={activities}
          onChangeText={(v) => {
            setActivities(v)
            if (v.trim()) setActivitiesError('')
          }}
          multiline
          numberOfLines={5}
          error={activitiesError}
          showClear={false}
          containerStyle={styles.textareaContainer}
        />

        <TextField
          label='Ghi chú thêm (tuỳ chọn)'
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          showClear={false}
          containerStyle={styles.textareaContainer}
        />

        <PrimaryButton
          title='Ghi nhật ký'
          onPress={handleSubmit}
          loading={isPending}
          disabled={isPending}
          style={styles.submitBtn}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollView: { flex: 1, backgroundColor: '#F3F4F6' },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },

  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  taskIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskInfo: { flex: 1, gap: 4 },
  taskTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#111827', lineHeight: 22 },
  taskPriority: { fontSize: 12, fontFamily: 'Inter_500Medium' },

  dateChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  dateChipText: { fontSize: 13, color: '#2463EB', fontFamily: 'Inter_500Medium' },

  textareaContainer: { minHeight: 100 },
  submitBtn: { marginTop: 8 },
})
