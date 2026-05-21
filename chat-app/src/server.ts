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
    wss.on('connection', (websocket, request) => {
        const url = new URL(request.url as string, 'http://localhost')
        const user_id = url.searchParams.get('user_id') as string
        const user_type = url.searchParams.get('user_type') as string
        console.log(user_id, user_type)
        if(user_id === null || user_type === null) {
            websocket.close(1008, 'Missing required query parameter!')
            return
        }
        const mapKey = user_id.concat(user_type)
        const userId = parseInt(user_id)
        
        //TODO: store the user ws connection in an in-memory data strucutre

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