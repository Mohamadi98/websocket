const https = require("https")
const fs = require("fs")
const websocketServer = require("websocket").server
let connection

const PORT = process.argv[2] || 7443
const gameId = "game" + PORT
const gameState = {}
gameState[gameId] = {
    "items": [{
        "item": "tv",
        "url": "tv.png",
        "hp": 100,
        "user": ""
    },
    {
        "item": "chair",
        "url": "chair.png",
        "hp": 100,
        "user": ""
    },
    {
        "item": "table",
        "url": "table.png",
        "hp": 100,
        "user": ""
    }
    ],
    players: []
}

//store the websocket connection for each client
const users = { "user1": "connection obj" }

const httpsServer = https.createServer({
    key: fs.readFileSync(keys / server.key),
    cert: fs.readFileSync('keys/server.cert')
},
    (req, res) => {
        if (req.url == '/') {
            res.writeHead(200)
            const index = fs.readFileSync('game-system/index.html')
            res.write(index.replace("thegameid", gameId))
            res.end()
        }
        if (req.url == '/reset') {
            gameState[gameId].players = []
            gameState[gameId].items.forEach(item => {
                item.hp = 100
                item.user = ""
            })
            Object.keys(users).forEach(user => {
                users[user] = null
            })
            res.writeHead(302, { location: '/' })
            res.end()
        }
        if (req.url == '/chair.png' || req.url == '/tv.png' || req.url == '/table.png') {
            res.writeHead(200);
            res.write(fs.readFileSync(__dirname + req.url));
            res.end();
        }

        if (req.url.includes("/items")) {
            res.setHeader("Content-Type", "application/json")
            res.writeHead(200);

            res.write(JSON.stringify(gameState[gameId]))
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
        const msgObj = JSON.parse(message.utf8Data)
        //{"cmd": "join","game": gameId, "user": color}
        if(msgObj.cmd == "join") {
            //this user is in use, already joined
            if(users[msgObj.user]) {
                connection.send(JSON.stringify({
                    "cmd": "join",
                    "status": `fail ${msgObj.user} already joined`,
                    "game": msgObj.game,
                    "user": msgObj.user
                }))
                return
            }
            //store user connection
            users[msgObj.user] = connection
            //update game players state
            gameState[gameId].players.push(msgObj.user)
            //broadcast to other players that a new player joined the game
            gameState[gameId].players.foreach(player => {
                users[player].send(JSON.stringify({
                    "cmd": "join",
                    "status": "ok",
                    "game": msgObj.game,
                    "user": msgObj.user
                }))
            })
        }
        if(msgObj.cmd == "hit") {
            const gameItem = gameState[gameId].items.filter(i => i.item === msgObj.item)
            gameItem.hp -= 10
            if(gameItem.hp <= 0) {
                gameItem.hp = 0
                gameItem.user = msgObj.user
            }
            gameState[gameId].players.foreach(p => {
                users[p].send(JSON.stringify({
                    "cmd": "hit",
                    "game": msgObj.game,
                    "user": msgObj.user,
                    "item": msgObj.item,
                    "hp": gameItem.hp
                }))
            })
            connection.send(JSON.stringify({"cmd": "hit", "status": "ok", "game": msgObj.game}))
        }
    })
})

httpsServer.listen(PORT, () => {
    console.log(`Secured server running on port: ${PORT}`)
})