const User = require("../models/User");


const usersInRooms = {};
const audioHistory = {};
const rooms = ['Room1', 'Room2', 'Room3']

const socketController = (io) => {

    io.on('connection', (socket) => {
      console.log('Nuevo usuario conectado');
      socket.emit('roomsList', rooms);

      socket.on("createRoom", (newRoom) => {
        if (!rooms.includes(newRoom)) {
          rooms.push(newRoom);
          io.emit("roomsList", rooms); 
        }
      });

      socket.on("userValidate", async (userName) => {
        try {
          const user = await User.findOne({ where: { name: userName } });
          if (user) {
            socket.emit("userValidated", { success: true, user });
          }
        } catch (error) {
          console.error("Error al validar usuario:", error);
          socket.emit("userValidated", { success: false, message: "Error en el servidor" });
        }
      });
  
      socket.on('joinRoom', (room, userName) => {
        socket.join(room);
        console.log(`Usuario ${userName} se unió a la room: ${room}`);

        if (!usersInRooms[room]) {
          usersInRooms[room] = [];
        }

        if (!usersInRooms[room].some(user => user.userName === userName)) {
          usersInRooms[room].push({ userName, socketId: socket.id });
        }

        io.to(room).emit('usersInRoom', usersInRooms[room]);
  
        socket.emit('message', `Bienvenido a la room: ${room}`);
      });
  
      socket.on('leaveRoom', (room, userName) => {
        socket.leave(room);
        console.log(`Usuario ${userName} salió de la room: ${room}`);
  
        // Eliminar al usuario de la lista de la room
        if (usersInRooms[room]) {
          usersInRooms[room] = usersInRooms[room].filter(user => user.userName !== userName);
          
          // Enviar la lista actualizada de usuarios a los demás miembros de la room
          io.to(room).emit('usersInRoom', usersInRooms[room]);
        }
      });
  
      socket.on("sendAudio", (room, audioData, userName) => {
        const audioInfo = {
          audioData, // El audio en formato ArrayBuffer o Blob
          userName, // Nombre del usuario que envió el audio
          timestamp: new Date().toISOString(), // Fecha y hora en formato ISO
        };
      
        // Guardar el audio en el historial del room
        if (!audioHistory[room]) {
          audioHistory[room] = [];
        }
        audioHistory[room].push(audioInfo);
      
        // Emitir el audio a todos los usuarios en la sala
        io.to(room).emit("receiveAudio", audioInfo);
      });
      
      // Permitir que un usuario recupere los audios de un room cuando entra
      socket.on("getAudioHistory", (room) => {
        if (audioHistory[room]) {
          socket.emit("audioHistory", audioHistory[room]);
        }
      });
  
      socket.on('disconnect', () => {
        console.log(`Usuario desconectado`);
        for (let room in usersInRooms) {
          usersInRooms[room] = usersInRooms[room].filter(user => user.socketId !== socket.id);
          io.to(room).emit('usersInRoom', usersInRooms[room]);
          if (usersInRooms[room].length === 0) {
            delete audioHistory[room];
          }
        }
      });
    });
  };
  
  module.exports = socketController;