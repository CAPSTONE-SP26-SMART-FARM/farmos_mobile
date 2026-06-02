import { useRef, useState } from 'react'
import { View, ScrollView, StyleSheet, Pressable, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { Text, TopBar, EmptyState } from '@/components/ui'
import { s } from '@/components/features/profile/ProfileInfoLayout'
import { useDoctorDqs } from '@/hooks/useDoctor'
import type { DoctorTier } from '@/types/doctor'

const TIER_CONFIG: Record<DoctorTier, { bg: string; color: string }> = {
  PLATINUM: { bg: '#EDE9FE', color: '#7C3AED' },
  GOLD:     { bg: '#FEF3C7', color: '#D97706' },
  SILVER:   { bg: '#F3F4F6', color: '#6B7280' },
  BRONZE:   { bg: '#FEF9C3', color: '#92400E' },
}

const TIER_INFO =
  'Ngưỡng hạng:\n• PLATINUM ≥ 85\n• GOLD ≥ 70\n• SILVER ≥ 50\n• BRONZE < 50'

const SUGGESTION_INFO =
  'Mục có khoảng cách đến tối đa lớn nhất (cân theo trọng số) — cải thiện sẽ tăng điểm tổng nhanh nhất.'

const BUBBLE_MAX_W = 280
const SCREEN_PAD = 12
const ARROW_SIZE = 8

type Tip = {
  info: string
  top: number     // top của bubble (đỉnh)
  left: number    // left của bubble
  arrowLeft: number // offset arrow từ left bubble đến center icon
}

type SubScore = { key: string; label: string; score: number; weight: number }

function formatSnapshotDate(iso: string): string {
  return iso.slice(0, 10).split('-').reverse().join('/')
}

function SectionTitle({
  title,
  info,
  onShow,
}: {
  title: string
  info?: string
  onShow?: (info: string, iconX: number, iconY: number, iconW: number, iconH: number) => void
}) {
  const iconRef = useRef<View>(null)
  const handlePress = () => {
    if (!info || !onShow) return
    iconRef.current?.measureInWindow((x, y, w, h) => {
      onShow(info, x, y, w, h)
    })
  }
  return (
    <View style={styles.titleRow}>
      <Text style={styles.titleText}>{title}</Text>
      {info && (
        <Pressable
          ref={iconRef}
          onPress={handlePress}
          hitSlop={10}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.5 }]}
        >
          <MaterialIcons name='help-outline' size={16} color='#9CA3AF' />
        </Pressable>
      )}
    </View>
  )
}

