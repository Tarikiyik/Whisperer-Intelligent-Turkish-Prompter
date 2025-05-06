// hooks/useVAD.ts
import { useEffect } from 'react';
import { useAppVAD } from '@/contexts/VADContext';

/**
 *   - starts/stops the shared VAD when `started` toggles
 *   - relays VAD events to the backend (sendVAD)
 *   - exposes the same triad used by the UI
 */
export default function useVAD(
  started: boolean,
  sendVAD: (status: 'speech_start' | 'silence_start', dur?: 'short' | 'long') => void
) {
  const {
    isSpeaking,
    silenceType,
    lastEvent,
    start: startVAD,
    stop: stopVAD,
  } = useAppVAD();

  /* ─── start / stop lifecycle ─────────────────────────── */
  useEffect(() => {
    if (started) {
      console.log('[useVAD] starting VAD (prompter active)');
      startVAD().catch((e) => console.error('[useVAD] start error:', e));
    } else {
      console.log('[useVAD] stopping VAD (prompter inactive)');
      stopVAD();
    }
    // stop VAD when component unmounts for any reason
    return () => {
      console.log('[useVAD] cleanup → stop VAD');
      stopVAD();
    };
  }, [started, startVAD, stopVAD]);

  /* forward events to backend ------------------------------------------------ */
  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent === 'speech_start'){
    }          
    else if (lastEvent === 'silence_short'){
      sendVAD('silence_start', 'short');
    } 
    else if (lastEvent === 'silence_long'){
      sendVAD('silence_start', 'long');
    } 
  }, [lastEvent, sendVAD]);

   /* ─── expose state back to the caller ────────────────── */
  return { isSpeaking, silenceType, lastEvent };
}