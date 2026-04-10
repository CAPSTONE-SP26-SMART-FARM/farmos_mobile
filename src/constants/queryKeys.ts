export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (id: string) => ['users', id] as const,
  },
  sensorReading: {
    latestByAssignment: (assignmentId: string) =>
      ['sensor-reading', 'latest', assignmentId] as const,
  },
} as const
