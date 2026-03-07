import { Text, TextInput, TextInputProps, View } from 'react-native'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className, ...props }: InputProps) {
  return (
    <View className="gap-1">
      {label && <Text className="text-sm font-medium text-gray-700">{label}</Text>}
      <TextInput
        className={`border rounded-lg px-3 py-2.5 text-base text-gray-900
          ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}
          ${className ?? ''}
        `}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && <Text className="text-xs text-red-500">{error}</Text>}
      {hint && !error && <Text className="text-xs text-gray-500">{hint}</Text>}
    </View>
  )
}
