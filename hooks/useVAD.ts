// hooks/useVAD.ts
import { useEffect } from 'react';
import { useAppVAD } from '@/contexts/VADContext';

/**
 * Starts/stops the shared VAD when `started` toggles
 * and exposes isSpeaking, silenceType, and lastEvent.
 */
export default function useVAD(started: boolean) {
  const {
    isSpeaking,
    silenceType,
    lastEvent,
    start: startVAD,
    stop: stopVAD,
  } = useAppVAD();

  useEffect(() => {
    if (started) {
      startVAD().catch((e) => console.error('[useVAD] start error:', e));
    } else {
      stopVAD();
    }
    return () => stopVAD();
  }, [started, startVAD, stopVAD]);

  return { isSpeaking, silenceType, lastEvent };
}