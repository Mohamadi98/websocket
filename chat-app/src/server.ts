import express from 'express'

(async ()=> {
    const app = express()
    const requestLogger: express.RequestHandler = (req, _res, next)=> {
        console.log(
            req.method, req.path, " Body - ", req.body, " Params - ", req.params
        )
        next()
    }
    app.use(requestLogger)
    app.get('/healthz', (_req, res) => {
        res.send({'Status': 'OK'})
    })

    app.listen(3000, () => {
        console.log('Server running on PORT: 3000')
    })
})()