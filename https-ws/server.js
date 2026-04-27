//Secured websocket server 
const https = require("https")
const fs = require("fs")
const websocketServer = require("websocket").server
const PORT = 8443
let connection = null

const httpsServer = https.createServer({
    key: fs.readFileSync('keys/server.key'),
    cert: fs.readFileSync('keys/server.crt'),
    },
    (req, res) => {
        res.writeHead(404),
        res.end("Only websocket protocol is allowed on this server!")
    }
)

const websocket = new websocketServer({
    "httpServer": httpsServer
})

httpsServer.listen(PORT, () => {
    console.log(`Secured server running on PORT: ${PORT}`)
})

websocket.on("request", (request) => {
    connection = request.accept(null, request.origin)
    connection.on("close", () => console.log("Connection Closed!"))
    connection.on("message", (message) => {
        console.log(`Recieved message => ${message.utf8Data}`)
        connection.send(`Server responded to your message with => ${message.utf8Data}`)
    })
})