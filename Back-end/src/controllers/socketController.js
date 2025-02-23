const User = require("../models/User");

const usersInRooms = {};
const audioHistory = {};
const rooms = ["Room1", "Room2", "Room3"];

const socketController = (io) => {
  io.on("connection", (socket) => {
    console.log("Nuevo usuario conectado");
    socket.emit("roomsList", rooms);

    socket.on("createRoom", (newRoom) => {
      if (!rooms.includes(newRoom)) {
        rooms.push(newRoom);
        io.emit("roomsList", rooms);
      }
    });

    socket.on("editRoom", (oldRoomName, newRoomName) => {
      if (!rooms.includes(oldRoomName) || rooms.includes(newRoomName)) {
        socket.emit("editRoomResult", {
          success: false,
          message: "La sala no existe o el nuevo nombre ya está en uso"
        });
        return;
      }

      const index = rooms.indexOf(oldRoomName);
      if (index > -1) {
        rooms[index] = newRoomName;

        if (usersInRooms[oldRoomName]) {
          usersInRooms[newRoomName] = usersInRooms[oldRoomName];
          delete usersInRooms[oldRoomName];
        }

        if (audioHistory[oldRoomName]) {
          audioHistory[newRoomName] = audioHistory[oldRoomName];
          delete audioHistory[oldRoomName];
        }

        io.emit("roomsList", rooms);

        io.to(oldRoomName).emit("roomNameChanged", {
          oldName: oldRoomName,
          newName: newRoomName
        });

        const socketsInRoom = io.sockets.adapter.rooms.get(oldRoomName);
        if (socketsInRoom) {
          socketsInRoom.forEach(socketId => {
            const clientSocket = io.sockets.sockets.get(socketId);
            if (clientSocket) {
              clientSocket.leave(oldRoomName);
              clientSocket.join(newRoomName);
            }
          });
        }
        socket.emit("editRoomResult", {
          success: true,
          message: "Sala renombrada"
        });
      }
    });
    
    socket.on("deleteRoom", (roomToDelete) => {
      if (!rooms.includes(roomToDelete)) return;

      const index = rooms.indexOf(roomToDelete);
      if (index > -1) {
        rooms.splice(index, 1);
      }

      delete usersInRooms[roomToDelete];
      delete audioHistory[roomToDelete];

      io.emit("roomsList", rooms);
    });

    socket.on("userValidate", async (userName) => {
      try {
        const user = await User.findOne({ where: { name: userName } });
        if (user) {
          socket.emit("userValidated", { success: true, user });
        }
      } catch (error) {
        console.error("Error al validar usuario:", error);
      }
    });

    socket.on("joinRoom", (room, userName) => {
      socket.join(room);

      if (!usersInRooms[room]) {
        usersInRooms[room] = [];
      }

      if (!usersInRooms[room].some((user) => user.userName === userName)) {
        usersInRooms[room].push({ userName, socketId: socket.id });
      }

      io.to(room).emit("usersInRoom", usersInRooms[room]);
    });

    socket.on("leaveRoom", (room, userName) => {
      socket.leave(room);

      if (usersInRooms[room]) {
        usersInRooms[room] = usersInRooms[room].filter(
          (user) => user.userName !== userName
        );

        io.to(room).emit("usersInRoom", usersInRooms[room]);
      }
    });

    socket.on("sendAudio", (room, audioData, userName) => {
      const audioInfo = {
        audioData,
        userName, 
        timestamp: new Date().toISOString(), 
      };

      if (!audioHistory[room]) {
        audioHistory[room] = [];
      }
      audioHistory[room].push(audioInfo);

      socket.to(room).emit("receiveAudio", audioInfo);

      io.to(room).emit("audioHistory", audioHistory[room]);
    });

    socket.on("getAudioHistory", (room) => {
      if (audioHistory[room]) {
        socket.emit("audioHistory", audioHistory[room]);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Usuario desconectado`);
      for (let room in usersInRooms) {
        usersInRooms[room] = usersInRooms[room].filter(
          (user) => user.socketId !== socket.id
        );
        io.to(room).emit("usersInRoom", usersInRooms[room]);
        if (usersInRooms[room].length === 0) {
          delete audioHistory[room];
        }
      }
    });
  });
};

module.exports = socketController;
