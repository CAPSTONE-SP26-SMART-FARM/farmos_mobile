import { io, Socket } from 'socket.io-client'
import { CONFIG, IS_DEV } from '@/constants/config'
import { tokenStorage } from '@/services/storage/tokenStorage'

const NAMESPACE = '/realtime'

class SocketService {
  private socket: Socket | null = null

  async connect(): Promise<void> {
    if (this.socket?.connected) return

    const token = await tokenStorage.getAccessToken()
    if (!token) return

    this.socket = io(`${CONFIG.API_URL}${NAMESPACE}`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    this.socket.on('connect', () => {
      if (IS_DEV) console.log('[Socket] Connected:', this.socket?.id)
    })

    this.socket.on('disconnect', (reason) => {
      if (IS_DEV) console.log('[Socket] Disconnected:', reason)
    })

    this.socket.on('connect_error', (err) => {
      if (IS_DEV) console.warn('[Socket] Error:', err.message)
    })
  }

  disconnect(): void {
    this.socket?.disconnect()
    this.socket = null
  }

  subscribeZone(zoneId: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve(false)
        return
      }
      this.socket.emit('zone.subscribe', { zoneId }, (res: { ok: boolean }) => {
        resolve(res?.ok ?? false)
      })
    })
  }

  on<T>(event: string, handler: (data: T) => void): void {
    this.socket?.on(event, handler)
  }

  off<T>(event: string, handler: (data: T) => void): void {
    this.socket?.off(event, handler)
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false
  }
}

export const socketService = new SocketService()
