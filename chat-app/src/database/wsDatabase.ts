import WebSocket from "ws"

const wsMap = new Map<string, WebSocket>()

export function addConnection(key: string, value: WebSocket): void {
    wsMap.set(key, value)
}

export function getConnection(key: string): WebSocket | undefined {
    return wsMap.get(key)
}

export function hasConnection(key: string): boolean {
    return wsMap.has(key)
}