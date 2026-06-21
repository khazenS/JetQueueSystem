const { Server } = require("socket.io");
let io;

const initializeSocket = (server) => {
    while(!io){
        io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            },
            // Accept polling as well so clients can fall back when the WebSocket
            // upgrade is blocked by the reverse proxy.
            transports: ["websocket", "polling"]
        });        
    }
};

const getIO = () => {
    return io;
};

module.exports = { initializeSocket, getIO };
