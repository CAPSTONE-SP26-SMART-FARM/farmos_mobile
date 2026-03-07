import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends TouchableOpacityProps {
  title: string
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variantStyles: Record<Variant, { container: string; text: string }> = {
  primary: { container: 'bg-primary-600 active:bg-primary-700', text: 'text-white' },
  secondary: { container: 'bg-gray-200 active:bg-gray-300', text: 'text-gray-800' },
  outline: { container: 'border border-primary-600 bg-transparent', text: 'text-primary-600' },
  ghost: { container: 'bg-transparent', text: 'text-primary-600' },
  destructive: { container: 'bg-red-600 active:bg-red-700', text: 'text-white' },
}

const sizeStyles: Record<Size, { container: string; text: string }> = {
  sm: { container: 'px-3 py-1.5 rounded-md', text: 'text-sm' },
  md: { container: 'px-4 py-2.5 rounded-lg', text: 'text-base' },
  lg: { container: 'px-6 py-3.5 rounded-xl', text: 'text-lg' },
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <TouchableOpacity
      className={`flex-row items-center justify-center
        ${variantStyles[variant].container}
        ${sizeStyles[size].container}
        ${fullWidth ? 'w-full' : 'self-start'}
        ${isDisabled ? 'opacity-50' : ''}
        ${className ?? ''}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading && <ActivityIndicator size="small" className="mr-2" color="white" />}
      <Text className={`font-semibold ${variantStyles[variant].text} ${sizeStyles[size].text}`}>
        {title}
      </Text>
    </TouchableOpacity>
  )
}
