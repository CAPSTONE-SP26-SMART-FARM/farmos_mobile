import { Control, Controller, FieldValues, Path, RegisterOptions } from 'react-hook-form'
import { TextField } from '@/components/ui'
import { KeyboardTypeOptions } from 'react-native'

interface FormTextFieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  rules?: RegisterOptions<T>
  label: string
  placeholder?: string
  keyboardType?: KeyboardTypeOptions
  maxLength?: number
  autoFocus?: boolean
  readOnly?: boolean
  showClear?: boolean
  showError?: boolean
  secureTextEntry?: boolean
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  autoComplete?: string
  transform?: (value: string) => string
}

export const FormTextField = <T extends FieldValues>({
  control,
  name,
  rules,
  label,
  placeholder,
  keyboardType,
  maxLength,
  autoFocus,
  readOnly,
  showClear,
  showError,
  secureTextEntry,
  autoCapitalize,
  autoComplete,
  transform,
}: FormTextFieldProps<T>) => (
  <Controller
    control={control}
    name={name}
    rules={rules}
    render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
      <TextField
        label={label}
        placeholder={placeholder}
        value={value ?? ''}
        onChangeText={(text) => onChange(transform ? transform(text) : text)}
        onBlur={onBlur}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoFocus={autoFocus}
        error={error?.message}
        readOnly={readOnly}
        showClear={showClear}
        showError={showError}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete as any}
      />
    )}
  />
)
