import { apiClient } from './client'
import type {
  SensorSeriesQuery,
  SensorSeriesRes,
  SensorStatsQuery,
  SensorStatsRes,
} from '@/types/farmerIot'

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

  // Interval-bucketed time-series — route chung mọi role, không prefix.
  getSeries: (assignmentId: string, sensorId: string, query: SensorSeriesQuery = {}) =>
    apiClient
      .get<{ data: SensorSeriesRes }>(
        `/sensor-reading/assignment/${assignmentId}/sensor/${sensorId}/series-interval`,
        { params: query },
      )
      .then((r) => r.data.data),

  // Summary stats (4 badge) — route chung mọi role, không prefix.
  getStats: (assignmentId: string, sensorId: string, query: SensorStatsQuery = {}) =>
    apiClient
      .get<{ data: SensorStatsRes }>(
        `/sensor-reading/assignment/${assignmentId}/sensor/${sensorId}/stats`,
        { params: query },
      )
      .then((r) => r.data.data),
}
