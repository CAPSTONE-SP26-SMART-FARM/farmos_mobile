import { View, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { Text, TopBar, EmptyState } from '@/components/ui'
import { useDoctorTicketStats, type DoctorTicketStatsRes } from '@/hooks/useDoctorTicketStats'
import { SEVERITY_META, STATUS_META } from '@/constants/incident'
import dayjs from 'dayjs'
import type {
  DoctorTicketStatsRecent,
} from '@/types/doctorTicketStats'
import type {
  IncidentSeverity,
  TicketPriority,
  TicketStatus,
} from '@/types/incident'

const PRIORITY_META: Record<TicketPriority, { label: string; color: string; bg: string }> = {
  low:    { label: 'Thấp',     color: '#16A34A', bg: '#F0FDF4' },
  normal: { label: 'Bình thường', color: '#4B5563', bg: '#F3F4F6' },
  high:   { label: 'Cao',      color: '#EA580C', bg: '#FFF7ED' },
  urgent: { label: 'Khẩn cấp', color: '#DC2626', bg: '#FEF2F2' },
}

const STATUS_ORDER: TicketStatus[] = ['open', 'assigned', 'in_progress', 'resolved', 'closed', 'cancelled']
const SEVERITY_ORDER: IncidentSeverity[] = ['critical', 'high', 'medium', 'low']
const PRIORITY_ORDER: TicketPriority[] = ['urgent', 'high', 'normal', 'low']

function sumBreakdown<K extends string>(map: Record<K, number>): number {
  return Object.values(map).reduce<number>((a, b) => a + (b as number), 0)
}

function formatVnd(value: number): string {
  return value.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + 'đ'
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return '—'
  const total = Math.round(seconds)
  if (total < 60) return `${total}s`
  const m = Math.floor(total / 60)
  if (m < 60) return `${m} phút`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem > 0 ? `${h}g ${rem}p` : `${h}g`
}

export default function DoctorTicketAnalyticsScreen() {
  const { stats, isLoading, isError, refetch } = useDoctorTicketStats({ full: true })

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <TopBar title='Phân tích ticket' />

      {isLoading && !stats ? (
        <View style={styles.center}>
          <ActivityIndicator color='#15803D' />
        </View>
      ) : isError ? (
        <EmptyState message='Không tải được dữ liệu. Vui lòng thử lại.' />
      ) : !stats || stats.totals.all === 0 ? (
        <EmptyState message='Bạn chưa nhận ticket nào.' />
      ) : (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor='#15803D' />}
        >
          <Headline stats={stats} />
          <RevenueCard stats={stats} />
          <PerformanceCard stats={stats} />
          <StatusBreakdown stats={stats} />
          <SeverityBreakdown stats={stats} />
          <PriorityBreakdown stats={stats} />
          <RecentTickets stats={stats} />
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function Headline({ stats }: { stats: DoctorTicketStatsRes }) {
  const completionPct = Math.round(stats.rates.completionRate * 100)
  const cancellationPct = Math.round(stats.rates.cancellationRate * 100)
  const acceptancePct = Math.round(stats.rates.acceptanceRate * 100)
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Tổng quan</Text>
      <Text style={styles.sectionSubtitle}>{stats.range.label}</Text>
      <View style={styles.row3}>
        <Stat label='Tổng cộng' value={stats.totals.all} color='#111827' />
        <View style={styles.vDivider} />
        <Stat label='Đang xử lý' value={stats.totals.active} color='#15803D' />
        <View style={styles.vDivider} />
        <Stat label='Đã kết thúc' value={stats.totals.ended} color='#4B5563' />
      </View>
      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, completionPct))}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Tỉ lệ hoàn thành: <Text style={styles.progressNum}>{completionPct}%</Text>
        </Text>
      </View>
      <View style={styles.rateRow}>
        <RatePill label='Tiếp nhận' value={`${acceptancePct}%`} color='#1D4ED8' bg='#EFF6FF' />
        <RatePill label='Bị hủy' value={`${cancellationPct}%`} color='#B91C1C' bg='#FEF2F2' />
      </View>
    </View>
  )
}

