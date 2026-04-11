import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ticketMessageApi } from '@/services/api/ticketMessage'
import { socketService } from '@/services/socket/socketService'
import { queryKeys } from '@/constants/queryKeys'
import type { TicketMessage } from '@/types/ticketMessage'

export function useTicketMessages(ticketId: string) {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.ticketMessages.list(ticketId),
    queryFn: () => ticketMessageApi.list(ticketId),
    enabled: !!ticketId,
  })

  useEffect(() => {
    if (!ticketId) return
    socketService.subscribeTicket(ticketId)

    const handler = (msg: TicketMessage) => {
      qc.setQueryData(
        queryKeys.ticketMessages.list(ticketId),
        (old: typeof query.data) => {
          if (!old) return old
          const exists = old.data.some((m) => m.id === msg.id)
          if (exists) return old
          return { ...old, data: [...old.data, msg] }
        }
      )
    }

    socketService.on('ticket.message.created', handler)
    return () => socketService.off('ticket.message.created', handler)
  }, [ticketId, qc])

  return query
}

export function useSendMessage(ticketId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (message: string) =>
      ticketMessageApi.send(ticketId, {
        message,
        clientMessageId: `${ticketId}-${Date.now()}`,
      }),
    onSuccess: (newMsg) => {
      qc.setQueryData(
        queryKeys.ticketMessages.list(ticketId),
        (old: Awaited<ReturnType<typeof ticketMessageApi.list>> | undefined) => {
          if (!old) return old
          const exists = old.data.some((m) => m.id === newMsg.id)
          if (exists) return old
          return { ...old, data: [...old.data, newMsg] }
        }
      )
    },
  })
}
