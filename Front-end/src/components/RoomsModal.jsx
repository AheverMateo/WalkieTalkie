import { useState } from "react";
import socket from "../socket";

const RoomsModal = ({ onClose }) => {
  const [newRoom, setNewRoom] = useState("");
  const [deleteRoom, setDeleteRoom] = useState("")

  console.log(newRoom);

  const handleNewRoom = () => {
    if (!newRoom.trim()) return;
    socket.emit("createRoom", newRoom);
    setNewRoom("");
  };

  const handleDeleteRoom = () => {
    if (!deleteRoom.trim()) return;
    socket.emit("deleteRoom", deleteRoom);
    setNewRoom("");
  };


  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 animate-fadeIn">
      <div className="bg-white p-4 rounded-lg shadow-lg w-[470px]">
        <h1 className="font-bold mb-5 ">Configuracion de Canales</h1>
        <div className="mb-4 flex justify-around gap-2">
          <input
            type="text"
            placeholder="Nuevo canal..."
            className="border p-2 rounded-sm"
            value={newRoom}
            onChange={(e) => setNewRoom(e.target.value)}
          />
          <button
            onClick={handleNewRoom}
            className="bg-blue-900 text-xs text-white px-3 py-2 rounded-sm cursor-pointer hover:bg-blue-800"
          >
            Crear un canal
          </button>
        </div>

        <div className="mb-4 flex justify-around gap-2">
          <input
            type="text"
            placeholder="Editar"
            className="border p-2 rounded-sm"
          />
          <button  className="bg-blue-900 text-xs text-white px-3 py-2 rounded-sm cursor-pointer hover:bg-blue-800">
            Editar un Canal
          </button>
        </div>

        <div className="mb-4 flex justify-around gap-2">
          <input
            type="text"
            placeholder="Eliminar"
            className="border p-2 rounded-sm"
            value={deleteRoom}
            onChange={(e)=> setDeleteRoom(e.target.value)}
          />
          <button onClick={handleDeleteRoom} className="bg-blue-900 text-xs text-white px-4 py-2 rounded-sm cursor-pointer hover:bg-blue-800">
            Eliminar Canal
          </button>
        </div>
        <button
          onClick={onClose}
          className="bg-blue-950 text-white px-3 py-2 rounded-sm w-full cursor-pointer"
        >
          Cerrar modal
        </button>
      </div>
    </div>
  );
};

export default RoomsModal;
