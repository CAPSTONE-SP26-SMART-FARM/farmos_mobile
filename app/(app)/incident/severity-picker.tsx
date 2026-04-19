import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Text } from '@/components/ui'
import { SEVERITY_META } from '@/constants/incident'
import type { IncidentSeverity } from '@/types/incident'

const OPTIONS = (Object.keys(SEVERITY_META) as IncidentSeverity[]).map((value) => ({
  value,
  ...SEVERITY_META[value],
}))

export default function SeverityPickerScreen() {
  const router = useRouter()
  const { current } = useLocalSearchParams<{ current: IncidentSeverity }>()

  const handleSelect = (value: IncidentSeverity) => {
    // Trả giá trị về create screen qua search params thay vì pickerCallback
    router.back()
    router.setParams({ severity: value })
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Text style={styles.title}>Mức độ nghiêm trọng</Text>

      <View style={styles.list}>
        {OPTIONS.map((opt) => {
          const selected = current === opt.value
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.item, selected && { backgroundColor: opt.color + '10' }]}
              onPress={() => handleSelect(opt.value)}
              activeOpacity={0.7}
            >
              <View style={[styles.dot, { backgroundColor: opt.color }]} />
              <View style={styles.info}>
                <Text style={[styles.label, { color: selected ? opt.color : '#111827' }]}>
                  {opt.label}
                </Text>
                <Text style={styles.desc}>{opt.desc}</Text>
              </View>
              {selected && (
                <View style={[styles.check, { backgroundColor: opt.color }]}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  title: {
    fontSize: 16, color: '#111827', fontFamily: 'Inter_600SemiBold',
    textAlign: 'center', paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 12, marginTop: 8,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  info: { flex: 1 },
  label: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  desc: { fontSize: 12, color: '#9CA3AF', fontFamily: 'Inter_400Regular' },
  check: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  checkText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
})
