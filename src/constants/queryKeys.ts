export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (id: string) => ['users', id] as const,
  },
  incident: {
    list: (page?: number) => ['incident', 'list', page] as const,
    detail: (id: string) => ['incident', id] as const,
    doctorDetail: (id: string) => ['incident', 'doctor-detail', id] as const,
    doctorList: (page?: number, ended?: boolean) =>
      ['incident', 'doctor-list', page, ended === undefined ? 'all' : ended ? 'ended' : 'active'] as const,
  },
  doctor: {
    myProfile: ['doctor', 'my-profile'] as const,
    myRequests: (page?: number) => ['doctor', 'my-requests', page] as const,
    requestDetail: (id: string) => ['doctor', 'request', id] as const,
    myAssignments: (page?: number) => ['doctor', 'my-assignments', page] as const,
    assignmentDetail: (id: string) => ['doctor', 'assignment', id] as const,
  },
  productionMilestone: {
    myMilestones: ['production-milestone', 'my-milestones'] as const,
  },
  sensorReading: {
    latestByAssignment: (assignmentId: string) =>
      ['sensor-reading', 'latest', assignmentId] as const,
    myAssignments: ['sensor-reading', 'my-assignments'] as const,
  },
  ticketMessages: {
    list: (ticketId: string) => ['ticket-messages', ticketId] as const,
  },
  prescriptions: {
    list: (ticketId: string) => ['prescriptions', ticketId] as const,
    detail: (ticketId: string, prescriptionId: string) =>
      ['prescriptions', ticketId, prescriptionId] as const,
  },
  notifications: {
    list: (page?: number) => ['notifications', 'list', page] as const,
  },
  alerts: {
    list: (page?: number) => ['alerts', 'list', page] as const,
  },
  doctorWallet: {
    summary: ['doctor-wallet', 'summary'] as const,
    transactions: (page?: number, type?: string) =>
      ['doctor-wallet', 'transactions', page, type ?? 'all'] as const,
  },
} as const
