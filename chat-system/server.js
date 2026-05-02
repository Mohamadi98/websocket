const https = require("https")
const fs = require("fs")
const websocketServer = require("websocket").server
const PORT = process.argv[2] || 7443
let connection

const room1 = "room1_" + PORT
const room2 = "room2_" + PORT
const room3 = "room3_" + PORT
const rooms = [room1, room2, room3]

const chatters = {}
chatters[room1] = []
chatters[room2] = []
chatters[room3] = []
const users = { "user1": "con obj" }

const httpsServer = https.createServer({
    key: fs.readFileSync('keys/server.key'),
    cert: fs.readFileSync('keys/server.crt')
},
    (req, res) => {
        if (req.url == "/") {
            res.writeHead(200)
            res.write(fs.readFileSync('chat-system/index.html'))
            res.end()
        }
        if (req.url =='/rooms' ) {
        res.setHeader("Content-Type", "application/json")
        res.writeHead(200);

        res.write(JSON.stringify(rooms))
        res.end();
    }
    }
)

const websocket = new websocketServer({
    "httpServer": httpsServer
})

websocket.on("request", (request) => {
    connection = request.accept(null, request.origin)
    connection.on("message", (message) => {
        //the message is sent from the client in the format of a json object
        //{"cmd": "chat", "room": room, "user": user, "message": msg}
        const msgObj = JSON.parse(message.utf8Data)
        if(msgObj.cmd === "join") {
            users[msgObj.user] = connection
            chatters[msgObj.room].push(msgObj.user)
            connection.send(JSON.stringify({"cmd": "join", "status": "OK"}))
        }
        if(msgObj.cmd === "chat") {
            //broadcast the received message to all room participants
            chatters[msgObj.room].forEach(user => {
                users[user].send(JSON.stringify({"cmd": "chat", "room": msgObj.room, "user": user, "message": msgObj.message}))
            })
            connection.send(JSON.stringify({"cmd": "chat", "status": "OK"}))
        }
    })
})

httpsServer.listen(PORT, () => {
    console.log(`Server running secured on ${PORT}`)
})