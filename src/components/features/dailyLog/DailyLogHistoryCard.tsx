import { View, Image, StyleSheet, TouchableOpacity, Pressable } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import dayjs from 'dayjs'
import { Text } from '@/components/ui'
import type { DailyLog } from '@/types/dailyLog'

interface Props {
  log: DailyLog
  onPress?: () => void
  onEdit?: (log: DailyLog) => void
  onDelete?: (log: DailyLog) => void
}

function isToday(logDate: string): boolean {
  // logDate là "YYYY-MM-DD" theo UTC từ BE. dayjs() lấy local — vẫn so theo YYYY-MM-DD local.
  // Khớp với UX "log của hôm nay" theo cách user cảm nhận.
  return dayjs(logDate).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
}

export function DailyLogHistoryCard({ log, onPress, onEdit, onDelete }: Props) {
  const date = dayjs(log.logDate || log.createdAt)
  const dayLabel = date.format('DD/MM/YYYY')
  const timeLabel = dayjs(log.createdAt).format('HH:mm')
  const previews = log.attachments?.slice(0, 4) ?? []
  const extra = (log.attachments?.length ?? 0) - previews.length

  const today = isToday(log.logDate)
  const showActions = today && (onEdit || onDelete)

  const Wrapper: any = onPress ? TouchableOpacity : View
  return (
    <Wrapper
      style={styles.card}
      {...(onPress ? { activeOpacity: 0.85, onPress } : {})}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.dateChip}>
            <MaterialIcons name='event' size={14} color='#2463EB' />
            <Text style={styles.dateChipText}>{dayLabel}</Text>
          </View>
          {today ? (
            <View style={styles.todayChip}>
              <Text style={styles.todayChipText}>Hôm nay</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.time}>{timeLabel}</Text>
      </View>

      {log.zone?.name ? (
        <View style={styles.zoneRow}>
          <MaterialIcons name='place' size={14} color='#6B7280' />
          <Text style={styles.zoneText} numberOfLines={1}>{log.zone.name}</Text>
        </View>
      ) : null}

      <Text style={styles.activities} numberOfLines={3}>
        {log.activities}
      </Text>

      {log.notes ? (
        <Text style={styles.notes} numberOfLines={2}>
          Ghi chú: {log.notes}
        </Text>
      ) : null}

      {previews.length > 0 ? (
        <View style={styles.attachmentsRow}>
          {previews.map((att, idx) => (
            <View key={att.id ?? `${att.url}-${idx}`} style={styles.thumbWrap}>
              <Image source={{ uri: att.url }} style={styles.thumb} />
              {idx === previews.length - 1 && extra > 0 ? (
                <View style={styles.thumbOverlay}>
                  <Text style={styles.thumbOverlayText}>+{extra}</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {showActions ? (
        <View style={styles.actionsRow}>
          {onEdit ? (
            <Pressable
              onPress={() => onEdit(log)}
              style={({ pressed }) => [styles.actionBtn, pressed && styles.actionPressed]}
              hitSlop={6}
            >
              <MaterialIcons name='edit' size={14} color='#2463EB' />
              <Text style={styles.actionTextEdit}>Sửa</Text>
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable
              onPress={() => onDelete(log)}
              style={({ pressed }) => [styles.actionBtn, pressed && styles.actionPressed]}
              hitSlop={6}
            >
              <MaterialIcons name='delete-outline' size={14} color='#DC2626' />
              <Text style={styles.actionTextDelete}>Xóa</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  dateChipText: {
    fontSize: 12,
    color: '#2463EB',
    fontFamily: 'Inter_600SemiBold',
  },
  todayChip: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  todayChipText: {
    fontSize: 11,
    color: '#15803D',
    fontFamily: 'Inter_600SemiBold',
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter_400Regular',
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  zoneText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  activities: {
    fontSize: 14,
    lineHeight: 20,
    color: '#111827',
    fontFamily: 'Inter_400Regular',
  },
  notes: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
  },
  attachmentsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  thumbWrap: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  thumb: { width: '100%', height: '100%' },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,24,39,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbOverlayText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  actionPressed: { opacity: 0.6 },
  actionTextEdit: { fontSize: 12.5, color: '#2463EB', fontFamily: 'Inter_600SemiBold' },
  actionTextDelete: { fontSize: 12.5, color: '#DC2626', fontFamily: 'Inter_600SemiBold' },
})
