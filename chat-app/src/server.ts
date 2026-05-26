import express from 'express'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import bodyParser from 'body-parser'
import {connectDB} from './database/postgres'
import fs from 'fs'
import { loginHandler, profileInfoHandler, listUsers } from './controllers/appController'
import { addConnection, removeConnection } from './database/wsDatabase'

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
        const userType = url.searchParams.get('user_type')
        if(!userIdParam || !userType) {
            websocket.close(1008, 'Missing required query parameters!')
        }

        const userId = Number(userIdParam)
        const connectionKey = `${userType}${userId}`
        addConnection(connectionKey, websocket)

        websocket.on('error', console.error)
        websocket.on('message', (data) => {
            console.log(`websocket server received this from client: ${data}`)
            websocket.send(`reply to this message: ${data}`)
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

    server.listen(3000, () => {
        console.log('Server running on PORT: 3000')
    })
})()