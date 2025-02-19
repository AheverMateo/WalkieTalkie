import { create } from "zustand"

const soundFiles = {
  Default: "/audio/sonido_default.mp3",
  "Sonido 1": "/audio/sonido_1.mp3",
  "Sonido 2": "/audio/sonido_2.mp3",
  "Sonido 3": "/audio/sonido_3.mp3",
};

const useSoundStore = create((set) => ({
    selectedSounds: {
      enter: "Default",
      exit: "Default",
      recording: "Default",
      release: "Default",
    },
    setSoundPreference: (key, value) =>
      set((state) => ({
        selectedSounds: { ...state.selectedSounds, [key]: value },
      })),
    playSound: (key, tempSelectedSounds) => {
      const sound = tempSelectedSounds?.[key] || useSoundStore.getState().selectedSounds[key] || "Default";
      const audioFile = soundFiles[sound];
      if (audioFile) {
        const audio = new Audio(audioFile);
        audio.play();
      }
    },
  }));
  
  export default useSoundStore;


  // const soundFiles = {
  //   Default: "../../public/audio/sonido_default.mp3",
  //   "Sonido 1": "../../public/audio/sonido_1.mp3",
  //   "Sonido 2": "../../public/audio/sonido_2.mp3",
  //   "Sonido 3": "../../public/audio/sonido_3.mp3",
  // };