function RevenueCard({ stats }: { stats: DoctorTicketStatsRes }) {
  const { revenue } = stats
  if (revenue.totalEarnings === 0 && revenue.ticketsWithEarnings === 0) return null
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Doanh thu</Text>
      <Text style={styles.sectionSubtitle}>Khoản đã ghi nhận vào ví</Text>
      <View style={styles.row3}>
        <Stat label='Tổng thu' value={formatVnd(revenue.totalEarnings)} color='#15803D' valueIsText />
        <View style={styles.vDivider} />
        <Stat label='Trung bình / ticket' value={formatVnd(revenue.averagePerTicket)} color='#111827' valueIsText />
        <View style={styles.vDivider} />
        <Stat label='Ticket có thu' value={revenue.ticketsWithEarnings} color='#4B5563' />
      </View>
    </View>
  )
}

function PerformanceCard({ stats }: { stats: DoctorTicketStatsRes }) {
  const { performance } = stats
  if (performance.sampleSize === 0) return null
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Tốc độ xử lý</Text>
      <Text style={styles.sectionSubtitle}>
        Dựa trên {performance.sampleSize} ticket có thời gian tiếp nhận và giải quyết
      </Text>
      <View style={styles.row3}>
        <Stat label='Trung bình' value={formatDuration(performance.avgResolutionSeconds)} color='#111827' valueIsText />
        <View style={styles.vDivider} />
        <Stat label='Trung vị' value={formatDuration(performance.medianResolutionSeconds)} color='#111827' valueIsText />
        <View style={styles.vDivider} />
        <Stat label='P90' value={formatDuration(performance.p90ResolutionSeconds)} color='#4B5563' valueIsText />
      </View>
    </View>
  )
}

function StatusBreakdown({ stats }: { stats: DoctorTicketStatsRes }) {
  const total = sumBreakdown(stats.breakdown.byStatus)
  const items = STATUS_ORDER.map((s) => ({
    key: s,
    label: STATUS_META[s].label,
    color: STATUS_META[s].color,
    bg: STATUS_META[s].bg,
    value: stats.breakdown.byStatus[s] ?? 0,
  })).filter((i) => i.value > 0)

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Phân loại theo trạng thái</Text>
      <BreakdownContent items={items} total={total} />
    </View>
  )
}

function SeverityBreakdown({ stats }: { stats: DoctorTicketStatsRes }) {
  const total = sumBreakdown(stats.breakdown.bySeverity)
  const items = SEVERITY_ORDER.map((s) => ({
    key: s,
    label: SEVERITY_META[s].label,
    color: SEVERITY_META[s].color,
    bg: SEVERITY_META[s].bg,
    value: stats.breakdown.bySeverity[s] ?? 0,
  })).filter((i) => i.value > 0)

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Phân loại theo mức độ nghiêm trọng</Text>
      <BreakdownContent items={items} total={total} />
    </View>
  )
}

function PriorityBreakdown({ stats }: { stats: DoctorTicketStatsRes }) {
  const total = sumBreakdown(stats.breakdown.byPriority)
  const items = PRIORITY_ORDER.map((p) => ({
    key: p,
    label: PRIORITY_META[p].label,
    color: PRIORITY_META[p].color,
    bg: PRIORITY_META[p].bg,
    value: stats.breakdown.byPriority[p] ?? 0,
  })).filter((i) => i.value > 0)

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Phân loại theo độ ưu tiên</Text>
      <BreakdownContent items={items} total={total} />
    </View>
  )
}

