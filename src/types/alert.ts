export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface Alert {
  id: string
  zoneId: string
  zoneName: string
  farmId: string
  farmName: string
  sensorId: string | null
  deviceId: string | null
  deviceName: string | null
  deviceLabel: string | null
  alertType: string
  severity: AlertSeverity
  title: string
  message: string
  thresholdValue: string | null
  actualValue: string | null
  // BE bổ sung sau (join sensor → sensor_threshold) — optional để không vỡ khi chưa có
  optimalMin?: number | null
  optimalMax?: number | null
  sensorType?: string | null
  isResolved: boolean
  resolvedAt: string | null
  createdAt: string
}

export interface ListAlertsRes {
  data: Alert[]
  meta: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
}
