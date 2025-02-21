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

    socket.on("userStartedRecording", (room, userName) => {
      socket.to(room).emit("userStartedRecording", userName);
    });

    socket.on("userStoppedRecording", (room) => {
      socket.to(room).emit("userStoppedRecording");
    });
    
    socket.on("deleteRoom", (roomToDelete) => {
      if (!rooms.includes(roomToDelete)) return;

      const roomsDelete = rooms.filter((room) => room !== roomToDelete);

      delete usersInRooms[roomToDelete];

      delete audioHistory[roomToDelete];

      io.emit("roomsList", roomsDelete);
      
      console.log(`Room eliminada: ${roomToDelete}`);
    });

    socket.on("userValidate", async (userName) => {
      try {
        const user = await User.findOne({ where: { name: userName } });
        if (user) {
          socket.emit("userValidated", { success: true, user });
        }
      } catch (error) {
        console.error("Error al validar usuario:", error);
        socket.emit("userValidated", {
          success: false,
          message: "Error en el servidor",
        });
      }
    });

    socket.on("joinRoom", (room, userName) => {
      socket.join(room);
      console.log(`Usuario ${userName} se unió a la room: ${room}`);

      if (!usersInRooms[room]) {
        usersInRooms[room] = [];
      }

      if (!usersInRooms[room].some((user) => user.userName === userName)) {
        usersInRooms[room].push({ userName, socketId: socket.id });
      }

      io.to(room).emit("usersInRoom", usersInRooms[room]);
      socket.emit("message", `Bienvenido a la room: ${room}`);
    });

    socket.on("leaveRoom", (room, userName) => {
      socket.leave(room);
      console.log(`Usuario ${userName} salió de la room: ${room}`);

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

    // Permitir que un usuario recupere los audios de un room cuando entra
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
