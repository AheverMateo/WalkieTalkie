import { create } from "zustand"

const soundFiles = {
  Default: "../../audio/sonido default.mp3",
  "Sonido 1": "../../audio/sonido 1.mp3",
  "Sonido 2": "../../audio/sonido 2.mp3",
  "Sonido 3": "../../audio/sonido 3.mp3",
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