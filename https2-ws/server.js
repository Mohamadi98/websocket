//websocket server using http/2
const http2 = require("http2")
const fs = require("fs")
const {
    HTTP2_HEADER_METHOD,
    HTTP2_HEADER_PROTOCOL,
    HTTP2_HEADER_STATUS
} = http2.constants

const OPC = { CONT: 0x0, TEXT: 0x1, BIN: 0x2, CLOSE: 0x8, PING: 0x9, PONG: 0xA };

function buildFrame({ opcode, payload = Buffer.alloc(0), fin = true }) {
    const first = (fin ? 0x80 : 0x00) | (opcode & 0x0f);
    const len = payload.length;
    if (len < 126) {
        return Buffer.concat([Buffer.from([first, len]), payload]);
    } else if (len <= 0xffff) {
        const h = Buffer.alloc(4);
        h[0] = first; h[1] = 126; h.writeUInt16BE(len, 2);
        return Buffer.concat([h, payload]);
    } else {
        const h = Buffer.alloc(10);
        h[0] = first; h[1] = 127; h.writeUInt32BE(0, 2); h.writeUInt32BE(len, 6);
        return Buffer.concat([h, payload]);
    }
}

function parseFrames(buffer, onFrame) {
    let off = 0

    while (buffer.length - off >= 2) {
        const byte0 = buffer[off] //get first frame byte
        const byte1 = buffer[off + 1] //get second frame byte
        const finBit = (byte0 & 0x80) !== 0 //get fin bit value
        const opcode = (byte0 & 0x0f) //the opcode is the last 4 bits of this byte
        const maskBit = (byte1 & 0x80) !== 0 //get mask bit value
        const payloadLength = (byte1 & 0x7f) //the length is the last 7 bits

        let pos = off + 2

        if (payloadLength === 126) {
            if (buffer.length - pos < 2) break
            payloadLength = buffer.readUInt16BE(pos)
            pos += 2
        } else if (payloadLength === 127) {
            if (buffer.length - pos < 8) break
            //no built-in function to extract the full 64 bit
            //broke the full 64 bit into two 32 bit block (high, low)
            const high = buffer.readUInt32BE(pos)
            const low = buffer.readUInt32BE(pos + 4)
            pos += 8
            //eliminating payloads of size represented in more than 32 bits
            if (high !== 0) throw new Error('Payload size too big!')
        }

        let maskKey
        if (maskBit) {
            if (buffer.length - pos < 4) break
            maskKey = buffer.subarray(pos, pos + 4)
            pos += 4
        }

        if (buffer.length - pos < payloadLength) break
        let payload = buffer.subarray(pos, pos + payloadLength)

        if (maskBit) {
            const out = Buffer.allocUnsafe(payloadLength)
            for (let i = 0; i < payloadLength; i++) {
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
        onFrame(frame)

        //moving to the last buffer bit, incase there are other frames to parse
        off = pos + payloadLength
    }
    return buffer.subarray(off)
}

const http2Server = http2.createSecureServer({
    key: fs.readFileSync('keys/server.key'),
    cert: fs.readFileSync('keys/server.crt'),
    allowHTTP1: false,
    settings: { enableConnectProtocol: true }
})

http2Server.on('stream', (stream, headers) => {
    const method = headers[HTTP2_HEADER_METHOD]
    const protocol = headers[HTTP2_HEADER_PROTOCOL]

    if (method === "CONNECT" && protocol === "websocket") {
        stream.respond({ [HTTP2_HEADER_STATUS]: 200 })

        // If there were leftover bytes from the HTTP parser (head), prepend them
        let leftover = Buffer.alloc(0);
        let textBuf = null;

        //declare send function
        const send = (opcode, payload) => stream.write(buildFrame({ "opcode": opcode, "payload": payload }))

        stream.on('data', (chunk) => {
            leftover = Buffer.concat([leftover, chunk]);
            try {
                leftover = parseFrames(leftover, ({ fin, opcode, payload }) => {
                    switch (opcode) {
                        case OPC.TEXT: {
                            textBuf = textBuf ? Buffer.concat([textBuf, payload]) : payload;
                            if (fin) {
                                const msg = `From Server ${PORT} to client stream id ${stream.id} msg: ${textBuf.toString('utf8')}`
                                console.log(`[client TEXT] ${msg} `);      // 👈 plain text from client
                                send(OPC.TEXT, Buffer.from(msg, 'utf8')); // echo back
                                textBuf = null;
                            }
                            break;
                        }
                        case OPC.CONT: {
                            if (!textBuf) textBuf = Buffer.alloc(0);
                            textBuf = Buffer.concat([textBuf, payload]);
                            if (fin) {
                                const msg = textBuf.toString('utf8');
                                console.log(`[client TEXT] ${msg}`);      // 👈 plain text from client
                                send(OPC.TEXT, Buffer.from(msg, 'utf8'));
                                textBuf = null;
                            }
                            break;
                        }
                        case OPC.BIN:
                            console.log(`[client BIN] ${payload.length} bytes`);
                            send(OPC.BIN, payload); // optional echo
                            break;
                        case OPC.PING:
                            send(OPC.PONG, payload);
                            break;
                        case OPC.CLOSE:
                            stream.write(buildFrame({ opcode: OPC.CLOSE, payload }));
                            stream.close();
                            break;
                        default:
                            // ignore reserved/unknown
                            break;
                    }
                });
            } catch (e) {
                const code = Buffer.from([0x03, 0xEA]); // 1002
                const reason = Buffer.from('protocol error');
                stream.write(buildFrame({ opcode: OPC.CLOSE, payload: Buffer.concat([code, reason]) }));
                stream.close();
            }
        });
    } else {
        stream.respond({ [HTTP2_HEADER_STATUS]: 404 });
        stream.end('Not Found');
    }
})

const PORT = 7443
http2Server.listen(PORT, () => {
    console.log(`http/2 server running on port: ${PORT}`)
})