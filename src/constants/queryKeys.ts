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
} as const
