import express from 'express'
import { postgresClient } from '../database/postgres'

export const loginHandler: express.RequestHandler = async(req, res) => {
    const {username, password, role} = req.body
    let dbTable = 'coaches'
    if(role !== 'coach') dbTable = 'clients'
    
    const dbRes = await postgresClient.query(`SELECT id FROM ${dbTable} WHERE name = $1 AND password = $2`, [username, password])
    if(dbRes.rows.length === 0) {
        res.sendStatus(404)
        return 
    }
    res.status(200).send({
        'user_id': dbRes.rows[0],
        'user_type': role 
    }) 
}

export const profileInfoHandler: express.RequestHandler = async(req, res) => {
    const userId = parseInt(req.query.user_id as string)
    const userType = req.query.user_type
    let dbTable = 'coaches'
    if(userType === 'client') dbTable = 'clients'

    const dbRes = await postgresClient.query(
        `SELECT * FROM ${dbTable} WHERE id = $1`, [userId]
    )
    if(dbRes.rowCount === 0) {
        res.sendStatus(404)
        return
    }
    console.log(dbRes.rows[0])
    res.status(200).send({
        'user': dbRes.rows[0]
    })
}