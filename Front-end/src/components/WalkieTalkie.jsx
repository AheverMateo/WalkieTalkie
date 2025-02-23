import { useState, useEffect, useRef } from "react";
import socket from "../socket";
import { IoSettingsOutline } from "react-icons/io5";
import { IoIosAdd } from "react-icons/io";
import { SlOptionsVertical } from "react-icons/sl";
import { FaEdit } from "react-icons/fa";
import { FaMicrophone } from "react-icons/fa";
import { MdOutlineDeleteForever } from "react-icons/md";
import SettingModal from "./SettingModal";
import RoomsModal from "./RoomsModal";
import useSoundStore from "../zustand/useSoundStore";
import { toast, ToastContainer } from "react-toastify";

const WalkieTalkie = () => {
  const [username, setUsername] = useState(""); //input para traer el usuario
  const [user, setUser] = useState(null); //toda la info del usuario creado en la bdd
  const [rooms, setRooms] = useState([]); //rooms que vienen de socket io
  const [selectedRoom, setSelectedRoom] = useState(""); //room seleccionado
  const [usersInRoom, setUsersInRoom] = useState([]); //usuarios conectados al room
  const [currentAudio, setCurrentAudio] = useState(null); //se envia el audio
  const [recordingUser, setRecordingUser] = useState(null);
  const [audioHistory, setAudioHistory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalRoom, setIsModalRoom] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [newRoomName, setNewRoomName] = useState("");

  const { playSound } = useSoundStore();

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const handleUserValidated = (data) => {
      if (data.success) {
        setUser(data.user);
      }
    };

    const handleRoomsList = (rooms) => {
      setRooms(rooms);
      if (selectedRoom && !rooms.includes(selectedRoom)) {
        socket.emit("leaveRoom", selectedRoom, user.name);
        setSelectedRoom("");
        setAudioHistory([]);
        setUsersInRoom([]);
        setRecordingUser(null);
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
        setIsAudioPlaying(false);
      }
    };

    const handleUsersInRoom = (users) => {
      setUsersInRoom(users);
    };

    const handleAudioHistory = (audios) => {
      const updatedHistory = audios.map((audioInfo) => ({
        blob: new Blob([audioInfo.audioData], { type: "audio/wav" }),
        userName: audioInfo.userName,
        timestamp: audioInfo.timestamp,
      }));
      setAudioHistory(updatedHistory);
    };

    const handleReceiveAudio = ({ audioData, userName, timestamp }) => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      const audioBlob = new Blob([audioData], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      setAudioHistory((prev) => [
        ...prev,
        { blob: audioBlob, userName, timestamp },
      ]);

      setRecordingUser(userName);
      setIsAudioPlaying(true);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setRecordingUser(null);
        setIsAudioPlaying(false);
      };

      audio.play().catch((error) => {
        console.error("Error reproduciendo el audio:", error);
        setIsAudioPlaying(false);
      });

      setCurrentAudio(audio);
    };

    const handleRoomNameChanged = ({ oldName, newName }) => {
      if (selectedRoom === oldName) {
        setSelectedRoom(newName);
      }
    };

    socket.on("editRoomResult", (result) => {
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message)
      }
    });

    socket.on("roomNameChanged", handleRoomNameChanged);
    socket.on("userValidated", handleUserValidated);
    socket.on("roomsList", handleRoomsList);
    socket.on("usersInRoom", handleUsersInRoom);
    socket.on("audioHistory", handleAudioHistory);
    socket.on("receiveAudio", handleReceiveAudio);
    return () => {
      socket.off("userValidated", handleUserValidated);
      socket.off("roomsList", handleRoomsList);
      socket.off("usersInRoom", handleUsersInRoom);
      socket.off("audioHistory", handleAudioHistory);
      socket.off("receiveAudio", handleReceiveAudio);
      socket.off("roomNameChanged", handleRoomNameChanged);
      socket.off("editRoomResult");
    };
  }, [currentAudio, selectedRoom, user]);

  const handleSubmit = () => {
    socket.emit("userValidate", username);
  };

  const handleJoinRoom = (room) => {
    if (selectedRoom && selectedRoom !== room) {
      socket.emit("leaveRoom", selectedRoom, user.name);
    }
    setAudioHistory([]);
    setSelectedRoom(room);
    playSound("enter");
    socket.emit("joinRoom", room, user.name);
    socket.emit("getAudioHistory", room);
  };

  useEffect(() => {
    const initializeMediaRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/wav",
          });
          const reader = new FileReader();
          reader.onload = () => {
            const arrayBuffer = reader.result;
            socket.emit("sendAudio", selectedRoom, arrayBuffer, user.name);
          };
          reader.readAsArrayBuffer(audioBlob);
          audioChunksRef.current = [];
        };
      } catch (error) {
        console.error("Error al acceder al micrófono:", error);
      }
    };

    if (selectedRoom) {
      initializeMediaRecorder();
    }

    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, [selectedRoom]);

  const startRecording = (userName) => {
    if (isAudioPlaying) {
      toast.info("Alguien ya está hablando. Espera tu turno.");
      return;
    }

    playSound("recording");
    if (mediaRecorderRef.current && selectedRoom) {
      setRecordingUser(userName);
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && selectedRoom) {
      mediaRecorderRef.current.stop();
      setRecordingUser(null);
    }
  };

  const handleDeleteRoom = (rooms) => {
    socket.emit("deleteRoom", rooms);
    toast.warn(`El ${rooms} ha sida eliminado`);
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setNewRoomName(room);
    setActiveMenu(null);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (newRoomName.trim() && newRoomName !== editingRoom) {
      socket.emit("editRoom", editingRoom, newRoomName.trim());
    }
    setEditingRoom(null);
  };

  return (
    <div>
      {!user ? (
        <div className="mb-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Escribe tu nombre de usuario"
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
          />
          <button
            onClick={handleSubmit}
            className="w-full mt-2 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Validar Usuario
          </button>
        </div>
      ) : (
        <div className="flex justify-evenly h-screen">
          <div className="h-10 mt-8 px-2 py-1 border border-zinc-200 rounded-md">
            <IoSettingsOutline
              onClick={() => setIsModalOpen(true)}
              size={30}
              className="cursor-pointer"
            />
            {isModalOpen && (
              <SettingModal onClose={() => setIsModalOpen(false)} />
            )}
          </div>
          <div className="flex flex-col gap-8 mt-24 w-80 h-max px-8 py-5 border border-zinc-200 rounded-md">
            <div className="flex justify-between">
              <h1 className="font-bold text-2xl text-[#001323]">Canales</h1>
              {user.isAdmin && (
                <IoIosAdd
                  onClick={() => setIsModalRoom(true)}
                  size={38}
                  color="#001323"
                  className="pt-1 cursor-pointer"
                />
              )}
              {isModalRoom && (
                <RoomsModal
                  onClose={() => setIsModalRoom(false)}
                  rooms={rooms}
                />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              {rooms.map((room, index) => (
                <div key={index} className="relative group">
                  {editingRoom === room ? (
                    <form onSubmit={handleSaveEdit} className="flex w-full">
                      <input
                        type="text"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        autoFocus
                        className="w-full text-[#001323] font-bold py-2 px-4 rounded-md bg-white border border-blue-500"
                        onBlur={handleSaveEdit}
                      />
                    </form>
                  ) : (
                    <button
                      onClick={() => handleJoinRoom(room)}
                      className={`w-full text-[#001323] font-bold py-2 px-4 text-left rounded-md flex justify-between items-center ${
                        selectedRoom === room
                          ? "bg-blue-500 text-white"
                          : "bg-white hover:bg-blue-300"
                      } transition-colors`}
                    >
                      <span># {room}</span>
                      {user.isAdmin && (
                        <div
                          className="relative cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(activeMenu === index ? null : index);
                          }}
                        >
                          <SlOptionsVertical />
                          {activeMenu === index && (
                            <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                              <div
                                className="px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer flex gap-2 items-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditRoom(room);
                                }}
                              >
                                <FaEdit />
                                Editar
                              </div>
                              <div
                                className="px-4 py-2 text-red-600 hover:bg-gray-100 cursor-pointer flex gap-2 items-center"
                                onClick={() => handleDeleteRoom(room)}
                              >
                                <MdOutlineDeleteForever size={20} />
                                Eliminar
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-evenly mt-24 w-[600px] h-96 flex-col border border-zinc-200 rounded-md px-4 py-2 no-select">
            <h1 className="font-bold text-2xl text-center text-blue-950">
              Canal: {selectedRoom}
            </h1>
            <div className="h-70 flex flex-col justify-between">
              <h3 className="font-semibold">Historial de Comunicacion</h3>

              {audioHistory.length > 0 && (
                <div className="mt-2 overflow-auto">
                  <ul className="space-y-2">
                    {audioHistory.map((audio, index) => {
                      const audioUrl = URL.createObjectURL(audio.blob);
                      const fecha = new Date(audio.timestamp).toLocaleString();

                      return (
                        <li
                          key={index}
                          className="flex flex-col bg-gray-100 rounded-lg p-3 shadow-sm"
                        >
                          <div className="flex justify-between items-center text-sm text-gray-700">
                            <span className="font-semibold">
                              {audio.userName}
                            </span>
                            <span className="text-gray-500">{fecha}</span>
                          </div>

                          <div className="flex justify-between items-center mt-2">
                            <audio
                              controls
                              src={audioUrl}
                              className="w-full"
                              onEnded={() => {
                                URL.revokeObjectURL(audioUrl);
                              }}
                            />
                            <span className="text-xs text-gray-500 ml-2">
                              {audio.duration ? `0:${audio.duration}` : ""}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {usersInRoom.map(
                (u, index) =>
                  u.userName === username && (
                    <div
                      key={index}
                      className={`flex justify-center items-center py-3 w-full px-3 mt-10 rounded-md ${
                        recordingUser === u.userName
                          ? "bg-blue-900"
                          : "bg-blue-950"
                      } ${isAudioPlaying ? "opacity-50" : "cursor-pointer"}`}
                      onMouseDown={() => startRecording(u.userName)}
                      onMouseUp={stopRecording}
                      onTouchStart={(e) => {
                        e.preventDefault();
                          startRecording(u.userName);
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        stopRecording();
                      }}
                      disabled={isAudioPlaying}
                    >
                      <FaMicrophone
                        size={24}
                        className={`${
                          recordingUser === u.userName
                            ? "text-white"
                            : "text-gray-300"
                        }`}
                      />
                    </div>
                  )
              )}
            </div>
          </div>

          <div className="mt-24 w-64 px-4 py-3 h-96 border border-zinc-200 rounded-md">
            <h2 className="font-bold text-lg text-blue-950">
              Usuarios en la sala
            </h2>
            <ul className="mt-2 space-y-2">
              {usersInRoom.map((u, index) => (
                <li
                  key={index}
                  className={`p-2 border rounded-md border-zinc-200 ${
                    recordingUser === u.userName
                      ? "bg-blue-200"
                      : "bg-transparent"
                  }`}
                >
                  {u.userName} {recordingUser === u.userName && "🎤"}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalkieTalkie;
