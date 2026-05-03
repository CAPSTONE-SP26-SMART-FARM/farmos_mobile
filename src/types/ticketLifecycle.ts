export type AbandonResolution = 'FALLBACK_AI' | 'REFUND_TICKET'

export type RateTicketBody = {
  stars: number
  feedback?: string
}

export type AbandonResolutionBody = {
  resolution: AbandonResolution
  note?: string
}
