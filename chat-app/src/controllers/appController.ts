import express from 'express'
import { postgresClient } from '../database/postgres'
import { getMessages, updateLastSeen, unreadMessages } from '../services/chatService'

export const loginHandler: express.RequestHandler = async(req, res) => {
    const {username, password} = req.body
    
    const dbRes = await postgresClient.query('SELECT id FROM users WHERE name = $1 AND password = $2', [username, password])
    if(dbRes.rows.length === 0) {
        res.sendStatus(404)
        return 
    }

    res.status(200).send({
        'user_id': dbRes.rows[0].id
    }) 
}

export const profileInfoHandler: express.RequestHandler = async(req, res) => {
    const userId = Number(req.query.user_id as string)

    const dbRes = await postgresClient.query(
        'SELECT id, name, role, age FROM users WHERE id = $1', [userId]
    )
    if(dbRes.rowCount === 0) {
        res.sendStatus(404)
        return
    }

    res.status(200).send({
        'user': dbRes.rows[0]
    })
}

export const listUsers: express.RequestHandler = async(req, res) => {
    const user_id = Number(req.query.user_id)
    const dbRes = await postgresClient.query('SELECT id, name FROM users WHERE id != $1', [user_id])

    res.status(200).send(dbRes.rows)
}

export const getAllMessages: express.RequestHandler = async(req, res) => {
    const user1 = Number(req.query.user1)
    const user2 = Number(req.query.user2)
    if(!user1 || !user2) {
        res.status(400)
        return
    }

    const allMessages = await getMessages(user1, user2)
    res.status(200).send(allMessages)
}

export const lastSeen: express.RequestHandler = async(req, res) => {
    const {user_id, other_user_id} = req.body
    await updateLastSeen(user_id, other_user_id)

    res.status(201).send('Last seen updated')
}

export const getUnread: express.RequestHandler = async(req, res) => {
    const user_id = Number(req.query.user_id)
    const unreadMsgs = await unreadMessages(user_id)

    res.status(200).send(unreadMsgs)
}