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
  sensorReading: {
    latestByAssignment: (assignmentId: string) =>
      ['sensor-reading', 'latest', assignmentId] as const,
  },
  ticketMessages: {
    list: (ticketId: string) => ['ticket-messages', ticketId] as const,
  },
} as const
