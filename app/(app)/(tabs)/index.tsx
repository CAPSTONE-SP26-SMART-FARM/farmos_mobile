import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Text } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { icons } from '@/constants/icon'
import { CONFIG } from '@/constants/config'
import { useDoctorIncidentList } from '@/hooks/useDoctor'
import { useIncidentList } from '@/hooks/useIncident'
import { useTasksForDailyLog } from '@/hooks/useDailyLog'
import { EarningsCard } from '@/components/features/home/EarningsCard'
import { DoctorStatusCard } from '@/components/features/home/DoctorStatusCard'
import { IncidentSummaryCard } from '@/components/features/home/IncidentSummaryCard'
import { FarmStatusCard } from '@/components/features/home/FarmStatusCard'
import { TodayScheduleCard } from '@/components/features/home/TodayScheduleCard'
import { QuickActionsCard, type QuickActionItem } from '@/components/features/home/QuickActionsCard'
import { TipsCard } from '@/components/features/home/TipsCard'

const NotiIcon = icons.notiBgSvg
const EditProfileBgIcon = icons.editProfileBgSvg
const IncidentIcon = icons.incidentSvg
const AlertIcon = icons.alertSvg
const PlusIcon = icons.plusSvg

const DOCTOR_QUICK_ACTIONS: QuickActionItem[] = [
  {
    Icon: EditProfileBgIcon,
    label: 'Cập nhật hồ sơ',
    onPress: () => router.push('/(app)/(tabs)/profile'),
    selfContained: true,
  },
  {
    Icon: IncidentIcon,
    label: 'Kê khai sự cố',
    onPress: () => router.push('/(app)/(tabs)/incidents'),
  },
]

const FARMER_QUICK_ACTIONS: QuickActionItem[] = [
  {
    Icon: PlusIcon,
    label: 'Tạo sự cố',
    onPress: () => router.push('/(app)/incident/create'),
  },
  {
    Icon: IncidentIcon,
    label: 'Sự cố',
    onPress: () => router.push('/(app)/(tabs)/incidents'),
  },
  {
    Icon: AlertIcon,
    label: 'Cảnh báo',
    onPress: () => router.push('/(app)/(tabs)/alerts'),
  },
]

function DoctorHome({ isApproved, userName }: { isApproved: boolean; userName: string }) {
  const { data: activeData } = useDoctorIncidentList(1, false)
  const { data: resolvedData } = useDoctorIncidentList(1, true)
  const allTickets = [...(activeData?.data ?? []), ...(resolvedData?.data ?? [])]
  const activeCount = activeData?.data?.length ?? 0

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <EarningsCard />
      <TodayScheduleCard userName={userName} tickets={allTickets} delay={150} />
      <DoctorStatusCard isApproved={isApproved} activeCount={activeCount} />
      <QuickActionsCard items={DOCTOR_QUICK_ACTIONS} delay={200} />
      <TipsCard
        title='Hướng dẫn bác sĩ FarmOS'
        description='Tìm hiểu cách nhận và xử lý sự cố từ nông dân hiệu quả'
        onPress={() =>
          WebBrowser.openBrowserAsync(CONFIG.HELP_DOCTOR_URL, {
            presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
            toolbarColor: '#FFFFFF',
            controlsColor: '#2463EB',
          })
        }
        delay={250}
      />
      <View style={styles.bottomSpacer} />
    </ScrollView>
  )
}

function FarmerHome({ userName }: { userName: string }) {
  const { data } = useIncidentList()
  const tickets = data?.data ?? []
  const { data: tasksData } = useTasksForDailyLog()
  const tasksCount = tasksData?.data?.length ?? 0

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <IncidentSummaryCard tickets={tickets} />
      <TodayScheduleCard userName={userName} tickets={tickets} tasksCount={tasksCount} delay={150} />
      <FarmStatusCard />
      <QuickActionsCard items={FARMER_QUICK_ACTIONS} delay={200} />
      <TipsCard
        title='Hướng dẫn báo cáo sự cố'
        description='Mô tả chi tiết và chọn đúng mức độ để được hỗ trợ nhanh nhất'
        onPress={() =>
          WebBrowser.openBrowserAsync(CONFIG.HELP_INCIDENT_URL, {
            presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
            toolbarColor: '#FFFFFF',
            controlsColor: '#2463EB',
          })
        }
        delay={250}
      />
      <View style={styles.bottomSpacer} />
    </ScrollView>
  )
}

export default function HomeScreen() {
  const { user } = useAuth()
  const isDoctor = user?.role === 'doctor'
  const isApproved = user?.isActive ?? false
  const userName = user?.fullName ?? 'FarmOS'

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.greeting}>
          <Text style={styles.greetSub}>Chào mừng trở lại,</Text>
          <Text style={styles.greetName}>{userName}</Text>
        </View>
        <TouchableOpacity
          style={styles.notiBtnWrap}
          onPress={() => router.push('/(app)/(tabs)/notifications')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <NotiIcon width={36} height={36} />
        </TouchableOpacity>
      </View>

      {isDoctor
        ? <DoctorHome isApproved={isApproved} userName={userName} />
        : <FarmerHome userName={userName} />
      }
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: { gap: 2 },
  greetSub: { fontSize: 13, color: '#6B7280', fontFamily: 'Inter_400Regular' },
  greetName: { fontSize: 22, color: '#111827', fontFamily: 'Inter_600SemiBold' },
  notiBtnWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  bottomSpacer: { height: 24 },
})
