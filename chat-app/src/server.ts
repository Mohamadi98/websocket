import express from 'express'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import bodyParser from 'body-parser'
import {connectDB} from './database/postgres'
import fs from 'fs'
import { loginHandler, profileInfoHandler, listUsers, getAllMessages } from './controllers/appController'
import { storeMessage } from './services/chatService'
import { addConnection, removeConnection, getConnection } from './database/wsDatabase'
import { wsJson } from './utils/interfaces'

(async ()=> {
    await connectDB()
    const app = express()
    const requestLogger: express.RequestHandler = (req, _res, next)=> {
        console.log(
            req.method, req.path, " Body - ", req.body, " Params - ", req.params
        )
        next()
    }
    app.use(bodyParser.json())
    app.use(requestLogger)
    const server = createServer(app)

    const wss = new WebSocketServer({
        server: server
    })
    wss.on('connection', (websocket, request) => {
        const url = new URL(request.url ?? '', 'http://localhost')
        const userIdParam = url.searchParams.get('user_id')
        // const userType = url.searchParams.get('user_type')
        if(!userIdParam) {
            websocket.close(1008, 'Missing required query parameters!')
        }

        const userId = Number(userIdParam)
        const connectionKey = `key${userIdParam}`
        addConnection(connectionKey, websocket)

        websocket.on('error', console.error)
        websocket.on('message', (data) => {
            const stringData = data.toString()
            const jsonData: wsJson = JSON.parse(stringData)

            //received payload format {"message": "hello", "type": "chat_message", "recipient_id": 2}
            const recipientWebsocket = getConnection(`key${jsonData.recipient_id}`)
            const payload: wsJson = {
                type: jsonData.type,
                sender_id: userId,
                recipient_id: jsonData.recipient_id,
                message: jsonData.message
            }
            storeMessage(payload.message, userId, payload.recipient_id)
            recipientWebsocket?.send(JSON.stringify(payload))
        })
        websocket.on('close', () => {
            removeConnection(connectionKey)
        })
    })

    app.get('/healthz', (_req, res) => {
        res.send({'Status': 'OK'})
    })
    app.get('/home', (_req, res) => {
        res.write(fs.readFileSync('frontend/login.html'))
        res.end()
    })
    app.post('/login', loginHandler)
    app.get('/profile', (_req, res) => {
        res.write(fs.readFileSync('frontend/profile.html'))
        res.end()
    })
    app.get('/profile/me', profileInfoHandler)
    app.get('/users', (_req, res) => {
        res.write(fs.readFileSync('frontend/users.html'))
        res.end()
    })
    app.get('/listusers', listUsers)
    app.get('/messages', getAllMessages)

    server.listen(3000, () => {
        console.log('Server running on PORT: 3000')
    })
})()