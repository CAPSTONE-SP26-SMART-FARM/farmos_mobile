export type TicketMessageSender = {
  id: string
  fullName: string
  avatarUrl: string | null
}

export type TicketMessage = {
  id: string
  ticketId: string
  senderId: string
  sender: TicketMessageSender
  message: string
  isInternal: boolean
  createdAt: string
  attachments: { id: string; url: string; uploadedBy: string; createdAt: string }[]
}

export type CreateTicketMessageBody = {
  message: string
  /**
   * Attachment URL đã upload Cloudinary (round 6 BE handoff).
   * BE tự tạo `TicketAttachment` rows + link vào message. Trả về với UUID đầy đủ.
   */
  attachments?: { url: string }[]
  clientMessageId?: string
}

export type ListTicketMessagesRes = {
  data: TicketMessage[]
  meta: { page: number; limit: number; totalItems: number; totalPages: number }
}
