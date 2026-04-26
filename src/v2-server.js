const http = require("http")
const websocketServer = require("websocket").server
const PORT = 8080
let connection = null

const httpServer = http.createServer((req, res) => {
    res.writeHead(404)
    res.end("Only websocket protocol is allowed on this server!")
})

const websocket = new websocketServer({
    "httpServer": httpServer
})

httpServer.listen(PORT, () => console.log(`Server running on port: ${PORT}`))

websocket.on("request", (request) => {
    connection = request.accept(null, request.origin)
    connection.on("close", () => console.log("Connection Closed!"))
    connection.on("message", (message) => {
        console.log(`Recieved message => ${message.utf8Data}`)
        connection.send(`Server responded to your message with => ${message.utf8Data}`)
    })
})