export default function DoctorDqsScreen() {
  const { data: dqs } = useDoctorDqs()
  const latest = dqs?.latest
  const [tip, setTip] = useState<Tip | null>(null)

  const handleShow = (info: string, iconX: number, iconY: number, iconW: number, iconH: number) => {
    const screenW = Dimensions.get('window').width
    const iconCenterX = iconX + iconW / 2
    // Bubble căn theo icon, ưu tiên center; clamp trong [SCREEN_PAD, screenW - max - SCREEN_PAD]
    const desiredLeft = iconCenterX - BUBBLE_MAX_W / 2
    const left = Math.max(SCREEN_PAD, Math.min(desiredLeft, screenW - BUBBLE_MAX_W - SCREEN_PAD))
    // Arrow offset = vị trí icon center so với left của bubble
    const arrowLeft = iconCenterX - left
    setTip({
      info,
      top: iconY + iconH + ARROW_SIZE + 2,
      left,
      arrowLeft,
    })
  }
  const onHide = () => setTip(null)

  if (!latest) {
    return (
      <SafeAreaView style={styles.safe}>
        <TopBar title='Chi tiết chất lượng' />
        <EmptyState message='Chưa có dữ liệu chất lượng. Hệ thống sẽ tính sau khi bạn có hoạt động trong 30 ngày gần nhất.' />
      </SafeAreaView>
    )
  }

  const subScores: SubScore[] = [
    { key: 'rating', label: 'Đánh giá sao trung bình', score: latest.ratingScore, weight: 0.4 },
    { key: 'frequency', label: 'Khối lượng xử lý', score: latest.frequencyScore, weight: 0.2 },
    { key: 'sla', label: 'Tuân thủ SLA', score: latest.slaScore, weight: 0.2 },
    { key: 'acceptance', label: 'Tỷ lệ nhận ticket', score: latest.acceptanceScore, weight: 0.1 },
    { key: 'online', label: 'Thời gian online', score: latest.onlineScore, weight: 0.1 },
  ]

  const priority = [...subScores].sort(
    (a, b) => (100 - b.score) * b.weight - (100 - a.score) * a.weight,
  )[0]

  const tierStyle = TIER_CONFIG[latest.tier]

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title='Chi tiết chất lượng' />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.section}>
          <SectionTitle title='Thứ hạng chất lượng' info={TIER_INFO} onShow={handleShow} />
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Hạng</Text>
            <View style={[s.statusBadge, { backgroundColor: tierStyle.bg }]}>
              <Text style={[s.statusText, { color: tierStyle.color }]}>{latest.tier}</Text>
            </View>
          </View>
          <View style={s.divider} />
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Điểm tổng</Text>
            <Text style={s.infoValue}>{latest.totalScore.toFixed(1)} / 100</Text>
          </View>
          <View style={s.divider} />
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Cập nhật</Text>
            <Text style={s.infoValue}>{formatSnapshotDate(latest.snapshotDate)}</Text>
          </View>
        </View>

        <View style={s.section}>
          <SectionTitle title='Điểm thành phần' />
          {subScores.map((sub, idx) => (
            <View key={sub.key}>
              {idx > 0 && <View style={s.divider} />}
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>
                  {sub.label} ({Math.round(sub.weight * 100)}%)
                </Text>
                <Text style={s.infoValue}>{sub.score.toFixed(0)} / 100</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={s.section}>
          <SectionTitle title='Gợi ý cải thiện' info={SUGGESTION_INFO} onShow={handleShow} />
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Ưu tiên</Text>
            <Text style={s.infoValue}>{priority.label}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Hiện tại</Text>
            <Text style={s.infoValue}>{priority.score.toFixed(0)} / 100</Text>
          </View>
        </View>
      </ScrollView>

      {tip && (
        <>
          <Pressable style={StyleSheet.absoluteFill} onPress={onHide} />
          <View pointerEvents='box-none' style={[styles.tipWrap, { top: tip.top, left: tip.left }]}>
            <View
              style={[
                styles.arrow,
                { left: Math.max(8, Math.min(tip.arrowLeft - ARROW_SIZE, BUBBLE_MAX_W - 24)) },
              ]}
            />
            <Pressable onPress={onHide} style={styles.bubble}>
              <Text style={styles.bubbleText}>{tip.info}</Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { backgroundColor: '#FFFFFF' },
  scroll: { backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 16, paddingBottom: 24, gap: 12 },
  titleRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
  },
  titleText: {
    fontSize: 16, lineHeight: 22, color: '#111827',
    fontFamily: 'Inter_600SemiBold',
  },
  iconBtn: {
    marginLeft: 6, padding: 2, justifyContent: 'center', alignItems: 'center',
  },
  tipWrap: {
    position: 'absolute',
    width: BUBBLE_MAX_W,
  },
  arrow: {
    width: 0, height: 0, position: 'absolute', top: 0,
    borderLeftWidth: ARROW_SIZE, borderRightWidth: ARROW_SIZE, borderBottomWidth: ARROW_SIZE,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#1F2937',
  },
  bubble: {
    marginTop: ARROW_SIZE - 1,
    backgroundColor: '#1F2937', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 6,
  },
  bubbleText: {
    fontSize: 13, lineHeight: 19, color: '#FFFFFF', fontFamily: 'Inter_400Regular',
  },
})
