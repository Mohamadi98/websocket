import { getConnection } from "../database/wsDatabase";
import { storeMessage, updateLastSeen, getMessageByClientId } from "../services/chatService";
import WebSocket from "ws";
import { MessageType, clientWsMessage, serverWsMessageChat } from "./interfaces";

// store the sender id with the associated message id to avoid unneccesary DB hits
const messageMap = new Map<number, number>()

export function messageHandler(data: string, sender_id: Number) {
    const stringData = data.toString()
    const jsonData = JSON.parse(stringData)

    switch (jsonData.type) {
        case MessageType.MESSAGE_CHAT:
            sendMessage(jsonData, sender_id)
            break;

        case MessageType.MESSAGE_SEEN:
            seenMessage(jsonData, sender_id)
            break;

        case MessageType.MESSAGE_DELIVERED:
            deliveredMessage(jsonData)
            break;

        default:
            break;
    }
}

async function sendMessage(data: Record<string, any>, sender_id: Number) {
    const clientPayload: clientWsMessage = {
        type: data.type,
        recipient_id: data.recipient_id,
        message: data.message,
        client_msg_id: data.client_msg_id
    }
    const recipientWebSocket = getConnection(`Key-${clientPayload.recipient_id}`)
    const senderWebSocket = getConnection(`Key-${sender_id}`)

    const newRow = await storeMessage(clientPayload.message, sender_id, clientPayload.recipient_id, clientPayload.client_msg_id)
    let row = newRow.rows[0]
    if (!row) {
        const existingRow = await getMessageByClientId(clientPayload.client_msg_id)
        row = existingRow.rows[0]
    }
    messageMap.set(row.id, row.sender_id)

    const payload: serverWsMessageChat = {
        type: MessageType.MESSAGE_CHAT,
        sender_id: sender_id,
        recipient_id: clientPayload.recipient_id,
        message: clientPayload.message,
        message_id: row.id,
        client_msg_id: row.client_msg_id
    }
    const messageAckPayload = {
        type: MessageType.MESSAGE_ACK,
        client_msg_id: row.client_msg_id,
        server_msg_id: row.id
    }

    if (senderWebSocket) {
        senderWebSocket?.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                console.log('Sending a message ack!')
                ws.send(JSON.stringify(messageAckPayload))
            }
        })
    }
    if (recipientWebSocket) {
        recipientWebSocket?.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                console.log('Sending a chat message!')
                ws.send(JSON.stringify(payload))
            }
        })
    } else {
        console.log('User offline storing message in DB')
    }
}

function seenMessage(data: Record<string, any>, sender_id: Number) {
    console.log(`updating last seen of user: ${sender_id} to messages of user: ${data.recipient_id}`)
    updateLastSeen(sender_id, data.recipient_id)
}

async function deliveredMessage(data: Record<string, any>) {
    const sender_id = messageMap.get(data.message_id)

    if (sender_id !== undefined) {
        const senderWebSocket = getConnection(`Key-${sender_id}`)
        const deliveredMsgAckPayload = {
            type: MessageType.MESSAGE_DELIVERED_ACK,
            server_msg_id: data.message_id
        }

        if (senderWebSocket) {
            senderWebSocket.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    console.log('sending a delivery ack to the message sender!')
                    ws.send(JSON.stringify(deliveredMsgAckPayload))
                }
            })
        }
        messageMap.delete(data.message_id)
    }

}