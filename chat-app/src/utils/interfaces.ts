export interface wsJson {
    type: string,
    sender_id?: Number,
    recipient_id: Number,
    message: string
}

export interface messageDTO {
    id?: Number,
    sender_id: Number,
    recipient_id: Number,
    message: string,
    created_at: string | null
}