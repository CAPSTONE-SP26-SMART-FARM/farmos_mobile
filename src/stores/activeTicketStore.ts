import { create } from 'zustand'

/**
 * Tracks which incident detail screen the user is currently viewing.
 * Used so the list-level socket listener can skip showing a duplicate
 * native Alert when the detail screen is already handling the event
 * via its own AbandonModal.
 */
interface ActiveTicketState {
  activeTicketId: string | null
  setActiveTicketId: (id: string | null) => void
}

export const useActiveTicketStore = create<ActiveTicketState>((set) => ({
  activeTicketId: null,
  setActiveTicketId: (id) => set({ activeTicketId: id }),
}))
