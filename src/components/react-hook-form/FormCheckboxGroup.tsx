import React from 'react'
import { Control, Controller, FieldValues, Path } from 'react-hook-form'
import { View, StyleSheet } from 'react-native'
import { Checkbox } from '@/components/ui'

export interface CheckboxGroupOption<T extends FieldValues> {
  name: Path<T>
  label: React.ReactNode
}

interface Props<T extends FieldValues> {
  control: Control<T>
  options: CheckboxGroupOption<T>[]
  disabled?: boolean
  readOnly?: boolean
}

export const FormCheckboxGroup = <T extends FieldValues>({
  control,
  options,
  disabled,
  readOnly,
}: Props<T>) => (
  <View style={styles.container}>
    {options.map((opt) => (
      <Controller
        key={opt.name as string}
        control={control}
        name={opt.name}
        render={({ field: { value, onChange } }) => (
          <Checkbox
            label={opt.label}
            checked={!!value}
            onPress={() => onChange(!value)}
            disabled={disabled}
            readOnly={readOnly}
          />
        )}
      />
    ))}
  </View>
)

const styles = StyleSheet.create({ container: { gap: 12 } })
