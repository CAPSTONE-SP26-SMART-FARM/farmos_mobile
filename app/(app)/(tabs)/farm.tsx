import { useMemo } from 'react'
import { useRouter } from 'expo-router'
import { View, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { Text, EmptyState } from '@/components/ui'
import { useFarmerCurrentUpcomingMilestones } from '@/hooks/useFarmerMilestones'
import { icons } from '@/constants/icon'
import type { FarmerCurrentUpcomingMilestone } from '@/types/farmerIot'

type ZoneEntry = {
  zoneName: string
  milestone: FarmerCurrentUpcomingMilestone
}

export default function FarmScreen() {
  const router = useRouter()
  const { data: milestones = [], isLoading } = useFarmerCurrentUpcomingMilestones()

  // Per zone, keep only the currently in-progress milestone.
  // Zones with no active milestone are hidden — farmer can't work there yet.
  const zones: ZoneEntry[] = useMemo(() => {
    const byZone = new Map<string, FarmerCurrentUpcomingMilestone>()
    for (const m of milestones) {
      if (m.status !== 'in_progress') continue
      const existing = byZone.get(m.zoneId)
      if (!existing || m.milestoneOrder < existing.milestoneOrder) {
        byZone.set(m.zoneId, m)
      }
    }
    return Array.from(byZone.values())
      .map((milestone) => ({ zoneName: milestone.zoneName, milestone }))
      .sort((a, b) => a.zoneName.localeCompare(b.zoneName))
  }, [milestones])

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Trang trại</Text>
        <Text style={styles.subtitle}>Khu vực bạn đang làm việc</Text>
      </View>
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color='#15803D' />
        ) : zones.length === 0 ? (
          <EmptyState message='Chưa có khu vực nào đang hoạt động.' Icon={icons.emptyCartSvg} />
        ) : (
          <View style={styles.list}>
            {zones.map(({ zoneName, milestone }) => (
              <TouchableOpacity
                key={milestone.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/farm/milestone/[milestoneId]',
                    params: {
                      milestoneId: milestone.id,
                      stageName: milestone.stageName,
                      milestoneStatus: milestone.status,
                    },
                  })
                }
              >
                <View style={styles.cardContent}>
                  <View style={styles.zoneRow}>
                    <MaterialIcons name='place' size={16} color='#15803D' />
                    <Text style={styles.zoneName}>{zoneName}</Text>
                  </View>
                  <Text style={styles.stageName} numberOfLines={1}>
                    {milestone.stageName}
                  </Text>
                  <View style={styles.statusRow}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusLabel}>Đang diễn ra</Text>
                  </View>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: '#FFFFFF' },
  title: { fontSize: 24, lineHeight: 32, color: '#111827', fontFamily: 'Inter_600SemiBold' },
  subtitle: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter_400Regular', marginTop: 2 },
  body: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, paddingBottom: 32 },
  list: { gap: 12 },

  card: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardContent: { flex: 1, gap: 4 },
  zoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  zoneName: {
    fontSize: 13,
    color: '#15803D',
    fontFamily: 'Inter_600SemiBold',
  },
  stageName: { fontSize: 15, color: '#111827', fontFamily: 'Inter_600SemiBold', lineHeight: 22 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
  statusLabel: { fontSize: 12, color: '#16A34A', fontFamily: 'Inter_500Medium' },
  chevron: { fontSize: 22, color: '#9CA3AF' },
})
