import { postgresClient } from "../database/postgres";

export async function storeMessage(message: string, sender_id: Number, recipient_id: Number) {
    await postgresClient.query(
        'INSERT INTO messages(sender_id, recipient_id, message) VALUES($1, $2, $3)', [sender_id, recipient_id, message])
}

export async function getMessages(sender_id: Number, recipient_id: Number) {
    const dbRes = await postgresClient.query(
        'SELECT * FROM messages WHERE (sender_id = $1 AND recipient_id = $2) OR (sender_id = $3 AND recipient_id = $4) ORDER BY created_at', [sender_id, recipient_id, recipient_id, sender_id])
    
    return dbRes.rows
}

export async function updateLastSeen(user_id: Number, other_user_id: Number) {
    await postgresClient.query(
        'INSERT INTO last_seen(user_id, other_user_id, seen_at) VALUES($1, $2, NOW())', [user_id, other_user_id])
}

export async function unreadMessages(user_id: Number) {
    const dbRes = await postgresClient.query(
        `SELECT m.sender_id, count(m.id) FROM messages m
        LEFT JOIN last_seen ls ON ls.user_id = $1 and ls.other_user_id = m.sender_id 
        WHERE m.recipient_id = $2 AND (ls.seen_at is null OR m.created_at > ls.seen_at) 
        GROUP BY m.sender_id;`, [user_id, user_id]
    )
    
    return dbRes.rows
}