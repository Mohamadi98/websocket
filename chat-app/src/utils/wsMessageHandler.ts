import { wsJson } from "./interfaces";
import { getConnection } from "../database/wsDatabase";
import { storeMessage } from "../services/chatService";

export function messageHandler(data: string, sender_id: Number) {
    const stringData = data.toString()
    let jsonData: wsJson
    try {
        jsonData = JSON.parse(stringData)
    } catch (error) {
        console.log('Error parsing ws payload into json!')
        return
    }

    const recipientWebSocket = getConnection(`Key-${jsonData.recipient_id}`)
    const payload: wsJson = {
        type: jsonData.type,
        sender_id: sender_id,
        recipient_id: jsonData.recipient_id,
        message: jsonData.message
    }

    storeMessage(jsonData.message, sender_id, jsonData.recipient_id)
    if(recipientWebSocket && recipientWebSocket.readyState === recipientWebSocket.OPEN) {
        recipientWebSocket.send(JSON.stringify(payload))
    }
}