import WebSocket from "ws"

const wsMap = new Map<string, Set<WebSocket>>()

export function addConnection(key: string, value: WebSocket): void {
    if(!wsMap.has(key)) {
        wsMap.set(key, new Set<WebSocket>())
    }
    wsMap.get(key)?.add(value)

    console.log(`New user added: ${key}`)
    wsMap.forEach((_value, key) => {
        console.log(`key: ${key}`)
    })
}

export function getConnection(key: string): Set<WebSocket> | undefined {
    return wsMap.get(key)
}

export function hasConnection(key: string): boolean {
    return wsMap.has(key)
}

export function removeConnection(key: string, target: WebSocket): void {
    const set = wsMap.get(key)
    if(!set) {
        return
    }

    set.delete(target)
    if(set.size === 0) {
        wsMap.delete(key)
    }
}