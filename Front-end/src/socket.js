import { io } from "socket.io-client";

const socket = io("https://localhost:3000", { secure: true });
console.log(socket);

export default socket;