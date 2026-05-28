import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { BottomSheet, Text } from '@/components/ui'
import { icons } from '@/constants/icon'

const ArrowDownIcon = icons.arrowDownSvg

export interface FilterOption<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  value: T
  options: readonly FilterOption<T>[]
  onChange: (value: T) => void
  title?: string
  /** Prefix hiển thị trước value để user biết filter theo cái gì, vd "Trạng thái". */
  prefix?: string
}

export function IncidentStatusFilter<T extends string>({
  value,
  options,
  onChange,
  title = 'Lọc trạng thái',
  prefix,
}: Props<T>) {
  const [visible, setVisible] = useState(false)
  const current = options.find((o) => o.value === value)

  const handleSelect = (next: T) => {
    onChange(next)
    setVisible(false)
  }

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.dropdown, pressed && { opacity: 0.6 }]}
        onPress={() => setVisible(true)}
      >
        {prefix ? <Text style={styles.prefix}>{prefix}:</Text> : null}
        <Text style={styles.text}>{current?.label ?? 'Lọc'}</Text>
        <ArrowDownIcon width={20} height={20} color='#4B5563' />
      </Pressable>

      <BottomSheet visible={visible} onClose={() => setVisible(false)}>
        <BottomSheet.Header title={title} onClose={() => setVisible(false)} />
        <View style={styles.options}>
          <BottomSheet.SelectOption
            data={options as FilterOption<T>[]}
            keyExtractor={(o) => o.value}
            labelExtractor={(o) => o.label}
            valueExtractor={(o) => o.value}
            selectedValue={value}
            onSelect={(o) => handleSelect(o.value)}
          />
        </View>
      </BottomSheet>
    </>
  )
}

const styles = StyleSheet.create({
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    paddingLeft: 14,
    paddingRight: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 6,
  },
  prefix: { fontSize: 13, lineHeight: 20, fontFamily: 'Inter_500Medium', color: '#9CA3AF' },
  text: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_600SemiBold', color: '#4B5563' },
  options: { gap: 0 },
})
