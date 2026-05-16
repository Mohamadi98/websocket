import express from 'express'
import bodyParser from 'body-parser'
import {connectDB} from './database/postgres'
import fs from 'fs'
import { loginHandler } from './controllers/appController'

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
    //TODO: add /me endpoint to fetch user profile

    app.listen(3000, () => {
        console.log('Server running on PORT: 3000')
    })
})()