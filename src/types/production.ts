export type ProductionMilestoneStatus = 'pending' | 'in_progress' | 'completed'

export type FarmerMyMilestone = {
  id: string
  stageName: string
  status: ProductionMilestoneStatus
  cropSeasonId: string
  farmId: string
  zoneName: string
}

export type FarmerDevice = {
  iotDeviceId: string
  deviceName: string
  deviceType: string
  macAddress: string | null
  status: string
}

export type FarmerSensor = {
  sensorId: string
  sensorType: string
  status: string
  minValue: number
  maxValue: number
}

export type FarmerAssignment = {
  assignmentId: string
  startAt: string | null
  endAt: string | null
  assignedAt: string
  device: FarmerDevice
  sensors: FarmerSensor[]
}
