import WebSocket from "ws"

const wsMap = new Map<string, WebSocket>()

export function addConnection(key: string, value: WebSocket): void {
    wsMap.set(key, value)
    console.log('New key added to websockets map!')
    wsMap.forEach((_value, key) => {
        console.log(`key: ${key}`)
    })
}

export function getConnection(key: string): WebSocket | undefined {
    return wsMap.get(key)
}

export function hasConnection(key: string): boolean {
    return wsMap.has(key)
}

export function removeConnection(key: string): void {
    wsMap.delete(key)
    console.log(`Removed key: ${key}`)
}