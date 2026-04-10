import { apiClient } from './client'

export type SensorReading = {
  sensorId: string
  sensorType: string
  timestamp: string | null
  value: number | null
  minValue: string
  maxValue: string
  threshold: {
    source: 'milestone' | 'zone'
    optimalMin: number
    optimalMax: number
  } | null
  isSafe: boolean | null
}

export type LatestReadingsRes = {
  assignmentId: string
  zoneId: string
  milestoneId: string
  data: SensorReading[]
}

export const sensorReadingApi = {
  getLatestByAssignment: (assignmentId: string) =>
    apiClient
      .get<{ data: LatestReadingsRes }>(`/sensor-reading/farmer/assignment/${assignmentId}/latest`)
      .then((r) => r.data.data),
}
