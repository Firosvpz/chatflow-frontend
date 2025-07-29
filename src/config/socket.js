import { io } from "socket.io-client"

const SOCKET_URL = "http://localhost:3000"
let socket

export const initSocket = (userId) => {

    if (socket) {
        socket.disconnect()
    }

    socket = io(SOCKET_URL, {
        transports: ["websocket"],
        upgrade: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        auth: {
            token: localStorage.getItem("authToken")
        }
    });

    /// Connection events
    socket.on("connect", () => {
        console.log("Connected to server:", socket.id);
        if (userId) {
            socket.emit("join", userId, (response) => {
                console.log("Join response:", response);
            });
        }
    });

    socket.on("connect_error", (err) => {
        console.error("Connection error:", err.message);
    });


    socket.on("disconnect", (reason) => {
        console.log("Disconnected from server. Reason:", reason);
    });

    return socket
}

export const getSocket = () => {
    if (!socket) {
        throw new Error("Socket not initialized. Call initSocket() first.")
    }
    return socket
}

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect()
        socket = null
    }
}
