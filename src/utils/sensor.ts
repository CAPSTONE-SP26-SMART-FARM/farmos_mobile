import type { MaterialIcons } from '@expo/vector-icons'

type IconName = React.ComponentProps<typeof MaterialIcons>['name']

export type SensorKind = 'soil_moisture' | 'air_temperature' | 'air_humidity' | 'light_intensity'

export const SENSOR_ICON: Record<SensorKind, IconName> = {
  soil_moisture: 'grass',
  air_temperature: 'device-thermostat',
  air_humidity: 'water-drop',
  light_intensity: 'wb-sunny',
}

export const SENSOR_UNIT: Record<SensorKind, string> = {
  soil_moisture: '%',
  air_temperature: '°C',
  air_humidity: '%',
  light_intensity: '%',
}

/**
 * Suy ra loại sensor từ text (title/content/message tiếng Việt).
 * BE đặt theo format cố định: "Cảm biến độ ẩm đất ...", "Cảm biến nhiệt độ không khí ...".
 * Thứ tự match quan trọng — cụm dài check trước (vd "độ ẩm đất" trước "độ ẩm").
 */
export function detectSensorKind(text: string): SensorKind | null {
  if (!text) return null
  const t = text.toLowerCase()
  if (t.includes('độ ẩm đất')) return 'soil_moisture'
  if (t.includes('độ ẩm không khí') || t.includes('độ ẩm kk')) return 'air_humidity'
  if (t.includes('nhiệt độ')) return 'air_temperature'
  if (t.includes('ánh sáng') || t.includes('cường độ ánh sáng')) return 'light_intensity'
  return null
}
