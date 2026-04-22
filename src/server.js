const http = require("http")
const crypto = require("crypto");

/* ------The WebSockets Frame -----

0                   1                   2                   3
     0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
    +-+-+-+-+-------+-+-------------+-------------------------------+
    |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
    |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
    |N|V|V|V|       |S|             |   (if payload len==126/127)   |
    | |1|2|3|       |K|             |                               |
    +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
    |     Extended payload length continued, if payload len == 127  |
    + - - - - - - - - - - - - - - - +-------------------------------+
    |                               |Masking-key, if MASK set to 1  |
    +-------------------------------+-------------------------------+
    | Masking-key (continued)       |          Payload Data         |
    +-------------------------------- - - - - - - - - - - - - - - - +
    :                     Payload Data continued ...                :
    + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
    |                     Payload Data continued ...                |
    +---------------------------------------------------------------+

*/

const OPC = { CONT:0x0, TEXT:0x1, BIN:0x2, CLOSE:0x8, PING:0x9, PONG:0xA };

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function parseFrames(buffer) {
    let off = 0

    while(buffer.length - off >= 2) {
        const byte0 = buffer[off] //get first frame byte
        const byte1 = buffer[off + 1] //get second frame byte
        const finBit = (byte0 & 0x80) !== 0 //get fin bit value
        const opcode = (byte0 & 0x0f) //the opcode is the last 4 bits of this byte
        const maskBit = (byte1 & 0x80) !== 0 //get mask bit value
        const payloadLength = (byte1 & 0x7f) //the length is the last 7 bits

        let pos = off + 2

        if(payloadLength === 126) {
            if(buffer.length - pos < 2) break
            payloadLength = buffer.readUInt16BE(pos)
            pos += 2
        } else if(payloadLength === 127) {
            if(buffer.length - pos < 8) break
            //no built-in function to extract the full 64 bit
            //broke the full 64 bit into two 32 bit block (high, low)
            const high = buffer.readUInt32BE(pos)
            const low = buffer.readUInt32BE(pos + 4)
            pos += 8
            //eliminating payloads of size represented in more than 32 bits
            if(high !== 0) throw new Error('Payload size too big!')
        }
            
        let maskKey
        if(maskBit) {
            if(buffer.length - pos < 4) break
            maskKey = buffer.subarray(pos, pos + 4)
            pos += 4
        }
        
        if(buffer.length - pos < payloadLength) break
        let payload = buffer.subarray(pos, pos + payloadLength)

        if(maskBit) {
            const out = Buffer.allocUnsafe(payloadLength)
            for(let i = 0; i < payloadLength; i++) {
                out[i] = payload[i] ^ maskKey[i % 4]
            }
            payload = out
        }

        //constructing a full frame
        const frame = {
            "fin": finBit,
            "opcode": opcode,
            "payload": payload
        }
        //TODO: call the websocket frame processing function

        //moving to the last buffer bit, incase there are other frames to parse
        off = pos + payloadLength
    }
    return buffer.subarray(off)
}

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
    // If there were leftover bytes from the HTTP parser (head), prepend them
    let leftover = head && head.length ? Buffer.from(head) : Buffer.alloc(0);
    let textBuf = null;
})

server.listen(3000, "localhost", () => {
    console.log("Server running on PORT: 3000")
})