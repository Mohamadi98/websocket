import express from 'express'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import bodyParser from 'body-parser'
import {connectDB} from './database/postgres'
import fs from 'fs'
import { loginHandler, profileInfoHandler } from './controllers/appController'

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
    wss.on('connection', (websocket) => {
        websocket.on('error', console.error)
        websocket.on('message', (data) => {
            console.log(`websocket server received this from client: ${data}`)
            websocket.send(`reply to this message: ${data}`)
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

    server.listen(3000, () => {
        console.log('Server running on PORT: 3000')
    })
})()