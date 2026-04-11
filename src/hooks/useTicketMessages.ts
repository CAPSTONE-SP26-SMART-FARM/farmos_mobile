import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ticketMessageApi } from '@/services/api/ticketMessage'
import { socketService } from '@/services/socket/socketService'
import { queryKeys } from '@/constants/queryKeys'
import type { ListTicketMessagesRes, TicketMessage } from '@/types/ticketMessage'

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
      qc.setQueryData<ListTicketMessagesRes>(
        queryKeys.ticketMessages.list(ticketId),
        (old) => {
          if (!old) return old
          if (old.data.some((m) => m.id === msg.id)) return old
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
      qc.setQueryData<ListTicketMessagesRes>(
        queryKeys.ticketMessages.list(ticketId),
        (old) => {
          if (!old) return old
          if (old.data.some((m) => m.id === newMsg.id)) return old
          return { ...old, data: [...old.data, newMsg] }
        }
      )
    },
  })
}
