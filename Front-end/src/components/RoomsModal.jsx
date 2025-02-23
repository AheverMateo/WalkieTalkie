import { useState } from "react";
import socket from "../socket";
import { IoIosClose } from "react-icons/io";
import { toast } from "react-toastify";
const RoomsModal = ({ onClose, rooms }) => {
  const [newRoom, setNewRoom] = useState("");

  const handleNewRoom = () => {
    if (!newRoom.trim()) return;
    
    if (rooms.includes(newRoom)) {
      toast.error("Esta sala ya existe");
      return;
    }
    socket.emit("createRoom", newRoom);
    setNewRoom("");
    toast.success(`Sala ${newRoom} ha sido creada`);
  };


  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 animate-fadeIn">
      <div className="bg-white pb-6 rounded-lg shadow-lg w-[470px]">
        <div className="flex justify-end">
        <IoIosClose size={30} onClick={onClose} className="cursor-pointer"/>
        </div>
        <div className="flex gap-2 justify-center">
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
      </div>
    </div>
  );
};

export default RoomsModal;
