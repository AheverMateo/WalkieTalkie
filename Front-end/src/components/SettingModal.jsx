import { useState } from "react";
import { FiBell } from "react-icons/fi";
import useSoundStore from "../zustand/useSoundStore";
import socket from "../socket";

const SettingModal = ({ onClose, user }) => {
  const { selectedSounds, setSoundPreference, playSound } = useSoundStore();
  const [tempSelectedSounds, setTempSelectedSounds] = useState(selectedSounds);
  const [newRoom, setNewRoom] = useState("");
  const { isAdmin } = user;

  const optionSound = ["Default", "Sonido 1", "Sonido 2", "Sonido 3"];

  const soundCategories = [
    {
      title: "Sonido de usuario unido",
      key: "enter",
      label: "sonido que se reproduce cuando un usuario se une al canal",
    },
    {
      title: "Sonido de usuario desconectado",
      key: "exit",
      label: "sonido que se reproduce cuando un usuario deja el canal",
    },
    {
      title: "Sonido de inicio de transmisión",
      key: "recording",
      label: "sonido que se reproduce cuando un usuario comienza a transmitir",
    },
    {
      title: "Sonido de fin de transmisión",
      key: "release",
      label: "sonido que se reproduce cuando alguien deja de transmitir",
    },
  ];

  const handleSelectChange = (key, value) => {
    setTempSelectedSounds((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    Object.entries(tempSelectedSounds).forEach(([key, value]) => {
      setSoundPreference(key, value);
    });

    if (newRoom.trim()) {
      socket.emit("createRoom", newRoom);
      setNewRoom(""); 
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 animate-fadeIn">
      <div className="bg-white p-4 rounded-lg shadow-lg w-[420px]">
        <h2 className="text-xl font-bold mb-2">Configuración de sonidos</h2>

        <div className="space-y-2">
          {soundCategories.map((category) => (
            <div key={category.key}>
              <p className="font-medium text-sm text-gray-700">
                {category.title}
              </p>
              <div className="flex flex-col gap-2 p-2 items-start">
                <div className="flex w-full gap-4">
                  <select
                    className="w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) =>
                      handleSelectChange(category.key, e.target.value)
                    }
                    value={tempSelectedSounds[category.key]}
                  >
                    {optionSound.map((sound) => (
                      <option key={sound} value={sound}>
                        {sound}
                      </option>
                    ))}
                  </select>
                  <button
                    className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition"
                    onClick={() => playSound(category.key, tempSelectedSounds)}
                  >
                    <FiBell size={22} />
                  </button>
                </div>
                <p className="text-xs text-zinc-400">{category.label}</p>
              </div>
            </div>
          ))}
        </div>

        {isAdmin && (
          <div className="flex flex-col mt-4">
            <h3 className="font-bold text-lg mb-2">Crear un canal:</h3>
              <input
                type="text"
                className="py-1 px-2 border rounded-md flex-grow"
                placeholder="Nombre del canal"
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
              />
          </div>
        )}

        <div className="flex justify-end mt-6 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Guardar preferencias
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingModal;
