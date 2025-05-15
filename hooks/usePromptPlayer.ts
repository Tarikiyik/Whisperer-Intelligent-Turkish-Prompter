// app/hooks/usePromptPlayer.ts

import { useRef, useEffect } from "react";

export function usePromptPlayer() {
  // Initialize the Audio object on client-side only
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
    }
  }, []);

  /**
   * Fetches and plays the TTS audio for the given segment index.
   * @param idx The segment index to prompt.
   */
  const playPrompt = async (idx: number, retryCount = 0) => {
    // Skip if on the server or Audio isn't initialized
    if (!audioRef.current) return;
    
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
      
      // Retry logic - attempt up to 3 retries
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 500; // 500ms, 1s, 2s
        console.log(`Retrying TTS request in ${delay}ms (attempt ${retryCount + 1}/3)`);
        
        setTimeout(() => {
          playPrompt(idx, retryCount + 1);
        }, delay);
      }
    }
  };

  // Immediately stops any playing prompt audio.
  const stopPrompt = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  return { playPrompt, stopPrompt };
}