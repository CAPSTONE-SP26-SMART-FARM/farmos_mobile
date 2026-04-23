import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ticketMessageApi } from '@/services/api/ticketMessage'
import { socketService } from '@/services/socket/socketService'
import { queryKeys } from '@/constants/queryKeys'
import type { ListTicketMessagesRes, TicketMessage } from '@/types/ticketMessage'

type MessageSocketPayload = {
  ticketId: string
  messageId: string
  senderId: string
  senderName: string
  senderAvatarUrl: string | null
  message: string
  createdAt: string
  isInternal: boolean
}

export function useTicketMessages(ticketId: string) {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.ticketMessages.list(ticketId),
    queryFn: () => ticketMessageApi.list(ticketId),
    enabled: !!ticketId,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  useEffect(() => {
    if (!ticketId) return

    socketService.subscribeTicket(ticketId)

    const handler = (payload: MessageSocketPayload) => {
      if (payload.ticketId !== ticketId) return

      qc.setQueryData<ListTicketMessagesRes>(
        queryKeys.ticketMessages.list(ticketId),
        (old) => {
          if (!old) {
            // No cache yet — just invalidate to trigger a fresh fetch
            qc.invalidateQueries({ queryKey: queryKeys.ticketMessages.list(ticketId) })
            return old
          }
          // Deduplicate: event may arrive twice (ticket room + user room)
          if (old.data.some((m) => m.id === payload.messageId)) return old

          const newMsg: TicketMessage = {
            id: payload.messageId,
            ticketId: payload.ticketId,
            senderId: payload.senderId,
            sender: {
              id: payload.senderId,
              fullName: payload.senderName,
              avatarUrl: payload.senderAvatarUrl,
            },
            message: payload.message,
            isInternal: payload.isInternal,
            createdAt: payload.createdAt,
            attachments: [],
          }
          return { ...old, data: [...old.data, newMsg] }
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.ticketMessages.list(ticketId) })
    },
  })
}
