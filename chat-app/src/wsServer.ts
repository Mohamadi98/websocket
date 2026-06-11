import { Server } from "http";
import { WebSocketServer } from "ws";
import { getConnection, addConnection, removeConnection } from "./database/wsDatabase";
import { messageHandler } from "./utils/wsMessageHandler";

export function setupWebSocketServer(httpServer: Server) {
    const wss = new WebSocketServer({
        server: httpServer
    })

    wss.on('connection', (ws, request) => {
        const url = new URL(request.url ?? '', 'http://localhost')
        const userIdParam = url.searchParams.get('user_id')
        if(!userIdParam) {
            ws.close(1008, 'Missing required query params')
            return
        }

        const userId = Number(userIdParam)
        const connectionKey = `Key-${userIdParam}`
        
        addConnection(connectionKey, ws)

        ws.on('error', console.error)
        ws.on('message', (data) => {
            messageHandler(data.toString(), userId)
        })

        ws.on('close', () => {
            removeConnection(connectionKey, ws)
        })
    })
}