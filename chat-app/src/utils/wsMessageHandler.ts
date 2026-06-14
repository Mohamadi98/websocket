import { wsJson } from "./interfaces";
import { getConnection } from "../database/wsDatabase";
import { storeMessage, updateLastSeen } from "../services/chatService";
import WebSocket from "ws";

export function messageHandler(data: string, sender_id: Number) {
    const stringData = data.toString()
    let jsonData: wsJson
    try {
        jsonData = JSON.parse(stringData)
    } catch (error) {
        console.log('Error parsing ws payload into json!')
        return
    }
    console.log(jsonData)

    if (jsonData.type === 'chat_message') {
        const recipientWebSocket = getConnection(`Key-${jsonData.recipient_id}`)
        const payload: wsJson = {
            type: jsonData.type,
            sender_id: sender_id,
            recipient_id: jsonData.recipient_id,
            message: jsonData.message
        }

        storeMessage(jsonData.message, sender_id, jsonData.recipient_id)
        if (recipientWebSocket) {
            recipientWebSocket?.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    console.log('we are sending')
                    ws.send(JSON.stringify(payload))
                }
            })
        } else {
            console.log('User offline storing message in DB')
        }
    } else if(jsonData.type === 'seen') {
        console.log(`updating last seen of user: ${sender_id} to messages of user: ${jsonData.recipient_id}`)
        updateLastSeen(sender_id, jsonData.recipient_id)
    }
}