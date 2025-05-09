// app/hooks/usePromptPlayer.ts

import { useRef } from "react";

export function usePromptPlayer() {
  const audioRef = useRef<HTMLAudioElement>(new Audio());

  /**
   * Fetches and plays the TTS audio for the given segment index.
   * @param idx The segment index to prompt.
   */
  const playPrompt = async (idx: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/tts?seg=${idx}`);
      if (!res.ok) {
        throw new Error(`TTS fetch failed: ${res.status} ${res.statusText}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // Stop any currently playing prompt
      audioRef.current.pause();
      audioRef.current.src = url;

      // Play the new prompt
      await audioRef.current.play();
    } catch (error) {
      console.error("TTS error:", error);
    }
  };

  /**
   * Immediately stops any playing prompt audio.
   */
  const stopPrompt = () => {
    audioRef.current.pause();
  };

  return { playPrompt, stopPrompt };
}