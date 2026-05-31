import { Tabs } from 'expo-router'
import { HapticTab } from '@/components/HapticTab'
import { TabBarIcon } from '@/components/ui/TabBarIcon'
import { icons } from '@/constants/icon'
import { useAuth } from '@/hooks/useAuth'

export default function TabsLayout() {
  const { user } = useAuth()
  const isDoctor = user?.role === 'doctor'

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#15803D',
        tabBarInactiveTintColor: '#6B7280',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter_500Medium',
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          height: 85,
          paddingBottom: 12,
          paddingTop: 8,
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
        },
      }}
    >
      {/* ── Shared ── */}
      <Tabs.Screen
        name='index'
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} Icon={icons.houseSvg} />
          ),
        }}
      />

      {/* ── Farmer-only tabs ── */}
      <Tabs.Screen
        name='farm'
        options={{
          href: isDoctor ? null : undefined,
          title: 'Trang trại',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} Icon={icons.motionSensorSvg} />
          ),
        }}
      />

      {/* ── Shared: Incidents ── */}
      <Tabs.Screen
        name='incidents'
        options={{
          title: 'Sự cố',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} Icon={icons.incidentSvg} />
          ),
        }}
      />

      {/* ── Farmer-only: Alerts ── */}
      <Tabs.Screen
        name='alerts'
        options={{
          href: isDoctor ? null : undefined,
          title: 'Cảnh báo',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} Icon={icons.alertSvg} />
          ),
        }}
      />

      {/* ── Shared: Profile ── */}
      <Tabs.Screen
        name='profile'
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} Icon={icons.userSvg} />
          ),
        }}
      />

      {/* ── Hidden helper screens ── */}
      <Tabs.Screen name='notifications' options={{ href: null }} />
      <Tabs.Screen name='doctor-profile' options={{ href: null }} />
      <Tabs.Screen name='farmer-profile' options={{ href: null }} />
    </Tabs>
  )
}
