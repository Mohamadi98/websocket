export interface clientWsMessage {
    type: string,
    recipient_id: Number,
    message: string,
    client_msg_id: string
}

export interface serverWsMessageChat {
    type: string,
    sender_id: Number,
    recipient_id: Number,
    message: string,
    message_id: Number,
    client_msg_id: string
}

export enum MessageType {
    MESSAGE_CHAT = 'message_chat',
    MESSAGE_SEEN = 'message_seen',
    MESSAGE_DELIVERED = 'message_delivered',
    MESSAGE_ACK = 'message_ack',
    MESSAGE_DELIVERED_ACK = 'message_delivered_ack'
}