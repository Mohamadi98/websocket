import { postgresClient } from "../database/postgres";

export async function storeMessage(message: string, sender_id: Number, recipient_id: Number) {
    await postgresClient.query(
        'INSERT INTO messages(sender_id, recipient_id, message) VALUES($1, $2, $3)', [sender_id, recipient_id, message])
}

export async function getMessages(sender_id: Number, recipient_id: Number) {
    const dbRes = await postgresClient.query(
        'SELECT * FROM messages WHERE (sender_id = $1 AND recipient_id = $2) OR (sender_id = $3 AND recipient_id = $4)', [sender_id, recipient_id, recipient_id, sender_id])
    
    return dbRes.rows
}