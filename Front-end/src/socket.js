import { io } from "socket.io-client";

const socket = io("https://walkietalkie-40bm.onrender.com", { secure: true });
console.log(socket);

export default socket;

//https://walkietalkie-40bm.onrender.com
//https://localhost:3000