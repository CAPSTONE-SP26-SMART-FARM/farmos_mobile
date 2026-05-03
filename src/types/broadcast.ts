export type BroadcastStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'IGNORED'

export type DoctorBroadcast = {
  id: string
  ticketId: string
  ticketNumber: string
  title: string
  description: string
  severity: string
  priority: string
  status: BroadcastStatus
  notifiedAt: string
  respondedAt: string | null
}

export type DoctorBroadcastsRes = {
  data: DoctorBroadcast[]
}
