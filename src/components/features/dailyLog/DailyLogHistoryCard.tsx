import { View, Image, StyleSheet, TouchableOpacity } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import dayjs from 'dayjs'
import { Text } from '@/components/ui'
import type { DailyLog } from '@/types/dailyLog'

interface Props {
  log: DailyLog
  onPress?: () => void
}

export function DailyLogHistoryCard({ log, onPress }: Props) {
  const date = dayjs(log.logDate || log.createdAt)
  const dayLabel = date.format('DD/MM/YYYY')
  const timeLabel = dayjs(log.createdAt).format('HH:mm')
  const previews = log.attachments?.slice(0, 4) ?? []
  const extra = (log.attachments?.length ?? 0) - previews.length

  const Wrapper: any = onPress ? TouchableOpacity : View
  return (
    <Wrapper
      style={styles.card}
      {...(onPress ? { activeOpacity: 0.85, onPress } : {})}
    >
      <View style={styles.headerRow}>
        <View style={styles.dateChip}>
          <MaterialIcons name='event' size={14} color='#2463EB' />
          <Text style={styles.dateChipText}>{dayLabel}</Text>
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
})
