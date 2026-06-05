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
  // Round 6 BE: payload nay include attachments full → mobile setQueryData
  // trực tiếp, không cần refetch.
  attachments?: {
    id: string
    url: string
    uploadedBy: string
    createdAt: string
  }[]
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
            // Round 6: payload đã có attachments inline (không cần refetch).
            attachments: payload.attachments ?? [],
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
    mutationFn: ({ message, attachments }: { message: string; attachments?: { url: string }[] }) =>
      ticketMessageApi.send(ticketId, {
        message,
        ...(attachments && attachments.length > 0 ? { attachments } : {}),
        clientMessageId: `${ticketId}-${Date.now()}`,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.ticketMessages.list(ticketId) })
    },
  })
}
