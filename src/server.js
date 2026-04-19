const http = require("http")
const crypto = require("crypto")

const OPC = { CONT:0x0, TEXT:0x1, BIN:0x2, CLOSE:0x8, PING:0x9, PONG:0xA };

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

const server = http.createServer((req, res) => {
    res.writeHead(404)
    res.end("Only websocket protocol can be used on this server!")
})

//Note: the 'server' variable is a listener however 'socket' variable is the actual TCP connection
server.on("upgrade", (req, socket, head) => {
    const upgrade = (req.headers.upgrade).toLowerCase()
    const connection = (req.headers.connection).toLowerCase()
    const key = req.headers["sec-websocket-key"]
    const version = req.headers["sec-websocket-version"]

    const OK = 
        upgrade === "websocket" &&
        connection.includes("upgrade") &&
        key &&
        version === '13'
    if(!OK) {
        //raw TCP socket
        socket.write("HTTP/1.1 400 Bad Request\r\n")
        socket.destroy()
        return
    }

    const acceptKey = crypto.createHash('sha1')
        .update(key + WS_GUID)
        .digest('base64')
    const responseHeaders = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${acceptKey}`,
        '\r\n'
    ]
    socket.write(responseHeaders.join('\r\n'))
    socket.setNoDelay(true)
})

server.listen(3000, "localhost", () => {
    console.log("Server running on PORT: 3000")
})