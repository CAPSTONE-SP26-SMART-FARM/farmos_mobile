import { Tabs } from 'expo-router'
import { HapticTab } from '@/components/HapticTab'
import { TabBarIcon } from '@/components/ui/TabBarIcon'
import { icons } from '@/constants/icon'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2463EB',
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
      <Tabs.Screen
        name='index'
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} Icon={icons.houseSvg} />
          ),
        }}
      />
      <Tabs.Screen
        name='explore'
        options={{
          title: 'Khám phá',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} Icon={icons.magnifierSvg} />
          ),
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} Icon={icons.userSvg} />
          ),
        }}
      />
    </Tabs>
  )
}
