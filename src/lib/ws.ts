import type { WSEvent } from '../types'

type Handler = (event: WSEvent) => void

class WSClient {
    private socket: WebSocket | null = null
    private handlers: Map<string, Handler[]> = new Map()
    private matchId: string | null = null
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null
    private reconnectDelay = 1000
    private destroyed = false
    private sessionId = 0

    connect(matchId: string) {
        if (this.matchId === matchId &&
            (this.socket?.readyState === WebSocket.OPEN ||
                this.socket?.readyState === WebSocket.CONNECTING)) {
            return
        }

        this.destroyed = true
        this.sessionId += 1
        this.clearReconnectTimer()
        this.socket?.close()
        this.socket = null
        this.destroyed = false
        this.matchId = matchId
        this.reconnectDelay = 1000
        this.open(this.sessionId)
    }

    private open(sessionId = this.sessionId) {
        if (!this.matchId || this.destroyed) {
            console.log('WS open bailed:', { matchId: this.matchId, destroyed: this.destroyed })
            return
        }
        const token = localStorage.getItem('token') ?? ''
        const base = import.meta.env.VITE_WS_URL ?? `ws://${window.location.host}`
        const socket = new WebSocket(`${base}/ws?token=${token}&match_id=${this.matchId}`)
        this.socket = socket

        socket.onmessage = (e) => {
            if (this.socket !== socket || sessionId !== this.sessionId) return
            try {
                const event: WSEvent = JSON.parse(e.data)
                const fns = this.handlers.get(event.type) ?? []
                fns.forEach((fn) => fn(event))
            } catch {
                console.warn('ws: bad message', e.data)
            }
        }

        socket.onerror = () => {
            if (this.socket !== socket || sessionId !== this.sessionId) return
            socket.close()
        }

        socket.onclose = (e) => {
            if (this.socket === socket) {
                this.socket = null
            }
            if (sessionId !== this.sessionId || this.destroyed) {
                return
            }
            // code 1008 = policy violation (auth failure)
            if (e.code === 1008 || e.code === 4001) {
                // Token expired — clear auth and redirect
                localStorage.removeItem('token')
                window.location.href = '/login'
                return
            }
            this.scheduleReconnect(sessionId)
        }
    }

    private scheduleReconnect(sessionId: number) {
        if (this.reconnectTimer || this.destroyed) return
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null
            if (sessionId !== this.sessionId || this.destroyed) return
            this.reconnectDelay = Math.min(this.reconnectDelay * 2, 15000)
            this.open(sessionId)
        }, this.reconnectDelay)
    }

    private clearReconnectTimer() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }
    }

    disconnectIfMatch(matchId: string) {
        if (this.matchId === matchId) {
            this.disconnect()
        }
    }
    on(type: string, handler: Handler) {
        this.handlers.set(type, [...(this.handlers.get(type) ?? []), handler])
    }

    off(type: string, handler: Handler) {
        this.handlers.set(type, (this.handlers.get(type) ?? []).filter((h) => h !== handler))
    }

    disconnect() {
        // console.trace('WS disconnect called, current matchId:', this.matchId)
        this.destroyed = true
        this.sessionId += 1
        this.clearReconnectTimer()
        this.matchId = null
        this.reconnectDelay = 1000
        this.socket?.close()
        this.socket = null
    }

    stop() {
        this.disconnect()
    }
}

export const wsClient = new WSClient()