function BreakdownContent({
  items, total,
}: {
  items: { key: string; label: string; color: string; bg: string; value: number }[]
  total: number
}) {
  if (items.length === 0) {
    return <Text style={styles.empty}>Chưa có dữ liệu để phân tích.</Text>
  }
  return (
    <View style={styles.barList}>
      {items.map((i) => (
        <BarRow
          key={i.key}
          label={i.label}
          value={i.value}
          total={total}
          color={i.color}
          bg={i.bg}
        />
      ))}
    </View>
  )
}

function RecentTickets({ stats }: { stats: DoctorTicketStatsRes }) {
  const recent = stats.recent ?? []
  if (recent.length === 0) return null
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Ticket gần đây</Text>
      <View style={{ marginTop: 4 }}>
        {recent.map((t, idx) => (
          <RecentRow key={t.id} ticket={t} isFirst={idx === 0} />
        ))}
      </View>
    </View>
  )
}

function RecentRow({ ticket, isFirst }: { ticket: DoctorTicketStatsRecent; isFirst: boolean }) {
  const statusMeta = STATUS_META[ticket.status]
  return (
    <TouchableOpacity
      style={[styles.recentRow, !isFirst && styles.recentRowDivider]}
      activeOpacity={0.7}
      onPress={() => router.push(`/(app)/incident/${ticket.id}`)}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.recentTitle} numberOfLines={1}>{ticket.title}</Text>
        <Text style={styles.recentMeta} numberOfLines={1}>
          {dayjs(ticket.createdAt).format('DD/MM/YYYY HH:mm')} · {ticket.ticketNumber}
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: statusMeta.bg }]}>
        <Text style={[styles.badgeText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
      </View>
    </TouchableOpacity>
  )
}

function Stat({
  label, value, color, valueIsText,
}: { label: string; value: number | string; color: string; valueIsText?: boolean }) {
  return (
    <View style={styles.statCol}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[valueIsText ? styles.statValueText : styles.statValue, { color }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  )
}

function RatePill({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <View style={[styles.ratePill, { backgroundColor: bg }]}>
      <MaterialIcons name='trending-up' size={14} color={color} />
      <Text style={[styles.ratePillLabel, { color }]}>{label}</Text>
      <Text style={[styles.ratePillValue, { color }]}>{value}</Text>
    </View>
  )
}

function BarRow({
  label, value, total, color, bg,
}: {
  label: string; value: number; total: number; color: string; bg: string
}) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <View style={styles.barRow}>
      <View style={styles.barHeader}>
        <View style={styles.barLabelGroup}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.barLabel}>{label}</Text>
        </View>
        <Text style={styles.barValue}>
          {value} <Text style={styles.barPct}>· {pct.toFixed(0)}%</Text>
        </Text>
      </View>
      <View style={[styles.barTrack, { backgroundColor: bg }]}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  body: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

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
  sectionTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
    marginBottom: 12,
  },
  empty: {
    fontSize: 13,
    color: '#9CA3AF',
    paddingVertical: 8,
    fontFamily: 'Inter_400Regular',
  },

  row3: { flexDirection: 'row', marginTop: 4 },
  vDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 10,
    marginVertical: 2,
  },
  statCol: { flex: 1 },
  statLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter_500Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: 'Inter_600SemiBold',
  },
  statValueText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Inter_600SemiBold',
  },

  progressWrap: { marginTop: 16, gap: 6 },
  progressTrack: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#15803D',
    borderRadius: 999,
  },
  progressText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
  },
  progressNum: {
    color: '#15803D',
    fontFamily: 'Inter_600SemiBold',
  },

  rateRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  ratePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  ratePillLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  ratePillValue: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  barList: { gap: 12 },
  barRow: { gap: 6 },
  barHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  barLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: '#374151',
    fontFamily: 'Inter_500Medium',
  },
  barValue: {
    fontSize: 13,
    lineHeight: 18,
    color: '#111827',
    fontFamily: 'Inter_600SemiBold',
  },
  barPct: {
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
  },
  barTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },

  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  recentRowDivider: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  recentTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_500Medium',
    color: '#111827',
  },
  recentMeta: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
})
