import express from 'express'
import { postgresClient } from '../database/postgres'

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