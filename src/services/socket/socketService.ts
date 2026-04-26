import { io, Socket } from 'socket.io-client'
import { CONFIG, IS_DEV } from '@/constants/config'
import { tokenStorage } from '@/services/storage/tokenStorage'

const NAMESPACE = '/realtime'

type AnyHandler = (data: any) => void

class SocketService {
  private socket: Socket | null = null
  // Listener registry — re-bind sang socket thật khi connect/reconnect
  // để tránh race condition: hooks gọi .on() trước khi socket connect xong.
  private listeners = new Map<string, Set<AnyHandler>>()

  async connect(): Promise<void> {
    if (this.socket?.connected) return

    const token = await tokenStorage.getAccessToken()
    if (!token) return

    // Nếu đã có socket cũ (lúc disconnect chưa dọn) thì cleanup trước
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
    }

    const sock = io(`${CONFIG.API_URL}${NAMESPACE}`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })
    this.socket = sock

    sock.on('connect', () => {
      if (IS_DEV) console.log('[Socket] Connected:', sock.id)
      // Re-bind toàn bộ listener đã đăng ký vào socket thật.
      // Cần thiết khi reconnect: socket.io tự bind lại các listener đã set
      // trên cùng instance, nhưng pattern này đảm bảo cả khi instance đổi.
      this.rebindAll()
    })

    sock.on('disconnect', (reason) => {
      if (IS_DEV) console.log('[Socket] Disconnected:', reason)
    })

    sock.on('connect_error', (err) => {
      if (IS_DEV) console.warn('[Socket] Error:', err.message)
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
    }
    // GIỮ listeners registry — khi user logout/login lại, listener tự re-bind
    // sang socket mới qua rebindAll() trong handler 'connect'.
  }

  private rebindAll() {
    if (!this.socket) return
    for (const [event, handlers] of this.listeners) {
      for (const h of handlers) this.socket.on(event, h)
    }
  }

  subscribeZone(zoneId: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) { resolve(false); return }
      this.socket.emit('zone.subscribe', { zoneId }, (res: { ok: boolean }) => {
        resolve(res?.ok ?? false)
      })
    })
  }

  subscribeTicket(ticketId: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) { resolve(false); return }
      this.socket.emit('ticket.subscribe', { ticketId }, (res: { ok: boolean }) => {
        if (IS_DEV) console.log('[Socket] ticket.subscribe', ticketId, res)
        resolve(res?.ok ?? false)
      })
    })
  }

  on<T>(event: string, handler: (data: T) => void): void {
    let set = this.listeners.get(event)
    if (!set) {
      set = new Set()
      this.listeners.set(event, set)
    }
    set.add(handler as AnyHandler)
    // Bind ngay nếu socket đã connect; nếu chưa, rebindAll() sẽ lo lúc connect.
    this.socket?.on(event, handler as AnyHandler)
  }

  off<T>(event: string, handler: (data: T) => void): void {
    const set = this.listeners.get(event)
    if (set) {
      set.delete(handler as AnyHandler)
      if (set.size === 0) this.listeners.delete(event)
    }
    this.socket?.off(event, handler as AnyHandler)
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false
  }
}

export const socketService = new SocketService()
