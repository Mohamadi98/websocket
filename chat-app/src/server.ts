import express from 'express'
import { createServer } from 'http'
import bodyParser from 'body-parser'
import {connectDB} from './database/postgres'
import fs from 'fs'
import { loginHandler, profileInfoHandler, listUsers, getAllMessages, lastSeen, getUnread } from './controllers/appController'
import { setupWebSocketServer } from './wsServer'

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
    setupWebSocketServer(server)

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
    app.post('/messages/seen', lastSeen)
    app.get('/messages/unread', getUnread)

    server.listen(3000, () => {
        console.log('Server running on PORT: 3000')
    })
})()