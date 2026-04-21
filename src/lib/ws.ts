import type { WSEvent } from '../types'

type Handler = (event: WSEvent) => void

class WSClient {
    private socket: WebSocket | null = null
    private handlers: Map<string, Handler[]> = new Map()
    private matchId: string | null = null
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null
    private reconnectDelay = 1000
    
    connect(matchId: string){
        if (
            this.matchId === matchId &&
            this.socket &&
            (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)
        ) {
            return
        }

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }

        if (this.socket) {
            this.socket.onclose = null
            this.socket.onerror = null
            this.socket.onmessage = null
            this.socket.close()
            this.socket = null
        }

        this.matchId = matchId
        this.open()
    }
    
    private open() {
        if (!this.matchId) return
        const token = localStorage.getItem('token') ?? ''
        const base = import.meta.env.VITE_WS_URL ?? `ws://${window.location.host}`
        this.socket = new WebSocket(`${base}/ws?token=${token}&match_id=${this.matchId}`)

        this.socket.onmessage = (e) => {
            try {
                const event: WSEvent = JSON.parse(e.data)
                const fns = this.handlers.get(event.type) ?? []
                fns.forEach((fn) => fn(event))
            } catch {
                console.warn('ws: bad message', e.data)
            }
        }

        this.socket.onclose = () => this.scheduleReconnect()
        this.socket.onerror = () => this.socket?.close()
    }

    private scheduleReconnect() {
        if (this.reconnectTimer) return
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null
            this.reconnectDelay = Math.min(this.reconnectDelay * 2, 15000)
            this.open()
        }, this.reconnectDelay)
    }

    on(type:string, handler: Handler) {
        this.handlers.set(type, [...(this.handlers.get(type) ?? []), handler])
    }

    off(type:string, handler: Handler) {
        this.handlers.set(type, (this.handlers.get(type)??[]).filter((h) => h!==handler))
    }

    disconnect() {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
        this.matchId = null
        if (this.socket) {
            this.socket.onclose = null
            this.socket.onerror = null
            this.socket.onmessage = null
        }
        this.socket?.close()
        this.socket = null
        this.handlers.clear()
        this.reconnectDelay = 1000
    }
}

export const wsClient = new WSClient()
