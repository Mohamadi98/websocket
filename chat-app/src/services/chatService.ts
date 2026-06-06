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
        `select m.sender_id, count(m.id) from messages m
        left join last_seen ls on ls.main_participant_id = $1 and ls.participant_id = m.sender_id 
        where m.recipient_id = $2 and (ls.seen_at is null or m.created_at > ls.seen_at) 
        group by m.sender_id;`, [user_id, user_id]
    )
    
    return dbRes.rows
}